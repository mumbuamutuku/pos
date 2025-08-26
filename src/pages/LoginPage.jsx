import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const { handleLogin, error, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, location]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-800 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <LoginForm onSubmit={handleLogin} error={error} />
      </div>
    </div>
  );
};

export default LoginPage;