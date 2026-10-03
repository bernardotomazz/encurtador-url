import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

export const Register: React.FC = () => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      const msg = "A senha deve ter no mínimo 8 caracteres.";
      setError(msg);
      toast.warning(msg);
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      toast.success("Conta criada com sucesso! Seja bem-vindo(a).");
      navigate("/dashboard");
    } catch (err) {
      console.error("Registration failed:", err);
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        const rateLimitMsg =
          "Muitas tentativas em pouco tempo. Aguarde 1 minuto e tente novamente.";
        setError(rateLimitMsg);
        toast.warning(rateLimitMsg, "Muitas tentativas");
      } else {
        const msg =
          (axios.isAxiosError(err) && (err.response?.data?.detail as string)) ||
          "Não foi possível realizar o cadastro. Tente novamente.";
        setError(msg);
        toast.error(msg, "Erro no cadastro");
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
              Crie sua conta
            </h1>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs sm:text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Nome Completo */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Nome completo
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como devemos chamar você?"
                className="w-full bg-zinc-900/70 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

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
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Senha
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo de 8 caracteres"
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

            {/* Botão de Ação Principal */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-sm shadow-md shadow-blue-600/10 active:scale-[0.99]"
            >
              {loading ? "Criando conta..." : "Criar conta com e-mail"}
            </button>
          </form>

          {/* Alternar para Login */}
          <div className="mt-8 text-center text-xs sm:text-sm text-zinc-400">
            Já possui uma conta?{" "}
            <Link
              to="/login"
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Entrar
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;
