import api from './axios';

export const getSales = async () => {
  const response = await api.get('/pos/');
  return response.data;
};

export const createSale = async (saleData) => {
  console.log(saleData);
  const response = await api.post('/pos/', saleData);
  return response.data;
};

// Add more POS-related API calls as needed