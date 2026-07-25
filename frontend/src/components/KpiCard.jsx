function KpiCard({ label, valeur, seuil, conforme, unite = '%' }) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-1">
          {valeur !== null ? `${valeur}${unite}` : '—'}
        </p>
        <p className="text-xs text-slate-400 mt-1">Seuil: {seuil}{unite}</p>
        {conforme !== null && (
          <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${conforme ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {conforme ? 'Conforme' : 'Non conforme'}
          </span>
        )}
      </div>
    );
  }
  
  export default KpiCard;