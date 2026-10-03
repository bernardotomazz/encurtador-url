import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiPlus,
  FiSearch,
  FiSliders,
  FiCopy,
  FiCheck,
  FiLogOut,
  FiX,
  FiMenu,
  FiExternalLink,
  FiEdit2,
  FiTrash2,
  FiAlertTriangle,
  FiMousePointer,
  FiAward,
} from "react-icons/fi";
import { FaLink } from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { api } from "../services/api";
import { getFullShortUrl, formatShortUrlDisplay } from "../config/env";
import QRCode from "qrcode";

interface UrlItem {
  id?: string;
  _id?: string;
  short_url: string;
  original_url: string;
  clicks: number;
  created_at: string;
}

interface DashboardStats {
  total_clicks: number;
  total_links: number;
  top_link: {
    short_url: string;
    original_url: string;
    clicks: number;
  } | null;
}

type SortOption = "recent" | "oldest" | "most_clicks" | "least_clicks";

export const Dashboard: React.FC = () => {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>({
    total_clicks: 0,
    total_links: 0,
    top_link: null,
  });
  const [links, setLinks] = useState<UrlItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Menu Mobile Dropdown
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modal de Criação de Link
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdResult, setCreatedResult] = useState<UrlItem | null>(null);
  const [modalQrCodeUrl, setModalQrCodeUrl] = useState<string | null>(null);
  const [modalCopied, setModalCopied] = useState(false);

  // Modal de Edição de Destino
  const [editingLink, setEditingLink] = useState<UrlItem | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Modal de Exclusão de Link
  const [deletingLink, setDeletingLink] = useState<UrlItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fecha o dropdown de ordenação ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterOpen]);

  // Fecha modais e dropdown ao pressionar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (deletingLink) setDeletingLink(null);
        else if (editingLink) setEditingLink(null);
        else if (isModalOpen) setIsModalOpen(false);
        else if (isFilterOpen) setIsFilterOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, editingLink, deletingLink, isFilterOpen]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  async function loadDashboardData(showLoading = false) {
    try {
      if (showLoading) setLoading(true);
      const [statsRes, linksRes] = await Promise.all([
        api.get("/dashboard/status"),
        api.get("/urls"),
      ]);
      setStats(statsRes.data);
      setLinks(linksRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated) {
      Promise.all([
        api.get("/dashboard/status"),
        api.get("/urls"),
      ])
        .then(([statsRes, linksRes]) => {
          if (isMounted) {
            setStats(statsRes.data);
            setLinks(linksRes.data);
          }
        })
        .catch((error) => {
          console.error("Erro ao carregar dados do dashboard:", error);
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  function handleCopy(shortUrlCode: string, id: string) {
    const fullUrl = getFullShortUrl(shortUrlCode);
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    toast.success("Link copiado para a área de transferência!");
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleCreateLink(e: React.FormEvent) {
    e.preventDefault();
    if (!newUrl.trim()) return;

    try {
      setCreating(true);
      const res = await api.post("/?", { original_url: newUrl });
      const full = getFullShortUrl(res.data.short_url);
      const qrData = await QRCode.toDataURL(full, { width: 300, margin: 1 });
      setModalQrCodeUrl(qrData);
      setCreatedResult(res.data);
      setNewUrl("");
      loadDashboardData();
      toast.success("Link encurtado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar link:", error);
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        toast.warning(
          "Limite atingido: você realizou muitas criações em sequência. Aguarde 1 minuto e tente novamente.",
          "Muitas tentativas"
        );
      } else {
        const message =
          (axios.isAxiosError(error) && (error.response?.data?.detail as string)) ||
          "Não foi possível encurtar o link. Verifique a URL informada e tente novamente.";
        toast.error(message, "Erro ao encurtar");
      }
    } finally {
      setCreating(false);
    }
  }

  function handleOpenEdit(link: UrlItem) {
    setEditingLink(link);
    setEditUrl(link.original_url);
  }

  async function handleConfirmEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLink || !editUrl.trim()) return;

    try {
      setSavingEdit(true);
      await api.patch(`/${editingLink.short_url}`, {
        original_url: editUrl.trim(),
      });

      setLinks((prev) =>
        prev.map((l) =>
          l.short_url === editingLink.short_url
            ? { ...l, original_url: editUrl.trim() }
            : l
        )
      );

      if (stats.top_link && stats.top_link.short_url === editingLink.short_url) {
        setStats((prev) => ({
          ...prev,
          top_link: prev.top_link
            ? { ...prev.top_link, original_url: editUrl.trim() }
            : null,
        }));
      }

      toast.success("Link de destino atualizado com sucesso!");
      setEditingLink(null);
    } catch (error) {
      console.error("Erro ao atualizar link:", error);
      toast.error(
        "Não foi possível atualizar o link de destino. Tente novamente.",
        "Erro na atualização"
      );
    } finally {
      setSavingEdit(false);
    }
  }

  function handleOpenDelete(link: UrlItem) {
    setDeletingLink(link);
  }

  async function handleConfirmDelete() {
    if (!deletingLink) return;

    try {
      setIsDeleting(true);
      await api.delete(`/${deletingLink.short_url}`);

      setLinks((prev) =>
        prev.filter((l) => l.short_url !== deletingLink.short_url)
      );
      loadDashboardData();
      toast.success("Link encurtado excluído com sucesso!");
      setDeletingLink(null);
    } catch (error) {
      console.error("Erro ao excluir link:", error);
      toast.error(
        "Não foi possível excluir o link. Tente novamente.",
        "Erro na exclusão"
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const processedLinks = useMemo(() => {
    const filtered = links.filter(
      (l) =>
        l.short_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.original_url.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return [...filtered].sort((a, b) => {
      if (sortBy === "most_clicks") {
        return b.clicks - a.clicks;
      }
      if (sortBy === "least_clicks") {
        return a.clicks - b.clicks;
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      // "recent" (padrão)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [links, searchTerm, sortBy]);

  const sortLabels: Record<SortOption, string> = {
    recent: "Mais recentes",
    oldest: "Mais antigos",
    most_clicks: "Mais clicados",
    least_clicks: "Menos clicados",
  };

  function formatDate(dateStr: string) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row text-white w-full overflow-x-hidden">
      {/* Top Header Mobile e Tablet com Menu Hambúrguer */}
      <header className="relative lg:hidden h-16 border-b border-zinc-900 px-4 sm:px-6 flex items-center justify-between bg-zinc-950 z-30 shrink-0">
        <Link to="/" className="font-bold text-lg tracking-tight hover:text-zinc-200 transition-colors">
          Encurtador de URL
        </Link>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-zinc-400 hover:text-white p-2 rounded-lg focus:outline-none cursor-pointer"
          aria-label="Abrir menu"
        >
          {isMobileMenuOpen ? (
            <FiX className="w-6 h-6" />
          ) : (
            <FiMenu className="w-6 h-6" />
          )}
        </button>

        {/* Dropdown Mobile */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 w-full border-zinc-900 bg-zinc-950 border-b px-6 py-5 flex flex-col gap-3 z-40">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 text-left text-sm text-white font-medium py-1.5 cursor-pointer"
            >
              <div className="w-8 flex items-center justify-center shrink-0">
                <FaLink className="text-blue-500 text-sm" />
              </div>
              <span>Links</span>
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                toast.info(
                  "A página de configurações estará disponível em breve.",
                  "Configurações"
                );
              }}
              className="flex items-center gap-3 text-left text-sm text-zinc-400 hover:text-white py-1.5 cursor-pointer"
            >
              <div className="w-8 flex items-center justify-center shrink-0">
                <FiSliders className="text-zinc-500 text-sm" />
              </div>
              <span>Configurações</span>
            </button>

            {user && (
              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="text-sm font-medium text-zinc-200">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                    toast.success("Sessão encerrada com sucesso.");
                  }}
                  className="text-xs text-red-400 hover:text-red-300 hover:underline cursor-pointer font-medium p-1"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Sidebar Lateral para Desktop (hidden no mobile e tablet) */}
      <aside className="hidden lg:flex w-72 border-r border-zinc-900 bg-zinc-950 p-5 flex-col justify-between shrink-0 min-h-screen">
        <div>
          {/* Logo */}
          <Link to="/" className="font-bold text-lg text-white tracking-tight mb-8 block hover:text-zinc-200 transition-colors">
            Encurtador de URL
          </Link>

          {/* Menu de Navegação */}
          <nav className="flex flex-col gap-2">
            <button className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-medium transition-colors">
              <FaLink className="text-blue-500 text-sm" />
              <span>Links</span>
            </button>
            <button
              onClick={() =>
                toast.info(
                  "A página de configurações estará disponível em breve.",
                  "Configurações"
                )
              }
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/60 text-sm font-medium transition-colors cursor-pointer"
            >
              <FiSliders className="text-zinc-500 text-sm" />
              <span>Configurações</span>
            </button>
          </nav>
        </div>

        {/* Card do Usuário (Rodapé do Sidebar) */}
        {user && (
          <div className="bg-zinc-900 rounded-xl p-3 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate leading-tight">
                  {user.name}
                </p>
                <p
                  title={user.email}
                  className="text-xs text-zinc-500 leading-tight mt-0.5 truncate"
                >
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                toast.success("Sessão encerrada com sucesso.");
              }}
              title="Sair da conta"
              className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            >
              <FiLogOut size={16} />
            </button>
          </div>
        )}
      </aside>

      {/* Área Principal (Link Manager) */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 w-full">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Gerenciador de Links
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Gerencie seus links encurtados e acompanhe o desempenho geral.
            </p>
          </div>

          <button
            onClick={() => {
              setCreatedResult(null);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-xl transition-colors cursor-pointer text-sm shrink-0 w-full sm:w-auto"
          >
            <FiPlus size={18} />
            <span>Criar Novo Link</span>
          </button>
        </div>

        {/* Grid dos 3 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {/* Card 1: Total Clicks */}
          <div className="relative bg-zinc-900 rounded-2xl p-5 sm:p-6 flex flex-col justify-center gap-3 min-h-[144px]">
            <div className="absolute top-5 right-5 sm:top-6 sm:right-6 w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <FiMousePointer size={15} />
            </div>
            <span className="text-sm sm:text-base font-semibold text-zinc-300 block pr-12">
              Total de Cliques
            </span>
            <div className="text-3xl font-bold text-white tracking-tight pr-12">
              {stats.total_clicks.toLocaleString()}
            </div>
            <p className="text-xs text-zinc-400 pr-12">Todos os cliques registrados</p>
          </div>

          {/* Card 2: Total Links */}
          <div className="relative bg-zinc-900 rounded-2xl p-5 sm:p-6 flex flex-col justify-center gap-3 min-h-[144px]">
            <div className="absolute top-5 right-5 sm:top-6 sm:right-6 w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <FaLink className="text-xs" />
            </div>
            <span className="text-sm sm:text-base font-semibold text-zinc-300 block pr-12">
              Total de Links
            </span>
            <div className="text-3xl font-bold text-white tracking-tight pr-12">
              {stats.total_links.toLocaleString()}
            </div>
            <p className="text-xs text-zinc-400 pr-12">Links encurtados ativos</p>
          </div>

          {/* Card 3: Most Accessed */}
          <div className="relative bg-zinc-900 rounded-2xl p-5 sm:p-6 sm:col-span-2 xl:col-span-1 flex flex-col justify-center gap-3 min-h-[144px]">
            <div className="absolute top-5 right-5 sm:top-6 sm:right-6 w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <FiAward size={15} />
            </div>
            <span className="text-sm sm:text-base font-semibold text-zinc-300 block pr-12">
              Mais Acessado
            </span>
            <div className="min-w-0 pr-12">
              {stats.top_link ? (
                <Link
                  to={`/links/${stats.top_link.short_url}`}
                  title="Ver detalhes do link"
                  className="text-xl font-bold text-blue-400 hover:underline truncate block focus-visible:ring-2 focus-visible:ring-blue-500 rounded focus-visible:outline-none"
                >
                  {formatShortUrlDisplay(stats.top_link.short_url)}
                </Link>
              ) : (
                <div className="text-xl font-bold text-zinc-500">—</div>
              )}
            </div>
            <p className="text-xs text-zinc-400 truncate pr-12">
              {stats.top_link
                ? `${stats.top_link.clicks} cliques · ${stats.top_link.original_url}`
                : "Nenhum clique registrado ainda"}
            </p>
          </div>
        </div>

        {/* Tabela de Links */}
        <div className="bg-zinc-900 rounded-2xl p-5 sm:p-6 lg:p-7">
          {/* Barra de Busca e Filtros */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
            <div className="relative w-full sm:w-80 flex items-center">
              <FiSearch className="absolute left-3.5 text-zinc-400 text-sm" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar links encurtados..."
                aria-label="Buscar links encurtados"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-colors"
              />
            </div>

            {/* Dropdown de Ordenação Responsivo (Sem Borda) */}
            {/* Dropdown de Ordenação Responsivo com borda e contraste */}
            <div className="relative w-full sm:w-auto" ref={filterRef}>
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="w-full sm:w-auto flex items-center justify-between sm:justify-center gap-2.5 px-4 py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 rounded-xl text-xs font-medium text-zinc-300 transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <FiSliders size={13} className="text-zinc-400" />
                  <span>
                    Ordenar:{" "}
                    <strong className="text-white font-semibold">
                      {sortLabels[sortBy]}
                    </strong>
                  </span>
                </div>
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-2 w-full sm:w-60 bg-zinc-950 border border-zinc-800 rounded-xl p-1.5 z-50 flex flex-col gap-1 shadow-2xl animate-fade-in">
                  <span className="text-xs font-medium text-zinc-400 px-3 pt-2 pb-1">
                    Critério de ordenação
                  </span>
                  {(
                    [
                      { key: "recent", label: "Mais recentes primeiro" },
                      { key: "oldest", label: "Mais antigos primeiro" },
                      { key: "most_clicks", label: "Mais clicados (Top cliques)" },
                      { key: "least_clicks", label: "Menos clicados" },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        setSortBy(option.key);
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                        sortBy === option.key
                          ? "bg-blue-600 text-white font-semibold"
                          : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                      }`}
                    >
                      <span>{option.label}</span>
                      {sortBy === option.key && (
                        <FiCheck size={14} className="shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto -mx-5 sm:-mx-6 lg:-mx-7">
            <table className="w-full text-left text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-zinc-800 text-xs font-medium text-zinc-400 bg-zinc-950/40">
                  <th className="py-3.5 px-5 sm:px-7">Link encurtado</th>
                  <th className="py-3.5 px-5">Link original</th>
                  <th className="py-3.5 px-5 text-center">Cliques</th>
                  <th className="py-3.5 px-5 text-center">Criado em</th>
                  <th className="py-3.5 px-5 sm:px-7 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-500">
                      Carregando links...
                    </td>
                  </tr>
                ) : processedLinks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <p className="text-zinc-300 font-medium text-base">
                        Nenhum link encontrado
                      </p>
                      <p className="text-xs text-zinc-400 mt-1.5">
                        Clique em "Criar Novo Link" acima para criar sua primeira URL curta.
                      </p>
                    </td>
                  </tr>
                ) : (
                  processedLinks.map((item, index) => {
                    const rowId = item.id || item._id || String(index);
                    const fullShort = getFullShortUrl(item.short_url);
                    const isCopied = copiedId === rowId;

                    return (
                      <tr
                        key={rowId}
                        className="hover:bg-zinc-800/30 transition-colors"
                      >
                        {/* Short URL com link para detalhes e botão de cópia */}
                        <td className="py-4 px-5 sm:px-7">
                          <div className="flex items-center gap-2.5">
                            <Link
                              to={`/links/${item.short_url}`}
                              title="Ver detalhes do link"
                              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1.5 group rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                            >
                              <span>{formatShortUrlDisplay(item.short_url)}</span>
                            </Link>

                            <a
                              href={fullShort}
                              target="_blank"
                              rel="noreferrer"
                              title="Abrir destino original"
                              className="text-zinc-400 hover:text-zinc-200 transition-colors p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                              aria-label="Abrir destino em nova aba"
                            >
                              <FiExternalLink size={13} />
                            </a>

                            <button
                              onClick={() => handleCopy(item.short_url, rowId)}
                              title="Copiar link"
                              className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                              aria-label="Copiar link encurtado"
                            >
                              {isCopied ? (
                                <FiCheck size={14} className="text-green-400" />
                              ) : (
                                <FiCopy size={14} />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-4 px-5 text-zinc-400 truncate max-w-xs md:max-w-md lg:max-w-lg">
                          <span title={item.original_url} className="truncate block">
                            {item.original_url}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-center font-medium text-white">
                          {item.clicks.toLocaleString()}
                        </td>

                        <td className="py-4 px-5 text-center text-zinc-400 text-xs">
                          {formatDate(item.created_at)}
                        </td>

                        {/* Ações */}
                        <td className="py-4 px-5 sm:px-7 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              title="Editar link de destino"
                              className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                              aria-label="Editar link de destino"
                            >
                              <FiEdit2 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(item)}
                              title="Excluir link"
                              className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                              aria-label="Excluir link"
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Criar Novo Link */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-link-title"
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div className="bg-zinc-900 rounded-2xl max-w-lg w-full p-7 sm:p-8 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white cursor-pointer p-2 rounded-lg hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              aria-label="Fechar modal de criação"
            >
              <FiX size={20} />
            </button>

            <h3 id="create-link-title" className="text-xl font-bold text-white mb-2">
              Criar Novo Link Curto
            </h3>
            <p className="text-sm text-zinc-400 mb-6">
              Cole sua URL longa abaixo para gerar um link rastreável com QR Code.
            </p>

            <form onSubmit={handleCreateLink} className="space-y-4">
              <div>
                <label
                  htmlFor="create-destination-url"
                  className="block text-sm font-medium text-zinc-300 mb-2"
                >
                  URL de destino
                </label>
                <input
                  id="create-destination-url"
                  type="url"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://exemplo.com/pagina-muito-longa"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-base text-white placeholder-zinc-500 outline-none focus:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer text-base focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
              >
                {creating ? "Gerando..." : "Gerar Link Curto"}
              </button>
            </form>

            {/* Resultado do Link Criado no Modal */}
            {createdResult && (
              <div className="mt-6 pt-6 border-t border-zinc-800 flex flex-col items-center">
                <span className="text-sm text-emerald-400 font-medium mb-3">
                  ✓ Link criado com sucesso!
                </span>

                <div className="w-full bg-zinc-950 rounded-xl p-3.5 flex items-center justify-between mb-4">
                  <span className="text-blue-400 font-medium text-sm truncate mr-2">
                    {getFullShortUrl(createdResult.short_url)}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        getFullShortUrl(createdResult.short_url)
                      );
                      setModalCopied(true);
                      toast.success("Link copiado para a área de transferência!");
                      setTimeout(() => setModalCopied(false), 2000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded-lg transition-colors cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                  >
                    {modalCopied ? <FiCheck className="text-green-400" /> : <FiCopy />}
                    <span>{modalCopied ? "Copiado!" : "Copiar"}</span>
                  </button>
                </div>

                {/* QR Code */}
                <div className="bg-white p-2.5 rounded-xl">
                  {modalQrCodeUrl ? (
                    <img
                      src={modalQrCodeUrl}
                      alt="QR Code do link encurtado"
                      className="w-28 h-28 object-contain"
                    />
                  ) : (
                    <div className="w-28 h-28 bg-zinc-200 animate-pulse rounded" />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Editar Link de Destino */}
      {editingLink && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-link-title"
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div className="bg-zinc-900 rounded-2xl max-w-lg w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setEditingLink(null)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white cursor-pointer p-2 rounded-lg hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              aria-label="Fechar modal de edição"
            >
              <FiX size={20} />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <FiEdit2 size={20} />
              </div>
              <div>
                <h3 id="edit-link-title" className="text-xl font-bold text-white tracking-tight">
                  Editar Link de Destino
                </h3>
                <p className="text-sm text-zinc-400 mt-1">
                  Atualize para onde os usuários são redirecionados.
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmEdit} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Link encurtado (código fixo)
                </label>
                <div className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-400 select-all font-mono">
                  {getFullShortUrl(editingLink.short_url)}
                </div>
              </div>

              <div>
                <label
                  htmlFor="edit-destination-url"
                  className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2"
                >
                  Nova URL de destino
                </label>
                <input
                  id="edit-destination-url"
                  type="url"
                  required
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="https://exemplo.com/novo-destino"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm sm:text-base text-white placeholder-zinc-500 outline-none focus:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-zinc-800 w-full">
                <button
                  type="button"
                  onClick={() => setEditingLink(null)}
                  disabled={savingEdit}
                  className="flex-1 flex items-center justify-center py-2.5 min-h-[42px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || !editUrl.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 min-h-[42px] bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
                >
                  {savingEdit ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Salvar alterações</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão de Link */}
      {deletingLink && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-link-title"
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div className="bg-zinc-900 rounded-2xl max-w-md w-full p-6 sm:p-7 relative border border-red-500/20">
            <button
              onClick={() => setDeletingLink(null)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white cursor-pointer p-2 rounded-lg hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
              aria-label="Fechar modal de exclusão"
            >
              <FiX size={20} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mb-4">
              <FiAlertTriangle size={24} />
            </div>

            <h3 id="delete-link-title" className="text-xl font-bold text-white tracking-tight mb-2">
              Excluir Link Encurtado?
            </h3>
            <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
              Esta ação é <strong className="text-red-400 font-semibold">irreversível</strong>. O link deixará de redirecionar e todos os QR Codes gerados pararão de funcionar.
            </p>

            <div className="bg-zinc-950 rounded-xl p-3.5 border border-zinc-800/80 mb-6 space-y-1.5">
              <div className="text-xs text-zinc-400 font-medium">Link a ser excluído:</div>
              <div className="text-sm font-bold text-blue-400 font-mono truncate">
                {getFullShortUrl(deletingLink.short_url)}
              </div>
              <div className="text-xs text-zinc-400 truncate">
                Destino: {deletingLink.original_url}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => setDeletingLink(null)}
                disabled={isDeleting}
                className="flex-1 flex items-center justify-center py-2.5 min-h-[42px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 min-h-[42px] bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <span>Excluir link</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
