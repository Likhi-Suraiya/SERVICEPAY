// components/Dialog.jsx
import './Dialog.css';

export const Dialog = ({ dialog, onClose, onConfirm, onCancel }) => {
  if (!dialog.isOpen) return null;

  const getIcon = () => {
    switch (dialog.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'confirm': return '✅'; //'❓';
      default: return 'ℹ️';
    }
  };

  const getClassName = () => {
    return `dialog ${dialog.type}`;
  };

  return (
    <div className="dialog-overlay">
      <div className={getClassName()}>
        <div className="dialog-header">
          <span className="dialog-icon">{getIcon()}</span>
          <h3 className="dialog-title">{dialog.title}</h3>
        </div>
        <div className="dialog-body">
          <p dangerouslySetInnerHTML={{ __html: dialog.message }}></p>
        </div>
        <div className="dialog-footer">
          {dialog.showConfirm ? (
            <>
              <button 
                className="second-btn" 
                onClick={onCancel || onClose}
              >
                {dialog.cancelText}
              </button>
              <button 
                className="first-btn" 
                onClick={onConfirm}
              >
                {dialog.confirmText}
              </button>
            </>
          ) : (
            <button 
              className="first-btn" 
              onClick={onClose}
            >
              {dialog.confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dialog;