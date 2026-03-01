import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Target, CreditCard, DollarSign, Calendar, Plus, ChevronRight } from 'lucide-react';
import { expensesAPI, goalsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/UI/Card';
import Badge from '../components/UI/Badge';
import Loading from '../components/UI/Loading';
import Button from '../components/UI/Button';

// Helper functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

const getCategoryEmoji = (category) => {
  const emojiMap = {
    'food': '🍽️',
    'groceries': '🛒',
    'transportation': '🚗',
    'entertainment': '🎬',
    'shopping': '🛍️',
    'utilities': '⚡',
    'healthcare': '🏥',
    'education': '📚',
    'travel': '✈️',
    'fitness': '💪',
    'subscription': '📱',
    'rent': '🏠',
    'insurance': '🛡️',
    'gas': '⛽',
    'dining': '🍽️',
    'coffee': '☕',
    'bills': '📄',
    'personal': '👤',
    'other': '💳'
  };
  
  // Convert category to lowercase and check for matches
  const lowerCategory = category?.toLowerCase() || '';
  
  // Try exact match first
  if (emojiMap[lowerCategory]) {
    return emojiMap[lowerCategory];
  }
  
  // Try partial matches for common variations
  if (lowerCategory.includes('food') || lowerCategory.includes('restaurant')) return '🍽️';
  if (lowerCategory.includes('grocery') || lowerCategory.includes('market')) return '🛒';
  if (lowerCategory.includes('transport') || lowerCategory.includes('uber') || lowerCategory.includes('taxi')) return '🚗';
  if (lowerCategory.includes('movie') || lowerCategory.includes('entertainment') || lowerCategory.includes('game')) return '🎬';
  if (lowerCategory.includes('shop') || lowerCategory.includes('clothing') || lowerCategory.includes('store')) return '🛍️';
  if (lowerCategory.includes('electric') || lowerCategory.includes('utility') || lowerCategory.includes('water')) return '⚡';
  if (lowerCategory.includes('health') || lowerCategory.includes('medical') || lowerCategory.includes('doctor')) return '🏥';
  if (lowerCategory.includes('education') || lowerCategory.includes('school') || lowerCategory.includes('book')) return '📚';
  if (lowerCategory.includes('travel') || lowerCategory.includes('flight') || lowerCategory.includes('hotel')) return '✈️';
  if (lowerCategory.includes('gym') || lowerCategory.includes('fitness') || lowerCategory.includes('sport')) return '💪';
  if (lowerCategory.includes('subscription') || lowerCategory.includes('netflix') || lowerCategory.includes('spotify')) return '📱';
  if (lowerCategory.includes('rent') || lowerCategory.includes('mortgage') || lowerCategory.includes('housing')) return '🏠';
  if (lowerCategory.includes('insurance')) return '🛡️';
  if (lowerCategory.includes('gas') || lowerCategory.includes('fuel')) return '⛽';
  if (lowerCategory.includes('coffee') || lowerCategory.includes('café')) return '☕';
  if (lowerCategory.includes('bill') || lowerCategory.includes('payment')) return '📄';
  
  // Default emoji for unmatched categories
  return '💳';
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Fetch data
  const { data: expensesResponse, isLoading: expensesLoading, error: expensesError } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expensesAPI.getExpenses({ limit: 100 }), // Get more expenses
    retry: 1,
    select: (data) => {
      console.log('Dashboard - Expenses API response:', data);
      return {
        expenses: data?.expenses || [],
        pagination: data?.pagination || {}
      };
    }
  });

  const { data: goalsResponse, isLoading: goalsLoading, error: goalsError, refetch: refetchGoals } = useQuery({
    queryKey: ['goals'],
    queryFn: () => {
      console.log('Dashboard - Making goals API call...');
      return goalsAPI.getGoals({ limit: 100 }); // Get more goals
    },
    retry: 1,
    staleTime: 0, // Always refetch when mounting
    cacheTime: 0,  // Don't cache
    select: (data) => {
      console.log('Dashboard - Goals API response:', data);
      return {
        goals: data?.goals || []
      };
    }
  });

  // Debug logging
  console.log('Dashboard - Goals Response:', goalsResponse);
  console.log('Dashboard - Goals Array:', goalsResponse?.goals);
  console.log('Dashboard - Goals Loading:', goalsLoading);
  console.log('Dashboard - Goals Error:', goalsError);

  if (expensesLoading || goalsLoading) {
    return <Loading />;
  }

  // Show error if API calls failed
  if (expensesError || goalsError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error loading data</h3>
          <p className="text-red-600 mb-2">
            {expensesError && `Expenses: ${expensesError.message}`}
          </p>
          <p className="text-red-600">
            {goalsError && `Goals: ${goalsError.message}`}
          </p>
          <p className="text-sm text-red-500 mt-2">
            Please make sure you're logged in and the backend server is running.
          </p>
        </div>
      </div>
    );
  }

  // Extract data from API responses with proper validation
  const expensesArray = Array.isArray(expensesResponse?.expenses) ? expensesResponse.expenses : [];
  const goalsArray = Array.isArray(goalsResponse?.goals) ? goalsResponse.goals : [];

  console.log('Dashboard - Processed data:', {
    expensesCount: expensesArray.length,
    goalsCount: goalsArray.length,
    firstExpense: expensesArray[0],
    firstGoal: goalsArray[0]
  });

  // Calculate this month's data
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentDay = new Date().getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  const thisMonthExpenses = expensesArray.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  });

  const thisMonthTotal = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const activeGoals = goalsArray.filter(goal => goal.status === 'Active');
  
  // Calculate total saved from completed goals or savings goals
  const totalSaved = goalsArray
    .filter(goal => goal.category === 'Savings' || goal.status === 'Completed')
    .reduce((sum, goal) => sum + goal.currentAmount, 0);
  
  // Calculate average daily spending for this month
  const avgDailySpending = currentDay > 0 ? thisMonthTotal / currentDay : 0;
  
  // Projected monthly spending
  const projectedMonthlySpending = (thisMonthTotal / currentDay) * daysInMonth;

  // Budget tracking - get from user context or fallback to 50000
  const monthlyBudget = user?.monthlyBudget || 50000;
  const budgetUsed = (thisMonthTotal / monthlyBudget) * 100;
  const remainingBudget = monthlyBudget - thisMonthTotal;

  // Recent transactions (last 5)
  const recentTransactions = expensesArray
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // Recent expenses (last 5 from this month)
  const recentExpenses = thisMonthExpenses
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // Top spending categories
  const categorySpending = thisMonthExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const topCategories = Object.entries(categorySpending)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Quick action handlers
  const handleAddExpense = () => {
    navigate('/expenses?action=add');
  };

  const handleSetGoal = () => {
    navigate('/goals?action=add');
  };

  const handleUpdateBudget = () => {
    navigate('/profile?section=budget');
  };

  const handleViewReports = () => {
    navigate('/reports');
  };

  return (
    <div className="p-6">
      {/* Welcome Back Yashas */}
      <div className="mb-8 flex justify-between items-center p-6 gradient-warm rounded-xl border border-primary-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, Yashas!👋
          </h1>
          <p className="text-gray-600">
            Here's your financial overview for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
          </p>
        </div>
        <Button 
          onClick={() => {
            console.log('Manually refetching goals...');
            refetchGoals();
          }}
          className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
        >
          Refresh Goals
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* This Month Expenses */}
        <Card>
          <div className="p-6 flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-red-600 bg-red-100">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">This Month Expenses</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(thisMonthTotal)}</p>
              <p className="text-xs text-gray-500">
                {thisMonthExpenses.length} transactions
              </p>
            </div>
          </div>
        </Card>

        {/* Avg Daily Spending */}
        <Card>
          <div className="p-6 flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-purple-600 bg-purple-100">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Daily Spending</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(avgDailySpending)}</p>
              <p className="text-xs text-gray-500">
                Day {currentDay} of {daysInMonth}
              </p>
            </div>
          </div>
        </Card>

        {/* Active Goals */}
        <Card>
          <div className="p-6 flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-blue-600 bg-blue-100">
                <Target className="w-6 h-6" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Goals</p>
              <p className="text-2xl font-semibold text-gray-900">{activeGoals.length}</p>
              <p className="text-xs text-gray-500">
                {goalsArray.length} total goals
              </p>
            </div>
          </div>
        </Card>

        {/* Budget Status */}
        <Card>
          <div className="p-6 flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                budgetUsed > 80 ? 'text-red-600 bg-red-100' : 
                budgetUsed > 60 ? 'text-yellow-600 bg-yellow-100' : 
                'text-green-600 bg-green-100'
              }`}>
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Budget Remaining</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(remainingBudget)}</p>
              <p className="text-xs text-gray-500">
                {budgetUsed.toFixed(1)}% used
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              className="flex items-center justify-center space-x-2 p-4"
              onClick={handleAddExpense}
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center justify-center space-x-2 p-4"
              onClick={handleSetGoal}
            >
              <Target className="w-4 h-4" />
              <span>Set Goal</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center justify-center space-x-2 p-4"
              onClick={handleUpdateBudget}
            >
              <DollarSign className="w-4 h-4" />
              <span>Update Budget</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center justify-center space-x-2 p-4"
              onClick={handleViewReports}
            >
              <Calendar className="w-4 h-4" />
              <span>View Reports</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Budget & Spending Insights */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Budget & Spending Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Budget Progress */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-2">Monthly Budget</h3>
              <div className="mb-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Used</span>
                  <span>{budgetUsed.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      budgetUsed > 90 ? 'bg-red-500' : 
                      budgetUsed > 75 ? 'bg-yellow-500' : 
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Spent:</span>
                  <span className="font-medium">{formatCurrency(thisMonthTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining:</span>
                  <span className="font-medium">{formatCurrency(remainingBudget)}</span>
                </div>
              </div>
            </div>

            {/* Projected Spending */}
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
              <h3 className="font-semibold text-gray-900 mb-2">Monthly Projection</h3>
              <p className="text-2xl font-bold text-gray-900 mb-2">
                {formatCurrency(projectedMonthlySpending)}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Based on current spending rate
              </p>
              {projectedMonthlySpending > monthlyBudget && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  ⚠️ May exceed budget by {formatCurrency(projectedMonthlySpending - monthlyBudget)}
                </div>
              )}
            </div>

            {/* Savings Rate */}
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
              <h3 className="font-semibold text-gray-900 mb-2">Total Saved</h3>
              <p className="text-2xl font-bold text-gray-900 mb-2">
                {formatCurrency(totalSaved)}
              </p>
              <p className="text-sm text-gray-600">
                From {goalsArray.filter(g => g.category === 'Savings' || g.status === 'Completed').length} savings goals
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Transactions */}
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
              <button 
                onClick={() => navigate('/expenses')}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            {recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
                        <span className="text-lg">{getCategoryEmoji(transaction.category)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.title}</p>
                        <p className="text-sm text-gray-500">
                          {transaction.category} • {formatDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-red-600">
                      -{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No transactions yet</p>
                <p className="text-sm">Start tracking your expenses</p>
              </div>
            )}
          </div>
        </Card>

        {/* Financial Goals */}
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Financial Goals</h2>
              <button 
                onClick={() => navigate('/goals')}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            {activeGoals.length > 0 ? (
              <div className="space-y-4">
                {activeGoals.slice(0, 3).map((goal) => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100;
                  return (
                    <div key={goal._id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium text-gray-900">{goal.title}</p>
                        <Badge variant={progress >= 100 ? 'success' : 'primary'}>
                          {progress.toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No active goals</p>
                <p className="text-sm">Set financial goals to track progress</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Expenses */}
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Expenses</h2>
              <button 
                onClick={() => navigate('/expenses')}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            {recentExpenses.length > 0 ? (
              <div className="space-y-3">
                {recentExpenses.map((expense, index) => (
                  <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
                        <span className="text-sm">{getCategoryEmoji(expense.category)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{expense.title}</p>
                        <p className="text-sm text-gray-500">{formatDate(expense.date)}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-red-600">
                      -{formatCurrency(expense.amount)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No expenses this month</p>
              </div>
            )}
          </div>
        </Card>

        {/* Top Spending Categories */}
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Top Spending Categories</h2>
              <button 
                onClick={() => navigate('/reports')}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            {topCategories.length > 0 ? (
              <div className="space-y-4">
                {topCategories.map(([category, amount], index) => {
                  const percentage = ((amount / thisMonthTotal) * 100).toFixed(1);
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
                          <span className="text-sm">{getCategoryEmoji(category)}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <p className="font-medium text-gray-900 capitalize">{category}</p>
                            <p className="text-sm text-gray-500">{percentage}%</p>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <p className="ml-4 font-semibold text-gray-900">
                        {formatCurrency(amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No spending data this month</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Goals Overview */}
      {activeGoals.length > 0 && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Goals Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeGoals.map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                const remaining = goal.targetAmount - goal.currentAmount;
                return (
                  <div key={goal._id} className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">{goal.title}</h3>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current:</span>
                        <span className="font-medium">{formatCurrency(goal.currentAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Target:</span>
                        <span className="font-medium">{formatCurrency(goal.targetAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Remaining:</span>
                        <span className="font-medium">{formatCurrency(remaining)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
