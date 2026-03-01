const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const fixPassword = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-financial-planner', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Find the user
    const user = await User.findOne({ email: 'yashassh2601@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log('👤 User found, updating password...');
    
    // Update the password - this will trigger the pre-save hook to hash it
    user.password = 'password123';
    await user.save();
    
    console.log('✅ Password updated successfully!');
    console.log('📧 You can now login with:');
    console.log('Email: yashassh2601@gmail.com');
    console.log('Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixPassword();
