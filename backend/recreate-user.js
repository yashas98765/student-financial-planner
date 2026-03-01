const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/student-financial-planner', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Delete and recreate user
const recreateUser = async () => {
  try {
    const email = 'yashassh2601@gmail.com';
    
    // Delete existing user if exists
    const deletedUser = await User.findOneAndDelete({ email: email.toLowerCase() });
    if (deletedUser) {
      console.log('🗑️ Deleted existing user');
    }

    // Create new user - this will trigger the pre-save hook for proper password hashing
    const newUser = new User({
      firstName: 'Yashas',
      lastName: 'Shetty',
      email: email,
      password: 'mypassword123', // This will be properly hashed by the pre-save hook
      dateOfBirth: new Date('2001-01-26'),
      university: 'Your University',
      course: 'Your Course',
      yearOfStudy: 3,
      monthlyBudget: 50000,
      budgetCategories: {
        food: 15000,
        transportation: 5000,
        entertainment: 8000,
        utilities: 7000,
        shopping: 10000,
        other: 5000
      }
    });

    // Save user - this triggers the pre-save hook that hashes the password
    await newUser.save();
    
    console.log('✅ User created successfully with proper password hashing!');
    
    // Test the password
    const savedUser = await User.findOne({ email: email.toLowerCase() }).select('+password');
    const isValid = await savedUser.comparePassword('mypassword123');
    
    console.log('🔍 Password test result:', isValid ? '✅ PASS' : '❌ FAIL');
    
    if (isValid) {
      console.log('\n🎉 Account ready for login!');
      console.log('📧 Email: yashassh2601@gmail.com');
      console.log('🔑 Password: mypassword123');
    }
    
    return isValid;
    
  } catch (error) {
    console.error('❌ Error recreating user:', error.message);
    return false;
  }
};

// Main execution
const main = async () => {
  await connectDB();
  
  console.log('🔄 Recreating user with proper password hashing...');
  
  const success = await recreateUser();
  
  if (success) {
    console.log('\n✅ User recreation completed successfully!');
    console.log('💡 You can now login at http://localhost:3000');
  } else {
    console.log('\n❌ User recreation failed!');
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
