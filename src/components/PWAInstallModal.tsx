import React, { useState, useEffect } from 'react';
import { 
  canInstallPWA, 
  hasDeferredPrompt, 
  isIOS, 
  isInIframe, 
  isStandalone, 
  promptInstallPWA, 
  subscribePWAState 
} from '../pwaManager';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const [canInstall, setCanInstall] = useState(canInstallPWA());
  const [hasPrompt, setHasPrompt] = useState(hasDeferredPrompt());
  const [showInstructions, setShowInstructions] = useState(false);
  const ios = isIOS();
  const standalone = isStandalone();
  const inIframe = isInIframe();

  useEffect(() => {
    const checkState = () => {
      setCanInstall(canInstallPWA());
      setHasPrompt(hasDeferredPrompt());
    };
    checkState();
    const unsubscribe = subscribePWAState(checkState);
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (inIframe) {
      window.open(window.location.href, '_blank');
      return;
    }

    if (hasPrompt) {
      const installed = await promptInstallPWA();
      if (installed) {
        onClose();
      } else {
        setShowInstructions(true);
      }
    } else {
      setShowInstructions(true);
    }
  };

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div className="confirm-modal-backdrop" onClick={onClose}>
      <div 
        className="confirm-modal-card" 
        style={{ maxWidth: '480px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <button className="confirm-modal-close" onClick={onClose} title="Fechar">
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="confirm-modal-header">
          <div className="confirm-modal-icon-badge primary" style={{ backgroundColor: '#e8f5e9', color: '#187a41', padding: '2px' }}>
            <img 
              src="/icon-192.png" 
              alt="Logo IGARASHI" 
              style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover' }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="confirm-modal-header-text">
            <h3>Instalar Cristalina Agrícola</h3>
            <span className="confirm-modal-subtitle">Aplicativo de Controle Agrícola (PWA)</span>
          </div>
        </div>

        <div className="confirm-modal-body">
          {standalone ? (
            <div className="confirm-modal-info-banner">
              <i className="fa-solid fa-circle-check" style={{ color: '#107c41', fontSize: '20px' }}></i>
              <div>
                <strong>Aplicativo já instalado!</strong>
                <p style={{ marginTop: '4px', fontSize: '12px' }}>
                  Você já está executando o Cristalina em modo aplicativo de tela cheia.
                </p>
              </div>
            </div>
          ) : inIframe ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="confirm-modal-info-banner" style={{ backgroundColor: '#fff8e5', borderColor: '#ffcc00' }}>
                <i className="fa-solid fa-up-right-from-square" style={{ color: '#d97706', fontSize: '18px' }}></i>
                <div>
                  <strong style={{ color: '#92400e' }}>Atenção: Visualização em Quadro (Iframe)</strong>
                  <p style={{ marginTop: '4px', fontSize: '12px', color: '#78350f' }}>
                    Os navegadores bloqueiam a instalação direta de aplicativos dentro da pré-visualização. Clique no botão abaixo para abrir o Cristalina em uma <strong>nova aba do navegador</strong> e concluir a instalação.
                  </p>
                </div>
              </div>

              <button 
                onClick={handleOpenNewTab}
                style={{
                  backgroundColor: '#0078d4',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <i className="fa-solid fa-arrow-up-right-from-square"></i>
                Abrir em Nova Aba para Instalar
              </button>
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
                Instale o aplicativo <strong>Cristalina - Controle Agrícola</strong> no seu dispositivo para acesso rápido, navegação em tela cheia e suporte offline.
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

              {(showInstructions || !hasPrompt) && (
                <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <strong style={{ fontSize: '13px', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-circle-info" style={{ color: '#0078d4' }}></i> Como instalar no Chrome / Android / PC:
                  </strong>
                  <ol style={{ margin: '8px 0 0 18px', padding: 0, fontSize: '12px', color: '#4b5563', lineHeight: '1.6' }}>
                    <li>Clique no menu de <strong>3 pontos</strong> <i className="fa-solid fa-ellipsis-vertical" style={{ color: '#0078d4' }}></i> do navegador (no canto superior direito).</li>
                    <li>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à Tela Inicial"</strong>.</li>
                    <li>Confirme a instalação e o app ficará disponível no seu celular ou computador!</li>
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="confirm-modal-footer">
          <button className="btn-modal-cancel" onClick={onClose}>
            Fechar
          </button>
          {!standalone && !ios && (
            <button className="btn-modal-save" onClick={handleInstallClick}>
              {inIframe ? (
                <>
                  <i className="fa-solid fa-arrow-up-right-from-square"></i> Abrir &amp; Instalar
                </>
              ) : hasPrompt ? (
                <>
                  <i className="fa-solid fa-download"></i> Instalar Agora
                </>
              ) : (
                <>
                  <i className="fa-solid fa-circle-question"></i> Ver Como Instalar
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
