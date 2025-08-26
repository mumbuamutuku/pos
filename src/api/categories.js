import api from './axios';

export const getCategories = async () => {
  const response = await api.get('/category/');
  return response.data;
};

export const addCategory = async (item) => {
  const response = await api.post('/category/', item);
  return response.data;
};

export const updateCategory = async (id, updates) => {
  const response = await api.put(`/category/${id}`, updates);
  return response.data;
};

export const deleteCategory= async (id) => {
  const response = await api.delete(`/category/${id}`);
  return response.data;
};