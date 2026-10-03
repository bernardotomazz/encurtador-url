import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiX, FiMenu } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

function Header() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <header className="relative text-white h-16 border-b border-zinc-900 px-6 sm:px-8 flex items-center justify-between bg-zinc-950 z-30">
      {/* Logo */}
      <Link to="/" className="font-bold text-lg tracking-tight hover:text-zinc-200 transition-colors">
        Encurtador de URL
      </Link>

      {/* Navegação Desktop */}
      <div className="hidden md:flex items-center gap-6 text-sm">
        <Link to="/" className="text-zinc-400 hover:text-white transition-colors">
          Início
        </Link>
        <Link
          to="/dashboard"
          className="text-zinc-400 hover:text-white transition-colors"
        >
          Dashboard
        </Link>

        {isAuthenticated && user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 py-1 cursor-pointer select-none group"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs group-hover:border-blue-400/50 transition-colors">
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="text-sm font-medium text-zinc-200 group-hover:text-white max-w-[140px] truncate transition-colors">
                {user.name}
              </span>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-zinc-900 rounded-xl p-1.5 z-50 flex flex-col gap-0.5 shadow-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    toast.info(
                      "A página de configurações estará disponível em breve.",
                      "Configurações"
                    );
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/70 rounded-lg transition-colors cursor-pointer"
                >
                  Configurações
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                    toast.success("Sessão encerrada com sucesso.");
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-zinc-800/70 rounded-lg transition-colors cursor-pointer"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500 text-white font-medium transition-colors"
          >
            Entrar
          </Link>
        )}
      </div>

      {/* Botão Menu Mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden text-zinc-400 hover:text-white p-2 rounded-lg focus:outline-none cursor-pointer"
        aria-label="Abrir menu"
      >
        {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
      </button>

      {/* Dropdown Mobile */}
      {isOpen && (
        <div className="absolute top-16 left-0 w-full md:hidden border-zinc-900 bg-zinc-950 border-b px-6 py-5 flex flex-col gap-4">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="text-sm text-zinc-300 hover:text-white py-1"
          >
            Início
          </Link>
          <Link
            to="/dashboard"
            onClick={() => setIsOpen(false)}
            className="text-sm text-zinc-300 hover:text-white py-1"
          >
            Dashboard
          </Link>

          {isAuthenticated && user ? (
            <div className="pt-2 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </div>
                <span className="text-sm font-medium text-zinc-200">
                  {user.name}
                </span>
              </div>
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                  toast.success("Sessão encerrada com sucesso.");
                }}
                className="text-xs text-red-400 hover:underline cursor-pointer"
              >
                Sair
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="bg-blue-600 px-4 py-2.5 rounded-lg hover:bg-blue-500 transition-colors text-center text-sm font-medium text-white"
            >
              Entrar
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

export default Header;
