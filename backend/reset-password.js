const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/student-financial-planner', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected for password reset');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Reset password function
const resetPassword = async (email, newPassword) => {
  try {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      return false;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user's password
    await User.findByIdAndUpdate(user._id, { 
      password: hashedPassword 
    });

    console.log(`✅ Password reset successful for ${email}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 New Password: ${newPassword}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
    return false;
  }
};

// Main execution
const main = async () => {
  await connectDB();
  
  const email = 'yashassh2601@gmail.com';
  const newPassword = 'newpassword123'; // You can change this to whatever you want
  
  console.log(`🔄 Resetting password for: ${email}`);
  
  const success = await resetPassword(email, newPassword);
  
  if (success) {
    console.log('\n🎉 Password reset completed successfully!');
    console.log('\n📝 Login Details:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);
    console.log('\n💡 You can now login with these credentials.');
  } else {
    console.log('\n❌ Password reset failed!');
  }
  
  // Close database connection
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Script execution error:', error);
  process.exit(1);
});
