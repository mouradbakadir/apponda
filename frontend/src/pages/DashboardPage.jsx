import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { marchesApi } from '../services/marches.api.js';
import { kpiApi } from '../services/kpi.api.js';
import KpiCard from '../components/KpiCard.jsx';
import { exportKpiToPdf } from '../utils/exportPdf.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function DashboardPage() {
  const [marches, setMarches] = useState([]);
  const [marcheId, setMarcheId] = useState('');
  const [dateDebut, setDateDebut] = useState('2026-07-01');
  const [dateFin, setDateFin] = useState('2026-07-31');
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    marchesApi.getAll().then((data) => {
      setMarches(data);
      if (data.length > 0) setMarcheId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!marcheId) return;
    setLoading(true);
    kpiApi.getSummary(marcheId, dateDebut, dateFin).then(setKpi).finally(() => setLoading(false));
  }, [marcheId, dateDebut, dateFin]);

  const chartData = kpi ? {
    labels: ['PRR', 'Disponibilité', 'MRT (min)'],
    datasets: [{
      label: 'Valeur',
      data: [kpi.kpi.prr.valeur, kpi.kpi.disponibilite.valeur, kpi.kpi.mrt.valeur],
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
    }],
  } : null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Tableau de bord</h1>

      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Marché</label>
          <select value={marcheId} onChange={(e) => setMarcheId(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2">
            {marches.map((m) => <option key={m.id} value={m.id}>{m.numeroMarche}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Du</label>
          <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Au</label>
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2" />
        </div>
      </div>

      {loading && <p className="text-slate-500">Calcul en cours...</p>}

      {kpi && !loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <KpiCard label="PRR" valeur={kpi.kpi.prr.valeur} seuil={kpi.kpi.prr.seuil} conforme={kpi.kpi.prr.conforme} />
            <KpiCard label="Disponibilité" valeur={kpi.kpi.disponibilite.valeur} seuil={kpi.kpi.disponibilite.seuil} conforme={kpi.kpi.disponibilite.conforme} />
            <KpiCard label="MRT" valeur={kpi.kpi.mrt.valeur} seuil={kpi.kpi.mrt.seuil} conforme={kpi.kpi.mrt.conforme} unite=" min" />
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
            <Bar data={chartData} />
          </div>
        </>
      )}
      <button
  onClick={() => exportKpiToPdf(kpi)}
  className="mt-4 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800"
>
  Exporter en PDF
</button>
    </div>
  );
}

export default DashboardPage;