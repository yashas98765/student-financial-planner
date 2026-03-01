const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Expense = require('./models/Expense');
const Goal = require('./models/Goal');

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/student-financial-planner');
    
    console.log('Connected! Adding sample data...');
    
    // Create or find user
    let user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = new User({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: hashedPassword,
        dateOfBirth: new Date('2000-01-01'),
        course: 'Computer Science',
        university: 'Test University',
        yearOfStudy: 3,
        monthlyBudget: 50000
      });
      await user.save();
      console.log('✅ User created: test@example.com / password123');
    } else {
      console.log('✅ User already exists: test@example.com');
    }

    // Clear existing data for this user
    await Expense.deleteMany({ user: user._id });
    await Goal.deleteMany({ user: user._id });
    console.log('✅ Cleared existing data');

    // Add sample expenses
    const expenses = [
      {
        user: user._id,
        title: 'Lunch at Cafeteria',
        amount: 250,
        category: 'Food & Dining',
        description: 'Daily lunch',
        date: new Date(),
        location: 'College Cafeteria'
      },
      {
        user: user._id,
        title: 'Bus Fare',
        amount: 150,
        category: 'Transportation',
        description: 'Daily commute',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        location: 'Bus Station'
      },
      {
        user: user._id,
        title: 'Programming Book',
        amount: 1200,
        category: 'Books & Supplies',
        description: 'Data Structures and Algorithms',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        location: 'College Bookstore'
      },
      {
        user: user._id,
        title: 'Movie Ticket',
        amount: 300,
        category: 'Entertainment',
        description: 'Weekend movie',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        location: 'PVR Cinema'
      },
      {
        user: user._id,
        title: 'Coffee',
        amount: 120,
        category: 'Food & Dining',
        description: 'Study session coffee',
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        location: 'Cafe Coffee Day'
      },
      {
        user: user._id,
        title: 'Stationery',
        amount: 450,
        category: 'Books & Supplies',
        description: 'Notebooks and pens',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        location: 'Local Store'
      },
      {
        user: user._id,
        title: 'Internet Recharge',
        amount: 599,
        category: 'Technology',
        description: 'Monthly internet plan',
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        location: 'Online'
      },
      {
        user: user._id,
        title: 'Gym Membership',
        amount: 2000,
        category: 'Healthcare',
        description: 'Monthly gym fee',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        location: 'Local Gym'
      }
    ];

    await Expense.insertMany(expenses);
    console.log('✅ Added 8 sample expenses');

    // Add sample goals
    const goals = [
      {
        user: user._id,
        title: 'Emergency Fund',
        description: 'Build emergency fund for unexpected expenses',
        targetAmount: 50000,
        currentAmount: 15000,
        targetDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000), // 6 months from now
        status: 'Active',
        priority: 'High',
        type: 'Emergency Fund'
      },
      {
        user: user._id,
        title: 'Laptop Fund',
        description: 'Save for new laptop for studies',
        targetAmount: 80000,
        currentAmount: 25000,
        targetDate: new Date(Date.now() + 8 * 30 * 24 * 60 * 60 * 1000), // 8 months from now
        status: 'Active',
        priority: 'High',
        type: 'Savings'
      },
      {
        user: user._id,
        title: 'Course Certification',
        description: 'Save for online course certification',
        targetAmount: 15000,
        currentAmount: 15000,
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now (since target date must be future)
        status: 'Completed',
        priority: 'Medium',
        type: 'Savings'
      },
      {
        user: user._id,
        title: 'Study Trip',
        description: 'Educational trip fund',
        targetAmount: 30000,
        currentAmount: 8000,
        targetDate: new Date(Date.now() + 4 * 30 * 24 * 60 * 60 * 1000), // 4 months from now
        status: 'Active',
        priority: 'Medium',
        type: 'Savings'
      }
    ];

    await Goal.insertMany(goals);
    console.log('✅ Added 4 sample goals');

    console.log('\n🎉 SAMPLE DATA ADDED SUCCESSFULLY!');
    console.log('\n📝 LOGIN CREDENTIALS:');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    console.log('\n💰 SAMPLE DATA INCLUDES:');
    console.log('• 8 Recent Expenses (₹5,069 total)');
    console.log('• 4 Financial Goals (₹175,000 target)');
    console.log('• 1 Completed Goal');
    console.log('• Various Categories & Dates');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
