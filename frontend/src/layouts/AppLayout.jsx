import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  DashboardIcon, MarchesIcon, SocietesIcon, EquipementsIcon,
  PreventifIcon, PannesIcon, ReclamationsIcon, RapportsIcon, SloIcon,
  LogoutIcon, ChevronRightIcon,
} from '../components/icons.jsx';
import AirportSelector from '../components/AirportSelector.jsx';

const pageNames = {
  '/': 'Accueil',
  '/dashboard': 'Tableau de bord',
  '/marches': 'Marchés & Contrats',
  '/societes': 'Sociétés Prestataires',
  '/equipements': 'Équipements',
  '/preventif': 'Maintenance Préventive',
  '/pannes': 'Gestion des Pannes',
  '/reclamations': 'Réclamations',
  '/rapports': 'Rapports & Analytiques',
  '/slo': 'Analyse SLO',
};

function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const currentPageName = pageNames[location.pathname] || 'Page';

  const navLinkClass = ({ isActive }) => `nav-item${isActive ? ' active' : ''}`;

  return (
      <div className="app-shell">
        <aside className="layout-sidebar">
        <div className="sidebar-logo">
          <div style={{ background: 'white', padding: '3px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30px', width: '30px' }}>
            <img
              src="/logo.png"
              alt="Logo"
              style={{ height: '24px', width: 'auto', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <h2>Amnt</h2>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={navLinkClass}>
            <DashboardIcon />
            Tableau de bord
          </NavLink>

          {user?.role !== 'TECHNICIEN' && (
            <>
              <div className="nav-section">Référentiel</div>
              <NavLink to="/marches" className={navLinkClass}>
                <MarchesIcon />
                Marchés
              </NavLink>
              <NavLink to="/societes" className={navLinkClass}>
                <SocietesIcon />
                Sociétés
              </NavLink>
              <NavLink to="/equipements" className={navLinkClass}>
                <EquipementsIcon />
                Équipements
              </NavLink>
            </>
          )}

          <div className="nav-section">Opérations</div>
          <NavLink to="/preventif" className={navLinkClass}>
            <PreventifIcon />
            Préventif
          </NavLink>
          <NavLink to="/pannes" className={navLinkClass}>
            <PannesIcon />
            Pannes
          </NavLink>
          <NavLink to="/reclamations" className={navLinkClass}>
            <ReclamationsIcon />
            Réclamations
          </NavLink>

          {user?.role !== 'TECHNICIEN' && (
            <>
              <div className="nav-section">Analyse</div>
              <NavLink to="/rapports" className={navLinkClass}>
                <RapportsIcon />
                Rapports
              </NavLink>
              <NavLink to="/slo" className={navLinkClass}>
                <SloIcon />
                Analyse SLO
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-avatar">{user?.nom?.charAt(0)}</div>
          <div className="user-info">
            <div className="user-name">{user?.prenom} {user?.nom}</div>
            <div className="user-role">{user?.role?.replace('_', ' ')}</div>
          </div>
          <button
            onClick={logout}
            className="btn-ghost"
            style={{ padding: '0.25rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '6px' }}
            title="Déconnexion"
          >
            <LogoutIcon />
          </button>
        </div>
      </aside>

      <main className="layout-main">
        <header className="layout-header">
          <div className="flex items-center gap-2">
            <Link to="/" style={{ color: '#94a3b8', fontSize: '0.8125rem', textDecoration: 'none' }}>
              Accueil
            </Link>
            {location.pathname !== '/' && (
              <>
                <ChevronRightIcon stroke="#94a3b8" />
                <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#0f172a' }}>{currentPageName}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
          <AirportSelector />
            <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>
              {new Date().toLocaleDateString('fr-FR')}
            </span>
          </div>
        </header>

        <div className="layout-content">
          <Outlet />
        </div>
      </main>
      </div>
  );
}

export default AppLayout;