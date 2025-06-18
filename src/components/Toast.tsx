import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'loading';
  onClose: () => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  loading: Loader2,
};

const colors = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  loading: 'bg-gray-800',
};

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    if (type !== 'loading') {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [type, onClose]);

  const Icon = icons[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-3 rounded-lg text-white shadow-lg backdrop-blur-sm"
      style={{
        background: type === 'loading' ? 'rgba(31, 41, 55, 0.8)' : `rgba(${
          type === 'success' ? '34, 197, 94' : '239, 68, 68'
        }, 0.8)`,
        boxShadow: `0 8px 32px rgba(${
          type === 'success' ? '34, 197, 94' : type === 'error' ? '239, 68, 68' : '31, 41, 55'
        }, 0.2)`,
      }}
    >
      <Icon className={`w-5 h-5 ${type === 'loading' ? 'animate-spin' : ''}`} />
      <span className="text-sm font-medium">{message}</span>
    </motion.div>
  );
} 