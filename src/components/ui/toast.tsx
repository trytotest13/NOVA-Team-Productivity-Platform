'use client';

import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'info';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastItem extends Required<Omit<ToastOptions, 'description'>> {
  id: number;
  description?: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, { border: string; icon: ReactNode }> = {
  success: {
    border: 'border-l-green-600',
    icon: <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden />,
  },
  error: {
    border: 'border-l-red-600',
    icon: <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden />,
  },
  info: { border: 'border-l-sky-600', icon: <Info className="h-5 w-5 text-sky-600" aria-hidden /> },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const nextId = useRef(1);

  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = 'info' }: ToastOptions) => {
      const id = nextId.current;
      nextId.current += 1;
      setToasts((current) => [...current, { id, title, description, variant }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted && toasts.length > 0
        ? createPortal(
            <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
              {toasts.map((item) => (
                <div
                  key={item.id}
                  role={item.variant === 'error' ? 'alert' : 'status'}
                  aria-live={item.variant === 'error' ? 'assertive' : 'polite'}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border border-l-[3px] border-slate-200 bg-white p-3 shadow-lg',
                    variantStyles[item.variant].border,
                  )}
                >
                  {variantStyles[item.variant].icon}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    {item.description ? (
                      <p className="mt-0.5 text-sm text-slate-600">{item.description}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    aria-label="Dismiss notification"
                    onClick={() => dismiss(item.id)}
                    className="rounded-md p-0.5 text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
