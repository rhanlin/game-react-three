import React from 'react';

export default function Modal({
  open,
  onClose,
  children,
  className = '',
  minimized = false,
  ...props
}: {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  minimized?: boolean;
  [key: string]: unknown;
}) {
  if (!open) return null;
  return (
    <div className={minimized ? 'fixed bottom-4 right-4 z-50' : 'fixed inset-0 flex items-center justify-center z-50'}>
      {!minimized && (
        <div
          className="absolute inset-0 bg-black/10 backdrop-blur-md"
          onClick={onClose}
          aria-label="Close modal"
        />
      )}
      <div
        className={`relative bg-white/95 rounded-2xl shadow-xl w-full max-w-[95vw] max-h-[95vh] overflow-auto p-4 sm:p-6 sm:max-w-md ${className}`}
        style={{
          boxSizing: 'border-box',
          ...(props.style as React.CSSProperties),
        }}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}