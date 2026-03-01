import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { 
  Plus, 
  Filter, 
  Edit, 
  Trash2, 
  DollarSign,
  TrendingUp,
  PieChart,
  BarChart3,
  Target
} from 'lucide-react';
import { expensesAPI, formatCurrency, formatDate, getCategoryIcon } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Badge from '../components/UI/Badge';
import Loading from '../components/UI/Loading';
import ExpenseCharts from '../components/Charts/ExpenseCharts';
import toast from 'react-hot-toast';

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'Food & Dining', label: 'Food & Dining' },
  { value: 'Transportation', label: 'Transportation' },
  { value: 'Accommodation', label: 'Accommodation' },
  { value: 'Books & Supplies', label: 'Books & Supplies' },
  { value: 'Entertainment', label: 'Entertainment' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Clothing', label: 'Clothing' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Personal Care', label: 'Personal Care' },
  { value: 'Education', label: 'Education' },
  { value: 'Miscellaneous', label: 'Miscellaneous' },
];

const paymentMethodOptions = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Credit Card', label: 'Credit Card' },
  { value: 'Debit Card', label: 'Debit Card' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
  { value: 'Digital Wallet', label: 'Digital Wallet' },
  { value: 'Other', label: 'Other' },
];

const ExpenseForm = ({ isOpen, onClose, expense = null }) => {
  const queryClient = useQueryClient();
  const isEditing = !!expense;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: expense || {
      category: 'Food & Dining',
      paymentMethod: 'Cash',
      isEssential: true,
      date: new Date().toISOString().split('T')[0],
    },
  });

  const createMutation = useMutation({
    mutationFn: expensesAPI.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense added successfully!');
      reset();
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add expense');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => expensesAPI.updateExpense(expense._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense updated successfully!');
      onClose();
    },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update expense');
      },
    }
  );

  const onSubmit = (data) => {
    const expenseData = {
      ...data,
      amount: parseFloat(data.amount),
      tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
      isEssential: data.isEssential === 'true',
    };

    if (isEditing) {
      updateMutation.mutate(expenseData);
    } else {
      createMutation.mutate(expenseData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditing ? 'Edit Expense' : 'Add New Expense'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Expense Title"
            {...register('title', { required: 'Title is required' })}
            error={errors.title?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              step="0.01"
              {...register('amount', { 
                required: 'Amount is required',
                min: { value: 0.01, message: 'Amount must be greater than 0' }
              })}
              error={errors.amount?.message}
            />
            
            <Select
              label="Category"
              options={categoryOptions.slice(1)}
              {...register('category', { required: 'Category is required' })}
              error={errors.category?.message}
            />
          </div>

          <Input
            label="Description (Optional)"
            {...register('description')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              {...register('date', { required: 'Date is required' })}
              error={errors.date?.message}
            />
            
            <Select
              label="Payment Method"
              options={paymentMethodOptions}
              {...register('paymentMethod')}
            />
          </div>

          <Input
            label="Location (Optional)"
            {...register('location')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Essential?"
              options={[
                { value: 'true', label: 'Essential' },
                { value: 'false', label: 'Non-Essential' }
              ]}
              {...register('isEssential')}
            />
            
            <Input
              label="Tags (comma-separated)"
              placeholder="food, lunch, restaurant"
              {...register('tags')}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createMutation.isLoading || updateMutation.isLoading}
            >
              {isEditing ? 'Update' : 'Add'} Expense
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ExpenseCard = ({ expense, onEdit, onDelete }) => {
  const { user } = useAuth();

  return (
    <Card hover className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-2xl">
            {getCategoryIcon(expense.category)}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{expense.title}</h3>
            <p className="text-sm text-gray-500">{expense.category}</p>
            {expense.description && (
              <p className="text-sm text-gray-600 mt-1">{expense.description}</p>
            )}
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-xs text-gray-500">
                📅 {formatDate(expense.date)}
              </span>
              <span className="text-xs text-gray-500">
                💳 {expense.paymentMethod}
              </span>
              {expense.location && (
                <span className="text-xs text-gray-500">
                  📍 {expense.location}
                </span>
              )}
            </div>
            {expense.tags && expense.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {expense.tags.map((tag, index) => (
                  <Badge key={index} variant="primary" size="small">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
            -{formatCurrency(expense.amount, user?.currency)}
          </p>
          <Badge variant={expense.isEssential ? 'success' : 'warning'} size="small">
            {expense.isEssential ? 'Essential' : 'Non-Essential'}
          </Badge>
          <div className="flex space-x-1 mt-2">
            <Button size="small" variant="ghost" onClick={() => onEdit(expense)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button size="small" variant="ghost" onClick={() => onDelete(expense._id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

const Expenses = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'charts'

  console.log('👤 Current user:', user);
  console.log('👤 User email:', user?.email);
  console.log('👤 User ID:', user?._id);
  
  // Force refresh if no user data
  useEffect(() => {
    if (!user) {
      console.log('🔄 No user found, user might need to log in again');
    } else {
      console.log('✅ User authenticated:', user.email);
    }
  }, [user]);

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    page: 1,
    limit: 100, // Increased to show more expenses
  });

  // Fetch expenses
  const { data: expensesData, isLoading, error: expensesError } = useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => {
      // Filter out empty values to avoid validation errors
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([key, value]) => {
          if (key === 'page' || key === 'limit') return true; // Always include pagination
          return value !== '' && value != null; // Exclude empty strings and null/undefined
        })
      );
      console.log('🧹 Clean filters being sent:', cleanFilters);
      return expensesAPI.getExpenses(cleanFilters);
    },
    select: (data) => {
      console.log('🔍 Raw API response:', data);
      console.log('🔍 API response structure:', {
        expensesLength: data?.expenses?.length || 0,
        expenses: data?.expenses,
        pagination: data?.pagination
      });
      console.log('🔍 Returning expenses:', data?.expenses);
      console.log('🔍 Type of returned expenses:', typeof data?.expenses);
      console.log('🔍 Array.isArray(expenses):', Array.isArray(data?.expenses));
      return {
        expenses: data?.expenses || [],
        pagination: data?.pagination || {}
      };
    },
    keepPreviousData: true,
    onError: (error) => {
      console.error('❌ Expenses API error:', error);
    },
  });

  // Fetch expense statistics
  const { data: statsData } = useQuery({
    queryKey: ['expense-stats'],
    queryFn: () => expensesAPI.getExpenseStats({ period: 'month' }),
    select: (data) => data.data,
  });

  // Generate chart data from real expenses
  const generateChartData = (expenses) => {
    console.log('📊 generateChartData called with:', expenses);
    console.log('📊 Type of expenses:', typeof expenses);
    console.log('📊 Array.isArray(expenses):', Array.isArray(expenses));
    console.log('📊 expenses?.length:', expenses?.length);
    
    if (!expenses || expenses.length === 0) {
      console.log('❌ No expenses data available for charts');
      return {
        categoryData: [],
        monthlyData: [],
        dailyData: [],
        paymentMethodData: []
      };
    }

    console.log('📅 Current date:', new Date());
    console.log('📅 Sample expense dates:', expenses.slice(0, 3).map(e => ({ title: e.title, date: e.date })));

    // Get current date info for monthly calculations
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Get the most recent month that has data instead of only current month
    const expenseDates = expenses.map(e => new Date(e.date)).sort((a, b) => b - a);
    const mostRecentDate = expenseDates[0];
    const targetMonth = mostRecentDate ? mostRecentDate.getMonth() : currentMonth;
    const targetYear = mostRecentDate ? mostRecentDate.getFullYear() : currentYear;
    
    console.log('📅 Using target month/year:', { targetMonth, targetYear });
    
    const targetMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === targetMonth && expenseDate.getFullYear() === targetYear;
    });

    console.log('📊 Target month expenses count:', targetMonthExpenses.length);

    // Category data
    const categorySpending = targetMonthExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || { total: 0, count: 0 });
      acc[expense.category].total += expense.amount;
      acc[expense.category].count += 1;
      return acc;
    }, {});

    const categoryData = Object.entries(categorySpending)
      .map(([category, data]) => ({
        category,
        value: data.total,
        count: data.count
      }))
      .sort((a, b) => b.value - a.value);

    // Monthly data - last 6 months
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentYear, currentMonth - i, 1);
      const targetMonth = targetDate.getMonth();
      const targetYear = targetDate.getFullYear();
      
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === targetMonth && expenseDate.getFullYear() === targetYear;
      });
      
      const totalAmount = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const monthName = targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      monthlyData.push({
        month: monthName,
        total: totalAmount,
        essential: totalAmount * 0.7, // Mock essential vs non-essential split
        nonEssential: totalAmount * 0.3,
        count: monthExpenses.length
      });
    }

    // Daily data for current month
    const dailySpending = {};
    targetMonthExpenses.forEach(expense => {
      const day = new Date(expense.date).getDate();
      const dayKey = `${targetMonth + 1}/${day}`;
      dailySpending[dayKey] = (dailySpending[dayKey] || { total: 0, count: 0 });
      dailySpending[dayKey].total += expense.amount;
      dailySpending[dayKey].count += 1;
    });

    const dailyData = Object.entries(dailySpending)
      .map(([day, data]) => ({
        day,
        amount: data.total,
        count: data.count
      }))
      .sort((a, b) => {
        const [, dayA] = a.day.split('/').map(Number);
        const [, dayB] = b.day.split('/').map(Number);
        return dayA - dayB;
      });

    // Payment method data
    const paymentMethodSpending = targetMonthExpenses.reduce((acc, expense) => {
      const method = expense.paymentMethod || 'Cash';
      acc[method] = (acc[method] || { total: 0, count: 0 });
      acc[method].total += expense.amount;
      acc[method].count += 1;
      return acc;
    }, {});

    const paymentMethodData = Object.entries(paymentMethodSpending)
      .map(([name, data]) => ({
        name,
        value: data.total,
        count: data.count
      }));

    return {
      categoryData,
      monthlyData,
      dailyData,
      paymentMethodData
    };
  };

  // Fetch chart data using real expenses
  const { data: chartData, isLoading: isChartLoading } = useQuery({
    queryKey: ['expense-charts', expensesData?.expenses],
    queryFn: () => {
      console.log('🚀 Generating chart data from expenses...');
      const expensesList = expensesData?.expenses || [];
      console.log('📋 Raw expenses data:', expensesList);
      console.log('📋 Type of expensesData:', typeof expensesList);
      console.log('📋 Array.isArray(expensesData):', Array.isArray(expensesList));
      console.log('📋 Number of expenses:', expensesList?.length || 0);
      console.log('📋 First expense sample:', expensesList?.[0]);
      const realChartData = generateChartData(expensesList);
      console.log('📊 Generated chart data:', realChartData);
      console.log('📊 Category data length:', realChartData?.categoryData?.length || 0);
      console.log('📊 Monthly data length:', realChartData?.monthlyData?.length || 0);
      console.log('📊 Daily data length:', realChartData?.dailyData?.length || 0);
      return Promise.resolve({ data: realChartData });
    },
    enabled: !!expensesData?.expenses && Array.isArray(expensesData.expenses),
    select: (data) => {
      console.log('📊 Chart data selected:', data);
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: expensesAPI.deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete expense');
    },
  });

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleDelete = (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteMutation.mutate(expenseId);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingExpense(null);
  };

  // Use stats data for summary instead of filtered results
  const expenses = expensesData?.expenses || [];
  const pagination = expensesData?.pagination || {};
  
  // Calculate summary from actual expenses data
  const summary = expenses.length > 0 ? {
    totalAmount: expenses.reduce((sum, expense) => sum + expense.amount, 0),
    totalCount: expenses.length,
    averageAmount: expenses.reduce((sum, expense) => sum + expense.amount, 0) / expenses.length
  } : { totalAmount: 0, averageAmount: 0, totalCount: 0 };

  console.log('🔍 expensesData:', expensesData);
  console.log('📝 expenses array:', expenses);
  console.log('📊 pagination:', pagination);
  console.log('🚨 expensesError:', expensesError);

  if (isLoading) {
    return <Loading fullScreen text="Loading expenses..." />;
  }

  if (expensesError) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error loading expenses
            </h3>
            <p className="text-gray-500 mb-4">
              {expensesError?.response?.data?.message || expensesError?.message || 'Something went wrong'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Button
              size="small"
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('list')}
              className="px-3 py-1"
            >
              <Filter className="w-4 h-4 mr-1" />
              List
            </Button>
            <Button
              size="small"
              variant={viewMode === 'charts' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('charts')}
              className="px-3 py-1"
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Charts
            </Button>
          </div>
          
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Charts View */}
      {viewMode === 'charts' && (
        <div className="space-y-6">
          {/* Spending Analytics Header */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Spending Analytics</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Comprehensive insights into your spending patterns and trends
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Real-time data</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Key Insights Cards */}
          {isChartLoading ? (
            <Loading text="Loading analytics..." />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Spent</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {formatCurrency(
                            chartData?.categoryData?.reduce((sum, cat) => sum + cat.value, 0) || 0,
                            user?.currency
                          )}
                        </p>
                        <div className="flex items-center mt-1 text-sm text-blue-600">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          This period
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Transactions</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {chartData?.categoryData?.reduce((sum, cat) => sum + cat.count, 0) || 0}
                        </p>
                        <div className="flex items-center mt-1 text-sm text-green-600">
                          <BarChart3 className="w-4 h-4 mr-1" />
                          Total count
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Avg Transaction</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {formatCurrency(
                            chartData?.categoryData?.length > 0 
                              ? chartData.categoryData.reduce((sum, cat) => sum + cat.value, 0) / 
                                chartData.categoryData.reduce((sum, cat) => sum + cat.count, 0)
                              : 0,
                            user?.currency
                          )}
                        </p>
                        <div className="flex items-center mt-1 text-sm text-purple-600">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          Per expense
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Top Category</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {chartData?.categoryData?.[0]?.category || 'N/A'}
                        </p>
                        <div className="flex items-center mt-1 text-sm text-orange-600">
                          <Target className="w-4 h-4 mr-1" />
                          Highest spending
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Category Insights Card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Insights</h3>
                    
                    {chartData?.categoryData?.[0] && (
                      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">Top Spending Category</h4>
                            <p className="text-sm text-gray-600">{chartData.categoryData[0].category}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(chartData.categoryData[0].value, user?.currency)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {((chartData.categoryData[0].value / chartData.categoryData.reduce((sum, cat) => sum + cat.value, 0)) * 100).toFixed(1)}% of total
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {chartData?.categoryData?.slice(0, 5).map((category, index) => {
                        const totalSpent = chartData.categoryData.reduce((sum, cat) => sum + cat.value, 0);
                        const percentage = (category.value / totalSpent) * 100;
                        return (
                          <div key={category.category} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 rounded-full bg-blue-500" />
                              <span className="text-sm font-medium text-gray-900">
                                {category.category}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                {formatCurrency(category.value, user?.currency)}
                              </p>
                              <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>

                {/* Monthly Trend Summary */}
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
                    <div className="space-y-4">
                      {chartData?.monthlyData?.slice(-3).reverse().map((month, index) => (
                        <div key={month.month} className="flex justify-between items-center">
                          <span className="text-gray-600">{month.month}</span>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(month.total, user?.currency)}
                            </p>
                            <p className="text-xs text-gray-500">{month.count} transactions</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {chartData?.monthlyData?.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">3-Month Average:</span>
                          <span className="font-medium">
                            {formatCurrency(
                              chartData.monthlyData.slice(-3).reduce((sum, m) => sum + m.total, 0) / 3,
                              user?.currency
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Payment Method Summary */}
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
                    <div className="space-y-3">
                      {chartData?.paymentMethodData?.map((method, index) => {
                        const totalPayments = chartData.paymentMethodData.reduce((sum, m) => sum + m.value, 0);
                        const percentage = (method.value / totalPayments) * 100;
                        return (
                          <div key={method.name} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 rounded-full bg-green-500" />
                              <span className="text-sm font-medium text-gray-900">
                                {method.name}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                {formatCurrency(method.value, user?.currency)}
                              </p>
                              <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {chartData?.paymentMethodData?.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-gray-600">
                          Most used: <span className="font-medium">{chartData.paymentMethodData[0]?.name}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Charts Component */}
              <ExpenseCharts
                categoryData={chartData?.categoryData || []}
                monthlyData={chartData?.monthlyData || []}
                dailyData={chartData?.dailyData || []}
                paymentMethodData={chartData?.paymentMethodData || []}
                currency={user?.currency || 'INR'}
              />
            </>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-danger-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-danger-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total This Month</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(summary.totalAmount || 0, user?.currency)}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                  <p className="text-2xl font-semibold text-gray-900">{summary.totalCount || 0}</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                  <PieChart className="w-6 h-6 text-warning-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Average Amount</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(summary.averageAmount || 0, user?.currency)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search expenses..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                />
              </div>
              <div className="w-full md:w-48">
                <Select
                  options={categoryOptions}
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
                />
              </div>
            </div>
          </Card>

          {/* Expenses List */}
          {expenses.length > 0 ? (
            <div>
              {expenses.map((expense) => (
                <ExpenseCard
                  key={expense._id}
                  expense={expense}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center space-x-2 mt-6">
                  <Button
                    variant="secondary"
                    disabled={!pagination.hasPrevPage}
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  >
                    Previous
                  </Button>
                  <span className="px-4 py-2 text-sm text-gray-700">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    disabled={!pagination.hasNextPage}
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💳</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No expenses found
                </h3>
                <p className="text-gray-500 mb-4">
                  Start tracking your expenses by adding your first expense.
                </p>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Expense
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Expense Form Modal */}
      <ExpenseForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        expense={editingExpense}
      />
    </div>
  );
};

export default Expenses;
