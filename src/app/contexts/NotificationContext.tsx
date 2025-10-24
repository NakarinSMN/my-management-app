'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { NotificationData } from '../components/Notification';

interface NotificationContextType {
  notifications: NotificationData[];
  showNotification: (notification: Omit<NotificationData, 'id'>) => void;
  hideNotification: (id: string) => void;
  clearAllNotifications: () => void;
  showSuccess: (title: string, message: string, duration?: number) => void;
  showError: (title: string, message: string, duration?: number) => void;
  showWarning: (title: string, message: string, duration?: number) => void;
  showInfo: (title: string, message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const showNotification = useCallback((notification: Omit<NotificationData, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: NotificationData = {
      ...notification,
      id,
      duration: notification.duration || 5000,
      showClose: notification.showClose !== false
    };

    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const showSuccess = useCallback((title: string, message: string, duration?: number) => {
    showNotification({
      type: 'success',
      title,
      message,
      duration
    });
  }, [showNotification]);

  const showError = useCallback((title: string, message: string, duration?: number) => {
    showNotification({
      type: 'error',
      title,
      message,
      duration
    });
  }, [showNotification]);

  const showWarning = useCallback((title: string, message: string, duration?: number) => {
    showNotification({
      type: 'warning',
      title,
      message,
      duration
    });
  }, [showNotification]);

  const showInfo = useCallback((title: string, message: string, duration?: number) => {
    showNotification({
      type: 'info',
      title,
      message,
      duration
    });
  }, [showNotification]);

  const value: NotificationContextType = {
    notifications,
    showNotification,
    hideNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
