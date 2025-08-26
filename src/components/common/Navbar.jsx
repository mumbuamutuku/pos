import { User, LogOut } from 'lucide-react';
import { getCurrentUser } from '../../api/auth';

const Navbar = ({ currentUser }) => {
  const user = currentUser || getCurrentUser();

  return (
    <div className="bg-indigo-600 text-white p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Wine & Spirits POS</h1>
        <div className="flex items-center space-x-4">
          {user && (
            <>
              <div className="flex items-center space-x-2">
                <User size={20} />
                <span className="hidden md:inline">{user.name}</span>
                <span className="text-indigo-200">({user.role})</span>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('currentUser');
                  window.location.href = '/login';
                }}
                className="flex items-center space-x-2 bg-indigo-700 hover:bg-indigo-800 px-3 py-2 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                <span className="hidden md:inline">Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;