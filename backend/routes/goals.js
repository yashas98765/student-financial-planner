const express = require('express');
const { body, query } = require('express-validator');
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { sendEmail, sendSMS } = require('../utils/notifications');

const router = express.Router();

// Send reminder for goal deadline
router.post('/remind/:userId/:goalId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const goalId = req.params.goalId;
    const user = await User.findById(userId);
    const goal = await Goal.findById(goalId);
    if (!goal) throw new Error('Goal not found');
    const message = `Reminder: Your goal "${goal.title}" is due on ${goal.deadline}.`;
    if (user.notificationPreferences?.enableEmail && user.notificationPreferences?.email) {
      await sendEmail(user.notificationPreferences.email, 'Goal Deadline Reminder', message);
    }
    if (user.notificationPreferences?.enableSMS && user.notificationPreferences?.sms) {
      await sendSMS(user.notificationPreferences.sms, message);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Goal validation rules
const goalValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('type')
    .notEmpty()
    .withMessage('Goal type is required')
    .isIn(['Savings', 'Budget Limit', 'Debt Reduction', 'Investment', 'Emergency Fund'])
    .withMessage('Invalid goal type'),
  
  body('targetAmount')
    .isFloat({ min: 0.01 })
    .withMessage('Target amount must be greater than 0'),
  
  body('targetDate')
    .isISO8601()
    .withMessage('Please provide a valid target date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Target date must be in the future');
      }
      return true;
    }),
  
  body('category')
    .optional()
    .isIn([
      'Education',
      'Travel',
      'Technology',
      'Emergency',
      'Entertainment',
      'Health',
      'Personal Development',
      'Other'
    ])
    .withMessage('Invalid category'),
  
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Invalid priority level'),
  
  body('monthlyContribution')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Monthly contribution cannot be negative')
];

// @route   POST /api/goals
// @desc    Create a new goal
// @access  Private
router.post('/', auth, goalValidation, validate, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      targetAmount,
      targetDate,
      category,
      priority,
      monthlyContribution,
      autoDeduct
    } = req.body;

    // Check if user already has an active goal with the same title
    const existingGoal = await Goal.findOne({
      user: req.user._id,
      title,
      status: 'Active'
    });

    if (existingGoal) {
      return res.status(400).json({
        message: 'You already have an active goal with this title'
      });
    }

    const goal = new Goal({
      user: req.user._id,
      title,
      description,
      type,
      targetAmount,
      targetDate,
      category: category || 'Other',
      priority: priority || 'Medium',
      monthlyContribution: monthlyContribution || 0,
      autoDeduct: autoDeduct || false
    });

    await goal.save();
    await goal.populate('user', 'firstName lastName');

    res.status(201).json({
      message: 'Goal created successfully',
      goal
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({
      message: 'Error creating goal',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/goals
// @desc    Get user goals with filtering and sorting
// @access  Private
router.get('/', auth, [
  query('status')
    .optional()
    .isIn(['Active', 'Completed', 'Paused', 'Cancelled'])
    .withMessage('Invalid status filter'),
  
  query('type')
    .optional()
    .isIn(['Savings', 'Budget Limit', 'Debt Reduction', 'Investment', 'Emergency Fund'])
    .withMessage('Invalid type filter'),
  
  query('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Invalid priority filter'),
  
  query('category')
    .optional()
    .isIn([
      'Education',
      'Travel',
      'Technology',
      'Emergency',
      'Entertainment',
      'Health',
      'Personal Development',
      'Other'
    ])
    .withMessage('Invalid category filter'),
  
  query('sortBy')
    .optional()
    .isIn(['targetDate', 'targetAmount', 'priority', 'progress', 'createdAt'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
], validate, async (req, res) => {
  try {
    console.log('[GOALS ROUTE] /api/goals accessed');
    console.log('[GOALS ROUTE] User:', req.user.email);
    console.log('[GOALS ROUTE] User object:', req.user);
    console.log('[GOALS ROUTE] User ID:', req.user._id);
    console.log('[GOALS ROUTE] Query params:', req.query);
    
    // Build filter object
    const filter = { user: req.user._id };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.type) {
      filter.type = req.query.type;
    }

    if (req.query.priority) {
      filter.priority = req.query.priority;
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Build sort object
    const sortBy = req.query.sortBy || 'targetDate';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    const sort = {};

    if (sortBy === 'progress') {
      // For progress sorting, we'll handle it after fetching
      sort.targetDate = 1;
    } else {
      sort[sortBy] = sortOrder;
    }

    let goals = await Goal.find(filter)
      .sort(sort)
      .populate('user', 'firstName lastName');

    // Sort by progress if requested
    if (sortBy === 'progress') {
      goals.sort((a, b) => {
        const progressA = a.progressPercentage;
        const progressB = b.progressPercentage;
        return sortOrder === 1 ? progressA - progressB : progressB - progressA;
      });
    }

    // Calculate summary statistics
    const summary = {
      total: goals.length,
      active: goals.filter(g => g.status === 'Active').length,
      completed: goals.filter(g => g.status === 'Completed').length,
      totalTargetAmount: goals.reduce((sum, g) => sum + g.targetAmount, 0),
      totalCurrentAmount: goals.reduce((sum, g) => sum + g.currentAmount, 0),
      averageProgress: goals.length > 0 
        ? goals.reduce((sum, g) => sum + g.progressPercentage, 0) / goals.length 
        : 0
    };

    console.log('[GOALS ROUTE] Found goals:', goals.length);
    console.log('[GOALS ROUTE] Goals data:', goals.map(g => ({ 
      id: g._id, 
      title: g.title, 
      targetAmount: g.targetAmount, 
      currentAmount: g.currentAmount,
      status: g.status,
      user: g.user
    })));
    console.log('[GOALS ROUTE] Summary:', summary);

    res.json({
      goals,
      summary
    });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({
      message: 'Error fetching goals',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/goals/:id
// @desc    Get single goal
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('user', 'firstName lastName');

    if (!goal) {
      return res.status(404).json({
        message: 'Goal not found'
      });
    }

    res.json({ goal });
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({
      message: 'Error fetching goal',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/goals/:id
// @desc    Update a goal
// @access  Private
router.put('/:id', auth, goalValidation, validate, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      targetAmount,
      targetDate,
      category,
      priority,
      monthlyContribution,
      autoDeduct,
      status
    } = req.body;

    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        message: 'Goal not found'
      });
    }

    // Check if goal is completed and user is trying to modify critical fields
    if (goal.status === 'Completed' && (targetAmount !== goal.targetAmount || targetDate !== goal.targetDate)) {
      return res.status(400).json({
        message: 'Cannot modify target amount or date of a completed goal'
      });
    }

    // Update fields
    goal.title = title;
    goal.description = description;
    goal.type = type;
    goal.targetAmount = targetAmount;
    goal.targetDate = targetDate;
    goal.category = category || goal.category;
    goal.priority = priority || goal.priority;
    goal.monthlyContribution = monthlyContribution || 0;
    goal.autoDeduct = autoDeduct || false;

    if (status && ['Active', 'Paused', 'Cancelled'].includes(status)) {
      goal.status = status;
    }

    await goal.save();
    await goal.populate('user', 'firstName lastName');

    res.json({
      message: 'Goal updated successfully',
      goal
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({
      message: 'Error updating goal',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/goals/:id
// @desc    Delete a goal
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        message: 'Goal not found'
      });
    }

    // Prevent deletion of completed goals
    if (goal.status === 'Completed') {
      return res.status(400).json({
        message: 'Cannot delete a completed goal'
      });
    }

    await Goal.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({
      message: 'Error deleting goal',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/goals/:id/contribute
// @desc    Add contribution to a goal
// @access  Private
router.post('/:id/contribute', auth, [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Contribution amount must be greater than 0'),
  
  body('note')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Note cannot exceed 200 characters')
], validate, async (req, res) => {
  try {
    const { amount, note } = req.body;

    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        message: 'Goal not found'
      });
    }

    if (goal.status !== 'Active') {
      return res.status(400).json({
        message: 'Cannot contribute to inactive goal'
      });
    }

    // Add contribution
    await goal.addContribution(amount);

    // Add note if provided
    if (note) {
      await goal.addNote(`Contribution: $${amount.toFixed(2)} - ${note}`);
    }

    await goal.populate('user', 'firstName lastName');

    res.json({
      message: 'Contribution added successfully',
      goal,
      contribution: {
        amount,
        note,
        date: new Date()
      }
    });
  } catch (error) {
    console.error('Add contribution error:', error);
    res.status(500).json({
      message: 'Error adding contribution',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/goals/:id/notes
// @desc    Add note to a goal
// @access  Private
router.post('/:id/notes', auth, [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Note content is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Note must be between 1 and 200 characters')
], validate, async (req, res) => {
  try {
    const { content } = req.body;

    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        message: 'Goal not found'
      });
    }

    await goal.addNote(content);
    await goal.populate('user', 'firstName lastName');

    res.json({
      message: 'Note added successfully',
      goal
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({
      message: 'Error adding note',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/goals/stats/dashboard
// @desc    Get goals dashboard statistics
// @access  Private
router.get('/stats/dashboard', auth, async (req, res) => {
  try {
    // Get all user goals
    const goals = await Goal.find({ user: req.user._id });

    // Calculate various statistics
    const stats = {
      totalGoals: goals.length,
      activeGoals: goals.filter(g => g.status === 'Active').length,
      completedGoals: goals.filter(g => g.status === 'Completed').length,
      pausedGoals: goals.filter(g => g.status === 'Paused').length,
      totalTargetAmount: goals.reduce((sum, g) => sum + g.targetAmount, 0),
      totalSavedAmount: goals.reduce((sum, g) => sum + g.currentAmount, 0),
      averageProgress: goals.length > 0 
        ? goals.reduce((sum, g) => sum + g.progressPercentage, 0) / goals.length 
        : 0,
      goalsNearTarget: goals.filter(g => g.progressPercentage >= 90 && g.status === 'Active').length,
      overdue: goals.filter(g => 
        g.status === 'Active' && 
        new Date(g.targetDate) < new Date() && 
        g.progressPercentage < 100
      ).length
    };

    // Get goals by category
    const goalsByCategory = goals.reduce((acc, goal) => {
      acc[goal.category] = (acc[goal.category] || 0) + 1;
      return acc;
    }, {});

    // Get goals by priority
    const goalsByPriority = goals.reduce((acc, goal) => {
      acc[goal.priority] = (acc[goal.priority] || 0) + 1;
      return acc;
    }, {});

    // Get upcoming deadlines (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const upcomingDeadlines = goals.filter(g => 
      g.status === 'Active' && 
      new Date(g.targetDate) <= thirtyDaysFromNow &&
      new Date(g.targetDate) >= new Date()
    ).sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));

    res.json({
      stats,
      goalsByCategory,
      goalsByPriority,
      upcomingDeadlines: upcomingDeadlines.slice(0, 5) // Top 5 upcoming deadlines
    });
  } catch (error) {
    console.error('Get goals dashboard error:', error);
    res.status(500).json({
      message: 'Error fetching goals dashboard',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PATCH /api/goals/:id/complete
// @desc    Mark a goal as completed
// @access  Private
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        message: 'Goal not found'
      });
    }

    if (goal.status === 'Completed') {
      return res.status(400).json({
        message: 'Goal is already completed'
      });
    }

    // Update only the status, bypassing validation
    await Goal.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'Completed',
        currentAmount: goal.targetAmount // Set current amount to target when completing
      },
      { 
        new: true,
        runValidators: false // Skip validation to avoid targetDate issues
      }
    );

    // Fetch the updated goal with user info
    const updatedGoal = await Goal.findById(req.params.id).populate('user', 'firstName lastName');

    res.json({
      message: 'Goal marked as completed successfully',
      goal: updatedGoal
    });

  } catch (error) {
    console.error('Complete goal error:', error);
    res.status(500).json({
      message: 'Error completing goal',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
