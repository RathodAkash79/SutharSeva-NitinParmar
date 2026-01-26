import { useEffect } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  size?: "small" | "large";
  children: React.ReactNode;
}

export function Modal({ open, title, onClose, size, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) return null;

  const sizeClass = size ? `modal--${size}` : "";

  return (
    <div className="modal-overlay" onClick={(event) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    }}>
      <div className={`modal ${sizeClass}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal__header">
          <h3 className="modal__title">{title}</h3>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal__body">
          {children}
        </div>
      </div>
    </div>
  );
}