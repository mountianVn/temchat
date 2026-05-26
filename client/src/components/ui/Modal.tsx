import { useEffect, useRef, ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showClose?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md', showClose = true }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="modal-overlay animate-fade-in"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className={`modal ${sizeClasses[size]} animate-scale-in`}>
        {(title || showClose) && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-dark-border">
            {title && <h2 className="text-base font-semibold text-gray-900 dark:text-dark-text">{title}</h2>}
            {showClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-dark-textMuted hover:bg-dark-hover transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
