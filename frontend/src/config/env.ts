/**
 * Configurações e utilitários de ambiente da aplicação.
 * As variáveis prefixadas com VITE_ são injetadas pelo Vite em tempo de build/execução.
 */

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

export const SHORT_URL_BASE: string =
  (import.meta.env.VITE_SHORT_URL_BASE as string) || API_BASE_URL;

/**
 * Retorna a URL completa e navegável do link encurtado (ex: "http://localhost:8000/a1b2c3" ou "https://meuencurtador.com/a1b2c3").
 */
export function getFullShortUrl(shortCode: string): string {
  if (!shortCode) return "";
  const base = SHORT_URL_BASE.replace(/\/+$/, "");
  return `${base}/${shortCode}`;
}

/**
 * Retorna uma versão limpa para exibição visual (ex: "localhost:8000/a1b2c3" ou "meuencurtador.com/a1b2c3").
 */
export function formatShortUrlDisplay(shortCode: string): string {
  if (!shortCode) return "";
  return getFullShortUrl(shortCode).replace(/^https?:\/\//, "");
}
