'use client';

import React from 'react';
import Notification, { NotificationData } from './Notification';

interface NotificationContainerProps {
  notifications: NotificationData[];
  onClose: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({ 
  notifications, 
  onClose 
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-h-screen overflow-hidden">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className="transform transition-all duration-500 ease-out"
          style={{
            transform: `translateY(${index * 8}px) scale(${1 - index * 0.05})`,
            zIndex: 50 - index,
            opacity: 1 - index * 0.1
          }}
        >
          <Notification
            notification={notification}
            onClose={onClose}
          />
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;
