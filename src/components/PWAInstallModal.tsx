import React, { useState, useEffect } from 'react';
import { canInstallPWA, isIOS, isStandalone, promptInstallPWA, subscribePWAState } from '../pwaManager';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const [canInstall, setCanInstall] = useState(canInstallPWA());
  const ios = isIOS();
  const standalone = isStandalone();

  useEffect(() => {
    const unsubscribe = subscribePWAState(() => {
      setCanInstall(canInstallPWA());
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (ios) {
      // iOS step-by-step instructions are shown in modal body
      return;
    }
    const installed = await promptInstallPWA();
    if (installed) {
      onClose();
    }
  };

  return (
    <div className="confirm-modal-backdrop" onClick={onClose}>
      <div 
        className="confirm-modal-card" 
        style={{ maxWidth: '460px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <button className="confirm-modal-close" onClick={onClose} title="Fechar">
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="confirm-modal-header">
          <div className="confirm-modal-icon-badge primary" style={{ backgroundColor: '#eff6fc', color: '#0078d4' }}>
            <img 
              src="/icon-192.png" 
              alt="Cristalina Logo" 
              style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="confirm-modal-header-text">
            <h3>Instalar Cristalina Agrícola</h3>
            <span className="confirm-modal-subtitle">Aplicativo de Controle Agrícola</span>
          </div>
        </div>

        <div className="confirm-modal-body">
          {standalone ? (
            <div className="confirm-modal-info-banner">
              <i className="fa-solid fa-circle-check" style={{ color: '#107c41', fontSize: '18px' }}></i>
              <div>
                <strong>Aplicativo já instalado!</strong>
                <p style={{ marginTop: '4px', fontSize: '12px' }}>
                  Você já está executando o Cristalina em modo aplicativo de tela cheia.
                </p>
              </div>
            </div>
          ) : ios ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p className="confirm-modal-message">
                Para instalar o <strong>Cristalina</strong> no seu iPhone ou iPad:
              </p>
              
              <div className="confirm-modal-details-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                  <span style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    backgroundColor: '#0078d4', 
                    color: '#fff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: 700, 
                    fontSize: '12px' 
                  }}>1</span>
                  <span>Toque no botão de <strong>Compartilhar</strong> <i className="fa-solid fa-share-nodes" style={{ color: '#0078d4' }}></i> na barra do Safari.</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                  <span style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    backgroundColor: '#0078d4', 
                    color: '#fff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: 700, 
                    fontSize: '12px' 
                  }}>2</span>
                  <span>Role o menu e selecione <strong>"Adicionar à Tela de Início"</strong> <i className="fa-regular fa-square-plus" style={{ color: '#0078d4' }}></i>.</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                  <span style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    backgroundColor: '#0078d4', 
                    color: '#fff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: 700, 
                    fontSize: '12px' 
                  }}>3</span>
                  <span>Confirme tocando em <strong>"Adicionar"</strong> no canto superior direito.</span>
                </div>
              </div>

              <div className="confirm-modal-info-banner">
                <i className="fa-solid fa-mobile-screen-button"></i>
                <span>O ícone do Cristalina aparecerá diretamente na sua tela inicial como um app nativo.</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p className="confirm-modal-message">
                Instale o aplicativo <strong>Cristalina - Controle Agrícola</strong> no seu dispositivo para acesso rápido, navegação sem barra de navegação e funcionamento otimizado.
              </p>

              <div className="confirm-modal-details-card">
                <div className="confirm-detail-row">
                  <span className="confirm-detail-label"><i className="fa-solid fa-bolt" style={{ color: '#ffb900' }}></i> Acesso Rápido</span>
                  <span className="confirm-detail-value">Direto da Tela Inicial</span>
                </div>
                <div className="confirm-detail-row">
                  <span className="confirm-detail-label"><i className="fa-solid fa-wifi" style={{ color: '#107c41' }}></i> Cache Offline</span>
                  <span className="confirm-detail-value">Funciona com sinal fraco</span>
                </div>
                <div className="confirm-detail-row">
                  <span className="confirm-detail-label"><i className="fa-solid fa-display" style={{ color: '#0078d4' }}></i> Experiência</span>
                  <span className="confirm-detail-value">Modo Tela Cheia (PWA)</span>
                </div>
              </div>

              {!canInstall && (
                <div className="confirm-modal-info-banner">
                  <i className="fa-solid fa-circle-info"></i>
                  <span>Se o botão abaixo não acionar o instalador automaticamente, use a opção <strong>"Instalar Aplicativo"</strong> no menu de três pontos do seu navegador (Chrome/Edge/Samsung).</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="confirm-modal-footer">
          <button className="btn-modal-cancel" onClick={onClose}>
            Entendi / Fechar
          </button>
          {!standalone && !ios && (
            <button className="btn-modal-save" onClick={handleInstallClick}>
              <i className="fa-solid fa-download"></i> Instalar Agora
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
