import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import { getCurrentUser } from '../api/auth';

const Layout = () => {
  const currentUser = getCurrentUser();

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar currentUser={currentUser} />
      <div className="flex">
        <Sidebar currentUser={currentUser} />
        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;