import api from './axios';

export const getExpenses = async () => {
  const response = await api.get('/expense/');
  return response.data;
};

export const addExpenseItem = async (item) => {
  const response = await api.post('/expense/', item);
  return response.data;
};

export const updateExpenseItem = async (id, updates) => {
  const response = await api.put(`/expense/${id}`, updates);
  return response.data;
};

export const deleteExpenseItem = async (id) => {
  const response = await api.delete(`/expense/${id}`);
  return response.data;
};