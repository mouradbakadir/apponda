import { createContext, useContext, useState } from 'react';
import * as authApi from '../services/auth.api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  async function handleLogin(email, password) {
    const data = await authApi.login(email, password);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  }

  async function handleLogout() {
    try { await authApi.logout(); } catch { /* on déconnecte quand même localement */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}