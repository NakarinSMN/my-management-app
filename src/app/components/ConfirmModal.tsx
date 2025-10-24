'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faCheck } from '@fortawesome/free-solid-svg-icons';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  requireTyping?: boolean;
  typingPrompt?: string;
  expectedText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  type = 'danger',
  isLoading = false,
  requireTyping = false,
  typingPrompt = 'กรุณาพิมพ์ชื่อเพื่อยืนยัน',
  expectedText = ''
}) => {
  const [typedText, setTypedText] = React.useState('');
  const [isTypingValid, setIsTypingValid] = React.useState(false);

  React.useEffect(() => {
    if (requireTyping && expectedText) {
      setIsTypingValid(typedText === expectedText);
    }
  }, [typedText, expectedText, requireTyping]);

  const handleConfirm = () => {
    if (requireTyping && !isTypingValid) {
      return;
    }
    onConfirm();
  };

  const handleClose = () => {
    setTypedText('');
    setIsTypingValid(false);
    onClose();
  };
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: faExclamationTriangle,
          iconColor: 'text-red-500',
          confirmButton: 'bg-gray-400 hover:bg-gray-500 text-white',
          borderColor: 'border-red-200'
        };
      case 'warning':
        return {
          icon: faExclamationTriangle,
          iconColor: 'text-yellow-500',
          confirmButton: 'bg-gray-400 hover:bg-gray-500 text-white',
          borderColor: 'border-yellow-200'
        };
      case 'info':
        return {
          icon: faExclamationTriangle,
          iconColor: 'text-blue-500',
          confirmButton: 'bg-gray-400 hover:bg-gray-500 text-white',
          borderColor: 'border-blue-200'
        };
      default:
        return {
          icon: faExclamationTriangle,
          iconColor: 'text-red-500',
          confirmButton: 'bg-gray-400 hover:bg-gray-500 text-white',
          borderColor: 'border-red-200'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 max-w-md w-full mx-4 shadow-lg">
        {/* Header */}
        <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-t-lg">
          <div className="flex-shrink-0">
            <FontAwesomeIcon
              icon={styles.icon}
              className={`w-5 h-5 ${styles.iconColor}`}
            />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            {message}
          </p>
          
          {requireTyping && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {typingPrompt}
              </label>
              <input
                type="text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder={`พิมพ์ &quot;${expectedText}&quot; เพื่อยืนยัน`}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-offset-1 transition-colors ${
                  isTypingValid 
                    ? 'border-green-400 focus:ring-green-400 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-300 dark:border-gray-500 focus:ring-gray-400 bg-white dark:bg-gray-700'
                }`}
                autoComplete="off"
              />
              {typedText && !isTypingValid && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                  ชื่อที่พิมพ์ไม่ตรงกับ &quot;{expectedText}&quot;
                </p>
              )}
              {isTypingValid && (
                <p className="mt-1 text-xs text-green-500 dark:text-green-400">
                  ✓ ชื่อถูกต้อง
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || (requireTyping && !isTypingValid)}
            className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-1 focus:ring-offset-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              requireTyping && !isTypingValid 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : styles.confirmButton
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
                กำลังดำเนินการ...
              </div>
            ) : (
              <div className="flex items-center">
                <FontAwesomeIcon icon={faCheck} className="w-3 h-3 mr-1" />
                {confirmText}
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
