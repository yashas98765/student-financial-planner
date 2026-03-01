const mongoose = require('mongoose');
const seedData = require('./utils/seedData');
require('dotenv').config();

const runSeed = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-financial-planner', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Run seeding
    await seedData();
    
    console.log('🎉 Seeding completed! You can now login with:');
    console.log('Email: yashassh2601@gmail.com');
    console.log('Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

runSeed();
