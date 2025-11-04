// src/app/contexts/DialogContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  onConfirm: () => void;
  showCancel: boolean;
  confirmText?: string;
  cancelText?: string;
}

interface DialogContextType {
  showDialog: (
    title: string,
    message: string,
    type?: 'success' | 'warning' | 'info' | 'error',
    onConfirm?: () => void,
    showCancel?: boolean,
    confirmText?: string,
    cancelText?: string
  ) => void;
  showSuccess: (title: string, message: string, onConfirm?: () => void) => void;
  showError: (title: string, message: string, onConfirm?: () => void) => void;
  showWarning: (title: string, message: string, onConfirm?: () => void) => void;
  showInfo: (title: string, message: string, onConfirm?: () => void) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  closeDialog: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
    showCancel: true
  });

  const showDialog = (
    title: string,
    message: string,
    type: 'success' | 'warning' | 'info' | 'error' = 'info',
    onConfirm: () => void = () => {},
    showCancel = true,
    confirmText = 'ยืนยัน',
    cancelText = 'ยกเลิก'
  ) => {
    setDialogState({
      isOpen: true,
      title,
      message,
      type,
      onConfirm,
      showCancel,
      confirmText,
      cancelText
    });
  };

  const closeDialog = () => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  };

  // Shortcut methods
  const showSuccess = (title: string, message: string, onConfirm: () => void = () => {}) => {
    showDialog(title, message, 'success', () => {
      onConfirm();
      closeDialog();
    }, false, 'ตกลง');
  };

  const showError = (title: string, message: string, onConfirm: () => void = () => {}) => {
    showDialog(title, message, 'error', () => {
      onConfirm();
      closeDialog();
    }, false, 'ตกลง');
  };

  const showWarning = (title: string, message: string, onConfirm: () => void = () => {}) => {
    showDialog(title, message, 'warning', () => {
      onConfirm();
      closeDialog();
    }, false, 'ตกลง');
  };

  const showInfo = (title: string, message: string, onConfirm: () => void = () => {}) => {
    showDialog(title, message, 'info', () => {
      onConfirm();
      closeDialog();
    }, false, 'ตกลง');
  };

  const showConfirm = (
    title: string, 
    message: string, 
    onConfirm: () => void
  ) => {
    showDialog(
      title, 
      message, 
      'warning', 
      () => {
        onConfirm();
        closeDialog();
      }, 
      true,
      'ยืนยัน',
      'ยกเลิก'
    );
  };

  return (
    <DialogContext.Provider 
      value={{ 
        showDialog, 
        showSuccess, 
        showError, 
        showWarning, 
        showInfo,
        showConfirm,
        closeDialog 
      }}
    >
      {children}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={dialogState.onConfirm}
        onCancel={closeDialog}
        showCancel={dialogState.showCancel}
      />
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}

