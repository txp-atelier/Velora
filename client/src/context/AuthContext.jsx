import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModal, setAuthModal] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("velora_token");
    if (!token) { setLoading(false); return; }
    try {
      const { user: u } = await authApi.me();
      setUser(u);
    } catch {
      localStorage.removeItem("velora_token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const { user: u, token } = await authApi.login({ email, password });
    localStorage.setItem("velora_token", token);
    setUser(u);
    setAuthModal(null);
    if (pendingAction) { pendingAction(); setPendingAction(null); }
    return u;
  };

  const signup = async (data) => {
    const { user: u, token } = await authApi.signup(data);
    localStorage.setItem("velora_token", token);
    setUser(u);
    setAuthModal(null);
    if (pendingAction) { pendingAction(); setPendingAction(null); }
    return u;
  };

  const logout = () => {
    localStorage.removeItem("velora_token");
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
