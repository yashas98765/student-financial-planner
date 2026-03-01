const express = require('express');
const { query } = require('express-validator');
const { PDFDocument, rgb } = require('pdf-lib');
const ExcelJS = require('exceljs');
const moment = require('moment');
const Expense = require('../models/Expense');
const Goal = require('../models/Goal');
const User = require('../models/User');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Common validation for report queries
const reportValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  
  query('type')
    .optional()
    .isIn(['expenses', 'goals', 'complete'])
    .withMessage('Report type must be expenses, goals, or complete'),
  
  query('format')
    .optional()
    .isIn(['pdf', 'excel'])
    .withMessage('Format must be pdf or excel'),
    
  query('period')
    .optional()
    .isIn(['week', 'month', 'quarter', 'year', 'custom'])
    .withMessage('Period must be week, month, quarter, year, or custom')
];

// Helper function to calculate date range
const getDateRange = (period) => {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1); // Default to 1 month
  }

  return { startDate, endDate };
};

// Helper function to generate PDF report
const generatePDFReport = async (user, expenses, goals, dateRange) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const { width, height } = page.getSize();
  
  let yPosition = height - 50;
  const fontSize = 12;
  const titleFontSize = 18;
  const subtitleFontSize = 14;

  // Title
  page.drawText('Student Financial Planner Report', {
    x: 50,
    y: yPosition,
    size: titleFontSize,
    color: rgb(0.1, 0.1, 0.8)
  });
  yPosition -= 40;

  // User Info
  page.drawText(`Name: ${user.fullName}`, {
    x: 50,
    y: yPosition,
    size: fontSize
  });
  yPosition -= 20;

  page.drawText(`Email: ${user.email}`, {
    x: 50,
    y: yPosition,
    size: fontSize
  });
  yPosition -= 20;

  page.drawText(`University: ${user.university}`, {
    x: 50,
    y: yPosition,
    size: fontSize
  });
  yPosition -= 20;

  page.drawText(`Report Period: ${moment(dateRange.startDate).format('MMM DD, YYYY')} - ${moment(dateRange.endDate).format('MMM DD, YYYY')}`, {
    x: 50,
    y: yPosition,
    size: fontSize
  });
  yPosition -= 40;

  // Expenses Section
  if (expenses && expenses.length > 0) {
    page.drawText('Expense Summary', {
      x: 50,
      y: yPosition,
      size: subtitleFontSize,
      color: rgb(0.2, 0.2, 0.6)
    });
    yPosition -= 25;

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    page.drawText(`Total Expenses: ₹${totalExpenses.toFixed(2)}`, {
      x: 50,
      y: yPosition,
      size: fontSize
    });
    yPosition -= 20;

    page.drawText(`Number of Transactions: ${expenses.length}`, {
      x: 50,
      y: yPosition,
      size: fontSize
    });
    yPosition -= 30;

    // Category breakdown
    const categoryTotals = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});

    page.drawText('Expenses by Category:', {
      x: 50,
      y: yPosition,
      size: fontSize,
      color: rgb(0.3, 0.3, 0.3)
    });
    yPosition -= 20;

    Object.entries(categoryTotals).forEach(([category, amount]) => {
      page.drawText(`• ${category}: ₹${amount.toFixed(2)}`, {
        x: 70,
        y: yPosition,
        size: 10
      });
      yPosition -= 15;
    });
    yPosition -= 20;
  }

  // Goals Section
  if (goals && goals.length > 0) {
    page.drawText('Goals Summary', {
      x: 50,
      y: yPosition,
      size: subtitleFontSize,
      color: rgb(0.2, 0.2, 0.6)
    });
    yPosition -= 25;

    const activeGoals = goals.filter(g => g.status === 'Active');
    const completedGoals = goals.filter(g => g.status === 'Completed');

    page.drawText(`Active Goals: ${activeGoals.length}`, {
      x: 50,
      y: yPosition,
      size: fontSize
    });
    yPosition -= 20;

    page.drawText(`Completed Goals: ${completedGoals.length}`, {
      x: 50,
      y: yPosition,
      size: fontSize
    });
    yPosition -= 20;

    const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalSavedAmount = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);

    page.drawText(`Total Target Amount: ₹${totalTargetAmount.toFixed(2)}`, {
      x: 50,
      y: yPosition,
      size: fontSize
    });
    yPosition -= 20;

    page.drawText(`Total Saved Amount: ₹${totalSavedAmount.toFixed(2)}`, {
      x: 50,
      y: yPosition,
      size: fontSize
    });
    yPosition -= 30;

    // Goal details
    activeGoals.slice(0, 5).forEach(goal => {
      if (yPosition < 100) return; // Avoid overflow
      
      page.drawText(`• ${goal.title}: ${goal.progressPercentage.toFixed(1)}% complete`, {
        x: 70,
        y: yPosition,
        size: 10
      });
      yPosition -= 15;
    });
  }

  // Footer
  page.drawText(`Generated on ${moment().format('MMMM DD, YYYY')}`, {
    x: 50,
    y: 50,
    size: 10,
    color: rgb(0.5, 0.5, 0.5)
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};

// Helper function to generate Excel report
const generateExcelReport = async (user, expenses, goals, dateRange) => {
  const workbook = new ExcelJS.Workbook();
  
  // Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary');
  
  // Header
  summarySheet.addRow(['Student Financial Planner Report']);
  summarySheet.getRow(1).font = { size: 16, bold: true };
  summarySheet.addRow([]);
  
  // User Info
  summarySheet.addRow(['User Information']);
  summarySheet.getRow(3).font = { bold: true };
  summarySheet.addRow(['Name', user.fullName]);
  summarySheet.addRow(['Email', user.email]);
  summarySheet.addRow(['University', user.university]);
  summarySheet.addRow(['Report Period', `${moment(dateRange.startDate).format('MMM DD, YYYY')} - ${moment(dateRange.endDate).format('MMM DD, YYYY')}`]);
  summarySheet.addRow([]);

  // Expenses Summary
  if (expenses && expenses.length > 0) {
    summarySheet.addRow(['Expense Summary']);
    summarySheet.getRow(summarySheet.rowCount).font = { bold: true };
    
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    summarySheet.addRow(['Total Expenses', `$${totalExpenses.toFixed(2)}`]);
    summarySheet.addRow(['Number of Transactions', expenses.length]);
    summarySheet.addRow([]);
    
    // Category breakdown
    const categoryTotals = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});
    
    summarySheet.addRow(['Expenses by Category']);
    summarySheet.getRow(summarySheet.rowCount).font = { bold: true };
    Object.entries(categoryTotals).forEach(([category, amount]) => {
      summarySheet.addRow([category, `$${amount.toFixed(2)}`]);
    });
    summarySheet.addRow([]);
  }

  // Goals Summary
  if (goals && goals.length > 0) {
    summarySheet.addRow(['Goals Summary']);
    summarySheet.getRow(summarySheet.rowCount).font = { bold: true };
    
    const activeGoals = goals.filter(g => g.status === 'Active');
    const completedGoals = goals.filter(g => g.status === 'Completed');
    
    summarySheet.addRow(['Active Goals', activeGoals.length]);
    summarySheet.addRow(['Completed Goals', completedGoals.length]);
    
    const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalSavedAmount = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    
    summarySheet.addRow(['Total Target Amount', `$${totalTargetAmount.toFixed(2)}`]);
    summarySheet.addRow(['Total Saved Amount', `$${totalSavedAmount.toFixed(2)}`]);
  }

  // Expenses Detail Sheet
  if (expenses && expenses.length > 0) {
    const expensesSheet = workbook.addWorksheet('Expenses');
    
    // Headers
    expensesSheet.addRow([
      'Date', 'Title', 'Category', 'Amount', 'Payment Method', 
      'Description', 'Location', 'Essential'
    ]);
    expensesSheet.getRow(1).font = { bold: true };
    
    // Data
    expenses.forEach(expense => {
      expensesSheet.addRow([
        moment(expense.date).format('MM/DD/YYYY'),
        expense.title,
        expense.category,
        expense.amount,
        expense.paymentMethod,
        expense.description || '',
        expense.location || '',
        expense.isEssential ? 'Yes' : 'No'
      ]);
    });
    
    // Auto-fit columns
    expensesSheet.columns.forEach(column => {
      column.width = 15;
    });
  }

  // Goals Detail Sheet
  if (goals && goals.length > 0) {
    const goalsSheet = workbook.addWorksheet('Goals');
    
    // Headers
    goalsSheet.addRow([
      'Title', 'Type', 'Category', 'Target Amount', 'Current Amount', 
      'Progress %', 'Target Date', 'Status', 'Priority'
    ]);
    goalsSheet.getRow(1).font = { bold: true };
    
    // Data
    goals.forEach(goal => {
      goalsSheet.addRow([
        goal.title,
        goal.type,
        goal.category,
        goal.targetAmount,
        goal.currentAmount,
        goal.progressPercentage.toFixed(1),
        moment(goal.targetDate).format('MM/DD/YYYY'),
        goal.status,
        goal.priority
      ]);
    });
    
    // Auto-fit columns
    goalsSheet.columns.forEach(column => {
      column.width = 15;
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

// @route   GET /api/reports/generate
// @desc    Generate and download financial report
// @access  Private
router.get('/generate', auth, reportValidation, validate, async (req, res) => {
  try {
    console.log('[REPORTS] Generate report request received');
    console.log('[REPORTS] Query params:', req.query);
    console.log('[REPORTS] User:', req.user.email);
    const { 
      startDate: queryStartDate, 
      endDate: queryEndDate, 
      type = 'complete', 
      format = 'pdf',
      period 
    } = req.query;

    // Determine date range
    let dateRange;
    if (queryStartDate && queryEndDate) {
      dateRange = {
        startDate: new Date(queryStartDate),
        endDate: new Date(queryEndDate)
      };
    } else if (period) {
      dateRange = getDateRange(period);
    } else {
      dateRange = getDateRange('month'); // Default to last month
    }

    // Get user information
    const user = await User.findById(req.user.id);

    let expenses = null;
    let goals = null;

    // Fetch data based on report type
    if (type === 'expenses' || type === 'complete') {
      expenses = await Expense.find({
        user: req.user._id,
        date: {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate
        }
      }).sort({ date: -1 });
    }

    if (type === 'goals' || type === 'complete') {
      goals = await Goal.find({
        user: req.user._id
      }).sort({ createdAt: -1 });
    }

    // Generate report based on format
    let reportBuffer;
    let contentType;
    let fileName;

    if (format === 'pdf') {
      reportBuffer = await generatePDFReport(user, expenses, goals, dateRange);
      contentType = 'application/pdf';
      fileName = `financial-report-${moment().format('YYYY-MM-DD')}.pdf`;
    } else {
      reportBuffer = await generateExcelReport(user, expenses, goals, dateRange);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileName = `financial-report-${moment().format('YYYY-MM-DD')}.xlsx`;
    }

    // Set response headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', reportBuffer.length);

    // Send the report
    res.send(reportBuffer);
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      message: 'Error generating report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/reports/preview
// @desc    Get report data for preview (JSON format)
// @access  Private
router.get('/preview', auth, reportValidation, validate, async (req, res) => {
  try {
    const { 
      startDate: queryStartDate, 
      endDate: queryEndDate, 
      type = 'complete',
      period 
    } = req.query;

    // Determine date range
    let dateRange;
    if (queryStartDate && queryEndDate) {
      dateRange = {
        startDate: new Date(queryStartDate),
        endDate: new Date(queryEndDate)
      };
    } else if (period) {
      dateRange = getDateRange(period);
    } else {
      dateRange = getDateRange('month'); // Default to last month
    }

    // Get user information
    const user = await User.findById(req.user._id);

    const reportData = {
      user: {
        fullName: user.fullName,
        email: user.email,
        university: user.university,
        course: user.course
      },
      dateRange,
      expenses: null,
      goals: null,
      summary: {}
    };

    // Fetch expenses data
    if (type === 'expenses' || type === 'complete') {
      const expenses = await Expense.find({
        user: req.user._id,
        date: {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate
        }
      }).sort({ date: -1 });

      reportData.expenses = expenses;

      // Calculate expense summary
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const categoryTotals = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      }, {});

      reportData.summary.expenses = {
        total: totalExpenses,
        count: expenses.length,
        average: expenses.length > 0 ? totalExpenses / expenses.length : 0,
        byCategory: categoryTotals
      };
    }

    // Fetch goals data
    if (type === 'goals' || type === 'complete') {
      const goals = await Goal.find({
        user: req.user._id
      }).sort({ createdAt: -1 });

      reportData.goals = goals;

      // Calculate goals summary
      const activeGoals = goals.filter(g => g.status === 'Active');
      const completedGoals = goals.filter(g => g.status === 'Completed');
      const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
      const totalSavedAmount = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);

      reportData.summary.goals = {
        total: goals.length,
        active: activeGoals.length,
        completed: completedGoals.length,
        totalTargetAmount,
        totalSavedAmount,
        averageProgress: goals.length > 0 
          ? goals.reduce((sum, g) => sum + g.progressPercentage, 0) / goals.length 
          : 0
      };
    }

    res.json(reportData);
  } catch (error) {
    console.error('Preview report error:', error);
    res.status(500).json({
      message: 'Error generating report preview',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/reports/analytics
// @desc    Get advanced analytics data
// @access  Private
router.get('/analytics', auth, [
  query('period')
    .optional()
    .isIn(['week', 'month', 'quarter', 'year'])
    .withMessage('Period must be week, month, quarter, or year')
], validate, async (req, res) => {
  try {
    const period = req.query.period || 'month';
    const dateRange = getDateRange(period);

    // Expense trends
    const expenseTrends = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: dateRange.startDate, $lte: dateRange.endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Category analysis
    const categoryAnalysis = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: dateRange.startDate, $lte: dateRange.endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);

    // Monthly comparison
    const lastPeriodStart = new Date(dateRange.startDate);
    const lastPeriodEnd = new Date(dateRange.endDate);
    const timeDiff = dateRange.endDate - dateRange.startDate;
    lastPeriodStart.setTime(lastPeriodStart.getTime() - timeDiff);
    lastPeriodEnd.setTime(lastPeriodEnd.getTime() - timeDiff);

    const currentPeriodTotal = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: dateRange.startDate, $lte: dateRange.endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const lastPeriodTotal = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: lastPeriodStart, $lte: lastPeriodEnd }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const currentTotal = currentPeriodTotal[0]?.total || 0;
    const lastTotal = lastPeriodTotal[0]?.total || 0;
    const changePercentage = lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0;

    // Goal progress analysis
    const goalProgress = await Goal.aggregate([
      {
        $match: { user: req.user._id }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalTargetAmount: { $sum: '$targetAmount' },
          totalCurrentAmount: { $sum: '$currentAmount' }
        }
      }
    ]);

    res.json({
      period,
      dateRange,
      expenseTrends,
      categoryAnalysis,
      periodComparison: {
        current: currentTotal,
        previous: lastTotal,
        changePercentage: changePercentage.toFixed(2)
      },
      goalProgress
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      message: 'Error fetching analytics data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/reports/test
// @desc    Test route for debugging
// @access  Private
router.get('/test', auth, async (req, res) => {
  try {
    console.log('[REPORTS] Test route accessed');
    console.log('[REPORTS] Query params:', req.query);
    console.log('[REPORTS] User:', req.user.email);
    res.json({ message: 'Reports route working', params: req.query, user: req.user.email });
  } catch (error) {
    console.error('[REPORTS] Test route error:', error);
    res.status(500).json({ message: 'Test route error', error: error.message });
  }
});

// @route   GET /api/reports/export/pdf
// @desc    Export financial report as PDF
// @access  Private
router.get('/export/pdf', auth, async (req, res) => {
  try {
    console.log('[REPORTS] PDF export request received');
    console.log('[REPORTS] Query params:', req.query);
    console.log('[REPORTS] User:', req.user.email);
    const PDFDocument = require('pdfkit');
    const userId = req.user._id;
    const { period = 'month', startDate, endDate, type = 'complete' } = req.query;

    // Calculate date range
    let dateRange;
    if (period === 'custom' && startDate && endDate) {
      dateRange = {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      };
    } else {
      dateRange = getDateRange(period);
    }

    // Get user data
    const user = await User.findById(userId);
    
    // Get expenses data
    const expenses = await Expense.find({
      user: userId,
      date: {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate
      }
    }).sort({ date: -1 });

    // Get goals data
    const goals = await Goal.find({ user: userId });

    // Calculate summary statistics
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const expensesByCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    const goalStats = {
      total: goals.length,
      completed: goals.filter(g => g.status === 'Completed').length,
      totalTarget: goals.reduce((sum, g) => sum + g.targetAmount, 0),
      totalSaved: goals.reduce((sum, g) => sum + g.currentAmount, 0)
    };

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="financial-report-${Date.now()}.pdf"`);
    
    // Pipe the PDF to response
    doc.pipe(res);

    // Add title
    doc.fontSize(24).font('Helvetica-Bold').text('Financial Report', { align: 'center' });
    doc.moveDown();

    // Add user info and date range
    doc.fontSize(12).font('Helvetica')
       .text(`Generated for: ${user.firstName} ${user.lastName}`)
       .text(`Email: ${user.email}`)
       .text(`Period: ${dateRange.startDate.toDateString()} - ${dateRange.endDate.toDateString()}`)
       .text(`Generated on: ${new Date().toDateString()}`)
       .moveDown();

    // Add summary section
    doc.fontSize(16).font('Helvetica-Bold').text('Summary', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(12).font('Helvetica')
       .text(`Total Expenses: ${user.currency || '$'}${totalExpenses.toFixed(2)}`)
       .text(`Number of Transactions: ${expenses.length}`)
       .text(`Total Goals: ${goalStats.total}`)
       .text(`Completed Goals: ${goalStats.completed}`)
       .text(`Total Goal Target: ${user.currency || '$'}${goalStats.totalTarget.toFixed(2)}`)
       .text(`Total Saved: ${user.currency || '$'}${goalStats.totalSaved.toFixed(2)}`)
       .moveDown();

    // Add expenses by category
    if (Object.keys(expensesByCategory).length > 0) {
      doc.fontSize(16).font('Helvetica-Bold').text('Expenses by Category', { underline: true });
      doc.moveDown(0.5);
      
      Object.entries(expensesByCategory)
        .sort(([,a], [,b]) => b - a)
        .forEach(([category, amount]) => {
          const percentage = ((amount / totalExpenses) * 100).toFixed(1);
          doc.fontSize(12).font('Helvetica')
             .text(`${category}: ${user.currency || '$'}${amount.toFixed(2)} (${percentage}%)`);
        });
      doc.moveDown();
    }

    // Add recent transactions
    if (expenses.length > 0) {
      doc.fontSize(16).font('Helvetica-Bold').text('Recent Transactions', { underline: true });
      doc.moveDown(0.5);
      
      // Add table headers
      const tableTop = doc.y;
      const col1 = 50; // Date
      const col2 = 150; // Description
      const col3 = 300; // Category
      const col4 = 420; // Amount
      
      doc.fontSize(10).font('Helvetica-Bold')
         .text('Date', col1, tableTop)
         .text('Description', col2, tableTop)
         .text('Category', col3, tableTop)
         .text('Amount', col4, tableTop);
      
      // Add line under headers
      doc.moveTo(col1, tableTop + 15).lineTo(500, tableTop + 15).stroke();
      
      // Add transactions (limit to first 20)
      const recentExpenses = expenses.slice(0, 20);
      let yPosition = tableTop + 25;
      
      recentExpenses.forEach((expense) => {
        if (yPosition > 700) { // Start new page if needed
          doc.addPage();
          yPosition = 50;
        }
        
        doc.fontSize(9).font('Helvetica')
           .text(expense.date.toDateString(), col1, yPosition)
           .text(expense.description.substring(0, 20), col2, yPosition)
           .text(expense.category, col3, yPosition)
           .text(`${user.currency || '$'}${expense.amount.toFixed(2)}`, col4, yPosition);
        
        yPosition += 15;
      });
      
      if (expenses.length > 20) {
        doc.moveDown().fontSize(10).font('Helvetica-Oblique')
           .text(`... and ${expenses.length - 20} more transactions`);
      }
    }

    // Add goals section
    if (goals.length > 0) {
      doc.addPage();
      doc.fontSize(16).font('Helvetica-Bold').text('Financial Goals', { underline: true });
      doc.moveDown(0.5);
      
      goals.forEach((goal) => {
        const progress = goal.targetAmount > 0 ? ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1) : 0;
        
        doc.fontSize(12).font('Helvetica-Bold').text(goal.title);
        doc.fontSize(10).font('Helvetica')
           .text(`Type: ${goal.type}`)
           .text(`Category: ${goal.category}`)
           .text(`Target: ${user.currency || '$'}${goal.targetAmount.toFixed(2)}`)
           .text(`Current: ${user.currency || '$'}${goal.currentAmount.toFixed(2)}`)
           .text(`Progress: ${progress}%`)
           .text(`Status: ${goal.status}`)
           .text(`Target Date: ${goal.targetDate.toDateString()}`)
           .moveDown();
      });
    }

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({
      message: 'Error generating PDF report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
