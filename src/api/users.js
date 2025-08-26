import api from './axios';

export const getUsers = async () => {
  const response = await api.get('/users/');
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post('/users/', userData);
  return response.data;
};

export const updateUser = async (userId, updates) => {
  const response = await api.put(`/users/${userId}`, updates);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};