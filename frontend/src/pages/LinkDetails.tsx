import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  FiCopy,
  FiCheck,
  FiExternalLink,
  FiSliders,
  FiLogOut,
  FiMenu,
  FiX,
  FiArrowLeft,
  FiDownload,
  FiEdit2,
  FiTrash2,
  FiAlertTriangle,
} from "react-icons/fi";
import { FaLink } from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { api } from "../services/api";
import { getFullShortUrl } from "../config/env";
import QRCode from "qrcode";

interface UrlDetails {
  id: string;
  original_url: string;
  short_url: string;
  clicks: number;
  user_id?: string | null;
  created_at?: string;
  last_click_at?: string | null;
}

export const LinkDetails: React.FC = () => {
  const { shortUrl } = useParams<{ shortUrl: string }>();
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [linkData, setLinkData] = useState<UrlDetails | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de feedback de cópia e download
  const [copiedShort, setCopiedShort] = useState(false);
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);

  // Menu Mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Estados de Edição e Exclusão
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUrl, setEditUrl] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    async function fetchLinkDetails() {
      if (!shortUrl) return;
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<UrlDetails>(`/${shortUrl}/dashboard`);
        setLinkData(res.data);

        // Gera QR Code instantâneo em memória
        const full = getFullShortUrl(res.data.short_url);
        const qrData = await QRCode.toDataURL(full, {
          width: 500,
          margin: 1,
          color: { dark: "#000000", light: "#ffffff" },
        });
        setQrCodeDataUrl(qrData);
      } catch (err) {
        console.error("Erro ao carregar detalhes do link:", err);
        setError("Link não encontrado ou você não tem permissão para visualizá-lo.");
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated && shortUrl) {
      fetchLinkDetails();
    }
  }, [shortUrl, isAuthenticated]);

  // Fechar modais e menu ao pressionar a tecla Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (isEditModalOpen) setIsEditModalOpen(false);
        if (isDeleteModalOpen) setIsDeleteModalOpen(false);
        if (isMobileMenuOpen) setIsMobileMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditModalOpen, isDeleteModalOpen, isMobileMenuOpen]);

  const fullShortUrl = linkData ? getFullShortUrl(linkData.short_url) : "";

  function handleCopyShort() {
    if (!fullShortUrl) return;
    navigator.clipboard.writeText(fullShortUrl);
    setCopiedShort(true);
    toast.success("Link encurtado copiado!");
    setTimeout(() => setCopiedShort(false), 2000);
  }

  function handleCopyOriginal() {
    if (!linkData?.original_url) return;
    navigator.clipboard.writeText(linkData.original_url);
    setCopiedOriginal(true);
    toast.success("Link original copiado!");
    setTimeout(() => setCopiedOriginal(false), 2000);
  }

  function handleDownloadQr() {
    if (!qrCodeDataUrl || !linkData) return;
    try {
      setDownloadingQr(true);
      const downloadLink = document.createElement("a");
      downloadLink.href = qrCodeDataUrl;
      downloadLink.download = `qrcode-${linkData.short_url}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast.success("Download do QR Code iniciado!");
    } catch (err) {
      console.error("Erro ao baixar QR code:", err);
      toast.error("Não foi possível baixar o QR Code.");
    } finally {
      setDownloadingQr(false);
    }
  }

  // Formato: "25 de set. de 2026 · 21:44"
  function formatDateTime(dateStr?: string | null) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const datePart = date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timePart = date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${datePart} · ${timePart}`;
  }

  function handleOpenEdit() {
    if (!linkData) return;
    setEditUrl(linkData.original_url);
    setIsEditModalOpen(true);
  }

  async function handleConfirmEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!linkData || !editUrl.trim()) return;

    try {
      setIsSavingEdit(true);
      await api.patch(`/${linkData.short_url}`, {
        original_url: editUrl.trim(),
      });
      setLinkData((prev) =>
        prev ? { ...prev, original_url: editUrl.trim() } : null
      );
      toast.success("Link de destino atualizado com sucesso!");
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Erro ao atualizar destino:", err);
      toast.error(
        "Não foi possível atualizar o link de destino. Tente novamente.",
        "Erro na atualização"
      );
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleConfirmDelete() {
    if (!linkData) return;

    try {
      setIsDeleting(true);
      await api.delete(`/${linkData.short_url}`);
      toast.success("Link encurtado excluído com sucesso!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Erro ao excluir link:", err);
      toast.error(
        "Não foi possível excluir o link. Tente novamente.",
        "Erro na exclusão"
      );
      setIsDeleting(false);
    }
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
      {/* Header Mobile e Tablet com Hambúrguer */}
      <header className="relative lg:hidden h-16 border-b border-zinc-900 px-4 sm:px-6 flex items-center justify-between bg-zinc-950 z-30 shrink-0">
        <Link to="/" className="font-bold text-lg tracking-tight hover:text-zinc-200 transition-colors">
          Encurtador de URL
        </Link>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-zinc-400 hover:text-white p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none cursor-pointer"
          aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {isMobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
        </button>

        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 w-full border-zinc-900 bg-zinc-950 border-b px-6 py-5 flex flex-col gap-3 z-40">
            <Link
              to="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 text-left text-sm text-blue-400 font-medium py-1.5"
            >
              <div className="w-8 flex items-center justify-center shrink-0">
                <FaLink className="text-blue-500 text-sm" />
              </div>
              <span>Links</span>
            </Link>
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
          <Link to="/" className="font-bold text-lg text-white tracking-tight mb-8 block hover:text-zinc-200 transition-colors">
            Encurtador de URL
          </Link>

          <nav className="flex flex-col gap-2">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-medium transition-colors"
            >
              <FaLink className="text-blue-500 text-sm" />
              <span>Links</span>
            </Link>
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
                  className="text-xs text-zinc-400 leading-tight mt-0.5 truncate"
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
              aria-label="Sair da conta"
              className="text-zinc-400 hover:text-red-400 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
            >
              <FiLogOut size={16} />
            </button>
          </div>
        )}
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 w-full">
        {/* Breadcrumb & Botão Voltar */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400 mb-5">
          <Link
            to="/dashboard"
            className="hover:text-white transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded px-1 -ml-1"
          >
            <FiArrowLeft size={14} />
            <span>Links</span>
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-300 font-mono truncate max-w-xs">
            {shortUrl}
          </span>
        </div>

        {/* Top Header com Ações */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Detalhes do Link
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Informações e métricas da URL encurtada.
            </p>
          </div>

          {linkData && (
            <div className="grid grid-cols-3 gap-2.5 w-full sm:flex sm:w-auto shrink-0">
              <a
                href={fullShortUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[38px] bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto text-center focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none"
              >
                <FiExternalLink size={15} />
                <span>Abrir link</span>
              </a>

              <button
                type="button"
                onClick={handleCopyShort}
                className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[38px] bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer w-full sm:w-auto text-center focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
              >
                {copiedShort ? <FiCheck size={16} className="text-green-300" /> : <FiCopy size={15} />}
                <span>{copiedShort ? "Copiado!" : "Copiar link"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[38px] bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-red-400 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer w-full sm:w-auto text-center focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
              >
                <FiTrash2 size={15} />
                <span>Excluir</span>
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center text-zinc-400">
            Carregando detalhes do link...
          </div>
        ) : error ? (
          <div className="p-6 bg-red-500/10 rounded-2xl text-red-400 text-sm">
            {error}
          </div>
        ) : linkData ? (
          <>
            {/* Card Principal (Sem borda) */}
            <div className="bg-zinc-900 rounded-2xl p-6 sm:p-7 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-zinc-800">
                <div>
                  <span className="text-xs font-medium text-zinc-400 block mb-2">
                    Link encurtado
                  </span>
                  <a
                    href={fullShortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-3xl sm:text-4xl font-bold text-blue-400 hover:text-blue-300 transition-colors break-all tracking-tight focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none rounded-lg"
                  >
                    {fullShortUrl.replace(/^https?:\/\//, '')}
                  </a>
                </div>

                <div className="sm:text-right shrink-0">
                  <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-none">
                    {linkData.clicks.toLocaleString()}
                  </div>
                  <span className="text-xs text-zinc-400 block mt-2">
                    Total de cliques
                  </span>
                </div>
              </div>

              {/* Seção da Original URL */}
              <div className="pt-6">
                <span className="text-xs sm:text-sm font-medium text-zinc-400 block mb-3">
                  Link original
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <a
                    href={linkData.original_url}
                    target="_blank"
                    rel="noreferrer"
                    title={linkData.original_url}
                    className="text-base sm:text-lg font-medium text-zinc-400 hover:text-zinc-300 transition-colors break-all truncate max-w-2xl focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none rounded"
                  >
                    {linkData.original_url}
                  </a>

                  <div className="grid grid-cols-3 gap-2.5 w-full sm:flex sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={handleOpenEdit}
                      className="flex items-center justify-center gap-2 px-3.5 py-2 min-h-[36px] bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium rounded-xl transition-colors cursor-pointer w-full sm:w-auto focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                    >
                      <FiEdit2 size={14} />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyOriginal}
                      className="flex items-center justify-center gap-2 px-3.5 py-2 min-h-[36px] bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs sm:text-sm font-medium rounded-xl transition-colors cursor-pointer w-full sm:w-auto focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none"
                    >
                      {copiedOriginal ? <FiCheck size={16} className="text-green-400" /> : <FiCopy size={15} />}
                      <span>{copiedOriginal ? "Copiado!" : "Copiar"}</span>
                    </button>

                    <a
                      href={linkData.original_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 px-3.5 py-2 min-h-[36px] bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs sm:text-sm font-medium rounded-xl transition-colors w-full sm:w-auto focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none"
                    >
                      <FiExternalLink size={15} />
                      <span>Abrir</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção: Informações do Link */}
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
                Informações do link
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                {/* Card 1: QR code */}
                <div className="bg-zinc-900 rounded-2xl p-6 sm:p-7 flex flex-col min-h-[175px]">
                  <span className="text-sm font-medium text-zinc-400 block">
                    QR Code
                  </span>
                  <div className="flex-1 flex items-center my-3">
                    <div className="flex items-center gap-3.5 w-full">
                      <div className="bg-white p-1.5 rounded-xl shrink-0">
                        {qrCodeDataUrl ? (
                          <img
                            src={qrCodeDataUrl}
                            alt="QR Code"
                            className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                          />
                        ) : (
                          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-zinc-200 animate-pulse rounded" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadQr}
                        disabled={downloadingQr}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 min-h-[38px] bg-zinc-800 hover:bg-zinc-700 text-white text-xs sm:text-sm font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                      >
                        <FiDownload size={15} className="text-blue-400" />
                        <span>{downloadingQr ? "Baixando..." : "Baixar PNG"}</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-400">
                    Alta resolução (500x500 px)
                  </p>
                </div>

                {/* Card 2: Criado em */}
                <div className="bg-zinc-900 rounded-2xl p-6 sm:p-7 flex flex-col min-h-[175px]">
                  <span className="text-sm font-medium text-zinc-400 block">
                    Criado em
                  </span>
                  <div className="flex-1 flex items-center my-3">
                    <span className="font-bold text-lg sm:text-xl xl:text-2xl text-white tracking-tight">
                      {formatDateTime(linkData.created_at) || "—"}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-400">
                    Data e horário de criação
                  </p>
                </div>

                {/* Card 3: Último clique */}
                <div className="bg-zinc-900 rounded-2xl p-6 sm:p-7 flex flex-col min-h-[175px]">
                  <span className="text-sm font-medium text-zinc-400 block">
                    Último clique
                  </span>
                  <div className="flex-1 flex items-center my-3">
                    <span className="font-bold text-lg sm:text-xl xl:text-2xl text-white tracking-tight">
                      {formatDateTime(linkData.last_click_at) || "Nenhum clique ainda"}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-400">
                    {linkData.last_click_at ? "Data do clique mais recente" : "Aguardando primeiro acesso"}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </main>

      {/* Modal Editar Link de Destino */}
      {isEditModalOpen && linkData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-edit-title"
            className="bg-zinc-900 rounded-2xl max-w-lg w-full p-6 sm:p-8 relative"
          >
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white cursor-pointer p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none"
              aria-label="Fechar modal de edição"
            >
              <FiX size={20} />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <FiEdit2 size={20} />
              </div>
              <div>
                <h3 id="modal-edit-title" className="text-xl font-bold text-white tracking-tight">
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
                  {fullShortUrl}
                </div>
              </div>

              <div>
                <label htmlFor="edit-dest-url" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Nova URL de destino
                </label>
                <input
                  id="edit-dest-url"
                  type="url"
                  required
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="https://exemplo.com/novo-destino"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm sm:text-base text-white placeholder-zinc-500 outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-zinc-800 w-full">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSavingEdit}
                  className="flex-1 flex items-center justify-center py-2.5 min-h-[42px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit || !editUrl.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 min-h-[42px] bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
                >
                  {isSavingEdit ? (
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
      {isDeleteModalOpen && linkData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-delete-title"
            className="bg-zinc-900 rounded-2xl max-w-md w-full p-6 sm:p-7 relative border border-red-500/20"
          >
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white cursor-pointer p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none"
              aria-label="Fechar modal de confirmação"
            >
              <FiX size={20} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mb-4">
              <FiAlertTriangle size={24} />
            </div>

            <h3 id="modal-delete-title" className="text-xl font-bold text-white tracking-tight mb-2">
              Excluir Link Encurtado?
            </h3>
            <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
              Esta ação é <strong className="text-red-400 font-semibold">irreversível</strong>. O link deixará de redirecionar e todos os QR Codes gerados pararão de funcionar.
            </p>

            <div className="bg-zinc-950 rounded-xl p-3.5 border border-zinc-800/80 mb-6 space-y-1.5">
              <div className="text-xs text-zinc-400 font-medium">Link a ser excluído:</div>
              <div className="text-sm font-bold text-blue-400 font-mono truncate">
                {fullShortUrl}
              </div>
              <div className="text-xs text-zinc-400 truncate">
                Destino: {linkData.original_url}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
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

export default LinkDetails;
