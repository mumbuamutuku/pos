import api from './axios';

export const getInventory = async () => {
  const response = await api.get('/inventory/');
  return response.data;
};

export const addInventoryItem = async (item) => {
  const response = await api.post('/inventory/', item);
  return response.data;
};

export const updateInventoryItem = async (id, updates) => {
  console.log(updates);
  const response = await api.put(`/inventory/${id}`, updates);
  return response.data;
};

export const deleteInventoryItem = async (id) => {
  const response = await api.delete(`/inventory/${id}`);
  return response.data;
};