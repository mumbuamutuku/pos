import { useState, useEffect } from 'react';
import { Search, Plus, User, Phone, Mail, Edit3, Trash2, X } from 'lucide-react';
import { createCustomer, deleteCustomer, getCustomers, updateCustomer } from '../api/customer';

const CustomerManagement = ({ 
  onSelectCustomer, 
  selectedCustomer, 
  onClearCustomer,
  isEmbedded = false 
}) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [customers, setCustomers] = useState([
  //   { id: 1, name: 'John Doe', phone: '+254712345678', email: 'john@email.com', totalPurchases: 25000 },
  //   { id: 2, name: 'Jane Smith', phone: '+254723456789', email: 'jane@email.com', totalPurchases: 15000 },
  //   { id: 3, name: 'Mike Johnson', phone: '+254734567890', email: 'mike@email.com', totalPurchases: 8500 }
  // ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit =async (e) => {
    e.preventDefault();
    if (editingCustomer) {
      const updatedCustomer = updateCustomer(editingCustomer.id, formData)
      setCustomers(customers.map(customer =>
        customer.id === editingCustomer.id
          ? updateCustomer
          : customer
      ));
    } else {
      const newCustomer = {
        id: Date.now(),
        ...formData,
        totalPurchases: 0
      };
      const addedCustomer = await createCustomer(newCustomer);
      setCustomers([...customers, addedCustomer]);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', address: '' });
    setShowForm(false);
    setEditingCustomer(null);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (customerId) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      await deleteCustomer(customerId)
      setCustomers(customers.filter(customer => customer.id !== customerId));
    }
  };

  // Fetch data on component mount
    useEffect(() => {
      const fetchData = async () => {
        try {
          const customerData = await getCustomers();
          setCustomers(Array.isArray(customerData) ? customerData : customerData?.items || []);
          setLoading(false);
        } catch (err) {
          setError(err.message);
          setLoading(false);
        }
      };
      
      fetchData();
    }, []);

  if (loading) {
    return <div className="p-4 text-center">Loading inventory...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  // Embedded version for POS
  if (isEmbedded) {
    return (
      <div className="bg-white rounded-lg border p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Customer</h3>
          {selectedCustomer && (
            <button
              onClick={onClearCustomer}
              className="text-red-600 hover:text-red-800"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        {selectedCustomer ? (
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <User size={20} className="text-blue-600" />
            <div>
              <p className="font-medium text-sm">{selectedCustomer.name}</p>
              <p className="text-xs text-gray-600">{selectedCustomer.phone}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
              />
            </div>
            
            {searchTerm && (
              <div className="max-h-32 overflow-y-auto border rounded-lg">
                {filteredCustomers.map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      onSelectCustomer(customer);
                      setSearchTerm('');
                    }}
                    className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <p className="font-medium text-sm">{customer.name}</p>
                    <p className="text-xs text-gray-600">{customer.phone}</p>
                  </button>
                ))}
                {filteredCustomers.length === 0 && (
                  <p className="p-3 text-sm text-gray-500">No customers found</p>
                )}
              </div>
            )}
            
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600"
            >
              + Add New Customer
            </button>
          </div>
        )}
        
        {/* Quick Add Customer Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">Add New Customer</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Customer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full page version
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customer Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search customers by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">{customers.length}</h3>
          <p className="text-gray-600">Total Customers</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">
            KES {customers.reduce((sum, customer) => sum + customer.totalPurchases, 0).toLocaleString()}
          </h3>
          <p className="text-gray-600">Total Sales</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">
            KES {Math.round(customers.reduce((sum, customer) => sum + customer.totalPurchases, 0) / customers.length).toLocaleString()}
          </h3>
          <p className="text-gray-600">Average Per Customer</p>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Purchases</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User size={20} className="text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 flex items-center gap-1">
                      <Phone size={14} />
                      {customer.phone}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Mail size={14} />
                      {customer.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    KES {customer.totalPurchases.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(customer)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCustomers.length === 0 && (
          <div className="text-center py-8">
            <User size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No customers found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Customer Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCustomer ? 'Update' : 'Add'} Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;