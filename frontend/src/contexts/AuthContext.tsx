import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

export interface User {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("@shortli:token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem("@shortli:token");
      if (storedToken) {
        try {
          const response = await api.get("/auth/me");
          setUser(response.data);
          setToken(storedToken);
        } catch {
          // Token inválido ou expirado
          localStorage.removeItem("@shortli:token");
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  async function login(email: string, password: string) {
    const response = await api.post("/auth/login", { email, password });
    const { access_token, user: userData } = response.data;
    localStorage.setItem("@shortli:token", access_token);
    setToken(access_token);
    setUser(userData);
  }

  async function register(name: string, email: string, password: string) {
    const response = await api.post("/auth/register", { name, email, password });
    const { access_token, user: userData } = response.data;
    localStorage.setItem("@shortli:token", access_token);
    setToken(access_token);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem("@shortli:token");
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
