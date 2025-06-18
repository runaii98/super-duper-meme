import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast, ToastState, ToastOptions } from './use-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

interface ToastContextType {
  toast: (options: ToastOptions) => void;
  removeToast: (id: string) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ToastState>({ toasts: [] });

  const toast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2);
    const newToast: Toast = {
      id,
      ...options,
    };

    setState((prev) => ({
      toasts: [...prev.toasts, newToast],
    }));

    if (options.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, options.duration || 5000);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setState((prev) => ({
      toasts: prev.toasts.filter((t) => t.id !== id),
    }));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, removeToast, toasts: state.toasts }}>
      {children}
      <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4 w-full sm:max-w-[420px]">
        <AnimatePresence>
          {state.toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.3 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
            >
              <div className="flex p-4">
                <div className="flex-shrink-0">
                  {toast.type === 'success' && (
                    <CheckCircleIcon className="h-6 w-6 text-green-400" />
                  )}
                  {toast.type === 'error' && (
                    <ExclamationCircleIcon className="h-6 w-6 text-red-400" />
                  )}
                  {toast.type === 'info' && (
                    <InformationCircleIcon className="h-6 w-6 text-blue-400" />
                  )}
                </div>
                <div className="ml-3 w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {toast.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {toast.message}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
} 