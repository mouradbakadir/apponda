import { createContext, useContext, useState, useEffect } from 'react';
import { airportsApi } from '../services/airports.api.js';
import { useAuth } from './AuthContext.jsx';

const AirportContext = createContext(null);

export function AirportProvider({ children }) {
  const { user } = useAuth();
  const [airports, setAirports] = useState([]);
  const [selectedAirportId, setSelectedAirportIdState] = useState(
    () => localStorage.getItem('selectedAirportId') || 'all'
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    airportsApi.getAll()
      .then((res) => setAirports(res))
      .finally(() => setLoading(false));
  }, [user]);

  function setSelectedAirportId(id) {
    localStorage.setItem('selectedAirportId', id);
    setSelectedAirportIdState(id);
    // On force un rechargement complet : la maniere la plus simple et fiable
    // de garantir que TOUTES les pages deja montees rechargent leurs donnees
    // avec le nouvel en-tete x-airport-id, sans avoir a cabler un evenement
    // global dans chaque page individuellement.
    window.location.reload();
  }

  const currentAirport = airports.find((a) => a.id === selectedAirportId) || null;

  return (
    <AirportContext.Provider value={{ airports, selectedAirportId, setSelectedAirportId, currentAirport, loading }}>
      {children}
    </AirportContext.Provider>
  );
}

export function useAirport() {
  return useContext(AirportContext);
}