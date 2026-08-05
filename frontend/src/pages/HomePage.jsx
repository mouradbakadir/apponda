import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

import {
  DashboardIcon, MarchesIcon, SocietesIcon, EquipementsIcon,
  PreventifIcon, PannesIcon, ReclamationsIcon, RapportsIcon, SloIcon,
} from '../components/icons.jsx';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

const shortcuts = [
  { to: '/dashboard', icon: DashboardIcon, label: 'Tableau de bord', desc: 'Vue analytique complète, KPI et alertes', color: '#2563eb', bg: '#dbeafe', roles: ['SUPER_ADMIN', 'SUPERVISEUR', 'TECHNICIEN'] },
  { to: '/marches', icon: MarchesIcon, label: 'Marchés', desc: 'Contrats de maintenance par aéroport', color: '#7c3aed', bg: '#ede9fe', roles: ['SUPER_ADMIN', 'SUPERVISEUR'] },
  { to: '/societes', icon: SocietesIcon, label: 'Sociétés', desc: 'Prestataires et équipes intervenantes', color: '#0891b2', bg: '#cffafe', roles: ['SUPER_ADMIN', 'SUPERVISEUR'] },
  { to: '/equipements', icon: EquipementsIcon, label: 'Équipements', desc: 'Inventaire technique par marché', color: '#0f766e', bg: '#ccfbf1', roles: ['SUPER_ADMIN', 'SUPERVISEUR'] },
  { to: '/preventif', icon: PreventifIcon, label: 'Préventif', desc: 'Planification des visites de maintenance', color: '#059669', bg: '#d1fae5', roles: ['SUPER_ADMIN', 'SUPERVISEUR', 'TECHNICIEN'] },
  { to: '/pannes', icon: PannesIcon, label: 'Pannes', desc: 'Déclaration et suivi des incidents', color: '#dc2626', bg: '#fee2e2', roles: ['SUPER_ADMIN', 'SUPERVISEUR', 'TECHNICIEN'] },
  { to: '/reclamations', icon: ReclamationsIcon, label: 'Réclamations', desc: 'Suivi et notifications aux prestataires', color: '#d97706', bg: '#fef3c7', roles: ['SUPER_ADMIN', 'SUPERVISEUR', 'TECHNICIEN'] },
  { to: '/rapports', icon: RapportsIcon, label: 'Rapports', desc: 'Exports PDF et Excel des performances', color: '#4338ca', bg: '#e0e7ff', roles: ['SUPER_ADMIN', 'SUPERVISEUR'] },
  { to: '/slo', icon: SloIcon, label: 'Analyse SLO', desc: 'Conformité contractuelle par société', color: '#be185d', bg: '#fce7f3', roles: ['SUPER_ADMIN', 'SUPERVISEUR'] },
];

function HomePage() {
  const { user } = useAuth();

  const visibleShortcuts = shortcuts.filter((s) => s.roles.includes(user?.role));

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>
          {greeting()}, {user?.prenom} {user?.nom} 
        </h1>
        <p style={{ color: '#64748b', margin: 0 }}>
          Bienvenue sur Amnt — voici un aperçu rapide de votre activité de maintenance.
        </p>
      </div>

      <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '1rem' }}>
        Accès rapide


        
      </h3>

     
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {visibleShortcuts.map((s) => {
          const IconComp = s.icon;
          return (
            <Link
              key={s.to}
              to={s.to}
              className="card"
              style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', textDecoration: 'none', transition: 'box-shadow 0.15s' }}
            >
              <div style={{ background: s.bg, color: s.color, borderRadius: '10px', padding: '0.625rem', flexShrink: 0 }}>
                <IconComp size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.125rem' }}>{s.label}</div>
                <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{s.desc}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default HomePage;