import { Navigate, useLocation  } from 'react-router-dom';
import { getCurrentUser } from '../../api/auth';

const ProtectedRoute = ({ children, requiredRole }) => {
  const currentUser = getCurrentUser();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && currentUser.role !== requiredRole && currentUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;