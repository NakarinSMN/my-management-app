'use client';

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationCircle, faInfoCircle, faTimes, faWarning } from '@fortawesome/free-solid-svg-icons';

export interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  showClose?: boolean;
}

interface NotificationProps {
  notification: NotificationData;
  onClose: (id: string) => void;
}

const Notification: React.FC<NotificationProps> = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // แสดง notification
    const showTimer = setTimeout(() => setIsVisible(true), 100);
    
    // ซ่อน notification หลังจาก duration
    const hideTimer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onClose(notification.id), 300);
    }, notification.duration || 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [notification.id, notification.duration, onClose]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => onClose(notification.id), 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return faCheckCircle;
      case 'error':
        return faExclamationCircle;
      case 'warning':
        return faWarning;
      case 'info':
        return faInfoCircle;
      default:
        return faInfoCircle;
    }
  };

  const getColorClasses = () => {
    // ใช้สไตล์เหมือน label - สีเทาเข้ม พื้นหลังเกือบดำ ข้อความสีขาว
    return 'bg-gray-900/95 border-gray-600 text-white shadow-2xl backdrop-blur-md';
  };

  const getIconColor = () => {
    // ใช้สีขาวสำหรับไอคอนเพื่อให้สอดคล้องกับสไตล์ label
    return 'text-white';
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        transform transition-all duration-500 ease-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
        ${getColorClasses()}
        border rounded-xl backdrop-blur-md
        font-medium text-sm
        hover:scale-105 hover:shadow-2xl hover:bg-gray-800/95
        hover:border-gray-500 hover:backdrop-blur-lg
        transition-all duration-300 ease-in-out
        cursor-pointer
        notification-glow hover:notification-glow-hover
      `}
    >
      <div className="p-5">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all duration-200">
              <FontAwesomeIcon 
                icon={getIcon()} 
                className={`w-4 h-4 ${getIconColor()} hover:scale-110 transition-transform duration-200`}
              />
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-sm font-semibold text-white leading-tight hover:text-white/90 transition-colors duration-200">
              {notification.title}
            </h3>
            <p className="mt-2 text-sm text-white/90 leading-relaxed hover:text-white transition-colors duration-200">
              {notification.message}
            </p>
          </div>
          {notification.showClose !== false && (
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={handleClose}
                className="inline-flex rounded-lg p-2 hover:bg-white/30 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 text-white hover:text-white/90 hover:rotate-90"
              >
                <FontAwesomeIcon icon={faTimes} className="w-3 h-3 transition-transform duration-200" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notification;
