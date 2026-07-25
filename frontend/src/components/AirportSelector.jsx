import { useAirport } from '../context/AirportContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function AirportSelector() {
  const { user } = useAuth();
  const { airports, selectedAirportId, setSelectedAirportId, currentAirport, loading } = useAirport();

  if (loading) return null;

  if (user?.role !== 'SUPER_ADMIN') {
    // Superviseur / Technicien : badge fixe, non modifiable
    const airport = airports[0];
    return (
      <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
        {airport ? `${airport.codeIata} - ${airport.nom}` : 'Aéroport'}
      </span>
    );
  }

  return (
    <select
      className="form-control"
      style={{ width: '220px', fontSize: '0.8125rem', padding: '0.375rem 0.625rem' }}
      value={selectedAirportId}
      onChange={(e) => setSelectedAirportId(e.target.value)}
    >
      <option value="all">Tous les aéroports (National)</option>
      {airports.map((a) => (
        <option key={a.id} value={a.id}>{a.codeIata} - {a.nom}</option>
      ))}
    </select>
  );
}

export default AirportSelector;