import { useState, useEffect } from 'react';
import { getInventory } from '../api/inventory';

export const useInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const data = await getInventory();
        setInventory(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  return { inventory, loading, error, setInventory };
};