import { RouterProvider } from 'react-router-dom';
import { router } from './router.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;