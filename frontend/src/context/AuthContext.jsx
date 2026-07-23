import { createContext, useContext, useState } from 'react';
import api from '../api/axios';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    const fullName = localStorage.getItem('fullName');
    return token ? { token, role, username, fullName } : null;
  });

  const login = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('username', data.username);
    localStorage.setItem('fullName', data.fullName);
    setUser(data);
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
    }
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Landing route for each role after login.
export const ROLE_HOME = {
  CITIZEN: '/citizen',
  POLICE_OFFICER: '/officer',
  ANTECEDENT_OFFICER: '/antecedent',
  LICENSING_AUTHORITY: '/licensing',
  AUDIT_OFFICER: '/audit',
  ADMIN: '/admin',
};
