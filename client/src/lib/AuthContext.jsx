import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

async function apiFetch(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/auth/me').then(({ ok, data }) => {
      if (ok) setUser(data.user);
      setLoading(false);
    });
  }, []);

  async function login(email, password) {
    const { ok, data } = await apiFetch('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    });
    if (ok) setUser(data.user);
    return { ok, error: data.error };
  }

  async function register(name, email, password) {
    const { ok, data } = await apiFetch('/auth/register', {
      method: 'POST', body: JSON.stringify({ name, email, password }),
    });
    if (ok) setUser(data.user);
    return { ok, error: data.error };
  }

  async function logout() {
    await apiFetch('/auth/me', { method: 'POST' });
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
