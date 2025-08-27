import api from './axios';

export const getCustomers = async () => {
  const response = await api.get('/customer/');
  return response.data;
};

export const getCustomerById = async (id) => {
  const response = await api.get(`/customer/${id}`);
  return response.data;
};

export const createCustomer = async (item) => {
  const response = await api.post('/customer/', item);
  return response.data;
};

export const updateCustomer = async (id, updates) => {
  console.log(id)
  console.log(updates);
  const response = await api.put(`/customer/${id}`, updates);
  return response.data;
};

export const deleteCustomer = async (id) => {
  const response = await api.delete(`/customer/${id}`);
  return response.data;
};

export const searchCustomers = async (query) => {
  const response = await api.get(`/customers/?search=${query}`);
  return response.data;
};

export const getCustomerPurchaseHistory = async (id) => {
  const response = await api.get(`/customer/${id}/purchases/`);
  return response.data;
};

export const getCustomerStats = async (id) => {
  const response = await api.get(`/customer/${id}/stats/`);
  return response.data;
};