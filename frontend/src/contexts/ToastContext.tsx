import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiAlertTriangle,
  FiX,
} from "react-icons/fi";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
  isExiting?: boolean;
}

interface ToastContextType {
  toast: {
    success: (message: string, title?: string, duration?: number) => void;
    error: (message: string, title?: string, duration?: number) => void;
    info: (message: string, title?: string, duration?: number) => void;
    warning: (message: string, title?: string, duration?: number) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => {
      const target = prev.find((t) => t.id === id);
      if (!target || target.isExiting) return prev;
      return prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t));
    });

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, title?: string, duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setToasts((prev) => [...prev, { id, type, message, title, duration, isExiting: false }]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast],
  );

  const toast = {
    success: useCallback(
      (msg: string, title?: string, duration?: number) =>
        addToast("success", msg, title, duration),
      [addToast],
    ),
    error: useCallback(
      (msg: string, title?: string, duration?: number) =>
        addToast("error", msg, title, duration),
      [addToast],
    ),
    info: useCallback(
      (msg: string, title?: string, duration?: number) =>
        addToast("info", msg, title, duration),
      [addToast],
    ),
    warning: useCallback(
      (msg: string, title?: string, duration?: number) =>
        addToast("warning", msg, title, duration),
      [addToast],
    ),
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast: dismissToast }}>
      {children}

      {/* Container dos Toasts flutuantes: canto inferior direito no desktop e canto inferior no mobile */}
      <div
        className="fixed bottom-5 right-0 left-0 sm:left-auto sm:right-5 z-[9999] flex flex-col gap-2.5 max-w-md mx-auto sm:mx-0 w-full px-4 sm:px-0 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((item) => {
          const iconConfig = {
            success: {
              icon: <FiCheckCircle className="text-emerald-400 shrink-0" size={20} />,
              bgIcon: "bg-emerald-500/10",
              titleColor: "text-emerald-400",
            },
            error: {
              icon: <FiAlertCircle className="text-red-400 shrink-0" size={20} />,
              bgIcon: "bg-red-500/10",
              titleColor: "text-red-400",
            },
            info: {
              icon: <FiInfo className="text-blue-400 shrink-0" size={20} />,
              bgIcon: "bg-blue-500/10",
              titleColor: "text-blue-400",
            },
            warning: {
              icon: <FiAlertTriangle className="text-amber-400 shrink-0" size={20} />,
              bgIcon: "bg-amber-500/10",
              titleColor: "text-amber-400",
            },
          }[item.type];

          return (
            <div
              key={item.id}
              className={`pointer-events-auto w-full bg-zinc-900 border border-zinc-800/80 shadow-2xl rounded-2xl p-4 flex items-start gap-3.5 ${
                item.isExiting ? "animate-toast-exit pointer-events-none" : "animate-fade-in"
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${iconConfig.bgIcon}`}>
                {iconConfig.icon}
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                {item.title && (
                  <p className="text-base font-semibold text-white mb-1 tracking-tight">
                    {item.title}
                  </p>
                )}
                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                  {item.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => dismissToast(item.id)}
                className="text-zinc-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none"
                aria-label="Fechar notificação"
              >
                <FiX size={18} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser utilizado dentro de um ToastProvider");
  }
  return context;
}
