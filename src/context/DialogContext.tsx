'use client';

import React, { createContext, useContext, useState } from 'react';

interface DialogContextProps {
  confirm: (title: string, message: string) => Promise<boolean>;
  alert: (title: string, message: string) => Promise<void>;
}

const DialogContext = createContext<DialogContextProps | undefined>(undefined);

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'ALERT' | 'CONFIRM'>('ALERT');
  const [resolveRef, setResolveRef] = useState<((val: any) => void) | null>(null);

  const alert = (title: string, message: string): Promise<void> => {
    return new Promise((resolve) => {
      setTitle(title);
      setMessage(message);
      setType('ALERT');
      setIsOpen(true);
      setResolveRef(() => resolve);
    });
  };

  const confirm = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTitle(title);
      setMessage(message);
      setType('CONFIRM');
      setIsOpen(true);
      setResolveRef(() => resolve);
    });
  };

  const handleClose = (value: boolean) => {
    setIsOpen(false);
    if (resolveRef) {
      resolveRef(value);
    }
  };

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {isOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '420px', padding: '28px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'var(--font-family-title)', color: 'var(--text-main)' }}>
              {title}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
              {message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              {type === 'CONFIRM' ? (
                <>
                  <button
                    onClick={() => handleClose(false)}
                    className="btn btn-secondary"
                    style={{ minWidth: '100px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleClose(true)}
                    className="btn btn-primary"
                    style={{ minWidth: '100px', backgroundColor: 'var(--primary)', cursor: 'pointer' }}
                  >
                    Confirm
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleClose(true)}
                  className="btn btn-primary"
                  style={{ minWidth: '120px', backgroundColor: 'var(--primary)', cursor: 'pointer' }}
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};
