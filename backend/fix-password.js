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
    console.log('✅ MongoDB Connected for password fix');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Fix password function
const fixPassword = async (email, newPassword) => {
  try {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      return false;
    }

    console.log('👤 User found:', user.firstName, user.lastName);
    console.log('📧 Email:', user.email);

    // Hash the new password with the same method as registration
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('🔑 Old password hash:', user.password?.substring(0, 20) + '...');
    console.log('🔑 New password hash:', hashedPassword.substring(0, 20) + '...');
    
    // Update user's password
    await User.findByIdAndUpdate(user._id, { 
      password: hashedPassword 
    });

    // Verify the update worked
    const updatedUser = await User.findById(user._id);
    const isValid = await bcrypt.compare(newPassword, updatedUser.password);
    
    console.log('✅ Password updated successfully');
    console.log('🔍 Password verification test:', isValid ? 'PASS' : 'FAIL');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error fixing password:', error.message);
    return false;
  }
};

// Main execution
const main = async () => {
  await connectDB();
  
  const email = 'yashassh2601@gmail.com';
  const newPassword = 'mypassword123';
  
  console.log(`🔄 Fixing password for: ${email}`);
  
  const success = await fixPassword(email, newPassword);
  
  if (success) {
    console.log('\n🎉 Password fixed successfully!');
    console.log('\n📝 Login Details:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);
    console.log('\n💡 Try logging in again now.');
  } else {
    console.log('\n❌ Password fix failed!');
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
