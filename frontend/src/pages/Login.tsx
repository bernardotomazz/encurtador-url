import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

export const Login: React.FC = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      toast.success("Login realizado com sucesso!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        const rateLimitMsg =
          "Muitas tentativas consecutivas. Por segurança, aguarde 1 minuto e tente novamente.";
        setError(rateLimitMsg);
        toast.warning(rateLimitMsg, "Limite de tentativas atingido");
      } else {
        const msg =
          (axios.isAxiosError(err) && (err.response?.data?.detail as string)) ||
          "Não foi possível conectar ao servidor. Verifique seus dados e tente novamente.";
        setError(msg);
        toast.error(msg, "Erro no login");
      }
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col select-none">
      {/* Header Idêntico à Página Principal com Botão Voltar */}
      <header className="relative text-white h-16 border-b border-zinc-900 px-6 sm:px-8 flex items-center justify-between bg-zinc-950 z-30 shrink-0">
        <Link
          to="/"
          className="font-bold text-lg tracking-tight hover:text-zinc-200 transition-colors"
          title="Ir para o início"
        >
          Encurtador de URL
        </Link>
        <Link
          to="/"
          className="bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-200 hover:text-white font-medium transition-colors text-sm"
        >
          Voltar
        </Link>
      </header>

      {/* Conteúdo Centralizado */}
      <main className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10">
        <div className="w-full max-w-[360px] mx-auto">
          {/* Título sem subtítulo */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Boas-vindas de volta
            </h1>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs sm:text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo E-mail */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu e-mail"
                className="w-full bg-zinc-900/70 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Campo Senha */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() =>
                    toast.info(
                      "A funcionalidade de recuperação de senha estará disponível em breve.",
                      "Em breve"
                    )
                  }
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full bg-zinc-900/70 border border-zinc-800 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            {/* Lembrar meu acesso */}
            <div className="pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-400 hover:text-zinc-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span>Lembrar meu acesso</span>
              </label>
            </div>

            {/* Botão de Ação Principal */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-sm shadow-md shadow-blue-600/10 active:scale-[0.99]"
            >
              {loading ? "Entrando..." : "Continuar com e-mail"}
            </button>
          </form>

          {/* Alternar para Cadastro */}
          <div className="mt-8 text-center text-xs sm:text-sm text-zinc-400">
            Ainda não tem uma conta?{" "}
            <Link
              to="/register"
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
