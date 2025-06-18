import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './use-toast';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const toastIcons = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  info: InformationCircleIcon,
};

const toastColors = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
};

export function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = toastIcons[toast.type || 'info'];
          const bgColor = toastColors[toast.type || 'info'];

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`${bgColor} text-white p-4 rounded-lg shadow-lg min-w-[300px] max-w-md flex items-start gap-3`}
            >
              <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium">{toast.title}</h3>
                {toast.description && (
                  <p className="text-sm text-white/90 mt-1">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => {
                  // Close functionality will be handled by the timeout in useToast
                }}
                className="text-white/80 hover:text-white"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
} 