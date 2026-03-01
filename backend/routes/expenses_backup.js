const express = require('express');
const { body, query } = require('express-validator');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Expense validation rules
const expenseValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn([
      'Food & Dining',
      'Transportation',
      'Accommodation',
      'Books & Supplies',
      'Entertainment',
      'Healthcare',
      'Clothing',
      'Technology',
      'Personal Care',
      'Education',
      'Miscellaneous'
    ])
    .withMessage('Invalid category'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('paymentMethod')
    .optional()
    .isIn(['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Digital Wallet', 'Other'])
    .withMessage('Invalid payment method'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters')
];

// @route   GET /api/expenses/stats/summary
// @desc    Get expense statistics summary
// @access  Private
router.get('/stats/summary', auth, [
  query('period')
    .optional()
    .isIn(['week', 'month', 'quarter', 'year'])
    .withMessage('Period must be week, month, quarter, or year')
], validate, async (req, res) => {
  try {
    const period = req.query.period || 'month';
    let startDate, endDate;

    endDate = new Date();
    startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // Get overall statistics
    const overallStats = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalCount: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      }
    ]);

    res.json({
      period,
      dateRange: { startDate, endDate },
      overallStats: overallStats[0] || {
        totalAmount: 0,
        totalCount: 0,
        averageAmount: 0
      }
    });
  } catch (error) {
    console.error('Get expense statistics error:', error);
    res.status(500).json({
      message: 'Error fetching expense statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/expenses
// @desc    Create a new expense
// @access  Private
router.post('/', auth, expenseValidation, validate, async (req, res) => {
  try {
    const {
      title,
      amount,
      category,
      description,
      date,
      paymentMethod,
      isRecurring,
      recurringFrequency,
      tags,
      location,
      isEssential
    } = req.body;

    const expense = new Expense({
      user: req.user._id,
      title,
      amount,
      category,
      description,
      date: date || new Date(),
      paymentMethod: paymentMethod || 'Cash',
      isRecurring: isRecurring || false,
      recurringFrequency,
      tags: tags || [],
      location,
      isEssential: isEssential !== undefined ? isEssential : true
    });

    await expense.save();
    await expense.populate('user', 'firstName lastName');

    res.status(201).json({
      message: 'Expense created successfully',
      expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      message: 'Error creating expense',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/expenses
// @desc    Get user expenses with pagination and filtering
// @access  Private
router.get('/', auth, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('category')
    .optional()
    .isIn([
      'Food & Dining',
      'Transportation',
      'Accommodation',
      'Books & Supplies',
      'Entertainment',
      'Healthcare',
      'Clothing',
      'Technology',
      'Personal Care',
      'Education',
      'Miscellaneous'
    ])
    .withMessage('Invalid category filter')
], validate, async (req, res) => {
  try {
    console.log('[EXPENSES ROUTE] /api/expenses accessed');
    console.log('[EXPENSES ROUTE] User:', req.user ? req.user._id : null);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { user: req.user._id };

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { location: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    console.log('Filter:', filter);

    // Get expenses with pagination
    const expenses = await Expense.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName');

    console.log('Found expenses:', expenses.length);

    // Get total count for pagination
    const totalExpenses = await Expense.countDocuments(filter);
    const totalPages = Math.ceil(totalExpenses / limit);

    res.json({
      expenses,
      pagination: {
        currentPage: page,
        totalPages,
        totalExpenses,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      message: 'Error fetching expenses',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get single expense
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('user', 'firstName lastName');

    if (!expense) {
      return res.status(404).json({
        message: 'Expense not found'
      });
    }

    res.json({ expense });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      message: 'Error fetching expense',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update an expense
// @access  Private
router.put('/:id', auth, expenseValidation, validate, async (req, res) => {
  try {
    const {
      title,
      amount,
      category,
      description,
      date,
      paymentMethod,
      isRecurring,
      recurringFrequency,
      tags,
      location,
      isEssential
    } = req.body;

    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!expense) {
      return res.status(404).json({
        message: 'Expense not found'
      });
    }

    // Update fields
    expense.title = title;
    expense.amount = amount;
    expense.category = category;
    expense.description = description;
    expense.date = date || expense.date;
    expense.paymentMethod = paymentMethod || expense.paymentMethod;
    expense.isRecurring = isRecurring || false;
    expense.recurringFrequency = recurringFrequency;
    expense.tags = tags || [];
    expense.location = location;
    expense.isEssential = isEssential !== undefined ? isEssential : expense.isEssential;

    await expense.save();
    await expense.populate('user', 'firstName lastName');

    res.json({
      message: 'Expense updated successfully',
      expense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      message: 'Error updating expense',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!expense) {
      return res.status(404).json({
        message: 'Expense not found'
      });
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      message: 'Error deleting expense',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
