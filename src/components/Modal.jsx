import { X } from 'lucide-react';

export default function Modal({ title, open = true, onClose, children, footer }) {
  if (!open) return null;

  return (
    <div className="ui-modal-backdrop studyos-modal-backdrop" aria-modal="true" role="dialog">
      <div className="ui-modal studyos-modal studyos-modal--structured">
        <div className="ui-modal-header studyos-modal-header">
          <h3>{title}</h3>
          {onClose ? (
            <button type="button" className="ui-modal-close" onClick={onClose} aria-label="Close modal">
              <X size={16} />
            </button>
          ) : null}
        </div>
        <div className="ui-modal-body studyos-modal-body">{children}</div>
        {footer ? <div className="ui-modal-footer studyos-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
