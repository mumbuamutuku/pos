import { useState, useEffect } from 'react';
import { Plus, DollarSign, TrendingUp, Calendar, Edit2, Trash2, Search, Filter } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getExpenses, addExpenseItem, updateExpenseItem, deleteExpenseItem } from '../api/expenses';

const ExpensePage = () => {
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [timeFilter, setTimeFilter] = useState('month'); // week, month, year, all
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    amount: '',
    description: ''
  });

  const expenseCategories = [
    'Rent',
    'Utilities',
    'Supplies',
    'Marketing',
    'Staff Salaries',
    'Equipment',
    'Transportation',
    'Insurance',
    'Professional Services',
    'Other'
  ];

  // Fetch expenses on component mount
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const data = await getExpenses();
        console.log("Fetched expenses:", data);
        setExpenses(Array.isArray(data) ? data : data?.items || []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchExpenses();
  }, []);

  // Check user permissions
  const canAccess = (feature) => {
    if (!currentUser) return false;
    
    switch (feature) {
      case 'add_expense':
        return currentUser.role === 'admin' || currentUser.role === 'manager';
      case 'edit_expense':
        return currentUser.role === 'admin' || currentUser.role === 'manager';
      case 'delete_expense':
        return currentUser.role === 'admin';
      default:
        return true;
    }
  };

  // Filter expenses based on time, search, and category
  const getFilteredExpenses = () => {
    let filtered = expenses;

    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (timeFilter) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(expense => 
        new Date(expense.created_at) >= filterDate
      );
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (filterCategory) {
      filtered = filtered.filter(expense => expense.category === filterCategory);
    }

    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  // Calculate summary statistics
  const calculateSummary = () => {
    const filteredExpenses = getFilteredExpenses();
    const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalCount = filteredExpenses.length;
    
    // Calculate average per expense
    const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;
    
    // Calculate by category
    const categoryTotals = {};
    filteredExpenses.forEach(expense => {
      const category = expense.category || 'Other';
      categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
    });
    
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

    // Calculate this month vs last month
    const now = new Date();
    const thisMonth = filteredExpenses.filter(expense => {
      const expenseDate = new Date(expense.created_at);
      return expenseDate.getMonth() === now.getMonth() && 
             expenseDate.getFullYear() === now.getFullYear();
    }).reduce((sum, expense) => sum + expense.amount, 0);

    const lastMonth = filteredExpenses.filter(expense => {
      const expenseDate = new Date(expense.created_at);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return expenseDate.getMonth() === lastMonthDate.getMonth() && 
             expenseDate.getFullYear() === lastMonthDate.getFullYear();
    }).reduce((sum, expense) => sum + expense.amount, 0);

    const monthlyChange = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    return {
      totalAmount,
      totalCount,
      averageAmount,
      topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null,
      monthlyChange,
      thisMonth,
      categoryTotals
    };
  };

  const summary = calculateSummary();

  // Add new expense item
  const handleAddItem = async () => {
    if (!newItem.name || !newItem.category || !newItem.amount) {
      setError('Name, category, and amount are required');
      return;
    }

    try {
      const item = {
        name: newItem.name,
        category: newItem.category,
        amount: parseFloat(newItem.amount),
        description: newItem.description,
        created_by_id: currentUser.id
      };
      
      const addedItem = await addExpenseItem(item);
      setExpenses([addedItem, ...expenses]);
      setNewItem({ name: '', category: '', amount: '', description: '' });
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add expense');
    }
  };

  // Update existing expense item
  const handleUpdateItem = async (id, updates) => {
    try {
      const updatedItem = await updateExpenseItem(id, updates);
      setExpenses(expenses.map(item => 
        item.id === id ? updatedItem : item
      ));
      setEditingItem(null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update expense');
    }
  };

  // Delete expense item
  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await deleteExpenseItem(id);
      setExpenses(expenses.filter(item => item.id !== id));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete expense');
    }
  };

  const filteredExpenses = getFilteredExpenses();

  if (loading) {
    return <div className="p-4 text-center">Loading expenses...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-gray-600">Track and manage your business expenses</p>
        </div>
        {canAccess('add_expense') && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>Add Expense</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">KES {summary.totalAmount.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{summary.totalCount} transactions</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Expense</p>
              <p className="text-2xl font-bold text-gray-900">KES {summary.averageAmount.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Per transaction</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">KES {summary.thisMonth.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className={`text-xs mt-2 ${summary.monthlyChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {summary.monthlyChange >= 0 ? '+' : ''}{summary.monthlyChange.toFixed(1)}% from last month
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Top Category</p>
              <p className="text-lg font-bold text-gray-900">
                {summary.topCategory?.name || 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Filter className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {summary.topCategory ? `KES ${summary.topCategory.amount.toFixed(2)}` : 'No expenses yet'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            {expenseCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setFilterCategory('');
              setTimeFilter('month');
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Add expense form */}
      {showAddForm && canAccess('add_expense') && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Add New Expense</h3>
          {error && <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">{error}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Expense Name *"
              value={newItem.name}
              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <select
              value={newItem.category}
              onChange={(e) => setNewItem({...newItem, category: e.target.value})}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select Category *</option>
              {expenseCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="number"
              placeholder="Amount *"
              step="0.01"
              value={newItem.amount}
              onChange={(e) => setNewItem({...newItem, amount: e.target.value})}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newItem.description}
              onChange={(e) => setNewItem({...newItem, description: e.target.value})}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleAddItem}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Expense
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewItem({ name: '', category: '', amount: '', description: '' });
                setError(null);
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">
            Recent Expenses ({filteredExpenses.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added By</th>
                {(canAccess('edit_expense') || canAccess('delete_expense')) && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.map(expense => (
                <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingItem === expense.id && canAccess('edit_expense') ? (
                      <input
                        type="text"
                        defaultValue={expense.name}
                        className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-indigo-500"
                        onBlur={(e) => handleUpdateItem(expense.id, { name: e.target.value })}
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{expense.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingItem === expense.id && canAccess('edit_expense') ? (
                      <select
                        defaultValue={expense.category}
                        className="px-2 py-1 border rounded focus:ring-2 focus:ring-indigo-500"
                        onChange={(e) => handleUpdateItem(expense.id, { category: e.target.value })}
                      >
                        {expenseCategories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {expense.category || 'Other'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingItem === expense.id && canAccess('edit_expense') ? (
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={expense.amount}
                        className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-indigo-500"
                        onBlur={(e) => handleUpdateItem(expense.id, { amount: parseFloat(e.target.value) })}
                      />
                    ) : (
                      <div className="text-sm font-bold text-red-600">KES {expense.amount.toFixed(2)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingItem === expense.id && canAccess('edit_expense') ? (
                      <input
                        type="text"
                        defaultValue={expense.description || ''}
                        className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-indigo-500"
                        onBlur={(e) => handleUpdateItem(expense.id, { description: e.target.value })}
                      />
                    ) : (
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {expense.description || '-'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(expense.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    User {expense.created_by_id}
                  </td>
                  {(canAccess('edit_expense') || canAccess('delete_expense')) && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex space-x-2">
                        {canAccess('edit_expense') && (
                          <button
                            onClick={() => setEditingItem(editingItem === expense.id ? null : expense.id)}
                            className="text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {canAccess('delete_expense') && (
                          <button
                            onClick={() => handleDeleteItem(expense.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredExpenses.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <DollarSign className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
                <p className="text-gray-600">
                  {expenses.length === 0 
                    ? "Get started by adding your first expense." 
                    : "Try adjusting your filters to see more results."
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default ExpensePage;