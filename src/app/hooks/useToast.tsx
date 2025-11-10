'use client';

import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((
    message: string, 
    type: Toast['type'] = 'info', 
    duration: number = 3000
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = { id, message, type, duration };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);

    return id;
  }, [removeToast]);

  const success = useCallback((message: string, duration?: number) => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    return showToast(message, 'error', duration);
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    return showToast(message, 'info', duration);
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number) => {
    return showToast(message, 'warning', duration);
  }, [showToast]);

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    info,
    warning,
  };
}

