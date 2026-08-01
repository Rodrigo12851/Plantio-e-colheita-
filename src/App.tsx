import React, { useState, useEffect } from 'react';
import {
  subscribeToCollection,
  saveDocument,
  removeDocument,
  COLLECTIONS,
  CollectionKey
} from './lib/firebase';

// Data structures
export type SortMode = 'code_asc' | 'code_desc' | 'alpha_asc' | 'alpha_desc';

interface ColheitaItem {
  id?: string;
  data: string;
  empresa?: string;
  cultura: string;
  os: string;
  fazenda: string;
  pivo: string;
  gleba: string;
  variedade: string;
  haDia: string;
  haRestante?: string;
  qtdColhido?: string;
  caixasCortadas?: string;
  caixaBinBag?: string;
  glebasFinalizada?: string;
  mediaHa?: string;
  mes?: string;
  ano?: string;
  haGeral?: string;
  unidade?: string;
}

interface PlantioItem {
  id?: string;
  data: string;
  empresa: string;
  cultura: string;
  os: string;
  fazenda: string;
  pivo: string;
  gleba: string;
  variedade: string;
  haDia: string;
  haRestante?: string;
  glebasFinalizada?: string;
  mediaHa?: string;
  ano: string;
  haGeral?: string;
  unidade?: string;
}

interface SimpleItem {
  id?: string;
  codigo: string;
  nome: string;
  tipo?: 'Hortifruti' | 'Cereais';
  unidade?: string;
}

interface VariedadeItem {
  id?: string;
  codigo: string;
  nome: string;
  cultura: string;
  unidade?: string;
}

interface ColaboradorItem {
  id?: string;
  codigo: string;
  nome: string;
  apontador?: string;
  local?: string;
  status?: string;
  abreviacao?: string;
  unidade?: string;
}

interface MotoristaItem {
  id?: string;
  codigo: string;
  nome: string;
  abreviacao: string;
  unidade?: string;
}

interface OnibusItem {
  id?: string;
  codigo: string;
  nome: string;
  cor: string;
  motorista: string;
  local?: string;
  cooperado?: string;
  unidade?: string;
}

type MainCategoryKey = 'colheita' | 'plantio' | 'empresas' | 'anos' | 'variedades' | 'pivos' | 'glebas' | 'fazendas' | 'culturas' | 'colaboradores' | 'motoristas' | 'onibus';
export type AmarracaoCategory = 'cultura' | 'pivo' | 'gleba' | 'variedade' | 'ano' | 'geral';

export interface AmarracaoItem {
  id?: string;
  codigoMarca?: string;
  categoria: AmarracaoCategory;
  titulo: string;
  origem: string;
  destino: string;
  status: 'Ativo' | 'Inativo';
  hectares?: string;
  observacao?: string;
  unidade?: string;
}

type PageKey = MainCategoryKey | 'lixeira' | 'amarracoes';

export interface TrashItem {
  id?: string;
  category: MainCategoryKey;
  categoryName: string;
  itemData: any;
  deletedAt: string;
}

export function formatPlacaBus(val: string): string {
  if (!val) return '';
  const raw = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 7);
  if (raw.length > 3) {
    return `${raw.slice(0, 3)}-${raw.slice(3)}`;
  }
  return raw;
}

export function isValidPlacaBus(val: string): boolean {
  if (!val) return false;
  const clean = val.trim().toUpperCase();
  const regexTradicional = /^[A-Z]{3}-[0-9]{4}$/;
  const regexMercosul = /^[A-Z]{3}-[0-9][A-Z][0-9]{2}$/;
  return regexTradicional.test(clean) || regexMercosul.test(clean);
}

export function sanitizeHectaresInput(val: string): string {
  if (!val) return '';
  let clean = val.replace(/\./g, ',').replace(/[^0-9,]/g, '');
  const parts = clean.split(',');
  if (parts.length > 2) {
    clean = parts[0] + ',' + parts.slice(1).join('');
  }
  return clean;
}

const mainCategories: { key: MainCategoryKey; label: string }[] = [
  { key: 'plantio', label: 'BdPlantio' },
  { key: 'colheita', label: 'BdColheita' },
  { key: 'empresas', label: 'Cadastro_Empresas' },
  { key: 'anos', label: 'Cadastro_Anos' },
  { key: 'fazendas', label: 'Cadastro_Fazendas' },
  { key: 'pivos', label: 'Cadastro_Pivos' },
  { key: 'glebas', label: 'Cadastro_Glebas' },
  { key: 'variedades', label: 'Cadastro_Variedades' },
  { key: 'culturas', label: 'Cadastro_Culturas' },
  { key: 'colaboradores', label: 'Cadastro_Colaboradores' },
  { key: 'onibus', label: 'Cadastro_Onibus' },
  { key: 'motoristas', label: 'Cadastro_Motoristas' }
];

const DEFAULT_COLHEITA: ColheitaItem[] = [
  { data: '06/04/26', empresa: 'Agro', cultura: 'milheto', os: 'OS-101', fazenda: 'FAZENDA FRONTEIRA', pivo: 'Sequeiro', gleba: 'C-08', variedade: 'BRS 1502', haDia: '14,50 ha', haGeral: '31,88 ha', haRestante: '17,38 ha', qtdColhido: '250', glebasFinalizada: 'Não', mediaHa: '17,24 /ha', mes: 'Abril', ano: '2026', caixaBinBag: 'Caixas', caixasCortadas: '250', unidade: 'Cristalina' },
  { data: '28/03/26', empresa: 'Agro', cultura: 'Cenoura', os: 'OS-102', fazenda: 'Fazenda Sul', pivo: 'Pivô 01', gleba: 'Gleba A', variedade: 'Variedade A', haDia: '5,00 ha', haGeral: '15,00 ha', haRestante: '10,00 ha', qtdColhido: '120', glebasFinalizada: 'Não', mediaHa: '24,00 /ha', mes: 'Março', ano: '2026', caixaBinBag: 'Bin', caixasCortadas: '120', unidade: 'Cristalina' }
];

const DEFAULT_PLANTIO: PlantioItem[] = [
  { data: '05/04/26', empresa: 'Agro', cultura: 'milheto', os: 'OS-101', fazenda: 'FAZENDA FRONTEIRA', pivo: 'Sequeiro', gleba: 'C-08', variedade: 'BRS 1502', haDia: '31.88 ha', haRestante: '0.00 ha', glebasFinalizada: 'Sim', mediaHa: '31.88 ha/dia', ano: '2026', unidade: 'Cristalina' },
  { data: '20/03/26', empresa: 'Agro', cultura: 'Cenoura', os: 'OS-102', fazenda: 'Fazenda Sul', pivo: 'Pivô 01', gleba: 'Gleba A', variedade: 'Variedade A', haDia: '15.00 ha', haRestante: '5.00 ha', glebasFinalizada: 'Não', mediaHa: '12.50 ha/dia', ano: '2026', unidade: 'Cristalina' }
];

const DEFAULT_CULTURAS: SimpleItem[] = [
  { codigo: '1', nome: 'Cenoura', unidade: 'Cristalina' },
  { codigo: '2', nome: 'Alho', unidade: 'Cristalina' },
  { codigo: '3', nome: 'Batata', unidade: 'Cristalina' },
  { codigo: '4', nome: 'Cebola', unidade: 'Cristalina' }
];

const DEFAULT_VARIEDADES: VariedadeItem[] = [
  { codigo: '1', nome: 'Variedade A', cultura: 'Cenoura', unidade: 'Cristalina' },
  { codigo: '2', nome: 'Brasília', cultura: 'Cenoura', unidade: 'Cristalina' },
  { codigo: '3', nome: 'Supreme', cultura: 'Cenoura', unidade: 'Cristalina' },
  { codigo: '4', nome: 'Variedade B', cultura: 'Alho', unidade: 'Cristalina' },
  { codigo: '5', nome: 'Ito', cultura: 'Alho', unidade: 'Cristalina' },
  { codigo: '6', nome: 'Roxo Pérola', cultura: 'Alho', unidade: 'Cristalina' },
  { codigo: '7', nome: 'Ágata', cultura: 'Batata', unidade: 'Cristalina' },
  { codigo: '8', nome: 'Asterix', cultura: 'Batata', unidade: 'Cristalina' },
  { codigo: '9', nome: 'Alfa', cultura: 'Cebola', unidade: 'Cristalina' },
  { codigo: '10', nome: 'LEC20EOPG', cultura: 'Milho Semente Fêmea', unidade: 'Cristalina' }
];

const DEFAULT_PIVOS: SimpleItem[] = [
  { codigo: '1', nome: 'Pivô 01', unidade: 'Cristalina' },
  { codigo: '2', nome: 'Pivô 02', unidade: 'Cristalina' }
];

const DEFAULT_GLEBAS: SimpleItem[] = [
  { codigo: '1', nome: 'Gleba A', unidade: 'Cristalina' },
  { codigo: '2', nome: 'Gleba B', unidade: 'Cristalina' }
];

const DEFAULT_FAZENDAS: SimpleItem[] = [
  { codigo: '1', nome: 'Fazenda Sul', unidade: 'Cristalina' },
  { codigo: '2', nome: 'Fazenda Norte', unidade: 'Cristalina' }
];

const DEFAULT_EMPRESAS: SimpleItem[] = [
  { codigo: '1', nome: 'Agro', unidade: 'Cristalina' },
  { codigo: '2', nome: 'Fazenda Modelo', unidade: 'Cristalina' }
];

const DEFAULT_ANOS: SimpleItem[] = [
  { codigo: '1', nome: '2025', unidade: 'Cristalina' },
  { codigo: '2', nome: '2026', unidade: 'Cristalina' },
  { codigo: '3', nome: '2027', unidade: 'Cristalina' }
];

const DEFAULT_COLABORADORES: ColaboradorItem[] = [
  { codigo: '101', nome: 'João Carlos Silva', apontador: 'Carlos Eduardo', local: 'FAZENDA FRONTEIRA', status: 'Ativo', abreviacao: 'J. Silva', unidade: 'Cristalina' },
  { codigo: '102', nome: 'Maria Eduarda Oliveira', apontador: 'Ana Paula', local: 'FAZENDA SÃO BENTO', status: 'Ativo', abreviacao: 'M. Oliveira', unidade: 'Cristalina' },
  { codigo: '103', nome: 'Carlos Eduardo Santos', apontador: 'Carlos Eduardo', local: 'FAZENDA SUL', status: 'Inativo', abreviacao: 'C. Santos', unidade: 'Cristalina' }
];

const DEFAULT_MOTORISTAS: MotoristaItem[] = [
  { codigo: '201', nome: 'Antônio Ferreira Lima', abreviacao: 'A. Lima', unidade: 'Cristalina' },
  { codigo: '202', nome: 'Roberto Alves Souza', abreviacao: 'R. Souza', unidade: 'Cristalina' }
];

const DEFAULT_ONIBUS: OnibusItem[] = [
  { codigo: '501', nome: 'GMJ-5F34', cor: 'Branco', motorista: 'Antônio Ferreira Lima (A. Lima)', local: 'COOPERATIVA AGRO', cooperado: 'Sim', unidade: 'Cristalina' },
  { codigo: '502', nome: 'GMJ-5634', cor: 'Amarelo', motorista: 'Roberto Alves Souza (R. Souza)', local: 'FAZENDA SÃO BENTO', cooperado: 'Não', unidade: 'Cristalina' }
];

const DEFAULT_AMARRACOES: AmarracaoItem[] = [
  {
    codigoMarca: '#AMR-821292',
    categoria: 'geral',
    titulo: 'Cultura: Cenoura ➔ Fazenda: Fazenda Sul ➔ Pivô: Pivô 01 ➔ Gleba: Gleba A ➔ Variedade: Variedade A',
    origem: 'Cenoura',
    destino: 'Variedade A',
    status: 'Ativo',
    observacao: 'Amarração completa de área',
    unidade: 'Cristalina'
  }
];

const DEFAULT_UNIDADES = [
  { nome: 'Cristalina' },
  { nome: 'São Gabriel' },
  { nome: 'Uberlândia' }
];

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>('plantio');
  const [lixeiraCategory, setLixeiraCategory] = useState<MainCategoryKey>('plantio');

  const [trashData, setTrashData] = useState<TrashItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGridEditing, setIsGridEditing] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Toast notification state with Undo support
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'warning';
    onUndo?: () => void;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success', onUndo?: () => void) => {
    setToast({ message, type, onUndo });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, onUndo ? 6000 : 3500);
  };

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemDetails?: { label: string; value: string }[];
    confirmText: string;
    confirmStyle?: 'danger' | 'primary';
    isTrashMove?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Column filters state per page and column index
  const [columnFilters, setColumnFilters] = useState<Record<string, Record<number, string[]>>>({});
  
  // Filter popover state
  const [popoverState, setPopoverState] = useState<{
    colIndex: number;
    top: number;
    left: number;
    options: string[];
    selected: string[];
  } | null>(null);

  // Unidade de Produção state (Cristalina, São Gabriel, Uberlândia, etc.)
  const [unidadesList, setUnidadesList] = useState<string[]>(['Cristalina', 'São Gabriel', 'Uberlândia']);
  const [selectedUnidade, setSelectedUnidade] = useState<string>('Cristalina');
  const [showUnidadeModal, setShowUnidadeModal] = useState<boolean>(false);
  const [newUnidadeInput, setNewUnidadeInput] = useState<string>('');

  useEffect(() => {
    setSelectedEmpresaForTie('');
    setSelectedAnoForTie('');
    setSelectedCulturaForTie('');
    setSelectedFazendaForTie('');
    setSelectedPivoForTie('');
    setSelectedGlebaForTie('');
    setSelectedVariedadeForTie('');
    setTieHectares('');
    setTieObservacao('');
  }, [selectedUnidade]);

  const getUnitInitials = (unitName: string): string => {
    if (!unitName) return 'CC';
    if (unitName.toLowerCase().trim() === 'cristalina') return 'CC';
    const parts = unitName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return unitName.substring(0, 2).toUpperCase();
  };

  const isItemInSelectedUnidade = (item: { unidade?: string }) => {
    if (!item) return false;
    if (!item.unidade) {
      return selectedUnidade === 'Cristalina';
    }
    return item.unidade === selectedUnidade;
  };

  const handleAddUnidade = async () => {
    const name = newUnidadeInput.trim();
    if (!name) {
      showToast('Digite o nome da nova unidade.', 'warning');
      return;
    }
    if (unidadesList.some(u => u.toLowerCase() === name.toLowerCase())) {
      showToast(`A unidade "${name}" já está cadastrada.`, 'warning');
      return;
    }
    await saveDocument(COLLECTIONS.unidades, { nome: name });
    setSelectedUnidade(name);
    setNewUnidadeInput('');
    showToast(`Unidade "${name}" cadastrada e selecionada!`, 'success');
  };

  // Sorting state & helper functions
  const [sortMode, setSortMode] = useState<SortMode>('code_asc');

  const getSortedList = <T extends Record<string, any>>(list: T[], overrideMode?: SortMode): { item: T; originalIndex: number }[] => {
    if (!list) return [];
    const activeSortMode = overrideMode || sortMode;
    const mapped = list.map((item, originalIndex) => ({ item, originalIndex }));

    const parseNum = (val: any) => {
      if (val === undefined || val === null) return { isNum: false, numVal: 0, strVal: '' };
      const str = String(val).trim();
      const num = parseInt(str, 10);
      if (!isNaN(num) && /^\d+/.test(str)) {
        return { isNum: true, numVal: num, strVal: str };
      }
      return { isNum: false, numVal: 0, strVal: str };
    };

    mapped.sort((a, b) => {
      const itemA = a.item;
      const itemB = b.item;

      const codeA = itemA.codigo ?? itemA.codigoMarca ?? itemA.os ?? itemA.data ?? '';
      const codeB = itemB.codigo ?? itemB.codigoMarca ?? itemB.os ?? itemB.data ?? '';

      const nameA = itemA.nome ?? itemA.cultura ?? itemA.empresa ?? itemA.fazenda ?? itemA.nomeCompleto ?? itemA.placa ?? itemA.titulo ?? '';
      const nameB = itemB.nome ?? itemB.cultura ?? itemB.empresa ?? itemB.fazenda ?? itemB.nomeCompleto ?? itemB.placa ?? itemB.titulo ?? '';

      if (activeSortMode === 'code_asc') {
        const parsedA = parseNum(codeA);
        const parsedB = parseNum(codeB);

        if (parsedA.isNum && parsedB.isNum && parsedA.numVal !== parsedB.numVal) {
          return parsedA.numVal - parsedB.numVal;
        }
        if (codeA && codeB) {
          return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
        }
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
      }

      if (activeSortMode === 'code_desc') {
        const parsedA = parseNum(codeA);
        const parsedB = parseNum(codeB);

        if (parsedA.isNum && parsedB.isNum && parsedA.numVal !== parsedB.numVal) {
          return parsedB.numVal - parsedA.numVal;
        }
        if (codeA && codeB) {
          return codeB.localeCompare(codeA, undefined, { numeric: true, sensitivity: 'base' });
        }
        return nameB.localeCompare(nameA, undefined, { numeric: true, sensitivity: 'base' });
      }

      if (activeSortMode === 'alpha_asc') {
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
      }

      if (activeSortMode === 'alpha_desc') {
        return nameB.localeCompare(nameA, undefined, { numeric: true, sensitivity: 'base' });
      }

      return 0;
    });

    return mapped;
  };

  const getSortedItems = <T extends Record<string, any>>(list: T[], overrideMode?: SortMode): T[] => {
    return getSortedList(list, overrideMode).map(entry => entry.item);
  };

  const sortAlphanumeric = <T extends Record<string, any>>(items: T[]): T[] => {
    if (!items || items.length === 0) return [];
    return [...items].sort((a, b) => {
      const nameA = String(a.nome ?? a.codigo ?? a.titulo ?? '');
      const nameB = String(b.nome ?? b.codigo ?? b.titulo ?? '');
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });
  };

  const getCulturaType = (culturaName?: string): 'Hortifruti' | 'Cereais' | null => {
    if (!culturaName) return null;
    const cLower = culturaName.trim().toLowerCase();
    const matched = culturasData.find(c => isItemInSelectedUnidade(c) && c.nome.trim().toLowerCase() === cLower);
    if (matched?.tipo) return matched.tipo;
    if (cLower.includes('horti') || cLower.includes('tomate') || cLower.includes('cebola') || cLower.includes('batata') || cLower.includes('cenoura') || cLower.includes('alho')) {
      return 'Hortifruti';
    }
    if (cLower.includes('cereal') || cLower.includes('milho') || cLower.includes('soja') || cLower.includes('feijao') || cLower.includes('trigo') || cLower.includes('algodao')) {
      return 'Cereais';
    }
    return null;
  };

  const getGlebaCategory = (gleba: { codigo?: string; nome?: string; tipo?: string }): 'Hortifruti' | 'Cereais' | 'Ambos' => {
    if (gleba.tipo === 'Hortifruti' || gleba.tipo === 'Cereais') return gleba.tipo;
    const code = (gleba.codigo || '').trim();
    const name = (gleba.nome || '').trim();
    const full = `${code} ${name}`.trim();

    if (/^h|h-|\bh\d+/i.test(code) || /^h|h-|\bh\d+/i.test(name)) return 'Hortifruti';
    if (/^c|c-|\bc\d+/i.test(code) || /^c|c-|\bc\d+/i.test(name)) return 'Cereais';

    if (/^h/i.test(full)) return 'Hortifruti';
    if (/^c/i.test(full)) return 'Cereais';

    return 'Ambos';
  };

  const filterGlebasByCulturaType = <T extends { codigo?: string; nome?: string; tipo?: string }>(glebas: T[], culturaName?: string): T[] => {
    const cType = getCulturaType(culturaName);
    if (!cType) return glebas;
    return glebas.filter(g => {
      const cat = getGlebaCategory(g);
      return cat === cType || cat === 'Ambos';
    });
  };

  // Table dataset states with Firestore real-time sync
  const [colheitaData, setColheitaData] = useState<ColheitaItem[]>([]);
  const [plantioData, setPlantioData] = useState<PlantioItem[]>([]);
  const [culturasData, setCulturasData] = useState<SimpleItem[]>([]);
  const [variedadesData, setVariedadesData] = useState<VariedadeItem[]>([]);
  const [pivosData, setPivosData] = useState<SimpleItem[]>([]);
  const [glebasData, setGlebasData] = useState<SimpleItem[]>([]);
  const [fazendasData, setFazendasData] = useState<SimpleItem[]>([]);
  const [empresasData, setEmpresasData] = useState<SimpleItem[]>([]);
  const [anosData, setAnosData] = useState<SimpleItem[]>([]);
  const [colaboradoresData, setColaboradoresData] = useState<ColaboradorItem[]>([]);
  const [motoristasData, setMotoristasData] = useState<MotoristaItem[]>([]);
  const [onibusData, setOnibusData] = useState<OnibusItem[]>([]);
  const [amarracoesData, setAmarracoesData] = useState<AmarracaoItem[]>([]);

  // Subscribe to Firebase Firestore collections in real-time
  useEffect(() => {
    const unsubColheita = subscribeToCollection<ColheitaItem>(COLLECTIONS.colheita, setColheitaData, DEFAULT_COLHEITA);
    const unsubPlantio = subscribeToCollection<PlantioItem>(COLLECTIONS.plantio, setPlantioData, DEFAULT_PLANTIO);
    const unsubCulturas = subscribeToCollection<SimpleItem>(COLLECTIONS.culturas, setCulturasData, DEFAULT_CULTURAS);
    const unsubVariedades = subscribeToCollection<VariedadeItem>(COLLECTIONS.variedades, setVariedadesData, DEFAULT_VARIEDADES);
    const unsubPivos = subscribeToCollection<SimpleItem>(COLLECTIONS.pivos, setPivosData, DEFAULT_PIVOS);
    const unsubGlebas = subscribeToCollection<SimpleItem>(COLLECTIONS.glebas, setGlebasData, DEFAULT_GLEBAS);
    const unsubFazendas = subscribeToCollection<SimpleItem>(COLLECTIONS.fazendas, setFazendasData, DEFAULT_FAZENDAS);
    const unsubEmpresas = subscribeToCollection<SimpleItem>(COLLECTIONS.empresas, setEmpresasData, DEFAULT_EMPRESAS);
    const unsubAnos = subscribeToCollection<SimpleItem>(COLLECTIONS.anos, setAnosData, DEFAULT_ANOS);
    const unsubColaboradores = subscribeToCollection<ColaboradorItem>(COLLECTIONS.colaboradores, setColaboradoresData, DEFAULT_COLABORADORES);
    const unsubMotoristas = subscribeToCollection<MotoristaItem>(COLLECTIONS.motoristas, setMotoristasData, DEFAULT_MOTORISTAS);
    const unsubOnibus = subscribeToCollection<OnibusItem>(COLLECTIONS.onibus, setOnibusData, DEFAULT_ONIBUS);
    const unsubAmarracoes = subscribeToCollection<AmarracaoItem>(COLLECTIONS.amarracoes, setAmarracoesData, DEFAULT_AMARRACOES);
    const unsubUnidades = subscribeToCollection<{ id?: string; nome: string }>(COLLECTIONS.unidades, (docs) => {
      if (docs.length > 0) {
        setUnidadesList(docs.map(d => d.nome));
      }
    }, DEFAULT_UNIDADES);
    const unsubTrash = subscribeToCollection<TrashItem>(COLLECTIONS.lixeira, setTrashData, []);

    return () => {
      unsubColheita();
      unsubPlantio();
      unsubCulturas();
      unsubVariedades();
      unsubPivos();
      unsubGlebas();
      unsubFazendas();
      unsubEmpresas();
      unsubAnos();
      unsubColaboradores();
      unsubMotoristas();
      unsubOnibus();
      unsubAmarracoes();
      unsubUnidades();
      unsubTrash();
    };
  }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Central de Marcações e Amarrações (Janela dos 6 Pontinhos) Modal Window
  const [isAmarracoesWindowOpen, setIsAmarracoesWindowOpen] = useState(false);
  const [activeSquareKey, setActiveSquareKey] = useState<'empresa' | 'ano' | 'cultura' | 'fazenda' | 'pivo' | 'gleba' | 'variedade' | 'geral'>('empresa');
  const [searchSquareQuery, setSearchSquareQuery] = useState('');
  const [newSquareItemName, setNewSquareItemName] = useState('');

  // Geral Tie Form State
  const [selectedEmpresaForTie, setSelectedEmpresaForTie] = useState('');
  const [selectedAnoForTie, setSelectedAnoForTie] = useState('');
  const [selectedCulturaForTie, setSelectedCulturaForTie] = useState('');
  const [selectedFazendaForTie, setSelectedFazendaForTie] = useState('');
  const [selectedPivoForTie, setSelectedPivoForTie] = useState('');
  const [selectedGlebaForTie, setSelectedGlebaForTie] = useState('');
  const [selectedVariedadeForTie, setSelectedVariedadeForTie] = useState('');
  const [tieHectares, setTieHectares] = useState('');
  const [tieObservacao, setTieObservacao] = useState('');

  // Helper to parse numeric hectares from a text string (e.g. "115,00 ha" -> 115)
  const parseHaValue = (valStr: string | undefined): number => {
    if (!valStr) return 0;
    const clean = valStr.replace(',', '.').replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  // Helpers to calculate already planted/harvested hectares and HA Restante
  const getAlreadyPlantedHectares = (pivoName?: string, glebaName?: string, fazendaName?: string, excludeIndex: number | null = null): number => {
    if (!plantioData || plantioData.length === 0) return 0;
    const gLower = (glebaName || '').trim().toLowerCase();
    const pLower = (pivoName || '').trim().toLowerCase();
    const fLower = (fazendaName || '').trim().toLowerCase();

    if (!gLower && !pLower && !fLower) return 0;

    let total = 0;
    plantioData.forEach((p, idx) => {
      if (excludeIndex !== null && idx === excludeIndex) return;
      const pGleb = (p.gleba || '').trim().toLowerCase();
      const pPiv = (p.pivo || '').trim().toLowerCase();
      const pFaz = (p.fazenda || '').trim().toLowerCase();

      const matchG = !gLower || pGleb === gLower || pGleb === '-';
      const matchP = !pLower || pPiv === pLower || pPiv === '-';
      const matchF = !fLower || pFaz === fLower;

      if (matchG && matchP && matchF) {
        total += parseHaValue(p.haDia || p.haGeral);
      }
    });
    return total;
  };

  const getAlreadyHarvestedHectares = (
    culturaName?: string,
    fazendaName?: string,
    pivoName?: string,
    glebaName?: string,
    variedadeName?: string,
    excludeIndex: number | null = null
  ): number => {
    if (!colheitaData || colheitaData.length === 0) return 0;
    const cLower = (culturaName || '').trim().toLowerCase();
    const fLower = (fazendaName || '').trim().toLowerCase();
    const pLower = (pivoName || '').trim().toLowerCase();
    const gLower = (glebaName || '').trim().toLowerCase();
    const vLower = (variedadeName || '').trim().toLowerCase();

    if (!cLower && !fLower && !pLower && !gLower) return 0;

    let total = 0;
    colheitaData.forEach((c, idx) => {
      if (excludeIndex !== null && idx === excludeIndex) return;
      const cCult = (c.cultura || '').trim().toLowerCase();
      const cFaz = (c.fazenda || '').trim().toLowerCase();
      const cPiv = (c.pivo || '').trim().toLowerCase();
      const cGleb = (c.gleba || '').trim().toLowerCase();
      const cVar = (c.variedade || '').trim().toLowerCase();

      const matchCult = !cLower || cCult === cLower;
      const matchFaz = !fLower || cFaz === fLower;
      const matchPiv = !pLower || pLower === '-' || cPiv === pLower || cPiv === '-';
      const matchGleb = !gLower || gLower === '-' || cGleb === gLower || cGleb === '-';
      const matchVar = !vLower || vLower === '-' || cVar === vLower || cVar === '-';

      if (matchCult && matchFaz && matchPiv && matchGleb && matchVar) {
        total += parseHaValue(c.haDia || c.haGeral);
      }
    });
    return total;
  };

  const calculateHaRestanteForPlantio = (
    haGeralStr: string | undefined,
    haDiaStr: string | undefined,
    pivoName?: string,
    glebaName?: string,
    fazendaName?: string,
    excludeIndex: number | null = null
  ): string => {
    const total = parseHaValue(haGeralStr);
    if (total <= 0) return '';
    const alreadyPlanted = getAlreadyPlantedHectares(pivoName, glebaName, fazendaName, excludeIndex);
    const dia = parseHaValue(haDiaStr);
    const restante = Math.max(0, total - alreadyPlanted - dia);
    return `${restante.toFixed(2).replace('.', ',')} ha`;
  };

  const calculateHaRestanteForColheita = (
    haGeralStr: string | undefined,
    haDiaStr: string | undefined,
    culturaName?: string,
    fazendaName?: string,
    pivoName?: string,
    glebaName?: string,
    variedadeName?: string,
    excludeIndex: number | null = null
  ): string => {
    const total = parseHaValue(haGeralStr);
    if (total <= 0) return '';
    const alreadyHarvested = getAlreadyHarvestedHectares(culturaName, fazendaName, pivoName, glebaName, variedadeName, excludeIndex);
    const dia = parseHaValue(haDiaStr);
    const restante = Math.max(0, total - alreadyHarvested - dia);
    return `${restante.toFixed(2).replace('.', ',')} ha`;
  };

  const calculateHaRestanteValue = (haGeralStr: string | undefined, haDiaStr: string | undefined): string => {
    if (!haGeralStr && !haDiaStr) return '';
    const total = parseHaValue(haGeralStr);
    const dia = parseHaValue(haDiaStr);
    if (total <= 0) return '';
    const restante = Math.max(0, total - dia);
    return `${restante.toFixed(2).replace('.', ',')} ha`;
  };

  const calculateMediaHaForColheita = (qtdColhidoStr: string | undefined, haDiaStr: string | undefined): string => {
    const qtd = parseHaValue(qtdColhidoStr);
    const haDia = parseHaValue(haDiaStr);
    if (qtd <= 0 || haDia <= 0) return '';
    const media = qtd / haDia;
    return `${media.toFixed(2).replace('.', ',')} /ha`;
  };

  // Helper to lookup full original total hectares bound in amarracoesData for a selected area
  const lookupHectaresForSelection = (pivoName?: string, glebaName?: string, fazendaName?: string): string => {
    if (!glebaName && !pivoName && !fazendaName) return '';
    const gLower = (glebaName || '').trim().toLowerCase();
    const pLower = (pivoName || '').trim().toLowerCase();
    const fLower = (fazendaName || '').trim().toLowerCase();

    let rawTieHa = '';
    const unitAmarracoes = amarracoesData.filter(isItemInSelectedUnidade);

    for (const tie of unitAmarracoes) {
      if (tie.hectares) {
        const fullText = `${tie.titulo || ''} ${tie.origem || ''} ${tie.destino || ''} ${tie.observacao || ''}`.toLowerCase();
        const matchGleba = !gLower || fullText.includes(gLower);
        const matchPivo = !pLower || fullText.includes(pLower);
        const matchFazenda = !fLower || fullText.includes(fLower);
        if (matchGleba && matchPivo && matchFazenda) {
          rawTieHa = tie.hectares;
          break;
        }
      }
    }

    if (!rawTieHa) {
      for (const tie of unitAmarracoes) {
        const fullText = `${tie.titulo || ''} ${tie.origem || ''} ${tie.destino || ''} ${tie.observacao || ''}`.toLowerCase();
        const matchGleba = gLower && fullText.includes(gLower);
        const matchPivo = pLower && fullText.includes(pLower);
        if (matchGleba || matchPivo) {
          const match = fullText.match(/(\d+([.,]\d+)?)\s*ha/i);
          if (match) {
            rawTieHa = `${match[1].replace('.', ',')} ha`;
            break;
          }
        }
      }
    }

    if (!rawTieHa) {
      if (gLower.includes('c5') || pLower.includes('11')) rawTieHa = '115,00 ha';
      else if (gLower.includes('gleba a') || pLower.includes('pivô 01')) rawTieHa = '15,00 ha';
      else if (gLower.includes('gleba b') || pLower.includes('pivô 02')) rawTieHa = '20,00 ha';
      else if (gLower.includes('c-08')) rawTieHa = '31,88 ha';
    }

    return rawTieHa;
  };

  // Cascading tie helper functions:
  const getLinkedPivosForFazenda = (fazendaName: string) => {
    const unitPivos = pivosData.filter(isItemInSelectedUnidade);
    const unitAmarracoes = amarracoesData.filter(isItemInSelectedUnidade);
    if (!fazendaName) return unitPivos;
    const fLower = fazendaName.trim().toLowerCase();
    const linkedPivoNames = new Set<string>();

    unitAmarracoes.forEach(tie => {
      const fullText = `${tie.titulo || ''} ${tie.origem || ''} ${tie.destino || ''} ${tie.observacao || ''}`.toLowerCase();
      if (fullText.includes(fLower)) {
        unitPivos.forEach(p => {
          if (fullText.includes(p.nome.trim().toLowerCase())) {
            linkedPivoNames.add(p.nome.trim().toLowerCase());
          }
        });
      }
    });

    if (linkedPivoNames.size === 0) return unitPivos;
    return unitPivos.filter(p => linkedPivoNames.has(p.nome.trim().toLowerCase()));
  };

  const getLinkedGlebasForPivo = (pivoName: string, fazendaName: string, culturaName?: string) => {
    let unitGlebas = glebasData.filter(isItemInSelectedUnidade);
    if (culturaName) {
      unitGlebas = filterGlebasByCulturaType(unitGlebas, culturaName);
    }
    const unitAmarracoes = amarracoesData.filter(isItemInSelectedUnidade);
    if (!pivoName && !fazendaName) return sortAlphanumeric(unitGlebas);
    const pLower = (pivoName || '').trim().toLowerCase();
    const fLower = (fazendaName || '').trim().toLowerCase();
    const linkedGlebaNames = new Set<string>();

    unitAmarracoes.forEach(tie => {
      const fullText = `${tie.titulo || ''} ${tie.origem || ''} ${tie.destino || ''} ${tie.observacao || ''}`.toLowerCase();
      const hasPivoMatch = pLower ? fullText.includes(pLower) : true;
      const hasFazendaMatch = fLower ? fullText.includes(fLower) : true;

      if (hasPivoMatch && hasFazendaMatch) {
        unitGlebas.forEach(g => {
          if (fullText.includes(g.nome.trim().toLowerCase())) {
            linkedGlebaNames.add(g.nome.trim().toLowerCase());
          }
        });
      }
    });

    if (linkedGlebaNames.size === 0) return sortAlphanumeric(unitGlebas);
    const result = unitGlebas.filter(g => linkedGlebaNames.has(g.nome.trim().toLowerCase()));
    return sortAlphanumeric(result);
  };

  // Helper to lookup full original planted hectares in plantioData for Colheita selection
  const lookupPlantedHectaresForSelection = (
    culturaName?: string,
    fazendaName?: string,
    pivoName?: string,
    glebaName?: string,
    variedadeName?: string
  ): string => {
    const unitPlantio = plantioData.filter(isItemInSelectedUnidade);
    if (!unitPlantio || unitPlantio.length === 0) return '';
    if (!culturaName && !fazendaName && !pivoName && !glebaName) return '';

    const cLower = (culturaName || '').trim().toLowerCase();
    const fLower = (fazendaName || '').trim().toLowerCase();
    const pLower = (pivoName || '').trim().toLowerCase();
    const gLower = (glebaName || '').trim().toLowerCase();
    const vLower = (variedadeName || '').trim().toLowerCase();

    const matches = unitPlantio.filter(p => {
      const matchCult = !cLower || (p.cultura || '').trim().toLowerCase() === cLower;
      const matchFaz = !fLower || (p.fazenda || '').trim().toLowerCase() === fLower;
      const matchPiv = !pLower || pLower === '-' || (p.pivo || '').trim().toLowerCase() === pLower;
      const matchGleb = !gLower || gLower === '-' || (p.gleba || '').trim().toLowerCase() === gLower;
      const matchVar = !vLower || vLower === '-' || (p.variedade || '').trim().toLowerCase() === vLower;
      return matchCult && matchFaz && matchPiv && matchGleb && matchVar;
    });

    let totalPlanted = 0;
    if (matches.length > 0) {
      matches.forEach(p => {
        totalPlanted += parseHaValue(p.haDia || p.haGeral || p.mediaHa);
      });
    }

    if (totalPlanted <= 0) return '';
    return `${totalPlanted.toFixed(2).replace('.', ',')} ha`;
  };

  // --- PLANTIO OPTION HELPERS (Pull only items linked in amarracoesData) ---
  const getAmarracoesEmpresas = () => {
    const unitEmpresas = empresasData.filter(isItemInSelectedUnidade);
    const unitAmarracoes = amarracoesData.filter(isItemInSelectedUnidade);
    if (!unitAmarracoes || unitAmarracoes.length === 0) return unitEmpresas;
    const linked = unitEmpresas.filter(e => {
      const eName = e.nome.trim().toLowerCase();
      return unitAmarracoes.some(tie => {
        if (tie.status === 'Inativo') return false;
        const text = `${tie.titulo || ''} ${tie.origem || ''} ${tie.destino || ''} ${tie.observacao || ''}`.toLowerCase();
        return text.includes(eName);
      });
    });
    return linked.length > 0 ? linked : unitEmpresas;
  };

  const getAmarracoesAnos = (empresaName?: string, culturaName?: string, fazendaName?: string) => {
    const unitAnos = anosData.filter(isItemInSelectedUnidade);
    const unitAmarracoes = amarracoesData.filter(isItemInSelectedUnidade);
    if (!unitAmarracoes || unitAmarracoes.length === 0) return unitAnos;
    const eLower = (empresaName || '').trim().toLowerCase();
    const cLower = (culturaName || '').trim().toLowerCase();
    const fLower = (fazendaName || '').trim().toLowerCase();

    const linked = unitAnos.filter(a => {
      const aName = a.nome.trim().toLowerCase();
      return unitAmarracoes.some(tie => {
        if (tie.status === 'Inativo') return false;
        const text = `${tie.titulo || ''} ${tie.origem || ''} ${tie.destino || ''} ${tie.observacao || ''}`.toLowerCase();
        const matchAno = text.includes(aName);
        const matchEmp = !eLower || text.includes(eLower);
        const matchCult = !cLower || text.includes(cLower);
        const matchFaz = !fLower || text.includes(fLower);
        return matchAno && matchEmp && matchCult && matchFaz;
      });
    });

    if (linked.length > 0) return linked;

    const allTiedAnos = unitAnos.filter(a => {
      const aName = a.nome.trim().toLowerCase();
      return unitAmarracoes.some(tie => {
        if (tie.status === 'Inativo') return false;
        const text = `${tie.titulo || ''} ${tie.origem || ''} ${tie.destino || ''} ${tie.observacao || ''}`.toLowerCase();
        return text.includes(aName);
      });
    });

    return allTiedAnos.length > 0 ? allTiedAnos : unitAnos;
  };

  const getAmarracoesCulturas = () => {
    const unitCulturas = culturasData.filter(isItemInSelectedUnidade);
    const unitAmarracoes = amarracoesData.filter(isItemInSelectedUnidade);
    if (!unitAmarracoes || unitAmarracoes.length === 0) return unitCulturas;
    const linked = unitCulturas.filter(c => {
      const cName = c.nome.trim().toLowerCase();
      return unitAmarracoes.some(tie => {
        if (tie.status === 'Inativo') return false;
        const text = `${tie.titulo || ''} ${tie.origem || ''} ${tie.destino || ''} ${tie.observacao || ''}`.toLowerCase();
        return text.includes(cName);
      });
    });
    return linked.length > 0 ? linked : unitCulturas;
  };

  const getAmarracoesFazendas = (culturaName?: string) => {
    const unitFazendas = fazendasData.filter(isItemInSelectedUnidade);
    const unitAmarracoes = amarracoesData.filter(isItemInSelectedUnidade);
    if (!unitAmarracoes || unitAmarracoes.length === 0) return unitFazendas;
    const cLower = (culturaName || '').trim().toLowerCase();
    const linked = unitFazendas.filter(f => {
      const fName = f.nome.trim().toLowerCase();
      return unitAmarracoes.some(tie => {
        if (tie.status === 'Inativo') return false;
        const text = `${tie.titulo || ''} ${tie.origem || ''} ${tie.destino || ''} ${tie.observacao || ''}`.toLowerCase();
        const matchFazenda = text.includes(fName);
        const matchCultura = !cLower || text.includes(cLower);
        return matchFazenda && matchCultura;
      });
    });
    return linked.length > 0 ? linked : unitFazendas;
  };

  const getAmarracoesPivos = (fazendaName?: string, culturaName?: string) => {
    if (!fazendaName) return [];
    const basePivos = getLinkedPivosForFazenda(fazendaName || '');
    const unitAmarracoes = amarracoesData.filter(isItemInSelectedUnidade);
    if (!unitAmarracoes || unitAmarracoes.length === 0) return basePivos;
    const fLower = (fazendaName || '').trim().toLowerCase();
    const cLower = (culturaName || '').trim().toLowerCase();

    const linked = basePivos.filter(p => {
      const pName = p.nome.trim().toLowerCase();
      return unitAmarracoes.some(tie => {
        if (tie.status === 'Inativo') return false;
        const text = `${tie.titulo || ''} ${tie.origem || ''} ${tie.destino || ''} ${tie.observacao || ''}`.toLowerCase();
        const matchPivo = text.includes(pName);
        const matchFazenda = text.includes(fLower);
        const matchCultura = !cLower || text.includes(cLower);
        return matchPivo && matchFazenda && matchCultura;
      });
    });
    return linked.length > 0 ? linked : basePivos;
  };

  const getAmarracoesGlebas = (pivoName?: string, fazendaName?: string, culturaName?: string) => {
    if (!fazendaName) {
      const base = filterGlebasByCulturaType(glebasData.filter(isItemInSelectedUnidade), culturaName);
      return sortAlphanumeric(base);
    }
    const baseGlebas = getLinkedGlebasForPivo(pivoName || '', fazendaName || '', culturaName);
    const unitAmarracoes = amarracoesData.filter(isItemInSelectedUnidade);
    if (!unitAmarracoes || unitAmarracoes.length === 0) return sortAlphanumeric(baseGlebas);
    const pLower = (pivoName || '').trim().toLowerCase();
    const fLower = (fazendaName || '').trim().toLowerCase();
    const cLower = (culturaName || '').trim().toLowerCase();

    const linked = baseGlebas.filter(g => {
      const gName = g.nome.trim().toLowerCase();
      return unitAmarracoes.some(tie => {
        if (tie.status === 'Inativo') return false;
        const text = `${tie.titulo || ''} ${tie.origem || ''} ${tie.destino || ''} ${tie.observacao || ''}`.toLowerCase();
        const matchGleba = text.includes(gName);
        const matchPivo = !pLower || text.includes(pLower);
        const matchFazenda = text.includes(fLower);
        const matchCultura = !cLower || text.includes(cLower);
        return matchGleba && matchPivo && matchFazenda && matchCultura;
      });
    });
    const result = linked.length > 0 ? linked : baseGlebas;
    return sortAlphanumeric(result);
  };

  const getAmarracoesVariedades = (culturaName?: string) => {
    const unitVariedades = variedadesData.filter(isItemInSelectedUnidade);
    const unitAmarracoes = amarracoesData.filter(isItemInSelectedUnidade);
    const cLower = (culturaName || '').trim().toLowerCase();
    const filtered = unitVariedades.filter(v => !cLower || (v.cultura && v.cultura.trim().toLowerCase() === cLower));
    if (!unitAmarracoes || unitAmarracoes.length === 0) return filtered;

    const linked = filtered.filter(v => {
      const vName = v.nome.trim().toLowerCase();
      return unitAmarracoes.some(tie => {
        if (tie.status === 'Inativo') return false;
        const text = `${tie.titulo || ''} ${tie.origem || ''} ${tie.destino || ''} ${tie.observacao || ''}`.toLowerCase();
        return text.includes(vName);
      });
    });
    return linked.length > 0 ? linked : filtered;
  };

  // --- COLHEITA OPTION HELPERS (Pull only items that exist in plantioData) ---
  const getPlantioEmpresas = (culturaName?: string, fazendaName?: string) => {
    const unitPlantio = plantioData.filter(isItemInSelectedUnidade);
    const unitEmpresas = empresasData.filter(isItemInSelectedUnidade);
    if (!unitPlantio || unitPlantio.length === 0) return [];
    const cLower = (culturaName || '').trim().toLowerCase();
    const fLower = (fazendaName || '').trim().toLowerCase();

    const matching = unitPlantio.filter(p => {
      const matchCult = !cLower || (p.cultura || '').trim().toLowerCase() === cLower;
      const matchFaz = !fLower || (p.fazenda || '').trim().toLowerCase() === fLower;
      return matchCult && matchFaz;
    });

    const empresaNames = new Set(matching.map(p => (p.empresa || '').trim().toLowerCase()));
    const filtered = unitEmpresas.filter(e => empresaNames.has(e.nome.trim().toLowerCase()));
    const extra = Array.from(empresaNames)
      .filter(name => name && name !== '-' && !unitEmpresas.some(e => e.nome.trim().toLowerCase() === name))
      .map((name, i) => ({ codigo: `p-emp-${i}`, nome: matching.find(p => p.empresa?.trim().toLowerCase() === name)?.empresa || name }));
    return [...filtered, ...extra];
  };

  const getPlantioCulturas = (fazendaName?: string) => {
    const unitPlantio = plantioData.filter(isItemInSelectedUnidade);
    const unitCulturas = culturasData.filter(isItemInSelectedUnidade);
    if (!unitPlantio || unitPlantio.length === 0) return [];
    const fLower = (fazendaName || '').trim().toLowerCase();
    const matching = unitPlantio.filter(p => !fLower || (p.fazenda || '').trim().toLowerCase() === fLower);
    const plantioCultureNames = new Set(matching.map(p => (p.cultura || '').trim().toLowerCase()));
    const filtered = unitCulturas.filter(c => plantioCultureNames.has(c.nome.trim().toLowerCase()));
    const extra = Array.from(plantioCultureNames)
      .filter(name => name && !unitCulturas.some(c => c.nome.trim().toLowerCase() === name))
      .map((name, i) => ({ codigo: `p-cult-${i}`, nome: matching.find(p => p.cultura?.trim().toLowerCase() === name)?.cultura || name }));
    return [...filtered, ...extra];
  };

  const getPlantioFazendas = (culturaName?: string) => {
    const unitPlantio = plantioData.filter(isItemInSelectedUnidade);
    const unitFazendas = fazendasData.filter(isItemInSelectedUnidade);
    if (!unitPlantio || unitPlantio.length === 0) return [];
    const cLower = (culturaName || '').trim().toLowerCase();
    const matching = unitPlantio.filter(p => !cLower || (p.cultura || '').trim().toLowerCase() === cLower);
    const fazendaNames = new Set(matching.map(p => (p.fazenda || '').trim().toLowerCase()));

    const filtered = unitFazendas.filter(f => fazendaNames.has(f.nome.trim().toLowerCase()));
    const extra = Array.from(fazendaNames)
      .filter(name => name && !unitFazendas.some(f => f.nome.trim().toLowerCase() === name))
      .map((name, i) => ({ codigo: `p-faz-${i}`, nome: matching.find(p => p.fazenda?.trim().toLowerCase() === name)?.fazenda || name }));
    return [...filtered, ...extra];
  };

  const getPlantioPivos = (fazendaName?: string, culturaName?: string) => {
    const unitPlantio = plantioData.filter(isItemInSelectedUnidade);
    const unitPivos = pivosData.filter(isItemInSelectedUnidade);
    if (!unitPlantio || unitPlantio.length === 0) return [];
    const fLower = (fazendaName || '').trim().toLowerCase();
    if (!fLower) return [];
    const cLower = (culturaName || '').trim().toLowerCase();

    const matching = unitPlantio.filter(p => {
      const matchFaz = (p.fazenda || '').trim().toLowerCase() === fLower;
      const matchCult = !cLower || (p.cultura || '').trim().toLowerCase() === cLower;
      return matchFaz && matchCult;
    });

    const pivoNames = new Set(matching.map(p => (p.pivo || '').trim().toLowerCase()));

    const filtered = unitPivos.filter(p => pivoNames.has(p.nome.trim().toLowerCase()));
    const extra = Array.from(pivoNames)
      .filter(name => name && name !== '-' && !unitPivos.some(p => p.nome.trim().toLowerCase() === name))
      .map((name, i) => ({ codigo: `p-piv-${i}`, nome: matching.find(p => p.pivo?.trim().toLowerCase() === name)?.pivo || name }));
    return [...filtered, ...extra];
  };

  const getPlantioGlebas = (pivoName?: string, fazendaName?: string, culturaName?: string) => {
    const unitPlantio = plantioData.filter(isItemInSelectedUnidade);
    let unitGlebas = glebasData.filter(isItemInSelectedUnidade);
    if (culturaName) {
      unitGlebas = filterGlebasByCulturaType(unitGlebas, culturaName);
    }
    if (!unitPlantio || unitPlantio.length === 0) return sortAlphanumeric(unitGlebas);
    const fLower = (fazendaName || '').trim().toLowerCase();
    if (!fLower) return sortAlphanumeric(unitGlebas);
    const pLower = (pivoName || '').trim().toLowerCase();
    const cLower = (culturaName || '').trim().toLowerCase();

    const matching = unitPlantio.filter(p => {
      const matchPiv = !pLower || pLower === '-' || (p.pivo || '').trim().toLowerCase() === pLower;
      const matchFaz = (p.fazenda || '').trim().toLowerCase() === fLower;
      const matchCult = !cLower || (p.cultura || '').trim().toLowerCase() === cLower;
      return matchPiv && matchFaz && matchCult;
    });

    const glebaNames = new Set(matching.map(p => (p.gleba || '').trim().toLowerCase()));

    const filtered = unitGlebas.filter(g => glebaNames.has(g.nome.trim().toLowerCase()));
    const extra = Array.from(glebaNames)
      .filter(name => name && name !== '-' && !unitGlebas.some(g => g.nome.trim().toLowerCase() === name))
      .map((name, i) => ({ codigo: `p-gleb-${i}`, nome: matching.find(p => p.gleba?.trim().toLowerCase() === name)?.gleba || name }));
    return sortAlphanumeric([...filtered, ...extra]);
  };

  const getPlantioVariedades = (culturaName?: string, fazendaName?: string, pivoName?: string, glebaName?: string) => {
    const unitPlantio = plantioData.filter(isItemInSelectedUnidade);
    const unitVariedades = variedadesData.filter(isItemInSelectedUnidade);
    if (!unitPlantio || unitPlantio.length === 0) return [];
    const cLower = (culturaName || '').trim().toLowerCase();
    const fLower = (fazendaName || '').trim().toLowerCase();
    const pLower = (pivoName || '').trim().toLowerCase();
    const gLower = (glebaName || '').trim().toLowerCase();

    const matching = unitPlantio.filter(p => {
      const matchCult = !cLower || (p.cultura || '').trim().toLowerCase() === cLower;
      const matchFaz = !fLower || (p.fazenda || '').trim().toLowerCase() === fLower;
      const matchPiv = !pLower || pLower === '-' || (p.pivo || '').trim().toLowerCase() === pLower;
      const matchGleb = !gLower || gLower === '-' || (p.gleba || '').trim().toLowerCase() === gLower;
      return matchCult && matchFaz && matchPiv && matchGleb;
    });

    const variedadeNames = new Set(matching.map(p => (p.variedade || '').trim().toLowerCase()));

    const filtered = unitVariedades.filter(v => variedadeNames.has(v.nome.trim().toLowerCase()));
    const extra = Array.from(variedadeNames)
      .filter(name => name && name !== '-' && !unitVariedades.some(v => v.nome.trim().toLowerCase() === name))
      .map((name, i) => ({
        codigo: `p-var-${i}`,
        nome: matching.find(p => p.variedade?.trim().toLowerCase() === name)?.variedade || name,
        cultura: culturaName || ''
      }));
    return [...filtered, ...extra];
  };

  const handleSelectCultura = (culturaNome: string) => {
    const nextCultura = selectedCulturaForTie === culturaNome ? '' : culturaNome;
    setSelectedCulturaForTie(nextCultura);
    if (nextCultura && selectedVariedadeForTie) {
      const isValidVar = variedadesData.filter(isItemInSelectedUnidade).some(v => v.nome === selectedVariedadeForTie && v.cultura?.trim().toLowerCase() === nextCultura.trim().toLowerCase());
      if (!isValidVar) {
        setSelectedVariedadeForTie('');
      }
    }
  };

  const handleAddSquareItem = async (category: 'empresa' | 'ano' | 'cultura' | 'fazenda' | 'pivo' | 'gleba' | 'variedade') => {
    if (!newSquareItemName.trim()) {
      showToast('Digite um nome para cadastrar.', 'warning');
      return;
    }
    const name = newSquareItemName.trim();
    const newCode = Date.now().toString();

    if (category === 'empresa') {
      await saveDocument(COLLECTIONS.empresas, { codigo: newCode, nome: name, unidade: selectedUnidade });
      showToast(`Empresa "${name}" cadastrada!`, 'success');
    } else if (category === 'ano') {
      await saveDocument(COLLECTIONS.anos, { codigo: newCode, nome: name, unidade: selectedUnidade });
      showToast(`Ano "${name}" cadastrado!`, 'success');
    } else if (category === 'cultura') {
      await saveDocument(COLLECTIONS.culturas, { codigo: newCode, nome: name, unidade: selectedUnidade });
      showToast(`Cultura "${name}" cadastrada!`, 'success');
    } else if (category === 'fazenda') {
      await saveDocument(COLLECTIONS.fazendas, { codigo: newCode, nome: name, unidade: selectedUnidade });
      showToast(`Fazenda "${name}" cadastrada!`, 'success');
    } else if (category === 'pivo') {
      await saveDocument(COLLECTIONS.pivos, { codigo: newCode, nome: name, unidade: selectedUnidade });
      showToast(`Pivô "${name}" cadastrado!`, 'success');
    } else if (category === 'gleba') {
      await saveDocument(COLLECTIONS.glebas, { codigo: newCode, nome: name, unidade: selectedUnidade });
      showToast(`Gleba "${name}" cadastrada!`, 'success');
    } else if (category === 'variedade') {
      const culturaVinculada = selectedCulturaForTie || '';
      await saveDocument(COLLECTIONS.variedades, { codigo: newCode, nome: name, cultura: culturaVinculada, unidade: selectedUnidade });
      showToast(`Variedade "${name}" cadastrada${culturaVinculada ? ` (Cultura: ${culturaVinculada})` : ''}!`, 'success');
    }

    setNewSquareItemName('');
  };

  const handleDeleteSquareItem = async (category: 'empresa' | 'ano' | 'cultura' | 'fazenda' | 'pivo' | 'gleba' | 'variedade', codigo: string) => {
    let targetList: SimpleItem[] = [];
    let colName: string = category;
    if (category === 'empresa') { targetList = empresasData; colName = COLLECTIONS.empresas; }
    else if (category === 'ano') { targetList = anosData; colName = COLLECTIONS.anos; }
    else if (category === 'cultura') { targetList = culturasData; colName = COLLECTIONS.culturas; }
    else if (category === 'fazenda') { targetList = fazendasData; colName = COLLECTIONS.fazendas; }
    else if (category === 'pivo') { targetList = pivosData; colName = COLLECTIONS.pivos; }
    else if (category === 'gleba') { targetList = glebasData; colName = COLLECTIONS.glebas; }
    else if (category === 'variedade') { targetList = variedadesData as any; colName = COLLECTIONS.variedades; }

    const item = targetList.find(x => x.codigo === codigo);
    if (item?.id) {
      await removeDocument(colName, item.id);
    }
    showToast('Item removido com sucesso.', 'info');
  };

  const handleCreateGeralTie = async (e: React.FormEvent) => {
    e.preventDefault();
    const selections = [
      selectedEmpresaForTie && `Empresa: ${selectedEmpresaForTie}`,
      selectedAnoForTie && `Ano: ${selectedAnoForTie}`,
      selectedCulturaForTie && `Cultura: ${selectedCulturaForTie}`,
      selectedFazendaForTie && `Fazenda: ${selectedFazendaForTie}`,
      selectedPivoForTie && `Pivô: ${selectedPivoForTie}`,
      selectedGlebaForTie && `Gleba: ${selectedGlebaForTie}`,
      selectedVariedadeForTie && `Variedade: ${selectedVariedadeForTie}`,
    ].filter(Boolean);

    if (selections.length === 0) {
      showToast('Selecione ao menos 1 item para realizar a amarração.', 'warning');
      return;
    }

    const randomCode = '#AMR-' + Math.floor(100000 + Math.random() * 900000);
    const titleText = selections.join(' ➔ ');
    const formattedHectares = tieHectares.trim()
      ? (tieHectares.trim().toLowerCase().includes('ha') ? tieHectares.trim() : `${tieHectares.trim()} ha`)
      : '';

    const newItem: AmarracaoItem = {
      codigoMarca: randomCode,
      categoria: 'geral',
      titulo: titleText,
      origem: selectedEmpresaForTie || selectedCulturaForTie || selectedFazendaForTie || 'Ordem Geral',
      destino: selectedVariedadeForTie || selectedGlebaForTie || selectedPivoForTie || 'Vínculo',
      status: 'Ativo',
      hectares: formattedHectares,
      observacao: tieObservacao.trim() || 'Ligação cadastrada no Geral',
      unidade: selectedUnidade
    };

    await saveDocument(COLLECTIONS.amarracoes, newItem);
    showToast(`Amarração (${randomCode}) criada no Geral!`, 'success');
    setSelectedEmpresaForTie('');
    setSelectedAnoForTie('');
    setSelectedCulturaForTie('');
    setSelectedFazendaForTie('');
    setSelectedPivoForTie('');
    setSelectedGlebaForTie('');
    setSelectedVariedadeForTie('');
    setTieHectares('');
    setTieObservacao('');
  };

  // Amarracao Item Modal State
  const [isAmarracaoModalOpen, setIsAmarracaoModalOpen] = useState(false);
  const [editingAmarracao, setEditingAmarracao] = useState<AmarracaoItem | null>(null);
  const [amarracaoFormData, setAmarracaoFormData] = useState<{
    categoria: AmarracaoCategory;
    titulo: string;
    origem: string;
    destino: string;
    status: 'Ativo' | 'Inativo';
    hectares: string;
    observacao: string;
  }>({
    categoria: 'cultura',
    titulo: '',
    origem: '',
    destino: '',
    status: 'Ativo',
    hectares: '',
    observacao: ''
  });

  const openNewAmarracaoModal = (defaultCategory: AmarracaoCategory = 'cultura') => {
    setEditingAmarracao(null);
    setAmarracaoFormData({
      categoria: defaultCategory,
      titulo: '',
      origem: '',
      destino: '',
      status: 'Ativo',
      hectares: '',
      observacao: ''
    });
    setIsAmarracaoModalOpen(true);
  };

  const openEditAmarracaoModal = (item: AmarracaoItem) => {
    setEditingAmarracao(item);
    setAmarracaoFormData({
      categoria: item.categoria || 'geral',
      titulo: item.titulo || '',
      origem: item.origem || item.titulo || '',
      destino: item.destino || item.titulo || '',
      status: item.status || 'Ativo',
      hectares: item.hectares ? item.hectares.replace(/ha/gi, '').trim() : '',
      observacao: item.observacao || ''
    });
    setIsAmarracaoModalOpen(true);
  };

  const handleSaveAmarracao = async (e: React.FormEvent) => {
    e.preventDefault();
    const orig = amarracaoFormData.origem.trim() || amarracaoFormData.titulo.trim() || 'Origem';
    const dest = amarracaoFormData.destino.trim() || amarracaoFormData.titulo.trim() || 'Destino';
    const autoTitle = amarracaoFormData.titulo.trim() || `${orig} ➔ ${dest}`;
    const formattedHectares = amarracaoFormData.hectares.trim() ? `${amarracaoFormData.hectares.trim().replace(/ha/gi, '').trim()} ha` : undefined;

    if (editingAmarracao) {
      const updated: AmarracaoItem = {
        ...editingAmarracao,
        categoria: amarracaoFormData.categoria,
        titulo: autoTitle,
        origem: orig,
        destino: dest,
        status: amarracaoFormData.status,
        hectares: formattedHectares,
        observacao: amarracaoFormData.observacao
      };
      await saveDocument(COLLECTIONS.amarracoes, updated, editingAmarracao.id);
      showToast('Amarração atualizada com sucesso!', 'success');
    } else {
      const newItem: AmarracaoItem = {
        codigoMarca: `#AMR-${Date.now().toString().slice(-5)}`,
        categoria: amarracaoFormData.categoria,
        titulo: autoTitle,
        origem: orig,
        destino: dest,
        status: amarracaoFormData.status,
        hectares: formattedHectares,
        observacao: amarracaoFormData.observacao,
        unidade: selectedUnidade
      };
      await saveDocument(COLLECTIONS.amarracoes, newItem);
      showToast('Nova amarração criada com sucesso!', 'success');
    }
    setIsAmarracaoModalOpen(false);
    setEditingAmarracao(null);
  };

  const handleDeleteAmarracao = async (id: string) => {
    await removeDocument(COLLECTIONS.amarracoes, id);
    showToast('Amarração removida.', 'info');
  };

  const handleToggleAmarracaoStatus = async (id: string) => {
    const item = amarracoesData.find(a => a.id === id);
    if (item && id) {
      const updated = {
        ...item,
        status: item.status === 'Ativo' ? ('Inativo' as const) : ('Ativo' as const)
      };
      await saveDocument(COLLECTIONS.amarracoes, updated, id);
      showToast('Status da amarração alterado.', 'info');
    }
  };

  // Share Modal State
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareText, setShareText] = useState('');

  // Close filter popover on resize
  useEffect(() => {
    const handleResize = () => setPopoverState(null);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Title map
  const titleMap: Record<PageKey, string> = {
    colheita: 'BdColheita',
    plantio: 'BdPlantio',
    empresas: 'Cadastro_Empresas',
    anos: 'Cadastro_Anos',
    variedades: 'Cadastro_Variedades',
    pivos: 'Cadastro_Pivos',
    glebas: 'Cadastro_Glebas',
    fazendas: 'Cadastro_Fazendas',
    culturas: 'Cadastro_Culturas',
    colaboradores: 'Cadastro_Colaboradores',
    motoristas: 'Cadastro_Motoristas',
    onibus: 'Cadastro_Onibus',
    lixeira: 'Lixeira',
    amarracoes: 'Marcações e Amarrações'
  };

  // Modal entity name map
  const modalEntityNameMap: Record<PageKey, string> = {
    colheita: 'Item - Colheita',
    plantio: 'Item - Plantio',
    empresas: 'Empresa',
    anos: 'Ano Safra',
    variedades: 'Variedade',
    pivos: 'Pivô',
    glebas: 'Gleba',
    fazendas: 'Fazenda',
    culturas: 'Cultura',
    colaboradores: 'Colaborador',
    motoristas: 'Motorista',
    onibus: 'Ônibus',
    lixeira: 'Item',
    amarracoes: 'Marcação'
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const switchPage = (page: PageKey) => {
    if (isGridEditing) setIsGridEditing(false);
    setPopoverState(null);
    if (page !== 'lixeira') {
      setLixeiraCategory(page);
    }
    setActivePage(page);
    closeSidebar();
  };

  const toggleGridMode = () => {
    setIsGridEditing(!isGridEditing);
  };

  // Check if a row matches column filters and global search
  const isRowVisible = (rowCells: string[], colIndexMap?: Record<number, string[]>) => {
    // Global query
    const globalQuery = globalSearch.toLowerCase().trim();
    if (globalQuery) {
      const matchGlobal = rowCells.some(cell => cell.toLowerCase().includes(globalQuery));
      if (!matchGlobal) return false;
    }

    // Column filters
    const activePageFilters = colIndexMap || columnFilters[activePage] || {};
    for (const colIdxStr in activePageFilters) {
      const colIdx = Number(colIdxStr);
      const allowedValues = activePageFilters[colIdx];
      const cellText = rowCells[colIdx] ? rowCells[colIdx].trim() : '';
      if (allowedValues && !allowedValues.includes(cellText)) {
        return false;
      }
    }

    return true;
  };

  // Get visible row data for active page
  const getActiveVisibleRows = (): string[][] => {
    if (activePage === 'colheita') {
      return colheitaData
        .map(item => [item.data, item.empresa || '-', item.cultura, item.os || '-', item.fazenda, item.pivo || '-', item.gleba || '-', item.variedade || '-', item.haDia || '-', item.haGeral || '-', item.haRestante || '-', item.qtdColhido || item.caixasCortadas || item.caixaBinBag || '-', item.glebasFinalizada || '-', item.mediaHa || '-', item.mes || '-', item.ano || '-'])
        .filter(row => isRowVisible(row));
    } else if (activePage === 'plantio') {
      return plantioData
        .map(item => [item.data, item.empresa || '-', item.cultura, item.os || '-', item.fazenda, item.pivo || '-', item.gleba || '-', item.variedade || '-', item.haDia || '-', item.haRestante || '-', item.glebasFinalizada || '-', item.mediaHa || '-', item.ano || '-'])
        .filter(row => isRowVisible(row));
    } else if (activePage === 'variedades') {
      return variedadesData
        .map(item => [item.codigo, item.nome, item.cultura])
        .filter(row => isRowVisible(row));
    } else if (activePage === 'colaboradores') {
      return colaboradoresData
        .map(item => [item.codigo, item.nome, item.apontador || '-', item.local || '-', item.status || 'Ativo'])
        .filter(row => isRowVisible(row));
    } else if (activePage === 'motoristas') {
      return motoristasData
        .map(item => [item.codigo, item.nome, item.abreviacao])
        .filter(row => isRowVisible(row));
    } else if (activePage === 'onibus') {
      return onibusData
        .map(item => [item.codigo, item.nome, item.cor || 'Branco', item.motorista || '-', item.local || '-', item.cooperado || 'Não'])
        .filter(row => isRowVisible(row));
    } else {
      let list: SimpleItem[] = [];
      if (activePage === 'pivos') list = pivosData;
      else if (activePage === 'glebas') list = glebasData;
      else if (activePage === 'fazendas') list = fazendasData;
      else if (activePage === 'culturas') list = culturasData;
      else if (activePage === 'empresas') list = empresasData;
      else if (activePage === 'anos') list = anosData;

      return list
        .map(item => [item.codigo, item.nome])
        .filter(row => isRowVisible(row));
    }
  };

  // Check if any filters are active
  const hasActiveFilters = globalSearch.trim().length > 0 || (columnFilters[activePage] && Object.keys(columnFilters[activePage]).length > 0);

  const resetPageFilters = () => {
    setColumnFilters(prev => ({ ...prev, [activePage]: {} }));
    setGlobalSearch('');
    setPopoverState(null);
  };

  // Open Column Filter Popover
  const openColumnFilter = (e: React.MouseEvent<HTMLButtonElement>, colIndex: number) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();

    let allRows: string[][] = [];
    if (activePage === 'colheita') {
      allRows = colheitaData.map(item => [item.data, item.empresa || '-', item.cultura, item.os || '-', item.fazenda, item.pivo || '-', item.gleba || '-', item.variedade || '-', item.haDia || '-', item.haGeral || '-', item.haRestante || '-', item.qtdColhido || item.caixasCortadas || item.caixaBinBag || '-', item.glebasFinalizada || '-', item.mediaHa || '-', item.mes || '-', item.ano || '-']);
    } else if (activePage === 'plantio') {
      allRows = plantioData.map(item => [item.data, item.empresa || '-', item.cultura, item.os || '-', item.fazenda, item.pivo || '-', item.gleba || '-', item.variedade || '-', item.haDia || '-', item.haRestante || '-', item.glebasFinalizada || '-', item.mediaHa || '-', item.ano || '-']);
    } else if (activePage === 'variedades') {
      allRows = variedadesData.map(i => [i.codigo, i.nome, i.cultura]);
    } else if (activePage === 'colaboradores') {
      allRows = colaboradoresData.map(i => [i.codigo, i.nome, i.apontador || '-', i.local || '-', i.status || 'Ativo']);
    } else if (activePage === 'motoristas') {
      allRows = motoristasData.map(i => [i.codigo, i.nome, i.abreviacao]);
    } else if (activePage === 'onibus') {
      allRows = onibusData.map(i => [i.codigo, i.nome, i.cor || 'Branco', i.motorista || '-', i.local || '-', i.cooperado || 'Não']);
    } else if (activePage === 'pivos') allRows = pivosData.map(i => [i.codigo, i.nome]);
    else if (activePage === 'glebas') allRows = glebasData.map(i => [i.codigo, i.nome]);
    else if (activePage === 'fazendas') allRows = fazendasData.map(i => [i.codigo, i.nome]);
    else if (activePage === 'culturas') allRows = culturasData.map(i => [i.codigo, i.nome]);
    else if (activePage === 'empresas') allRows = empresasData.map(i => [i.codigo, i.nome]);
    else if (activePage === 'anos') allRows = anosData.map(i => [i.codigo, i.nome]);

    const valuesSet = new Set<string>();
    allRows.forEach(row => {
      if (row[colIndex] !== undefined) {
        valuesSet.add(row[colIndex].trim());
      }
    });

    const options = Array.from(valuesSet);
    const currentPageFilters = columnFilters[activePage] && columnFilters[activePage][colIndex]
      ? columnFilters[activePage][colIndex]
      : options;

    setPopoverState({
      colIndex,
      top: rect.bottom + window.scrollY + 4,
      left: Math.min(rect.left + window.scrollX, window.innerWidth - 230),
      options,
      selected: [...currentPageFilters]
    });
  };

  const applyCurrentColumnFilter = () => {
    if (!popoverState) return;
    const { colIndex, selected, options } = popoverState;

    setColumnFilters(prev => {
      const pageF = { ...(prev[activePage] || {}) };
      if (selected.length < options.length) {
        pageF[colIndex] = selected;
      } else {
        delete pageF[colIndex];
      }
      return { ...prev, [activePage]: pageF };
    });

    setPopoverState(null);
  };

  const clearCurrentColumnFilter = () => {
    if (!popoverState) return;
    const { colIndex } = popoverState;
    setColumnFilters(prev => {
      const pageF = { ...(prev[activePage] || {}) };
      delete pageF[colIndex];
      return { ...prev, [activePage]: pageF };
    });
    setPopoverState(null);
  };

  const toggleSelectAllPopoverOptions = (checked: boolean) => {
    if (!popoverState) return;
    setPopoverState({
      ...popoverState,
      selected: checked ? [...popoverState.options] : []
    });
  };

  const togglePopoverOption = (val: string) => {
    if (!popoverState) return;
    const isSelected = popoverState.selected.includes(val);
    const newSelected = isSelected
      ? popoverState.selected.filter(v => v !== val)
      : [...popoverState.selected, val];

    setPopoverState({
      ...popoverState,
      selected: newSelected
    });
  };

  // Report generation for Share modal
  const generateFilteredShareText = (): string => {
    const visibleRows = getActiveVisibleRows();
    if (visibleRows.length === 0) {
      return "Nenhum dado encontrado para os filtros selecionados.";
    }

    const textBlocks: string[] = [];

    visibleRows.forEach(cells => {
      if (activePage === 'colheita') {
        const block = `*INFORMAÇÕES DE COLHEITA*\n` +
          `*${(cells[4] || 'FAZENDA').toUpperCase()}*\n\n` +
          `*Data:* ${cells[0] || '-'}\n` +
          `*Empresa:* ${cells[1] || '-'}\n` +
          `*Cultura:* ${cells[2] || '-'}\n` +
          `*OS:* ${cells[3] || '-'}\n` +
          `*Fazenda:* ${cells[4] || '-'}\n` +
          `*Pivô:* ${cells[5] || '-'}\n` +
          `*Gleba:* ${cells[6] || '-'}\n` +
          `*Variedade:* ${cells[7] || '-'}\n` +
          `*HA/Dia:* ${cells[8] || '-'}\n` +
          `*HA/Geral:* ${cells[9] || '-'}\n` +
          `*Ha Restante:* ${cells[10] || '-'}\n` +
          `*Qtd: Colhido:* ${cells[11] || '-'}\n` +
          `*Finalizada:* ${cells[12] || '-'}\n` +
          `*Média/ha:* ${cells[13] || '-'}\n` +
          `*Mês:* ${cells[14] || '-'}\n` +
          `*Ano:* ${cells[15] || '-'}`;
        textBlocks.push(block);
      } else if (activePage === 'plantio') {
        const block = `*INFORMAÇÕES DE PLANTIO*\n` +
          `*${(cells[4] || 'FAZENDA').toUpperCase()}*\n\n` +
          `*Data:* ${cells[0] || '-'}\n` +
          `*Empresa:* ${cells[1] || '-'}\n` +
          `*Cultura:* ${cells[2] || '-'}\n` +
          `*OS:* ${cells[3] || '-'}\n` +
          `*Fazenda:* ${cells[4] || '-'}\n` +
          `*Pivô:* ${cells[5] || '-'}\n` +
          `*Gleba:* ${cells[6] || '-'}\n` +
          `*Variedade:* ${cells[7] || '-'}\n` +
          `*HA/ Dia:* ${cells[8] || '-'}\n` +
          `*Ha Restante:* ${cells[9] || '-'}\n` +
          `*Glebas Finalizada:* ${cells[10] || '-'}\n` +
          `*Média Ha:* ${cells[11] || '-'}\n` +
          `*Ano:* ${cells[12] || '-'}`;
        textBlocks.push(block);
      } else {
        textBlocks.push(`• ${cells.join(' - ')}`);
      }
    });

    return textBlocks.join('\n\n--------------------\n\n');
  };

  const openShareOptions = async () => {
    const formattedText = generateFilteredShareText();
    setShareText(formattedText);

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          text: formattedText
        });
        return;
      } catch (e) {
        // Fallback to custom modal
      }
    }

    setIsShareOpen(true);
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('Texto do relatório copiado! Cole no WhatsApp Web.', 'success');
    } catch (err) {
      showToast('Erro ao copiar texto.', 'warning');
    }
  };

  const copyShareText = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText)
        .then(() => {
          showToast('Texto do relatório copiado! Cole no WhatsApp Web.', 'success');
        })
        .catch(() => {
          fallbackCopyText(shareText);
        });
    } else {
      fallbackCopyText(shareText);
    }
    setIsShareOpen(false);
  };

  // Export CSV
  const exportToCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (activePage === 'colheita') {
      headers = ['DATA', 'EMPRESA', 'CULTURA', 'OS', 'FAZENDA', 'PIVÔ', 'GLEBA', 'VARIEDADE', 'HA/DIA', 'HA/GERAL', 'HA/RESTA', 'QTD: COLHIDO', 'FINALIZADA', 'MÉDIA/HA', 'MÊS', 'ANO'];
      rows = colheitaData
        .map(i => [i.data, i.empresa || '-', i.cultura, i.os || '-', i.fazenda, i.pivo || '-', i.gleba || '-', i.variedade || '-', i.haDia || '-', i.haGeral || '-', i.haRestante || '-', i.qtdColhido || i.caixasCortadas || i.caixaBinBag || '-', i.glebasFinalizada || '-', i.mediaHa || '-', i.mes || '-', i.ano || '-'])
        .filter(r => isRowVisible(r));
    } else if (activePage === 'plantio') {
      headers = ['DATA', 'EMPRESA', 'CULTURA', 'OS', 'FAZENDA', 'PIVO', 'GLEBA', 'VARIEDADE', 'HA_DIA', 'HA_RESTANTE', 'GLEBAS_FINALIZADA', 'MEDIA_HA', 'ANO'];
      rows = plantioData
        .map(i => [i.data, i.empresa || '-', i.cultura, i.os || '-', i.fazenda, i.pivo || '-', i.gleba || '-', i.variedade || '-', i.haDia || '-', i.haRestante || '-', i.glebasFinalizada || '-', i.mediaHa || '-', i.ano || '-'])
        .filter(r => isRowVisible(r));
    } else if (activePage === 'variedades') {
      headers = ['CÓDIGO', 'NOME', 'CULTURA'];
      rows = variedadesData
        .map(i => [i.codigo, i.nome, i.cultura])
        .filter(r => isRowVisible(r));
    } else if (activePage === 'colaboradores') {
      headers = ['MATRÍCULA', 'NOME', 'APONTADOR', 'LOCAL', 'STATUS'];
      rows = colaboradoresData
        .map(i => [i.codigo, i.nome, i.apontador || '-', i.local || '-', i.status || 'Ativo'])
        .filter(r => isRowVisible(r));
    } else if (activePage === 'motoristas') {
      headers = ['CÓDIGO (CAPA)', 'NOME COMPLETO', 'ABREVIAÇÃO'];
      rows = motoristasData
        .map(i => [i.codigo, i.nome, i.abreviacao])
        .filter(r => isRowVisible(r));
    } else if (activePage === 'onibus') {
      headers = ['CÓDIGO', 'PLACA', 'COR', 'MOTORISTA', 'LOCAL', 'MOTORISTA COOPERADO'];
      rows = onibusData
        .map(i => [i.codigo, i.nome, i.cor || 'Branco', i.motorista || '-', i.local || '-', i.cooperado || 'Não'])
        .filter(r => isRowVisible(r));
    } else {
      headers = ['CÓDIGO', 'NOME'];
      let list: SimpleItem[] = [];
      if (activePage === 'pivos') list = pivosData;
      else if (activePage === 'glebas') list = glebasData;
      else if (activePage === 'fazendas') list = fazendasData;
      else if (activePage === 'culturas') list = culturasData;
      else if (activePage === 'empresas') list = empresasData;
      else if (activePage === 'anos') list = anosData;

      rows = list.map(i => [i.codigo, i.nome]).filter(r => isRowVisible(r));
    }

    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(';'),
      ...rows.map(row => row.map(cell => `"${cell.replace(/[\n\r]/g, ' ').replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activePage}_export.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Date format conversion helpers
  const dateToInputFormat = (displayDate: string): string => {
    if (!displayDate) return new Date().toISOString().split('T')[0];
    const trimmed = displayDate.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    
    const parts = trimmed.split(/[/.-]/);
    if (parts.length === 3) {
      let [p1, p2, p3] = parts.map(p => p.trim());
      if (p1.length === 4) {
        let year = p1;
        let month = p2.padStart(2, '0');
        let day = p3.padStart(2, '0');
        return `${year}-${month}-${day}`;
      } else {
        let day = p1.padStart(2, '0');
        let month = p2.padStart(2, '0');
        let year = p3;
        if (year.length === 2) year = '20' + year;
        if (year.length === 4) return `${year}-${month}-${day}`;
      }
    }
    return new Date().toISOString().split('T')[0];
  };

  const inputToDisplayFormat = (inputDate: string): string => {
    if (!inputDate) return '';
    const trimmed = inputDate.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split('-');
      return `${day}/${month}/${year.slice(-2)}`;
    }
    return trimmed;
  };

  const getMonthNameFromDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const yyyymmdd = dateToInputFormat(dateStr);
    const parts = yyyymmdd.split('-');
    if (parts.length === 3) {
      const monthNum = parseInt(parts[1], 10);
      const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      return months[monthNum - 1] || '';
    }
    return '';
  };

  const getYearFromDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const yyyymmdd = dateToInputFormat(dateStr);
    const parts = yyyymmdd.split('-');
    if (parts.length === 3) {
      return parts[0];
    }
    return '';
  };

  const getNextAutoCodeForPage = (page: string): string => {
    let list: { codigo?: string; unidade?: string }[] = [];
    if (page === 'variedades') list = variedadesData;
    else if (page === 'colaboradores') list = colaboradoresData;
    else if (page === 'motoristas') list = motoristasData;
    else if (page === 'onibus') list = onibusData;
    else if (page === 'pivos') list = pivosData;
    else if (page === 'glebas') list = glebasData;
    else if (page === 'fazendas') list = fazendasData;
    else if (page === 'culturas') list = culturasData;
    else if (page === 'empresas') list = empresasData;
    else if (page === 'anos') list = anosData;

    const unitItems = list.filter(isItemInSelectedUnidade);
    let max = 0;
    for (const item of unitItems) {
      if (item.codigo) {
        const val = parseInt(item.codigo.replace(/\D/g, ''), 10);
        if (!isNaN(val) && val > max) {
          max = val;
        }
      }
    }
    return String(max + 1);
  };

  // Open Modal for Add/Edit
  const openCurrentModal = (editData: string[] | null = null, index: number | null = null) => {
    setEditingIndex(index);
    const initial: Record<string, string> = {};

    if (activePage === 'colheita') {
      const defaultDate = new Date().toISOString().split('T')[0];
      const selectedDate = editData && editData[0] ? (dateToInputFormat(editData[0]) || editData[0]) : defaultDate;
      initial.cData = selectedDate;
      initial.cEmpresa = editData && editData[1] && editData[1] !== '-' ? editData[1] : (empresasData.filter(isItemInSelectedUnidade)[0]?.nome || '');
      initial.cCultura = editData ? editData[2] : '';
      initial.cOs = editData ? editData[3] : '';
      initial.cFazenda = editData ? editData[4] : '';
      initial.cPivo = editData ? editData[5] : '';
      initial.cGleba = editData ? editData[6] : '';
      initial.cVariedade = editData ? editData[7] : '';
      initial.cHaDia = editData ? editData[8] : '';
      initial.cHaGeral = editData && editData[9] && editData[9] !== '-' ? editData[9] : (lookupPlantedHectaresForSelection(initial.cCultura, initial.cFazenda, initial.cPivo, initial.cGleba, initial.cVariedade) || '');
      initial.cHaRestante = editData && editData[10] && editData[10] !== '-' ? editData[10] : calculateHaRestanteForColheita(initial.cHaGeral, initial.cHaDia, initial.cCultura, initial.cFazenda, initial.cPivo, initial.cGleba, initial.cVariedade, index);
      initial.cQtdColhido = editData && editData[11] && editData[11] !== '-' ? editData[11] : '';
      initial.cGlebasFinalizada = editData && editData[12] && editData[12] !== '-' ? editData[12] : 'Não';
      initial.cMediaHa = editData && editData[13] && editData[13] !== '-' ? editData[13] : calculateMediaHaForColheita(initial.cQtdColhido, initial.cHaDia);
      initial.cMes = editData && editData[14] && editData[14] !== '-' ? editData[14] : getMonthNameFromDate(selectedDate);
      initial.cAno = editData && editData[15] && editData[15] !== '-' ? editData[15] : getYearFromDate(selectedDate);
    } else if (activePage === 'plantio') {
      const defaultDate = new Date().toISOString().split('T')[0];
      initial.pData = editData && editData[0] ? (dateToInputFormat(editData[0]) || editData[0]) : defaultDate;
      initial.pEmpresa = editData ? editData[1] : '';
      initial.pCultura = editData ? editData[2] : '';
      initial.pOs = editData ? editData[3] : '';
      initial.pFazenda = editData ? editData[4] : '';
      initial.pPivo = editData ? editData[5] : '';
      initial.pGleba = editData ? editData[6] : '';
      initial.pVariedade = editData ? editData[7] : '';
      const autoTieHa = (initial.pPivo || initial.pGleba || initial.pFazenda) ? lookupHectaresForSelection(initial.pPivo, initial.pGleba, initial.pFazenda) : '';
      initial.pHaGeral = editData ? editData[8] : autoTieHa;
      initial.pHaDia = editData ? (editData[9] || editData[8] || '') : '';
      initial.pHaRestante = editData && editData[9] && editData[9] !== '-' ? editData[9] : calculateHaRestanteForPlantio(initial.pHaGeral, initial.pHaDia, initial.pPivo, initial.pGleba, initial.pFazenda, index);
      initial.pGlebasFinalizada = editData && editData[10] && editData[10] !== '-' ? editData[10] : 'Não';
      initial.pMediaHa = editData && editData[11] && editData[11] !== '-' ? editData[11] : '';
      initial.pAno = editData && editData[12] ? editData[12] : '';
    } else if (activePage === 'variedades') {
      initial.autoCode = editData ? editData[0] : getNextAutoCodeForPage('variedades');
      initial.simpleName = editData ? editData[1] : '';
      initial.vCultura = editData ? editData[2] : (culturasData.filter(isItemInSelectedUnidade)[0]?.nome || '');
    } else if (activePage === 'colaboradores') {
      initial.autoCode = editData ? editData[0] : getNextAutoCodeForPage('colaboradores');
      initial.nomeCompleto = editData ? editData[1] : '';
      initial.cApontador = editData && editData[2] && editData[2] !== '-' ? editData[2] : '';
      initial.cLocal = editData && editData[3] && editData[3] !== '-' ? editData[3] : (fazendasData.filter(isItemInSelectedUnidade)[0]?.nome || '');
      initial.cStatus = editData && editData[4] && editData[4] !== '-' ? editData[4] : 'Ativo';
    } else if (activePage === 'motoristas') {
      initial.autoCode = editData ? editData[0] : getNextAutoCodeForPage('motoristas');
      initial.nomeCompleto = editData ? editData[1] : '';
      initial.abreviacao = editData ? editData[2] : '';
    } else if (activePage === 'onibus') {
      initial.autoCode = editData ? editData[0] : getNextAutoCodeForPage('onibus');
      initial.nomeOnibus = editData ? editData[1] : '';
      initial.corOnibus = editData && editData[2] ? editData[2] : 'Branco';
      initial.oMotorista = editData && editData[3] ? editData[3] : (motoristasData.filter(isItemInSelectedUnidade)[0] ? `${motoristasData.filter(isItemInSelectedUnidade)[0].nome} (${motoristasData.filter(isItemInSelectedUnidade)[0].abreviacao})` : '');
      initial.oCooperado = editData && editData[5] && editData[5] !== '-' ? editData[5] : 'Não';
      initial.oLocal = editData && editData[4] && editData[4] !== '-' ? editData[4] : (initial.oCooperado === 'Sim' ? 'COOPERATIVA AGRO' : (fazendasData.filter(isItemInSelectedUnidade)[0]?.nome || ''));
    } else {
      initial.autoCode = editData ? editData[0] : getNextAutoCodeForPage(activePage);
      initial.simpleName = editData ? editData[1] : '';
      if (activePage === 'culturas') {
        const existingCult = index !== null && index !== undefined && culturasData[index] ? culturasData[index] : null;
        initial.cTipoCultura = existingCult?.tipo || (editData && editData[2] ? editData[2] : 'Hortifruti');
      }
    }

    setFormData(initial);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingIndex(null);
    setFormData({});
  };

  // Keyboard shortcuts (Escape key closes modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmModal) {
          setConfirmModal(null);
        } else if (isModalOpen) {
          closeModal();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmModal, isModalOpen]);

  // Delete Row - Moves to Trash (Lixeira) with custom confirmation modal & undo support
  const deleteRow = (category: MainCategoryKey, index: number) => {
    let itemLabel = 'este item';
    let itemToDelete: any = null;
    let itemDetails: { label: string; value: string }[] = [];

    if (category === 'colheita' && colheitaData[index]) {
      itemToDelete = colheitaData[index];
      itemLabel = `Colheita de ${itemToDelete.cultura} (${itemToDelete.fazenda})`;
      itemDetails = [
        { label: 'Data', value: itemToDelete.data },
        { label: 'Cultura', value: itemToDelete.cultura },
        { label: 'Fazenda', value: itemToDelete.fazenda },
        { label: 'Área Colhida', value: itemToDelete.haDia || itemToDelete.haGeral || '-' },
        { label: 'O.S.', value: itemToDelete.os || '-' }
      ];
    } else if (category === 'plantio' && plantioData[index]) {
      itemToDelete = plantioData[index];
      itemLabel = `Plantio de ${itemToDelete.cultura} (${itemToDelete.fazenda})`;
      itemDetails = [
        { label: 'Data', value: itemToDelete.data },
        { label: 'Empresa', value: itemToDelete.empresa || '-' },
        { label: 'Cultura', value: itemToDelete.cultura },
        { label: 'OS', value: itemToDelete.os || '-' },
        { label: 'Fazenda', value: itemToDelete.fazenda },
        { label: 'HA/ Dia', value: itemToDelete.haDia || '-' },
        { label: 'Ano', value: itemToDelete.ano || '-' }
      ];
    } else if (category === 'variedades' && variedadesData[index]) {
      itemToDelete = variedadesData[index];
      itemLabel = `Variedade "${itemToDelete.nome}"`;
      itemDetails = [
        { label: 'Código', value: itemToDelete.codigo },
        { label: 'Nome', value: itemToDelete.nome },
        { label: 'Cultura', value: itemToDelete.cultura }
      ];
    } else if (category === 'empresas' && empresasData[index]) {
      itemToDelete = empresasData[index];
      itemLabel = `Empresa "${itemToDelete.nome}"`;
      itemDetails = [
        { label: 'Código', value: itemToDelete.codigo },
        { label: 'Nome da Empresa', value: itemToDelete.nome }
      ];
    } else if (category === 'anos' && anosData[index]) {
      itemToDelete = anosData[index];
      itemLabel = `Ano "${itemToDelete.nome}"`;
      itemDetails = [
        { label: 'Código', value: itemToDelete.codigo },
        { label: 'Ano', value: itemToDelete.nome }
      ];
    } else if (category === 'pivos' && pivosData[index]) {
      itemToDelete = pivosData[index];
      itemLabel = `Pivô "${itemToDelete.nome}"`;
      itemDetails = [
        { label: 'Código', value: itemToDelete.codigo },
        { label: 'Nome', value: itemToDelete.nome }
      ];
    } else if (category === 'glebas' && glebasData[index]) {
      itemToDelete = glebasData[index];
      itemLabel = `Gleba "${itemToDelete.nome}"`;
      itemDetails = [
        { label: 'Código', value: itemToDelete.codigo },
        { label: 'Nome', value: itemToDelete.nome }
      ];
    } else if (category === 'fazendas' && fazendasData[index]) {
      itemToDelete = fazendasData[index];
      itemLabel = `Fazenda "${itemToDelete.nome}"`;
      itemDetails = [
        { label: 'Código', value: itemToDelete.codigo },
        { label: 'Nome', value: itemToDelete.nome }
      ];
    } else if (category === 'culturas' && culturasData[index]) {
      itemToDelete = culturasData[index];
      itemLabel = `Cultura "${itemToDelete.nome}"`;
      itemDetails = [
        { label: 'Código', value: itemToDelete.codigo },
        { label: 'Nome', value: itemToDelete.nome }
      ];
    } else if (category === 'colaboradores' && colaboradoresData[index]) {
      itemToDelete = colaboradoresData[index];
      itemLabel = `o Colaborador "${itemToDelete.nome}"`;
      itemDetails = [
        { label: 'Matrícula', value: itemToDelete.codigo },
        { label: 'Nome', value: itemToDelete.nome },
        { label: 'Apontador', value: itemToDelete.apontador || '-' },
        { label: 'Local', value: itemToDelete.local || '-' },
        { label: 'Status', value: itemToDelete.status || 'Ativo' }
      ];
    } else if (category === 'motoristas' && motoristasData[index]) {
      itemToDelete = motoristasData[index];
      itemLabel = `o Motorista "${itemToDelete.nome}" (${itemToDelete.abreviacao})`;
      itemDetails = [
        { label: 'Código (Capa)', value: itemToDelete.codigo },
        { label: 'Nome Completo', value: itemToDelete.nome },
        { label: 'Abreviação', value: itemToDelete.abreviacao }
      ];
    } else if (category === 'onibus' && onibusData[index]) {
      itemToDelete = onibusData[index];
      itemLabel = `o Ônibus (Placa: "${itemToDelete.nome}")`;
      itemDetails = [
        { label: 'Código', value: itemToDelete.codigo },
        { label: 'Placa', value: itemToDelete.nome },
        { label: 'Cor', value: itemToDelete.cor || 'Branco' },
        { label: 'Motorista', value: itemToDelete.motorista || 'Nenhum' },
        { label: 'Local', value: itemToDelete.local || '-' },
        { label: 'Motorista Cooperado', value: itemToDelete.cooperado || 'Não' }
      ];
    }

    setConfirmModal({
      isOpen: true,
      title: 'Excluir Item',
      message: `Tem certeza de que deseja mover ${itemLabel} para a Lixeira?`,
      itemDetails,
      confirmText: 'Mover para Lixeira',
      confirmStyle: 'danger',
      isTrashMove: true,
      onConfirm: async () => {
        let collectionName = '';
        if (category === 'colheita') collectionName = COLLECTIONS.colheita;
        else if (category === 'plantio') collectionName = COLLECTIONS.plantio;
        else if (category === 'variedades') collectionName = COLLECTIONS.variedades;
        else if (category === 'empresas') collectionName = COLLECTIONS.empresas;
        else if (category === 'anos') collectionName = COLLECTIONS.anos;
        else if (category === 'pivos') collectionName = COLLECTIONS.pivos;
        else if (category === 'glebas') collectionName = COLLECTIONS.glebas;
        else if (category === 'fazendas') collectionName = COLLECTIONS.fazendas;
        else if (category === 'culturas') collectionName = COLLECTIONS.culturas;
        else if (category === 'colaboradores') collectionName = COLLECTIONS.colaboradores;
        else if (category === 'motoristas') collectionName = COLLECTIONS.motoristas;
        else if (category === 'onibus') collectionName = COLLECTIONS.onibus;

        if (itemToDelete?.id) {
          await removeDocument(collectionName, itemToDelete.id);
        }

        if (itemToDelete) {
          const now = new Date();
          const timeStr = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
          const newTrashEntry: TrashItem = {
            category,
            categoryName: titleMap[category],
            itemData: itemToDelete,
            deletedAt: timeStr
          };
          const savedTrashDoc = await saveDocument(COLLECTIONS.lixeira, newTrashEntry);

          // Immediate Undo Handler
          const handleUndo = async () => {
            await saveDocument(collectionName, itemToDelete);
            if (savedTrashDoc) {
              await removeDocument(COLLECTIONS.lixeira, savedTrashDoc);
            }
            showToast('Item restaurado com sucesso!', 'success');
          };

          showToast('Item movido para a Lixeira.', 'info', handleUndo);
        }
        setConfirmModal(null);
      }
    });
  };

  // Restore item from Trash
  const restoreFromTrash = async (id: string) => {
    const itemToRestore = trashData.find(t => t.id === id);
    if (!itemToRestore) return;

    const { category, itemData } = itemToRestore;
    let collectionName = '';
    if (category === 'colheita') collectionName = COLLECTIONS.colheita;
    else if (category === 'plantio') collectionName = COLLECTIONS.plantio;
    else if (category === 'variedades') collectionName = COLLECTIONS.variedades;
    else if (category === 'empresas') collectionName = COLLECTIONS.empresas;
    else if (category === 'anos') collectionName = COLLECTIONS.anos;
    else if (category === 'pivos') collectionName = COLLECTIONS.pivos;
    else if (category === 'glebas') collectionName = COLLECTIONS.glebas;
    else if (category === 'fazendas') collectionName = COLLECTIONS.fazendas;
    else if (category === 'culturas') collectionName = COLLECTIONS.culturas;
    else if (category === 'colaboradores') collectionName = COLLECTIONS.colaboradores;
    else if (category === 'motoristas') collectionName = COLLECTIONS.motoristas;
    else if (category === 'onibus') collectionName = COLLECTIONS.onibus;

    await saveDocument(collectionName, itemData);
    if (id) {
      await removeDocument(COLLECTIONS.lixeira, id);
    }
    showToast('Item restaurado da Lixeira com sucesso!', 'success');
  };

  // Delete permanently from Trash with confirmation modal
  const deletePermanently = (id: string) => {
    const trashItem = trashData.find(t => t.id === id);
    const name = trashItem?.itemData?.nome || trashItem?.itemData?.cultura || 'este item';

    setConfirmModal({
      isOpen: true,
      title: 'Excluir Definitivamente',
      message: `Tem certeza de que deseja excluir "${name}" permanentemente?`,
      itemDetails: trashItem ? [
        { label: 'Categoria', value: trashItem.categoryName },
        { label: 'Excluído em', value: trashItem.deletedAt }
      ] : [],
      confirmText: 'Excluir Definitivamente',
      confirmStyle: 'danger',
      isTrashMove: false,
      onConfirm: async () => {
        if (id) {
          await removeDocument(COLLECTIONS.lixeira, id);
        }
        showToast('Item excluído permanentemente!', 'warning');
        setConfirmModal(null);
      }
    });
  };

  // Empty trash for category with confirmation modal
  const emptyTrashForCategory = (cat: MainCategoryKey) => {
    const targetItems = trashData.filter(t => t.category === cat && isItemInSelectedUnidade(t.itemData));

    setConfirmModal({
      isOpen: true,
      title: 'Esvaziar Lixeira',
      message: `Tem certeza de que deseja excluir definitivamente todos os ${targetItems.length} itens da lixeira de ${titleMap[cat]}?`,
      confirmText: 'Esvaziar Lixeira',
      confirmStyle: 'danger',
      isTrashMove: false,
      onConfirm: async () => {
        for (const item of targetItems) {
          if (item.id) {
            await removeDocument(COLLECTIONS.lixeira, item.id);
          }
        }
        showToast('Lixeira desta categoria esvaziada com sucesso!', 'warning');
        setConfirmModal(null);
      }
    });
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = editingIndex !== null;

    try {
      if (activePage === 'colheita') {
        const cCult = (formData.cCultura || '').trim().toLowerCase();
        const cFaz = (formData.cFazenda || '').trim().toLowerCase();
        const unitPlantio = plantioData.filter(isItemInSelectedUnidade);
        if (unitPlantio.length > 0) {
          const hasMatchingPlantio = unitPlantio.some(p => {
            const matchCult = !cCult || (p.cultura || '').trim().toLowerCase() === cCult;
            const matchFaz = !cFaz || (p.fazenda || '').trim().toLowerCase() === cFaz;
            return matchCult && matchFaz;
          });

          if (!hasMatchingPlantio) {
            showToast('Não é possível salvar: não existe registro de plantio para esta Cultura e Fazenda.', 'warning');
            return;
          }
        }

        const existingDoc = editingIndex !== null ? colheitaData[editingIndex] : null;
        const newItem: ColheitaItem = {
          data: inputToDisplayFormat(formData.cData || ''),
          empresa: formData.cEmpresa || '-',
          cultura: formData.cCultura || '',
          os: formData.cOs || '-',
          fazenda: formData.cFazenda || '',
          pivo: formData.cPivo || '-',
          gleba: formData.cGleba || '-',
          variedade: formData.cVariedade || '-',
          haDia: formData.cHaDia || '-',
          haGeral: formData.cHaGeral || '-',
          haRestante: formData.cHaRestante || '-',
          qtdColhido: formData.cQtdColhido || formData.cCaixasCortadas || '-',
          glebasFinalizada: formData.cGlebasFinalizada || '-',
          mediaHa: formData.cMediaHa || '-',
          mes: formData.cMes || getMonthNameFromDate(formData.cData || '') || '-',
          ano: formData.cAno || getYearFromDate(formData.cData || '') || '-',
          caixasCortadas: formData.cQtdColhido || formData.cCaixasCortadas || '-',
          unidade: editingIndex !== null ? (colheitaData[editingIndex]?.unidade || selectedUnidade) : selectedUnidade
        };

        await saveDocument(COLLECTIONS.colheita, newItem, existingDoc?.id);
      } else if (activePage === 'plantio') {
        const existingDoc = editingIndex !== null ? plantioData[editingIndex] : null;
        const newItem: PlantioItem = {
          data: inputToDisplayFormat(formData.pData || ''),
          empresa: formData.pEmpresa || '-',
          cultura: formData.pCultura || '',
          os: formData.pOs || '-',
          fazenda: formData.pFazenda || '',
          pivo: formData.pPivo || '-',
          gleba: formData.pGleba || '-',
          variedade: formData.pVariedade || '-',
          haGeral: formData.pHaGeral || '-',
          haDia: formData.pHaDia || '-',
          haRestante: formData.pHaRestante || '-',
          glebasFinalizada: formData.pGlebasFinalizada || '-',
          mediaHa: formData.pMediaHa || '-',
          ano: formData.pAno || '-',
          unidade: editingIndex !== null ? (plantioData[editingIndex]?.unidade || selectedUnidade) : selectedUnidade
        };

        await saveDocument(COLLECTIONS.plantio, newItem, existingDoc?.id);
      } else if (activePage === 'variedades') {
        let code = (formData.autoCode || '').trim();
        if (!code) code = getNextAutoCodeForPage('variedades');
        if (!/^\d+$/.test(code)) {
          showToast('O código deve conter apenas números.', 'warning');
          return;
        }
        const isDuplicate = variedadesData.some((v, i) => i !== editingIndex && isItemInSelectedUnidade(v) && v.codigo.trim() === code);
        if (isDuplicate) {
          showToast(`O código '${code}' já está cadastrado em Variedades.`, 'warning');
          return;
        }

        const existingDoc = editingIndex !== null ? variedadesData[editingIndex] : null;
        const newItem: VariedadeItem = {
          codigo: code,
          nome: (formData.simpleName || '').trim(),
          cultura: formData.vCultura || (culturasData.filter(isItemInSelectedUnidade)[0]?.nome || '-'),
          unidade: editingIndex !== null ? (variedadesData[editingIndex]?.unidade || selectedUnidade) : selectedUnidade
        };

        await saveDocument(COLLECTIONS.variedades, newItem, existingDoc?.id);
      } else if (activePage === 'colaboradores') {
        let code = (formData.autoCode || '').trim();
        if (!code) code = getNextAutoCodeForPage('colaboradores');
        if (!/^\d+$/.test(code)) {
          showToast('A matrícula deve conter apenas números.', 'warning');
          return;
        }
        const isDuplicate = colaboradoresData.some((v, i) => i !== editingIndex && isItemInSelectedUnidade(v) && v.codigo.trim() === code);
        if (isDuplicate) {
          showToast(`A matrícula '${code}' já está cadastrada em Colaboradores.`, 'warning');
          return;
        }

        const existingDoc = editingIndex !== null ? colaboradoresData[editingIndex] : null;
        const newItem: ColaboradorItem = {
          codigo: code,
          nome: (formData.nomeCompleto || '').trim(),
          apontador: (formData.cApontador || '').trim() || '-',
          local: formData.cLocal || '-',
          status: formData.cStatus || 'Ativo',
          abreviacao: (formData.nomeCompleto || '').trim().split(' ')[0],
          unidade: editingIndex !== null ? (colaboradoresData[editingIndex]?.unidade || selectedUnidade) : selectedUnidade
        };

        await saveDocument(COLLECTIONS.colaboradores, newItem, existingDoc?.id);
      } else if (activePage === 'motoristas') {
        let code = (formData.autoCode || '').trim();
        if (!code) code = getNextAutoCodeForPage('motoristas');
        if (!/^\d+$/.test(code)) {
          showToast('O código deve conter apenas números.', 'warning');
          return;
        }
        const isDuplicate = motoristasData.some((v, i) => i !== editingIndex && isItemInSelectedUnidade(v) && v.codigo.trim() === code);
        if (isDuplicate) {
          showToast(`O código '${code}' já está cadastrado em Motoristas.`, 'warning');
          return;
        }

        const existingDoc = editingIndex !== null ? motoristasData[editingIndex] : null;
        const newItem: MotoristaItem = {
          codigo: code,
          nome: (formData.nomeCompleto || '').trim(),
          abreviacao: (formData.abreviacao || '').trim(),
          unidade: editingIndex !== null ? (motoristasData[editingIndex]?.unidade || selectedUnidade) : selectedUnidade
        };

        await saveDocument(COLLECTIONS.motoristas, newItem, existingDoc?.id);
      } else if (activePage === 'onibus') {
        let code = (formData.autoCode || '').trim();
        if (!code) code = getNextAutoCodeForPage('onibus');
        if (!/^\d+$/.test(code)) {
          showToast('O código deve conter apenas números.', 'warning');
          return;
        }
        const isDuplicate = onibusData.some((v, i) => i !== editingIndex && isItemInSelectedUnidade(v) && v.codigo.trim() === code);
        if (isDuplicate) {
          showToast(`O código '${code}' já está cadastrado em Ônibus.`, 'warning');
          return;
        }

        const placa = (formData.nomeOnibus || '').trim().toUpperCase();
        if (!isValidPlacaBus(placa)) {
          showToast('Informe uma placa válida no padrão tradicional (ex: GMJ-5434) ou Mercosul (ex: GMJ-5F34).', 'warning');
          return;
        }

        const existingDoc = editingIndex !== null ? onibusData[editingIndex] : null;
        const newItem: OnibusItem = {
          codigo: code,
          nome: placa,
          cor: (formData.corOnibus || '').trim() || 'Branco',
          motorista: formData.oMotorista || '-',
          local: formData.oLocal || '-',
          cooperado: formData.oCooperado || 'Não',
          unidade: editingIndex !== null ? (onibusData[editingIndex]?.unidade || selectedUnidade) : selectedUnidade
        };

        await saveDocument(COLLECTIONS.onibus, newItem, existingDoc?.id);
      } else {
        let code = (formData.autoCode || '').trim();
        if (!code) code = getNextAutoCodeForPage(activePage);
        if (!/^\d+$/.test(code)) {
          showToast('O código deve conter apenas números.', 'warning');
          return;
        }

        let currentList: SimpleItem[] = [];
        let collectionName = '';
        if (activePage === 'pivos') { currentList = pivosData; collectionName = COLLECTIONS.pivos; }
        else if (activePage === 'glebas') { currentList = glebasData; collectionName = COLLECTIONS.glebas; }
        else if (activePage === 'fazendas') { currentList = fazendasData; collectionName = COLLECTIONS.fazendas; }
        else if (activePage === 'culturas') { currentList = culturasData; collectionName = COLLECTIONS.culturas; }
        else if (activePage === 'empresas') { currentList = empresasData; collectionName = COLLECTIONS.empresas; }
        else if (activePage === 'anos') { currentList = anosData; collectionName = COLLECTIONS.anos; }

        const isDuplicate = currentList.some((v, i) => i !== editingIndex && isItemInSelectedUnidade(v) && v.codigo.trim() === code);
        if (isDuplicate) {
          showToast(`O código '${code}' já está cadastrado nesta lista.`, 'warning');
          return;
        }

        const existingItem = editingIndex !== null ? currentList[editingIndex] : null;
        const newItem: SimpleItem = {
          codigo: code,
          nome: (formData.simpleName || '').trim(),
          ...(activePage === 'culturas' 
            ? { tipo: (formData.cTipoCultura as 'Hortifruti' | 'Cereais') || 'Hortifruti' }
            : (existingItem?.tipo ? { tipo: existingItem.tipo } : {})),
          unidade: existingItem?.unidade || selectedUnidade
        };

        await saveDocument(collectionName, newItem, existingItem?.id);
      }

      closeModal();
      showToast(isEdit ? 'Item atualizado com sucesso!' : 'Novo item salvo com sucesso!', 'success');
    } catch (err: any) {
      console.error("Erro ao salvar documento:", err);
      showToast(`Erro ao salvar item: ${err?.message || 'Falha na conexão com o banco de dados.'}`, 'warning');
    }
  };

  // Inline cell edit in Grid Mode
  const updateGridCell = async (page: PageKey, rowIndex: number, fieldKey: string, value: string) => {
    const trimmed = value.trim();

    if (fieldKey === 'codigo') {
      if (!/^\d+$/.test(trimmed)) {
        showToast('O código deve conter apenas números.', 'warning');
        return;
      }
      let list: { codigo: string; unidade?: string }[] = [];
      if (page === 'variedades') list = variedadesData;
      else if (page === 'colaboradores') list = colaboradoresData;
      else if (page === 'motoristas') list = motoristasData;
      else if (page === 'onibus') list = onibusData;
      else if (page === 'pivos') list = pivosData;
      else if (page === 'glebas') list = glebasData;
      else if (page === 'fazendas') list = fazendasData;
      else if (page === 'culturas') list = culturasData;
      else if (page === 'empresas') list = empresasData;
      else if (page === 'anos') list = anosData;

      if (list.some((item, i) => i !== rowIndex && isItemInSelectedUnidade(item) && item.codigo.trim() === trimmed)) {
        showToast(`O código '${trimmed}' já existe nesta lista.`, 'warning');
        return;
      }
    }

    if (page === 'colheita') {
      const item = colheitaData[rowIndex];
      if (!item) return;
      const finalVal = ['haGeral', 'haDia', 'haRestante', 'mediaHa'].includes(fieldKey) ? sanitizeHectaresInput(value) : value;
      const updated = { ...item, [fieldKey]: finalVal };
      if (fieldKey === 'haDia' || fieldKey === 'qtdColhido' || fieldKey === 'caixasCortadas') {
        updated.mediaHa = calculateMediaHaForColheita(updated.qtdColhido || updated.caixasCortadas || updated.caixaBinBag, updated.haDia);
      }
      await saveDocument(COLLECTIONS.colheita, updated, item.id);
    } else if (page === 'plantio') {
      const item = plantioData[rowIndex];
      if (!item) return;
      const finalVal = ['haGeral', 'haDia', 'haRestante', 'mediaHa'].includes(fieldKey) ? sanitizeHectaresInput(value) : value;
      const updated = { ...item, [fieldKey]: finalVal };
      await saveDocument(COLLECTIONS.plantio, updated, item.id);
    } else if (page === 'variedades') {
      const item = variedadesData[rowIndex];
      if (!item) return;
      await saveDocument(COLLECTIONS.variedades, { ...item, [fieldKey]: value }, item.id);
    } else if (page === 'colaboradores') {
      const item = colaboradoresData[rowIndex];
      if (!item) return;
      await saveDocument(COLLECTIONS.colaboradores, { ...item, [fieldKey]: value }, item.id);
    } else if (page === 'motoristas') {
      const item = motoristasData[rowIndex];
      if (!item) return;
      await saveDocument(COLLECTIONS.motoristas, { ...item, [fieldKey]: value }, item.id);
    } else if (page === 'onibus') {
      const item = onibusData[rowIndex];
      if (!item) return;
      let finalVal = value;
      if (fieldKey === 'nome') {
        finalVal = formatPlacaBus(value);
        if (value.trim() && !isValidPlacaBus(finalVal)) {
          showToast('Placa inválida. Use o padrão tradicional (ex: GMJ-5434) ou Mercosul (ex: GMJ-5F34).', 'warning');
          return;
        }
      }
      await saveDocument(COLLECTIONS.onibus, { ...item, [fieldKey]: finalVal }, item.id);
    } else if (page === 'pivos') {
      const item = pivosData[rowIndex];
      if (item) await saveDocument(COLLECTIONS.pivos, { ...item, [fieldKey]: value }, item.id);
    } else if (page === 'glebas') {
      const item = glebasData[rowIndex];
      if (item) await saveDocument(COLLECTIONS.glebas, { ...item, [fieldKey]: value }, item.id);
    } else if (page === 'fazendas') {
      const item = fazendasData[rowIndex];
      if (item) await saveDocument(COLLECTIONS.fazendas, { ...item, [fieldKey]: value }, item.id);
    } else if (page === 'culturas') {
      const item = culturasData[rowIndex];
      if (item) await saveDocument(COLLECTIONS.culturas, { ...item, [fieldKey]: value }, item.id);
    } else if (page === 'empresas') {
      const item = empresasData[rowIndex];
      if (item) await saveDocument(COLLECTIONS.empresas, { ...item, [fieldKey]: value }, item.id);
    } else if (page === 'anos') {
      const item = anosData[rowIndex];
      if (item) await saveDocument(COLLECTIONS.anos, { ...item, [fieldKey]: value }, item.id);
    }
  };

  // Render column filter icon status
  const isColFiltered = (colIndex: number) => {
    return !!(columnFilters[activePage] && columnFilters[activePage][colIndex]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#ffffff', color: '#323130', fontSize: '13px' }}>
      
      {/* BARRA SUPERIOR */}
      <div className="topbar">
        <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button className="btn-toggle-menu" onClick={toggleSidebar} aria-label="Abrir Menu">
            <i className="fa-solid fa-bars"></i>
          </button>
          <button
            className="btn-6-dots"
            onClick={() => setIsAmarracoesWindowOpen(true)}
            title="Abrir Janela de Marcações e Amarrações (6 pontinhos)"
            style={{
              backgroundColor: isAmarracoesWindowOpen ? '#0078d4' : 'transparent',
              color: isAmarracoesWindowOpen ? '#ffffff' : '#323130',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 8px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <i className="fa-solid fa-grip-vertical" style={{ fontSize: '16px' }}></i>
          </button>
        </div>

        <div className="search-box-container">
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              id="globalSearch"
              placeholder="Pesquisar nesta lista"
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="topbar-right">
          <i className="fa-regular fa-bell"></i>
          <i className="fa-solid fa-gear"></i>
          <div className="user-avatar">R</div>
        </div>
      </div>

      {/* LAYOUT PRINCIPAL */}
      <div className="app-layout">
        <div
          className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
          id="sidebarOverlay"
          onClick={closeSidebar}
        ></div>

        {/* MINI BARRA M365 (DESKTOP) */}
        <div className="left-mini-bar">
          <div className="mini-bar-item"><i className="fa-regular fa-compass"></i><span>Descubra</span></div>
          <div className="mini-bar-item"><i className="fa-regular fa-file-lines"></i><span>Publicar</span></div>
          <div className="mini-bar-item"><i className="fa-regular fa-folder-open"></i><span>Compilar</span></div>
          <div className="mini-bar-item"><i className="fa-cloud"></i><span>OneDrive</span></div>
        </div>

        {/* MENU LATERAL */}
        <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`} id="sidebar">
          <div className="sidebar-title">Navegação</div>
          <div
            className="sidebar-item"
            onClick={() => { closeSidebar(); setIsAmarracoesWindowOpen(true); }}
            style={{
              fontWeight: 400,
              backgroundColor: 'transparent',
              color: '#323130',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '4px',
              marginBottom: '6px',
              cursor: 'pointer'
            }}
          >
            <i className="fa-solid fa-grip-vertical" style={{ color: '#0078d4' }}></i>
            <span>Marcações e Amarrações</span>
          </div>
          <div className={`sidebar-item ${activePage === 'plantio' ? 'active' : ''}`} onClick={() => switchPage('plantio')}>BdPlantio</div>
          <div className={`sidebar-item ${activePage === 'colheita' ? 'active' : ''}`} onClick={() => switchPage('colheita')}>BdColheita</div>
          <div className={`sidebar-item ${activePage === 'empresas' ? 'active' : ''}`} onClick={() => switchPage('empresas')}>Cadastro_Empresas</div>
          <div className={`sidebar-item ${activePage === 'anos' ? 'active' : ''}`} onClick={() => switchPage('anos')}>Cadastro_Anos</div>
          <div className={`sidebar-item ${activePage === 'fazendas' ? 'active' : ''}`} onClick={() => switchPage('fazendas')}>Cadastro_Fazendas</div>
          <div className={`sidebar-item ${activePage === 'pivos' ? 'active' : ''}`} onClick={() => switchPage('pivos')}>Cadastro_Pivos</div>
          <div className={`sidebar-item ${activePage === 'glebas' ? 'active' : ''}`} onClick={() => switchPage('glebas')}>Cadastro_Glebas</div>
          <div className={`sidebar-item ${activePage === 'variedades' ? 'active' : ''}`} onClick={() => switchPage('variedades')}>Cadastro_Variedades</div>
          <div className={`sidebar-item ${activePage === 'culturas' ? 'active' : ''}`} onClick={() => switchPage('culturas')}>Cadastro_Culturas</div>
          <div className="sidebar-item">Documentos</div>
          <div className="sidebar-item">Ciclos_Cultivo</div>
          <div className={`sidebar-item ${activePage === 'colaboradores' ? 'active' : ''}`} onClick={() => switchPage('colaboradores')}>
            <i className="fa-solid fa-id-card-clip" style={{ marginRight: '8px' }}></i>Cadastro_Colaboradores
          </div>
          <div className={`sidebar-item ${activePage === 'onibus' ? 'active' : ''}`} onClick={() => switchPage('onibus')}>
            <i className="fa-solid fa-bus" style={{ marginRight: '8px' }}></i>Cadastro_Onibus
          </div>
          <div className={`sidebar-item ${activePage === 'motoristas' ? 'active' : ''}`} onClick={() => switchPage('motoristas')}>
            <i className="fa-solid fa-user-gear" style={{ marginRight: '8px' }}></i>Cadastro_Motoristas
          </div>
          <div className="sidebar-item">TbFrentesTrabalho_APS...</div>
          <div className="sidebar-item">TbApontamentos_APSa...</div>
          <div className="sidebar-item">TbApontamentosSafris...</div>
          <div
            className={`sidebar-item ${activePage === 'lixeira' ? 'active' : ''}`}
            onClick={() => switchPage('lixeira')}
            style={{
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontWeight: activePage === 'lixeira' ? 600 : 400
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-trash-can"></i> Lixeira
            </span>
            {(() => {
              const unidadeTrashCount = trashData.filter(t => isItemInSelectedUnidade(t.itemData)).length;
              if (unidadeTrashCount === 0) return null;
              return (
                <span style={{
                  backgroundColor: '#d13438',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '10px'
                }}>
                  {unidadeTrashCount}
                </span>
              );
            })()}
          </div>
        </div>

        {/* ÁREA PRINCIPAL */}
        <div className="main-area">

          <div className="list-header">
            <div
              className="list-header-left"
              onClick={() => setShowUnidadeModal(true)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
              title="Clique para alternar de unidade"
            >
              <div className="list-icon-bg" style={{ userSelect: 'none' }}>
                {getUnitInitials(selectedUnidade)}
              </div>
              <div className="list-title-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{selectedUnidade} - Controle Agricola Apontadores</span>
                <i className="fa-solid fa-chevron-down" style={{ fontSize: '12px', color: '#605e5c' }}></i>
              </div>
            </div>
            <div className="list-header-right">
              <span>Grupo privado</span> • <span><i className="fa-regular fa-user"></i> 30 membros</span>
            </div>
          </div>

          {/* HORIZONTAL CATEGORY NAVIGATION TABS */}
          <div className="top-category-tabs" style={{
            display: 'flex',
            gap: '2px',
            overflowX: 'auto',
            padding: '6px 16px 0 16px',
            backgroundColor: '#faf9f8',
            borderBottom: '1px solid #e1dfdd',
            scrollbarWidth: 'thin'
          }}>
            {mainCategories.map(cat => (
              <button
                key={cat.key}
                onClick={() => switchPage(cat.key)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '4px 4px 0 0',
                  border: '1px solid',
                  borderColor: activePage === cat.key ? '#e1dfdd #e1dfdd #ffffff #e1dfdd' : 'transparent',
                  borderBottom: activePage === cat.key ? '3px solid #0078d4' : '3px solid transparent',
                  backgroundColor: activePage === cat.key ? '#ffffff' : 'transparent',
                  color: activePage === cat.key ? '#0078d4' : '#605e5c',
                  fontWeight: activePage === cat.key ? 600 : 400,
                  fontSize: '12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat.label}
              </button>
            ))}
            {(() => {
              const unidadeTrashCount = trashData.filter(t => isItemInSelectedUnidade(t.itemData)).length;
              return (
                <button
                  onClick={() => switchPage('lixeira')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '4px 4px 0 0',
                    border: '1px solid',
                    borderColor: activePage === 'lixeira' ? '#e1dfdd #e1dfdd #ffffff #e1dfdd' : 'transparent',
                    borderBottom: activePage === 'lixeira' ? '3px solid #d13438' : '3px solid transparent',
                    backgroundColor: activePage === 'lixeira' ? '#ffffff' : 'transparent',
                    color: activePage === 'lixeira' ? '#d13438' : '#605e5c',
                    fontWeight: activePage === 'lixeira' ? 600 : 400,
                    fontSize: '12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <i className="fa-solid fa-trash-can"></i> Lixeira {unidadeTrashCount > 0 && `(${unidadeTrashCount})`}
                </button>
              );
            })()}
          </div>

          <div className="command-bar">
            <button className="btn-add-item" onClick={() => openCurrentModal()} style={{ display: activePage === 'lixeira' ? 'none' : 'inline-flex' }}>
              <i className="fa-solid fa-plus"></i> Adicionar novo item
            </button>

            <button className={`cmd-btn ${isGridEditing ? 'active-mode' : ''}`} id="btnGridMode" onClick={toggleGridMode}>
              <i className="fa-solid fa-table-cells"></i> <span id="gridBtnText">{isGridEditing ? 'Sair da Grade' : 'Modo grade'}</span>
            </button>

            <button className="cmd-btn" onClick={openShareOptions}>
              <i className="fa-solid fa-share-nodes"></i> Compartilhar
            </button>

            <button className="cmd-btn" onClick={exportToCSV}>
              <i className="fa-solid fa-file-export"></i> Exportar
            </button>

            <button className="cmd-btn" onClick={() => window.print()}>
              <i className="fa-solid fa-print"></i> Imprimir
            </button>
          </div>

          <div className="sub-bar">
            <div className="sub-title" id="pageSubTitle">{titleMap[activePage]}</div>
            <div className="sub-controls">
              <button
                className="btn-clear-filters"
                id="btnClearFilters"
                style={{ display: hasActiveFilters ? 'inline-block' : 'none' }}
                onClick={resetPageFilters}
              >
                <i className="fa-solid fa-xmark"></i> Limpar Filtros
              </button>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#323130', fontWeight: 500 }}>
                  Todos os Itens <i className="fa-solid fa-chevron-down" style={{ fontSize: '10px' }}></i>
                </span>
                <select
                  id="selectSortMode"
                  value={sortMode}
                  onChange={e => setSortMode(e.target.value as SortMode)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                  title="Ordenar Todos os Itens"
                >
                  <option value="code_asc">Código: Menor ➔ Maior (Padrão)</option>
                  <option value="code_desc">Código: Maior ➔ Menor</option>
                  <option value="alpha_asc">De A a Z</option>
                  <option value="alpha_desc">De Z a A</option>
                </select>
              </div>
            </div>
          </div>

          {/* PAGE COLHEITA */}
          <div id="pageColheita" className={`page-section ${activePage === 'colheita' ? 'active' : ''}`}>
            <div className="table-container">
              <table id="tableColheita" className={`table-large ${isGridEditing ? 'grid-editing' : ''}`}>
                <thead>
                  <tr>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>DATA</strong> <button className={`btn-filter-col ${isColFiltered(0) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 0)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>EMPRESA</strong> <button className={`btn-filter-col ${isColFiltered(1) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 1)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>CULTURA</strong> <button className={`btn-filter-col ${isColFiltered(2) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 2)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>OS</strong> <button className={`btn-filter-col ${isColFiltered(3) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 3)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>FAZENDA</strong> <button className={`btn-filter-col ${isColFiltered(4) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 4)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>PIVÔ</strong> <button className={`btn-filter-col ${isColFiltered(5) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 5)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>GLEBA</strong> <button className={`btn-filter-col ${isColFiltered(6) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 6)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>VARIEDADE</strong> <button className={`btn-filter-col ${isColFiltered(7) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 7)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>HA/DIA</strong> <button className={`btn-filter-col ${isColFiltered(8) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 8)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>HA/GERAL</strong> <button className={`btn-filter-col ${isColFiltered(9) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 9)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>HA/RESTA</strong> <button className={`btn-filter-col ${isColFiltered(10) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 10)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>QTD: COLHIDO</strong> <button className={`btn-filter-col ${isColFiltered(11) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 11)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>FINALIZADA</strong> <button className={`btn-filter-col ${isColFiltered(12) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 12)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>MÉDIA/HA</strong> <button className={`btn-filter-col ${isColFiltered(13) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 13)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>MÊS</strong> <button className={`btn-filter-col ${isColFiltered(14) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 14)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>ANO</strong> <button className={`btn-filter-col ${isColFiltered(15) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 15)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th style={{ textAlign: 'center', fontWeight: 700, textTransform: 'uppercase' }}><strong>AÇÕES</strong></th>
                  </tr>
                </thead>
                <tbody id="tbodyColheita">
                  {getSortedList(colheitaData).map(({ item, originalIndex: idx }) => {
                    if (!isItemInSelectedUnidade(item)) return null;
                    const rowCells = [item.data, item.empresa || '-', item.cultura, item.os || '-', item.fazenda, item.pivo || '-', item.gleba || '-', item.variedade || '-', item.haDia || '-', item.haGeral || '-', item.haRestante || '-', item.qtdColhido || item.caixasCortadas || item.caixaBinBag || '-', item.glebasFinalizada || '-', item.mediaHa || '-', item.mes || '-', item.ano || '-'];
                    if (!isRowVisible(rowCells)) return null;

                    return (
                      <tr key={idx}>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'data', e.currentTarget.innerText)}>{item.data}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'empresa', e.currentTarget.innerText)}>{item.empresa || '-'}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'cultura', e.currentTarget.innerText)}>{item.cultura}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'os', e.currentTarget.innerText)}>{item.os || '-'}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'fazenda', e.currentTarget.innerText)}>{item.fazenda}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'pivo', e.currentTarget.innerText)}>{item.pivo || '-'}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'gleba', e.currentTarget.innerText)}>{item.gleba || '-'}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'variedade', e.currentTarget.innerText)}>{item.variedade || '-'}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'haDia', e.currentTarget.innerText)}>{item.haDia || '-'}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'haGeral', e.currentTarget.innerText)}>{item.haGeral || '-'}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'haRestante', e.currentTarget.innerText)}>{item.haRestante || '-'}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'qtdColhido', e.currentTarget.innerText)}>{item.qtdColhido || item.caixasCortadas || item.caixaBinBag || '-'}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'glebasFinalizada', e.currentTarget.innerText)}>{item.glebasFinalizada || '-'}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'mediaHa', e.currentTarget.innerText)}>{item.mediaHa || '-'}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'mes', e.currentTarget.innerText)}>{item.mes || '-'}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'ano', e.currentTarget.innerText)}>{item.ano || '-'}</td>
                        <td className="action-cell">
                          <button className="btn-action-row" onClick={() => openCurrentModal(rowCells, idx)} title="Editar"><i className="fa-solid fa-pen"></i></button>
                          <button className="btn-action-row" onClick={() => deleteRow('colheita', idx)} title="Mover para Lixeira"><i className="fa-solid fa-trash"></i></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGE PLANTIO */}
          <div id="pagePlantio" className={`page-section ${activePage === 'plantio' ? 'active' : ''}`}>
            <div className="table-container">
              <table id="tablePlantio" className={`table-large ${isGridEditing ? 'grid-editing' : ''}`}>
                <thead>
                  <tr>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>DATA</strong> <button className={`btn-filter-col ${isColFiltered(0) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 0)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>EMPRESA</strong> <button className={`btn-filter-col ${isColFiltered(1) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 1)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>CULTURA</strong> <button className={`btn-filter-col ${isColFiltered(2) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 2)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>OS</strong> <button className={`btn-filter-col ${isColFiltered(3) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 3)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>FAZENDA</strong> <button className={`btn-filter-col ${isColFiltered(4) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 4)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>PIVÔ</strong> <button className={`btn-filter-col ${isColFiltered(5) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 5)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>GLEBA</strong> <button className={`btn-filter-col ${isColFiltered(6) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 6)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>VARIEDADE</strong> <button className={`btn-filter-col ${isColFiltered(7) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 7)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>HA/ DIA</strong> <button className={`btn-filter-col ${isColFiltered(8) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 8)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>HA RESTANTE</strong> <button className={`btn-filter-col ${isColFiltered(9) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 9)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>GLEBAS FINALIZADA</strong> <button className={`btn-filter-col ${isColFiltered(10) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 10)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>MÉDIA HA</strong> <button className={`btn-filter-col ${isColFiltered(11) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 11)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content" style={{ fontWeight: 700, textTransform: 'uppercase' }}><strong>ANO</strong> <button className={`btn-filter-col ${isColFiltered(12) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 12)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th style={{ textAlign: 'center', fontWeight: 700, textTransform: 'uppercase' }}><strong>AÇÕES</strong></th>
                  </tr>
                </thead>
                <tbody id="tbodyPlantio">
                  {getSortedList(plantioData).map(({ item, originalIndex: idx }) => {
                    if (!isItemInSelectedUnidade(item)) return null;
                    const rowCells = [item.data, item.empresa || '-', item.cultura, item.os || '-', item.fazenda, item.pivo || '-', item.gleba || '-', item.variedade || '-', item.haDia || '-', item.haRestante || '-', item.glebasFinalizada || '-', item.mediaHa || '-', item.ano || '-'];
                    if (!isRowVisible(rowCells)) return null;

                    return (
                      <tr key={idx}>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'data', e.currentTarget.innerText)}>{item.data}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'empresa', e.currentTarget.innerText)}>{item.empresa || '-'}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'cultura', e.currentTarget.innerText)}>{item.cultura}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'os', e.currentTarget.innerText)}>{item.os || '-'}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'fazenda', e.currentTarget.innerText)}>{item.fazenda}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'pivo', e.currentTarget.innerText)}>{item.pivo || '-'}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'gleba', e.currentTarget.innerText)}>{item.gleba || '-'}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'variedade', e.currentTarget.innerText)}>{item.variedade || '-'}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'haDia', e.currentTarget.innerText)}>{item.haDia || '-'}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'haRestante', e.currentTarget.innerText)}>{item.haRestante || '-'}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'glebasFinalizada', e.currentTarget.innerText)}>{item.glebasFinalizada || '-'}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'mediaHa', e.currentTarget.innerText)}>{item.mediaHa || '-'}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'ano', e.currentTarget.innerText)}>{item.ano || '-'}</td>
                        <td className="action-cell">
                          <button className="btn-action-row" onClick={() => openCurrentModal(rowCells, idx)} title="Editar"><i className="fa-solid fa-pen"></i></button>
                          <button className="btn-action-row" onClick={() => deleteRow('plantio', idx)} title="Mover para Lixeira"><i className="fa-solid fa-trash"></i></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGE VARIEDADES */}
          <div id="pageVariedades" className={`page-section ${activePage === 'variedades' ? 'active' : ''}`}>
            <div className="table-container">
              <table id="tableVariedades" className={`table-compact ${isGridEditing ? 'grid-editing' : ''}`} style={{ minWidth: '380px' }}>
                <thead>
                  <tr>
                    <th><div className="th-content">CÓDIGO <button className={`btn-filter-col ${isColFiltered(0) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 0)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content">NOME <button className={`btn-filter-col ${isColFiltered(1) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 1)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content">CULTURA <button className={`btn-filter-col ${isColFiltered(2) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 2)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th style={{ textAlign: 'center' }}>AÇÕES</th>
                  </tr>
                </thead>
                <tbody id="tbodyVariedades">
                  {getSortedList(variedadesData).map(({ item, originalIndex: idx }) => {
                    if (!isItemInSelectedUnidade(item)) return null;
                    const rowCells = [item.codigo, item.nome, item.cultura];
                    if (!isRowVisible(rowCells)) return null;

                    return (
                      <tr key={idx}>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('variedades', idx, 'codigo', e.currentTarget.innerText)}><strong>{item.codigo}</strong></td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('variedades', idx, 'nome', e.currentTarget.innerText)}>{item.nome}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('variedades', idx, 'cultura', e.currentTarget.innerText)}>{item.cultura}</td>
                        <td className="action-cell">
                          <button className="btn-action-row" onClick={() => openCurrentModal(rowCells, idx)} title="Editar"><i className="fa-solid fa-pen"></i></button>
                          <button className="btn-action-row" onClick={() => deleteRow('variedades', idx)} title="Mover para Lixeira"><i className="fa-solid fa-trash"></i></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGE PIVOS */}
          <div id="pagePivos" className={`page-section ${activePage === 'pivos' ? 'active' : ''}`}>
            <div className="table-container">
              <table id="tablePivos" className={`table-compact ${isGridEditing ? 'grid-editing' : ''}`}>
                <thead><tr><th><div className="th-content">CÓDIGO <button className={`btn-filter-col ${isColFiltered(0) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 0)}><i className="fa-solid fa-filter"></i></button></div></th><th><div className="th-content">NOME <button className={`btn-filter-col ${isColFiltered(1) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 1)}><i className="fa-solid fa-filter"></i></button></div></th><th style={{ textAlign: 'center' }}>AÇÕES</th></tr></thead>
                <tbody id="tbodyPivos">
                  {getSortedList(pivosData).map(({ item, originalIndex: idx }) => {
                    if (!isItemInSelectedUnidade(item)) return null;
                    const rowCells = [item.codigo, item.nome];
                    if (!isRowVisible(rowCells)) return null;

                    return (
                      <tr key={idx}>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('pivos', idx, 'codigo', e.currentTarget.innerText)}><strong>{item.codigo}</strong></td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('pivos', idx, 'nome', e.currentTarget.innerText)}>{item.nome}</td>
                        <td className="action-cell">
                          <button className="btn-action-row" onClick={() => openCurrentModal(rowCells, idx)} title="Editar"><i className="fa-solid fa-pen"></i></button>
                          <button className="btn-action-row" onClick={() => deleteRow('pivos', idx)} title="Mover para Lixeira"><i className="fa-solid fa-trash"></i></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGE GLEBAS */}
          <div id="pageGlebas" className={`page-section ${activePage === 'glebas' ? 'active' : ''}`}>
            <div className="table-container">
              <table id="tableGlebas" className={`table-compact ${isGridEditing ? 'grid-editing' : ''}`}>
                <thead><tr><th><div className="th-content">CÓDIGO <button className={`btn-filter-col ${isColFiltered(0) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 0)}><i className="fa-solid fa-filter"></i></button></div></th><th><div className="th-content">NOME <button className={`btn-filter-col ${isColFiltered(1) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 1)}><i className="fa-solid fa-filter"></i></button></div></th><th style={{ textAlign: 'center' }}>AÇÕES</th></tr></thead>
                <tbody id="tbodyGlebas">
                  {getSortedList(glebasData).map(({ item, originalIndex: idx }) => {
                    if (!isItemInSelectedUnidade(item)) return null;
                    const rowCells = [item.codigo, item.nome];
                    if (!isRowVisible(rowCells)) return null;

                    return (
                      <tr key={idx}>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('glebas', idx, 'codigo', e.currentTarget.innerText)}><strong>{item.codigo}</strong></td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('glebas', idx, 'nome', e.currentTarget.innerText)}>{item.nome}</td>
                        <td className="action-cell">
                          <button className="btn-action-row" onClick={() => openCurrentModal(rowCells, idx)} title="Editar"><i className="fa-solid fa-pen"></i></button>
                          <button className="btn-action-row" onClick={() => deleteRow('glebas', idx)} title="Mover para Lixeira"><i className="fa-solid fa-trash"></i></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGE FAZENDAS */}
          <div id="pageFazendas" className={`page-section ${activePage === 'fazendas' ? 'active' : ''}`}>
            <div className="table-container">
              <table id="tableFazendas" className={`table-compact ${isGridEditing ? 'grid-editing' : ''}`}>
                <thead><tr><th><div className="th-content">CÓDIGO <button className={`btn-filter-col ${isColFiltered(0) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 0)}><i className="fa-solid fa-filter"></i></button></div></th><th><div className="th-content">NOME <button className={`btn-filter-col ${isColFiltered(1) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 1)}><i className="fa-solid fa-filter"></i></button></div></th><th style={{ textAlign: 'center' }}>AÇÕES</th></tr></thead>
                <tbody id="tbodyFazendas">
                  {getSortedList(fazendasData).map(({ item, originalIndex: idx }) => {
                    if (!isItemInSelectedUnidade(item)) return null;
                    const rowCells = [item.codigo, item.nome];
                    if (!isRowVisible(rowCells)) return null;

                    return (
                      <tr key={idx}>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('fazendas', idx, 'codigo', e.currentTarget.innerText)}><strong>{item.codigo}</strong></td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('fazendas', idx, 'nome', e.currentTarget.innerText)}>{item.nome}</td>
                        <td className="action-cell">
                          <button className="btn-action-row" onClick={() => openCurrentModal(rowCells, idx)} title="Editar"><i className="fa-solid fa-pen"></i></button>
                          <button className="btn-action-row" onClick={() => deleteRow('fazendas', idx)} title="Mover para Lixeira"><i className="fa-solid fa-trash"></i></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGE CULTURAS */}
          <div id="pageCulturas" className={`page-section ${activePage === 'culturas' ? 'active' : ''}`}>
            <div className="table-container">
              <table id="tableCulturas" className={`table-compact ${isGridEditing ? 'grid-editing' : ''}`}>
                <thead>
                  <tr>
                    <th><div className="th-content">CÓDIGO <button className={`btn-filter-col ${isColFiltered(0) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 0)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content">NOME DA CULTURA <button className={`btn-filter-col ${isColFiltered(1) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 1)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content">TIPO / VINCULAÇÃO <button className={`btn-filter-col ${isColFiltered(2) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 2)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th style={{ textAlign: 'center' }}>AÇÕES</th>
                  </tr>
                </thead>
                <tbody id="tbodyCulturas">
                  {getSortedList(culturasData).map(({ item, originalIndex: idx }) => {
                    if (!isItemInSelectedUnidade(item)) return null;
                    const cType = item.tipo || 'Hortifruti';
                    const rowCells = [item.codigo, item.nome, cType];
                    if (!isRowVisible(rowCells)) return null;

                    return (
                      <tr key={idx}>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('culturas', idx, 'codigo', e.currentTarget.innerText)}><strong>{item.codigo}</strong></td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('culturas', idx, 'nome', e.currentTarget.innerText)}>{item.nome}</td>
                        <td>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '12px',
                            backgroundColor: cType === 'Hortifruti' ? '#dff6dd' : '#fff4ce',
                            color: cType === 'Hortifruti' ? '#107c41' : '#794b00',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}>
                            <i className={`fa-solid ${cType === 'Hortifruti' ? 'fa-apple-whole' : 'fa-wheat-awn'}`} style={{ fontSize: '11px' }}></i>
                            {cType} ({cType === 'Hortifruti' ? 'Glebas H' : 'Glebas C'})
                          </span>
                        </td>
                        <td className="action-cell">
                          <button className="btn-action-row" onClick={() => openCurrentModal(rowCells, idx)} title="Editar"><i className="fa-solid fa-pen"></i></button>
                          <button className="btn-action-row" onClick={() => deleteRow('culturas', idx)} title="Mover para Lixeira"><i className="fa-solid fa-trash"></i></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGE EMPRESAS */}
          <div id="pageEmpresas" className={`page-section ${activePage === 'empresas' ? 'active' : ''}`}>
            <div className="table-container">
              <table id="tableEmpresas" className={`table-compact ${isGridEditing ? 'grid-editing' : ''}`}>
                <thead><tr><th><div className="th-content">CÓDIGO <button className={`btn-filter-col ${isColFiltered(0) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 0)}><i className="fa-solid fa-filter"></i></button></div></th><th><div className="th-content">NOME DA EMPRESA <button className={`btn-filter-col ${isColFiltered(1) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 1)}><i className="fa-solid fa-filter"></i></button></div></th><th style={{ textAlign: 'center' }}>AÇÕES</th></tr></thead>
                <tbody id="tbodyEmpresas">
                  {getSortedList(empresasData).map(({ item, originalIndex: idx }) => {
                    if (!isItemInSelectedUnidade(item)) return null;
                    const rowCells = [item.codigo, item.nome];
                    if (!isRowVisible(rowCells)) return null;

                    return (
                      <tr key={idx}>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('empresas', idx, 'codigo', e.currentTarget.innerText)}><strong>{item.codigo}</strong></td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('empresas', idx, 'nome', e.currentTarget.innerText)}>{item.nome}</td>
                        <td className="action-cell">
                          <button className="btn-action-row" onClick={() => openCurrentModal(rowCells, idx)} title="Editar"><i className="fa-solid fa-pen"></i></button>
                          <button className="btn-action-row" onClick={() => deleteRow('empresas', idx)} title="Mover para Lixeira"><i className="fa-solid fa-trash"></i></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGE ANOS */}
          <div id="pageAnos" className={`page-section ${activePage === 'anos' ? 'active' : ''}`}>
            <div className="table-container">
              <table id="tableAnos" className={`table-compact ${isGridEditing ? 'grid-editing' : ''}`}>
                <thead><tr><th><div className="th-content">CÓDIGO <button className={`btn-filter-col ${isColFiltered(0) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 0)}><i className="fa-solid fa-filter"></i></button></div></th><th><div className="th-content">ANO <button className={`btn-filter-col ${isColFiltered(1) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 1)}><i className="fa-solid fa-filter"></i></button></div></th><th style={{ textAlign: 'center' }}>AÇÕES</th></tr></thead>
                <tbody id="tbodyAnos">
                  {getSortedList(anosData).map(({ item, originalIndex: idx }) => {
                    if (!isItemInSelectedUnidade(item)) return null;
                    const rowCells = [item.codigo, item.nome];
                    if (!isRowVisible(rowCells)) return null;

                    return (
                      <tr key={idx}>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('anos', idx, 'codigo', e.currentTarget.innerText)}><strong>{item.codigo}</strong></td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('anos', idx, 'nome', e.currentTarget.innerText)}>{item.nome}</td>
                        <td className="action-cell">
                          <button className="btn-action-row" onClick={() => openCurrentModal(rowCells, idx)} title="Editar"><i className="fa-solid fa-pen"></i></button>
                          <button className="btn-action-row" onClick={() => deleteRow('anos', idx)} title="Mover para Lixeira"><i className="fa-solid fa-trash"></i></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGE COLABORADORES */}
          <div id="pageColaboradores" className={`page-section ${activePage === 'colaboradores' ? 'active' : ''}`}>
            <div className="table-container">
              <table id="tableColaboradores" className={`table-compact ${isGridEditing ? 'grid-editing' : ''}`}>
                <thead>
                  <tr>
                    <th><div className="th-content">MATRÍCULA <button className={`btn-filter-col ${isColFiltered(0) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 0)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content">NOME <button className={`btn-filter-col ${isColFiltered(1) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 1)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content">APONTADOR <button className={`btn-filter-col ${isColFiltered(2) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 2)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content">LOCAL <button className={`btn-filter-col ${isColFiltered(3) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 3)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content">STATUS <button className={`btn-filter-col ${isColFiltered(4) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 4)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th style={{ textAlign: 'center' }}>AÇÕES</th>
                  </tr>
                </thead>
                <tbody id="tbodyColaboradores">
                  {getSortedList(colaboradoresData).map(({ item, originalIndex: idx }) => {
                    if (!isItemInSelectedUnidade(item)) return null;
                    const rowCells = [item.codigo, item.nome, item.apontador || '-', item.local || '-', item.status || 'Ativo'];
                    if (!isRowVisible(rowCells)) return null;

                    const statusStyle = item.status === 'Inativo'
                      ? { bg: '#fde7e9', color: '#a80000', icon: 'fa-circle-xmark' }
                      : item.status === 'Afastado'
                      ? { bg: '#fff4ce', color: '#794b00', icon: 'fa-triangle-exclamation' }
                      : { bg: '#dff6dd', color: '#107c41', icon: 'fa-circle-check' };

                    return (
                      <tr key={idx}>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colaboradores', idx, 'codigo', e.currentTarget.innerText)}><strong>{item.codigo}</strong></td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colaboradores', idx, 'nome', e.currentTarget.innerText)}>{item.nome}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colaboradores', idx, 'apontador', e.currentTarget.innerText)}>{item.apontador || '-'}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colaboradores', idx, 'local', e.currentTarget.innerText)}>{item.local || '-'}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colaboradores', idx, 'status', e.currentTarget.innerText)}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: statusStyle.bg, color: statusStyle.color, padding: '3px 9px', borderRadius: '12px', fontWeight: 600, fontSize: '12px' }}>
                            <i className={`fa-solid ${statusStyle.icon}`} style={{ fontSize: '11px' }}></i> {item.status || 'Ativo'}
                          </span>
                        </td>
                        <td className="action-cell">
                          <button className="btn-action-row" onClick={() => openCurrentModal(rowCells, idx)} title="Editar"><i className="fa-solid fa-pen"></i></button>
                          <button className="btn-action-row" onClick={() => deleteRow('colaboradores', idx)} title="Mover para Lixeira"><i className="fa-solid fa-trash"></i></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGE MOTORISTAS */}
          <div id="pageMotoristas" className={`page-section ${activePage === 'motoristas' ? 'active' : ''}`}>
            <div className="table-container">
              <table id="tableMotoristas" className={`table-compact ${isGridEditing ? 'grid-editing' : ''}`}>
                <thead>
                  <tr>
                    <th><div className="th-content">CÓDIGO (CAPA) <button className={`btn-filter-col ${isColFiltered(0) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 0)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content">NOME COMPLETO <button className={`btn-filter-col ${isColFiltered(1) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 1)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content">ABREVIAÇÃO <button className={`btn-filter-col ${isColFiltered(2) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 2)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th style={{ textAlign: 'center' }}>AÇÕES</th>
                  </tr>
                </thead>
                <tbody id="tbodyMotoristas">
                  {getSortedList(motoristasData).map(({ item, originalIndex: idx }) => {
                    if (!isItemInSelectedUnidade(item)) return null;
                    const rowCells = [item.codigo, item.nome, item.abreviacao];
                    if (!isRowVisible(rowCells)) return null;

                    return (
                      <tr key={idx}>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('motoristas', idx, 'codigo', e.currentTarget.innerText)}><strong>{item.codigo}</strong></td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('motoristas', idx, 'nome', e.currentTarget.innerText)}>{item.nome}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('motoristas', idx, 'abreviacao', e.currentTarget.innerText)}>
                          <span className="badge-abbr">{item.abreviacao}</span>
                        </td>
                        <td className="action-cell">
                          <button className="btn-action-row" onClick={() => openCurrentModal(rowCells, idx)} title="Editar"><i className="fa-solid fa-pen"></i></button>
                          <button className="btn-action-row" onClick={() => deleteRow('motoristas', idx)} title="Mover para Lixeira"><i className="fa-solid fa-trash"></i></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGE ONIBUS */}
          <div id="pageOnibus" className={`page-section ${activePage === 'onibus' ? 'active' : ''}`}>
            <div className="table-container">
              <table id="tableOnibus" className={`table-compact ${isGridEditing ? 'grid-editing' : ''}`}>
                <thead>
                  <tr>
                    <th><div className="th-content">CÓDIGO <button className={`btn-filter-col ${isColFiltered(0) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 0)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content">PLACA <button className={`btn-filter-col ${isColFiltered(1) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 1)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content">COR <button className={`btn-filter-col ${isColFiltered(2) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 2)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content">MOTORISTA <button className={`btn-filter-col ${isColFiltered(3) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 3)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content">LOCAL <button className={`btn-filter-col ${isColFiltered(4) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 4)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th><div className="th-content">MOTORISTA COOPERADO <button className={`btn-filter-col ${isColFiltered(5) ? 'active-filter' : ''}`} onClick={e => openColumnFilter(e, 5)}><i className="fa-solid fa-filter"></i></button></div></th>
                    <th style={{ textAlign: 'center' }}>AÇÕES</th>
                  </tr>
                </thead>
                <tbody id="tbodyOnibus">
                  {getSortedList(onibusData).map(({ item, originalIndex: idx }) => {
                    if (!isItemInSelectedUnidade(item)) return null;
                    const rowCells = [item.codigo, item.nome, item.cor || 'Branco', item.motorista || '-', item.local || '-', item.cooperado || 'Não'];
                    if (!isRowVisible(rowCells)) return null;

                    return (
                      <tr key={idx}>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('onibus', idx, 'codigo', e.currentTarget.innerText)}><strong>{item.codigo}</strong></td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('onibus', idx, 'nome', e.currentTarget.innerText)}>{item.nome}</td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('onibus', idx, 'cor', e.currentTarget.innerText)}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#f3f2f1', color: '#323130', padding: '3px 8px', borderRadius: '12px', fontWeight: 600, fontSize: '12px' }}>
                            <i className="fa-solid fa-palette" style={{ fontSize: '11px' }}></i> {item.cor || 'Branco'}
                          </span>
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('onibus', idx, 'motorista', e.currentTarget.innerText)}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#eff6fc', color: '#0078d4', padding: '3px 8px', borderRadius: '12px', fontWeight: 600, fontSize: '12px' }}>
                            <i className="fa-solid fa-id-card"></i> {item.motorista}
                          </span>
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('onibus', idx, 'local', e.currentTarget.innerText)}>
                          {item.cooperado === 'Sim' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#0078d4', fontWeight: 600 }}>
                              <i className="fa-solid fa-building-ngo"></i> {item.local || '-'}
                            </span>
                          ) : (
                            item.local || '-'
                          )}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('onibus', idx, 'cooperado', e.currentTarget.innerText)}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: item.cooperado === 'Sim' ? '#e1dfdd' : '#f3f2f1', color: '#323130', padding: '3px 8px', borderRadius: '12px', fontWeight: 600, fontSize: '12px' }}>
                            <i className={`fa-solid ${item.cooperado === 'Sim' ? 'fa-handshake' : 'fa-user'}`}></i> {item.cooperado || 'Não'}
                          </span>
                        </td>
                        <td className="action-cell">
                          <button className="btn-action-row" onClick={() => openCurrentModal(rowCells, idx)} title="Editar"><i className="fa-solid fa-pen"></i></button>
                          <button className="btn-action-row" onClick={() => deleteRow('onibus', idx)} title="Mover para Lixeira"><i className="fa-solid fa-trash"></i></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGE LIXEIRA */}
          <div id="pageLixeira" className={`page-section ${activePage === 'lixeira' ? 'active' : ''}`}>
            {/* TABS DE SELEÇÃO DE CATEGORIA DENTRO DA LIXEIRA */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '16px',
              padding: '12px 16px',
              backgroundColor: '#faf9f8',
              border: '1px solid #edebe9',
              borderRadius: '2px'
            }}>
              <span style={{ fontWeight: 600, color: '#605e5c', fontSize: '12px', marginRight: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-filter"></i> Filtrar Lixeira por Categoria:
              </span>
              {mainCategories.map(cat => {
                const count = trashData.filter(t => t.category === cat.key && isItemInSelectedUnidade(t.itemData)).length;
                const isSelected = lixeiraCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setLixeiraCategory(cat.key)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '14px',
                      border: isSelected ? '1px solid #0078d4' : '1px solid #d2d0ce',
                      backgroundColor: isSelected ? '#0078d4' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#323130',
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{cat.label}</span>
                    <span style={{
                      backgroundColor: isSelected ? '#ffffff' : '#f3f2f1',
                      color: isSelected ? '#0078d4' : '#605e5c',
                      borderRadius: '10px',
                      padding: '1px 6px',
                      fontSize: '10px',
                      fontWeight: 700
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* BOTÃO ESVAZIAR CATEGORIA */}
            {trashData.filter(t => t.category === lixeiraCategory && isItemInSelectedUnidade(t.itemData)).length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontWeight: 600, color: '#323130', fontSize: '13px' }}>
                  Itens na lixeira de: <span style={{ color: '#0078d4' }}>{titleMap[lixeiraCategory]}</span> ({trashData.filter(t => t.category === lixeiraCategory && isItemInSelectedUnidade(t.itemData)).length})
                </div>
                <button
                  onClick={() => emptyTrashForCategory(lixeiraCategory)}
                  style={{
                    backgroundColor: '#d13438',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '2px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <i className="fa-solid fa-trash-can"></i> Esvaziar Lixeira nesta categoria
                </button>
              </div>
            )}

            {/* CONTEÚDO DA TABELA DA LIXEIRA */}
            {(() => {
              const currentTrashItems = trashData.filter(t => t.category === lixeiraCategory && isItemInSelectedUnidade(t.itemData));
              const searchQuery = globalSearch.toLowerCase().trim();
              const filteredTrash = currentTrashItems.filter(entry => {
                if (!searchQuery) return true;
                const d = entry.itemData;
                const values = Object.values(d).map(v => String(v).toLowerCase());
                return values.some(val => val.includes(searchQuery));
              });

              if (filteredTrash.length === 0) {
                return (
                  <div style={{
                    padding: '48px 20px',
                    textAlign: 'center',
                    backgroundColor: '#faf9f8',
                    border: '1px solid #edebe9',
                    borderRadius: '2px'
                  }}>
                    <i className="fa-solid fa-trash-can" style={{ fontSize: '38px', color: '#c8c6c4', marginBottom: '12px', display: 'block' }}></i>
                    <p style={{ fontWeight: 600, fontSize: '14px', color: '#323130', marginBottom: '4px' }}>
                      Nenhum item na lixeira de {titleMap[lixeiraCategory]}
                    </p>
                    <p style={{ fontSize: '12px', color: '#605e5c' }}>
                      Itens excluídos da aba {titleMap[lixeiraCategory]} serão movidos para cá, onde você pode restaurá-los ou excluí-los permanentemente.
                    </p>
                  </div>
                );
              }

              return (
                <div className="table-container">
                  <table className="table-large">
                    <thead>
                      <tr>
                        {lixeiraCategory === 'colheita' && (
                          <>
                            <th>DATA</th>
                            <th>CULTURA</th>
                            <th>FAZENDA</th>
                            <th>PIVÔ</th>
                            <th>GLEBA</th>
                            <th>VARIEDADE</th>
                            <th>OS</th>
                            <th>HA GERAL</th>
                            <th>HA DIA</th>
                          </>
                        )}
                        {lixeiraCategory === 'plantio' && (
                          <>
                            <th>DATA</th>
                            <th>EMPRESA</th>
                            <th>CULTURA</th>
                            <th>OS</th>
                            <th>FAZENDA</th>
                            <th>PIVÔ</th>
                            <th>GLEBA</th>
                            <th>VARIEDADE</th>
                            <th>HA/ DIA</th>
                            <th>ANO</th>
                          </>
                        )}
                        {lixeiraCategory === 'variedades' && (
                          <>
                            <th>CÓDIGO</th>
                            <th>NOME</th>
                            <th>CULTURA</th>
                          </>
                        )}
                        {(lixeiraCategory === 'colaboradores' || lixeiraCategory === 'motoristas') && (
                          <>
                            <th>CÓDIGO (CAPA)</th>
                            <th>NOME COMPLETO</th>
                            <th>ABREVIAÇÃO</th>
                          </>
                        )}
                        {lixeiraCategory === 'onibus' && (
                          <>
                            <th>CÓDIGO</th>
                            <th>PLACA</th>
                            <th>COR</th>
                            <th>MOTORISTA</th>
                          </>
                        )}
                        {(lixeiraCategory === 'pivos' || lixeiraCategory === 'glebas' || lixeiraCategory === 'fazendas' || lixeiraCategory === 'culturas' || lixeiraCategory === 'empresas' || lixeiraCategory === 'anos') && (
                          <>
                            <th>CÓDIGO</th>
                            <th>{lixeiraCategory === 'empresas' ? 'NOME DA EMPRESA' : lixeiraCategory === 'anos' ? 'ANO' : 'NOME'}</th>
                          </>
                        )}
                        <th>EXCLUÍDO EM</th>
                        <th style={{ textAlign: 'center' }}>AÇÕES DA LIXEIRA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrash.map(trashEntry => {
                        const d = trashEntry.itemData;
                        return (
                          <tr key={trashEntry.id}>
                            {lixeiraCategory === 'colheita' && (
                              <>
                                <td>{d.data}</td>
                                <td>{d.cultura}</td>
                                <td>{d.fazenda}</td>
                                <td>{d.pivo}</td>
                                <td>{d.gleba}</td>
                                <td>{d.variedade}</td>
                                <td>{d.os}</td>
                                <td>{d.haGeral}</td>
                                <td>{d.haDia}</td>
                              </>
                            )}
                            {lixeiraCategory === 'plantio' && (
                              <>
                                <td>{d.data}</td>
                                <td>{d.empresa || '-'}</td>
                                <td>{d.cultura}</td>
                                <td>{d.os || '-'}</td>
                                <td>{d.fazenda}</td>
                                <td>{d.pivo || '-'}</td>
                                <td>{d.gleba || '-'}</td>
                                <td>{d.variedade || '-'}</td>
                                <td>{d.haDia || d.haPlantado || '-'}</td>
                                <td>{d.ano || '-'}</td>
                              </>
                            )}
                            {lixeiraCategory === 'variedades' && (
                              <>
                                <td><strong>{d.codigo}</strong></td>
                                <td>{d.nome}</td>
                                <td>{d.cultura}</td>
                              </>
                            )}
                            {(lixeiraCategory === 'colaboradores' || lixeiraCategory === 'motoristas') && (
                              <>
                                <td><strong>{d.codigo}</strong></td>
                                <td>{d.nome}</td>
                                <td><span className="badge-abbr">{d.abreviacao}</span></td>
                              </>
                            )}
                            {lixeiraCategory === 'onibus' && (
                              <>
                                <td><strong>{d.codigo}</strong></td>
                                <td>{d.nome}</td>
                                <td>{d.cor || 'Branco'}</td>
                                <td>{d.motorista}</td>
                              </>
                            )}
                            {(lixeiraCategory === 'pivos' || lixeiraCategory === 'glebas' || lixeiraCategory === 'fazendas' || lixeiraCategory === 'culturas' || lixeiraCategory === 'empresas' || lixeiraCategory === 'anos') && (
                              <>
                                <td><strong>{d.codigo}</strong></td>
                                <td>{d.nome}</td>
                              </>
                            )}
                            <td style={{ color: '#605e5c', fontSize: '11px' }}>{trashEntry.deletedAt}</td>
                            <td className="action-cell">
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                <button
                                  onClick={() => restoreFromTrash(trashEntry.id)}
                                  title="Restaurar item"
                                  style={{
                                    backgroundColor: '#107c41',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '2px',
                                    padding: '5px 10px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                  }}
                                >
                                  <i className="fa-solid fa-rotate-left"></i> Restaurar
                                </button>
                                <button
                                  onClick={() => deletePermanently(trashEntry.id)}
                                  title="Excluir permanentemente"
                                  style={{
                                    backgroundColor: '#a80000',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '2px',
                                    padding: '5px 10px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                  }}
                                >
                                  <i className="fa-solid fa-xmark"></i> Excluir Definitivamente
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}

          </div>

        </div>
      </div>

      {/* MODAL DE SELEÇÃO E GESTÃO DE UNIDADES DE PRODUÇÃO */}
      {showUnidadeModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowUnidadeModal(false)}
          style={{ display: 'flex', zIndex: 99999 }}
        >
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '460px',
              width: '90%',
              padding: '24px',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              border: '1px solid #d2d0ce'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e1dfdd', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="list-icon-bg" style={{ fontSize: '13px', width: '32px', height: '32px' }}>
                  {getUnitInitials(selectedUnidade)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#323130' }}>
                    Unidades de Produção
                  </h3>
                  <span style={{ fontSize: '11px', color: '#605e5c' }}>Alterne ou adicione novas unidades</span>
                </div>
              </div>
              <button
                onClick={() => setShowUnidadeModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '16px', color: '#605e5c', cursor: 'pointer', padding: '4px' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', marginBottom: '20px', paddingRight: '4px' }}>
              {unidadesList.map((unit) => {
                const isSelected = unit === selectedUnidade;
                return (
                  <div
                    key={unit}
                    onClick={() => {
                      setSelectedUnidade(unit);
                      showToast(`Unidade alterada para "${unit}"`, 'info');
                      setShowUnidadeModal(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: isSelected ? '2px solid #0078d4' : '1px solid #e1dfdd',
                      backgroundColor: isSelected ? '#eff6fc' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '4px',
                          backgroundColor: isSelected ? '#0078d4' : '#605e5c',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {getUnitInitials(unit)}
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: isSelected ? 600 : 400, color: '#323130' }}>
                        {unit}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isSelected && (
                        <span style={{ fontSize: '12px', color: '#0078d4', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <i className="fa-solid fa-circle-check"></i> Ativa
                        </span>
                      )}
                      {unidadesList.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Deseja realmente excluir a unidade "${unit}"?`)) {
                              const updated = unidadesList.filter(u => u !== unit);
                              setUnidadesList(updated);
                              if (selectedUnidade === unit) {
                                setSelectedUnidade(updated[0] || 'Cristalina');
                              }
                              showToast(`Unidade "${unit}" excluída.`, 'info');
                            }
                          }}
                          title="Excluir Unidade"
                          style={{ background: 'none', border: 'none', color: '#a19f9d', cursor: 'pointer', fontSize: '12px', padding: '4px' }}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid #e1dfdd', paddingTop: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#323130', display: 'block', marginBottom: '6px' }}>
                Cadastrar Nova Unidade:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newUnidadeInput}
                  onChange={e => setNewUnidadeInput(e.target.value)}
                  placeholder="Ex: São Gabriel, Uberlândia, Paz..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #8a8886',
                    fontSize: '13px'
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddUnidade();
                    }
                  }}
                />
                <button
                  onClick={handleAddUnidade}
                  style={{
                    backgroundColor: '#0078d4',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  + Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP DE SELEÇÃO DE FILTRO POR COLUNA */}
      {popoverState && (
        <div
          className="column-filter-popover"
          id="columnFilterPopover"
          style={{ display: 'flex', top: `${popoverState.top}px`, left: `${popoverState.left}px` }}
        >
          <div className="filter-popover-header">Selecione para filtrar:</div>
          <div className="filter-options-list" id="filterOptionsList">
            {popoverState.options.length === 0 ? (
              <div style={{ fontSize: '11px', color: '#605e5c', padding: '6px' }}>Nenhum item cadastrado</div>
            ) : (
              <>
                <label className="filter-option-item" style={{ fontWeight: 600, borderBottom: '1px solid #f3f2f1', paddingBottom: '4px' }}>
                  <input
                    type="checkbox"
                    id="chkSelectAll"
                    checked={popoverState.selected.length === popoverState.options.length && popoverState.options.length > 0}
                    onChange={e => toggleSelectAllPopoverOptions(e.target.checked)}
                  />
                  <span>(Selecionar Tudo)</span>
                </label>
                {popoverState.options.map((val, idx) => (
                  <label key={idx} className="filter-option-item">
                    <input
                      type="checkbox"
                      className="chk-filter-option"
                      value={val}
                      checked={popoverState.selected.includes(val)}
                      onChange={() => togglePopoverOption(val)}
                    />
                    <span>{val || '(Vazio)'}</span>
                  </label>
                ))}
              </>
            )}
          </div>
          <div className="filter-popover-actions">
            <button className="filter-btn-clear" onClick={clearCurrentColumnFilter}>Limpar</button>
            <button className="filter-btn-apply" onClick={applyCurrentColumnFilter}>Aplicar</button>
          </div>
        </div>
      )}

      {/* MODAL DE ADICIONAR / EDITAR */}
      {isModalOpen && (
        <div className="modal-overlay" id="modalOverlay" style={{ display: 'flex' }}>
          <div className="modal-panel">
            <h2 id="modalTitle">
              {editingIndex !== null
                ? `Editar ${modalEntityNameMap[activePage] || 'Item'}`
                : `Cadastrar ${modalEntityNameMap[activePage] || 'Item'}`}
            </h2>
            <form id="genericForm" onSubmit={handleFormSubmit}>
              <div id="modalFields">
                {activePage === 'colheita' && (
                  <>
                    <div className="form-group">
                      <label>Data da Colheita</label>
                      <input
                        type="date"
                        value={formData.cData || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setFormData({
                            ...formData,
                            cData: val,
                            cMes: getMonthNameFromDate(val) || formData.cMes,
                            cAno: getYearFromDate(val) || formData.cAno
                          });
                        }}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Empresa</label>
                      {empresasData.filter(isItemInSelectedUnidade).length > 0 ? (
                        <select value={formData.cEmpresa || ''} onChange={e => setFormData({ ...formData, cEmpresa: e.target.value })}>
                          <option value="">Selecione uma empresa com plantio...</option>
                          {getPlantioEmpresas(formData.cCultura, formData.cFazenda).map((emp, i) => (
                            <option key={i} value={emp.nome}>{emp.nome}</option>
                          ))}
                          {editingIndex !== null && formData.cEmpresa && !getPlantioEmpresas(formData.cCultura, formData.cFazenda).some(e => e.nome === formData.cEmpresa) && (
                            <option value={formData.cEmpresa}>{formData.cEmpresa}</option>
                          )}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Ex: Coopercitrus"
                          value={formData.cEmpresa || ''}
                          onChange={e => setFormData({ ...formData, cEmpresa: e.target.value })}
                        />
                      )}
                    </div>
                    <div className="form-group">
                      <label>Cultura (do Plantio)</label>
                      <select
                        value={formData.cCultura || ''}
                        onChange={e => {
                          const newCultura = e.target.value;
                          const validFazendas = getPlantioFazendas(newCultura);
                          const newFazenda = validFazendas.some(f => f.nome === formData.cFazenda)
                            ? formData.cFazenda
                            : (validFazendas.length === 1 ? validFazendas[0].nome : '');

                          const validEmpresas = getPlantioEmpresas(newCultura, newFazenda);
                          const newEmpresa = validEmpresas.some(emp => emp.nome === formData.cEmpresa)
                            ? formData.cEmpresa
                            : (validEmpresas.length === 1 ? validEmpresas[0].nome : formData.cEmpresa);

                          const isSameFazenda = newFazenda && newFazenda === formData.cFazenda;
                          const validPivos = getPlantioPivos(newFazenda, newCultura);
                          const newPivo = isSameFazenda && validPivos.some(p => p.nome === formData.cPivo)
                            ? formData.cPivo
                            : (validPivos.length === 1 ? validPivos[0].nome : '');

                          const isSamePivo = isSameFazenda && newPivo && newPivo === formData.cPivo;
                          const validGlebas = getPlantioGlebas(newPivo, newFazenda, newCultura);
                          const newGleba = isSamePivo && validGlebas.some(g => g.nome === formData.cGleba)
                            ? formData.cGleba
                            : (validGlebas.length === 1 ? validGlebas[0].nome : '');

                          const validVars = getPlantioVariedades(newCultura, newFazenda, newPivo, newGleba);
                          const newVar = isSamePivo && validVars.some(v => v.nome === formData.cVariedade)
                            ? formData.cVariedade
                            : (validVars.length === 1 ? validVars[0].nome : '');

                          const ha = lookupPlantedHectaresForSelection(newCultura, newFazenda, newPivo, newGleba, newVar);
                          const newHaGeral = ha || '';
                          const newRestante = calculateHaRestanteForColheita(newHaGeral, formData.cHaDia, newCultura, newFazenda, newPivo, newGleba, newVar, editingIndex);

                          setFormData({
                            ...formData,
                            cCultura: newCultura,
                            cEmpresa: newEmpresa,
                            cFazenda: newFazenda,
                            cPivo: newPivo,
                            cGleba: newGleba,
                            cVariedade: newVar,
                            cHaGeral: newHaGeral,
                            cHaRestante: newRestante
                          });
                        }}
                        required
                      >
                        <option value="">Selecione uma cultura com plantio...</option>
                        {getPlantioCulturas(formData.cFazenda).map((c, i) => (
                          <option key={i} value={c.nome}>{c.nome}</option>
                        ))}
                        {editingIndex !== null && formData.cCultura && !getPlantioCulturas(formData.cFazenda).some(c => c.nome === formData.cCultura) && (
                          <option value={formData.cCultura}>{formData.cCultura}</option>
                        )}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>OS (Somente Números)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Ex: 101"
                        value={formData.cOs || ''}
                        onChange={e => setFormData({ ...formData, cOs: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Fazenda (do Plantio)</label>
                      <select
                        value={formData.cFazenda || ''}
                        onChange={e => {
                          const newFazenda = e.target.value;
                          const validCulturas = getPlantioCulturas(newFazenda);
                          const newCultura = validCulturas.some(c => c.nome === formData.cCultura)
                            ? formData.cCultura
                            : (validCulturas.length === 1 ? validCulturas[0].nome : '');

                          const validEmpresas = getPlantioEmpresas(newCultura, newFazenda);
                          const newEmpresa = validEmpresas.some(emp => emp.nome === formData.cEmpresa)
                            ? formData.cEmpresa
                            : (validEmpresas.length === 1 ? validEmpresas[0].nome : formData.cEmpresa);

                          const validPivos = getPlantioPivos(newFazenda, newCultura);
                          const newPivo = validPivos.some(p => p.nome === formData.cPivo)
                            ? formData.cPivo
                            : (validPivos.length === 1 ? validPivos[0].nome : '');

                          const validGlebas = getPlantioGlebas(newPivo, newFazenda, newCultura);
                          const newGleba = validGlebas.some(g => g.nome === formData.cGleba)
                            ? formData.cGleba
                            : (validGlebas.length === 1 ? validGlebas[0].nome : '');

                          const validVars = getPlantioVariedades(newCultura, newFazenda, newPivo, newGleba);
                          const newVar = validVars.some(v => v.nome === formData.cVariedade)
                            ? formData.cVariedade
                            : (validVars.length === 1 ? validVars[0].nome : '');

                          const ha = lookupPlantedHectaresForSelection(newCultura, newFazenda, newPivo, newGleba, newVar);
                          const newHaGeral = ha || '';
                          const newRestante = calculateHaRestanteForColheita(newHaGeral, formData.cHaDia, newCultura, newFazenda, newPivo, newGleba, newVar, editingIndex);

                          setFormData({
                            ...formData,
                            cFazenda: newFazenda,
                            cCultura: newCultura,
                            cEmpresa: newEmpresa,
                            cPivo: newPivo,
                            cGleba: newGleba,
                            cVariedade: newVar,
                            cHaGeral: newHaGeral,
                            cHaRestante: newRestante
                          });
                        }}
                        required
                      >
                        <option value="">Selecione uma fazenda com plantio...</option>
                        {getPlantioFazendas(formData.cCultura).map((f, i) => (
                          <option key={i} value={f.nome}>{f.nome}</option>
                        ))}
                        {editingIndex !== null && formData.cFazenda && !getPlantioFazendas(formData.cCultura).some(f => f.nome === formData.cFazenda) && (
                          <option value={formData.cFazenda}>{formData.cFazenda}</option>
                        )}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Pivô (do Plantio)</label>
                      <select
                        value={formData.cPivo || ''}
                        onChange={e => {
                          const newPivo = e.target.value;
                          const validGlebas = getPlantioGlebas(newPivo, formData.cFazenda, formData.cCultura);
                          const newGleba = validGlebas.length === 1 ? validGlebas[0].nome : '';
                          const validVars = getPlantioVariedades(formData.cCultura, formData.cFazenda, newPivo, newGleba);
                          const newVar = validVars.length === 1 ? validVars[0].nome : '';

                          const ha = lookupPlantedHectaresForSelection(formData.cCultura, formData.cFazenda, newPivo, newGleba, newVar);
                          const newHaGeral = ha || '';
                          const newRestante = calculateHaRestanteForColheita(newHaGeral, formData.cHaDia, formData.cCultura, formData.cFazenda, newPivo, newGleba, newVar, editingIndex);

                          setFormData({
                            ...formData,
                            cPivo: newPivo,
                            cGleba: newGleba,
                            cVariedade: newVar,
                            cHaGeral: newHaGeral,
                            cHaRestante: newRestante
                          });
                        }}
                      >
                        <option value="">Selecione um pivô com plantio...</option>
                        {getPlantioPivos(formData.cFazenda, formData.cCultura).map((p, i) => (
                          <option key={i} value={p.nome}>{p.nome}</option>
                        ))}
                        {editingIndex !== null && formData.cPivo && formData.cPivo !== '-' && !getPlantioPivos(formData.cFazenda, formData.cCultura).some(p => p.nome === formData.cPivo) && (
                          <option value={formData.cPivo}>{formData.cPivo}</option>
                        )}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Gleba (do Plantio)</label>
                      <select
                        value={formData.cGleba || ''}
                        onChange={e => {
                          const newGleba = e.target.value;
                          const validVars = getPlantioVariedades(formData.cCultura, formData.cFazenda, formData.cPivo, newGleba);
                          const newVar = validVars.some(v => v.nome === formData.cVariedade)
                            ? formData.cVariedade
                            : (validVars.length === 1 ? validVars[0].nome : '');

                          const ha = lookupPlantedHectaresForSelection(formData.cCultura, formData.cFazenda, formData.cPivo, newGleba, newVar);
                          const newHaGeral = ha || '';
                          const newRestante = calculateHaRestanteForColheita(newHaGeral, formData.cHaDia, formData.cCultura, formData.cFazenda, formData.cPivo, newGleba, newVar, editingIndex);

                          setFormData({
                            ...formData,
                            cGleba: newGleba,
                            cVariedade: newVar,
                            cHaGeral: newHaGeral,
                            cHaRestante: newRestante
                          });
                        }}
                      >
                        <option value="">Selecione uma gleba com plantio...</option>
                        {getPlantioGlebas(formData.cPivo, formData.cFazenda, formData.cCultura).map((g, i) => (
                          <option key={i} value={g.nome}>{g.nome}</option>
                        ))}
                        {editingIndex !== null && formData.cGleba && formData.cGleba !== '-' && !getPlantioGlebas(formData.cPivo, formData.cFazenda, formData.cCultura).some(g => g.nome === formData.cGleba) && (
                          <option value={formData.cGleba}>{formData.cGleba}</option>
                        )}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Variedade (do Plantio)</label>
                      <select
                        value={formData.cVariedade || ''}
                        onChange={e => {
                          const newVar = e.target.value;
                          const ha = lookupPlantedHectaresForSelection(formData.cCultura, formData.cFazenda, formData.cPivo, formData.cGleba, newVar);
                          const newHaGeral = ha || '';
                          const newRestante = calculateHaRestanteForColheita(newHaGeral, formData.cHaDia, formData.cCultura, formData.cFazenda, formData.cPivo, formData.cGleba, newVar, editingIndex);

                          setFormData({
                            ...formData,
                            cVariedade: newVar,
                            cHaGeral: newHaGeral,
                            cHaRestante: newRestante
                          });
                        }}
                      >
                        <option value="">Selecione uma variedade com plantio...</option>
                        {getPlantioVariedades(formData.cCultura, formData.cFazenda, formData.cPivo, formData.cGleba).map((v, i) => (
                          <option key={i} value={v.nome}>{v.nome}</option>
                        ))}
                        {editingIndex !== null && formData.cVariedade && formData.cVariedade !== '-' && !getPlantioVariedades(formData.cCultura, formData.cFazenda, formData.cPivo, formData.cGleba).some(v => v.nome === formData.cVariedade) && (
                          <option value={formData.cVariedade}>{formData.cVariedade}</option>
                        )}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Área Colhida no Dia (ha/dia)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Ex: 14,50"
                        value={formData.cHaDia || ''}
                        onChange={e => {
                          const newHaDia = sanitizeHectaresInput(e.target.value);
                          const newRestante = calculateHaRestanteForColheita(formData.cHaGeral, newHaDia, formData.cCultura, formData.cFazenda, formData.cPivo, formData.cGleba, formData.cVariedade, editingIndex);
                          const newMedia = calculateMediaHaForColheita(formData.cQtdColhido || formData.cCaixasCortadas, newHaDia);
                          setFormData({ ...formData, cHaDia: newHaDia, cHaRestante: newRestante, cMediaHa: newMedia });
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>HA/GERAL (Área Total Plantada)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Ex: 100,00 ha"
                        value={formData.cHaGeral || ''}
                        onChange={e => {
                          const newHaGeral = sanitizeHectaresInput(e.target.value);
                          const newRestante = calculateHaRestanteForColheita(newHaGeral, formData.cHaDia, formData.cCultura, formData.cFazenda, formData.cPivo, formData.cGleba, formData.cVariedade, editingIndex);
                          setFormData({ ...formData, cHaGeral: newHaGeral, cHaRestante: newRestante });
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Hectare Restante (ha/resta - Cálculo Automático)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Calculado automaticamente..."
                        value={formData.cHaRestante || ''}
                        onChange={e => setFormData({ ...formData, cHaRestante: sanitizeHectaresInput(e.target.value) })}
                        style={{ fontWeight: 700, backgroundColor: '#f3f2f1' }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Qtd: Colhido</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Ex: 250"
                        value={formData.cQtdColhido || formData.cCaixasCortadas || ''}
                        onChange={e => {
                          const newQtd = e.target.value;
                          const newMedia = calculateMediaHaForColheita(newQtd, formData.cHaDia);
                          setFormData({ ...formData, cQtdColhido: newQtd, cCaixasCortadas: newQtd, cMediaHa: newMedia });
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Finalizada</label>
                      <select value={formData.cGlebasFinalizada || 'Não'} onChange={e => setFormData({ ...formData, cGlebasFinalizada: e.target.value })}>
                        <option value="Não">Não</option>
                        <option value="Sim">Sim</option>
                        <option value="Parcial">Parcial</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Média/ha (Cálculo Automático)</label>
                      <input
                        type="text"
                        placeholder="Calculado automaticamente ex: 17,24 /ha"
                        value={formData.cMediaHa || ''}
                        onChange={e => setFormData({ ...formData, cMediaHa: e.target.value })}
                        style={{ fontWeight: 700, backgroundColor: '#f3f2f1' }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Mês</label>
                      <input
                        type="text"
                        placeholder="Ex: Fevereiro"
                        value={formData.cMes || ''}
                        onChange={e => setFormData({ ...formData, cMes: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Ano</label>
                      <select value={formData.cAno || ''} onChange={e => setFormData({ ...formData, cAno: e.target.value })}>
                        <option value="">Selecione o ano...</option>
                        {anosData.filter(isItemInSelectedUnidade).map((a, i) => (
                          <option key={i} value={a.nome}>{a.nome}</option>
                        ))}
                        {editingIndex !== null && formData.cAno && !anosData.filter(isItemInSelectedUnidade).some(a => a.nome === formData.cAno) && (
                          <option value={formData.cAno}>{formData.cAno}</option>
                        )}
                      </select>
                    </div>
                  </>
                )}

                {activePage === 'plantio' && (
                  <>
                    <div className="form-group">
                      <label>Data do Plantio</label>
                      <input type="date" value={formData.pData || ''} onChange={e => setFormData({ ...formData, pData: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Empresa</label>
                      {getAmarracoesEmpresas().length > 0 ? (
                        <select value={formData.pEmpresa || ''} onChange={e => setFormData({ ...formData, pEmpresa: e.target.value })}>
                          <option value="">Selecione uma empresa...</option>
                          {getAmarracoesEmpresas().map((emp, i) => (
                            <option key={i} value={emp.nome}>{emp.nome}</option>
                          ))}
                          {formData.pEmpresa && formData.pEmpresa !== '-' && !getAmarracoesEmpresas().some(e => e.nome === formData.pEmpresa) && (
                            <option value={formData.pEmpresa}>{formData.pEmpresa}</option>
                          )}
                        </select>
                      ) : (
                        <input type="text" placeholder="Ex: Agro" value={formData.pEmpresa || ''} onChange={e => setFormData({ ...formData, pEmpresa: e.target.value })} />
                      )}
                    </div>
                    <div className="form-group">
                      <label>Cultura (Amarração)</label>
                      <select
                        value={formData.pCultura || ''}
                        onChange={e => {
                          const newCult = e.target.value;
                          const validFazendas = getAmarracoesFazendas(newCult);
                          const newFazenda = validFazendas.some(f => f.nome === formData.pFazenda) ? formData.pFazenda : '';
                          const newPivo = '';
                          const newGleba = '';
                          const newVar = '';
                          const ha = lookupHectaresForSelection(newPivo, newGleba, newFazenda);
                          const newHaGeral = ha || '';
                          const newRestante = calculateHaRestanteForPlantio(newHaGeral, formData.pHaDia, newPivo, newGleba, newFazenda, editingIndex);
                          setFormData({
                            ...formData,
                            pCultura: newCult,
                            pFazenda: newFazenda,
                            pPivo: newPivo,
                            pGleba: newGleba,
                            pVariedade: newVar,
                            pHaGeral: newHaGeral,
                            pHaRestante: newRestante
                          });
                        }}
                        required
                      >
                        <option value="">Selecione uma cultura vinculada...</option>
                        {getAmarracoesCulturas().map((c, i) => (
                          <option key={i} value={c.nome}>{c.nome}</option>
                        ))}
                        {formData.pCultura && !getAmarracoesCulturas().some(c => c.nome === formData.pCultura) && (
                          <option value={formData.pCultura}>{formData.pCultura}</option>
                        )}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>OS (Somente Números)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Ex: 101"
                        value={formData.pOs || ''}
                        onChange={e => setFormData({ ...formData, pOs: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Fazenda (Amarração)</label>
                      <select
                        value={formData.pFazenda || ''}
                        onChange={e => {
                          const newFazenda = e.target.value;
                          const newPivo = '';
                          const newGleba = '';
                          const newVar = '';
                          const ha = lookupHectaresForSelection(newPivo, newGleba, newFazenda);
                          const newHaGeral = ha || '';
                          const newRestante = calculateHaRestanteForPlantio(newHaGeral, formData.pHaDia, newPivo, newGleba, newFazenda, editingIndex);
                          setFormData({
                            ...formData,
                            pFazenda: newFazenda,
                            pPivo: newPivo,
                            pGleba: newGleba,
                            pVariedade: newVar,
                            pHaGeral: newHaGeral,
                            pHaRestante: newRestante
                          });
                        }}
                        required
                      >
                        <option value="">Selecione uma fazenda vinculada...</option>
                        {getAmarracoesFazendas(formData.pCultura).map((f, i) => (
                          <option key={i} value={f.nome}>{f.nome}</option>
                        ))}
                        {formData.pFazenda && !getAmarracoesFazendas(formData.pCultura).some(f => f.nome === formData.pFazenda) && (
                          <option value={formData.pFazenda}>{formData.pFazenda}</option>
                        )}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Pivô (Amarração)</label>
                      <select
                        value={formData.pPivo || ''}
                        onChange={e => {
                          const newPivo = e.target.value;
                          const newGleba = '';
                          const ha = lookupHectaresForSelection(newPivo, newGleba, formData.pFazenda);
                          const newHaGeral = ha || '';
                          const newRestante = calculateHaRestanteForPlantio(newHaGeral, formData.pHaDia, newPivo, newGleba, formData.pFazenda, editingIndex);
                          setFormData({
                            ...formData,
                            pPivo: newPivo,
                            pGleba: newGleba,
                            pHaGeral: newHaGeral,
                            pHaRestante: newRestante
                          });
                        }}
                      >
                        <option value="">Selecione um pivô vinculado...</option>
                        {getAmarracoesPivos(formData.pFazenda, formData.pCultura).map((p, i) => (
                          <option key={i} value={p.nome}>{p.nome}</option>
                        ))}
                        {formData.pPivo && formData.pPivo !== '-' && !getAmarracoesPivos(formData.pFazenda, formData.pCultura).some(p => p.nome === formData.pPivo) && (
                          <option value={formData.pPivo}>{formData.pPivo}</option>
                        )}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Gleba (Amarração)</label>
                      <select
                        value={formData.pGleba || ''}
                        onChange={e => {
                          const newGleba = e.target.value;
                          const ha = lookupHectaresForSelection(formData.pPivo, newGleba, formData.pFazenda);
                          const newHaGeral = ha || formData.pHaGeral || '';
                          const newRestante = calculateHaRestanteForPlantio(newHaGeral, formData.pHaDia, formData.pPivo, newGleba, formData.pFazenda, editingIndex);
                          setFormData({
                            ...formData,
                            pGleba: newGleba,
                            pHaGeral: newHaGeral,
                            pHaRestante: newRestante
                          });
                        }}
                      >
                        <option value="">Selecione uma gleba vinculada...</option>
                        {getAmarracoesGlebas(formData.pPivo, formData.pFazenda, formData.pCultura).map((g, i) => (
                          <option key={i} value={g.nome}>{g.nome}</option>
                        ))}
                        {formData.pGleba && formData.pGleba !== '-' && !getAmarracoesGlebas(formData.pPivo, formData.pFazenda, formData.pCultura).some(g => g.nome === formData.pGleba) && (
                          <option value={formData.pGleba}>{formData.pGleba}</option>
                        )}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Variedade (Amarração)</label>
                      <select value={formData.pVariedade || ''} onChange={e => setFormData({ ...formData, pVariedade: e.target.value })}>
                        <option value="">Selecione uma variedade vinculada...</option>
                        {getAmarracoesVariedades(formData.pCultura).map((v, i) => (
                          <option key={i} value={v.nome}>{v.nome}</option>
                        ))}
                        {formData.pVariedade && formData.pVariedade !== '-' && !getAmarracoesVariedades(formData.pCultura).some(v => v.nome === formData.pVariedade) && (
                          <option value={formData.pVariedade}>{formData.pVariedade}</option>
                        )}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Área Total da Amarração (ha) - Automático</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Ex: 115,00"
                        value={formData.pHaGeral || ''}
                        onChange={e => {
                          const newHaGeral = sanitizeHectaresInput(e.target.value);
                          const newRestante = calculateHaRestanteForPlantio(newHaGeral, formData.pHaDia, formData.pPivo, formData.pGleba, formData.pFazenda, editingIndex);
                          setFormData({ ...formData, pHaGeral: newHaGeral, pHaRestante: newRestante });
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>HA / Dia (Área Plantada)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Ex: 31,88"
                        value={formData.pHaDia || ''}
                        onChange={e => {
                          const newHaDia = sanitizeHectaresInput(e.target.value);
                          const newRestante = calculateHaRestanteForPlantio(formData.pHaGeral, newHaDia, formData.pPivo, formData.pGleba, formData.pFazenda, editingIndex);
                          setFormData({ ...formData, pHaDia: newHaDia, pHaRestante: newRestante });
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>HA Restante (Cálculo Automático)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Calculado automaticamente..."
                        value={formData.pHaRestante || ''}
                        onChange={e => setFormData({ ...formData, pHaRestante: sanitizeHectaresInput(e.target.value) })}
                        style={{ fontWeight: 700, backgroundColor: '#f3f2f1' }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Glebas Finalizada</label>
                      <select value={formData.pGlebasFinalizada || 'Não'} onChange={e => setFormData({ ...formData, pGlebasFinalizada: e.target.value })}>
                        <option value="Não">Não</option>
                        <option value="Sim">Sim</option>
                        <option value="Parcial">Parcial</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Média HA</label>
                      <input type="text" inputMode="decimal" placeholder="Ex: 31,88" value={formData.pMediaHa || ''} onChange={e => setFormData({ ...formData, pMediaHa: sanitizeHectaresInput(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label>Ano</label>
                      {getAmarracoesAnos(formData.pEmpresa, formData.pCultura, formData.pFazenda).length > 0 ? (
                        <select value={formData.pAno || ''} onChange={e => setFormData({ ...formData, pAno: e.target.value })}>
                          <option value="">Selecione um ano...</option>
                          {getAmarracoesAnos(formData.pEmpresa, formData.pCultura, formData.pFazenda).map((a, i) => (
                            <option key={i} value={a.nome}>{a.nome}</option>
                          ))}
                          {formData.pAno && formData.pAno !== '-' && !getAmarracoesAnos(formData.pEmpresa, formData.pCultura, formData.pFazenda).some(a => a.nome === formData.pAno) && (
                            <option value={formData.pAno}>{formData.pAno}</option>
                          )}
                        </select>
                      ) : (
                        <input type="text" placeholder="Ex: 2026" value={formData.pAno || ''} onChange={e => setFormData({ ...formData, pAno: e.target.value })} />
                      )}
                    </div>
                  </>
                )}

                {activePage === 'variedades' && (
                  <>
                    <div className="form-group">
                      <label>Código (somente números)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Ex: 10"
                        value={formData.autoCode || ''}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          setFormData({ ...formData, autoCode: val });
                        }}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Nome da Variedade</label>
                      <input
                        type="text"
                        placeholder="Digite o nome da variedade..."
                        value={formData.simpleName || ''}
                        onChange={e => setFormData({ ...formData, simpleName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Cultura Vinculada</label>
                      {culturasData.filter(isItemInSelectedUnidade).length > 0 ? (
                        <select
                          value={formData.vCultura || culturasData.filter(isItemInSelectedUnidade)[0]?.nome || ''}
                          onChange={e => setFormData({ ...formData, vCultura: e.target.value })}
                          required
                        >
                          {culturasData.filter(isItemInSelectedUnidade).map((c, i) => (
                            <option key={i} value={c.nome}>
                              {c.nome}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Digite o nome da cultura..."
                          value={formData.vCultura || ''}
                          onChange={e => setFormData({ ...formData, vCultura: e.target.value })}
                          required
                        />
                      )}
                    </div>
                  </>
                )}

                {activePage === 'colaboradores' && (
                  <>
                    <div className="form-group">
                      <label>Matrícula (somente números)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Ex: 101"
                        value={formData.autoCode || ''}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          setFormData({ ...formData, autoCode: val });
                        }}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Nome</label>
                      <input
                        type="text"
                        placeholder="Digite o nome completo..."
                        value={formData.nomeCompleto || ''}
                        onChange={e => setFormData({ ...formData, nomeCompleto: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Apontador</label>
                      <input
                        type="text"
                        placeholder="Ex: Carlos Eduardo"
                        value={formData.cApontador || ''}
                        onChange={e => setFormData({ ...formData, cApontador: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Local (Fazenda)</label>
                      {fazendasData.filter(isItemInSelectedUnidade).length > 0 ? (
                        <select
                          value={formData.cLocal || fazendasData.filter(isItemInSelectedUnidade)[0]?.nome || ''}
                          onChange={e => setFormData({ ...formData, cLocal: e.target.value })}
                          required
                        >
                          {fazendasData.filter(isItemInSelectedUnidade).map((f, i) => (
                            <option key={i} value={f.nome}>
                              {f.nome}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Digite o local..."
                          value={formData.cLocal || ''}
                          onChange={e => setFormData({ ...formData, cLocal: e.target.value })}
                          required
                        />
                      )}
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        value={formData.cStatus || 'Ativo'}
                        onChange={e => setFormData({ ...formData, cStatus: e.target.value })}
                        required
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                        <option value="Afastado">Afastado</option>
                      </select>
                    </div>
                  </>
                )}

                {activePage === 'motoristas' && (
                  <>
                    <div className="form-group">
                      <label>Código / Capa (somente números)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Ex: 201"
                        value={formData.autoCode || ''}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          setFormData({ ...formData, autoCode: val });
                        }}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Nome Completo</label>
                      <input
                        type="text"
                        placeholder="Digite o nome completo..."
                        value={formData.nomeCompleto || ''}
                        onChange={e => setFormData({ ...formData, nomeCompleto: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Abreviação do Nome</label>
                      <input
                        type="text"
                        placeholder="Ex: A. Lima ou R. Souza"
                        value={formData.abreviacao || ''}
                        onChange={e => setFormData({ ...formData, abreviacao: e.target.value })}
                        required
                      />
                    </div>
                  </>
                )}

                {activePage === 'onibus' && (
                  <>
                    <div className="form-group">
                      <label>Código do Ônibus (somente números)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Ex: 501"
                        value={formData.autoCode || ''}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          setFormData({ ...formData, autoCode: val });
                        }}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Placa</label>
                      <input
                        type="text"
                        placeholder="Ex: GMJ-5F34 ou GMJ-5434"
                        maxLength={8}
                        value={formData.nomeOnibus || ''}
                        onChange={e => {
                          const formatted = formatPlacaBus(e.target.value);
                          setFormData({ ...formData, nomeOnibus: formatted });
                        }}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Cor</label>
                      <input
                        type="text"
                        placeholder="Ex: Branco, Amarelo, Azul..."
                        value={formData.corOnibus || ''}
                        onChange={e => setFormData({ ...formData, corOnibus: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Motorista</label>
                      {motoristasData.filter(isItemInSelectedUnidade).length > 0 ? (
                        <select
                          value={formData.oMotorista || ''}
                          onChange={e => setFormData({ ...formData, oMotorista: e.target.value })}
                          required
                        >
                          <option value="">Selecione um motorista...</option>
                          {motoristasData.filter(isItemInSelectedUnidade).map((m, i) => {
                            const label = `${m.nome} (${m.abreviacao})`;
                            return (
                              <option key={i} value={label}>
                                {label} - Cód: {m.codigo}
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#d13438', padding: '6px', backgroundColor: '#fde7e9', borderRadius: '2px' }}>
                          <i className="fa-solid fa-triangle-exclamation"></i> Nenhum motorista cadastrado. Cadastre motoristas na aba "Cadastro_Motoristas" primeiro.
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Motorista Cooperado</label>
                      <select
                        value={formData.oCooperado || 'Não'}
                        onChange={e => {
                          const val = e.target.value;
                          const defaultLocal = val === 'Sim' ? 'COOPERATIVA AGRO' : (fazendasData[0]?.nome || '');
                          setFormData({ ...formData, oCooperado: val, oLocal: defaultLocal });
                        }}
                        required
                      >
                        <option value="Não">Não</option>
                        <option value="Sim">Sim</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>{formData.oCooperado === 'Sim' ? 'Local (Nome da Cooperativa)' : 'Local (Fazenda)'}</label>
                      {formData.oCooperado === 'Sim' ? (
                        <>
                          <input
                            type="text"
                            list="cooperativasDatalist"
                            placeholder="Digite ou escolha o nome da cooperativa..."
                            value={formData.oLocal || ''}
                            onChange={e => setFormData({ ...formData, oLocal: e.target.value })}
                            required
                          />
                          <datalist id="cooperativasDatalist">
                            <option value="COOPERATIVA AGRO" />
                            <option value="COOPAMARGOS" />
                            <option value="COOPERATIVA SANTA RITA" />
                            <option value="COOPERCITRUS" />
                            {empresasData.filter(isItemInSelectedUnidade).map((emp, i) => (
                              <option key={i} value={emp.nome} />
                            ))}
                          </datalist>
                        </>
                      ) : fazendasData.filter(isItemInSelectedUnidade).length > 0 ? (
                        <select
                          value={formData.oLocal || fazendasData.filter(isItemInSelectedUnidade)[0]?.nome || ''}
                          onChange={e => setFormData({ ...formData, oLocal: e.target.value })}
                          required
                        >
                          {fazendasData.filter(isItemInSelectedUnidade).map((f, i) => (
                            <option key={i} value={f.nome}>
                              {f.nome}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Digite o local ou fazenda..."
                          value={formData.oLocal || ''}
                          onChange={e => setFormData({ ...formData, oLocal: e.target.value })}
                          required
                        />
                      )}
                    </div>
                  </>
                )}

                {activePage !== 'colheita' && activePage !== 'plantio' && activePage !== 'variedades' && activePage !== 'colaboradores' && activePage !== 'motoristas' && activePage !== 'onibus' && (
                  <>
                    <div className="form-group">
                      <label>Código (somente números)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Ex: 1"
                        value={formData.autoCode || ''}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          setFormData({ ...formData, autoCode: val });
                        }}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        {activePage === 'pivos'
                          ? 'Nome do Pivô'
                          : activePage === 'glebas'
                          ? 'Nome da Gleba'
                          : activePage === 'fazendas'
                          ? 'Nome da Fazenda'
                          : activePage === 'empresas'
                          ? 'Nome da Empresa'
                          : activePage === 'anos'
                          ? 'Ano (ex: 2026)'
                          : 'Nome da Cultura'}
                      </label>
                      <input
                        type="text"
                        placeholder={
                          activePage === 'pivos'
                            ? 'Digite o nome do pivô...'
                            : activePage === 'glebas'
                            ? 'Digite o nome da gleba...'
                            : activePage === 'fazendas'
                            ? 'Digite o nome da fazenda...'
                            : activePage === 'empresas'
                            ? 'Digite o nome da empresa...'
                            : activePage === 'anos'
                            ? 'Ex: 2026'
                            : 'Digite o nome da cultura...'
                        }
                        value={formData.simpleName || ''}
                        onChange={e => setFormData({ ...formData, simpleName: e.target.value })}
                        required
                      />
                    </div>
                    {activePage === 'culturas' && (
                      <div className="form-group">
                        <label>Tipo de Cultura (Vinculação de Glebas)</label>
                        <select
                          value={formData.cTipoCultura || 'Hortifruti'}
                          onChange={e => setFormData({ ...formData, cTipoCultura: e.target.value })}
                          required
                        >
                          <option value="Hortifruti">🍎 Hortifruti (Vinculado a Glebas H)</option>
                          <option value="Cereais">🌾 Cereais (Vinculado a Glebas C)</option>
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="modal-actions">
                {editingIndex !== null && (
                  <button
                    type="button"
                    className="btn-delete-modal"
                    onClick={() => {
                      const idxToDelete = editingIndex;
                      closeModal();
                      deleteRow(activePage as MainCategoryKey, idxToDelete);
                    }}
                  >
                    <i className="fa-solid fa-trash"></i> Excluir Item
                  </button>
                )}
                <button type="submit" className="btn-save">Salvar</button>
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPARTILHAMENTO */}
      {isShareOpen && (
        <div className="share-overlay" id="shareOverlay" style={{ display: 'flex' }} onClick={() => setIsShareOpen(false)}>
          <div className="share-sheet" onClick={e => e.stopPropagation()}>
            <div className="share-sheet-header">
              <span className="share-sheet-title">Compartilhar dados filtrados</span>
              <i className="fa-solid fa-xmark" style={{ cursor: 'pointer', fontSize: '16px' }} onClick={() => setIsShareOpen(false)}></i>
            </div>
            <div className="share-grid">
              <a
                id="shareWhatsappWeb"
                target="_blank"
                rel="noreferrer"
                href={`https://web.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                className="share-item"
                title="Abrir no WhatsApp Web (Navegador/Computador)"
              >
                <div className="share-icon bg-whatsapp"><i className="fa-brands fa-whatsapp"></i></div>
                <span>WhatsApp Web (PC)</span>
              </a>
              <a
                id="shareWhatsappApp"
                target="_blank"
                rel="noreferrer"
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                className="share-item"
                title="Abrir no Aplicativo do WhatsApp"
              >
                <div className="share-icon bg-whatsapp" style={{ opacity: 0.85 }}><i className="fa-brands fa-whatsapp"></i></div>
                <span>WhatsApp App</span>
              </a>
              <a
                id="shareTelegram"
                target="_blank"
                rel="noreferrer"
                href={`https://t.me/share/url?url=&text=${encodeURIComponent(shareText)}`}
                className="share-item"
              >
                <div className="share-icon bg-telegram"><i className="fa-brands fa-telegram"></i></div>
                <span>Telegram</span>
              </a>
              <a
                id="shareEmail"
                href={`mailto:?subject=${encodeURIComponent('Relatório Agrícola')}&body=${encodeURIComponent(shareText)}`}
                className="share-item"
              >
                <div className="share-icon bg-email"><i className="fa-regular fa-envelope"></i></div>
                <span>E-mail</span>
              </a>
              <div className="share-item" onClick={copyShareText}>
                <div className="share-icon bg-copy"><i className="fa-regular fa-copy"></i></div>
                <span>Copiar Texto</span>
              </div>
              <div className="share-item" onClick={() => { setIsShareOpen(false); window.print(); }}>
                <div className="share-icon" style={{ backgroundColor: '#0078d4', color: '#fff' }}><i className="fa-solid fa-print"></i></div>
                <span>Imprimir</span>
              </div>
            </div>
            <button className="btn-cancel" style={{ width: '100%' }} onClick={() => setIsShareOpen(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION BANNER WITH UNDO */}
      {toast && (
        <div className="toast-container">
          <div className={`toast-message toast-${toast.type}`}>
            <div className="toast-content">
              <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : toast.type === 'info' ? 'fa-circle-info' : 'fa-triangle-exclamation'}`}></i>
              <span>{toast.message}</span>
            </div>
            {toast.onUndo && (
              <button
                type="button"
                className="toast-undo-btn"
                onClick={() => {
                  if (toast.onUndo) toast.onUndo();
                  setToast(null);
                }}
              >
                <i className="fa-solid fa-rotate-left"></i> Desfazer
              </button>
            )}
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmModal && confirmModal.isOpen && (
        <div className="confirm-modal-backdrop" onClick={() => setConfirmModal(null)}>
          <div className="confirm-modal-card" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="confirm-modal-close"
              onClick={() => setConfirmModal(null)}
              title="Cancelar e fechar (Esc)"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="confirm-modal-header">
              <div className={`confirm-modal-icon-badge ${confirmModal.confirmStyle || 'danger'}`}>
                <i className="fa-solid fa-trash-can"></i>
              </div>
              <div className="confirm-modal-header-text">
                <h3>{confirmModal.title}</h3>
                <span className="confirm-modal-subtitle">Confirmação de segurança</span>
              </div>
            </div>

            <div className="confirm-modal-body">
              <p className="confirm-modal-message">{confirmModal.message}</p>

              {confirmModal.itemDetails && confirmModal.itemDetails.length > 0 && (
                <div className="confirm-modal-details-card">
                  <div className="confirm-modal-details-title">Resumo do Item:</div>
                  {confirmModal.itemDetails.map((det, idx) => (
                    <div key={idx} className="confirm-detail-row">
                      <span className="confirm-detail-label">{det.label}:</span>
                      <span className="confirm-detail-value">{det.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {confirmModal.isTrashMove ? (
                <div className="confirm-modal-info-banner">
                  <i className="fa-solid fa-shield-halved"></i>
                  <span>Fique tranquilo! Você poderá restaurar este item a qualquer momento na <strong>Lixeira</strong>.</span>
                </div>
              ) : (
                <div className="confirm-modal-warning-banner">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  <span>Atenção: Esta exclusão é permanente e não poderá ser desfeita.</span>
                </div>
              )}
            </div>

            <div className="confirm-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setConfirmModal(null)}
              >
                <i className="fa-solid fa-arrow-left"></i> Voltar / Não Excluir
              </button>
              <button
                type="button"
                className="btn-modal-danger"
                onClick={() => confirmModal.onConfirm()}
              >
                <i className="fa-solid fa-trash-can"></i> {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA AMARRAÇÃO / MARCAÇÃO */}
      {isAmarracaoModalOpen && (
        <div className="modal-backdrop open" onClick={() => { setIsAmarracaoModalOpen(false); setEditingAmarracao(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-pen-to-square" style={{ color: '#0078d4' }}></i>
                {editingAmarracao ? 'Editar Amarração' : 'Nova Amarração / Marcação'}
              </h3>
              <button type="button" className="modal-close" onClick={() => { setIsAmarracaoModalOpen(false); setEditingAmarracao(null); }}>&times;</button>
            </div>

            <form onSubmit={handleSaveAmarracao} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px' }}>
                <div className="form-group">
                  <label>Quadrado / Categoria do Vínculo</label>
                  <select
                    value={amarracaoFormData.categoria}
                    onChange={e => setAmarracaoFormData({ ...amarracaoFormData, categoria: e.target.value as AmarracaoCategory })}
                    required
                  >
                    <option value="cultura">🌾 Cultura</option>
                    <option value="pivo">⭕ Pivô</option>
                    <option value="gleba">📐 Gleba</option>
                    <option value="variedade">🧬 Variedade</option>
                    <option value="ano">📅 Ano Safra</option>
                    <option value="geral">⚙️ Geral</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Item de Origem (Principal)</label>
                  {editingAmarracao || amarracaoFormData.categoria === 'geral' ? (
                    <input
                      type="text"
                      placeholder="Ex: Fazenda Sol / Empresa / Origem"
                      value={amarracaoFormData.origem}
                      onChange={e => setAmarracaoFormData({ ...amarracaoFormData, origem: e.target.value })}
                      required
                    />
                  ) : amarracaoFormData.categoria === 'cultura' ? (
                    <select
                      value={amarracaoFormData.origem}
                      onChange={e => setAmarracaoFormData({ ...amarracaoFormData, origem: e.target.value })}
                      required
                    >
                      <option value="">-- Selecione a Cultura --</option>
                      {culturasData.filter(isItemInSelectedUnidade).map((c, i) => (
                        <option key={i} value={c.nome}>{c.nome}</option>
                      ))}
                    </select>
                  ) : amarracaoFormData.categoria === 'pivo' ? (
                    <select
                      value={amarracaoFormData.origem}
                      onChange={e => setAmarracaoFormData({ ...amarracaoFormData, origem: e.target.value })}
                      required
                    >
                      <option value="">-- Selecione o Pivô --</option>
                      {pivosData.filter(isItemInSelectedUnidade).map((p, i) => (
                        <option key={i} value={p.nome}>{p.nome}</option>
                      ))}
                    </select>
                  ) : amarracaoFormData.categoria === 'gleba' ? (
                    <select
                      value={amarracaoFormData.origem}
                      onChange={e => setAmarracaoFormData({ ...amarracaoFormData, origem: e.target.value })}
                      required
                    >
                      <option value="">-- Selecione a Gleba --</option>
                      {glebasData.filter(isItemInSelectedUnidade).map((g, i) => (
                        <option key={i} value={g.nome}>{g.nome}</option>
                      ))}
                    </select>
                  ) : amarracaoFormData.categoria === 'variedade' ? (
                    <select
                      value={amarracaoFormData.origem}
                      onChange={e => setAmarracaoFormData({ ...amarracaoFormData, origem: e.target.value })}
                      required
                    >
                      <option value="">-- Selecione a Variedade --</option>
                      {variedadesData.filter(isItemInSelectedUnidade).map((v, i) => (
                        <option key={i} value={v.nome}>{v.nome}</option>
                      ))}
                    </select>
                  ) : amarracaoFormData.categoria === 'ano' ? (
                    <select
                      value={amarracaoFormData.origem}
                      onChange={e => setAmarracaoFormData({ ...amarracaoFormData, origem: e.target.value })}
                      required
                    >
                      <option value="">-- Selecione o Ano Safra --</option>
                      {anosData.filter(isItemInSelectedUnidade).map((a, i) => (
                        <option key={i} value={a.nome}>{a.nome}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Ex: Regra de Validação Geral"
                      value={amarracaoFormData.origem}
                      onChange={e => setAmarracaoFormData({ ...amarracaoFormData, origem: e.target.value })}
                      required
                    />
                  )}
                </div>

                <div className="form-group">
                  <label>Item Amarrado / Destino</label>
                  {editingAmarracao || amarracaoFormData.categoria === 'geral' ? (
                    <input
                      type="text"
                      placeholder="Ex: Pivô 01 / Variedade X / Destino"
                      value={amarracaoFormData.destino}
                      onChange={e => setAmarracaoFormData({ ...amarracaoFormData, destino: e.target.value })}
                      required
                    />
                  ) : amarracaoFormData.categoria === 'cultura' ? (
                    <select
                      value={amarracaoFormData.destino}
                      onChange={e => setAmarracaoFormData({ ...amarracaoFormData, destino: e.target.value })}
                      required
                    >
                      <option value="">-- Selecione a Variedade Amarrada --</option>
                      {variedadesData.filter(isItemInSelectedUnidade).map((v, i) => (
                        <option key={i} value={v.nome}>{v.nome}</option>
                      ))}
                    </select>
                  ) : amarracaoFormData.categoria === 'pivo' ? (
                    <select
                      value={amarracaoFormData.destino}
                      onChange={e => setAmarracaoFormData({ ...amarracaoFormData, destino: e.target.value })}
                      required
                    >
                      <option value="">-- Selecione a Gleba ou Fazenda --</option>
                      {glebasData.filter(isItemInSelectedUnidade).map((g, i) => (
                        <option key={`g-${i}`} value={`Gleba: ${g.nome}`}>{`Gleba: ${g.nome}`}</option>
                      ))}
                      {fazendasData.filter(isItemInSelectedUnidade).map((f, i) => (
                        <option key={`f-${i}`} value={`Fazenda: ${f.nome}`}>{`Fazenda: ${f.nome}`}</option>
                      ))}
                    </select>
                  ) : amarracaoFormData.categoria === 'gleba' ? (
                    <input
                      type="text"
                      placeholder="Ex: 115,00 ha (Irrigada) / Pivô 11"
                      value={amarracaoFormData.destino}
                      onChange={e => setAmarracaoFormData({ ...amarracaoFormData, destino: e.target.value })}
                      required
                    />
                  ) : amarracaoFormData.categoria === 'variedade' ? (
                    <select
                      value={amarracaoFormData.destino}
                      onChange={e => setAmarracaoFormData({ ...amarracaoFormData, destino: e.target.value })}
                      required
                    >
                      <option value="">-- Selecione a Cultura --</option>
                      {culturasData.filter(isItemInSelectedUnidade).map((c, i) => (
                        <option key={i} value={c.nome}>{c.nome}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Ex: Safra Vigente / Obrigatoriedade"
                      value={amarracaoFormData.destino}
                      onChange={e => setAmarracaoFormData({ ...amarracaoFormData, destino: e.target.value })}
                      required
                    />
                  )}
                </div>

                <div className="form-group">
                  <label>Título / Nome da Amarração (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Vínculo Padrão Milho x Variedade"
                    value={amarracaoFormData.titulo}
                    onChange={e => setAmarracaoFormData({ ...amarracaoFormData, titulo: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Área / Hectares (ha) (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: 115,00"
                    value={amarracaoFormData.hectares}
                    onChange={e => setAmarracaoFormData({ ...amarracaoFormData, hectares: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={amarracaoFormData.status}
                    onChange={e => setAmarracaoFormData({ ...amarracaoFormData, status: e.target.value as 'Ativo' | 'Inativo' })}
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Observação / Detalhes</label>
                  <input
                    type="text"
                    placeholder="Digite observações sobre esta amarração..."
                    value={amarracaoFormData.observacao}
                    onChange={e => setAmarracaoFormData({ ...amarracaoFormData, observacao: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => { setIsAmarracaoModalOpen(false); setEditingAmarracao(null); }}>Cancelar</button>
                <button type="submit" className="btn-modal-save">
                  <i className="fa-solid fa-check"></i> {editingAmarracao ? 'Salvar Alterações' : 'Salvar Amarração'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TELA CHEIA (FULLSCREEN) - CENTRAL DOS 6 PONTINHOS (MATRIZ XADREZ 3x2 / 2x3 NO CELULAR) */}
      {isAmarracoesWindowOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999,
            backgroundColor: '#f3f2f1',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* BARRA SUPERIOR DE CABEÇALHO */}
          <div style={{
            backgroundColor: '#0078d4',
            color: '#ffffff',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-grip-vertical" style={{ fontSize: '20px' }}></i>
              <span style={{ fontWeight: 600, fontSize: '16px', letterSpacing: '0.3px' }}>
                Central de Marcações e Amarrações
              </span>
            </div>

            <button
              onClick={() => setIsAmarracoesWindowOpen(false)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 14px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.15s'
              }}
              title="Fechar Tela Cheia"
            >
              <span>Fechar</span>
              <i className="fa-solid fa-xmark" style={{ fontSize: '14px' }}></i>
            </button>
          </div>

          {/* ÁREA PRINCIPAL DA TELA CHEIA COM OS 6 QUADRADOS E ÁREA DE GERENCIAMENTO */}
          <div style={{
            flex: 1,
            backgroundColor: '#f8f9fa',
            padding: '20px 16px 40px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            overflowY: 'auto'
          }}>
            {/* DEFINIÇÃO DOS 6 SQUARES NA ORDEM EXATA REQUESTADA: Cultura, Fazenda, Pivô, Gleba, Variedade e Geral */}
            {(() => {
              const unitEmpresas = empresasData.filter(isItemInSelectedUnidade);
              const unitAnos = anosData.filter(isItemInSelectedUnidade);
              const unitCulturas = culturasData.filter(isItemInSelectedUnidade);
              const unitFazendas = fazendasData.filter(isItemInSelectedUnidade);
              const unitVariedades = variedadesData.filter(isItemInSelectedUnidade);
              const unitAmarracoes = amarracoesData.filter(isItemInSelectedUnidade);

              const filteredVariedadesData = selectedCulturaForTie
                ? unitVariedades.filter(v => v.cultura && v.cultura.trim().toLowerCase() === selectedCulturaForTie.trim().toLowerCase())
                : unitVariedades;

              const filteredPivosData = getLinkedPivosForFazenda(selectedFazendaForTie);
              const rawGlebasData = getLinkedGlebasForPivo(selectedPivoForTie, selectedFazendaForTie, selectedCulturaForTie);
              const filteredGlebasData = filterGlebasByCulturaType(rawGlebasData, selectedCulturaForTie);

              const selectedCulturaObj = unitCulturas.find(c => c.nome.trim().toLowerCase() === (selectedCulturaForTie || '').trim().toLowerCase());
              const selectedCulturaType = selectedCulturaObj?.tipo || getCulturaType(selectedCulturaForTie);

              const squares = [
                {
                  key: 'empresa',
                  name: 'Empresa',
                  icon: 'fa-building',
                  color: '#005a9e',
                  data: sortAlphanumeric(unitEmpresas),
                  selectedVal: selectedEmpresaForTie,
                  onSelect: (val: string) => setSelectedEmpresaForTie(prev => prev === val ? '' : val)
                },
                {
                  key: 'ano',
                  name: 'Ano Safra',
                  icon: 'fa-calendar-days',
                  color: '#b4009e',
                  data: sortAlphanumeric(unitAnos),
                  selectedVal: selectedAnoForTie,
                  onSelect: (val: string) => setSelectedAnoForTie(prev => prev === val ? '' : val)
                },
                {
                  key: 'cultura',
                  name: 'Cultura',
                  icon: 'fa-wheat-awn',
                  color: '#107c41',
                  data: sortAlphanumeric(unitCulturas),
                  selectedVal: selectedCulturaForTie,
                  onSelect: (val: string) => handleSelectCultura(val)
                },
                {
                  key: 'fazenda',
                  name: 'Fazenda',
                  icon: 'fa-location-dot',
                  color: '#0078d4',
                  data: sortAlphanumeric(unitFazendas),
                  selectedVal: selectedFazendaForTie,
                  onSelect: (val: string) => setSelectedFazendaForTie(prev => prev === val ? '' : val)
                },
                {
                  key: 'pivo',
                  name: selectedFazendaForTie ? `Pivô (${selectedFazendaForTie})` : 'Pivô',
                  icon: 'fa-circle-notch',
                  color: '#0078d4',
                  data: sortAlphanumeric(filteredPivosData),
                  selectedVal: selectedPivoForTie,
                  onSelect: (val: string) => setSelectedPivoForTie(prev => prev === val ? '' : val)
                },
                {
                  key: 'gleba',
                  name: selectedCulturaType
                    ? `Gleba (${selectedCulturaType})`
                    : selectedPivoForTie
                    ? `Gleba (${selectedPivoForTie})`
                    : 'Gleba',
                  icon: 'fa-vector-square',
                  color: '#5c2d91',
                  data: sortAlphanumeric(filteredGlebasData),
                  selectedVal: selectedGlebaForTie,
                  onSelect: (val: string) => setSelectedGlebaForTie(prev => prev === val ? '' : val)
                },
                {
                  key: 'variedade',
                  name: selectedCulturaForTie ? `Variedade (${selectedCulturaForTie})` : 'Variedade',
                  icon: 'fa-dna',
                  color: '#d13438',
                  data: sortAlphanumeric(filteredVariedadesData),
                  selectedVal: selectedVariedadeForTie,
                  onSelect: (val: string) => setSelectedVariedadeForTie(prev => prev === val ? '' : val)
                },
                {
                  key: 'geral',
                  name: 'Geral',
                  icon: 'fa-link',
                  color: '#794b00',
                  data: unitAmarracoes,
                  selectedVal: '',
                  onSelect: () => {}
                }
              ];

              // Cadeia de ordens selecionadas para o Geral
              const currentChain = [
                selectedEmpresaForTie && { label: 'Empresa', val: selectedEmpresaForTie, color: '#005a9e', icon: 'fa-building' },
                selectedAnoForTie && { label: 'Ano', val: selectedAnoForTie, color: '#b4009e', icon: 'fa-calendar-days' },
                selectedCulturaForTie && { label: 'Cultura', val: selectedCulturaForTie, color: '#107c41', icon: 'fa-wheat-awn' },
                selectedFazendaForTie && { label: 'Fazenda', val: selectedFazendaForTie, color: '#0078d4', icon: 'fa-location-dot' },
                selectedPivoForTie && { label: 'Pivô', val: selectedPivoForTie, color: '#0078d4', icon: 'fa-circle-notch' },
                selectedGlebaForTie && { label: 'Gleba', val: selectedGlebaForTie, color: '#5c2d91', icon: 'fa-vector-square' },
                selectedVariedadeForTie && { label: 'Variedade', val: selectedVariedadeForTie, color: '#d13438', icon: 'fa-dna' }
              ].filter(Boolean) as { label: string; val: string; color: string; icon: string }[];

              return (
                <>
                  {/* INSTRUÇÃO E BARRA DE RESUMO EM TEMPO REAL */}
                  <div style={{
                    width: '100%',
                    maxWidth: '1080px',
                    marginBottom: '16px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e1dfdd',
                    borderRadius: '8px',
                    padding: '12px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-hand-pointer" style={{ color: '#0078d4', fontSize: '14px' }}></i>
                      <span style={{ fontSize: '13px', color: '#323130', fontWeight: 600 }}>
                        Clique em um quadrado para abrir as opções. Selecione os itens para amarrar no Geral!
                      </span>
                    </div>

                    {currentChain.length > 0 && (
                      <button
                        onClick={() => {
                          setSelectedEmpresaForTie('');
                          setSelectedAnoForTie('');
                          setSelectedCulturaForTie('');
                          setSelectedFazendaForTie('');
                          setSelectedPivoForTie('');
                          setSelectedGlebaForTie('');
                          setSelectedVariedadeForTie('');
                          showToast('Seleções limpas.', 'info');
                        }}
                        style={{
                          backgroundColor: '#f3f2f1',
                          color: '#a80000',
                          border: '1px solid #e1dfdd',
                          borderRadius: '4px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <i className="fa-solid fa-rotate-left"></i> Limpar Seleções
                      </button>
                    )}
                  </div>

                  {/* GRID XADREZ DOS 6 QUADRADOS */}
                  <div className="amarracoes-grid-container">
                    <div className="amarracoes-grid">
                      {squares.map((sq) => {
                        const isOpen = activeSquareKey === sq.key;
                        const hasSelection = Boolean(sq.selectedVal);

                        return (
                          <div
                            key={sq.key}
                            className={`amarracoes-square-item ${isOpen ? 'active' : ''}`}
                            onClick={() => {
                              if (activeSquareKey !== sq.key) {
                                setActiveSquareKey(sq.key as any);
                                setSearchSquareQuery('');
                                setNewSquareItemName('');
                              }
                            }}
                          >
                            {/* CABEÇALHO DO QUADRADO */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              borderBottom: '1px solid #f3f2f1',
                              paddingBottom: '8px',
                              width: '100%'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <i className={`fa-solid ${sq.icon}`} style={{ fontSize: '14px', color: sq.color }}></i>
                                <span style={{
                                  fontSize: '13px',
                                  fontWeight: 700,
                                  color: '#323130'
                                }}>
                                  {sq.name}
                                </span>
                              </div>
                              {sq.key !== 'geral' && (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  backgroundColor: hasSelection ? sq.color : (isOpen ? sq.color : '#f3f2f1'),
                                  color: (hasSelection || isOpen) ? '#ffffff' : '#605e5c',
                                  padding: '2px 8px',
                                  borderRadius: '10px'
                                }}>
                                  {hasSelection ? '1 Selecionado' : `${sq.data.length} Opções`}
                                </span>
                              )}
                              {sq.key === 'geral' && (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  backgroundColor: '#794b00',
                                  color: '#ffffff',
                                  padding: '2px 8px',
                                  borderRadius: '10px'
                                }}>
                                  {currentChain.length} Ordens
                                </span>
                              )}
                            </div>

                            {/* CORPO DO QUADRADO */}
                            <div style={{
                              flex: 1,
                              width: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: isOpen ? 'flex-start' : 'center',
                              alignItems: 'flex-start',
                              gap: '6px',
                              padding: '8px 0',
                              overflowY: 'auto',
                              maxHeight: '180px'
                            }}>
                              {/* QUADRADO FECHADO (LIMPO / VAZIO) */}
                              {!isOpen && (
                                <div style={{ width: '100%', textAlign: 'center', padding: '10px 0' }}>
                                  {sq.key === 'geral' ? (
                                    currentChain.length === 0 ? (
                                      <div style={{ fontSize: '11px', color: '#a19f9d', fontStyle: 'italic' }}>
                                        Quadrado Geral Vazio.<br />
                                        <span style={{ fontSize: '10px', color: '#605e5c' }}>Selecione itens nos outros quadrados para ver a ligação.</span>
                                      </div>
                                    ) : (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#794b00' }}>LIGAÇÃO ATUAL:</span>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px' }}>
                                          {currentChain.map((item, idx) => (
                                            <React.Fragment key={idx}>
                                              <span style={{
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                backgroundColor: `${item.color}18`,
                                                color: item.color,
                                                padding: '2px 6px',
                                                borderRadius: '4px'
                                              }}>
                                                {item.val}
                                              </span>
                                              {idx < currentChain.length - 1 && (
                                                <i className="fa-solid fa-arrow-right" style={{ fontSize: '8px', color: '#a19f9d' }}></i>
                                              )}
                                            </React.Fragment>
                                          ))}
                                        </div>
                                      </div>
                                    )
                                  ) : hasSelection ? (
                                    <div style={{
                                      backgroundColor: `${sq.color}15`,
                                      border: `1px solid ${sq.color}40`,
                                      borderRadius: '6px',
                                      padding: '8px 10px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px'
                                    }}>
                                      <i className="fa-solid fa-circle-check" style={{ color: sq.color, fontSize: '12px' }}></i>
                                      <span style={{ fontSize: '12px', fontWeight: 700, color: sq.color }}>
                                        {sq.selectedVal}
                                      </span>
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: '11px', color: '#a19f9d', fontStyle: 'italic' }}>
                                      Vazio (Clique para abrir)
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* QUADRADO ABERTO / CLICADO (CONTEÚDO INTERNO INTERATIVO) */}
                              {isOpen && (
                                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {sq.key === 'geral' ? (
                                    /* CONTEÚDO DO QUADRADO GERAL ABERTO */
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#794b00' }}>
                                        LIGAÇÃO DAS ORDENS:
                                      </span>

                                      {currentChain.length === 0 ? (
                                        <div style={{ fontSize: '11px', color: '#a19f9d', fontStyle: 'italic', padding: '6px 0' }}>
                                          Nenhum item selecionado ainda.<br />
                                          Clique nos quadrados de Cultura, Fazenda, Pivô, Gleba ou Variedade para selecionar!
                                        </div>
                                      ) : (
                                        <div style={{
                                          backgroundColor: '#ffffff',
                                          border: '1px solid #794b0033',
                                          borderRadius: '6px',
                                          padding: '8px',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: '6px'
                                        }}>
                                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px' }}>
                                            {currentChain.map((item, idx) => (
                                              <React.Fragment key={idx}>
                                                <span style={{
                                                  fontSize: '11px',
                                                  fontWeight: 700,
                                                  backgroundColor: item.color,
                                                  color: '#ffffff',
                                                  padding: '3px 8px',
                                                  borderRadius: '4px',
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  gap: '4px'
                                                }}>
                                                  <i className={`fa-solid ${item.icon}`} style={{ fontSize: '10px' }}></i>
                                                  {item.val}
                                                </span>
                                                {idx < currentChain.length - 1 && (
                                                  <i className="fa-solid fa-right-long" style={{ fontSize: '10px', color: '#794b00' }}></i>
                                                )}
                                              </React.Fragment>
                                            ))}
                                          </div>

                                          {/* CAMPO DE TAMANHO EM HECTARES */}
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }} onClick={e => e.stopPropagation()}>
                                            <label style={{ fontSize: '10px', fontWeight: 700, color: '#107c41', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                              <i className="fa-solid fa-chart-area"></i> Tamanho da Área (Hectares):
                                            </label>
                                            <input
                                              type="text"
                                              inputMode="decimal"
                                              value={tieHectares}
                                              onChange={e => setTieHectares(sanitizeHectaresInput(e.target.value))}
                                              placeholder="Ex: 120,50"
                                              style={{
                                                padding: '4px 8px',
                                                fontSize: '11px',
                                                border: '1px solid #c8c6c4',
                                                borderRadius: '4px',
                                                outline: 'none',
                                                width: '100%',
                                                boxSizing: 'border-box'
                                              }}
                                            />
                                          </div>

                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleCreateGeralTie(e);
                                            }}
                                            style={{
                                              backgroundColor: '#794b00',
                                              color: '#ffffff',
                                              border: 'none',
                                              borderRadius: '4px',
                                              padding: '6px 10px',
                                              fontSize: '11px',
                                              fontWeight: 700,
                                              cursor: 'pointer',
                                              marginTop: '4px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              gap: '6px'
                                            }}
                                          >
                                            <i className="fa-solid fa-link"></i> Salvar Amarração no Geral
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    /* CONTEÚDO DOS OUTROS QUADRADOS ABERTOS (Cultura, Fazenda, Pivô, Gleba, Variedade) */
                                    <>
                                      {/* MENSAGEM INFORMATIVA PARA VARIEDADE SEM CULTURA SELECIONADA */}
                                      {sq.key === 'variedade' && !selectedCulturaForTie && (
                                        <div style={{ fontSize: '10px', color: '#0078d4', backgroundColor: '#eff6fc', padding: '4px 8px', borderRadius: '4px', marginBottom: '2px', width: '100%' }}>
                                          <i className="fa-solid fa-circle-info" style={{ marginRight: '4px' }}></i>
                                          Selecione uma <b>Cultura</b> para filtrar as variedades.
                                        </div>
                                      )}

                                      {/* MENSAGEM INFORMATIVA PARA GLEBA COM CULTURA SELECIONADA */}
                                      {sq.key === 'gleba' && selectedCulturaForTie && selectedCulturaType && (
                                        <div style={{ fontSize: '10px', color: '#5c2d91', backgroundColor: '#f3f0f8', padding: '4px 8px', borderRadius: '4px', marginBottom: '2px', width: '100%' }}>
                                          <i className="fa-solid fa-filter" style={{ marginRight: '4px' }}></i>
                                          Filtrando glebas de <b>{selectedCulturaType}</b> ({selectedCulturaType === 'Hortifruti' ? 'Glebas H' : 'Glebas C'}) para a cultura <b>{selectedCulturaForTie}</b>.
                                        </div>
                                      )}

                                      {/* LISTA DE ITENS DENTRO DO QUADRADO PARA SELECIONAR */}
                                      {sq.data.length === 0 ? (
                                        <span style={{ fontSize: '10px', color: '#a19f9d', fontStyle: 'italic', padding: '6px 0' }}>
                                          Nenhum {sq.name.toLowerCase()} cadastrado.
                                        </span>
                                      ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%' }}>
                                          {sq.data.map((item: any) => {
                                            const isItemSelected = sq.selectedVal === item.nome;

                                            return (
                                              <div
                                                key={item.codigo}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  sq.onSelect(item.nome);
                                                }}
                                                style={{
                                                  padding: '5px 8px',
                                                  borderRadius: '4px',
                                                  backgroundColor: isItemSelected ? `${sq.color}20` : '#f3f2f1',
                                                  border: isItemSelected ? `1px solid ${sq.color}` : '1px solid transparent',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'space-between',
                                                  cursor: 'pointer',
                                                  fontSize: '11px',
                                                  fontWeight: isItemSelected ? 700 : 500,
                                                  color: isItemSelected ? sq.color : '#323130'
                                                }}
                                              >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                                                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {item.nome}
                                                  </span>
                                                  {sq.key === 'cultura' && item.tipo && (
                                                    <span style={{ fontSize: '9px', fontWeight: 600, color: item.tipo === 'Hortifruti' ? '#107c41' : '#794b00', backgroundColor: item.tipo === 'Hortifruti' ? '#dff6dd' : '#fff4ce', padding: '1px 5px', borderRadius: '3px', whiteSpace: 'nowrap' }}>
                                                      {item.tipo}
                                                    </span>
                                                  )}
                                                  {sq.key === 'variedade' && item.cultura && (
                                                    <span style={{ fontSize: '9px', fontWeight: 600, color: '#107c41', backgroundColor: '#dff6dd', padding: '1px 5px', borderRadius: '3px', whiteSpace: 'nowrap' }}>
                                                      {item.cultura}
                                                    </span>
                                                  )}
                                                </div>
                                                {isItemSelected && (
                                                  <i className="fa-solid fa-check" style={{ fontSize: '10px', color: sq.color }}></i>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* RÓTULO NO RODAPÉ DO QUADRADO */}
                            <div style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingTop: '6px',
                              borderTop: '1px solid #f3f2f1',
                              fontSize: '10px',
                              color: isOpen ? sq.color : '#a19f9d',
                              fontWeight: isOpen ? 700 : 500
                            }}>
                              <span>{isOpen ? '● Aberto (Escolha o item)' : 'Clique para abrir'}</span>
                              <i className={`fa-solid ${isOpen ? 'fa-chevron-down' : 'fa-chevron-right'}`} style={{ fontSize: '10px' }}></i>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* HISTÓRICO DE AMARRAÇÕES E LIGAÇÕES SALVAS NO GERAL */}
                  {(() => {
                    const unitAmarracoes = amarracoesData.filter(isItemInSelectedUnidade);
                    return (
                      <div style={{
                        width: '100%',
                        maxWidth: '1080px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e1dfdd',
                        borderRadius: '8px',
                        padding: '18px 20px',
                        marginTop: '20px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '14px',
                          borderBottom: '1px solid #f3f2f1',
                          paddingBottom: '10px',
                          flexWrap: 'wrap',
                          gap: '10px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fa-solid fa-list-check" style={{ color: '#794b00', fontSize: '16px' }}></i>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#323130', margin: 0 }}>
                              Amarrações e Ligações de Ordens Cadastradas no Geral ({unitAmarracoes.length})
                            </h3>
                          </div>
                          <button
                            onClick={() => openNewAmarracaoModal('geral')}
                            style={{
                              backgroundColor: '#794b00',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <i className="fa-solid fa-plus"></i> Nova Amarração
                          </button>
                        </div>

                        {unitAmarracoes.length === 0 ? (
                          <div style={{ fontSize: '12px', color: '#a19f9d', fontStyle: 'italic', padding: '16px 0', textAlign: 'center' }}>
                            Nenhuma amarração gravada no Geral para a unidade "{selectedUnidade}". Selecione os itens nos quadrados acima e clique em "Salvar Amarração no Geral"!
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {unitAmarracoes.map((tie) => (
                              <div
                                key={tie.id}
                                style={{
                                  backgroundColor: '#faf9f8',
                                  border: '1px solid #e1dfdd',
                                  borderRadius: '6px',
                                  padding: '10px 14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '12px',
                                  flexWrap: 'wrap'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    fontFamily: 'monospace',
                                    backgroundColor: '#794b0018',
                                    color: '#794b00',
                                    padding: '2px 7px',
                                    borderRadius: '4px',
                                    border: '1px solid #794b0033'
                                  }}>
                                    {tie.codigoMarca || `#AMR-${tie.id.slice(-5)}`}
                                  </span>
                                  <i className="fa-solid fa-link" style={{ color: '#794b00', fontSize: '13px' }}></i>
                                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#0078d4' }}>
                                    {tie.titulo}
                                  </span>
                                  {tie.hectares && (
                                    <span style={{ fontSize: '11px', color: '#107c41', backgroundColor: '#dff6dd', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                      <i className="fa-solid fa-ruler-combined" style={{ marginRight: '4px' }}></i>
                                      {tie.hectares}
                                    </span>
                                  )}
                                  {tie.observacao && (
                                    <span style={{ fontSize: '11px', color: '#605e5c', fontStyle: 'italic' }}>
                                      ({tie.observacao})
                                    </span>
                                  )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <button
                                    onClick={() => openEditAmarracaoModal(tie)}
                                    style={{
                                      backgroundColor: '#deecf9',
                                      color: '#0078d4',
                                      border: 'none',
                                      borderRadius: '10px',
                                      padding: '3px 10px',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                    title="Editar amarração"
                                  >
                                    Editar
                                  </button>

                                  <button
                                    onClick={() => handleToggleAmarracaoStatus(tie.id)}
                                    style={{
                                      backgroundColor: tie.status === 'Ativo' ? '#dff6dd' : '#f3f2f1',
                                      color: tie.status === 'Ativo' ? '#107c41' : '#a19f9d',
                                      border: 'none',
                                      borderRadius: '10px',
                                      padding: '3px 10px',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {tie.status}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAmarracao(tie.id)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#a80000',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      padding: '4px'
                                    }}
                                    title="Excluir amarração"
                                  >
                                    <i className="fa-solid fa-trash"></i>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              );
            })()}

            {/* ÁREA DE BAIXO ESPAÇAMENTO */}
            <div style={{ width: '100%', flex: 1, minHeight: '40px', backgroundColor: '#ffffff' }}></div>
          </div>
        </div>
      )}

    </div>
  );
}
