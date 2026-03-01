import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, BarChart3, Activity, DollarSign } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';

// Color palette for charts
const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, currency = 'INR' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {`${entry.dataKey}: ${entry.dataKey.includes('Amount') || entry.dataKey.includes('total') || entry.dataKey.includes('value') ? 
              new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(entry.value) : 
              entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Format currency helper
const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const ExpenseCharts = ({ 
  categoryData = [], 
  monthlyData = [], 
  dailyData = [], 
  paymentMethodData = [],
  currency = 'INR' 
}) => {
  const [activeChart, setActiveChart] = useState('category');

  console.log('📊 ExpenseCharts received data:', {
    categoryData: categoryData?.length || 0,
    monthlyData: monthlyData?.length || 0,
    dailyData: dailyData?.length || 0,
    paymentMethodData: paymentMethodData?.length || 0
  });

  // Chart selection buttons
  const chartTypes = [
    { id: 'category', label: 'Categories', icon: PieIcon },
    { id: 'monthly', label: 'Monthly Trends', icon: BarChart3 },
    { id: 'daily', label: 'Daily Spending', icon: Activity },
    { id: 'payment', label: 'Payment Methods', icon: DollarSign }
  ];

  // Data validation and default messages
  const hasData = categoryData.length > 0 || monthlyData.length > 0 || dailyData.length > 0 || paymentMethodData.length > 0;

  if (!hasData) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-500 mb-4">
            Add some expenses to see beautiful charts and analytics here.
          </p>
          <div className="flex justify-center">
            <Button onClick={() => window.location.href = '/expenses'}>
              Add Expenses
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Category Pie Chart
  const CategoryChart = () => {
    if (!categoryData || categoryData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No category data available</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip currency={currency} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Category Breakdown</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {categoryData.map((item, index) => (
              <div key={item.category} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium">{item.category}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(item.value, currency)}</p>
                  <p className="text-xs text-gray-500">{item.count} transactions</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Monthly Trends Bar Chart
  const MonthlyChart = () => {
    if (!monthlyData || monthlyData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No monthly data available</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => formatCurrency(value, currency)} />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Legend />
            <Bar dataKey="total" fill="#3B82F6" name="Total Spending" radius={[4, 4, 0, 0]} />
            {monthlyData[0]?.essential !== undefined && (
              <>
                <Bar dataKey="essential" fill="#10B981" name="Essential" radius={[4, 4, 0, 0]} />
                <Bar dataKey="nonEssential" fill="#F59E0B" name="Non-Essential" radius={[4, 4, 0, 0]} />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {monthlyData.slice(-3).reverse().map((month, index) => (
            <Card key={month.month} className="p-4">
              <div className="text-center">
                <h5 className="font-semibold text-gray-900">{month.month}</h5>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {formatCurrency(month.total, currency)}
                </p>
                <p className="text-sm text-gray-500 mt-1">{month.count} transactions</p>
                {month.essential && (
                  <div className="mt-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-green-600">Essential: {formatCurrency(month.essential, currency)}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // Daily Spending Line Chart
  const DailyChart = () => {
    if (!dailyData || dailyData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No daily data available</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis tickFormatter={(value) => formatCurrency(value, currency)} />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Area 
              type="monotone" 
              dataKey="amount" 
              stroke="#8B5CF6" 
              fill="#8B5CF6" 
              fillOpacity={0.3}
              name="Daily Spending"
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <p className="text-sm text-gray-500">Total Days</p>
            <p className="text-xl font-bold text-gray-900">{dailyData.length}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm text-gray-500">Avg Daily</p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(
                dailyData.reduce((sum, day) => sum + day.amount, 0) / dailyData.length,
                currency
              )}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm text-gray-500">Highest Day</p>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(Math.max(...dailyData.map(d => d.amount)), currency)}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm text-gray-500">Total Transactions</p>
            <p className="text-xl font-bold text-purple-600">
              {dailyData.reduce((sum, day) => sum + day.count, 0)}
            </p>
          </Card>
        </div>
      </div>
    );
  };

  // Payment Methods Radial Chart
  const PaymentChart = () => {
    if (!paymentMethodData || paymentMethodData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No payment method data available</p>
        </div>
      );
    }

    // Prepare data for radial chart
    const radialData = paymentMethodData.map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length]
    }));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={radialData}>
              <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
              <Tooltip content={<CustomTooltip currency={currency} />} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Payment Method Usage</h4>
          <div className="space-y-3">
            {paymentMethodData.map((item, index) => {
              const total = paymentMethodData.reduce((sum, method) => sum + method.value, 0);
              const percentage = (item.value / total) * 100;
              return (
                <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(item.value, currency)}</p>
                    <p className="text-sm text-gray-500">{percentage.toFixed(1)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (activeChart) {
      case 'category':
        return <CategoryChart />;
      case 'monthly':
        return <MonthlyChart />;
      case 'daily':
        return <DailyChart />;
      case 'payment':
        return <PaymentChart />;
      default:
        return <CategoryChart />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Chart Navigation */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Expense Analytics</h2>
            <p className="text-sm text-gray-500 mt-1">Interactive charts and visualizations</p>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">Live Data</span>
          </div>
        </div>

        {/* Chart Type Selector */}
        <div className="flex flex-wrap gap-2">
          {chartTypes.map((chart) => {
            const Icon = chart.icon;
            return (
              <Button
                key={chart.id}
                variant={activeChart === chart.id ? 'primary' : 'secondary'}
                size="small"
                onClick={() => setActiveChart(chart.id)}
                className="flex items-center space-x-2"
              >
                <Icon className="w-4 h-4" />
                <span>{chart.label}</span>
              </Button>
            );
          })}
        </div>
      </Card>

      {/* Chart Content */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {chartTypes.find(c => c.id === activeChart)?.label} Analysis
          </h3>
          <p className="text-sm text-gray-500">
            {activeChart === 'category' && 'Breakdown of spending by categories'}
            {activeChart === 'monthly' && 'Monthly spending trends and patterns'}
            {activeChart === 'daily' && 'Daily spending activity and distribution'}
            {activeChart === 'payment' && 'Payment method preferences and usage'}
          </p>
        </div>
        
        {renderChart()}
      </Card>

      {/* Summary Stats */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Total Categories</p>
            <p className="text-2xl font-bold text-blue-700">{categoryData.length}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Monthly Data Points</p>
            <p className="text-2xl font-bold text-green-700">{monthlyData.length}</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Daily Records</p>
            <p className="text-2xl font-bold text-purple-700">{dailyData.length}</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-600 font-medium">Payment Methods</p>
            <p className="text-2xl font-bold text-orange-700">{paymentMethodData.length}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ExpenseCharts;
