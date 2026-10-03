import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FaLink } from "react-icons/fa6";
import { FiCheck, FiDownload } from "react-icons/fi";
import QRCode from "qrcode";
import { api } from "../services/api";
import { useToast } from "../contexts/ToastContext";
import { getFullShortUrl } from "../config/env";

interface ShortenedResponse {
  short_url: string;
  original_url: string;
}

export function Hero() {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [createdUrl, setCreatedUrl] = useState<ShortenedResponse | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullUrl = createdUrl
    ? getFullShortUrl(createdUrl.short_url)
    : "";

  async function handleShorten(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    try {
      setLoading(true);
      const response = await api.post<ShortenedResponse>("/", {
        original_url: url,
      });

      const fullShortUrl = getFullShortUrl(response.data.short_url);

      // Gerar QR Code instantâneo em memória (alta resolução)
      const qrData = await QRCode.toDataURL(fullShortUrl, {
        width: 600,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      // Pré-decodificar os pixels na memória do navegador antes de renderizar na tela
      const img = new Image();
      img.src = qrData;
      try {
        await img.decode();
      } catch {
        // Fallback gracioso caso decode não seja suportado
      }

      // Transição suave de saída do formulário
      setIsTransitioning(true);

      setTimeout(() => {
        setCreatedUrl(response.data);
        setQrCodeDataUrl(qrData);
        setUrl("");
        setIsTransitioning(false);
        toast.success("Seu link foi encurtado com sucesso!");
      }, 220);
    } catch (error) {
      console.error("Erro ao encurtar URL:", error);
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
      setLoading(false);
    }
  }

  function handleReset() {
    setIsTransitioning(true);
    setTimeout(() => {
      setCreatedUrl(null);
      setQrCodeDataUrl(null);
      setUrl("");
      setIsTransitioning(false);
    }, 220);
  }

  function handleCopy() {
    if (!fullUrl) return;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success("Link copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadQr() {
    if (!qrCodeDataUrl || !createdUrl) return;
    try {
      const downloadLink = document.createElement("a");
      downloadLink.href = qrCodeDataUrl;
      downloadLink.download = `qrcode-${createdUrl.short_url}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast.success("Download do QR Code iniciado!");
    } catch (err) {
      console.error("Erro ao baixar QR code:", err);
      toast.error("Não foi possível baixar o QR Code.");
    }
  }

  return (
    <main>
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-6 py-12">
        {!createdUrl ? (
          /* Estado Inicial: Hero com Título, Subtítulo e Formulário de Input (Sem borda) */
          <div
            className={`w-full max-w-2xl flex flex-col items-center ${
              isTransitioning
                ? "animate-fade-out pointer-events-none"
                : "animate-fade-in"
            }`}
          >
            <div className="text-center mb-8">
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
                Links curtos que geram mais{" "}
                <span className="text-blue-500">cliques</span>.
              </h1>
              <p className="text-zinc-400 text-base md:text-lg">
                Encurte, compartilhe e acompanhe seus links com facilidade.
              </p>
            </div>

            <form
              onSubmit={handleShorten}
              className="w-full bg-zinc-900 rounded-2xl p-2 flex flex-col sm:flex-row items-center gap-2 focus-within:ring-1 focus-within:ring-blue-600 transition-all"
            >
              <div className="flex items-center gap-3 w-full flex-1 px-3 py-1">
                <FaLink className="text-zinc-500 text-lg shrink-0" />
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Cole seu link longo aqui (ex: https://...)"
                  className="bg-transparent text-white placeholder-zinc-500 outline-none w-full text-sm md:text-base"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl cursor-pointer transition-colors shrink-0"
              >
                {loading ? "Encurtando..." : "Encurtar"}
              </button>
            </form>
          </div>
        ) : (
          /* Estado Pós-Criação: Card Idêntico ao Modelo de Design (Sem borda) */
          <div
            className={`w-full max-w-xl flex flex-col items-center ${
              isTransitioning
                ? "animate-fade-out pointer-events-none"
                : "animate-fade-in"
            }`}
          >
            {/* Ícone de Sucesso Circular */}
            <div className="w-12 h-12 rounded-full border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
              <FiCheck size={22} className="stroke-[2.5]" />
            </div>

            {/* Título Principal de Sucesso */}
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center tracking-tight">
              Seu link está pronto!
            </h2>

            {/* Card Principal - Sem Borda */}
            <div className="w-full bg-zinc-900 rounded-2xl p-6 sm:p-7">
              {/* Barra do Link Encurtado com Botão Copiar */}
              <div className="bg-zinc-950/80 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3">
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-base sm:text-lg text-[#8B5CF6] hover:text-[#a78bfa] transition-colors truncate break-all tracking-tight pl-1"
                >
                  {fullUrl.replace(/^https?:\/\//, "")}
                </a>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="bg-[#8B5CF6] hover:bg-[#7c3aed] text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer shrink-0"
                >
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>

              {/* Informação do Link Original */}
              <div className="mt-5">
                <span className="text-xs font-medium text-zinc-500 block mb-1.5">
                  Link original
                </span>
                <p
                  title={createdUrl.original_url}
                  className="text-sm text-zinc-400 truncate break-all"
                >
                  {createdUrl.original_url}
                </p>
              </div>

              {/* Divisória Sutil */}
              <div className="border-b border-zinc-800/80 my-5" />

              {/* Seção do QR Code Visível com Download Instantâneo */}
              <div
                onClick={handleDownloadQr}
                className="flex items-center gap-4 cursor-pointer group p-2 -m-2 rounded-xl hover:bg-zinc-800/30 transition-colors"
                title="Clique para baixar o QR Code em alta resolução"
              >
                <div className="bg-white p-2 rounded-xl shrink-0 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center overflow-hidden">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-200 animate-pulse rounded" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                      Baixar QR Code
                    </span>
                    <FiDownload
                      size={15}
                      className="text-zinc-500 group-hover:text-blue-400 transition-colors shrink-0"
                    />
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-1 leading-relaxed">
                    Compartilhe seu link em panfletos, apresentações e materiais impressos.
                  </p>
                </div>
              </div>
            </div>

            {/* Ações Inferiores (Criar outro link / Ir para o Dashboard) */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <button
                type="button"
                onClick={handleReset}
                className="text-sm font-medium text-zinc-400 hover:text-white underline underline-offset-4 cursor-pointer transition-colors"
              >
                Criar outro link
              </button>

              <Link
                to="/dashboard"
                className="px-5 py-2.5 rounded-xl bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
              >
                Ir para o Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
