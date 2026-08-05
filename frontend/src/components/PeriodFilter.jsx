const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export function periodToDateRange(year, period) {
  if (period === 'all') return { dateDebut: `${year}-01-01`, dateFin: `${year}-12-31` };
  if (period.startsWith('T')) {
    const q = parseInt(period.substring(1), 10);
    const startMonth = (q - 1) * 3 + 1;
    const endMonth = startMonth + 2;
    const lastDay = new Date(year, endMonth, 0).getDate();
    return {
      dateDebut: `${year}-${String(startMonth).padStart(2, '0')}-01`,
      dateFin: `${year}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    };
  }
  const lastDay = new Date(year, parseInt(period, 10), 0).getDate();
  return { dateDebut: `${year}-${period}-01`, dateFin: `${year}-${period}-${String(lastDay).padStart(2, '0')}` };
}

export function periodLabel(year, period) {
  if (period === 'all') return `Année ${year}`;
  if (period.startsWith('T')) return `Trimestre ${period.substring(1)} ${year}`;
  return `${monthNames[parseInt(period, 10) - 1]} ${year}`;
}

export function isDateInYearPeriod(dateStr, year, period) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (d.getFullYear() !== Number(year)) return false;
  if (period === 'all') return true;
  const month = d.getMonth() + 1;
  if (period.startsWith('T')) {
    const quarter = Math.ceil(month / 3);
    return period === `T${quarter}`;
  }
  return period === String(month).padStart(2, '0');
}

/**
 * @param {boolean} [quartersOnly] - si true, retire l'option "Toute l'année"
 *   et le sous-menu "Par Mois", ne garde que les 4 trimestres. Utilisé par
 *   Dashboard et Analyse SLO -- Pannes et Réclamations gardent le
 *   comportement complet par défaut (quartersOnly absent/false).
 */
function PeriodFilter({ year, onYearChange, period, onPeriodChange, quartersOnly = false }) {
  return (
    <>
      <div className="form-group mb-0">
        <label className="form-label" style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
          Année
        </label>
        <input
          type="number"
          className="form-control"
          style={{ minWidth: '100px', width: '100px' }}
          value={year}
          min="2000"
          max="2100"
          step="1"
          onChange={(e) => {
            const val = e.target.value;
            if (val === '') return;
            const num = Number(val);
            if (!Number.isNaN(num)) onYearChange(num);
          }}
          onBlur={(e) => {
            const num = Number(e.target.value);
            if (Number.isNaN(num) || num < 2000 || num > 2100) {
              onYearChange(new Date().getFullYear());
            }
          }}
        />
      </div>
      <div className="form-group mb-0">
        <label className="form-label" style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
          {quartersOnly ? 'Trimestre' : 'Période'}
        </label>
        <select className="form-control" style={{ minWidth: '200px' }} value={period} onChange={(e) => onPeriodChange(e.target.value)}>
          {!quartersOnly && <option value="all">Toute l'année {year}</option>}
          {quartersOnly ? (
            <>
              <option value="T1">Trimestre 1 (Jan - Mar)</option>
              <option value="T2">Trimestre 2 (Avr - Juin)</option>
              <option value="T3">Trimestre 3 (Juil - Sept)</option>
              <option value="T4">Trimestre 4 (Oct - Déc)</option>
            </>
          ) : (
            <>
              <optgroup label="Par Trimestre">
                <option value="T1">Trimestre 1 (Jan - Mar)</option>
                <option value="T2">Trimestre 2 (Avr - Juin)</option>
                <option value="T3">Trimestre 3 (Juil - Sept)</option>
                <option value="T4">Trimestre 4 (Oct - Déc)</option>
              </optgroup>
              <optgroup label="Par Mois">
                {monthNames.map((m, i) => (
                  <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                ))}
              </optgroup>
            </>
          )}
        </select>
      </div>
    </>
  );
}

export default PeriodFilter;