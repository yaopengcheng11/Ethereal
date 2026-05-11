import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface CurrentUser {
  id: number;
  email: string;
  permissions: string[];
}

interface AuthContextType {
  currentUser: CurrentUser | null;
  token: string | null;
  login: (token: string, user: CurrentUser) => void;
  logout: () => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const refresh = () => {
    const stored = localStorage.getItem('ethereal_current_user');
    const storedToken = localStorage.getItem('ethereal_token');
    if (stored && storedToken) {
      try {
        setCurrentUser(JSON.parse(stored));
        setToken(storedToken);
      } catch {
        setCurrentUser(null);
        setToken(null);
      }
    } else {
      setCurrentUser(null);
      setToken(null);
    }
  };

  useEffect(() => {
    refresh();
    // 监听跨标签页同步
    const handler = () => refresh();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const login = (newToken: string, user: CurrentUser) => {
    localStorage.setItem('ethereal_token', newToken);
    localStorage.setItem('ethereal_current_user', JSON.stringify(user));
    setToken(newToken);
    setCurrentUser(user);
  };

  const logout = () => {
    localStorage.removeItem('ethereal_token');
    localStorage.removeItem('ethereal_current_user');
    setToken(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, token, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
