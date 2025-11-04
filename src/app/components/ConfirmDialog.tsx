// src/app/components/ConfirmDialog.tsx
'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, 
  faExclamationTriangle, 
  faInfoCircle, 
  faTimesCircle 
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'success' | 'warning' | 'info' | 'error';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  showCancel?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  type = 'warning',
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  onConfirm,
  onCancel,
  showCancel = true
}) => {
  if (!isOpen) return null;

  const getIcon = (): IconDefinition => {
    switch (type) {
      case 'success':
        return faCheckCircle;
      case 'error':
        return faTimesCircle;
      case 'info':
        return faInfoCircle;
      case 'warning':
      default:
        return faExclamationTriangle;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-500',
          text: 'text-green-500',
          buttonBg: 'bg-green-600 hover:bg-green-700',
          border: 'border-green-200 dark:border-green-800'
        };
      case 'error':
        return {
          bg: 'bg-red-500',
          text: 'text-red-500',
          buttonBg: 'bg-red-600 hover:bg-red-700',
          border: 'border-red-200 dark:border-red-800'
        };
      case 'info':
        return {
          bg: 'bg-blue-500',
          text: 'text-blue-500',
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
          border: 'border-blue-200 dark:border-blue-800'
        };
      case 'warning':
      default:
        return {
          bg: 'bg-orange-500',
          text: 'text-orange-500',
          buttonBg: 'bg-orange-600 hover:bg-orange-700',
          border: 'border-orange-200 dark:border-orange-800'
        };
    }
  };

  const colors = getColors();

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[9999] p-4 animate-fadeIn"
      style={{
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)'
      }}
      onClick={showCancel ? onCancel : undefined}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Icon Section */}
        <div className="p-6 text-center">
          <div className={`w-16 h-16 ${colors.bg} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
            <FontAwesomeIcon icon={getIcon()} className="text-white text-3xl" />
          </div>
          
          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          
          {/* Message */}
          <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div className={`px-6 pb-6 flex gap-3 ${showCancel ? 'flex-row' : 'justify-center'}`}>
          {showCancel && (
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`${showCancel ? 'flex-1' : 'px-12'} px-6 py-3 ${colors.buttonBg} text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg transform hover:scale-105`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

