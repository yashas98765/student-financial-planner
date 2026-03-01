const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: {
    type: String,
    required: [true, 'Goal type is required'],
    enum: ['Savings', 'Budget Limit', 'Debt Reduction', 'Investment', 'Emergency Fund']
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [0.01, 'Target amount must be greater than 0']
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Current amount cannot be negative']
  },
  targetDate: {
    type: Date,
    required: [true, 'Target date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Target date must be in the future'
    }
  },
  category: {
    type: String,
    enum: [
      'Education',
      'Travel',
      'Technology',
      'Emergency',
      'Entertainment',
      'Health',
      'Personal Development',
      'Other'
    ],
    default: 'Other'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Paused', 'Cancelled'],
    default: 'Active'
  },
  monthlyContribution: {
    type: Number,
    default: 0,
    min: [0, 'Monthly contribution cannot be negative']
  },
  autoDeduct: {
    type: Boolean,
    default: false
  },
  reminders: {
    enabled: {
      type: Boolean,
      default: true
    },
    frequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly'],
      default: 'Weekly'
    }
  },
  milestones: [{
    percentage: {
      type: Number,
      min: 0,
      max: 100
    },
    amount: {
      type: Number,
      min: 0
    },
    achievedDate: {
      type: Date
    },
    isAchieved: {
      type: Boolean,
      default: false
    }
  }],
  notes: [{
    content: {
      type: String,
      required: true,
      maxlength: [200, 'Note cannot exceed 200 characters']
    },
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
goalSchema.index({ user: 1, status: 1 });
goalSchema.index({ user: 1, targetDate: 1 });
goalSchema.index({ user: 1, type: 1 });

// Virtual for progress percentage
goalSchema.virtual('progressPercentage').get(function() {
  if (this.targetAmount <= 0) return 0;
  const progress = (this.currentAmount / this.targetAmount) * 100;
  return Math.min(Math.round(progress * 100) / 100, 100); // Round to 2 decimal places, max 100%
});

// Virtual for remaining amount
goalSchema.virtual('remainingAmount').get(function() {
  return Math.max(this.targetAmount - this.currentAmount, 0);
});

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function() {
  const today = new Date();
  const targetDate = new Date(this.targetDate);
  const diffTime = targetDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for monthly required savings
goalSchema.virtual('monthlyRequiredSavings').get(function() {
  const daysRemaining = this.daysRemaining;
  if (daysRemaining <= 0) return 0;
  
  const monthsRemaining = daysRemaining / 30;
  const remainingAmount = this.remainingAmount;
  
  return monthsRemaining > 0 ? remainingAmount / monthsRemaining : remainingAmount;
});

// Method to add contribution
goalSchema.methods.addContribution = function(amount) {
  this.currentAmount += amount;
  
  // Check if goal is completed
  if (this.currentAmount >= this.targetAmount) {
    this.status = 'Completed';
    this.currentAmount = this.targetAmount; // Cap at target amount
  }
  
  // Update milestones
  const progressPercentage = (this.currentAmount / this.targetAmount) * 100;
  this.milestones.forEach(milestone => {
    if (!milestone.isAchieved && progressPercentage >= milestone.percentage) {
      milestone.isAchieved = true;
      milestone.achievedDate = new Date();
    }
  });
  
  return this.save();
};

// Method to add note
goalSchema.methods.addNote = function(content) {
  this.notes.push({ content });
  return this.save();
};

// Static method to get user goals summary
goalSchema.statics.getUserGoalsSummary = function(userId) {
  return this.aggregate([
    {
      $match: { user: mongoose.Types.ObjectId(userId) }
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
};

// Pre-save middleware to initialize default milestones
goalSchema.pre('save', function(next) {
  if (this.isNew && this.milestones.length === 0) {
    // Add default milestones at 25%, 50%, 75%, and 100%
    const defaultMilestones = [25, 50, 75, 100];
    defaultMilestones.forEach(percentage => {
      this.milestones.push({
        percentage,
        amount: (this.targetAmount * percentage) / 100
      });
    });
  }
  next();
});

module.exports = mongoose.model('Goal', goalSchema);
