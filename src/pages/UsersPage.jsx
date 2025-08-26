import { useState, useEffect } from 'react';
import { UserPlus, Edit2, Save, Trash2, User, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getUsers, createUser, updateUser, deleteUser } from '../api/users';

const UsersPage = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'cashier',
    full_name: ''
  });

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin';

  // Handle add new user
  const handleAddUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      setError('Username, email and password are required');
      return;
    }

    try {
      const createdUser = await createUser(newUser);
      setUsers([...users, createdUser]);
      setNewUser({
        username: '',
        email: '',
        password: '',
        role: 'cashier',
        full_name: ''
      });
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user');
    }
  };

  // Handle update user
  const handleUpdateUser = async (userId, updates) => {
    try {
      const updatedUser = await updateUser(userId, updates);
      setUsers(users.map(user => 
        user.id === userId ? updatedUser : user
      ));
      setEditingUserId(null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update user');
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
        setError(null);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to delete user');
      }
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h3 className="text-lg font-medium text-gray-700">Access Denied</h3>
        <p className="text-gray-500 mt-2">Only administrators can manage users</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-4 text-center">Loading users...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">User Management</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
          >
            <UserPlus size={20} />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="p-6 bg-gray-50 border-b">
          <h3 className="font-semibold mb-4">Add New User</h3>
          {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  placeholder="Enter password"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="cashier">Cashier</option>
                <option value="inventory_staff">Inventory Staff</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={newUser.full_name}
                onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter full name"
              />
            </div>
          </div>
          <div className="flex space-x-2 mt-4">
            <button
              onClick={handleAddUser}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Add User
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewUser({
                  username: '',
                  email: '',
                  password: '',
                  role: 'cashier',
                  full_name: ''
                });
                setError(null);
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4">
                  {editingUserId === user.id ? (
                    <input
                      type="text"
                      defaultValue={user.username}
                      className="w-full px-2 py-1 border rounded"
                      onBlur={(e) => handleUpdateUser(user.id, { username: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <User size={16} className="text-gray-400" />
                      <span>{user.username}</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingUserId === user.id ? (
                    <input
                      type="email"
                      defaultValue={user.email}
                      className="w-full px-2 py-1 border rounded"
                      onBlur={(e) => handleUpdateUser(user.id, { email: e.target.value })}
                    />
                  ) : (
                    user.email
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingUserId === user.id ? (
                    <input
                      type="text"
                      defaultValue={user.full_name}
                      className="w-full px-2 py-1 border rounded"
                      onBlur={(e) => handleUpdateUser(user.id, { full_name: e.target.value })}
                    />
                  ) : (
                    user.full_name || '-'
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingUserId === user.id ? (
                    <select
                      defaultValue={user.role}
                      className="px-2 py-1 border rounded"
                      onChange={(e) => handleUpdateUser(user.id, { role: e.target.value })}
                    >
                      <option value="cashier">Cashier</option>
                      <option value="inventory_staff">Inventory Staff</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'inventory_staff' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 flex space-x-2">
                  {editingUserId === user.id ? (
                    <button
                      onClick={() => setEditingUserId(null)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <Save size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditingUserId(user.id)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  {user.id !== currentUser.id && (
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersPage;