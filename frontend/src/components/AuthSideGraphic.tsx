import React from "react";
import { FiTrendingUp, FiLink, FiSearch, FiBarChart2, FiLayers } from "react-icons/fi";
import { FaQrcode } from "react-icons/fa6";

export const AuthSideGraphic: React.FC = () => {
  return (
    <div className="hidden lg:flex flex-col justify-center items-center p-4 lg:p-6 xl:p-8 h-full min-h-screen select-none">
      {/* Container escuro arredondado principal (inspirado no Sana AI) */}
      <div className="w-full h-full max-h-[92vh] bg-[#0c0d10] border border-zinc-800/80 rounded-[32px] xl:rounded-[40px] p-6 xl:p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl">
        
        {/* Luzes de ambientação sutis de fundo */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Topo do dispositivo / Status */}
        <div className="flex items-center justify-between text-xs text-zinc-500 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-zinc-400">workspace / metrics</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-700" />
            <span className="w-2 h-2 rounded-full bg-zinc-700" />
            <span className="w-2 h-2 rounded-full bg-zinc-700" />
          </div>
        </div>

        {/* Mockup da Tela do Aplicativo em perspectiva sutil */}
        <div className="my-auto relative z-10 w-full max-w-xl mx-auto">
          {/* Carcaça do Laptop / Janela */}
          <div className="bg-[#14151a] border border-zinc-800 rounded-2xl shadow-2xl p-5 xl:p-6 relative overflow-hidden">
            
            {/* Notch / Câmera central */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-[#0c0d10] rounded-b-xl flex items-center justify-center gap-1.5 border-b border-x border-zinc-800/80">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
            </div>

            {/* Cabeçalho da aplicação */}
            <div className="mt-2 mb-6">
              <h3 className="text-xl xl:text-2xl font-semibold text-white tracking-tight">
                Olá, Michelle
              </h3>
              <p className="text-sm text-zinc-400 font-light mt-0.5">
                Como podemos impulsionar o alcance dos seus links hoje?
              </p>
            </div>

            {/* Label de seção */}
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-3 font-medium">
              <span>Links em destaque</span>
              <span className="text-zinc-600">Tempo real</span>
            </div>

            {/* Grid dos 3 Cards estilo Sana AI */}
            <div className="grid grid-cols-3 gap-3">
              
              {/* Card 1: Métricas de Cliques */}
              <div className="bg-[#1a1b22] hover:bg-[#20212a] border border-zinc-800/90 rounded-2xl p-3.5 flex flex-col justify-between transition-all group">
                <div>
                  <div className="w-7 h-7 rounded-lg bg-zinc-800/80 flex items-center justify-center text-blue-400 mb-2">
                    <FiTrendingUp size={14} />
                  </div>
                  <p className="text-[11px] font-medium text-zinc-300 leading-snug">
                    Total de Cliques
                  </p>
                </div>
                <div className="mt-4">
                  <span className="text-lg xl:text-xl font-bold text-white tracking-tight">
                    14.820
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium mt-0.5">
                    <span>+24.5%</span>
                  </div>
                </div>
              </div>

              {/* Card 2: O icônico Card Verde estilo Sana AI (PORTFOLIO & CV) */}
              <div className="bg-[#00D084] hover:bg-[#00df8e] rounded-2xl p-3.5 flex flex-col justify-between text-zinc-950 transition-all shadow-md group">
                <div>
                  <div className="w-7 h-7 rounded-lg bg-zinc-950/15 flex items-center justify-center text-zinc-950 mb-2">
                    <FiLink size={14} />
                  </div>
                  <p className="text-[11px] font-extrabold uppercase tracking-tight leading-snug">
                    PORTFÓLIO & CV 2026
                  </p>
                </div>
                <div className="mt-4">
                  <span className="text-base xl:text-lg font-black tracking-tight block">
                    encurta.link/cv
                  </span>
                  <span className="text-[10px] font-bold text-zinc-900/80">
                    1.840 cliques únicos
                  </span>
                </div>
              </div>

              {/* Card 3: Card com QR Code / Compartilhamento */}
              <div className="bg-[#1a1b22] hover:bg-[#20212a] border border-zinc-800/90 rounded-2xl p-3.5 flex flex-col justify-between transition-all group">
                <div>
                  <div className="w-7 h-7 rounded-lg bg-zinc-800/80 flex items-center justify-center text-purple-400 mb-2">
                    <FaQrcode size={14} />
                  </div>
                  <p className="text-[11px] font-medium text-zinc-300 leading-snug">
                    QR Code Ativo
                  </p>
                </div>
                <div className="mt-4">
                  <span className="text-xs font-semibold text-zinc-200 block truncate">
                    github.com/projeto
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Redirecionando 307</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Barra inferior de ação simulada dentro da interface */}
            <div className="mt-5 bg-[#0c0d10] border border-zinc-800/80 rounded-full px-4 py-2.5 flex items-center gap-2.5 text-zinc-500 text-xs">
              <FiSearch size={13} className="text-zinc-500" />
              <span className="truncate">Cole uma URL longa para encurtar ou busque seus links...</span>
            </div>

          </div>

          {/* Base do Laptop (perspectiva com trackpad sutil) */}
          <div className="w-[94%] mx-auto h-3 bg-[#1e2027] border-t border-zinc-700/40 rounded-b-xl shadow-lg relative flex items-center justify-center">
            <div className="w-16 h-0.5 bg-zinc-600/50 rounded-full" />
          </div>
        </div>

        {/* Rodapé interno minimalista */}
        <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 relative z-10 border-t border-zinc-800/60">
          <div className="flex items-center gap-2 text-zinc-400">
            <FiBarChart2 size={13} className="text-blue-400" />
            <span>Métricas em tempo real sincronizadas com MongoDB Atlas</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <FiLayers size={13} />
            <span>FastAPI Async</span>
          </div>
        </div>

      </div>
    </div>
  );
};
