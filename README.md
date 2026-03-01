# Student Financial Planner

A comprehensive MERN stack web application designed to help students manage their finances effectively.

## Features

### 🔐 User Authentication
- Secure login and signup with JWT authentication
- Password validation and encryption
- Session management

### 💰 Expense Management
- Record daily, weekly, and monthly expenses
- Categorize expenses (Food, Transportation, Books, etc.)
- Track payment methods and locations
- Duplicate expense detection
- Search and filter capabilities

### 🎯 Financial Goals
- Set savings targets and budget limits
- Track progress with visual indicators
- Goal categories and priorities
- Milestone tracking
- Contribution management

### 📊 Reports & Analytics
- Interactive financial reports with charts
- Export reports in PDF and Excel formats
- Category-wise spending analysis
- Monthly comparisons and trends
- Visual insights and spending patterns

### 🎨 User Experience
- Clean and responsive React-based frontend
- Mobile-friendly design with Tailwind CSS
- Real-time notifications
- Intuitive navigation and user interface

## Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **Chart.js & Recharts** - Data visualization
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

### Additional Features
- **PDF Generation** - Using pdf-lib
- **Excel Export** - Using ExcelJS
- **File Upload** - Using Multer
- **Rate Limiting** - API protection
- **Error Handling** - Comprehensive error management

## Project Structure

```
student-financial-planner/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Expense.js
│   │   └── Goal.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── expenses.js
│   │   ├── goals.js
│   │   └── reports.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validate.js
│   ├── package.json
│   ├── server.js
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Layout/
    │   │   └── UI/
    │   ├── contexts/
    │   ├── pages/
    │   ├── services/
    │   ├── App.js
    │   └── index.js
    ├── public/
    ├── package.json
    └── tailwind.config.js
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd student-financial-planner
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**
   
   Create a `.env` file in the backend directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/student_financial_planner
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=30d
   FRONTEND_URL=http://localhost:3000
   ```

5. **Start the Application**
   
   Backend (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```
   
   Frontend (Terminal 2):
   ```bash
   cd frontend
   npm start
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/api/health

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### Expenses
- `GET /api/expenses` - Get expenses with pagination and filtering
- `POST /api/expenses` - Create new expense
- `GET /api/expenses/:id` - Get single expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/stats/summary` - Get expense statistics

### Goals
- `GET /api/goals` - Get goals with filtering
- `POST /api/goals` - Create new goal
- `GET /api/goals/:id` - Get single goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal
- `POST /api/goals/:id/contribute` - Add contribution to goal
- `POST /api/goals/:id/notes` - Add note to goal
- `GET /api/goals/stats/dashboard` - Get goals dashboard

### Reports
- `GET /api/reports/generate` - Generate and download report (PDF/Excel)
- `GET /api/reports/preview` - Get report data preview
- `GET /api/reports/analytics` - Get advanced analytics

## Features in Detail

### Expense Categories
- Food & Dining 🍽️
- Transportation 🚗
- Accommodation 🏠
- Books & Supplies 📚
- Entertainment 🎬
- Healthcare 🏥
- Clothing 👕
- Technology 💻
- Personal Care 🧴
- Education 🎓
- Miscellaneous 📦

### Goal Types
- Savings 💰
- Budget Limit 📊
- Debt Reduction 💳
- Investment 📈
- Emergency Fund 🚨

### Security Features
- JWT authentication with secure tokens
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS protection
- Helmet security headers

### Error Handling
- Comprehensive error messages
- Validation error feedback
- Network error handling
- Loading states and user feedback
- Toast notifications for user actions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Enhancements

- [ ] Mobile app development (React Native)
- [ ] Real-time notifications
- [ ] Bank account integration
- [ ] Budget alerts and notifications
- [ ] Social features (sharing goals with friends)
- [ ] Advanced analytics and AI insights
- [ ] Multi-currency support improvements
- [ ] Recurring expense automation
- [ ] Receipt scanning with OCR
- [ ] Financial advice and tips

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@studentfinancialplanner.com or create an issue in the repository.

---

**Made with ❤️ for students who want to take control of their finances**
