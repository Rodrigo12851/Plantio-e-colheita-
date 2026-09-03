import React, { useState, useRef, useEffect } from 'react';

interface ExcelDimensionsControlProps {
  tableType: 'colheita' | 'plantio';
  defaultRowHeight: number;
  onSetRowHeightPreset: (height: number) => void;
  onResetDimensions: () => void;
  wrapText?: boolean;
  onToggleWrapText?: () => void;
}

export const ExcelDimensionsControl: React.FC<ExcelDimensionsControlProps> = ({
  tableType,
  defaultRowHeight,
  onSetRowHeightPreset,
  onResetDimensions,
  wrapText = true,
  onToggleWrapText
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleDocumentClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [isOpen]);

  const tableName = tableType === 'colheita' ? 'BdColheita' : 'BdPlantio';

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        className="excel-dim-btn inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded border transition-all"
        style={{
          backgroundColor: isOpen ? '#e0edfa' : '#ffffff',
          borderColor: isOpen ? '#0078d4' : '#d1d5db',
          color: '#1f2937',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}
        onClick={() => setIsOpen(!isOpen)}
        title="Ajustar altura das linhas e largura das colunas estilo Excel"
      >
        <i className="fa-solid fa-table-cells" style={{ color: '#0078d4' }}></i>
        <span>Linhas & Colunas</span>
        <span
          className="px-1 py-0.2 rounded font-mono text-[10px]"
          style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}
        >
          {defaultRowHeight}px
        </span>
        <i
          className={`fa-solid fa-chevron-down text-[9px] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          style={{ color: '#64748b' }}
        ></i>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-1.5 w-76 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-3 text-gray-800 text-xs animate-in fade-in zoom-in-95 duration-150"
          style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
        >
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5 font-bold text-gray-900 text-xs">
              <i className="fa-solid fa-arrows-up-down-left-right text-[#0078d4]"></i>
              <span>Dimensões Excel ({tableName})</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
            >
              <i className="fa-solid fa-xmark text-xs"></i>
            </button>
          </div>

          {/* Quebrar Texto Section (Excel-style Wrap Text) */}
          {onToggleWrapText && (
            <div className="mt-2.5 pb-2.5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-gray-700">
                  <i className="fa-solid fa-arrow-turn-down text-[#0078d4] text-[11px]" style={{ transform: 'rotate(90deg)' }}></i>
                  <span>Quebrar Texto:</span>
                </div>
                <button
                  type="button"
                  onClick={onToggleWrapText}
                  className={`px-2.5 py-1 rounded text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    wrapText
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                  title={wrapText ? 'Desativar quebra de texto' : 'Ativar quebra de texto'}
                >
                  <span className={`w-2 h-2 rounded-full ${wrapText ? 'bg-blue-600 animate-pulse' : 'bg-gray-300'}`}></span>
                  <span>{wrapText ? 'Ativado' : 'Desativado'}</span>
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-1 leading-tight">
                {wrapText
                  ? 'Texto quebra em múltiplas linhas para caber na largura da coluna sem cortar palavras.'
                  : 'Texto fica em linha única e trunca com reticências (...) se a coluna for pequena.'}
              </p>
            </div>
          )}

          {/* Row Height Section */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5 font-semibold text-gray-700">
              <span>Altura das Linhas:</span>
              <span className="font-mono text-[#0078d4] font-bold">{defaultRowHeight} px</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mb-2.5">
              <button
                type="button"
                className={`px-2 py-1 rounded text-center border font-medium transition-colors ${
                  defaultRowHeight === 26
                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                }`}
                onClick={() => onSetRowHeightPreset(26)}
              >
                Compacta (26px)
              </button>
              <button
                type="button"
                className={`px-2 py-1 rounded text-center border font-medium transition-colors ${
                  defaultRowHeight === 34
                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                }`}
                onClick={() => onSetRowHeightPreset(34)}
              >
                Padrão (34px)
              </button>
              <button
                type="button"
                className={`px-2 py-1 rounded text-center border font-medium transition-colors ${
                  defaultRowHeight === 44
                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                }`}
                onClick={() => onSetRowHeightPreset(44)}
              >
                Média (44px)
              </button>
              <button
                type="button"
                className={`px-2 py-1 rounded text-center border font-medium transition-colors ${
                  defaultRowHeight === 56
                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                }`}
                onClick={() => onSetRowHeightPreset(56)}
              >
                Ampla (56px)
              </button>
            </div>

            {/* Slider */}
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded border border-gray-200">
              <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">Ajuste fino:</span>
              <input
                type="range"
                min="24"
                max="80"
                value={defaultRowHeight}
                onChange={(e) => onSetRowHeightPreset(Number(e.target.value))}
                className="w-full accent-[#0078d4] cursor-pointer h-1.5 bg-gray-200 rounded-lg"
              />
            </div>
          </div>

          {/* Excel Tips */}
          <div className="mt-3 p-2 bg-amber-50 rounded border border-amber-200 text-amber-900 text-[11px] flex gap-2 items-start">
            <i className="fa-solid fa-lightbulb text-amber-500 mt-0.5 text-xs flex-shrink-0"></i>
            <div className="leading-tight">
              <span className="font-semibold block mb-0.5">Dica Estilo Excel:</span>
              Você pode <strong className="font-bold">arrastar as divisões de colunas (↔)</strong> no cabeçalho ou o <strong className="font-bold">rodapé das linhas (↕)</strong> com o mouse para ajustar qualquer tamanho na hora!
            </div>
          </div>

          {/* Reset button */}
          <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              className="flex items-center gap-1.5 text-gray-600 hover:text-red-600 text-[11px] font-medium transition-colors"
              onClick={() => {
                onResetDimensions();
                setIsOpen(false);
              }}
              title="Restaura a largura de todas as colunas e altura das linhas"
            >
              <i className="fa-solid fa-arrow-rotate-left text-[10px]"></i>
              <span>Restaurar Padrões da Tabela</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
