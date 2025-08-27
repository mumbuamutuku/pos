import { useState, useEffect } from 'react';
import { Plus, AlertCircle, Save, Edit2, Search, Filter, Package, 
  TrendingUp, DollarSign, BarChart3, Settings, Trash2, Tag,
  Eye, EyeOff, Grid, List } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } from '../api/inventory';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../api/categories';

const InventoryPage = () => {
  const { currentUser } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStock, setFilterStock] = useState('all'); // 'all', 'low', 'out'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'stock', 'price', 'margin'
    
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    cost: ''
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: '#6366f1'
  });

 // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inventoryData, categoriesData] = await Promise.all([
          getInventory(),
          getCategories().catch(() => []) // Fallback if categories API doesn't exist yet
        ]);
        
        setInventory(Array.isArray(inventoryData) ? inventoryData : inventoryData?.items || []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : categoriesData?.items || []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Check user permissions
  const canAccess = (feature) => {
    if (!currentUser) return false;
    
    switch (feature) {
      case 'add_product':
      case 'manage_categories':
        return currentUser.role === 'admin';
      case 'edit_product':
        return currentUser.role === 'admin' || currentUser.role === 'manager';
      case 'delete_product':
        return currentUser.role === 'admin';
      default:
        return true;
    }
  };

  // Filter low stock items
  const lowStockItems = Array.isArray(inventory) 
  ? inventory.filter(item => item.stock <= 5)
  : [];

    // Filter and sort inventory
  const getFilteredInventory = () => {
    let filtered = inventory;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (filterCategory) {
      filtered = filtered.filter(item => item.category === filterCategory);
    }

    // Stock filter
    switch (filterStock) {
      case 'low':
        filtered = filtered.filter(item => item.stock <= 5 && item.stock > 0);
        break;
      case 'out':
        filtered = filtered.filter(item => item.stock === 0);
        break;
      // 'all' shows everything
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'stock':
          return b.stock - a.stock;
        case 'price':
          return b.price - a.price;
        case 'margin':
          const marginA = ((a.price - a.cost) / a.cost) * 100;
          const marginB = ((b.price - b.cost) / b.cost) * 100;
          return marginB - marginA;
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Calculate summary statistics
  const calculateSummary = () => {
    const totalItems = inventory.length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.price * item.stock), 0);
    const lowStockCount = inventory.filter(item => item.stock <= 5 && item.stock > 0).length;
    const outOfStockCount = inventory.filter(item => item.stock === 0).length;
    const totalProfit = inventory.reduce((sum, item) => sum + ((item.price - item.cost) * item.stock), 0);

    return {
      totalItems,
      totalValue,
      lowStockCount,
      outOfStockCount,
      totalProfit
    };
  };

  const summary = calculateSummary();
  const filteredInventory = getFilteredInventory();

  // Category management functions
  const handleAddCategory = async () => {
    if (!newCategory.name) {
      setError('Category name is required');
      return;
    }

    try {
      const addedCategory = await addCategory(newCategory);
      setCategories([...categories, addedCategory]);
      setNewCategory({ name: '', description: '', color: '#6366f1' });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add category');
    }
  };

  const handleUpdateCategory = async (id, updates) => {
    try {
      const updatedCategory = await updateCategory(id, updates);
      setCategories(categories.map(cat => 
        cat.id === id ? updatedCategory : cat
      ));
      setEditingCategory(null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id) => {
    const hasItems = inventory.some(item => item.category === categories.find(c => c.id === id)?.name);
    
    if (hasItems) {
      setError('Cannot delete category with existing items. Move items to another category first.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      await deleteCategory(id);
      setCategories(categories.filter(cat => cat.id !== id));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete category');
    }
  };

  // Add new inventory item
  const handleAddItem = async () => {
    if (!newItem.name || !newItem.category || !newItem.price || !newItem.stock || !newItem.cost) {
      setError('All fields are required');
      return;
    }

    try {
      const item = {
        name: newItem.name,
        category: newItem.category,
        price: parseFloat(newItem.price),
        stock: parseInt(newItem.stock),
        cost: parseFloat(newItem.cost)
      };
      
      const addedItem = await addInventoryItem(item);
      setInventory([...inventory, addedItem]);
      setNewItem({ name: '', category: '', price: '', stock: '', cost: '' });
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add product');
    }
  };

  // Update existing inventory item
  const handleUpdateItem = async (id, updates) => {
    try {
      const updatedItem = await updateInventoryItem(id, updates);
      setInventory(inventory.map(item => 
        item.id === id ? updatedItem : item
      ));
      setEditingItem(null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update product');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await deleteInventoryItem(id);
      setInventory(inventory.filter(item => item.id !== id));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete product');
    }
  };

  // Get category info
  const getCategoryInfo = (categoryName) => {
    return categories.find(cat => cat.name === categoryName) || { color: '#6366f1' };
  };

  if (loading) {
    return <div className="p-4 text-center">Loading inventory...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Manage your products and categories</p>
        </div>
        <div className="flex space-x-3">
          {canAccess('manage_categories') && (
            <button
              onClick={() => setShowCategoryManager(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2 transition-colors"
            >
              <Settings size={20} />
              <span>Manage Categories</span>
            </button>
          )}
          {canAccess('add_product') && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2 transition-colors"
            >
              <Plus size={20} />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Low stock alert */}
      {lowStockItems.length > 0 && (
        <div className="p-4 bg-red-50 border-b">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertCircle size={20} />
            <span className="font-semibold">Low Stock Alert:</span>
          </div>
          <p className="text-red-700 text-sm mt-1">
            {lowStockItems.length} item(s) have low stock (≤5 units)
          </p>
        </div>
      )}
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalItems}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">KES {summary.totalValue.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.lowStockCount}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{summary.outOfStockCount}</p>
            </div>
            <EyeOff className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Profit</p>
              <p className="text-2xl font-bold text-purple-600">KES {summary.totalProfit.toFixed(2)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Level</label>
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Items</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="name">Name</option>
              <option value="stock">Stock Level</option>
              <option value="price">Price</option>
              <option value="margin">Profit Margin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">View</label>
            <div className="flex rounded-lg border">
              <button
                onClick={() => setViewMode('table')}
                className={`flex-1 py-2 px-3 text-sm rounded-l-lg transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List className="h-4 w-4 mx-auto" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`flex-1 py-2 px-3 text-sm rounded-r-lg transition-colors ${
                  viewMode === 'cards' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Grid className="h-4 w-4 mx-auto" />
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              setSearchTerm('');
              setFilterCategory('');
              setFilterStock('all');
              setSortBy('name');
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {summary.lowStockCount > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-medium">Stock Alert!</span> {summary.lowStockCount} items need restocking.
              </p>
            </div>
          </div>
        </div>
      )}

       {/* Category Manager Modal */}
      {showCategoryManager && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Category Management</h3>
              <button
                onClick={() => setShowCategoryManager(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Add New Category */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3">Add New Category</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Category Name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({...newCategory, color: e.target.value})}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleAddCategory}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Add Category
                </button>
              </div>
            </div>

            {/* Existing Categories */}
            <div className="space-y-2">
              <h4 className="font-medium">Existing Categories</h4>
              {categories.map(category => (
                <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    {editingCategory === category.id ? (
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          defaultValue={category.name}
                          className="px-2 py-1 border rounded text-sm"
                          onBlur={(e) => handleUpdateCategory(category.id, { name: e.target.value })}
                        />
                        <input
                          type="text"
                          defaultValue={category.description || ''}
                          placeholder="Description"
                          className="px-2 py-1 border rounded text-sm"
                          onBlur={(e) => handleUpdateCategory(category.id, { description: e.target.value })}
                        />
                      </div>
                    ) : (
                      <div>
                        <span className="font-medium">{category.name}</span>
                        {category.description && (
                          <span className="text-gray-500 text-sm ml-2">({category.description})</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingCategory(editingCategory === category.id ? null : category.id)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <Edit2 size={16} />
                    </button>
                    {canAccess('manage_categories') && (
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add product form */}
      {showAddForm && canAccess('add_product') && (
        <div className="p-6 bg-gray-50 border-b">
          <h3 className="font-semibold mb-4">Add New Product</h3>
          {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Product Name"
              value={newItem.name}
              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              className="px-3 py-2 border rounded-lg"
            />
            <select
              value={newItem.category}
              onChange={(e) => setNewItem({...newItem, category: e.target.value})}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Category *</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Sale Price"
              step="0.01"
              value={newItem.price}
              onChange={(e) => setNewItem({...newItem, price: e.target.value})}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="number"
              placeholder="Initial Stock"
              value={newItem.stock}
              onChange={(e) => setNewItem({...newItem, stock: e.target.value})}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="number"
              placeholder="Cost Price"
              step="0.01"
              value={newItem.cost}
              onChange={(e) => setNewItem({...newItem, cost: e.target.value})}
              className="px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="flex space-x-2 mt-4">
            <button
              onClick={handleAddItem}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Add Product
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewItem({ name: '', category: '', price: '', stock: '', cost: '' });
                setError(null);
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Inventory table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margin</th>
              {(canAccess('edit_product') || canAccess('delete_product')) && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {inventory.map(item => (
              <tr key={item.id} className={item.stock <= 5 ? 'bg-red-50' : ''}>
                <td className="px-6 py-4">
                  {editingItem === item.id && canAccess('edit_product') ? (
                    <input
                      type="text"
                      defaultValue={item.name}
                      className="w-full px-2 py-1 border rounded"
                      onBlur={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                    />
                  ) : (
                    item.name
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {editingItem === item.id && canAccess('edit_product') ? (
                    <select
                      defaultValue={item.category}
                      className="px-2 py-1 border rounded"
                      onChange={(e) => handleUpdateItem(item.id, { category: e.target.value })}
                    >
                      <option value="Whiskey">Whiskey</option>
                      <option value="Vodka">Vodka</option>
                      <option value="Gin">Gin</option>
                      <option value="Rum">Rum</option>
                      <option value="Tequila">Tequila</option>
                      <option value="Champagne">Champagne</option>
                      <option value="Wine">Wine</option>
                      <option value="Cognac">Cognac</option>
                      <option value="Liqueur">Liqueur</option>
                    </select>
                  ) : (
                    item.category
                  )}
                </td>
                <td className="px-6 py-4 font-medium">
                  {editingItem === item.id && canAccess('edit_product') ? (
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={item.price}
                      className="w-full px-2 py-1 border rounded"
                      onBlur={(e) => handleUpdateItem(item.id, { price: parseFloat(e.target.value) })}
                    />
                  ) : (
                    `KES ${item.price.toFixed(2)}`
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {editingItem === item.id && canAccess('edit_product') ? (
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={item.cost}
                      className="w-full px-2 py-1 border rounded"
                      onBlur={(e) => handleUpdateItem(item.id, { cost: parseFloat(e.target.value) })}
                    />
                  ) : (
                    `KES ${item.cost.toFixed(2)}`
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingItem === item.id && canAccess('edit_product') ? (
                    <input
                      type="number"
                      defaultValue={item.stock}
                      className="w-full px-2 py-1 border rounded"
                      onBlur={(e) => handleUpdateItem(item.id, { stock: parseInt(e.target.value) })}
                    />
                  ) : (
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.stock <= 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {item.stock}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm">
                  {(((item.price - item.cost) / item.cost) * 100).toFixed(1)}%
                </td> 
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                {canAccess('edit_product') && (
                    <button
                      onClick={() => setEditingItem(editingItem === item.id ? null : item.id)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      {editingItem === item.id ? <Save size={16} /> : <Edit2 size={16} />}
                    </button>
                )}
                {canAccess('delete_product') && (
                  <button
                    onClick={() =>handleDeleteItem(item.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                </div>
                 </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryPage;