import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, logout, getCurrentUser, fetchUserData } from '../api/auth';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (credentials) => {
    try {
      const { access_token } = await login(credentials);
      localStorage.setItem('authToken', access_token);
      const userResponse = await fetchUserData(access_token);
      const user = {
        username: credentials.username,
        role: userResponse.role, // Get role from API response
        name: userResponse.name  // Get name from API response
      };
      localStorage.setItem('currentUser', JSON.stringify(user));
      setCurrentUser(user);
      setError(null);

      navigate('/');
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
      return false;
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    navigate('/login');
  };

  return { currentUser, error, handleLogin, handleLogout };
};

