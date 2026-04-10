import React from 'react';
import { FiAlertCircle, FiX } from 'react-icons/fi';
import '../style/Dialog.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'warning',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <FiAlertCircle className="dialog-icon dialog-icon-danger" />;
      case 'warning':
        return <FiAlertCircle className="dialog-icon dialog-icon-warning" />;
      case 'info':
        return <FiAlertCircle className="dialog-icon dialog-icon-info" />;
      default:
        return null;
    }
  };

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-content" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <div className="dialog-title">
            {getIcon()}
            <h3>{title}</h3>
          </div>
          <button className="dialog-close" onClick={onCancel}>
            <FiX />
          </button>
        </div>
        <div className="dialog-body">
          <p>{message}</p>
        </div>
        <div className="dialog-footer">
          <button className="dialog-button dialog-button-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button 
            className={`dialog-button dialog-button-confirm dialog-button-${type}`} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}; 