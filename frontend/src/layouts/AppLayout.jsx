import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { to: '/', label: 'Tableau de bord' },
  { to: '/marches', label: 'Marchés' },
  { to: '/societes', label: 'Sociétés' },
  { to: '/equipements', label: 'Équipements' },
  { to: '/pannes', label: 'Pannes' },
  { to: '/reclamations', label: 'Réclamations' },
];

function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 text-xl font-bold border-b border-slate-700">Antigravity</div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `block px-4 py-2 rounded-lg transition-colors ${
                  isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <p className="text-sm text-slate-300">{user?.prenom} {user?.nom}</p>
          <p className="text-xs text-slate-500 mb-3">{user?.role}</p>
          <button onClick={logout} className="text-sm text-red-400 hover:text-red-300">
            Se déconnecter
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;