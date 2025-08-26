import api from './axios';

export const login = async (credentials) => {
  const response = await api.post("/auth/token", credentials, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
};

export const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('currentUser'));
};

export const fetchUserData = async (token) => {
  const response = await api.get("/users/me");
  return response.data;
};