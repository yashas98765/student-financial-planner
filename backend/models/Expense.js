const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Expense title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  set: v => v,
  get: v => v
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
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
    ]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  set: v => v,
  get: v => v
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Digital Wallet', 'Other'],
    default: 'Cash'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringFrequency: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Yearly'],
    required: function() {
      return this.isRecurring;
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  receipt: {
    type: String, // URL or file path for receipt image
    default: null
  },
  location: {
    type: String,
    trim: true,
  set: v => v,
  get: v => v
  },
  isEssential: {
    type: Boolean,
    default: true
  },
  semester: {
    type: String,
    trim: true,
    default: null
  },
  academicYear: {
    type: String,
    trim: true,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });
expenseSchema.index({ user: 1, createdAt: -1 });

// Virtual for formatted amount
expenseSchema.virtual('formattedAmount').get(function() {
  return this.amount.toFixed(2);
});

// Static method to get expense statistics
expenseSchema.statics.getExpenseStats = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
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
};

// Method to check if expense is within current month
expenseSchema.methods.isCurrentMonth = function() {
  const now = new Date();
  const expenseDate = new Date(this.date);
  return expenseDate.getMonth() === now.getMonth() && 
         expenseDate.getFullYear() === now.getFullYear();
};

expenseSchema.set('toJSON', { getters: true });
expenseSchema.set('toObject', { getters: true });
module.exports = mongoose.model('Expense', expenseSchema);
