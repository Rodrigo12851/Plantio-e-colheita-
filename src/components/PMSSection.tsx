import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';

export interface PMSItem {
  id?: string;
  cultura: string;
  variedade: string;
  tipo: string;
  cicloDias: string | number;
  unidadeVenda: string;
  mediaUtilizacaoSemente: string | number;
  produtividade: string | number;
  unidadeVenda2: string;
  pms: string;
  unidade?: string;
}

export interface SimpleItemProp {
  id?: string;
  codigo?: string;
  nome: string;
  tipo?: 'Hortifruti' | 'Cereais' | string;
  unidade?: string;
}

export interface VariedadeItemProp {
  id?: string;
  codigo?: string;
  nome: string;
  cultura: string;
  unidade?: string;
}

export interface ParsedImportItem extends PMSItem {
  isUpdate?: boolean;
  existingId?: string;
  previousPms?: string;
  hasChanges?: boolean;
}

// Utility to ensure values are never 'undefined', 'null', or undefined - returns empty string ''
export const cleanValue = (val: any): string => {
  if (val === undefined || val === null) return '';
  const s = String(val).trim();
  if (s.toLowerCase() === 'undefined' || s.toLowerCase() === 'null') return '';
  return s;
};

export const DEFAULT_PMS_DATA: PMSItem[] = [
  { cultura: 'Crambe', variedade: 'Abyssinica', tipo: 'Cereais', cicloDias: '120', unidadeVenda: '', mediaUtilizacaoSemente: '', produtividade: '32', unidadeVenda2: 'sacas p/há', pms: '', unidade: 'Cristalina' },
  { cultura: 'Feijão Carioca', variedade: 'Carioca Dama', tipo: 'Cereais', cicloDias: '90', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '50', unidadeVenda2: 'sacas p/há', pms: 'PMS Dama: 250 Grmas', unidade: 'Cristalina' },
  { cultura: 'Feijão Carioca', variedade: 'Estilo', tipo: 'Cereais', cicloDias: '90', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '50', unidadeVenda2: 'sacas p/há', pms: 'Estilo: 260 Gramas', unidade: 'Cristalina' },
  { cultura: 'Feijão Carioca', variedade: 'Polaco', tipo: 'Cereais', cicloDias: '80', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '50', unidadeVenda2: 'sacas p/há', pms: 'Polaco: 250 Gramas', unidade: 'Cristalina' },
  { cultura: 'Feijão Preto', variedade: 'Esteio', tipo: 'Cereais', cicloDias: '90', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '50', unidadeVenda2: 'sacas p/há', pms: 'Esteio: 240 Gramas', unidade: 'Cristalina' },
  { cultura: 'Feijão Preto', variedade: 'Urutau', tipo: 'Cereais', cicloDias: '90', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '50', unidadeVenda2: 'sacas p/há', pms: 'Urutau: 240 Gramas', unidade: 'Cristalina' },
  { cultura: 'Milheto', variedade: 'ADR300', tipo: 'Cereais', cicloDias: '100', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '60', unidadeVenda2: 'Sacas p/há', pms: 'ADR300: 7 Gramas', unidade: 'Cristalina' },
  { cultura: 'Milheto', variedade: 'BRS 1502', tipo: 'Cereais', cicloDias: '110', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '60', unidadeVenda2: 'Sacas p/há', pms: 'BRS 1502: 6,5 Gramas', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'CZ48B321 IPRO', tipo: 'Cereais', cicloDias: '130', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: '', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'Aporé', tipo: 'Cereais', cicloDias: '118', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: '', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'AS3790I2X', tipo: 'Cereais', cicloDias: '120', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: '', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'B39 IPRO', tipo: 'Cereais', cicloDias: '120', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: '', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'CD 2728', tipo: 'Cereais', cicloDias: '120', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: '', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'Coari', tipo: 'Cereais', cicloDias: '125', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: '', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'Cobre', tipo: 'Cereais', cicloDias: '120', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: '', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'Combate', tipo: 'Cereais', cicloDias: '115', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: '', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'CZ11B51', tipo: 'Cereais', cicloDias: '118', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: '', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'CZ37B39', tipo: 'Cereais', cicloDias: '115', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: '', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'CZ37B43', tipo: 'Cereais', cicloDias: '120', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: '', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'CZ37B51', tipo: 'Cereais', cicloDias: '115', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: 'CZ37B51: 171 Gramas', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'Desafio', tipo: 'Cereais', cicloDias: '120', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: '', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'Extrema', tipo: 'Cereais', cicloDias: '140', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: '', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'Foco', tipo: 'Cereais', cicloDias: '120', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: '', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'FTR 3165', tipo: 'Cereais', cicloDias: '120', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: 'FTR 3165: 167 Gramas', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'Guapo', tipo: 'Cereais', cicloDias: '120', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: '', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'Guepardo', tipo: 'Cereais', cicloDias: '105', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: '', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'M8644', tipo: 'Cereais', cicloDias: '120', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: 'M8644: 165 Gramas', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'Mítica', tipo: 'Cereais', cicloDias: '110', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: '', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'Neo 750', tipo: 'Cereais', cicloDias: '125', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: 'Neo 750: 162 Gramas', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'Neo 790', tipo: 'Cereais', cicloDias: '125', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: 'Neo 790: 174 Gramas', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'NS8080', tipo: 'Cereais', cicloDias: '120', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: 'NS8080: 190 Gramas', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'Olimpio', tipo: 'Cereais', cicloDias: '120', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: '', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'STR 3165', tipo: 'Cereais', cicloDias: '120', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: 'STR 3165: 185 Gramas', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'STR 3166', tipo: 'Cereais', cicloDias: '120', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: 'STR 3166: 175 Gramas', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'STR 3167', tipo: 'Cereais', cicloDias: '120', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: 'STR 3167: 180 Gramas', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'STR 3168', tipo: 'Cereais', cicloDias: '120', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: 'STR 3168: 180 Gramas', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'STR 3169', tipo: 'Cereais', cicloDias: '120', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: 'STR 3169: 180 Gramas', unidade: 'Cristalina' },
  { cultura: 'Soja', variedade: 'STR 3170', tipo: 'Cereais', cicloDias: '120', unidadeVenda: 'Sacas', mediaUtilizacaoSemente: '', produtividade: '70', unidadeVenda2: 'sacas p/há', pms: 'STR 3170: 180 Gramas', unidade: 'Cristalina' }
];

interface PMSSectionProps {
  items: PMSItem[];
  selectedUnidade: string;
  culturas?: SimpleItemProp[];
  variedades?: VariedadeItemProp[];
  onSaveItem: (item: PMSItem, id?: string) => Promise<void>;
  onDeleteItem: (id?: string) => Promise<void>;
  onImportBatch: (newItems: PMSItem[]) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

export const PMSSection: React.FC<PMSSectionProps> = ({
  items,
  selectedUnidade,
  culturas = [],
  variedades = [],
  onSaveItem,
  onDeleteItem,
  onImportBatch,
  showToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCultura, setFilterCultura] = useState('TODAS');
  const [filterTipo, setFilterTipo] = useState('TODOS');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PMSItem | null>(null);
  const [formCultura, setFormCultura] = useState('');
  const [formVariedade, setFormVariedade] = useState('');
  const [formTipo, setFormTipo] = useState('Cereais');
  const [formCicloDias, setFormCicloDias] = useState('');
  const [formUnidadeVenda, setFormUnidadeVenda] = useState('Sacas');
  const [formMediaUtilizacaoSemente, setFormMediaUtilizacaoSemente] = useState('');
  const [formProdutividade, setFormProdutividade] = useState('');
  const [formUnidadeVenda2, setFormUnidadeVenda2] = useState('sacas p/há');
  const [formPMS, setFormPMS] = useState('');

  // Import Modal & File Input
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedPreview, setImportedPreview] = useState<ParsedImportItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter items by selected unidade and filters
  const unidadeItems = useMemo(() => {
    return items.filter(item => !item.unidade || item.unidade === selectedUnidade || selectedUnidade === 'TODAS');
  }, [items, selectedUnidade]);

  const filteredItems = useMemo(() => {
    return unidadeItems.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const cCultura = cleanValue(item.cultura);
      const cVariedade = cleanValue(item.variedade);
      const cPMS = cleanValue(item.pms);
      const cTipo = cleanValue(item.tipo);
      const cCiclo = cleanValue(item.cicloDias);
      const cProd = cleanValue(item.produtividade);

      const matchesSearch =
        !q ||
        cCultura.toLowerCase().includes(q) ||
        cVariedade.toLowerCase().includes(q) ||
        cPMS.toLowerCase().includes(q) ||
        cTipo.toLowerCase().includes(q) ||
        cCiclo.toLowerCase().includes(q) ||
        cProd.toLowerCase().includes(q);

      const matchesCultura = filterCultura === 'TODAS' || cCultura === filterCultura;
      const matchesTipo = filterTipo === 'TODOS' || cTipo === filterTipo;

      return matchesSearch && matchesCultura && matchesTipo;
    });
  }, [unidadeItems, searchQuery, filterCultura, filterTipo]);

  // Unique lists for filter dropdowns & suggestions
  const uniqueCulturas = useMemo(() => {
    const list = Array.from(
      new Set([
        ...unidadeItems.map(i => cleanValue(i.cultura)),
        ...culturas.map(c => cleanValue(c.nome))
      ].filter(Boolean))
    ).sort();
    return list;
  }, [unidadeItems, culturas]);

  const uniqueTipos = useMemo(() => {
    const list = Array.from(
      new Set([
        ...unidadeItems.map(i => cleanValue(i.tipo)),
        ...culturas.map(c => cleanValue(c.tipo))
      ].filter(Boolean))
    ).sort();
    return list.length > 0 ? list : ['Cereais', 'Hortifruti'];
  }, [unidadeItems, culturas]);

  // Link Cultura with Tipo and Variedades
  const availableVariedadesForCultura = useMemo(() => {
    if (!formCultura) {
      return Array.from(new Set([...variedades.map(v => cleanValue(v.nome)), ...unidadeItems.map(i => cleanValue(i.variedade))].filter(Boolean))).sort();
    }
    const targetCultura = formCultura.trim().toLowerCase();
    const fromVariedades = variedades.filter(v => cleanValue(v.cultura).toLowerCase() === targetCultura).map(v => cleanValue(v.nome));
    const fromPMS = unidadeItems.filter(i => cleanValue(i.cultura).toLowerCase() === targetCultura).map(i => cleanValue(i.variedade));
    return Array.from(new Set([...fromVariedades, ...fromPMS].filter(Boolean))).sort();
  }, [formCultura, variedades, unidadeItems]);

  const handleCulturaChange = (culturaName: string) => {
    const cleanCultura = cleanValue(culturaName);
    setFormCultura(cleanCultura);
    
    // Auto-detect Tipo based on registered Culturas or existing PMS items
    const matchedCultura = culturas.find(c => cleanValue(c.nome).toLowerCase() === cleanCultura.toLowerCase());
    if (matchedCultura?.tipo && cleanValue(matchedCultura.tipo)) {
      setFormTipo(cleanValue(matchedCultura.tipo));
    } else {
      const matchedPms = items.find(i => cleanValue(i.cultura).toLowerCase() === cleanCultura.toLowerCase());
      if (matchedPms?.tipo && cleanValue(matchedPms.tipo)) {
        setFormTipo(cleanValue(matchedPms.tipo));
      }
    }
  };

  const handleVariedadeChange = (variedadeName: string) => {
    const cleanVar = cleanValue(variedadeName);
    setFormVariedade(cleanVar);

    // If Cultura is not set, try to auto-fill Cultura and Tipo from Variedades database
    if (!formCultura) {
      const matchedVariedade = variedades.find(v => cleanValue(v.nome).toLowerCase() === cleanVar.toLowerCase());
      if (matchedVariedade?.cultura && cleanValue(matchedVariedade.cultura)) {
        handleCulturaChange(matchedVariedade.cultura);
      } else {
        const matchedPms = items.find(i => cleanValue(i.variedade).toLowerCase() === cleanVar.toLowerCase());
        if (matchedPms?.cultura && cleanValue(matchedPms.cultura)) {
          handleCulturaChange(matchedPms.cultura);
        }
      }
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormCultura('');
    setFormVariedade('');
    setFormTipo('Cereais');
    setFormCicloDias('');
    setFormUnidadeVenda('Sacas');
    setFormMediaUtilizacaoSemente('');
    setFormProdutividade('');
    setFormUnidadeVenda2('sacas p/há');
    setFormPMS('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: PMSItem) => {
    setEditingItem(item);
    setFormCultura(cleanValue(item.cultura));
    setFormVariedade(cleanValue(item.variedade));
    setFormTipo(cleanValue(item.tipo) || 'Cereais');
    setFormCicloDias(cleanValue(item.cicloDias));
    setFormUnidadeVenda(cleanValue(item.unidadeVenda) || 'Sacas');
    setFormMediaUtilizacaoSemente(cleanValue(item.mediaUtilizacaoSemente));
    setFormProdutividade(cleanValue(item.produtividade));
    setFormUnidadeVenda2(cleanValue(item.unidadeVenda2) || 'sacas p/há');
    setFormPMS(cleanValue(item.pms));
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const cCultura = cleanValue(formCultura);
    const cVariedade = cleanValue(formVariedade);

    if (!cCultura) {
      showToast('Por favor, informe a Cultura.', 'warning');
      return;
    }
    if (!cVariedade) {
      showToast('Por favor, informe a Variedade.', 'warning');
      return;
    }

    const payload: PMSItem = {
      cultura: cCultura,
      variedade: cVariedade,
      tipo: cleanValue(formTipo) || 'Cereais',
      cicloDias: cleanValue(formCicloDias),
      unidadeVenda: cleanValue(formUnidadeVenda),
      mediaUtilizacaoSemente: cleanValue(formMediaUtilizacaoSemente),
      produtividade: cleanValue(formProdutividade),
      unidadeVenda2: cleanValue(formUnidadeVenda2),
      pms: cleanValue(formPMS),
      unidade: selectedUnidade
    };

    // If creating a new item, check if there's already an item with the same cultura + variedade to avoid accidental duplication
    if (!editingItem?.id) {
      const existing = items.find(
        i =>
          cleanValue(i.cultura).toLowerCase() === payload.cultura.toLowerCase() &&
          cleanValue(i.variedade).toLowerCase() === payload.variedade.toLowerCase() &&
          (!i.unidade || i.unidade === selectedUnidade || selectedUnidade === 'TODAS')
      );
      if (existing?.id) {
        if (window.confirm(`Já existe um registro para a Cultura "${payload.cultura}" e Variedade "${payload.variedade}". Deseja atualizar o registro existente com os novos dados em vez de duplicar?`)) {
          await onSaveItem(payload, existing.id);
          setIsModalOpen(false);
          showToast('Registro existente atualizado com sucesso!', 'success');
          return;
        }
      }
    }

    await onSaveItem(payload, editingItem?.id);
    setIsModalOpen(false);
    showToast(editingItem ? 'Item PMS atualizado com sucesso!' : 'Item PMS adicionado com sucesso!', 'success');
  };

  const handleDelete = async (item: PMSItem) => {
    if (window.confirm(`Deseja realmente excluir o registro da variedade "${cleanValue(item.variedade)}" (${cleanValue(item.cultura)})?`)) {
      await onDeleteItem(item.id);
      showToast('Item excluído com sucesso!', 'info');
    }
  };

  // Process Excel / CSV File with Smart Deduplication / Upsert and Clean Values
  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { header: 1 });

        if (!jsonData || jsonData.length < 2) {
          showToast('A planilha enviada está vazia ou sem linhas de dados.', 'warning');
          return;
        }

        const headerRow = (jsonData[0] as any[]).map(h => cleanValue(h).toLowerCase());
        
        // Find column indices
        const findIndex = (keywords: string[]) => {
          return headerRow.findIndex(h => keywords.some(k => h.includes(k)));
        };

        const idxCultura = findIndex(['cultura']);
        const idxVariedade = findIndex(['variedade']);
        const idxTipo = findIndex(['tipo']);
        const idxCiclo = findIndex(['ciclo']);
        const idxUnidVenda = findIndex(['unidade de venda', 'unidade venda', 'unid. venda']);
        const idxMedia = findIndex(['média utilização', 'media utilizacao', 'semente', 'utilização semente']);
        const idxProd = findIndex(['produtividade', 'prod']);
        
        // Look for second unidade de venda if available
        let idxUnidVenda2 = -1;
        headerRow.forEach((h, i) => {
          if (i !== idxUnidVenda && (h.includes('unidade') || h.includes('sacas p/há') || h.includes('sacas p/ha'))) {
            idxUnidVenda2 = i;
          }
        });

        const idxPMS = findIndex(['pms']);

        // Build a map of existing items in the database for instant matching
        const existingMap = new Map<string, PMSItem>();
        items.forEach(it => {
          const cult = cleanValue(it.cultura);
          const varName = cleanValue(it.variedade);
          if (cult && varName) {
            const key = `${cult.toLowerCase()}___${varName.toLowerCase()}`;
            existingMap.set(key, it);
          }
        });

        // Deduplicate rows inside the imported spreadsheet itself as well
        const parsedMap = new Map<string, ParsedImportItem>();

        for (let r = 1; r < jsonData.length; r++) {
          const row = jsonData[r] as any[];
          if (!row || row.length === 0) continue;

          const colCultura = cleanValue(idxCultura !== -1 ? row[idxCultura] : row[0]);
          const colVariedade = cleanValue(idxVariedade !== -1 ? row[idxVariedade] : row[1]);
          const colTipo = cleanValue(idxTipo !== -1 ? row[idxTipo] : row[2]);
          const colCiclo = cleanValue(idxCiclo !== -1 ? row[idxCiclo] : row[3]);
          const colUnidVenda = cleanValue(idxUnidVenda !== -1 ? row[idxUnidVenda] : row[4]);
          const colMedia = cleanValue(idxMedia !== -1 ? row[idxMedia] : row[5]);
          const colProd = cleanValue(idxProd !== -1 ? row[idxProd] : row[6]);
          const colUnidVenda2 = cleanValue(idxUnidVenda2 !== -1 ? row[idxUnidVenda2] : (row[7] || 'sacas p/há'));
          const colPMS = cleanValue(idxPMS !== -1 ? row[idxPMS] : row[8]);

          if (!colCultura && !colVariedade) continue;

          const normKey = `${colCultura.toLowerCase()}___${colVariedade.toLowerCase()}`;
          const existingItem = existingMap.get(normKey);

          // Infer tipo if empty
          let resolvedTipo = colTipo;
          if (!resolvedTipo) {
            if (existingItem?.tipo && cleanValue(existingItem.tipo)) {
              resolvedTipo = cleanValue(existingItem.tipo);
            } else {
              const matchedCultura = culturas.find(c => cleanValue(c.nome).toLowerCase() === colCultura.toLowerCase());
              resolvedTipo = cleanValue(matchedCultura?.tipo) || 'Cereais';
            }
          }

          const parsedItem: ParsedImportItem = {
            id: existingItem?.id, // If existing, retain the ID for update!
            cultura: colCultura,
            variedade: colVariedade,
            tipo: resolvedTipo || 'Cereais',
            cicloDias: colCiclo || cleanValue(existingItem?.cicloDias),
            unidadeVenda: colUnidVenda || cleanValue(existingItem?.unidadeVenda) || 'Sacas',
            mediaUtilizacaoSemente: colMedia || cleanValue(existingItem?.mediaUtilizacaoSemente),
            produtividade: colProd || cleanValue(existingItem?.produtividade),
            unidadeVenda2: colUnidVenda2 || cleanValue(existingItem?.unidadeVenda2) || 'sacas p/há',
            pms: colPMS || cleanValue(existingItem?.pms),
            unidade: selectedUnidade,
            isUpdate: !!existingItem,
            existingId: existingItem?.id,
            previousPms: cleanValue(existingItem?.pms),
            hasChanges: existingItem ? (
              cleanValue(existingItem.pms) !== colPMS ||
              cleanValue(existingItem.cicloDias) !== colCiclo ||
              cleanValue(existingItem.produtividade) !== colProd ||
              cleanValue(existingItem.tipo) !== resolvedTipo
            ) : true
          };

          parsedMap.set(normKey, parsedItem);
        }

        const parsedItems = Array.from(parsedMap.values());

        if (parsedItems.length === 0) {
          showToast('Nenhum registro válido foi encontrado na planilha.', 'warning');
          return;
        }

        setImportedPreview(parsedItems);
        setIsImportModalOpen(true);
        const updatesCount = parsedItems.filter(i => i.isUpdate).length;
        const newCount = parsedItems.filter(i => !i.isUpdate).length;
        showToast(`Planilha analisada: ${newCount} novos registros e ${updatesCount} atualizações (sem duplicados).`, 'info');
      } catch (err) {
        console.error(err);
        showToast('Erro ao ler a planilha. Verifique se o arquivo é um .xlsx, .xls ou .csv válido.', 'warning');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = async () => {
    if (importedPreview.length === 0) return;
    setIsImporting(true);
    try {
      // Ensure all fields in batch are clean without any undefined string
      const sanitizedBatch = importedPreview.map(item => ({
        ...item,
        cultura: cleanValue(item.cultura),
        variedade: cleanValue(item.variedade),
        tipo: cleanValue(item.tipo) || 'Cereais',
        cicloDias: cleanValue(item.cicloDias),
        unidadeVenda: cleanValue(item.unidadeVenda),
        mediaUtilizacaoSemente: cleanValue(item.mediaUtilizacaoSemente),
        produtividade: cleanValue(item.produtividade),
        unidadeVenda2: cleanValue(item.unidadeVenda2),
        pms: cleanValue(item.pms),
        unidade: selectedUnidade
      }));

      await onImportBatch(sanitizedBatch);
      setIsImportModalOpen(false);
      const updatesCount = importedPreview.filter(i => i.isUpdate).length;
      const newCount = importedPreview.filter(i => !i.isUpdate).length;
      setImportedPreview([]);
      showToast(`Sucesso! ${newCount} novos itens inseridos e ${updatesCount} itens existentes atualizados.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar os registros importados.', 'warning');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = filteredItems.map(item => ({
      'Cultura': cleanValue(item.cultura),
      'Variedade': cleanValue(item.variedade),
      'Tipo': cleanValue(item.tipo),
      'Ciclo em Dias': cleanValue(item.cicloDias),
      'Unidade de venda': cleanValue(item.unidadeVenda),
      'Média Utilização Semente': cleanValue(item.mediaUtilizacaoSemente),
      'Produtividade': cleanValue(item.produtividade),
      'Unidade de Venda': cleanValue(item.unidadeVenda2),
      'PMS': cleanValue(item.pms)
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PMS');
    XLSX.writeFile(workbook, `PMS_${selectedUnidade}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('Planilha Excel exportada com sucesso! Sem campos undefined.', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const newCountInPreview = importedPreview.filter(i => !i.isUpdate).length;
  const updateCountInPreview = importedPreview.filter(i => i.isUpdate).length;

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #d0d7de', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      {/* Top Header Bar - Compact & Professional */}
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid #d0d7de',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '4px',
            backgroundColor: '#107c41',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px',
            fontWeight: 700
          }}>
            <i className="fa-solid fa-file-excel"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>
                Tabela PMS
              </h2>
              <span style={{
                backgroundColor: '#e2e8f0',
                color: '#334155',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 600
              }}>
                {filteredItems.length} registros
              </span>
              <span style={{
                backgroundColor: '#dcfce7',
                color: '#166534',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: 600,
                border: '1px solid #bbf7d0'
              }}>
                <i className="fa-solid fa-link" style={{ marginRight: '3px' }}></i> Variedades Vinculadas a Culturas
              </span>
            </div>
            <p style={{ margin: '1px 0 0 0', fontSize: '11px', color: '#64748b' }}>
              Parâmetros técnicos: Cultura, Variedade, Tipo, Ciclo, Produtividade e PMS • Importação inteligente sem duplicação
            </p>
          </div>
        </div>

        {/* Action Buttons - Compact */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={handleOpenAddModal}
            style={{
              backgroundColor: '#0078d4',
              color: '#ffffff',
              border: 'none',
              borderRadius: '3px',
              padding: '5px 11px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
            }}
          >
            <i className="fa-solid fa-plus"></i> Novo Item
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processFile(e.target.files[0]);
                e.target.value = '';
              }
            }}
            accept=".xlsx, .xls, .csv"
            style={{ display: 'none' }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Importar planilha do Excel (.xlsx, .xls ou .csv) com proteção anti-duplicação"
            style={{
              backgroundColor: '#107c41',
              color: '#ffffff',
              border: 'none',
              borderRadius: '3px',
              padding: '5px 11px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
            }}
          >
            <i className="fa-solid fa-file-import"></i> Importar Excel
          </button>

          <button
            onClick={handleExportExcel}
            title="Exportar para Excel (para preencher PMS ou novos dados e re-importar)"
            style={{
              backgroundColor: '#ffffff',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '3px',
              padding: '5px 10px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <i className="fa-solid fa-file-export"></i> Exportar
          </button>

          <button
            onClick={handlePrint}
            style={{
              backgroundColor: '#ffffff',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '3px',
              padding: '5px 9px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <i className="fa-solid fa-print"></i> Imprimir
          </button>
        </div>
      </div>

      {/* Filter and Search Bar - Compact */}
      <div style={{
        padding: '8px 16px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 300px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{
              position: 'absolute',
              left: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              fontSize: '11px'
            }}></i>
            <input
              type="text"
              placeholder="Filtrar por cultura, variedade, PMS, ciclo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '4px 8px 4px 26px',
                fontSize: '12px',
                border: '1px solid #cbd5e1',
                borderRadius: '3px',
                outline: 'none',
                backgroundColor: '#f8fafc'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  fontSize: '11px'
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Cultura:</label>
            <select
              value={filterCultura}
              onChange={(e) => setFilterCultura(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                border: '1px solid #cbd5e1',
                borderRadius: '3px',
                backgroundColor: '#ffffff',
                color: '#1e293b'
              }}
            >
              <option value="TODAS">Todas as Culturas</option>
              {uniqueCulturas.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Tipo:</label>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                border: '1px solid #cbd5e1',
                borderRadius: '3px',
                backgroundColor: '#ffffff',
                color: '#1e293b'
              }}
            >
              <option value="TODOS">Todos os Tipos</option>
              {uniqueTipos.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: '#64748b' }}>
          Mostrando <strong>{filteredItems.length}</strong> de <strong>{unidadeItems.length}</strong> variedades
        </div>
      </div>

      {/* Table Container - Compact Grid View (Blank when empty, zero undefined) */}
      <div style={{ overflowX: 'auto', maxHeight: '620px' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '12px',
          textAlign: 'left',
          tableLayout: 'auto'
        }}>
          <thead>
            <tr style={{
              backgroundColor: '#5ea244',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
              borderBottom: '2px solid #488234',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <th style={{ padding: '6px 8px', borderRight: '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>
                Cultura <i className="fa-solid fa-caret-down" style={{ fontSize: '9px', opacity: 0.8, marginLeft: '2px' }}></i>
              </th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>
                Variedade <i className="fa-solid fa-caret-down" style={{ fontSize: '9px', opacity: 0.8, marginLeft: '2px' }}></i>
              </th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>
                Tipo <i className="fa-solid fa-caret-down" style={{ fontSize: '9px', opacity: 0.8, marginLeft: '2px' }}></i>
              </th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                Ciclo em Dias
              </th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                Unidade de venda
              </th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                Média Utilização Semente
              </th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                Produtividade
              </th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                Unidade de Venda
              </th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>
                PMS <i className="fa-solid fa-caret-down" style={{ fontSize: '9px', opacity: 0.8, marginLeft: '2px' }}></i>
              </th>
              <th style={{ padding: '6px 8px', textAlign: 'center', width: '70px', whiteSpace: 'nowrap' }}>
                AÇÕES
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: '30px 16px', textAlign: 'center', color: '#64748b' }}>
                  <i className="fa-solid fa-file-excel" style={{ fontSize: '24px', color: '#cbd5e1', marginBottom: '6px', display: 'block' }}></i>
                  Nenhum registro PMS encontrado com os filtros atuais.
                </td>
              </tr>
            ) : (
              filteredItems.map((row, idx) => {
                const isEven = idx % 2 === 0;
                const bgColor = isEven ? '#d9e1f2' : '#ffffff';
                const cCultura = cleanValue(row.cultura);
                const cVariedade = cleanValue(row.variedade);
                const cTipo = cleanValue(row.tipo);
                const cCiclo = cleanValue(row.cicloDias);
                const cUnidVenda = cleanValue(row.unidadeVenda);
                const cMedia = cleanValue(row.mediaUtilizacaoSemente);
                const cProd = cleanValue(row.produtividade);
                const cUnidVenda2 = cleanValue(row.unidadeVenda2);
                const cPMS = cleanValue(row.pms);

                return (
                  <tr
                    key={row.id || `${cCultura}-${cVariedade}-${idx}`}
                    style={{
                      backgroundColor: bgColor,
                      borderBottom: '1px solid #c8d1e2',
                      color: '#000000',
                      height: '28px',
                      transition: 'background-color 0.1s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#b4c6e7'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = bgColor; }}
                  >
                    <td style={{ padding: '4px 8px', fontWeight: 600, borderRight: '1px solid #d0d7de', whiteSpace: 'nowrap' }}>
                      {cCultura}
                    </td>
                    <td style={{ padding: '4px 8px', fontWeight: 600, borderRight: '1px solid #d0d7de', whiteSpace: 'nowrap', color: '#1e3a8a' }}>
                      {cVariedade}
                    </td>
                    <td style={{ padding: '4px 8px', borderRight: '1px solid #d0d7de', whiteSpace: 'nowrap' }}>
                      {cTipo ? (
                        <span style={{
                          fontSize: '10px',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          backgroundColor: cTipo === 'Hortifruti' ? '#fef3c7' : '#e0f2fe',
                          color: cTipo === 'Hortifruti' ? '#92400e' : '#0369a1',
                          fontWeight: 600
                        }}>
                          {cTipo}
                        </span>
                      ) : null}
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'center', borderRight: '1px solid #d0d7de', fontVariantNumeric: 'tabular-nums' }}>
                      {cCiclo}
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'center', borderRight: '1px solid #d0d7de' }}>
                      {cUnidVenda}
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'center', borderRight: '1px solid #d0d7de', fontVariantNumeric: 'tabular-nums' }}>
                      {cMedia}
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 700, borderRight: '1px solid #d0d7de', fontVariantNumeric: 'tabular-nums' }}>
                      {cProd}
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'center', borderRight: '1px solid #d0d7de' }}>
                      {cUnidVenda2}
                    </td>
                    <td style={{ padding: '4px 8px', fontWeight: 600, color: cPMS ? '#0b5394' : '#64748b', borderRight: '1px solid #d0d7de', whiteSpace: 'nowrap' }}>
                      {cPMS}
                    </td>
                    <td style={{ padding: '2px 4px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleOpenEditModal(row)}
                          title="Editar registro"
                          style={{
                            background: '#ffffff',
                            border: '1px solid #94a3b8',
                            borderRadius: '2px',
                            padding: '2px 5px',
                            cursor: 'pointer',
                            color: '#1e293b',
                            fontSize: '10px'
                          }}
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
                          title="Excluir registro"
                          style={{
                            background: '#ffffff',
                            border: '1px solid #f87171',
                            borderRadius: '2px',
                            padding: '2px 5px',
                            cursor: 'pointer',
                            color: '#dc2626',
                            fontSize: '10px'
                          }}
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add / Edit with Linked Variety/Cultura/Tipo */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            width: '100%',
            maxWidth: '580px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            border: '1px solid #cbd5e1'
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-file-excel" style={{ color: '#107c41', fontSize: '16px' }}></i>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                  {editingItem ? 'Editar Parâmetros PMS' : 'Adicionar Variedade ao PMS'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '15px', cursor: 'pointer', color: '#64748b' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveModal} style={{ padding: '16px' }}>
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '4px',
                padding: '8px 12px',
                marginBottom: '12px',
                fontSize: '11px',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fa-solid fa-link" style={{ fontSize: '13px' }}></i>
                <span>As Variedades são vinculadas à Cultura e ao Tipo. Ao selecionar a Cultura, as variedades e o tipo são sugeridos automaticamente.</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* Cultura Input with Datalist */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                    Cultura *
                  </label>
                  <input
                    type="text"
                    required
                    list="list-culturas"
                    placeholder="Ex: Soja, Milheto, Feijão Carioca"
                    value={formCultura}
                    onChange={(e) => handleCulturaChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: '12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px'
                    }}
                  />
                  <datalist id="list-culturas">
                    {uniqueCulturas.map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                {/* Variedade Input with Datalist linked to Cultura */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                    Variedade *
                  </label>
                  <input
                    type="text"
                    required
                    list="list-variedades-linked"
                    placeholder="Ex: BRS 1502, CZ37B51, Neo 750"
                    value={formVariedade}
                    onChange={(e) => handleVariedadeChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: '12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px'
                    }}
                  />
                  <datalist id="list-variedades-linked">
                    {availableVariedadesForCultura.map(v => (
                      <option key={v} value={v} />
                    ))}
                  </datalist>
                </div>

                {/* Tipo */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                    Tipo
                  </label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: '12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="Cereais">Cereais</option>
                    <option value="Hortifruti">Hortifruti</option>
                  </select>
                </div>

                {/* Ciclo em Dias */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                    Ciclo em Dias
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 120, 90, 80"
                    value={formCicloDias}
                    onChange={(e) => setFormCicloDias(cleanValue(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: '12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px'
                    }}
                  />
                </div>

                {/* Unidade de Venda */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                    Unidade de Venda
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Sacas, Kg"
                    value={formUnidadeVenda}
                    onChange={(e) => setFormUnidadeVenda(cleanValue(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: '12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px'
                    }}
                  />
                </div>

                {/* Média Utilização Semente */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                    Média Utilização Semente
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 50"
                    value={formMediaUtilizacaoSemente}
                    onChange={(e) => setFormMediaUtilizacaoSemente(cleanValue(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: '12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px'
                    }}
                  />
                </div>

                {/* Produtividade */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                    Produtividade
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 70, 50, 60"
                    value={formProdutividade}
                    onChange={(e) => setFormProdutividade(cleanValue(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: '12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px'
                    }}
                  />
                </div>

                {/* Unidade de Venda 2 */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                    Unidade de Venda (Prod.)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: sacas p/há"
                    value={formUnidadeVenda2}
                    onChange={(e) => setFormUnidadeVenda2(cleanValue(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: '12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px'
                    }}
                  />
                </div>

                {/* PMS */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                    PMS (Peso de Mil Sementes / Especificação)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: CZ37B51: 171 Gramas, PMS Dama: 250 Grmas"
                    value={formPMS}
                    onChange={(e) => setFormPMS(cleanValue(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: '12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px'
                    }}
                  />
                </div>
              </div>

              <div style={{
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px'
              }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#107c41',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '3px',
                    padding: '6px 16px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview of Excel Import with Deduplication Report */}
      {isImportModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            width: '100%',
            maxWidth: '880px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
            border: '1px solid #cbd5e1'
          }}>
            {/* Header */}
            <div style={{
              padding: '12px 18px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fa-solid fa-file-excel" style={{ color: '#107c41', fontSize: '18px' }}></i>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                    Revisão de Importação Excel — Proteção Anti-Duplicação
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Os registros existentes serão atualizados em vez de duplicados.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#64748b' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Smart Summary Cards */}
            <div style={{
              padding: '10px 18px',
              backgroundColor: '#f1f5f9',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ color: '#64748b' }}>Total na Planilha:</span>
                <strong style={{ color: '#1e293b' }}>{importedPreview.length}</strong>
              </div>

              <div style={{
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#065f46'
              }}>
                <i className="fa-solid fa-plus-circle"></i>
                <span>Novos registros a cadastrar:</span>
                <strong>{newCountInPreview}</strong>
              </div>

              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#1e40af'
              }}>
                <i className="fa-solid fa-rotate"></i>
                <span>Existentes a atualizar (sem duplicação):</span>
                <strong>{updateCountInPreview}</strong>
              </div>
            </div>

            {/* Preview Table */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#5ea244', color: '#ffffff', textAlign: 'left', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '6px 8px', textAlign: 'center', width: '110px' }}>Status Ação</th>
                    <th style={{ padding: '6px 8px' }}>Cultura</th>
                    <th style={{ padding: '6px 8px' }}>Variedade</th>
                    <th style={{ padding: '6px 8px' }}>Tipo</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Ciclo</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Produtividade</th>
                    <th style={{ padding: '6px 8px' }}>PMS</th>
                  </tr>
                </thead>
                <tbody>
                  {importedPreview.map((row, i) => {
                    const cCultura = cleanValue(row.cultura);
                    const cVar = cleanValue(row.variedade);
                    const cTipo = cleanValue(row.tipo);
                    const cCiclo = cleanValue(row.cicloDias);
                    const cProd = cleanValue(row.produtividade);
                    const cPMS = cleanValue(row.pms);

                    return (
                      <tr
                        key={i}
                        style={{
                          borderBottom: '1px solid #e2e8f0',
                          backgroundColor: row.isUpdate ? '#f0f9ff' : (i % 2 === 0 ? '#f8fafc' : '#ffffff')
                        }}
                      >
                        <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                          {row.isUpdate ? (
                            <span style={{
                              backgroundColor: '#dbeafe',
                              color: '#1e40af',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              fontSize: '10px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              <i className="fa-solid fa-rotate"></i> Atualizar
                            </span>
                          ) : (
                            <span style={{
                              backgroundColor: '#dcfce7',
                              color: '#166534',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              fontSize: '10px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              <i className="fa-solid fa-plus"></i> Novo
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '5px 8px', fontWeight: 600 }}>{cCultura}</td>
                        <td style={{ padding: '5px 8px', fontWeight: 600, color: '#1e3a8a' }}>{cVar}</td>
                        <td style={{ padding: '5px 8px' }}>{cTipo}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'center' }}>{cCiclo}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'center' }}>{cProd}</td>
                        <td style={{ padding: '5px 8px', color: '#0b5394', fontWeight: 600 }}>
                          {cPMS}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 18px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                <i className="fa-solid fa-shield-halved" style={{ color: '#107c41', marginRight: '4px' }}></i>
                Registros com mesma Cultura e Variedade substituirão os dados antigos com segurança.
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={() => setIsImportModalOpen(false)}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={handleConfirmImport}
                  style={{
                    backgroundColor: '#107c41',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '3px',
                    padding: '6px 16px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: isImporting ? 0.7 : 1
                  }}
                >
                  {isImporting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Salvando...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check"></i> Confirmar Importação ({newCountInPreview} novos, {updateCountInPreview} atualizados)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
