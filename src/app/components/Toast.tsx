'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, 
  faExclamationCircle, 
  faInfoCircle, 
  faTimesCircle,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

export interface ToastProps {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: (id: string) => void;
}

export default function Toast({ id, message, type = 'info', onClose }: ToastProps) {
  const icons = {
    success: faCheckCircle,
    error: faTimesCircle,
    info: faInfoCircle,
    warning: faExclamationCircle,
  };

  const colors = {
    success: 'from-emerald-500 to-green-500',
    error: 'from-red-500 to-red-600',
    info: 'from-blue-500 to-blue-600',
    warning: 'from-yellow-400 to-orange-500',
  };

  const iconColors = {
    success: 'text-white',
    error: 'text-white',
    info: 'text-white',
    warning: 'text-white',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`bg-gradient-to-r ${colors[type]} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 min-w-[320px] max-w-md`}
    >
      <motion.div
        initial={{ rotate: 0, scale: 0 }}
        animate={{ rotate: 360, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
      >
        <FontAwesomeIcon icon={icons[type]} className={`text-2xl ${iconColors[type]}`} />
      </motion.div>
      
      <p className="flex-1 font-medium text-sm">{message}</p>
      
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onClose(id)}
        className="text-white/80 hover:text-white transition-colors"
      >
        <FontAwesomeIcon icon={faTimes} className="text-lg" />
      </motion.button>
    </motion.div>
  );
}

// Toast Container Component
interface ToastContainerProps {
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' | 'warning'; duration?: number }[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}

