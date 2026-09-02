import React, { useState, useRef, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';

export type GeneralCategoryKey = 
  | 'culturas' 
  | 'variedades' 
  | 'empresas' 
  | 'anos' 
  | 'fazendas' 
  | 'pivos' 
  | 'glebas' 
  | 'colaboradores' 
  | 'motoristas' 
  | 'onibus' 
  | 'plantio' 
  | 'colheita'
  | 'amarracoes';

export interface CategoryInfo {
  key: GeneralCategoryKey;
  label: string;
  subTitle: string;
  icon: string;
  fields: { key: string; label: string; primaryKey?: boolean; required?: boolean }[];
}

export const CATEGORY_DEFINITIONS: Record<GeneralCategoryKey, CategoryInfo> = {
  culturas: {
    key: 'culturas',
    label: 'Culturas',
    subTitle: 'Cadastro_Culturas',
    icon: 'fa-plant-wilt',
    fields: [
      { key: 'codigo', label: 'Código' },
      { key: 'nome', label: 'Nome da Cultura', primaryKey: true, required: true },
      { key: 'tipo', label: 'Tipo / Vinculação (Hortifruti / Cereais)' }
    ]
  },
  variedades: {
    key: 'variedades',
    label: 'Variedades',
    subTitle: 'Cadastro_Variedades',
    icon: 'fa-seedling',
    fields: [
      { key: 'codigo', label: 'Código' },
      { key: 'nome', label: 'Nome da Variedade', primaryKey: true, required: true },
      { key: 'cultura', label: 'Cultura Vinculada' }
    ]
  },
  empresas: {
    key: 'empresas',
    label: 'Empresas',
    subTitle: 'Cadastro_Empresas',
    icon: 'fa-building',
    fields: [
      { key: 'codigo', label: 'Código' },
      { key: 'nome', label: 'Nome da Empresa', primaryKey: true, required: true }
    ]
  },
  anos: {
    key: 'anos',
    label: 'Anos Safra',
    subTitle: 'Cadastro_Anos',
    icon: 'fa-calendar',
    fields: [
      { key: 'codigo', label: 'Código' },
      { key: 'nome', label: 'Ano Safra', primaryKey: true, required: true }
    ]
  },
  fazendas: {
    key: 'fazendas',
    label: 'Fazendas',
    subTitle: 'Cadastro_Fazendas',
    icon: 'fa-wheat-awn',
    fields: [
      { key: 'codigo', label: 'Código' },
      { key: 'nome', label: 'Nome da Fazenda', primaryKey: true, required: true }
    ]
  },
  pivos: {
    key: 'pivos',
    label: 'Pivôs',
    subTitle: 'Cadastro_Pivos',
    icon: 'fa-water',
    fields: [
      { key: 'codigo', label: 'Código' },
      { key: 'nome', label: 'Nome do Pivô', primaryKey: true, required: true }
    ]
  },
  glebas: {
    key: 'glebas',
    label: 'Glebas',
    subTitle: 'Cadastro_Glebas',
    icon: 'fa-vector-square',
    fields: [
      { key: 'codigo', label: 'Código' },
      { key: 'nome', label: 'Nome da Gleba', primaryKey: true, required: true }
    ]
  },
  colaboradores: {
    key: 'colaboradores',
    label: 'Colaboradores',
    subTitle: 'Cadastro_Colaboradores',
    icon: 'fa-id-card-clip',
    fields: [
      { key: 'codigo', label: 'Matrícula / Código' },
      { key: 'nome', label: 'Nome Completo', primaryKey: true, required: true },
      { key: 'apontador', label: 'Apontador' },
      { key: 'local', label: 'Local de Trabalho' },
      { key: 'status', label: 'Status (Ativo / Inativo)' }
    ]
  },
  motoristas: {
    key: 'motoristas',
    label: 'Motoristas',
    subTitle: 'Cadastro_Motoristas',
    icon: 'fa-user-gear',
    fields: [
      { key: 'codigo', label: 'Código (Capa)' },
      { key: 'nome', label: 'Nome Completo', primaryKey: true, required: true },
      { key: 'abreviacao', label: 'Abreviação' }
    ]
  },
  onibus: {
    key: 'onibus',
    label: 'Ônibus',
    subTitle: 'Cadastro_Onibus',
    icon: 'fa-bus',
    fields: [
      { key: 'codigo', label: 'Código' },
      { key: 'nome', label: 'Placa do Veículo', primaryKey: true, required: true },
      { key: 'cor', label: 'Cor' },
      { key: 'motorista', label: 'Motorista' },
      { key: 'local', label: 'Local' },
      { key: 'cooperado', label: 'Cooperado (Sim / Não)' }
    ]
  },
  plantio: {
    key: 'plantio',
    label: 'BdPlantio',
    subTitle: 'Plantio Geral',
    icon: 'fa-seedling',
    fields: [
      { key: 'data', label: 'Data', required: true },
      { key: 'empresa', label: 'Empresa' },
      { key: 'cultura', label: 'Cultura', required: true },
      { key: 'os', label: 'OS' },
      { key: 'fazenda', label: 'Fazenda', required: true },
      { key: 'pivo', label: 'Pivô' },
      { key: 'gleba', label: 'Gleba' },
      { key: 'variedade', label: 'Variedade' },
      { key: 'haDia', label: 'HA / Dia' },
      { key: 'haRestante', label: 'HA Restante' },
      { key: 'glebasFinalizada', label: 'Finalizada' },
      { key: 'mediaHa', label: 'Média HA' },
      { key: 'ano', label: 'Ano' }
    ]
  },
  colheita: {
    key: 'colheita',
    label: 'BdColheita',
    subTitle: 'Colheita Geral',
    icon: 'fa-wheat-awn',
    fields: [
      { key: 'data', label: 'Data', required: true },
      { key: 'empresa', label: 'Empresa' },
      { key: 'cultura', label: 'Cultura', required: true },
      { key: 'os', label: 'OS' },
      { key: 'fazenda', label: 'Fazenda', required: true },
      { key: 'pivo', label: 'Pivô' },
      { key: 'gleba', label: 'Gleba' },
      { key: 'variedade', label: 'Variedade' },
      { key: 'haDia', label: 'HA / Dia' },
      { key: 'haGeral', label: 'HA Geral' },
      { key: 'haRestante', label: 'HA Restante' },
      { key: 'qtdColhido', label: 'Qtd Colhido' },
      { key: 'glebasFinalizada', label: 'Finalizada' },
      { key: 'mediaHa', label: 'Média HA' },
      { key: 'mes', label: 'Mês' },
      { key: 'ano', label: 'Ano' }
    ]
  },
  amarracoes: {
    key: 'amarracoes',
    label: 'Amarrações',
    subTitle: 'Marcações e Amarrações',
    icon: 'fa-link',
    fields: [
      { key: 'codigoMarca', label: 'Código' },
      { key: 'categoria', label: 'Categoria' },
      { key: 'titulo', label: 'Título / Ordem Completa', primaryKey: true, required: true },
      { key: 'origem', label: 'Origem' },
      { key: 'destino', label: 'Destino' },
      { key: 'hectares', label: 'Hectares' },
      { key: 'status', label: 'Status' },
      { key: 'observacao', label: 'Observação' }
    ]
  }
};

export const cleanText = (val: any): string => {
  if (val === undefined || val === null) return '';
  const s = String(val).trim();
  if (s.toLowerCase() === 'undefined' || s.toLowerCase() === 'null') return '';
  return s;
};

export const normalizeKey = (str: any): string => {
  if (str === undefined || str === null) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
};

export interface FieldDiff {
  field: string;
  label: string;
  oldVal: string;
  newVal: string;
}

export interface ParsedGenericItem {
  id?: string;
  data: Record<string, any>;
  importStatus: 'identical' | 'update' | 'new';
  existingId?: string;
  diffs: FieldDiff[];
  rowIndex: number;
}

interface GeneralImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCategory: GeneralCategoryKey;
  selectedUnidade: string;
  existingData: Record<GeneralCategoryKey, any[]>;
  onImportBatch: (category: GeneralCategoryKey, items: { item: any; id?: string }[]) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const GeneralImportModal: React.FC<GeneralImportModalProps> = ({
  isOpen,
  onClose,
  targetCategory,
  selectedUnidade,
  existingData,
  onImportBatch,
  showToast
}) => {
  const [activeCategory, setActiveCategory] = useState<GeneralCategoryKey>(targetCategory);
  const [fileName, setFileName] = useState<string>('');
  const [rawRows, setRawRows] = useState<any[][]>([]);
  const [parsedItems, setParsedItems] = useState<ParsedGenericItem[]>([]);
  const [filterTab, setFilterTab] = useState<'ALL' | 'CHANGES' | 'IDENTICAL'>('ALL');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync category when targetCategory prop changes
  useEffect(() => {
    if (isOpen) {
      setActiveCategory(targetCategory);
      setFileName('');
      setRawRows([]);
      setParsedItems([]);
      setFilterTab('ALL');
    }
  }, [isOpen, targetCategory]);

  const categoryDef = CATEGORY_DEFINITIONS[activeCategory] || CATEGORY_DEFINITIONS.culturas;

  // Auto detect columns and build parsed items
  const parseRowsForCategory = (rows: any[][], catKey: GeneralCategoryKey) => {
    if (!rows || rows.length < 2) {
      setParsedItems([]);
      return;
    }

    const catInfo = CATEGORY_DEFINITIONS[catKey];
    if (!catInfo) return;

    const headers = rows[0].map(h => cleanText(h).toLowerCase());
    const existingList = existingData[catKey] || [];

    // Helper to find column index for field
    const findColIdx = (fieldKey: string, fieldLabel: string) => {
      const normField = normalizeKey(fieldKey);
      const normLabel = normalizeKey(fieldLabel);

      let idx = headers.findIndex(h => {
        const normH = normalizeKey(h);
        return normH === normField || normH === normLabel || normH.includes(normField) || normField.includes(normH);
      });

      // Special aliases
      if (idx === -1) {
        if (fieldKey === 'nome') {
          idx = headers.findIndex(h => {
            const nh = normalizeKey(h);
            return nh.includes('nome') || nh.includes('descricao') || nh.includes('placa') || nh.includes('titulo');
          });
        } else if (fieldKey === 'codigo') {
          idx = headers.findIndex(h => {
            const nh = normalizeKey(h);
            return nh.includes('cod') || nh.includes('matricula') || nh.includes('capa') || nh.includes('id');
          });
        } else if (fieldKey === 'cultura') {
          idx = headers.findIndex(h => normalizeKey(h).includes('cultura'));
        } else if (fieldKey === 'variedade') {
          idx = headers.findIndex(h => normalizeKey(h).includes('variedade'));
        } else if (fieldKey === 'fazenda') {
          idx = headers.findIndex(h => normalizeKey(h).includes('fazenda'));
        } else if (fieldKey === 'tipo') {
          idx = headers.findIndex(h => normalizeKey(h).includes('tipo') || normalizeKey(h).includes('vinc'));
        } else if (fieldKey === 'haDia') {
          idx = headers.findIndex(h => normalizeKey(h).includes('hadia') || normalizeKey(h).includes('ha_dia') || normalizeKey(h).includes('hectares'));
        }
      }

      return idx;
    };

    // Map column index to field
    const colMapping: Record<string, number> = {};
    catInfo.fields.forEach(f => {
      colMapping[f.key] = findColIdx(f.key, f.label);
    });

    // Fallback if no specific column mapped for primary field: use col 0 or 1
    if (colMapping['nome'] === -1 && colMapping['codigo'] === -1) {
      if (rows[0].length > 1) {
        colMapping['codigo'] = 0;
        colMapping['nome'] = 1;
      } else {
        colMapping['nome'] = 0;
      }
    }

    const results: ParsedGenericItem[] = [];
    const seenMap = new Map<string, number>();

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const itemData: Record<string, any> = {
        unidade: selectedUnidade
      };

      let hasAnyValue = false;
      catInfo.fields.forEach((f, fIdx) => {
        const colIdx = colMapping[f.key];
        let val = '';
        if (colIdx !== undefined && colIdx !== -1 && row[colIdx] !== undefined) {
          val = cleanText(row[colIdx]);
        } else if (fIdx < row.length && (colIdx === undefined || colIdx === -1)) {
          // If unmapped, pick row[fIdx] as soft fallback
          val = cleanText(row[fIdx]);
        }

        // Format dates if plantio or colheita
        if (f.key === 'data' && val) {
          if (typeof val === 'number') {
            // Excel serial date number
            const dateObj = new Date((val - (25567 + 2)) * 86400 * 1000);
            if (!isNaN(dateObj.getTime())) {
              const dd = String(dateObj.getDate()).padStart(2, '0');
              const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
              const yy = String(dateObj.getFullYear()).slice(-2);
              val = `${dd}/${mm}/${yy}`;
            }
          }
        }

        // Format status for colaboradores
        if (f.key === 'status' && val) {
          val = val.toLowerCase().includes('inat') ? 'Inativo' : 'Ativo';
        }

        itemData[f.key] = val;
        if (val) hasAnyValue = true;
      });

      if (!hasAnyValue) continue;

      // Auto generate sequential code if missing
      if (catInfo.fields.some(f => f.key === 'codigo' || f.key === 'codigoMarca') && !itemData['codigo'] && !itemData['codigoMarca']) {
        let maxCod = 0;
        for (const ex of existingList) {
          const raw = cleanText(ex.codigo || ex.codigoMarca);
          const num = parseInt(raw.replace(/\D/g, ''), 10);
          if (!isNaN(num) && num > 0 && num < 50000 && num > maxCod) {
            maxCod = num;
          }
        }
        if (maxCod === 0 && existingList.length > 0) {
          maxCod = existingList.length;
        }
        const nextNum = maxCod + r;
        if (catKey === 'amarracoes') {
          itemData['codigoMarca'] = `#AMR-${String(nextNum).padStart(3, '0')}`;
        } else {
          itemData['codigo'] = String(nextNum);
        }
      }

      // Identify matching existing item
      let matchedExisting: any = null;
      if (catKey === 'variedades') {
        const normName = normalizeKey(itemData.nome);
        const normCult = normalizeKey(itemData.cultura);
        matchedExisting = existingList.find(e => {
          const matchN = normalizeKey(e.nome) === normName;
          const matchC = !normCult || !normalizeKey(e.cultura) || normalizeKey(e.cultura) === normCult;
          return matchN && matchC;
        });
      } else if (catKey === 'amarracoes') {
        const normTit = normalizeKey(itemData.titulo);
        const normCod = cleanText(itemData.codigoMarca);
        matchedExisting = existingList.find(e => {
          return (normCod && cleanText(e.codigoMarca) === normCod) || (normTit && normalizeKey(e.titulo) === normTit);
        });
      } else if (catKey === 'colaboradores') {
        const normCod = cleanText(itemData.codigo);
        const normName = normalizeKey(itemData.nome);
        matchedExisting = existingList.find(e => (normCod && cleanText(e.codigo) === normCod) || normalizeKey(e.nome) === normName);
      } else if (catKey === 'motoristas') {
        const normCod = cleanText(itemData.codigo);
        const normName = normalizeKey(itemData.nome);
        matchedExisting = existingList.find(e => (normCod && cleanText(e.codigo) === normCod) || normalizeKey(e.nome) === normName);
      } else if (catKey === 'onibus') {
        const normPlaca = normalizeKey(itemData.nome);
        const normCod = cleanText(itemData.codigo);
        matchedExisting = existingList.find(e => (normCod && cleanText(e.codigo) === normCod) || normalizeKey(e.nome) === normPlaca);
      } else if (catKey === 'plantio' || catKey === 'colheita') {
        const d = cleanText(itemData.data);
        const c = normalizeKey(itemData.cultura);
        const f = normalizeKey(itemData.fazenda);
        const p = normalizeKey(itemData.pivo);
        const v = normalizeKey(itemData.variedade);
        matchedExisting = existingList.find(e => {
          return cleanText(e.data) === d &&
                 normalizeKey(e.cultura) === c &&
                 normalizeKey(e.fazenda) === f &&
                 (!p || normalizeKey(e.pivo) === p) &&
                 (!v || normalizeKey(e.variedade) === v);
        });
      } else {
        // Simple items (culturas, empresas, anos, fazendas, pivos, glebas)
        const normName = normalizeKey(itemData.nome);
        const normCod = cleanText(itemData.codigo);
        matchedExisting = existingList.find(e => {
          return (normName && normalizeKey(e.nome) === normName) || (normCod && cleanText(e.codigo) === normCod);
        });
      }

      // Check diffs
      const diffs: FieldDiff[] = [];
      let importStatus: 'identical' | 'update' | 'new' = 'new';
      let existingId: string | undefined = undefined;

      if (matchedExisting) {
        existingId = matchedExisting.id;
        let isIdentical = true;

        catInfo.fields.forEach(f => {
          const oldVal = cleanText(matchedExisting[f.key]);
          const newVal = cleanText(itemData[f.key]);

          // If new value is provided and different from existing
          if (newVal && oldVal !== newVal) {
            diffs.push({
              field: f.key,
              label: f.label,
              oldVal: oldVal || '(vazio)',
              newVal: newVal
            });
            isIdentical = false;
          }
        });

        if (isIdentical) {
          importStatus = 'identical';
        } else {
          importStatus = 'update';
        }
      } else {
        importStatus = 'new';
      }

      // Deduplicate inside spreadsheet itself
      const dedupeKey = `${normalizeKey(itemData.nome || itemData.data || '')}_${normalizeKey(itemData.cultura || itemData.codigo || '')}`;
      if (seenMap.has(dedupeKey)) {
        // Already processed earlier in spreadsheet
        continue;
      }
      seenMap.set(dedupeKey, r);

      results.push({
        data: itemData,
        importStatus,
        existingId,
        diffs,
        rowIndex: r + 1
      });
    }

    setParsedItems(results);
  };

  // Re-run parsing if category changes
  const handleCategoryChange = (newCat: GeneralCategoryKey) => {
    setActiveCategory(newCat);
    if (rawRows.length > 0) {
      parseRowsForCategory(rawRows, newCat);
    }
  };

  // File processing via XLSX
  const handleFileSelect = (file: File) => {
    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

        if (!jsonData || jsonData.length < 2) {
          showToast('O arquivo selecionado está vazio ou sem linhas de dados.', 'warning');
          setIsProcessing(false);
          return;
        }

        setRawRows(jsonData);

        // Try to auto-guess category based on sheet name or headers
        let guessedCategory = activeCategory;
        const sheetLower = firstSheet.toLowerCase();
        const headersStr = (jsonData[0] || []).join(' ').toLowerCase();

        if (sheetLower.includes('cultura') || headersStr.includes('cultura')) {
          if (headersStr.includes('variedade') && !headersStr.includes('hortifruti')) {
            guessedCategory = 'variedades';
          } else {
            guessedCategory = 'culturas';
          }
        } else if (sheetLower.includes('variedad') || headersStr.includes('variedade')) {
          guessedCategory = 'variedades';
        } else if (sheetLower.includes('empresa') || headersStr.includes('empresa')) {
          guessedCategory = 'empresas';
        } else if (sheetLower.includes('safra') || sheetLower.includes('ano') || headersStr.includes('safra')) {
          guessedCategory = 'anos';
        } else if (sheetLower.includes('fazenda') || headersStr.includes('fazenda')) {
          guessedCategory = 'fazendas';
        } else if (sheetLower.includes('pivo') || headersStr.includes('pivô') || headersStr.includes('pivo')) {
          guessedCategory = 'pivos';
        } else if (sheetLower.includes('gleba') || headersStr.includes('gleba')) {
          guessedCategory = 'glebas';
        } else if (sheetLower.includes('colaborador') || headersStr.includes('matricula') || headersStr.includes('apontador')) {
          guessedCategory = 'colaboradores';
        } else if (sheetLower.includes('motorista') || headersStr.includes('abreviação') || headersStr.includes('capa')) {
          guessedCategory = 'motoristas';
        } else if (sheetLower.includes('onibus') || sheetLower.includes('ônibus') || headersStr.includes('placa')) {
          guessedCategory = 'onibus';
        } else if (sheetLower.includes('plantio') || headersStr.includes('plantio')) {
          guessedCategory = 'plantio';
        } else if (sheetLower.includes('colheita') || headersStr.includes('colheita')) {
          guessedCategory = 'colheita';
        }

        setActiveCategory(guessedCategory);
        parseRowsForCategory(jsonData, guessedCategory);
        setIsProcessing(false);
      } catch (err: any) {
        showToast('Erro ao ler a planilha: ' + (err.message || 'formato inválido'), 'warning');
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const counts = useMemo(() => {
    const total = parsedItems.length;
    const news = parsedItems.filter(i => i.importStatus === 'new').length;
    const updates = parsedItems.filter(i => i.importStatus === 'update').length;
    const identicals = parsedItems.filter(i => i.importStatus === 'identical').length;
    const actionable = news + updates;
    return { total, news, updates, identicals, actionable };
  }, [parsedItems]);

  const filteredPreview = useMemo(() => {
    if (filterTab === 'CHANGES') {
      return parsedItems.filter(i => i.importStatus === 'new' || i.importStatus === 'update');
    }
    if (filterTab === 'IDENTICAL') {
      return parsedItems.filter(i => i.importStatus === 'identical');
    }
    return parsedItems;
  }, [parsedItems, filterTab]);

  const handleConfirmImport = async () => {
    if (counts.actionable === 0) {
      showToast('Nenhuma novidade ou alteração a importar (todos os registros já estão idênticos no sistema).', 'info');
      onClose();
      return;
    }

    setIsImporting(true);
    try {
      // Filter items to save: only 'new' and 'update' (never save identical items to avoid useless writes & duplicates)
      const itemsToSave = parsedItems
        .filter(i => i.importStatus === 'new' || i.importStatus === 'update')
        .map(i => ({
          item: i.data,
          id: i.existingId
        }));

      await onImportBatch(activeCategory, itemsToSave);
      showToast(`Importação concluída com sucesso! ${counts.news} novos cadastrados e ${counts.updates} atualizados.`, 'success');
      onClose();
    } catch (err: any) {
      showToast('Erro ao salvar importação: ' + (err.message || 'Tente novamente'), 'warning');
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
        zIndex: 99999,
        padding: '16px'
      }}
    >
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '1050px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
          border: '1px solid #d2d0ce',
          overflow: 'hidden'
        }}
      >
        {/* HEADER */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e1dfdd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: '#107c41',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
              <i className="fa-solid fa-file-excel"></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#323130' }}>
                Importar Planilha Excel / CSV
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#605e5c' }}>
                Importação com verificação linha a linha, anti-duplicação e atualização inteligente
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              color: '#605e5c',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* CATEGORY SELECTOR & FILE UPLOADER */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            backgroundColor: '#faf9f8',
            padding: '16px',
            borderRadius: '6px',
            border: '1px solid #edebe9'
          }}>
            {/* SELECT CATEGORY TARGET */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#323130', marginBottom: '6px' }}>
                <i className="fa-solid fa-layer-group" style={{ color: '#0078d4', marginRight: '6px' }}></i>
                Importar Dados Para:
              </label>
              <select
                value={activeCategory}
                onChange={e => handleCategoryChange(e.target.value as GeneralCategoryKey)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '4px',
                  border: '1px solid #8a8886',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: '#ffffff',
                  outline: 'none'
                }}
              >
                <optgroup label="Cadastro Geral">
                  <option value="culturas">Culturas (Cadastro_Culturas)</option>
                  <option value="variedades">Variedades (Cadastro_Variedades)</option>
                  <option value="empresas">Empresas (Cadastro_Empresas)</option>
                  <option value="anos">Anos Safra (Cadastro_Anos)</option>
                  <option value="fazendas">Fazendas (Cadastro_Fazendas)</option>
                  <option value="pivos">Pivôs (Cadastro_Pivos)</option>
                  <option value="glebas">Glebas (Cadastro_Glebas)</option>
                  <option value="colaboradores">Colaboradores (Cadastro_Colaboradores)</option>
                  <option value="motoristas">Motoristas (Cadastro_Motoristas)</option>
                  <option value="onibus">Ônibus (Cadastro_Onibus)</option>
                </optgroup>
                <optgroup label="Bancos de Dados & Amarrações">
                  <option value="plantio">BdPlantio (Plantio Geral)</option>
                  <option value="colheita">BdColheita (Colheita Geral)</option>
                  <option value="amarracoes">Marcações e Amarrações (Geral)</option>
                </optgroup>
              </select>
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#605e5c' }}>
                Campos esperados: {categoryDef.fields.map(f => f.label).join(', ')}
              </div>
            </div>

            {/* FILE UPLOAD DROPZONE */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#323130', marginBottom: '6px' }}>
                <i className="fa-solid fa-cloud-arrow-up" style={{ color: '#107c41', marginRight: '6px' }}></i>
                Arquivo (.xlsx, .xls, .csv):
              </label>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls, .csv"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  style={{ display: 'none' }}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    flex: 1,
                    padding: '9px 14px',
                    borderRadius: '4px',
                    border: '1px solid #107c41',
                    backgroundColor: '#107c41',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <i className="fa-solid fa-folder-open"></i>
                  {fileName ? 'Trocar Planilha' : 'Selecionar Arquivo Excel'}
                </button>
              </div>

              {fileName && (
                <div style={{ marginTop: '6px', fontSize: '12px', color: '#107c41', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-circle-check"></i>
                  <span>{fileName} ({rawRows.length > 0 ? `${rawRows.length - 1} linhas lidas` : 'lendo...'})</span>
                </div>
              )}
            </div>
          </div>

          {/* SUMMARY CARDS IF DATA LOADED */}
          {parsedItems.length > 0 && (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                marginBottom: '14px'
              }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#f3f2f1',
                  border: '1px solid #e1dfdd'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#605e5c', textTransform: 'uppercase' }}>Linhas na Planilha</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#323130', marginTop: '2px' }}>{counts.total}</div>
                </div>

                <div style={{
                  padding: '12px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#e6f4ea',
                  border: '1px solid #b7e1cd'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#137333', textTransform: 'uppercase' }}>🟢 Novos a Cadastrar</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#137333', marginTop: '2px' }}>{counts.news}</div>
                </div>

                <div style={{
                  padding: '12px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#eff6fc',
                  border: '1px solid #c7e0f4'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#0078d4', textTransform: 'uppercase' }}>🔵 Atualizações de Dados</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#0078d4', marginTop: '2px' }}>{counts.updates}</div>
                </div>

                <div style={{
                  padding: '12px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#faf9f8',
                  border: '1px solid #edebe9'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#605e5c', textTransform: 'uppercase' }}>⚪ Idênticos (Não Duplicar)</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#605e5c', marginTop: '2px' }}>{counts.identicals}</div>
                </div>
              </div>

              {/* FILTER TABS */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #edebe9', paddingBottom: '8px', marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => setFilterTab('ALL')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '14px',
                    border: '1px solid',
                    borderColor: filterTab === 'ALL' ? '#0078d4' : '#d2d0ce',
                    backgroundColor: filterTab === 'ALL' ? '#0078d4' : '#ffffff',
                    color: filterTab === 'ALL' ? '#ffffff' : '#323130',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Todos ({counts.total})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('CHANGES')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '14px',
                    border: '1px solid',
                    borderColor: filterTab === 'CHANGES' ? '#107c41' : '#d2d0ce',
                    backgroundColor: filterTab === 'CHANGES' ? '#107c41' : '#ffffff',
                    color: filterTab === 'CHANGES' ? '#ffffff' : '#323130',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Apenas Modificações / Novos ({counts.actionable})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('IDENTICAL')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '14px',
                    border: '1px solid',
                    borderColor: filterTab === 'IDENTICAL' ? '#605e5c' : '#d2d0ce',
                    backgroundColor: filterTab === 'IDENTICAL' ? '#605e5c' : '#ffffff',
                    color: filterTab === 'IDENTICAL' ? '#ffffff' : '#323130',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Idênticos Mantidos ({counts.identicals})
                </button>
              </div>

              {/* PREVIEW TABLE */}
              <div style={{
                maxHeight: '340px',
                overflowY: 'auto',
                border: '1px solid #edebe9',
                borderRadius: '4px'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead style={{ backgroundColor: '#f3f2f1', position: 'sticky', top: 0, zIndex: 2 }}>
                    <tr>
                      <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #d2d0ce' }}>Linha</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #d2d0ce' }}>Status</th>
                      {categoryDef.fields.map(f => (
                        <th key={f.key} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #d2d0ce' }}>
                          {f.label}
                        </th>
                      ))}
                      <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #d2d0ce' }}>Detalhes da Comparação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPreview.map((item, idx) => {
                      let rowBg = '#ffffff';
                      let statusBadge = (
                        <span style={{ backgroundColor: '#e6f4ea', color: '#137333', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, fontSize: '11px' }}>
                          🟢 Novo
                        </span>
                      );

                      if (item.importStatus === 'update') {
                        rowBg = '#f6faff';
                        statusBadge = (
                          <span style={{ backgroundColor: '#eff6fc', color: '#0078d4', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, fontSize: '11px' }}>
                            🔵 Atualizar
                          </span>
                        );
                      } else if (item.importStatus === 'identical') {
                        rowBg = '#fcfcfc';
                        statusBadge = (
                          <span style={{ backgroundColor: '#f3f2f1', color: '#605e5c', padding: '2px 8px', borderRadius: '10px', fontWeight: 600, fontSize: '11px' }}>
                            ⚪ Idêntico
                          </span>
                        );
                      }

                      return (
                        <tr key={idx} style={{ backgroundColor: rowBg, borderBottom: '1px solid #edebe9' }}>
                          <td style={{ padding: '8px 10px', color: '#605e5c', fontWeight: 600 }}>{item.rowIndex}</td>
                          <td style={{ padding: '8px 10px' }}>{statusBadge}</td>
                          {categoryDef.fields.map(f => (
                            <td key={f.key} style={{ padding: '8px 10px', color: '#323130' }}>
                              {item.data[f.key] || '-'}
                            </td>
                          ))}
                          <td style={{ padding: '8px 10px', fontSize: '11px' }}>
                            {item.importStatus === 'new' && (
                              <span style={{ color: '#137333', fontWeight: 600 }}>Novo registro no banco de dados</span>
                            )}
                            {item.importStatus === 'identical' && (
                              <span style={{ color: '#605e5c' }}>Sem alterações (permanece intacto)</span>
                            )}
                            {item.importStatus === 'update' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {item.diffs.map((d, di) => (
                                  <div key={di} style={{ color: '#0078d4' }}>
                                    <strong>{d.label}:</strong> <span style={{ textDecoration: 'line-through', color: '#a80000' }}>{d.oldVal}</span> ➔ <strong style={{ color: '#107c41' }}>{d.newVal}</strong>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {parsedItems.length === 0 && !isProcessing && (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              backgroundColor: '#faf9f8',
              borderRadius: '6px',
              border: '2px dashed #edebe9'
            }}>
              <i className="fa-solid fa-file-arrow-up" style={{ fontSize: '42px', color: '#107c41', marginBottom: '12px', display: 'block' }}></i>
              <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: '#323130' }}>
                Nenhuma planilha selecionada
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#605e5c' }}>
                Selecione um arquivo Excel (.xlsx, .xls) ou CSV contendo os dados de <strong>{categoryDef.label}</strong> para fazer a leitura e verificação automática.
              </p>
            </div>
          )}

          {isProcessing && (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '32px', color: '#0078d4', marginBottom: '10px' }}></i>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#323130' }}>Processando planilha e comparando com o banco de dados...</p>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e1dfdd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ fontSize: '12px', color: '#605e5c' }}>
            Unidade: <strong>{selectedUnidade}</strong>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: '1px solid #8a8886',
                backgroundColor: '#ffffff',
                color: '#323130',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isImporting || parsedItems.length === 0 || counts.actionable === 0}
              style={{
                padding: '8px 20px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: counts.actionable > 0 ? '#107c41' : '#a19f9d',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: counts.actionable > 0 && !isImporting ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isImporting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Importando...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  <span>Confirmar e Salvar ({counts.actionable} alterações)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
