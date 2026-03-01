import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Download, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Target,
  AlertTriangle,
  FileText,
  Eye,
  RefreshCw
} from 'lucide-react';
import { expensesAPI, goalsAPI, reportsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Badge from '../components/UI/Badge';
import Loading from '../components/UI/Loading';
import ExpenseCharts from '../components/Charts/ExpenseCharts';
import toast from 'react-hot-toast';

// Helper function for currency formatting
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

const periodOptions = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

const reportTypeOptions = [
  { value: 'complete', label: 'Complete Report' },
  { value: 'expenses', label: 'Expenses Only' },
  { value: 'goals', label: 'Goals Only' },
];

const BudgetAnalysis = ({ monthlyBudget, totalExpenses, currency }) => {
  const budgetUsed = totalExpenses / monthlyBudget * 100;
  const isOverBudget = budgetUsed > 100;
  const remaining = monthlyBudget - totalExpenses;

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Budget Analysis</h3>
          {isOverBudget && (
            <Badge variant="danger">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Over Budget
            </Badge>
          )}
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Budget Usage</span>
            <span>{budgetUsed.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full ${
                isOverBudget ? 'bg-red-500' : budgetUsed > 80 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(budgetUsed, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">Budget</p>
            <p className="font-semibold text-gray-900">
              {formatCurrency(monthlyBudget, currency)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Spent</p>
            <p className="font-semibold text-gray-900">
              {formatCurrency(totalExpenses, currency)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">
              {isOverBudget ? 'Over' : 'Remaining'}
            </p>
            <p className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(Math.abs(remaining), currency)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

const InsightCard = ({ title, value, change, changeType, icon: Icon, color }) => {
  const isPositive = changeType === 'positive';
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {change && (
              <div className={`flex items-center mt-1 text-sm ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendIcon className="w-4 h-4 mr-1" />
                {change} from last period
              </div>
            )}
          </div>
          <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </Card>
  );
};

const Reports = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    period: 'month',
    reportType: 'complete',
    startDate: '',
    endDate: '',
    format: 'pdf'
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch real analytics data from backend
  const { data: expensesResponse, isLoading: isExpensesLoading, refetch: refetchExpenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expensesAPI.getExpenses({ limit: 1000 }), // Get more expenses
    retry: 1
  });

  const { data: goalsResponse, isLoading: isGoalsLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsAPI.getGoals({ limit: 1000 }), // Get more goals
    retry: 1
  });

  // Extract data from API responses with proper validation
  const expensesData = Array.isArray(expensesResponse?.expenses) ? expensesResponse.expenses : [];
  const goalsData = Array.isArray(goalsResponse?.goals) ? goalsResponse.goals : [];

  // Calculate analytics from real data
  const getAnalyticsFromData = () => {
    if (!expensesData || !goalsData) return null;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthExpenses = expensesData.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });

    const totalExpenses = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const averageTransaction = thisMonthExpenses.length > 0 ? totalExpenses / thisMonthExpenses.length : 0;

    // Category analysis
    const categorySpending = thisMonthExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    const categoryAnalysis = Object.entries(categorySpending)
      .map(([category, amount]) => ({
        _id: category,
        totalAmount: amount,
        count: thisMonthExpenses.filter(e => e.category === category).length
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // Goals analysis
    const activeGoals = goalsData.filter(goal => goal.status === 'Active');
    const completedGoals = goalsData.filter(goal => goal.status === 'Completed');
    const totalTargetAmount = goalsData.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalSavedAmount = goalsData.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const averageProgress = goalsData.length > 0 ? 
      goalsData.reduce((sum, goal) => sum + ((goal.currentAmount / goal.targetAmount) * 100), 0) / goalsData.length : 0;

    // Expense trends - both monthly and daily data
    const monthlyTrends = [];
    const dailyTrends = [];
    
    // Generate monthly trends for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentYear, currentMonth - i, 1);
      const targetMonth = targetDate.getMonth();
      const targetYear = targetDate.getFullYear();
      
      const monthExpenses = expensesData.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === targetMonth && expenseDate.getFullYear() === targetYear;
      });
      
      const totalAmount = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      monthlyTrends.push({
        _id: { month: targetMonth + 1, year: targetYear },
        totalAmount: totalAmount,
        count: monthExpenses.length
      });
    }
    
    // Generate daily trends for the current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayExpenses = thisMonthExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getDate() === day;
      });
      
      const totalAmount = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      if (totalAmount > 0 || day <= new Date().getDate()) {
        dailyTrends.push({
          _id: { month: currentMonth + 1, day: day, year: currentYear },
          totalAmount: totalAmount,
          count: dayExpenses.length
        });
      }
    }

    return {
      expenses: {
        total: totalExpenses,
        count: thisMonthExpenses.length,
        average: averageTransaction,
        byCategory: categorySpending
      },
      goals: {
        total: goalsData.length,
        active: activeGoals.length,
        completed: completedGoals.length,
        totalTargetAmount,
        totalSavedAmount,
        averageProgress
      },
      categoryAnalysis,
      monthlyTrends,
      dailyTrends,
      periodComparison: {
        previous: 0, // Mock for now
        changePercentage: 0
      }
    };
  };

  const analyticsData = getAnalyticsFromData();
  
  // Debug logging
  console.log('Reports - Analytics Data:', analyticsData);
  console.log('Reports - Monthly Trends:', analyticsData?.monthlyTrends);
  console.log('Reports - Daily Trends:', analyticsData?.dailyTrends);

  const handleExportReport = async () => {
    try {
      setIsGenerating(true);
      toast.loading('Generating report...');
      
      // Prepare parameters
      const params = new URLSearchParams({
        period: filters.period,
        type: filters.reportType,
        format: filters.format
      });
      
      if (filters.period === 'custom') {
        params.append('startDate', filters.startDate);
        params.append('endDate', filters.endDate);
      }
      
      // Call the correct backend endpoint
      const response = await fetch(`http://localhost:5001/api/reports/export/pdf?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Get the blob
      const blob = await response.blob();
      
      // Create download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `financial-report-${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success('PDF report downloaded successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.dismiss();
      toast.error('Failed to export report: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewReport = async () => {
    try {
      toast.loading('Generating preview...');
      await refetchExpenses();
      toast.dismiss();
      toast.success('Report preview updated!');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to generate preview');
    }
  };

  const summary = analyticsData || {
    expenses: {
      total: 0,
      count: 0,
      average: 0,
      byCategory: {}
    },
    goals: {
      total: 0,
      active: 0,
      completed: 0,
      totalTargetAmount: 0,
      totalSavedAmount: 0,
      averageProgress: 0
    }
  };

  const monthlyBudget = user?.monthlyBudget || 50000;
  const budgetVariance = monthlyBudget - summary.expenses.total;
  const previousTotal = analyticsData?.periodComparison?.previous || 0;
  const changePercentage = Number(analyticsData?.periodComparison?.changePercentage) || 0;

  if (isExpensesLoading || isGoalsLoading) {
    return <Loading fullScreen text="Loading reports..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600 mt-1">Comprehensive analysis of your financial data</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={handlePreviewReport}
            loading={isExpensesLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
          <Button 
            onClick={handleExportReport}
            loading={isGenerating}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Enhanced Filters */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Select
                label="Time Period"
                options={periodOptions}
                value={filters.period}
                onChange={(e) => setFilters({ ...filters, period: e.target.value })}
              />
            </div>
            <div>
              <Select
                label="Report Type"
                options={reportTypeOptions}
                value={filters.reportType}
                onChange={(e) => setFilters({ ...filters, reportType: e.target.value })}
              />
            </div>
            <div>
              <Select
                label="Export Format"
                options={[
                  { value: 'pdf', label: 'PDF Document' },
                  { value: 'excel', label: 'Excel Spreadsheet' }
                ]}
                value={filters.format}
                onChange={(e) => setFilters({ ...filters, format: e.target.value })}
              />
            </div>
            {filters.period === 'custom' && (
              <>
                <div>
                  <Input
                    label="Start Date"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Input
                    label="End Date"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Enhanced Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <InsightCard
          title="Total Expenses"
          value={formatCurrency(summary.expenses.total, user?.currency)}
          change={changePercentage !== 0 && !isNaN(changePercentage) ? `${Math.abs(Number(changePercentage)).toFixed(1)}% ${changePercentage > 0 ? 'increase' : 'decrease'}` : null}
          changeType={changePercentage <= 0 ? 'positive' : 'negative'}
          icon={DollarSign}
          color="bg-blue-500"
        />
        
        <InsightCard
          title="Transactions"
          value={summary.expenses.count}
          change={`${summary.expenses.count} this period`}
          changeType="positive"
          icon={BarChart3}
          color="bg-green-500"
        />
        
        <InsightCard
          title="Average Transaction"
          value={formatCurrency(summary.expenses.average, user?.currency)}
          change={summary.expenses.count > 0 ? 'Per transaction' : 'No transactions'}
          changeType="positive"
          icon={TrendingUp}
          color="bg-purple-500"
        />
        
        <InsightCard
          title="Budget Status"
          value={formatCurrency(Math.abs(budgetVariance), user?.currency)}
          change={budgetVariance >= 0 ? 'Under budget' : 'Over budget'}
          changeType={budgetVariance >= 0 ? 'positive' : 'negative'}
          icon={Target}
          color={budgetVariance >= 0 ? 'bg-green-500' : 'bg-red-500'}
        />
      </div>

      {/* Goals Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Goals Overview</h3>
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Goals</span>
                <span className="font-semibold text-2xl">{summary.goals.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completed</span>
                <Badge variant="success">{summary.goals.completed}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active</span>
                <Badge variant="info">{summary.goals.active}</Badge>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Completion Rate</span>
                  <span className="font-semibold">
                    {summary.goals.total > 0 ? ((summary.goals.completed / summary.goals.total) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Savings Progress</h3>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress to Goals</span>
                  <span>{Number(summary.goals.averageProgress || 0).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full bg-green-500"
                    style={{ width: `${Math.min(summary.goals.averageProgress, 100)}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Target Amount</span>
                  <span className="font-semibold">
                    {formatCurrency(summary.goals.totalTargetAmount, user?.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saved Amount</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(summary.goals.totalSavedAmount, user?.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Period Comparison</h3>
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Period</span>
                <span className="font-semibold">
                  {formatCurrency(summary.expenses.total, user?.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Previous Period</span>
                <span className="font-semibold">
                  {formatCurrency(previousTotal, user?.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Change</span>
                <div className="flex items-center">
                  {changePercentage !== 0 && (
                    <>
                      {changePercentage > 0 ? (
                        <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                      )}
                      <span className={`font-semibold ${changePercentage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {Math.abs(Number(changePercentage)).toFixed(1)}%
                      </span>
                    </>
                  )}
                  {changePercentage === 0 && (
                    <span className="font-semibold text-gray-500">No change</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Budget Analysis */}
      <BudgetAnalysis
        monthlyBudget={monthlyBudget}
        totalExpenses={summary.expenses.total}
        currency={user?.currency}
      />

      {/* Spending Analytics Charts */}
      <div className="space-y-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Spending Analytics</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Visual insights and trends from your expense data
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Live data</span>
              </div>
            </div>
          </div>
        </Card>

        {analyticsData && (
          <ExpenseCharts
            categoryData={analyticsData.categoryAnalysis?.map(cat => ({
              category: cat._id,
              value: cat.totalAmount,
              count: cat.count || 1
            })) || []}
            monthlyData={analyticsData.monthlyTrends?.map(trend => ({
              month: `${trend._id.month}/${trend._id.year}`,
              total: trend.totalAmount,
              essential: trend.totalAmount * 0.7, // Mock essential amount
              count: trend.count
            })) || []}
            dailyData={analyticsData.dailyTrends?.map(trend => ({
              day: `${trend._id.month}/${trend._id.day}`,
              amount: trend.totalAmount,
              count: trend.count
            })) || []}
            paymentMethodData={[
              { name: 'Cash', value: summary.expenses.total * 0.3 },
              { name: 'Credit Card', value: summary.expenses.total * 0.25 },
              { name: 'Debit Card', value: summary.expenses.total * 0.25 },
              { name: 'Bank Transfer', value: summary.expenses.total * 0.15 },
              { name: 'Digital Wallet', value: summary.expenses.total * 0.05 }
            ]}
            currency={user?.currency || 'INR'}
          />
        )}
      </div>

      {/* Summary and Action Cards Only */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Summary</h3>
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Generate Detailed Reports</h4>
                <p className="text-gray-600 mb-4">
                  Download comprehensive reports with your financial data and analysis.
                </p>
                <p className="text-sm text-gray-500">
                  📊 Interactive charts and analytics are displayed above
                </p>
              </div>
            </div>
          </Card>
        </div>
        
        <div>
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <Eye className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900">View Analytics</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Visual charts and spending insights
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.location.href = '/expenses'}
                    className="w-full"
                  >
                    Go to Charts
                  </Button>
                </div>
                
                <div className="border-t pt-4">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-secondary-600 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900">Data Overview</h4>
                    <div className="text-sm text-gray-600 mt-2 space-y-1">
                      <p>📊 {summary.expenses.count} total expenses</p>
                      <p>🎯 {summary.goals.count} active goals</p>
                      <p>💰 {formatCurrency(summary.expenses.total)} spent</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Enhanced Report Summary */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Detailed Report Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-blue-500" />
                Expense Analysis
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Expenses:</span>
                  <span className="font-medium">
                    {formatCurrency(summary.expenses.total, user?.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transactions:</span>
                  <span className="font-medium">{summary.expenses.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average per Transaction:</span>
                  <span className="font-medium">
                    {formatCurrency(summary.expenses.average, user?.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Top Category:</span>
                  <span className="font-medium">
                    {analyticsData?.categoryAnalysis?.[0]?._id || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Period Change:</span>
                  <span className={`font-medium ${changePercentage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {changePercentage !== 0 && !isNaN(changePercentage) ? `${changePercentage > 0 ? '+' : ''}${Number(changePercentage).toFixed(1)}%` : 'No change'}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-green-500" />
                Goals Performance
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Goals:</span>
                  <span className="font-medium">{summary.goals.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-medium text-green-600">{summary.goals.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Goals:</span>
                  <span className="font-medium text-blue-600">{summary.goals.active}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Target:</span>
                  <span className="font-medium">
                    {formatCurrency(summary.goals.totalTargetAmount, user?.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Saved:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(summary.goals.totalSavedAmount, user?.currency)}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
                Budget Health
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Budget:</span>
                  <span className="font-medium">
                    {formatCurrency(monthlyBudget, user?.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Budget Used:</span>
                  <span className="font-medium">
                    {((summary.expenses.total / monthlyBudget) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining:</span>
                  <span className={`font-medium ${budgetVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(budgetVariance), user?.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={budgetVariance >= 0 ? 'success' : 'danger'}>
                    {budgetVariance >= 0 ? 'On Track' : 'Over Budget'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Average:</span>
                  <span className="font-medium">
                    {formatCurrency(summary.expenses.total / 30, user?.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Report Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Report generated on {new Date().toLocaleDateString()} • 
                  Data period: {filters.period === 'custom' ? 'Custom range' : periodOptions.find(p => p.value === filters.period)?.label}
                </p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  size="small"
                  onClick={handlePreviewReport}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button 
                  variant="outline" 
                  size="small"
                  onClick={() => setFilters({ ...filters, format: filters.format === 'pdf' ? 'excel' : 'pdf' })}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Switch to {filters.format === 'pdf' ? 'Excel' : 'PDF'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Reports;
