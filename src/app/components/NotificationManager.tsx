'use client';

import React from 'react';
import { useNotification } from '../contexts/NotificationContext';
import NotificationContainer from './NotificationContainer';

const NotificationManager: React.FC = () => {
  const { notifications, hideNotification } = useNotification();

  return (
    <NotificationContainer
      notifications={notifications}
      onClose={hideNotification}
    />
  );
};

export default NotificationManager;
