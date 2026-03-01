const User = require('../models/User');
const Expense = require('../models/Expense');
const Goal = require('../models/Goal');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    console.log('🌱 Starting data seeding...');

    // Create sample user
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Clear existing data
    await User.deleteMany({});
    await Expense.deleteMany({});
    await Goal.deleteMany({});

    const sampleUser = await User.create({
      firstName: 'Yashas',
      lastName: 'S H',
      email: 'yashassh2601@gmail.com',
      password: hashedPassword,
      dateOfBirth: new Date('2001-01-01'),
      university: 'VTU',
      course: 'Computer Science',
      yearOfStudy: 3,
      currency: 'INR',
      monthlyIncome: 30000,
      monthlyBudget: 20000
    });

    console.log('👤 Sample user created:', sampleUser.email);

    // Create sample expenses to match the screenshots
    const sampleExpenses = [
      {
        user: sampleUser._id,
        title: 'shirt',
        description: 't-shirt',
        amount: 1500.00,
        category: 'Clothing',
        paymentMethod: 'Bank Transfer',
        isEssential: false,
        date: new Date('2025-09-07'),
        isRecurring: false
      },
      {
        user: sampleUser._id,
        title: 'hotel',
        description: 'lodging',
        amount: 5600.00,
        category: 'Accommodation',
        paymentMethod: 'Credit Card',
        isEssential: false,
        date: new Date('2025-09-06'),
        isRecurring: false
      },
      {
        user: sampleUser._id,
        title: 'medicine',
        description: 'tablets',
        amount: 1059.00,
        category: 'Healthcare',
        paymentMethod: 'Debit Card',
        isEssential: true,
        date: new Date('2025-09-06'),
        isRecurring: false
      },
      {
        user: sampleUser._id,
        title: 'groceries',
        description: 'monthly shopping',
        amount: 1500.00,
        category: 'Food & Dining',
        paymentMethod: 'Cash',
        isEssential: true,
        date: new Date('2025-09-05'),
        isRecurring: false
      },
      {
        user: sampleUser._id,
        title: 'transport',
        description: 'bus fare',
        amount: 499.00,
        category: 'Transportation',
        paymentMethod: 'Digital Wallet',
        isEssential: true,
        date: new Date('2025-09-04'),
        isRecurring: false
      }
    ];

    await Expense.insertMany(sampleExpenses);
    console.log('💰 Sample expenses created:', sampleExpenses.length);

    // Create sample goals to match the screenshots
    const sampleGoals = [
      {
        user: sampleUser._id,
        title: 'lunch',
        description: 'food',
        type: 'Savings',
        targetAmount: 90.00,
        currentAmount: 90.00,
        targetDate: new Date('2026-09-06'),
        category: 'Other',
        priority: 'Low',
        status: 'Completed',
        createdAt: new Date('2025-08-01'),
        updatedAt: new Date('2025-09-01')
      },
      {
        user: sampleUser._id,
        title: 'movies',
        description: 'book my show',
        type: 'Savings',
        targetAmount: 500.00,
        currentAmount: 500.00,
        targetDate: new Date('2026-08-15'),
        category: 'Entertainment',
        priority: 'Low',
        status: 'Completed',
        createdAt: new Date('2025-07-01'),
        updatedAt: new Date('2025-08-15')
      },
      {
        user: sampleUser._id,
        title: 'laptop',
        description: 'new macbook',
        type: 'Savings',
        targetAmount: 150000.00,
        currentAmount: 75000.00,
        targetDate: new Date('2026-12-31'),
        category: 'Technology',
        priority: 'High',
        status: 'Active',
        createdAt: new Date('2025-06-01'),
        updatedAt: new Date('2025-09-01')
      },
      {
        user: sampleUser._id,
        title: 'vacation',
        description: 'trip to goa',
        type: 'Savings',
        targetAmount: 25000.00,
        currentAmount: 12000.00,
        targetDate: new Date('2026-03-15'),
        category: 'Travel',
        priority: 'Medium',
        status: 'Active',
        createdAt: new Date('2025-05-01'),
        updatedAt: new Date('2025-08-20')
      }
    ];

    await Goal.insertMany(sampleGoals);
    console.log('🎯 Sample goals created:', sampleGoals.length);

    console.log('✅ Data seeding completed successfully!');
    console.log(`📧 Login with: ${sampleUser.email} / password123`);
    
    return {
      user: sampleUser,
      expenses: sampleExpenses,
      goals: sampleGoals
    };

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
};

module.exports = seedData;
