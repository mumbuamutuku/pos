import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getSales } from '../api/pos';
import { getInventory } from '../api/inventory';
import { getExpenses } from '../api/expenses'; // You'll need to create this API
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart
} from 'recharts';

const ReportsPage = () => {
  const { currentUser } = useAuth();
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('week');

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesData, inventoryData, expensesData] = await Promise.all([
          getSales(),
          getInventory(),
          getExpenses() // Mock data if API doesn't exist yet
        ]);
        setSales(salesData);
        setInventory(inventoryData);
        setExpenses(expensesData || []); // Handle if expenses API isn't ready
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter data based on time range
  const filterDataByTimeRange = (data, dateField = 'created_at') => {
    const now = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return data.filter(item => new Date(item[dateField]) >= startDate);
  };

  // Check user permissions
  const canAccess = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'manager';
  };

  // Calculate comprehensive report data
  const calculateReportData = () => {
    const filteredSales = filterDataByTimeRange(sales);
    const filteredExpenses = filterDataByTimeRange(expenses);
    
    const lowStockItems = inventory.filter(item => item.stock <= 5);
    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const totalProfit = filteredSales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => {
        const inventoryItem = inventory.find(inv => inv.id === item.inventory_item_id);
        if (!inventoryItem) return itemSum;
        const profitPerItem = (item.price_at_sale - inventoryItem.cost) * item.quantity;
        return itemSum + profitPerItem;
      }, 0);
    }, 0);

    const netProfit = totalProfit - totalExpenses;

    // Sales by category
    const salesByCategory = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const invItem = inventory.find(inv => inv.id === item.inventory_item_id);
        if (!invItem) return;
        const category = invItem.category || "Uncategorized";
        const revenue = item.price_at_sale * item.quantity;
        if (!salesByCategory[category]) {
          salesByCategory[category] = 0;
        }
        salesByCategory[category] += revenue;
      });
    });

    const categoryChartData = Object.entries(salesByCategory).map(([category, amount]) => ({
      category,
      amount: parseFloat(amount.toFixed(2))
    }));

    // Time series data
    const timeSeriesData = {};
    filteredSales.forEach(sale => {
      const date = new Date(sale.created_at).toISOString().split('T')[0];
      if (!timeSeriesData[date]) {
        timeSeriesData[date] = { date, sales: 0, profit: 0, expenses: 0 };
      }
      timeSeriesData[date].sales += sale.total_amount;
      
      // Calculate profit for this sale
      const saleProfit = sale.items.reduce((sum, item) => {
        const invItem = inventory.find(inv => inv.id === item.inventory_item_id);
        if (!invItem) return sum;
        return sum + (item.price_at_sale - invItem.cost) * item.quantity;
      }, 0);
      timeSeriesData[date].profit += saleProfit;
    });

    // Add expenses to time series
    filteredExpenses.forEach(expense => {
      const date = new Date(expense.created_at).toISOString().split('T')[0];
      if (!timeSeriesData[date]) {
        timeSeriesData[date] = { date, sales: 0, profit: 0, expenses: 0 };
      }
      timeSeriesData[date].expenses += expense.amount;
    });

    const timeSeriesChartData = Object.values(timeSeriesData).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    ).map(item => ({
      ...item,
      netProfit: item.profit - item.expenses,
      date: new Date(item.date).toLocaleDateString()
    }));

    // Top selling items
    const itemSales = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const invItem = inventory.find(inv => inv.id === item.inventory_item_id);
        const itemName = invItem ? invItem.name : `Item ${item.inventory_item_id}`;
        if (!itemSales[itemName]) {
          itemSales[itemName] = { name: itemName, quantity: 0, revenue: 0 };
        }
        itemSales[itemName].quantity += item.quantity;
        itemSales[itemName].revenue += item.price_at_sale * item.quantity;
      });
    });

    const topItemsData = Object.values(itemSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Expense breakdown
    const expensesByCategory = {};
    filteredExpenses.forEach(expense => {
      const category = expense.category || "Other";
      if (!expensesByCategory[category]) {
        expensesByCategory[category] = 0;
      }
      expensesByCategory[category] += expense.amount;
    });

    const expenseChartData = Object.entries(expensesByCategory).map(([category, amount]) => ({
      category,
      amount: parseFloat(amount.toFixed(2))
    }));

    // Cashier performance
    const cashierPerformance = {};
    filteredSales.forEach(sale => {
      const cashierId = sale.cashier_id;
      if (!cashierPerformance[cashierId]) {
        cashierPerformance[cashierId] = { cashier: cashierId, sales: 0, transactions: 0 };
      }
      cashierPerformance[cashierId].sales += sale.total_amount;
      cashierPerformance[cashierId].transactions += 1;
    });

    const cashierChartData = Object.values(cashierPerformance).sort((a, b) => b.sales - a.sales);

    return {
      totalSales,
      totalProfit,
      totalExpenses,
      netProfit,
      lowStockItems: lowStockItems.length,
      totalTransactions: filteredSales.length,
      profitMargin: totalSales > 0 ? ((totalProfit / totalSales) * 100) : 0,
      categoryChartData,
      timeSeriesChartData,
      topItemsData,
      expenseChartData,
      cashierChartData
    };
  };

  const reportData = calculateReportData();

  // Color schemes for charts
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb366'];
  const RADIAN = Math.PI / 180;

  // Custom label function for pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (!canAccess()) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h3 className="text-lg font-medium text-gray-700">Access Denied</h3>
        <p className="text-gray-500 mt-2">You don't have permission to view reports</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-4 text-center">Loading reports...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Time range selector */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Business Reports</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
        >
          <option value="day">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
          <p className="text-2xl font-bold text-green-600">KES {reportData.totalSales.toFixed(2)}</p>
          <p className="text-sm text-gray-600">{reportData.totalTransactions} transactions</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500">Gross Profit</h3>
          <p className="text-2xl font-bold text-blue-600">KES {reportData.totalProfit.toFixed(2)}</p>
          <p className="text-sm text-gray-600">{reportData.profitMargin.toFixed(1)}% margin</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-600">KES {reportData.totalExpenses.toFixed(2)}</p>
          <p className="text-sm text-gray-600">Operating costs</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <h3 className="text-sm font-medium text-gray-500">Net Profit</h3>
          <p className={`text-2xl font-bold ${reportData.netProfit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
            KES {reportData.netProfit.toFixed(2)}
          </p>
          <p className="text-sm text-gray-600">After expenses</p>
        </div>
      </div>

      {/* Financial Overview Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Financial Overview</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={reportData.timeSeriesChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`KES ${value.toFixed(2)}`]} />
              <Legend />
              <Area dataKey="sales" stackId="1" stroke="#8884d8" fill="#8884d8" name="Sales" />
              <Bar dataKey="expenses" fill="#ff7300" name="Expenses" />
              <Line type="monotone" dataKey="netProfit" stroke="#82ca9d" strokeWidth={3} name="Net Profit" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Category */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportData.categoryChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {reportData.categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`KES ${value}`, 'Sales']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Expenses Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.expenseChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value) => [`KES ${value}`, 'Expense']} />
                <Bar dataKey="amount" fill="#ff7300" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top Selling Items</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.topItemsData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value) => [`KES ${value}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cashier Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Cashier Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.cashierChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cashier" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  name === 'sales' ? `KES ${value}` : value, 
                  name === 'sales' ? 'Sales' : 'Transactions'
                ]} />
                <Bar dataKey="sales" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Stock Alert */}
      {reportData.lowStockItems > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-medium">Stock Alert!</span> {reportData.lowStockItems} items need restocking.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Sales Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Recent Sales</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sale ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cashier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sales.slice(-10).reverse().map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-sm">{sale.id}</td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(sale.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">{sale.cashier_id}</td>
                  <td className="px-6 py-4 text-sm">
                    {sale.items.map(item => {
                      const invItem = inventory.find(inv => inv.id === item.inventory_item_id);
                      const name = invItem ? invItem.name : `Item ${item.inventory_item_id}`;
                      return `${name} (${item.quantity})`;
                    }).join(', ')}
                  </td>
                  <td className="px-6 py-4 font-semibold">KES {sale.total_amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {sales.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No sales recorded yet
            </div>
          )}
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end space-x-4">
        <button
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          onClick={() => {
            // Implement print functionality
            window.print();
          }}
        >
          Print Report
        </button>
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          onClick={() => {
            // Implement export functionality
            const dataStr = JSON.stringify(reportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = `business-report-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
          }}
        >
          Export Report
        </button>
      </div>
    </div>
  );
};

export default ReportsPage;