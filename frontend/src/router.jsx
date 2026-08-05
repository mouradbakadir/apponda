import { createBrowserRouter } from 'react-router-dom';
import AppLayout from './layouts/AppLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import MarchesPage from './pages/MarchesPage.jsx';
import SocietesPage from './pages/SocietesPage.jsx';
import EquipementsPage from './pages/EquipementsPage.jsx';
import PannesPage from './pages/PannesPage.jsx';
import ReclamationsPage from './pages/ReclamationsPage.jsx';
import ComingSoonPage from './pages/ComingSoonPage.jsx';
import PreventifPage from './pages/PreventifPage.jsx';
import RapportsPage from './pages/RapportsPage.jsx';
import AnalyseSloPage from './pages/AnalyseSloPage.jsx';
import HomePage from './pages/HomePage.jsx';

export const router = createBrowserRouter([
  { path: '/login', element: <AuthLayout><LoginPage /></AuthLayout> },
  {
    path: '/',
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'marches', element: <MarchesPage /> },
      { path: 'societes', element: <SocietesPage /> },
      { path: 'equipements', element: <EquipementsPage /> },
      { path: 'pannes', element: <PannesPage /> },
      { path: 'reclamations', element: <ReclamationsPage /> },
      { path: 'preventif', element: <PreventifPage /> },
      { path: 'rapports', element: <RapportsPage /> },
      { path: 'slo', element: <AnalyseSloPage /> },
    ],
  },
]);