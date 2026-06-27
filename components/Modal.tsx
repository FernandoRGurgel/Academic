'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidthClass?: string; // e.g., 'max-w-md', 'max-w-lg'
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidthClass = 'max-w-md',
}: ModalProps) {
  // Listen for escape key press to close modal
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Clickable backdrop overlay */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Modal content container */}
      <div
        className={cn(
          'bg-surface w-full rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] relative z-10 animate-in zoom-in-95 duration-200',
          maxWidthClass
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant bg-surface">
          <h2 className="text-xl font-bold font-serif text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-secondary hover:text-primary hover:bg-surface-container rounded-md transition-colors"
            type="button"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
