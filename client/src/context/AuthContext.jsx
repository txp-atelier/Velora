import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi, setAccessToken } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModal, setAuthModal] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  // No access token persists across reloads — it lives in memory only.
  // On load, silently exchange the httpOnly refresh cookie (if any) for one.
  const loadUser = useCallback(async () => {
    try {
      await authApi.refresh();
      const { user: u } = await authApi.me();
      setUser(u);
    } catch {
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const { user: u, token } = await authApi.login({ email, password });
    setAccessToken(token);
    setUser(u);
    setAuthModal(null);
    if (pendingAction) { pendingAction(); setPendingAction(null); }
    return u;
  };

  const signup = async (data) => {
    const { user: u, token } = await authApi.signup(data);
    setAccessToken(token);
    setUser(u);
    setAuthModal(null);
    if (pendingAction) { pendingAction(); setPendingAction(null); }
    return u;
  };

  const logout = async () => {
    try { await authApi.logout(); } catch { /* cookie may already be gone */ }
    setAccessToken(null);
    setUser(null);
  };

  const requireAuth = (action, modal = "login") => {
    if (user) return action();
    setPendingAction(() => action);
    setAuthModal(modal);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, signup, logout,
      authModal, setAuthModal, requireAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
