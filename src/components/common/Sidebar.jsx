import { ShoppingCart, Package, BarChart3, Menu, X, User2, UserIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { getCurrentUser } from '../../api/auth';
import { useState } from 'react';

const Sidebar = () => {
  const currentUser = getCurrentUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const canAccess = (feature) => {
    if (!currentUser) return false;
    
    switch (feature) {
      case 'inventory':
        return currentUser.role === 'admin' || currentUser.role === 'manager';
      case 'reports':
        return currentUser.role === 'admin' || currentUser.role === 'manager';
      case 'users':
        return currentUser.role === 'admin';
      case 'expense':
        return currentUser.role === 'admin' || currentUser.role === 'manager';
      case 'customers':
        return currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.role === 'cashier';
      default:
        return true;
    }
  };

  const tabs = [
    { id: 'pos', label: 'Point of Sale', icon: ShoppingCart, path: '/', access: true },
    { id: 'customers', label: 'Customers', icon: User2, path: '/customers', access: canAccess('customers') },
    { id: 'inventory', label: 'Inventory', icon: Package, path: '/inventory', access: canAccess('inventory') },
    { id: 'reports', label: 'Reports', icon: BarChart3, path: '/reports', access: canAccess('reports') },
    { id: 'settings', label: 'Settings', icon: Package, path: '/settings', access: true },
    { id: 'Users', label: 'Users', icon: UserIcon, path: '/users', access: canAccess('users') },
    { id: 'expense', label: 'Expense', icon: Package, path: '/expense', access: canAccess('expense') },
  ].filter(tab => tab.access);

  return (<>
    <div className="w-64 bg-white shadow-sm border-r hidden md:block">
      <div className="flex flex-col space-y-1 p-2">
        {tabs.map(({ id, label, icon: Icon, path }) => (
          <NavLink
            key={id}
            to={path}
            className={({ isActive }) => `
              flex items-center space-x-3 py-3 px-4 rounded-lg transition-colors
              ${isActive 
                ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }
            `}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </div>
          {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed bottom-4 right-4 bg-indigo-600 text-white p-3 rounded-full shadow-lg z-50"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative bg-white w-64 h-full">
            <div className="flex flex-col space-y-1 p-2">
              {tabs.map(({ id, label, icon: Icon, path }) => (
                <NavLink
                  key={id}
                  to={path}
                  className={({ isActive }) => `
                    flex items-center space-x-3 py-3 px-4 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
  </>
  );
};

export default Sidebar;