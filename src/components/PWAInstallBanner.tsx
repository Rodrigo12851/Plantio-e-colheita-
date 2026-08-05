import React, { useState, useEffect } from 'react';
import { canInstallPWA, isStandalone, subscribePWAState } from '../pwaManager';

interface PWAInstallBannerProps {
  onOpenModal: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onOpenModal }) => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed banner in localStorage
    const dismissed = localStorage.getItem('pwa_banner_dismissed_v1');
    if (dismissed === 'true') {
      setShowBanner(false);
      return;
    }

    const checkState = () => {
      setShowBanner(!isStandalone() && canInstallPWA());
    };

    checkState();
    const unsubscribe = subscribePWAState(checkState);
    return unsubscribe;
  }, []);

  if (!showBanner) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem('pwa_banner_dismissed_v1', 'true');
    setShowBanner(false);
  };

  return (
    <div 
      style={{
        backgroundColor: '#005a9e',
        color: '#ffffff',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '13px',
        fontWeight: 500,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 2900,
        flexShrink: 0
      }}
    >
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}
        onClick={onOpenModal}
      >
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          backgroundColor: '#ffffff',
          color: '#0078d4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '14px',
          flexShrink: 0
        }}>
          <i className="fa-solid fa-mobile-screen"></i>
        </div>
        <div>
          <span><strong>Instalar Cristalina:</strong> Adicione o app à sua tela inicial para acesso rápido e offline!</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
        <button
          onClick={onOpenModal}
          style={{
            backgroundColor: '#ffffff',
            color: '#0078d4',
            border: 'none',
            borderRadius: '4px',
            padding: '5px 12px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <i className="fa-solid fa-download" style={{ marginRight: '4px' }}></i> Instalar
        </button>
        <button
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.8)',
            fontSize: '14px',
            cursor: 'pointer',
            padding: '4px 8px'
          }}
          title="Fechar aviso"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  );
};
