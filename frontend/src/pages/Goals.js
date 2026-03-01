import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { 
  Plus, 
  Target, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { goalsAPI, formatCurrency, formatDate } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Badge from '../components/UI/Badge';
import Loading from '../components/UI/Loading';
import toast from 'react-hot-toast';

const goalTypes = [
  { value: 'Savings', label: 'Savings' },
  { value: 'Budget Limit', label: 'Budget Limit' },
  { value: 'Debt Reduction', label: 'Debt Reduction' },
  { value: 'Investment', label: 'Investment' },
  { value: 'Emergency Fund', label: 'Emergency Fund' },
];

const goalCategories = [
  { value: 'Education', label: 'Education' },
  { value: 'Travel', label: 'Travel' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Emergency', label: 'Emergency' },
  { value: 'Entertainment', label: 'Entertainment' },
  { value: 'Health', label: 'Health' },
  { value: 'Personal Development', label: 'Personal Development' },
  { value: 'Other', label: 'Other' },
];

const priorityOptions = [
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
  { value: 'Critical', label: 'Critical' },
];

const statusOptions = [
  { value: 'Active', label: 'Active' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Paused', label: 'Paused' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const GoalForm = ({ isOpen, onClose, goal = null }) => {
  const queryClient = useQueryClient();
  const isEditing = !!goal;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: goal || {
      category: 'Other',
      priority: 'Medium',
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
    },
  });

  const createMutation = useMutation({
    mutationFn: goalsAPI.createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal created successfully!');
      reset();
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create goal');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => goalsAPI.updateGoal(goal._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal updated successfully!');
      onClose();
    },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update goal');
      },
    }
  );

  const onSubmit = (data) => {
    const goalData = {
      ...data,
      priority: data.priority ? (['Low','Medium','High','Critical'].includes(data.priority) ? data.priority : 'Medium') : 'Medium',
      category: data.category ? data.category : 'Other',
      targetAmount: parseFloat(data.targetAmount),
      currentAmount: parseFloat(data.currentAmount) || 0,
      // Ensure date is in correct format
      targetDate: new Date(data.targetDate).toISOString(),
    };

    console.log('Goal data being sent:', goalData); // Debug log

    if (isEditing) {
      updateMutation.mutate(goalData);
    } else {
      createMutation.mutate(goalData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditing ? 'Edit Goal' : 'Create New Goal'}
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
            label="Goal Title"
            {...register('title', { required: 'Title is required' })}
            error={errors.title?.message}
          />

          <Input
            label="Description"
            {...register('description')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Goal Type"
              options={goalTypes}
              {...register('type', { required: 'Goal type is required' })}
              error={errors.type?.message}
            />
            
            <Select
              label="Category"
              options={goalCategories}
              {...register('category')}
              error={errors.category?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              options={priorityOptions}
              {...register('priority')}
            />
            
            {isEditing ? (
              <Select
                label="Status"
                options={statusOptions}
                {...register('status')}
              />
            ) : (
              <div></div>
            )}
          </div>

          <Input
            label="Target Date"
            type="date"
            min={isEditing ? undefined : new Date().toISOString().split('T')[0]} // Prevent past dates only for new goals
            {...register('targetDate', { 
              required: 'Target date is required',
              validate: isEditing ? undefined : (value) => {
                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (selectedDate <= today) {
                  return 'Target date must be in the future';
                }
                return true;
              }
            })}
            error={errors.targetDate?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Target Amount"
              type="number"
              step="0.01"
              {...register('targetAmount', { 
                required: 'Target amount is required',
                min: { value: 0.01, message: 'Amount must be greater than 0' }
              })}
              error={errors.targetAmount?.message}
            />
            
            <Input
              label="Current Amount"
              type="number"
              step="0.01"
              {...register('currentAmount')}
              error={errors.currentAmount?.message}
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
              {isEditing ? 'Update' : 'Create'} Goal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ContributeForm = ({ isOpen, onClose, goal }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const contributeMutation = useMutation({
    mutationFn: (data) => goalsAPI.addContribution(goal._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Contribution added successfully!');
      reset();
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add contribution');
      },
    }
  );

  const onSubmit = (data) => {
    contributeMutation.mutate({
      ...data,
      amount: parseFloat(data.amount),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Add Contribution to {goal?.title}
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
            label="Contribution Amount"
            type="number"
            step="0.01"
            {...register('amount', { 
              required: 'Amount is required',
              min: { value: 0.01, message: 'Amount must be greater than 0' }
            })}
            error={errors.amount?.message}
          />

          <Input
            label="Note (Optional)"
            {...register('note')}
          />

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
              loading={contributeMutation.isLoading}
            >
              Add Contribution
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const GoalCard = ({ goal, onEdit, onDelete, onContribute, onComplete }) => {
  const { user } = useAuth();
  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const isCompleted = progress >= 100;
  const daysLeft = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
  
  const getStatusBadge = () => {
    if (isCompleted) return <Badge variant="success">Completed</Badge>;
    if (daysLeft < 0) return <Badge variant="danger">Overdue</Badge>;
    if (daysLeft <= 30) return <Badge variant="warning">Due Soon</Badge>;
    return <Badge variant="primary">In Progress</Badge>;
  };

  const getPriorityIcon = () => {
    switch (goal.priority) {
      case 'high': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low': return <TrendingUp className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  return (
    <Card hover className="mb-4">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">{goal.title}</h3>
              {getPriorityIcon()}
            </div>
            <p className="text-sm text-gray-500 mt-1">{goal.category}</p>
            {goal.description && (
              <p className="text-sm text-gray-600 mt-2">{goal.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            <div className="flex space-x-1">
              <Button size="small" variant="ghost" onClick={() => onEdit(goal)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button size="small" variant="ghost" onClick={() => onDelete(goal._id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Current Amount</p>
            <p className="font-semibold text-gray-900">
              {formatCurrency(goal.currentAmount, user?.currency)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Target Amount</p>
            <p className="font-semibold text-gray-900">
              {formatCurrency(goal.targetAmount, user?.currency)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <Calendar className="w-4 h-4 inline mr-1" />
            Target: {formatDate(goal.targetDate)}
            {daysLeft > 0 && <span className="ml-2">({daysLeft} days left)</span>}
          </div>
          <div className="flex space-x-2">
            {!isCompleted && goal.status === 'Active' && (
              <Button
                size="small"
                variant="secondary"
                onClick={() => onComplete(goal._id)}
                loading={false}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Mark Complete
              </Button>
            )}
            <Button
              size="small"
              onClick={() => onContribute(goal)}
              disabled={isCompleted}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Contribution
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

const Goals = () => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [isContributeFormOpen, setIsContributeFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Fetch goals
  const { data: goalsData, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsAPI.getGoals({ limit: 100 }), // Get more goals
    select: (data) => {
      console.log('Goals API response:', data);
      return data; // Return the full response which has { goals: [...], summary: {...} }
    },
    enabled: !!user && isAuthenticated,
    retry: (failureCount, error) => {
      // Don't retry if it's an auth error
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
    onError: (error) => {
      console.error('Goals fetch error:', error);
      if (error?.response?.status === 401) {
        toast.error('Please login to view your goals');
      } else {
        toast.error('Failed to load goals');
      }
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: goalsAPI.deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete goal');
    },
  });

  // Complete goal mutation
  const completeMutation = useMutation({
    mutationFn: (goalId) => {
      console.log('🚀 Mutation starting for goal:', goalId);
      return goalsAPI.completeGoal(goalId);
    },
    onSuccess: (data) => {
      console.log('✅ Goal completion success:', data);
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal marked as completed!');
    },
    onError: (error) => {
      console.error('❌ Goal completion error:', error);
      toast.error(error.response?.data?.message || 'Failed to complete goal');
    },
  });

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setIsGoalFormOpen(true);
  };

  const handleDelete = (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      deleteMutation.mutate(goalId);
    }
  };

  const handleCompleteGoal = (goalId) => {
    console.log('🎯 Completing goal:', goalId);
    completeMutation.mutate(goalId);
  };

  const handleContribute = (goal) => {
    setSelectedGoal(goal);
    setIsContributeFormOpen(true);
  };

  const handleCloseGoalForm = () => {
    setIsGoalFormOpen(false);
    setEditingGoal(null);
  };

  const handleCloseContributeForm = () => {
    setIsContributeFormOpen(false);
    setSelectedGoal(null);
  };

  const goals = goalsData?.goals || goalsData || [];
  
  // Calculate stats directly from goals data
  const stats = {
    totalGoals: goals.length,
    completedGoals: goals.filter(g => g.status === 'Completed').length,
    totalTargetAmount: goals.reduce((sum, goal) => sum + (parseFloat(goal.targetAmount) || 0), 0),
    totalCurrentAmount: goals.reduce((sum, goal) => sum + (parseFloat(goal.currentAmount) || 0), 0),
    activeGoals: goals.filter(g => g.status === 'Active').length,
    pausedGoals: goals.filter(g => g.status === 'Paused').length,
  };

  // Debug logging
  console.log('Goals data:', goals);
  console.log('Calculated stats:', stats);
  console.log('Goals with statuses:', goals.map(g => ({ title: g.title, status: g.status, currentAmount: g.currentAmount, targetAmount: g.targetAmount })));

  // Show loading while checking authentication
  if (!isAuthenticated && !user) {
    return <Loading fullScreen text="Checking authentication..." />;
  }

  if (isLoading) {
    return <Loading fullScreen text="Loading goals..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Financial Goals</h1>
        <Button onClick={() => setIsGoalFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Goal
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Goals</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalGoals}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completedGoals}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Saved</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(stats.totalCurrentAmount || 0, user?.currency)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-info-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Target</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(stats.totalTargetAmount || 0, user?.currency)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Goals List */}
      {goals.length > 0 ? (
        <div>
          {goals.map((goal) => (
            <GoalCard
              key={goal._id}
              goal={goal}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onContribute={handleContribute}
              onComplete={handleCompleteGoal}
            />
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No goals yet
            </h3>
            <p className="text-gray-500 mb-4">
              Set your first financial goal and start tracking your progress towards achieving it.
            </p>
            <Button onClick={() => setIsGoalFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Goal
            </Button>
          </div>
        </Card>
      )}

      {/* Goal Form Modal */}
      <GoalForm
        isOpen={isGoalFormOpen}
        onClose={handleCloseGoalForm}
        goal={editingGoal}
      />

      {/* Contribute Form Modal */}
      <ContributeForm
        isOpen={isContributeFormOpen}
        onClose={handleCloseContributeForm}
        goal={selectedGoal}
      />
    </div>
  );
};

export default Goals;
