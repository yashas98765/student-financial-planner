const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const goalRoutes = require('./routes/goals');
const reportRoutes = require('./routes/reports');
// const groupExpensesRoutes = require('./routes/groupExpenses');
const gdprRoutes = require('./gdpr');
// const chatbotRoutes = require('./routes/chatbot');
// const tipsRoutes = require('./routes/tips');
// const tagsRoutes = require('./routes/tags');
// const receiptsRoutes = require('./routes/receipts');
// const paymentMockRoutes = require('./routes/paymentMock');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Increased to 1000 requests per window
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => {
    // Skip rate limiting for development environment
    return process.env.NODE_ENV === 'development';
  }
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003'
  ],
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', req.headers.authorization ? 'Auth header present' : 'No auth header');
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student_financial_planner', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend API is working!', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/reports', reportRoutes);
// app.use('/api/group-expenses', groupExpensesRoutes);
app.use('/api/gdpr', gdprRoutes);
// app.use('/api/chatbot', chatbotRoutes);
// app.use('/api/tips', tipsRoutes);
// app.use('/api/tags', tagsRoutes);
// app.use('/api/receipts', receiptsRoutes);
// app.use('/api/payment-mock', paymentMockRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    message: 'Student Financial Planner API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Recurring Expenses Automation (runs daily)
const Expense = require('./models/Expense');
cron.schedule('0 2 * * *', async () => {
  // Runs every day at 2am
  try {
    const today = new Date();
    const recurringExpenses = await Expense.find({ isRecurring: true });
    for (const exp of recurringExpenses) {
      // Only add if due (monthly)
      if (exp.recurringFrequency === 'Monthly') {
        const lastAdded = exp.date || exp.createdAt;
        const lastMonth = new Date(lastAdded);
        lastMonth.setMonth(lastMonth.getMonth() + 1);
        if (today >= lastMonth) {
          // Clone expense for this month
          await Expense.create({
            user: exp.user,
            title: exp.title,
            amount: exp.amount,
            category: exp.category,
            description: exp.description,
            date: today,
            paymentMethod: exp.paymentMethod,
            isRecurring: true,
            recurringFrequency: exp.recurringFrequency,
            tags: exp.tags,
            location: exp.location,
            isEssential: exp.isEssential
          });
        }
      }
    }
    console.log('Recurring expenses processed.');
  } catch (err) {
    console.error('Recurring expense automation error:', err);
  }
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Server accessible at: http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please use a different port.`);
  }
});
