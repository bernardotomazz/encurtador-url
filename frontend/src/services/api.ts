import axios from "axios";
import { API_BASE_URL } from "../config/env";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Anexa o token automaticamente em todas as requisições se ele existir
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("@shortli:token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepta respostas com erro (401 - token expirado, 429 - limite de requisições)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem("@shortli:token");

        // Redireciona para o login apenas se estiver em páginas autenticadas
        const publicPaths = ["/login", "/register", "/"];
        if (!publicPaths.includes(window.location.pathname)) {
          window.location.href = "/login";
        }
      } else if (error.response.status === 429) {
        // Padroniza a mensagem para o formato amigável
        if (!error.response.data || typeof error.response.data !== "object") {
          error.response.data = {};
        }
        error.response.data.detail =
          "Muitas requisições em pouco tempo. Por favor, aguarde 1 minuto e tente novamente.";
      }
    }
    return Promise.reject(error);
  }
);
