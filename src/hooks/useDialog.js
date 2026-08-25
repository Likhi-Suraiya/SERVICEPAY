// hooks/useDialog.js
import { useState, useCallback } from 'react';

export const useDialog = () => {
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info', // 'info', 'success', 'error', 'warning', 'confirm'
    onConfirm: null,
    onCancel: null,
    showConfirm: false,
    confirmText: 'OK',
    cancelText: 'Cancel',
    isConfirmDialog: false
  });

  // For regular alerts/info dialogs
  const showDialog = useCallback((title, message, type = 'info') => {
    setDialog({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: null,
      onCancel: null,
      showConfirm: false,
      confirmText: 'OK',
      cancelText: 'Cancel',
      isConfirmDialog: false
    });
  }, []);

  // For confirmation dialogs
  const showConfirmDialog = useCallback((title, message, onConfirm, onCancel = null, options = {}) => {
    setDialog({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm,
      onCancel,
      showConfirm: true,
      confirmText: options.confirmText || 'Yes',
      cancelText: options.cancelText || 'No',
      isConfirmDialog: true
    });
  }, []); 

  const hideDialog = useCallback(() => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (dialog.onConfirm) {
      dialog.onConfirm();
    }
    hideDialog();
  }, [dialog, hideDialog]);

  const handleCancel = useCallback(() => {
    if (dialog.onCancel) {
      dialog.onCancel();
    }
    hideDialog();
  }, [dialog, hideDialog]);

  return {
    dialog,
    showDialog,
    showConfirmDialog,
    hideDialog,
    handleConfirm,
    handleCancel
  };
};