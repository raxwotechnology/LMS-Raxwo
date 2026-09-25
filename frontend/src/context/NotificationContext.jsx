import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import './NotificationModal.css';

const NotificationContext = createContext(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  // Modal State: { isOpen, type: 'success'|'error'|'warning'|'info', title, message, onClose }
  const [modal, setModal] = useState(null);

  // Confirm Modal State: { isOpen, title, message, confirmText, cancelText, confirmBtnColor, icon, onConfirm, onCancel, resolve }
  const [confirmModal, setConfirmModal] = useState(null);

  // Floating Toasts: array of { id, message, type, duration }
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  // Normalize parameters helper
  const parseModalArgs = (titleOrMsg, message, defaultTitle, defaultType) => {
    if (typeof titleOrMsg === 'object' && titleOrMsg !== null) {
      return {
        type: titleOrMsg.type || defaultType,
        title: titleOrMsg.title || defaultTitle,
        message: titleOrMsg.message || '',
        onClose: titleOrMsg.onClose || null
      };
    }
    if (message === undefined) {
      return {
        type: defaultType,
        title: defaultTitle,
        message: String(titleOrMsg ?? ''),
        onClose: null
      };
    }
    return {
      type: defaultType,
      title: String(titleOrMsg),
      message: String(message ?? ''),
      onClose: null
    };
  };

  const showSuccess = useCallback((titleOrMsg, message) => {
    const opts = parseModalArgs(titleOrMsg, message, 'Success', 'success');
    setModal(opts);
  }, []);

  const showError = useCallback((titleOrMsg, message) => {
    const opts = parseModalArgs(titleOrMsg, message, 'Error', 'error');
    setModal(opts);
  }, []);

  const showWarning = useCallback((titleOrMsg, message) => {
    const opts = parseModalArgs(titleOrMsg, message, 'Warning', 'warning');
    setModal(opts);
  }, []);

  const showInfo = useCallback((titleOrMsg, message) => {
    const opts = parseModalArgs(titleOrMsg, message, 'Information', 'info');
    setModal(opts);
  }, []);

  const closeModal = useCallback(() => {
    if (modal && typeof modal.onClose === 'function') {
      try {
        modal.onClose();
      } catch (err) {
        console.error('Error in modal onClose callback:', err);
      }
    }
    setModal(null);
  }, [modal]);

  // Confirmation Modal - Returns Promise<boolean> and supports callbacks
  const showConfirm = useCallback((options = {}, messageArg, callbackArg) => {
    return new Promise((resolve) => {
      let opts = {};
      if (typeof options === 'string' && typeof messageArg === 'string') {
        opts = {
          title: options,
          message: messageArg,
          onConfirm: typeof callbackArg === 'function' ? callbackArg : undefined
        };
      } else if (typeof options === 'string') {
        opts = {
          message: options,
          onConfirm: typeof messageArg === 'function' ? messageArg : undefined
        };
      } else {
        opts = options || {};
      }

      const {
        title = 'Are you sure?',
        message = 'Please confirm this action.',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        confirmBtnColor = '#dc2626',
        icon = '!',
        onConfirm,
        onCancel
      } = opts;

      setConfirmModal({
        title,
        message,
        confirmText,
        cancelText,
        confirmBtnColor,
        icon,
        resolve,
        onConfirm,
        onCancel
      });
    });
  }, []);

  const handleConfirmAction = useCallback(() => {
    if (confirmModal) {
      const { resolve, onConfirm } = confirmModal;
      setConfirmModal(null);
      if (typeof onConfirm === 'function') {
        try {
          onConfirm();
        } catch (err) {
          console.error('Error in onConfirm callback:', err);
        }
      }
      if (resolve) resolve(true);
    }
  }, [confirmModal]);

  const handleCancelAction = useCallback(() => {
    if (confirmModal) {
      const { resolve, onCancel } = confirmModal;
      setConfirmModal(null);
      if (typeof onCancel === 'function') {
        try {
          onCancel();
        } catch (err) {
          console.error('Error in onCancel callback:', err);
        }
      }
      if (resolve) resolve(false);
    }
  }, [confirmModal]);

  // Toast Notifications
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message: String(message), type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const toastSuccess = useCallback((msg, duration) => showToast(msg, 'success', duration), [showToast]);
  const toastError = useCallback((msg, duration) => showToast(msg, 'error', duration), [showToast]);
  const toastWarning = useCallback((msg, duration) => showToast(msg, 'warning', duration), [showToast]);
  const toastInfo = useCallback((msg, duration) => showToast(msg, 'info', duration), [showToast]);

  // Safe window.alert Interception
  // Any component or third party still calling alert() will display our branded modal instead of the browser alert!
  useEffect(() => {
    const originalAlert = window.alert;

    window.alert = (msg) => {
      const messageStr = typeof msg === 'object' ? JSON.stringify(msg, null, 2) : String(msg ?? '');
      const isErr = /error|failed|please|invalid|not found|cannot|select/i.test(messageStr);
      const isSucc = /success|completed|created|saved|started|closed|removed|attended/i.test(messageStr);
      const isWarn = /warning|caution|alert/i.test(messageStr);

      const type = isErr ? 'error' : (isSucc ? 'success' : (isWarn ? 'warning' : 'info'));
      const title = isErr ? 'Notice' : (isSucc ? 'Success' : 'Notification');

      setModal({
        type,
        title,
        message: messageStr,
        onClose: null
      });
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  // Keyboard navigation (Escape closes, Enter confirms)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (confirmModal) {
          handleCancelAction();
        } else if (modal) {
          closeModal();
        }
      } else if (e.key === 'Enter') {
        if (confirmModal) {
          // If a confirm modal is open, enter triggers confirm
          handleConfirmAction();
        } else if (modal) {
          closeModal();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modal, confirmModal, closeModal, handleConfirmAction, handleCancelAction]);

  const getBadgeIcon = (type) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '!';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  const getPrimaryButtonColor = (type) => {
    switch (type) {
      case 'success':
        return '#16a34a';
      case 'error':
        return '#dc2626';
      case 'warning':
        return '#d97706';
      case 'info':
      default:
        return '#0369A1';
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm,
        showToast,
        toastSuccess,
        toastError,
        toastWarning,
        toastInfo,
        closeModal
      }}
    >
      {children}

      {/* Branded Alert / Information / Success / Error Modal */}
      {modal && (
        <div className="wisdom-modal-overlay" onClick={closeModal}>
          <div
            className={`wisdom-modal-card type-${modal.type}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className={`wisdom-modal-icon-badge type-${modal.type}`}>
              {getBadgeIcon(modal.type)}
            </div>
            <h3 className="wisdom-modal-title">{modal.title}</h3>
            <p className="wisdom-modal-message">{modal.message}</p>
            <div className="wisdom-modal-actions">
              <button
                type="button"
                className="wisdom-modal-btn wisdom-modal-btn-primary"
                style={{ backgroundColor: getPrimaryButtonColor(modal.type) }}
                onClick={closeModal}
                autoFocus
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Branded Confirmation Modal */}
      {confirmModal && (
        <div className="wisdom-modal-overlay" onClick={handleCancelAction}>
          <div
            className="wisdom-modal-card type-warning"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="wisdom-modal-icon-badge"
              style={{
                backgroundColor: confirmModal.confirmBtnColor === '#16a34a' ? '#dcfce7' : '#fee2e2',
                color: confirmModal.confirmBtnColor === '#16a34a' ? '#16a34a' : '#dc2626'
              }}
            >
              {confirmModal.icon || (confirmModal.confirmBtnColor === '#16a34a' ? '▶' : '!')}
            </div>
            <h3 className="wisdom-modal-title">{confirmModal.title}</h3>
            <p className="wisdom-modal-message">{confirmModal.message}</p>
            <div className="wisdom-modal-actions">
              <button
                type="button"
                className="wisdom-modal-btn wisdom-modal-btn-cancel"
                onClick={handleCancelAction}
              >
                {confirmModal.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                className="wisdom-modal-btn wisdom-modal-btn-primary"
                style={{ backgroundColor: confirmModal.confirmBtnColor || '#dc2626' }}
                onClick={handleConfirmAction}
                autoFocus
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top-Right Auto-Dismissing Toast Stack */}
      {toasts.length > 0 && (
        <div className="wisdom-toast-container" aria-live="polite">
          {toasts.map((toast) => (
            <div key={toast.id} className={`wisdom-toast-item type-${toast.type}`}>
              <div className={`wisdom-toast-icon type-${toast.type}`}>
                {getBadgeIcon(toast.type)}
              </div>
              <div className="wisdom-toast-content">
                <p className="wisdom-toast-text">{toast.message}</p>
              </div>
              <button
                type="button"
                className="wisdom-toast-close"
                onClick={() => removeToast(toast.id)}
                aria-label="Close notification"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </NotificationContext.Provider>
  );
};
