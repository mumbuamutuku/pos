import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getSales } from '../api/pos';
import { getInventory } from '../api/inventory';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ReportsPage = () => {
  const { currentUser } = useAuth();
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('week'); // 'day', 'week', 'month', 'year'

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesData, inventoryData] = await Promise.all([
          getSales(),
          getInventory()
        ]);
        setSales(salesData);
        console.log("Sales data:", salesData);
        setInventory(inventoryData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Check user permissions
  const canAccess = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'manager';
  };

  // Calculate report data
  const calculateReportData = () => {
    const lowStockItems = inventory.filter(item => item.stock <= 5);
    const totalSales = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalProfit = sales.reduce((sum, sale) => {
        return sum + sale.items.reduce((itemSum, item) => {
        const inventoryItem = inventory.find(inv => inv.id === item.inventory_item_id);
        if (!inventoryItem) return itemSum; // skip if not found
        const profitPerItem = (item.price_at_sale - inventoryItem.cost) * item.quantity;
        return itemSum + profitPerItem;
        }, 0);
    }, 0);

    // Prepare chart data
    const salesByCategory = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {

        const invItem = inventory.find(inv => inv.id === item.inventory_item_id);
        if (!invItem) return; // skip if not found

        const category = invItem.category || "Uncategorized";
        const price = item.price_at_sale; // from sale record

        if (!salesByCategory[category]) {
        salesByCategory[category] = 0;
        }
        salesByCategory[category] += price * item.quantity;
      });
    });

    const chartData = Object.entries(salesByCategory).map(([category, amount]) => ({
      category,
      amount: parseFloat(amount.toFixed(2))
    }));

    return {
      totalSales,
      totalProfit,
      lowStockItems: lowStockItems.length,
      totalTransactions: sales.length,
      profitMargin: totalSales > 0 ? ((totalProfit / totalSales) * 100) : 0,
      chartData
    };
  };

  const { 
    totalSales, 
    totalProfit, 
    lowStockItems, 
    totalTransactions,
    profitMargin,
    chartData
  } = calculateReportData();

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
      <div className="flex justify-end">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border rounded-lg bg-white"
        >
          <option value="day">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
          <p className="text-2xl font-bold text-green-600">KES {totalSales.toFixed(2)}</p>
          <p className="text-sm text-gray-600">{totalTransactions} transactions</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Profit</h3>
          <p className="text-2xl font-bold text-blue-600">KES {totalProfit.toFixed(2)}</p>
          <p className="text-sm text-gray-600">
            {profitMargin.toFixed(1)}% margin
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Low Stock Items</h3>
          <p className="text-2xl font-bold text-red-600">{lowStockItems}</p>
          <p className="text-sm text-gray-600">Need restocking</p>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(value) => [`KES ${value}`, 'Sales']} />
              <Legend />
              <Bar dataKey="amount" name="Sales" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

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
                <tr key={sale.id}>
                  <td className="px-6 py-4 font-mono text-sm">{sale.id}</td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(sale.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">{sale.cashier_id}</td>
                  <td className="px-6 py-4 text-sm">
                    {/* {sale.items.map(item => `${item.inventory_item_id} (${item.quantity})`).join(', ')} */}
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
      <div className="flex justify-end">
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          onClick={() => {
            // Implement export functionality
            alert('Export functionality will be implemented here');
          }}
        >
          Export Report
        </button>
      </div>
    </div>
  );
};

export default ReportsPage;