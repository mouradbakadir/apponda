import { useState, useCallback, useEffect } from 'react';

export function useCrud(api) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.getAll();
      // CORRECTION : On gère la pagination du backend. 
      // Si response.data existe, c'est un tableau paginé, sinon on prend la réponse brute.
      const itemsArray = response.data ? response.data : response;
      setItems(itemsArray);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function create(data) {
    await api.create(data);
    await fetchAll();
  }

  async function update(id, data) {
    await api.update(id, data);
    await fetchAll();
  }

  async function remove(id) {
    await api.remove(id);
    await fetchAll();
  }

  return { items, loading, error, create, update, remove, refetch: fetchAll };
}