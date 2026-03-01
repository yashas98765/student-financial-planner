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
    console.log('✅ MongoDB Connected for user creation');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Create user function
const createUser = async (userData) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
    
    if (existingUser) {
      console.log(`❌ User with email ${userData.email} already exists`);
      return false;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Create new user
    const newUser = new User({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      dateOfBirth: userData.dateOfBirth,
      university: userData.university,
      course: userData.course,
      yearOfStudy: userData.yearOfStudy,
      monthlyBudget: userData.monthlyBudget || 50000,
      budgetAlertThreshold: userData.budgetAlertThreshold || 80,
      budgetCategories: userData.budgetCategories || {
        food: 15000,
        transportation: 5000,
        entertainment: 8000,
        utilities: 7000,
        shopping: 10000,
        other: 5000
      }
    });

    await newUser.save();

    console.log(`✅ User created successfully!`);
    console.log(`📧 Email: ${userData.email}`);
    console.log(`🔑 Password: ${userData.password}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    return false;
  }
};

// Main execution
const main = async () => {
  await connectDB();
  
  const userData = {
    firstName: 'Yashas',
    lastName: 'Shetty',
    email: 'yashassh2601@gmail.com',
    password: 'mypassword123', // You can change this to whatever you want
    dateOfBirth: new Date('2001-01-26'), // Assuming from your email
    university: 'Your University',
    course: 'Your Course',
    yearOfStudy: 3,
    monthlyBudget: 50000
  };
  
  console.log(`🔄 Creating account for: ${userData.email}`);
  
  const success = await createUser(userData);
  
  if (success) {
    console.log('\n🎉 Account created successfully!');
    console.log('\n📝 Login Details:');
    console.log(`   Email: ${userData.email}`);
    console.log(`   Password: ${userData.password}`);
    console.log('\n💡 You can now login with these credentials.');
    console.log('🔧 You can update your profile information after logging in.');
  } else {
    console.log('\n❌ Account creation failed!');
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
