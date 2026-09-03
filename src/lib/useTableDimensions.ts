import { useState, useCallback, type MouseEvent as ReactMouseEvent } from 'react';

export const DEFAULT_COL_WIDTHS_COLHEITA = [
  105, // 0: DATA
  120, // 1: Unidade
  110, // 2: Cultura
  95,  // 3: C.Custo
  160, // 4: Fazenda
  90,  // 5: PIVO
  90,  // 6: Área/há
  80,  // 7: Gleba
  120, // 8: Variedade
  110, // 9: Qtd. Colhida
  110, // 10: Média P/ Há
  115, // 11: Embalagem
  140, // 12: Produção Bruta Kg
  150, // 13: Produtividade Bruta/há
  140, // 14: Produção Beneficiada
  155, // 15: Produtividade Líquida/ha
  85,  // 16: mês
  75,  // 17: Ano
  75   // 18: AÇÕES
];

export const DEFAULT_COL_WIDTHS_PLANTIO = [
  105, // 0: Data
  135, // 1: UNIDADE
  120, // 2: Cultura
  95,  // 3: C.Custo
  180, // 4: Fazenda
  110, // 5: PIVO
  90,  // 6: Gleba
  130, // 7: Variedade
  95,  // 8: Área/há
  90,  // 9: Mês
  130, // 10: Obs
  125, // 11: Area Descartadas
  75,  // 12: Ano
  75   // 13: AÇÕES
];

export const DEFAULT_ROW_HEIGHT = 34;

export function useTableDimensions(showToast?: (msg: string, type: 'success' | 'error' | 'info') => void) {
  // Column Widths for Colheita
  const [colWidthsColheita, setColWidthsColheita] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('cristalina_col_widths_colheita');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_COL_WIDTHS_COLHEITA.length) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar larguras de colheita:', e);
    }
    return [...DEFAULT_COL_WIDTHS_COLHEITA];
  });

  // Column Widths for Plantio
  const [colWidthsPlantio, setColWidthsPlantio] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('cristalina_col_widths_plantio');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_COL_WIDTHS_PLANTIO.length) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar larguras de plantio:', e);
    }
    return [...DEFAULT_COL_WIDTHS_PLANTIO];
  });

  // Default Row Height (applies to all rows unless overridden)
  const [defaultRowHeight, setDefaultRowHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('cristalina_default_row_height');
      if (saved) {
        const num = parseInt(saved, 10);
        if (!isNaN(num) && num >= 22 && num <= 120) return num;
      }
    } catch (e) {
      console.warn('Erro ao carregar altura de linha padrão:', e);
    }
    return DEFAULT_ROW_HEIGHT;
  });

  // Individual Row Heights overrides
  const [rowHeightsColheita, setRowHeightsColheita] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('cristalina_row_heights_colheita');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Erro ao carregar alturas individuais de colheita:', e);
    }
    return {};
  });

  const [rowHeightsPlantio, setRowHeightsPlantio] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('cristalina_row_heights_plantio');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Erro ao carregar alturas individuais de plantio:', e);
    }
    return {};
  });

  // Calculate total table width
  const totalWidthColheita = colWidthsColheita.reduce((a, b) => a + b, 0);
  const totalWidthPlantio = colWidthsPlantio.reduce((a, b) => a + b, 0);

  // Helper to get row height
  const getRowHeight = useCallback((table: 'colheita' | 'plantio', rowKey: string | number) => {
    const custom = table === 'colheita' ? rowHeightsColheita[String(rowKey)] : rowHeightsPlantio[String(rowKey)];
    return custom || defaultRowHeight;
  }, [rowHeightsColheita, rowHeightsPlantio, defaultRowHeight]);

  // Column Drag Start
  const handleColResizeStart = useCallback((
    table: 'colheita' | 'plantio',
    colIndex: number,
    e: ReactMouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const currentWidths = table === 'colheita' ? colWidthsColheita : colWidthsPlantio;
    const startWidth = currentWidths[colIndex] || 100;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(45, Math.min(800, Math.round(startWidth + deltaX)));

      if (table === 'colheita') {
        setColWidthsColheita(prev => {
          const next = [...prev];
          next[colIndex] = newWidth;
          return next;
        });
      } else {
        setColWidthsPlantio(prev => {
          const next = [...prev];
          next[colIndex] = newWidth;
          return next;
        });
      }
    };

    const onMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (table === 'colheita') {
        setColWidthsColheita(current => {
          try {
            localStorage.setItem('cristalina_col_widths_colheita', JSON.stringify(current));
          } catch (err) {}
          return current;
        });
      } else {
        setColWidthsPlantio(current => {
          try {
            localStorage.setItem('cristalina_col_widths_plantio', JSON.stringify(current));
          } catch (err) {}
          return current;
        });
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [colWidthsColheita, colWidthsPlantio]);

  // Column Reset (Double click on resizer)
  const handleColReset = useCallback((table: 'colheita' | 'plantio', colIndex: number) => {
    if (table === 'colheita') {
      const defaultWidth = DEFAULT_COL_WIDTHS_COLHEITA[colIndex];
      setColWidthsColheita(prev => {
        const next = [...prev];
        next[colIndex] = defaultWidth;
        try {
          localStorage.setItem('cristalina_col_widths_colheita', JSON.stringify(next));
        } catch (err) {}
        return next;
      });
      showToast?.(`Coluna restaurada para ${defaultWidth}px`, 'info');
    } else {
      const defaultWidth = DEFAULT_COL_WIDTHS_PLANTIO[colIndex];
      setColWidthsPlantio(prev => {
        const next = [...prev];
        next[colIndex] = defaultWidth;
        try {
          localStorage.setItem('cristalina_col_widths_plantio', JSON.stringify(next));
        } catch (err) {}
        return next;
      });
      showToast?.(`Coluna restaurada para ${defaultWidth}px`, 'info');
    }
  }, [showToast]);

  // Row Drag Start
  const handleRowResizeStart = useCallback((
    table: 'colheita' | 'plantio',
    rowKey: string | number,
    e: ReactMouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const isShift = e.shiftKey;
    const currentCustom = table === 'colheita' ? rowHeightsColheita : rowHeightsPlantio;
    const startHeight = currentCustom[String(rowKey)] || defaultRowHeight;

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(24, Math.min(180, Math.round(startHeight + deltaY)));

      if (isShift || moveEvent.shiftKey) {
        // Apply to all rows
        setDefaultRowHeight(newHeight);
      } else {
        // Apply to this individual row
        if (table === 'colheita') {
          setRowHeightsColheita(prev => ({
            ...prev,
            [String(rowKey)]: newHeight
          }));
        } else {
          setRowHeightsPlantio(prev => ({
            ...prev,
            [String(rowKey)]: newHeight
          }));
        }
      }
    };

    const onMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (table === 'colheita') {
        setRowHeightsColheita(current => {
          try {
            localStorage.setItem('cristalina_row_heights_colheita', JSON.stringify(current));
          } catch (err) {}
          return current;
        });
      } else {
        setRowHeightsPlantio(current => {
          try {
            localStorage.setItem('cristalina_row_heights_plantio', JSON.stringify(current));
          } catch (err) {}
          return current;
        });
      }

      setDefaultRowHeight(currDef => {
        try {
          localStorage.setItem('cristalina_default_row_height', String(currDef));
        } catch (err) {}
        return currDef;
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [rowHeightsColheita, rowHeightsPlantio, defaultRowHeight]);

  // Row Reset (Double click on row resizer)
  const handleRowReset = useCallback((table: 'colheita' | 'plantio', rowKey: string | number) => {
    if (table === 'colheita') {
      setRowHeightsColheita(prev => {
        const next = { ...prev };
        delete next[String(rowKey)];
        try {
          localStorage.setItem('cristalina_row_heights_colheita', JSON.stringify(next));
        } catch (err) {}
        return next;
      });
    } else {
      setRowHeightsPlantio(prev => {
        const next = { ...prev };
        delete next[String(rowKey)];
        try {
          localStorage.setItem('cristalina_row_heights_plantio', JSON.stringify(next));
        } catch (err) {}
        return next;
      });
    }
    showToast?.('Altura da linha restaurada para o padrão', 'info');
  }, [showToast]);

  // Preset Row Height
  const handleSetRowHeightPreset = useCallback((height: number) => {
    setDefaultRowHeight(height);
    setRowHeightsColheita({});
    setRowHeightsPlantio({});
    try {
      localStorage.setItem('cristalina_default_row_height', String(height));
      localStorage.removeItem('cristalina_row_heights_colheita');
      localStorage.removeItem('cristalina_row_heights_plantio');
    } catch (err) {}
    showToast?.(`Altura das linhas ajustada para ${height}px!`, 'info');
  }, [showToast]);

  // Reset Everything
  const handleResetTableDimensions = useCallback((table?: 'colheita' | 'plantio') => {
    if (!table || table === 'colheita') {
      setColWidthsColheita([...DEFAULT_COL_WIDTHS_COLHEITA]);
      setRowHeightsColheita({});
      try {
        localStorage.removeItem('cristalina_col_widths_colheita');
        localStorage.removeItem('cristalina_row_heights_colheita');
      } catch (err) {}
    }
    if (!table || table === 'plantio') {
      setColWidthsPlantio([...DEFAULT_COL_WIDTHS_PLANTIO]);
      setRowHeightsPlantio({});
      try {
        localStorage.removeItem('cristalina_col_widths_plantio');
        localStorage.removeItem('cristalina_row_heights_plantio');
      } catch (err) {}
    }
    setDefaultRowHeight(DEFAULT_ROW_HEIGHT);
    try {
      localStorage.removeItem('cristalina_default_row_height');
    } catch (err) {}
    showToast?.('Colunas e linhas restauradas para as dimensões padrão!', 'success');
  }, [showToast]);

  return {
    colWidthsColheita,
    colWidthsPlantio,
    defaultRowHeight,
    rowHeightsColheita,
    rowHeightsPlantio,
    totalWidthColheita,
    totalWidthPlantio,
    getRowHeight,
    handleColResizeStart,
    handleColReset,
    handleRowResizeStart,
    handleRowReset,
    handleSetRowHeightPreset,
    handleResetTableDimensions
  };
}
