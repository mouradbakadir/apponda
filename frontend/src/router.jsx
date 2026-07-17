import { createBrowserRouter } from 'react-router-dom';
import AppLayout from './layouts/AppLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export const router = createBrowserRouter([
  { path: '/login', element: <AuthLayout><LoginPage /></AuthLayout> },
  {
    path: '/',
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [{ index: true, element: <DashboardPage /> }],
  },
]);