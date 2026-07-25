import { RouterProvider } from 'react-router-dom';
import { router } from './router.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { AirportProvider } from './context/AirportContext.jsx';

function App() {
  return (
    <AuthProvider>
      <AirportProvider>
        <RouterProvider router={router} />
      </AirportProvider>
    </AuthProvider>
  );
}

export default App;