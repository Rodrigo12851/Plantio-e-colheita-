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

export interface ImportPmsDiff {
  field: string;
  label: string;
  oldVal: string;
  newVal: string;
}

export interface ParsedImportItem extends PMSItem {
  importStatus: 'identical' | 'update' | 'new';
  existingId?: string;
  diffs: ImportPmsDiff[];
}

// Utility to ensure values are never 'undefined', 'null', or undefined - returns empty string ''
export const cleanValue = (val: any): string => {
  if (val === undefined || val === null) return '';
  const s = String(val).trim();
  if (s.toLowerCase() === 'undefined' || s.toLowerCase() === 'null') return '';
  return s;
};

// Text normalizer for reliable accent-insensitive & whitespace-insensitive comparisons
export const normalizePmsText = (str: any): string => {
  if (str === undefined || str === null) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ' ');
};

// Deterministic unique ID generator for PMS items to prevent Firestore duplication
export const getPmsDocId = (cultura: string, variedade: string, unidade?: string): string => {
  const normC = normalizePmsText(cultura).replace(/[^a-z0-9]/g, '_');
  const normV = normalizePmsText(variedade).replace(/[^a-z0-9]/g, '_');
  const normU = (unidade && unidade !== 'TODAS') ? `_${normalizePmsText(unidade).replace(/[^a-z0-9]/g, '_')}` : '';
  return `pms_${normC}_${normV}${normU}`;
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
  const [previewFilterTab, setPreviewFilterTab] = useState<'ALL' | 'CHANGES' | 'IDENTICAL'>('ALL');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-deduplicate in-memory items by Cultura + Variedade to guarantee zero visual duplicates
  const deduplicatedItems = useMemo(() => {
    const map = new Map<string, PMSItem>();
    items.forEach(it => {
      const cult = normalizePmsText(it.cultura);
      const varName = normalizePmsText(it.variedade);
      const unid = (it.unidade || '').trim().toLowerCase();
      const key = `${cult}___${varName}___${unid}`;
      if (!cult && !varName) return;

      if (map.has(key)) {
        const existing = map.get(key)!;
        // Keep the one with more information (non-empty PMS, etc.)
        const hasMore = (cleanValue(it.pms) && !cleanValue(existing.pms)) ||
                        (cleanValue(it.produtividade) && !cleanValue(existing.produtividade));
        if (hasMore) {
          map.set(key, it);
        }
      } else {
        map.set(key, it);
      }
    });
    return Array.from(map.values());
  }, [items]);

  // Filter items by selected unidade and filters
  const unidadeItems = useMemo(() => {
    return deduplicatedItems.filter(item => !item.unidade || item.unidade === selectedUnidade || selectedUnidade === 'TODAS');
  }, [deduplicatedItems, selectedUnidade]);

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
    const targetCultura = normalizePmsText(formCultura);
    const fromVariedades = variedades.filter(v => normalizePmsText(v.cultura) === targetCultura).map(v => cleanValue(v.nome));
    const fromPMS = unidadeItems.filter(i => normalizePmsText(i.cultura) === targetCultura).map(i => cleanValue(i.variedade));
    return Array.from(new Set([...fromVariedades, ...fromPMS].filter(Boolean))).sort();
  }, [formCultura, variedades, unidadeItems]);

  const handleCulturaChange = (culturaName: string) => {
    const cleanCultura = cleanValue(culturaName);
    setFormCultura(cleanCultura);
    
    // Auto-detect Tipo based on registered Culturas or existing PMS items
    const matchedCultura = culturas.find(c => normalizePmsText(c.nome) === normalizePmsText(cleanCultura));
    if (matchedCultura?.tipo && cleanValue(matchedCultura.tipo)) {
      setFormTipo(cleanValue(matchedCultura.tipo));
    } else {
      const matchedPms = deduplicatedItems.find(i => normalizePmsText(i.cultura) === normalizePmsText(cleanCultura));
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
      const matchedVariedade = variedades.find(v => normalizePmsText(v.nome) === normalizePmsText(cleanVar));
      if (matchedVariedade?.cultura && cleanValue(matchedVariedade.cultura)) {
        handleCulturaChange(matchedVariedade.cultura);
      } else {
        const matchedPms = deduplicatedItems.find(i => normalizePmsText(i.variedade) === normalizePmsText(cleanVar));
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

    const docId = editingItem?.id || getPmsDocId(cCultura, cVariedade, selectedUnidade);

    const payload: PMSItem = {
      id: docId,
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

    // If creating a new item, check if an item with same Cultura+Variedade exists
    if (!editingItem?.id) {
      const existing = deduplicatedItems.find(
        i =>
          normalizePmsText(i.cultura) === normalizePmsText(payload.cultura) &&
          normalizePmsText(i.variedade) === normalizePmsText(payload.variedade) &&
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

    await onSaveItem(payload, docId);
    setIsModalOpen(false);
    showToast(editingItem ? 'Item PMS atualizado com sucesso!' : 'Item PMS cadastrado com sucesso!', 'success');
  };

  const handleDelete = async (item: PMSItem) => {
    if (window.confirm(`Deseja realmente excluir o registro da variedade "${cleanValue(item.variedade)}" (${cleanValue(item.cultura)})?`)) {
      await onDeleteItem(item.id);
      showToast('Item excluído com sucesso!', 'info');
    }
  };

  // Process Excel / CSV File with Thorough Line-by-Line Verification, Complete Field Checking & Anti-Duplication
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
        deduplicatedItems.forEach(it => {
          const cult = normalizePmsText(it.cultura);
          const varName = normalizePmsText(it.variedade);
          if (cult && varName) {
            const key = `${cult}___${varName}`;
            existingMap.set(key, it);
          }
        });

        // Deduplicate rows inside the imported spreadsheet itself
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

          const normKey = `${normalizePmsText(colCultura)}___${normalizePmsText(colVariedade)}`;
          const existingItem = existingMap.get(normKey);

          // Infer tipo if empty
          let resolvedTipo = colTipo;
          if (!resolvedTipo) {
            if (existingItem?.tipo && cleanValue(existingItem.tipo)) {
              resolvedTipo = cleanValue(existingItem.tipo);
            } else {
              const matchedCultura = culturas.find(c => normalizePmsText(c.nome) === normalizePmsText(colCultura));
              resolvedTipo = cleanValue(matchedCultura?.tipo) || 'Cereais';
            }
          }

          // Generate or retrieve deterministic document ID
          const targetDocId = existingItem?.id || getPmsDocId(colCultura, colVariedade, selectedUnidade);

          // LINE-BY-LINE AND FIELD-BY-FIELD COMPARISON
          const diffs: ImportPmsDiff[] = [];

          if (existingItem) {
            // Check Tipo
            const oldTipo = cleanValue(existingItem.tipo) || 'Cereais';
            const newTipo = resolvedTipo || 'Cereais';
            if (normalizePmsText(oldTipo) !== normalizePmsText(newTipo)) {
              diffs.push({ field: 'tipo', label: 'Tipo', oldVal: oldTipo, newVal: newTipo });
            }

            // Check Ciclo em Dias
            const oldCiclo = cleanValue(existingItem.cicloDias);
            const newCiclo = colCiclo;
            if (oldCiclo !== newCiclo && newCiclo !== '') {
              diffs.push({ field: 'cicloDias', label: 'Ciclo em Dias', oldVal: oldCiclo || '(vazio)', newVal: newCiclo });
            }

            // Check Unidade de Venda
            const oldUnidVenda = cleanValue(existingItem.unidadeVenda);
            const newUnidVenda = colUnidVenda;
            if (normalizePmsText(oldUnidVenda) !== normalizePmsText(newUnidVenda) && newUnidVenda !== '') {
              diffs.push({ field: 'unidadeVenda', label: 'Unidade de Venda', oldVal: oldUnidVenda || '(vazio)', newVal: newUnidVenda });
            }

            // Check Média Utilização Semente
            const oldMedia = cleanValue(existingItem.mediaUtilizacaoSemente);
            const newMedia = colMedia;
            if (oldMedia !== newMedia && newMedia !== '') {
              diffs.push({ field: 'mediaUtilizacaoSemente', label: 'Média Utiliz. Semente', oldVal: oldMedia || '(vazio)', newVal: newMedia });
            }

            // Check Produtividade
            const oldProd = cleanValue(existingItem.produtividade);
            const newProd = colProd;
            if (oldProd !== newProd && newProd !== '') {
              diffs.push({ field: 'produtividade', label: 'Produtividade', oldVal: oldProd || '(vazio)', newVal: newProd });
            }

            // Check Unidade de Venda 2
            const oldUnidVenda2 = cleanValue(existingItem.unidadeVenda2);
            const newUnidVenda2 = colUnidVenda2;
            if (normalizePmsText(oldUnidVenda2) !== normalizePmsText(newUnidVenda2) && newUnidVenda2 !== '') {
              diffs.push({ field: 'unidadeVenda2', label: 'Unidade Venda (2)', oldVal: oldUnidVenda2 || '(vazio)', newVal: newUnidVenda2 });
            }

            // Check PMS
            const oldPms = cleanValue(existingItem.pms);
            const newPms = colPMS;
            if (normalizePmsText(oldPms) !== normalizePmsText(newPms) && newPms !== '') {
              diffs.push({ field: 'pms', label: 'PMS', oldVal: oldPms || '(vazio)', newVal: newPms });
            }
          }

          let importStatus: 'identical' | 'update' | 'new' = 'new';
          if (existingItem) {
            if (diffs.length > 0) {
              importStatus = 'update';
            } else {
              importStatus = 'identical';
            }
          }

          const parsedItem: ParsedImportItem = {
            id: targetDocId,
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
            importStatus,
            existingId: existingItem?.id,
            diffs
          };

          parsedMap.set(normKey, parsedItem);
        }

        const parsedItems = Array.from(parsedMap.values());

        if (parsedItems.length === 0) {
          showToast('Nenhum registro válido foi encontrado na planilha.', 'warning');
          return;
        }

        setImportedPreview(parsedItems);
        setPreviewFilterTab('ALL');
        setIsImportModalOpen(true);

        const newCount = parsedItems.filter(i => i.importStatus === 'new').length;
        const updateCount = parsedItems.filter(i => i.importStatus === 'update').length;
        const identicalCount = parsedItems.filter(i => i.importStatus === 'identical').length;

        if (newCount === 0 && updateCount === 0) {
          showToast(`Verificação concluída: todos os ${identicalCount} registros da planilha já estão idênticos no sistema. Nenhum dado será duplicado.`, 'info');
        } else {
          showToast(`Linha por linha analisada: ${newCount} novos, ${updateCount} a atualizar, ${identicalCount} idênticos mantidos.`, 'info');
        }
      } catch (err) {
        console.error(err);
        showToast('Erro ao ler a planilha. Verifique se o arquivo é um .xlsx, .xls ou .csv válido.', 'warning');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Only saves items that have changed or are new - completely skips already identical items!
  const handleConfirmImport = async () => {
    // Filter strictly items that require saving (new items and updated items)
    const itemsToSave = importedPreview.filter(i => i.importStatus === 'new' || i.importStatus === 'update');

    if (itemsToSave.length === 0) {
      showToast('Todos os registros já estão idênticos no sistema. Nenhuma gravação necessária.', 'info');
      setIsImportModalOpen(false);
      return;
    }

    setIsImporting(true);
    try {
      const sanitizedBatch: PMSItem[] = itemsToSave.map(item => ({
        id: item.id || getPmsDocId(item.cultura, item.variedade, selectedUnidade),
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

      const newCount = itemsToSave.filter(i => i.importStatus === 'new').length;
      const updateCount = itemsToSave.filter(i => i.importStatus === 'update').length;
      const identicalSkipped = importedPreview.length - itemsToSave.length;

      setImportedPreview([]);
      showToast(`Importação segura: ${newCount} novos salvos, ${updateCount} atualizados. ${identicalSkipped} idênticos foram mantidos sem re-gravação duplicada.`, 'success');
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
    showToast('Planilha Excel exportada com sucesso! Linhas formatadas e sem campos vazios duplicados.', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const newCountInPreview = importedPreview.filter(i => i.importStatus === 'new').length;
  const updateCountInPreview = importedPreview.filter(i => i.importStatus === 'update').length;
  const identicalCountInPreview = importedPreview.filter(i => i.importStatus === 'identical').length;

  const visiblePreviewItems = useMemo(() => {
    if (previewFilterTab === 'CHANGES') {
      return importedPreview.filter(i => i.importStatus === 'new' || i.importStatus === 'update');
    }
    if (previewFilterTab === 'IDENTICAL') {
      return importedPreview.filter(i => i.importStatus === 'identical');
    }
    return importedPreview;
  }, [importedPreview, previewFilterTab]);

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
                <i className="fa-solid fa-shield-check" style={{ marginRight: '3px' }}></i> Proteção Anti-Duplicação Ativa
              </span>
            </div>
            <p style={{ margin: '1px 0 0 0', fontSize: '11px', color: '#64748b' }}>
              Verificação linha por linha de Cultura, Variedade, Ciclo e PMS • Registros idênticos são mantidos sem duplicar
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
            title="Importar planilha do Excel com verificação linha por linha sem duplicar"
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
            title="Exportar para Excel (para consultar ou preencher dados e re-importar com segurança)"
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

      {/* Table Container - Compact Grid View */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
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

                {/* Variedade Input with Datalist of Available Variedades for Cultura */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                    Variedade *
                  </label>
                  <input
                    type="text"
                    required
                    list="list-variedades-linked"
                    placeholder="Ex: CZ37B51, ADR300"
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

                {/* Tipo Dropdown */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                    Tipo *
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
                    {uniqueTipos.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Ciclo em Dias */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                    Ciclo em Dias
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 120"
                    value={formCicloDias}
                    onChange={(e) => setFormCicloDias(e.target.value)}
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
                    Unidade de Venda (1)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Sacas, Kg, Ton"
                    value={formUnidadeVenda}
                    onChange={(e) => setFormUnidadeVenda(e.target.value)}
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
                    placeholder="Ex: 45 ou 2.5"
                    value={formMediaUtilizacaoSemente}
                    onChange={(e) => setFormMediaUtilizacaoSemente(e.target.value)}
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
                    placeholder="Ex: 70"
                    value={formProdutividade}
                    onChange={(e) => setFormProdutividade(e.target.value)}
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
                    Unidade de Venda (2)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: sacas p/há"
                    value={formUnidadeVenda2}
                    onChange={(e) => setFormUnidadeVenda2(e.target.value)}
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

              {/* PMS Description Input */}
              <div style={{ marginTop: '10px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                  PMS (Peso de Mil Sementes)
                </label>
                <input
                  type="text"
                  placeholder="Ex: CZ37B51: 171 Gramas ou 175g"
                  value={formPMS}
                  onChange={(e) => setFormPMS(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px'
                  }}
                />
              </div>

              {/* Action Buttons */}
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

      {/* Modal Preview of Excel Import with Line-by-Line Checking & Anti-Duplication Report */}
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
            maxWidth: '920px',
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
                    Revisão de Importação Linha por Linha — Proteção Anti-Duplicação
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    O sistema verificou todos os campos. Registros já cadastrados e inalterados não serão duplicados.
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
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '6px 10px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span style={{ color: '#64748b' }}>Total na Planilha:</span>
                <strong style={{ color: '#1e293b' }}>{importedPreview.length}</strong>
              </div>

              <div style={{
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '4px',
                padding: '6px 10px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: '#065f46'
              }}>
                <i className="fa-solid fa-plus-circle"></i>
                <span>Novos a cadastrar:</span>
                <strong>{newCountInPreview}</strong>
              </div>

              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '4px',
                padding: '6px 10px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: '#1e40af'
              }}>
                <i className="fa-solid fa-rotate"></i>
                <span>Existentes a atualizar:</span>
                <strong>{updateCountInPreview}</strong>
              </div>

              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '6px 10px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: '#475569'
              }}>
                <i className="fa-solid fa-check-double" style={{ color: '#64748b' }}></i>
                <span>Idênticos mantidos (não salvos novamente):</span>
                <strong>{identicalCountInPreview}</strong>
              </div>
            </div>

            {/* Sub-filter tabs */}
            <div style={{
              padding: '6px 18px',
              backgroundColor: '#ffffff',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              gap: '6px'
            }}>
              <button
                onClick={() => setPreviewFilterTab('ALL')}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  borderRadius: '3px',
                  border: previewFilterTab === 'ALL' ? '1px solid #0078d4' : '1px solid #cbd5e1',
                  backgroundColor: previewFilterTab === 'ALL' ? '#eff6ff' : '#ffffff',
                  color: previewFilterTab === 'ALL' ? '#1d4ed8' : '#475569',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Todos ({importedPreview.length})
              </button>
              <button
                onClick={() => setPreviewFilterTab('CHANGES')}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  borderRadius: '3px',
                  border: previewFilterTab === 'CHANGES' ? '1px solid #16a34a' : '1px solid #cbd5e1',
                  backgroundColor: previewFilterTab === 'CHANGES' ? '#f0fdf4' : '#ffffff',
                  color: previewFilterTab === 'CHANGES' ? '#15803d' : '#475569',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Apenas Modificados e Novos ({newCountInPreview + updateCountInPreview})
              </button>
              <button
                onClick={() => setPreviewFilterTab('IDENTICAL')}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  borderRadius: '3px',
                  border: previewFilterTab === 'IDENTICAL' ? '1px solid #64748b' : '1px solid #cbd5e1',
                  backgroundColor: previewFilterTab === 'IDENTICAL' ? '#f1f5f9' : '#ffffff',
                  color: previewFilterTab === 'IDENTICAL' ? '#1e293b' : '#475569',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Idênticos / Sem Alterações ({identicalCountInPreview})
              </button>
            </div>

            {/* Preview Table */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#5ea244', color: '#ffffff', textAlign: 'left', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '6px 8px', textAlign: 'center', width: '130px' }}>Status da Verificação</th>
                    <th style={{ padding: '6px 8px' }}>Cultura</th>
                    <th style={{ padding: '6px 8px' }}>Variedade</th>
                    <th style={{ padding: '6px 8px' }}>Tipo</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Ciclo</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Produtividade</th>
                    <th style={{ padding: '6px 8px' }}>PMS</th>
                    <th style={{ padding: '6px 8px' }}>Alterações Detectadas</th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePreviewItems.map((row, i) => {
                    const cCultura = cleanValue(row.cultura);
                    const cVar = cleanValue(row.variedade);
                    const cTipo = cleanValue(row.tipo);
                    const cCiclo = cleanValue(row.cicloDias);
                    const cProd = cleanValue(row.produtividade);
                    const cPMS = cleanValue(row.pms);

                    const isIdentical = row.importStatus === 'identical';
                    const isUpdate = row.importStatus === 'update';
                    const isNew = row.importStatus === 'new';

                    return (
                      <tr
                        key={i}
                        style={{
                          borderBottom: '1px solid #e2e8f0',
                          backgroundColor: isUpdate ? '#f0f9ff' : isNew ? '#f0fdf4' : '#f8fafc',
                          opacity: isIdentical ? 0.75 : 1
                        }}
                      >
                        <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                          {isNew && (
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
                              <i className="fa-solid fa-plus"></i> Novo Registro
                            </span>
                          )}
                          {isUpdate && (
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
                          )}
                          {isIdentical && (
                            <span style={{
                              backgroundColor: '#e2e8f0',
                              color: '#475569',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              fontSize: '10px',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              <i className="fa-solid fa-check"></i> Idêntico (Mantido)
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
                        <td style={{ padding: '5px 8px', fontSize: '10px' }}>
                          {isIdentical && <span style={{ color: '#64748b' }}>Informações 100% idênticas no banco</span>}
                          {isNew && <span style={{ color: '#166534', fontWeight: 600 }}>Variedade nova cadastrada</span>}
                          {isUpdate && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              {row.diffs.map((d, dIdx) => (
                                <span key={dIdx} style={{ color: '#1e40af' }}>
                                  <strong>{d.label}:</strong> {d.oldVal || '∅'} ➔ <strong>{d.newVal}</strong>
                                </span>
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
                Apenas <strong>{newCountInPreview + updateCountInPreview}</strong> registros modificados/novos serão gravados. <strong>{identicalCountInPreview}</strong> idênticos serão preservados sem duplicar.
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
                    backgroundColor: (newCountInPreview + updateCountInPreview === 0) ? '#64748b' : '#107c41',
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
                  ) : newCountInPreview + updateCountInPreview === 0 ? (
                    <>
                      <i className="fa-solid fa-check"></i> Tudo Idêntico (Nenhum dado novo a salvar)
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
