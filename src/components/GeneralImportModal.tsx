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
      { key: 'unidade', label: 'UNIDADE' },
      { key: 'cultura', label: 'Cultura', required: true },
      { key: 'cCusto', label: 'C.Custo' },
      { key: 'fazenda', label: 'Fazenda', required: true },
      { key: 'pivo', label: 'PIVO' },
      { key: 'gleba', label: 'Gleba' },
      { key: 'variedade', label: 'Variedade' },
      { key: 'haDia', label: 'Área/há' },
      { key: 'mes', label: 'Mês' },
      { key: 'obs', label: 'Obs' },
      { key: 'areaDescartadas', label: 'Area Descartadas' },
      { key: 'ano', label: 'Ano' },
      { key: 'empresa', label: 'Empresa' },
      { key: 'os', label: 'OS' },
      { key: 'haRestante', label: 'HA Restante' },
      { key: 'glebasFinalizada', label: 'Finalizada' },
      { key: 'mediaHa', label: 'Média HA' }
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
  if (typeof val === 'number') {
    return Number.isInteger(val) ? String(val) : String(val).replace('.', ',');
  }
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
  const [activeColMapping, setActiveColMapping] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync category when targetCategory prop changes
  useEffect(() => {
    if (isOpen) {
      setActiveCategory(targetCategory);
      setFileName('');
      setRawRows([]);
      setParsedItems([]);
      setActiveColMapping({});
      setFilterTab('ALL');
    }
  }, [isOpen, targetCategory]);

  const categoryDef = CATEGORY_DEFINITIONS[activeCategory] || CATEGORY_DEFINITIONS.culturas;

  // Auto detect columns and build parsed items
  const parseRowsForCategory = (rows: any[][], catKey: GeneralCategoryKey) => {
    if (!rows || rows.length < 2) {
      setParsedItems([]);
      setActiveColMapping({});
      return;
    }

    const catInfo = CATEGORY_DEFINITIONS[catKey];
    if (!catInfo) return;

    const rawHeaderRow = rows[0] || [];
    const headers = rawHeaderRow.map(h => cleanText(h).toLowerCase());
    const existingList = existingData[catKey] || [];

    // Helper to find column index for field with exhaustive, collision-safe matching
    const findColIdx = (fieldKey: string, fieldLabel: string) => {
      const normField = normalizeKey(fieldKey);
      const normLabel = normalizeKey(fieldLabel);

      // 1. Exact normalized match
      let idx = headers.findIndex(h => {
        const normH = normalizeKey(h);
        return normH === normField || normH === normLabel;
      });
      if (idx !== -1) return idx;

      // 2. Specific aliases and field patterns
      if (fieldKey === 'data') {
        idx = headers.findIndex(h => {
          const nh = normalizeKey(h);
          return nh === 'data' || nh.includes('data') || nh === 'dt';
        });
      } else if (fieldKey === 'unidade' || fieldKey === 'empresa') {
        idx = headers.findIndex(h => {
          const nh = normalizeKey(h);
          return nh === 'unidade' || nh.includes('unidade') || nh === 'empresa' || nh.includes('empresa') || nh === 'filial';
        });
      } else if (fieldKey === 'cultura') {
        idx = headers.findIndex(h => {
          const nh = normalizeKey(h);
          return nh === 'cultura' || nh.includes('cultura');
        });
      } else if (fieldKey === 'cCusto' || fieldKey === 'os') {
        idx = headers.findIndex(h => {
          const nh = normalizeKey(h);
          return nh === 'ccusto' || nh.includes('ccusto') || nh.includes('custo') || nh === 'os' || nh.includes('ordem');
        });
      } else if (fieldKey === 'fazenda') {
        idx = headers.findIndex(h => {
          const nh = normalizeKey(h);
          return nh === 'fazenda' || nh.includes('fazenda') || nh === 'propriedade';
        });
      } else if (fieldKey === 'pivo') {
        idx = headers.findIndex(h => {
          const nh = normalizeKey(h);
          return nh === 'pivo' || nh.includes('pivo');
        });
      } else if (fieldKey === 'gleba') {
        idx = headers.findIndex(h => {
          const nh = normalizeKey(h);
          return nh === 'gleba' || nh.includes('gleba') || nh === 'talhao' || nh.includes('talhao');
        });
      } else if (fieldKey === 'variedade') {
        idx = headers.findIndex(h => {
          const nh = normalizeKey(h);
          return nh === 'variedade' || nh.includes('variedade') || nh === 'cultivar';
        });
      } else if (fieldKey === 'haDia' || fieldKey === 'areaHa' || fieldKey === 'haGeral') {
        idx = headers.findIndex(h => {
          const nh = normalizeKey(h);
          if (nh.includes('descart') || nh.includes('restante')) return false;
          return nh === 'areaha' || nh === 'hadia' || nh.includes('hadia') || nh.includes('ha_dia') || nh.includes('hectares') || nh === 'area' || nh.includes('areaha') || nh.startsWith('area');
        });
      } else if (fieldKey === 'areaDescartadas') {
        idx = headers.findIndex(h => {
          const nh = normalizeKey(h);
          return nh.includes('descart') || nh.includes('perda') || nh.includes('areadescart');
        });
      } else if (fieldKey === 'mes') {
        idx = headers.findIndex(h => {
          const nh = normalizeKey(h);
          return nh === 'mes' || nh.includes('mes');
        });
      } else if (fieldKey === 'ano') {
        idx = headers.findIndex(h => {
          const nh = normalizeKey(h);
          return nh === 'ano' || nh === 'safra' || nh.includes('safra');
        });
      } else if (fieldKey === 'obs') {
        idx = headers.findIndex(h => {
          const nh = normalizeKey(h);
          return nh === 'obs' || nh.includes('obs') || nh.includes('observ');
        });
      } else if (fieldKey === 'haRestante') {
        idx = headers.findIndex(h => {
          const nh = normalizeKey(h);
          return nh.includes('restante') || nh.includes('harestante');
        });
      } else if (fieldKey === 'glebasFinalizada') {
        idx = headers.findIndex(h => {
          const nh = normalizeKey(h);
          return nh.includes('finaliz') || nh.includes('concluid');
        });
      } else if (fieldKey === 'mediaHa') {
        idx = headers.findIndex(h => {
          const nh = normalizeKey(h);
          return nh.includes('media') || nh.includes('mediaha');
        });
      } else if (fieldKey === 'qtdColhida' || fieldKey === 'qtdColhido') {
        idx = headers.findIndex(h => {
          const nh = normalizeKey(h);
          return nh.includes('colhid') || nh.includes('qtd') || nh.includes('quantidade');
        });
      } else if (fieldKey === 'caixasCortadas') {
        idx = headers.findIndex(h => {
          const nh = normalizeKey(h);
          return nh.includes('caixa') || nh.includes('cortad');
        });
      } else if (fieldKey === 'embalagem') {
        idx = headers.findIndex(h => {
          const nh = normalizeKey(h);
          return nh.includes('embalag') || nh.includes('bin') || nh.includes('bag');
        });
      } else if (fieldKey === 'nome') {
        idx = headers.findIndex(h => {
          const nh = normalizeKey(h);
          return nh === 'nome' || nh.includes('nome') || nh.includes('descricao') || nh.includes('placa') || nh.includes('titulo');
        });
      } else if (fieldKey === 'codigo' || fieldKey === 'codigoMarca') {
        idx = headers.findIndex(h => {
          const nh = normalizeKey(h);
          return nh === 'codigo' || nh === 'cod' || nh.includes('cod') || nh.includes('matricula') || nh.includes('capa') || nh.includes('id');
        });
      } else if (fieldKey === 'tipo') {
        idx = headers.findIndex(h => {
          const nh = normalizeKey(h);
          return nh === 'tipo' || nh.includes('tipo') || nh.includes('vinc');
        });
      } else {
        // General fuzzy substring match
        idx = headers.findIndex(h => {
          const normH = normalizeKey(h);
          return normH.includes(normField) || normField.includes(normH);
        });
      }

      return idx;
    };

    // Map column index to field
    const colMapping: Record<string, number> = {};
    catInfo.fields.forEach(f => {
      colMapping[f.key] = findColIdx(f.key, f.label);
    });

    // Fallback if no specific column mapped for primary field in lookup tables
    if (colMapping['nome'] === -1 && colMapping['codigo'] === -1 && !['plantio', 'colheita', 'amarracoes'].includes(catKey)) {
      if (rows[0].length > 1) {
        colMapping['codigo'] = 0;
        colMapping['nome'] = 1;
      } else {
        colMapping['nome'] = 0;
      }
    }

    setActiveColMapping(colMapping);

    const results: ParsedGenericItem[] = [];
    const seenMap = new Map<string, number>();

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      // Skip row if completely empty
      const hasAnyNonEmpty = row.some(cell => cleanText(cell) !== '');
      if (!hasAnyNonEmpty) continue;

      const itemData: Record<string, any> = {
        unidade: selectedUnidade
      };

      catInfo.fields.forEach((f) => {
        const colIdx = colMapping[f.key];
        let val = '';
        if (colIdx !== undefined && colIdx !== -1 && row[colIdx] !== undefined) {
          const rawVal = row[colIdx];

          // Format dates if plantio or colheita or general date field
          if (f.key === 'data') {
            if (typeof rawVal === 'number' && rawVal > 20000 && rawVal < 65000) {
              // Excel serial date number
              const dateObj = new Date(Math.round((rawVal - 25569) * 86400 * 1000));
              if (!isNaN(dateObj.getTime())) {
                const dd = String(dateObj.getUTCDate()).padStart(2, '0');
                const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
                const yyyy = String(dateObj.getUTCFullYear());
                val = `${dd}/${mm}/${yyyy}`;
              }
            } else if (rawVal instanceof Date) {
              const dd = String(rawVal.getDate()).padStart(2, '0');
              const mm = String(rawVal.getMonth() + 1).padStart(2, '0');
              const yyyy = String(rawVal.getFullYear());
              val = `${dd}/${mm}/${yyyy}`;
            } else {
              val = cleanText(rawVal);
              if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
                const [yyyy, mm, dd] = val.split('T')[0].split('-');
                val = `${dd}/${mm}/${yyyy}`;
              } else if (/^\d{2}\/\d{2}\/\d{2}$/.test(val)) {
                const parts = val.split('/');
                val = `${parts[0]}/${parts[1]}/20${parts[2]}`;
              }
            }
          } else {
            val = cleanText(rawVal);
          }
        }

        // Format status for colaboradores
        if (f.key === 'status' && val) {
          val = val.toLowerCase().includes('inat') ? 'Inativo' : 'Ativo';
        }

        itemData[f.key] = val;
      });

      // Post-process domain fields for plantio & colheita
      if (catKey === 'plantio') {
        if (!itemData.unidade && itemData.empresa) itemData.unidade = itemData.empresa;
        if (!itemData.empresa && itemData.unidade) itemData.empresa = itemData.unidade;
        if (!itemData.unidade) itemData.unidade = selectedUnidade;
        if (!itemData.empresa) itemData.empresa = selectedUnidade;
        if (!itemData.os && itemData.cCusto) itemData.os = itemData.cCusto;
        if (!itemData.cCusto && itemData.os) itemData.cCusto = itemData.os;
        if (!itemData.areaDescartadas) itemData.areaDescartadas = '0,00';
        if (!itemData.obs) itemData.obs = '-';
        if (itemData.data) {
          const parts = itemData.data.split('/');
          if (parts.length === 3) {
            if (!itemData.ano) itemData.ano = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
            if (!itemData.mes) {
              const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
              const mNum = parseInt(parts[1], 10);
              if (mNum >= 1 && mNum <= 12) itemData.mes = monthNames[mNum - 1];
            }
          }
        }
      } else if (catKey === 'colheita') {
        if (!itemData.unidade && itemData.empresa) itemData.unidade = itemData.empresa;
        if (!itemData.empresa && itemData.unidade) itemData.empresa = itemData.unidade;
        if (!itemData.unidade) itemData.unidade = selectedUnidade;
        if (!itemData.empresa) itemData.empresa = selectedUnidade;
        if (!itemData.os && itemData.cCusto) itemData.os = itemData.cCusto;
        if (!itemData.cCusto && itemData.os) itemData.cCusto = itemData.os;
        if (itemData.data) {
          const parts = itemData.data.split('/');
          if (parts.length === 3) {
            if (!itemData.ano) itemData.ano = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
            if (!itemData.mes) {
              const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
              const mNum = parseInt(parts[1], 10);
              if (mNum >= 1 && mNum <= 12) itemData.mes = monthNames[mNum - 1];
            }
          }
        }
      }

      // Auto generate sequential code if missing in lookup tables
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

      // Safe deduplication inside the spreadsheet itself
      let dedupeKey = '';
      if (catKey === 'plantio') {
        dedupeKey = `${cleanText(itemData.data)}_${normalizeKey(itemData.fazenda)}_${normalizeKey(itemData.pivo)}_${normalizeKey(itemData.gleba)}_${normalizeKey(itemData.variedade)}_${normalizeKey(itemData.cultura)}_${cleanText(itemData.haDia)}`;
      } else if (catKey === 'colheita') {
        dedupeKey = `${cleanText(itemData.data)}_${normalizeKey(itemData.fazenda)}_${normalizeKey(itemData.pivo)}_${normalizeKey(itemData.gleba)}_${normalizeKey(itemData.variedade)}_${normalizeKey(itemData.cultura)}_${cleanText(itemData.haDia || itemData.haGeral || itemData.qtdColhido || itemData.qtdColhida)}`;
      } else if (catKey === 'variedades') {
        dedupeKey = `${normalizeKey(itemData.codigo)}_${normalizeKey(itemData.nome)}_${normalizeKey(itemData.cultura)}`;
      } else if (catKey === 'amarracoes') {
        dedupeKey = `${normalizeKey(itemData.categoria)}_${normalizeKey(itemData.origem)}_${normalizeKey(itemData.destino)}`;
      } else {
        dedupeKey = `${normalizeKey(itemData.codigo)}_${normalizeKey(itemData.nome)}`;
      }

      if (dedupeKey && seenMap.has(dedupeKey)) {
        continue;
      }
      if (dedupeKey) {
        seenMap.set(dedupeKey, r);
      }

      // Identify matching existing item in database
      let matchedExisting: any = null;
      if (catKey === 'plantio') {
        const d = cleanText(itemData.data);
        const c = normalizeKey(itemData.cultura);
        const f = normalizeKey(itemData.fazenda);
        const p = normalizeKey(itemData.pivo);
        const g = normalizeKey(itemData.gleba);
        const v = normalizeKey(itemData.variedade);
        matchedExisting = existingList.find(e => {
          return cleanText(e.data) === d &&
                 normalizeKey(e.cultura) === c &&
                 normalizeKey(e.fazenda) === f &&
                 (!p || normalizeKey(e.pivo) === p) &&
                 (!g || normalizeKey(e.gleba) === g) &&
                 (!v || normalizeKey(e.variedade) === v);
        });
      } else if (catKey === 'colheita') {
        const d = cleanText(itemData.data);
        const c = normalizeKey(itemData.cultura);
        const f = normalizeKey(itemData.fazenda);
        const p = normalizeKey(itemData.pivo);
        const g = normalizeKey(itemData.gleba);
        const v = normalizeKey(itemData.variedade);
        matchedExisting = existingList.find(e => {
          return cleanText(e.data) === d &&
                 normalizeKey(e.cultura) === c &&
                 normalizeKey(e.fazenda) === f &&
                 (!p || normalizeKey(e.pivo) === p) &&
                 (!g || normalizeKey(e.gleba) === g) &&
                 (!v || normalizeKey(e.variedade) === v);
        });
      } else if (catKey === 'variedades') {
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
      } else {
        // Simple items (culturas, empresas, anos, fazendas, pivos, glebas)
        const normName = normalizeKey(itemData.nome);
        const normCod = cleanText(itemData.codigo);
        matchedExisting = existingList.find(e => {
          return (normName && normalizeKey(e.nome) === normName) || (normCod && cleanText(e.codigo) === normCod);
        });
      }

      // Check diffs against existing record
      const diffs: FieldDiff[] = [];
      let importStatus: 'identical' | 'update' | 'new' = 'new';
      let existingId: string | undefined = undefined;

      if (matchedExisting) {
        existingId = matchedExisting.id;
        let isIdentical = true;

        catInfo.fields.forEach(f => {
          const colIdx = colMapping[f.key];
          // Only compare fields that exist in the spreadsheet
          if (colIdx === undefined || colIdx === -1) return;

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

        importStatus = isIdentical ? 'identical' : 'update';
      } else {
        importStatus = 'new';
      }

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

  // File processing via XLSX with intelligent scoring category detection
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

        // Intelligent category detection
        const fileLower = (file.name || '').toLowerCase();
        const sheetLower = (firstSheet || '').toLowerCase();
        const nameAndSheet = `${fileLower} ${sheetLower}`;

        const rawHeaderRow = jsonData[0] || [];
        const headersNorm = rawHeaderRow.map(h => normalizeKey(h));
        const headersJoined = rawHeaderRow.map(h => cleanText(h).toLowerCase()).join(' ');

        // Check if current activeCategory already matches this spreadsheet well
        const currentDef = CATEGORY_DEFINITIONS[activeCategory];
        let currentMatchScore = 0;
        if (currentDef) {
          currentDef.fields.forEach(f => {
            const nf = normalizeKey(f.key);
            const nl = normalizeKey(f.label);
            if (headersNorm.some(hn => hn === nf || hn === nl || (hn.length > 2 && (nl.includes(hn) || hn.includes(nl))))) {
              currentMatchScore++;
            }
          });
        }

        const scores: Record<GeneralCategoryKey, number> = {
          plantio: 0,
          colheita: 0,
          variedades: 0,
          culturas: 0,
          fazendas: 0,
          pivos: 0,
          glebas: 0,
          empresas: 0,
          anos: 0,
          colaboradores: 0,
          motoristas: 0,
          onibus: 0,
          amarracoes: 0
        };

        // File & sheet name bonuses
        if (nameAndSheet.includes('plantio')) scores.plantio += 25;
        if (nameAndSheet.includes('colheita')) scores.colheita += 25;
        if (nameAndSheet.includes('amarr') || nameAndSheet.includes('marca')) scores.amarracoes += 25;
        if (nameAndSheet.includes('colaborador') || nameAndSheet.includes('funciona')) scores.colaboradores += 25;
        if (nameAndSheet.includes('motorista')) scores.motoristas += 25;
        if (nameAndSheet.includes('onibus') || nameAndSheet.includes('ônibus')) scores.onibus += 25;
        if (nameAndSheet.includes('fazenda')) scores.fazendas += 15;
        if (nameAndSheet.includes('pivo') || nameAndSheet.includes('pivô')) scores.pivos += 15;
        if (nameAndSheet.includes('gleba')) scores.glebas += 15;
        if (nameAndSheet.includes('empresa') || nameAndSheet.includes('filial')) scores.empresas += 15;
        if (nameAndSheet.includes('safra') || nameAndSheet.includes('ano')) scores.anos += 15;
        if (nameAndSheet.includes('variedade')) scores.variedades += 15;
        if (nameAndSheet.includes('cultura')) scores.culturas += 10;

        // Specific distinguishing header patterns
        const hasDate = headersNorm.some(h => h.includes('data') || h === 'dt');
        const hasFarm = headersNorm.some(h => h.includes('fazenda') || h === 'faz');
        const hasPivotOrGleba = headersNorm.some(h => h.includes('pivo') || h.includes('gleba') || h.includes('talhao'));
        const hasCrop = headersNorm.some(h => h.includes('cultura'));
        const hasVariety = headersNorm.some(h => h.includes('variedade') || h === 'cultivar');
        const hasAreaHa = headersNorm.some(h => !h.includes('descart') && (h.includes('hadia') || h.includes('areaha') || h === 'area'));
        const hasAreaDescart = headersNorm.some(h => h.includes('descart'));
        const hasColheitaQtd = headersNorm.some(h => h.includes('qtd') || h.includes('colhid') || h.includes('caixa') || h.includes('producao') || h.includes('produtiv'));
        const hasApontador = headersNorm.some(h => h.includes('apontador') || h.includes('matricula'));
        const hasPlaca = headersNorm.some(h => h.includes('placa') || h.includes('cooperado'));
        const hasAbreviacao = headersNorm.some(h => h.includes('abrevia'));
        const hasMarcaCodigo = headersJoined.includes('codigomarca') || (headersJoined.includes('origem') && headersJoined.includes('destino'));

        if (hasColheitaQtd) {
          scores.colheita += 20;
        }
        if (hasDate && hasFarm && (hasAreaHa || hasAreaDescart || hasPivotOrGleba) && !hasColheitaQtd) {
          scores.plantio += 22;
        }
        if (hasDate && hasFarm && hasColheitaQtd) {
          scores.colheita += 22;
        }
        if (hasMarcaCodigo) scores.amarracoes += 25;
        if (hasApontador) scores.colaboradores += 20;
        if (hasPlaca) scores.onibus += 20;
        if (hasAbreviacao) scores.motoristas += 20;

        if (rawHeaderRow.length <= 4 && !hasDate && !hasFarm) {
          if (hasVariety) scores.variedades += 15;
          if (hasCrop && !hasVariety) scores.culturas += 15;
        }

        let bestCat = activeCategory;
        let highestScore = 0;
        (Object.keys(scores) as GeneralCategoryKey[]).forEach(k => {
          if (scores[k] > highestScore) {
            highestScore = scores[k];
            bestCat = k;
          }
        });

        let guessedCategory = activeCategory;
        // Keep activeCategory if it already matches well or if detected score isn't overwhelmingly different
        if (currentMatchScore >= 3 && scores[activeCategory] >= 10) {
          guessedCategory = activeCategory;
        } else if (highestScore >= 15) {
          guessedCategory = bestCat;
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

  const previewFields = useMemo(() => {
    const fieldsWithData = categoryDef.fields.filter(f => {
      if (f.required) return true;
      const colIdx = activeColMapping[f.key];
      if (colIdx !== undefined && colIdx !== -1) return true;
      return parsedItems.some(item => cleanText(item.data[f.key]) !== '');
    });
    return fieldsWithData.length > 0 ? fieldsWithData : categoryDef.fields;
  }, [categoryDef, parsedItems, activeColMapping]);

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
                maxHeight: '380px',
                overflowY: 'auto',
                overflowX: 'auto',
                border: '1px solid #edebe9',
                borderRadius: '4px'
              }}>
                <table style={{ width: '100%', minWidth: 'max-content', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead style={{ backgroundColor: '#f3f2f1', position: 'sticky', top: 0, zIndex: 2 }}>
                    <tr>
                      <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #d2d0ce', whiteSpace: 'nowrap' }}>Linha</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #d2d0ce', whiteSpace: 'nowrap' }}>Status</th>
                      {previewFields.map(f => (
                        <th key={f.key} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #d2d0ce', whiteSpace: 'nowrap' }}>
                          {f.label}
                        </th>
                      ))}
                      <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #d2d0ce', whiteSpace: 'nowrap' }}>Detalhes da Comparação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPreview.map((item, idx) => {
                      let rowBg = '#ffffff';
                      let statusBadge = (
                        <span style={{ backgroundColor: '#e6f4ea', color: '#137333', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, fontSize: '11px', whiteSpace: 'nowrap' }}>
                          🟢 Novo
                        </span>
                      );

                      if (item.importStatus === 'update') {
                        rowBg = '#f6faff';
                        statusBadge = (
                          <span style={{ backgroundColor: '#eff6fc', color: '#0078d4', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, fontSize: '11px', whiteSpace: 'nowrap' }}>
                            🔵 Atualizar
                          </span>
                        );
                      } else if (item.importStatus === 'identical') {
                        rowBg = '#fcfcfc';
                        statusBadge = (
                          <span style={{ backgroundColor: '#f3f2f1', color: '#605e5c', padding: '2px 8px', borderRadius: '10px', fontWeight: 600, fontSize: '11px', whiteSpace: 'nowrap' }}>
                            ⚪ Idêntico
                          </span>
                        );
                      }

                      return (
                        <tr key={idx} style={{ backgroundColor: rowBg, borderBottom: '1px solid #edebe9' }}>
                          <td style={{ padding: '8px 12px', color: '#605e5c', fontWeight: 600, whiteSpace: 'nowrap' }}>{item.rowIndex}</td>
                          <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{statusBadge}</td>
                          {previewFields.map(f => (
                            <td key={f.key} style={{ padding: '8px 12px', color: '#323130', whiteSpace: 'nowrap' }}>
                              {item.data[f.key] || '-'}
                            </td>
                          ))}
                          <td style={{ padding: '8px 12px', fontSize: '11px' }}>
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
