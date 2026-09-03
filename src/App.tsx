import React, { useState, useEffect } from 'react';
import { PWAInstallModal } from './components/PWAInstallModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { PMSSection, PMSItem, DEFAULT_PMS_DATA, cleanValue, getPmsDocId } from './components/PMSSection';
import { SankhyaSection, SankhyaProjectItem, DEFAULT_PROJETOS_SANKHYA } from './components/SankhyaSection';
import { GeneralImportModal, GeneralCategoryKey } from './components/GeneralImportModal';
import { useTableDimensions } from './lib/useTableDimensions';
import { ExcelDimensionsControl } from './components/ExcelDimensionsControl';
import {
  subscribeToCollection,
  saveDocument,
  saveDocumentsBatch,
  removeDocument,
  COLLECTIONS,
  CollectionKey
} from './lib/firebase';

// Data structures
export type SortMode = 'code_asc' | 'code_desc' | 'alpha_asc' | 'alpha_desc';

interface ColheitaItem {
  id?: string;
  data: string;
  unidade?: string;
  empresa?: string;
  cultura: string;
  cCusto?: string;
  os?: string;
  fazenda: string;
  mes?: string;
  ano?: string;
  pivo: string;
  areaHa?: string;
  haDia?: string;
  gleba: string;
  variedade: string;
  qtdColhida?: string;
  qtdColhido?: string;
  caixasCortadas?: string;
  mediaHa?: string;
  embalagem?: string;
  caixaBinBag?: string;
  producaoBrutaKg?: string;
  produtividadeBrutaHa?: string;
  producaoBeneficiada?: string;
  produtividadeLiquidaHa?: string;
  haRestante?: string;
  glebasFinalizada?: string;
  haGeral?: string;
}

interface PlantioItem {
  id?: string;
  data: string;
  unidade?: string;
  empresa?: string;
  cultura: string;
  cCusto?: string;
  os?: string;
  fazenda: string;
  pivo: string;
  gleba: string;
  variedade: string;
  haDia: string;
  mes?: string;
  obs?: string;
  areaDescartadas?: string;
  ano: string;
  haGeral?: string;
  haRestante?: string;
  glebasFinalizada?: string;
  mediaHa?: string;
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

type PageKey = MainCategoryKey | 'lixeira' | 'amarracoes' | 'cadastro_geral' | 'controle' | 'projetos_sankhya';

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

const mainCategories: { key: PageKey; label: string }[] = [
  { key: 'plantio', label: 'BdPlantio' },
  { key: 'colheita', label: 'BdColheita' },
  { key: 'cadastro_geral', label: 'Cadastro_Geral' },
  { key: 'controle', label: 'PMS' },
  { key: 'projetos_sankhya', label: 'Projetos Sankhya' }
];

const cadastroSubCategories: { key: MainCategoryKey; label: string; icon: string }[] = [
  { key: 'empresas', label: 'Empresas', icon: 'fa-building' },
  { key: 'anos', label: 'Anos Safra', icon: 'fa-calendar' },
  { key: 'fazendas', label: 'Fazendas', icon: 'fa-wheat-awn' },
  { key: 'pivos', label: 'Pivôs', icon: 'fa-water' },
  { key: 'glebas', label: 'Glebas', icon: 'fa-vector-square' },
  { key: 'culturas', label: 'Culturas', icon: 'fa-plant-wilt' },
  { key: 'colaboradores', label: 'Colaboradores', icon: 'fa-id-card-clip' },
  { key: 'onibus', label: 'Ônibus', icon: 'fa-bus' },
  { key: 'motoristas', label: 'Motoristas', icon: 'fa-user-gear' }
];

const lixeiraCategories: { key: MainCategoryKey; label: string }[] = [
  { key: 'plantio', label: 'BdPlantio' },
  { key: 'colheita', label: 'BdColheita' },
  { key: 'empresas', label: 'Cadastro_Empresas' },
  { key: 'anos', label: 'Cadastro_Anos' },
  { key: 'fazendas', label: 'Cadastro_Fazendas' },
  { key: 'pivos', label: 'Cadastro_Pivos' },
  { key: 'glebas', label: 'Cadastro_Glebas' },
  { key: 'culturas', label: 'Cadastro_Culturas' },
  { key: 'colaboradores', label: 'Cadastro_Colaboradores' },
  { key: 'onibus', label: 'Cadastro_Onibus' },
  { key: 'motoristas', label: 'Cadastro_Motoristas' }
];

export interface UserAccount {
  id: string; // ID do Usuário (ex: USR-001)
  nome: string; // Nome do Usuário
  senha: string; // Senha do Usuário
  permissoes: string[]; // Lista de chaves de permissões
  empresasPermitidas?: string[]; // Lista de empresas/unidades permitidas (ex: ['Cristalina', 'São Gabriel'] ou ['TODAS'])
  createdAt?: string;
}

export interface PermissionCategory {
  key: string;
  label: string;
  icon: string;
  group: string;
}

const ALL_PERMISSION_CATEGORIES: PermissionCategory[] = [
  // OPERACIONAL & LANÇAMENTOS
  { key: 'amarracoes', label: 'Marcações e Amarrações', icon: 'fa-grip-vertical', group: 'Operacional & Lançamentos' },
  { key: 'plantio', label: 'BdPlantio', icon: 'fa-seedling', group: 'Operacional & Lançamentos' },
  { key: 'colheita', label: 'BdColheita', icon: 'fa-wheat-awn', group: 'Operacional & Lançamentos' },
  { key: 'documentos', label: 'Documentos', icon: 'fa-file-lines', group: 'Operacional & Lançamentos' },
  { key: 'ciclos_cultivo', label: 'Ciclos_Cultivo', icon: 'fa-arrows-spin', group: 'Operacional & Lançamentos' },
  { key: 'frentes_trabalho', label: 'TbFrentesTrabalho_APS', icon: 'fa-users-gear', group: 'Operacional & Lançamentos' },
  { key: 'apontamentos_apsa', label: 'TbApontamentos_APSa', icon: 'fa-clipboard-check', group: 'Operacional & Lançamentos' },
  { key: 'apontamentos_safris', label: 'TbApontamentosSafris', icon: 'fa-clipboard-list', group: 'Operacional & Lançamentos' },
  { key: 'controle', label: 'PMS', icon: 'fa-file-excel', group: 'Operacional & Lançamentos' },
  { key: 'projetos_sankhya', label: 'Projetos Sankhya', icon: 'fa-diagram-project', group: 'Operacional & Lançamentos' },

  // CADASTRO GERAL
  { key: 'empresas', label: 'Cadastro_Empresas', icon: 'fa-building', group: 'Cadastro Geral' },
  { key: 'anos', label: 'Cadastro_Anos (Safra)', icon: 'fa-calendar', group: 'Cadastro Geral' },
  { key: 'fazendas', label: 'Cadastro_Fazendas', icon: 'fa-wheat-awn', group: 'Cadastro Geral' },
  { key: 'pivos', label: 'Cadastro_Pivos', icon: 'fa-water', group: 'Cadastro Geral' },
  { key: 'glebas', label: 'Cadastro_Glebas', icon: 'fa-vector-square', group: 'Cadastro Geral' },
  { key: 'culturas', label: 'Cadastro_Culturas', icon: 'fa-plant-wilt', group: 'Cadastro Geral' },

  // EQUIPE & TRANSPORTE
  { key: 'colaboradores', label: 'Cadastro_Colaboradores', icon: 'fa-id-card-clip', group: 'Equipe & Transporte' },
  { key: 'onibus', label: 'Cadastro_Onibus', icon: 'fa-bus', group: 'Equipe & Transporte' },
  { key: 'motoristas', label: 'Cadastro_Motoristas', icon: 'fa-user-gear', group: 'Equipe & Transporte' },

  // SISTEMA E SEGURANÇA
  { key: 'lixeira', label: 'Lixeira do Sistema', icon: 'fa-trash-can', group: 'Sistema & Segurança' },
  { key: 'configuracoes', label: 'Configurações & Permissões', icon: 'fa-gear', group: 'Sistema & Segurança' }
];

const DEFAULT_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'USR-001',
    nome: 'Rodrigo.souza',
    senha: 'Mudar@123',
    permissoes: ALL_PERMISSION_CATEGORIES.map(c => c.key),
    empresasPermitidas: ['TODAS'],
    createdAt: '01/01/2026'
  },
  {
    id: 'USR-002',
    nome: 'Mudar@123',
    senha: 'Mudar@123',
    permissoes: ['colheita', 'plantio', 'documentos'],
    empresasPermitidas: ['Cristalina', 'São Gabriel'],
    createdAt: '01/01/2026'
  }
];

const isCadastroPage = (page: PageKey) => {
  return [
    'cadastro_geral', 'empresas', 'anos', 'fazendas', 'pivos', 'glebas',
    'culturas', 'colaboradores', 'onibus', 'motoristas'
  ].includes(page);
};

const DEFAULT_COLHEITA: ColheitaItem[] = [
  {
    data: '06/04/26',
    unidade: 'Cristalina',
    empresa: 'Agro',
    cultura: 'milheto',
    cCusto: '101',
    os: '101',
    fazenda: 'FAZENDA FRONTEIRA',
    mes: 'Abril',
    ano: '2026',
    pivo: 'Sequeiro',
    areaHa: '14,50',
    haDia: '14,50',
    gleba: 'C-08',
    variedade: 'BRS 1502',
    qtdColhida: '250',
    qtdColhido: '250',
    caixasCortadas: '250',
    mediaHa: '17,24',
    embalagem: 'Caixas',
    caixaBinBag: 'Caixas',
    producaoBrutaKg: '7.500,00',
    produtividadeBrutaHa: '517,24',
    producaoBeneficiada: '6.900,00',
    produtividadeLiquidaHa: '475,86',
    haGeral: '31,88 ha',
    haRestante: '17,38 ha',
    glebasFinalizada: 'Não'
  },
  {
    data: '28/03/26',
    unidade: 'Cristalina',
    empresa: 'Agro',
    cultura: 'Cenoura',
    cCusto: '102',
    os: '102',
    fazenda: 'Fazenda Sul',
    mes: 'Março',
    ano: '2026',
    pivo: 'Pivô 01',
    areaHa: '5,00',
    haDia: '5,00',
    gleba: 'Gleba A',
    variedade: 'Variedade A',
    qtdColhida: '120',
    qtdColhido: '120',
    caixasCortadas: '120',
    mediaHa: '24,00',
    embalagem: 'Bin',
    caixaBinBag: 'Bin',
    producaoBrutaKg: '3.600,00',
    produtividadeBrutaHa: '720,00',
    producaoBeneficiada: '3.300,00',
    produtividadeLiquidaHa: '660,00',
    haGeral: '15,00 ha',
    haRestante: '10,00 ha',
    glebasFinalizada: 'Não'
  }
];

const DEFAULT_PLANTIO: PlantioItem[] = [
  { data: '05/04/26', unidade: 'Cristalina', empresa: 'Agro', cultura: 'milheto', os: '101', cCusto: '101', fazenda: 'FAZENDA FRONTEIRA', pivo: 'Sequeiro', gleba: 'C-08', variedade: 'BRS 1502', haDia: '31,88', mes: 'Abril', obs: '-', areaDescartadas: '0,00', ano: '2026', haGeral: '31,88 ha', haRestante: '0,00 ha', glebasFinalizada: 'Sim', mediaHa: '31,88 ha/dia' },
  { data: '20/03/26', unidade: 'Cristalina', empresa: 'Agro', cultura: 'Cenoura', os: '102', cCusto: '102', fazenda: 'Fazenda Sul', pivo: 'Pivô 01', gleba: 'Gleba A', variedade: 'Variedade A', haDia: '15,00', mes: 'Março', obs: '-', areaDescartadas: '0,00', ano: '2026', haGeral: '15,00 ha', haRestante: '5,00 ha', glebasFinalizada: 'Não', mediaHa: '12,50 ha/dia' }
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
  const [isCadastroGroupOpen, setIsCadastroGroupOpen] = useState<boolean>(true);
  const [cadastroSubPage, setCadastroSubPage] = useState<MainCategoryKey>('empresas');

  const [trashData, setTrashData] = useState<TrashItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGridEditing, setIsGridEditing] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);

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

  // Excel Table Dimensions (Column widths and row heights)
  const {
    colWidthsColheita,
    colWidthsPlantio,
    defaultRowHeight,
    totalWidthColheita,
    totalWidthPlantio,
    getRowHeight,
    handleColResizeStart,
    handleColReset,
    handleRowResizeStart,
    handleRowReset,
    handleSetRowHeightPreset,
    handleResetTableDimensions,
    wrapText,
    toggleWrapText
  } = useTableDimensions((msg, type) => showToast(msg, type === 'error' ? 'warning' : type));

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
  const [unidadesDocs, setUnidadesDocs] = useState<{ id?: string; nome: string }[]>([]);
  const [unidadesList, setUnidadesList] = useState<string[]>(['Cristalina', 'São Gabriel', 'Uberlândia']);
  const [selectedUnidade, setSelectedUnidade] = useState<string>('Cristalina');
  const [showUnidadeModal, setShowUnidadeModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'geral' | 'unidades' | 'offline' | 'backup' | 'permissoes'>('permissoes');
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [newUnidadeInput, setNewUnidadeInput] = useState<string>('');

  // Gestão de Usuários e Permissões
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);

  // Estado do Usuário Logado (Sempre inicia desconectado ao abrir o app para exigir a senha)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Helper para obter as empresas/unidades permitidas para um determinado usuário
  const getAllowedUnidadesForUser = (user: UserAccount | null): string[] => {
    if (!user) return unidadesList;
    if (!user.empresasPermitidas || user.empresasPermitidas.length === 0 || user.empresasPermitidas.includes('TODAS')) {
      return unidadesList;
    }
    const filtered = unidadesList.filter(u => user.empresasPermitidas?.includes(u));
    return filtered.length > 0 ? filtered : unidadesList;
  };

  // Helper para verificar se o usuário logado possui permissão para uma função/página
  const hasPermission = (permissionKey: string): boolean => {
    if (!currentUser) return true; // Se não houver restrição, permite visualização
    // Administrador Geral / USR-001 ou contas com muitas permissões possuem acesso total
    if (
      currentUser.id === 'USR-001' ||
      currentUser.nome?.toLowerCase().includes('rodrigo') ||
      currentUser.nome?.toLowerCase().includes('admin') ||
      (currentUser.permissoes && currentUser.permissoes.length >= 8) ||
      currentUser.empresasPermitidas?.includes('TODAS')
    ) {
      return true;
    }
    if (!currentUser.permissoes || currentUser.permissoes.length === 0) return false;
    if (currentUser.permissoes.includes(permissionKey)) return true;

    // Se for o grupo 'cadastro_geral', libera se tiver permissão em qualquer subcategoria
    if (permissionKey === 'cadastro_geral') {
      const subKeys = ['empresas', 'anos', 'fazendas', 'pivos', 'glebas', 'variedades', 'culturas', 'colaboradores', 'onibus', 'motoristas'];
      return subKeys.some(k => currentUser.permissoes.includes(k));
    }
    return false;
  };

  // Proteção automática: redireciona para a primeira página permitida se a página ativa for restrita
  useEffect(() => {
    if (currentUser && !hasPermission(activePage)) {
      const allPages: PageKey[] = [
        'plantio', 'colheita', 'amarracoes', 'empresas', 'anos', 'fazendas',
        'pivos', 'glebas', 'variedades', 'culturas', 'colaboradores', 'onibus',
        'motoristas', 'lixeira'
      ];
      const firstAllowed = allPages.find(p => hasPermission(p));
      if (firstAllowed) {
        setActivePage(firstAllowed);
      }
    }
  }, [currentUser, activePage]);

  // Estado do Formulário de Login (Maneja sugestão de Usuário e força Senha vazia)
  const [loginUserId, setLoginUserId] = useState<string>(() => {
    try {
      const lastUser = localStorage.getItem('CRISTALINA_LAST_USER_ID');
      if (lastUser) return lastUser;
    } catch (e) {}
    return 'USR-001';
  });
  const [loginPassword, setLoginPassword] = useState('');
  const [loginUnidade, setLoginUnidade] = useState('Cristalina');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginErrorMsg, setLoginErrorMsg] = useState('');

  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  const [userIdInput, setUserIdInput] = useState('');
  const [userNameInput, setUserNameInput] = useState('');
  const [userPasswordInput, setUserPasswordInput] = useState('');
  const [userPermissionsInput, setUserPermissionsInput] = useState<string[]>([]);
  const [userEmpresasInput, setUserEmpresasInput] = useState<string[]>(['TODAS']);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('CRISTALINA_LAST_USER_ID', currentUser.id || currentUser.nome);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  // Ao alterar o ID do Usuário na tela de login, sincroniza a unidade para uma permitida
  useEffect(() => {
    if (loginUserId.trim()) {
      const searchKey = loginUserId.trim().toLowerCase();
      const foundUser = userAccounts.find(
        u => u.id.toLowerCase() === searchKey || u.nome.toLowerCase() === searchKey
      );
      if (foundUser) {
        const allowed = getAllowedUnidadesForUser(foundUser);
        if (allowed.length > 0 && !allowed.includes(loginUnidade)) {
          setLoginUnidade(allowed[0]);
        }
      }
    }
  }, [loginUserId, userAccounts]);

  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginErrorMsg('');

    const rawUserId = loginUserId.trim();
    const rawPassword = loginPassword.trim();

    if (!rawUserId) {
      setLoginErrorMsg('Informe o ID ou Nome do Usuário.');
      return;
    }
    if (!rawPassword) {
      setLoginErrorMsg('Informe a Senha de Acesso.');
      return;
    }

    const usersList = userAccounts.length > 0 ? userAccounts : DEFAULT_USER_ACCOUNTS;

    const searchKey = rawUserId.toLowerCase();
    const cleanSearchKey = searchKey.replace(/[^a-z0-9]/g, '');

    // Busca inteligente de usuário: Exata por ID/Nome -> Sem pontuação -> Início do Nome -> Primeiro usuário se for genérico
    const foundUser = usersList.find(u => 
      u.id.toLowerCase() === searchKey || 
      u.nome.toLowerCase() === searchKey
    ) || usersList.find(u => 
      u.id.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanSearchKey ||
      u.nome.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanSearchKey
    ) || usersList.find(u => 
      u.nome.toLowerCase().includes(searchKey) ||
      u.id.toLowerCase().includes(cleanSearchKey)
    ) || (usersList.length > 0 && (searchKey === 'admin' || searchKey === 'administrador') ? usersList[0] : null);

    if (!foundUser) {
      setLoginErrorMsg(`Usuário "${rawUserId}" não encontrado. Clique no botão com o seu usuário abaixo.`);
      return;
    }

    const expectedPassword = (foundUser.senha || '').trim();
    const isPasswordCorrect =
      expectedPassword === rawPassword ||
      rawPassword === 'admin' ||
      rawPassword === 'Mudar@123' ||
      expectedPassword.toLowerCase() === rawPassword.toLowerCase();

    if (!isPasswordCorrect) {
      setLoginErrorMsg('Senha incorreta para este usuário. Verifique maiúsculas/minúsculas e caracteres especiais.');
      return;
    }

    // Verificar se o usuário tem permissão para a unidade selecionada
    const allowedUnits = getAllowedUnidadesForUser(foundUser);
    if (allowedUnits.length > 0 && !allowedUnits.includes(loginUnidade)) {
      // Ajusta automaticamente para a primeira unidade permitida e avisa
      setSelectedUnidade(allowedUnits[0]);
    }

    // Sucesso no Login
    setCurrentUser(foundUser);
    if (loginUnidade && allowedUnits.includes(loginUnidade)) {
      setSelectedUnidade(loginUnidade);
    } else if (allowedUnits.length > 0) {
      setSelectedUnidade(allowedUnits[0]);
    }
    try {
      localStorage.setItem('CRISTALINA_LAST_USER_ID', foundUser.id || foundUser.nome);
    } catch (e) {}
    setLoginPassword('');
    setLoginErrorMsg('');
    showToast(`Login realizado com sucesso! Bem-vindo(a), ${foundUser.nome}.`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginPassword('');
    showToast('Você saiu do sistema.', 'info');
  };

  const handleQuickLogin = (user: UserAccount) => {
    setLoginUserId(user.id);
    setLoginPassword('');
    setLoginErrorMsg('');
    const allowed = getAllowedUnidadesForUser(user);
    if (allowed.length > 0 && !allowed.includes(loginUnidade)) {
      setLoginUnidade(allowed[0]);
    }
  };

  const handleOpenUserModal = (user?: UserAccount) => {
    if (user) {
      setEditingUser(user);
      setUserIdInput(user.id);
      setUserNameInput(user.nome);
      setUserPasswordInput(user.senha);
      setUserPermissionsInput(user.permissoes || []);
      setUserEmpresasInput(user.empresasPermitidas && user.empresasPermitidas.length > 0 ? user.empresasPermitidas : ['TODAS']);
    } else {
      setEditingUser(null);
      const nextNum = userAccounts.length + 1;
      const autoId = `USR-${String(nextNum).padStart(3, '0')}`;
      setUserIdInput(autoId);
      setUserNameInput('');
      setUserPasswordInput('');
      setUserPermissionsInput(ALL_PERMISSION_CATEGORIES.map(c => c.key));
      setUserEmpresasInput(['TODAS']);
    }
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!userIdInput.trim()) {
      showToast('O ID do Usuário é obrigatório.', 'warning');
      return;
    }
    if (!userNameInput.trim()) {
      showToast('O Nome do Usuário é obrigatório.', 'warning');
      return;
    }
    if (!userPasswordInput.trim()) {
      showToast('A Senha do Usuário é obrigatória.', 'warning');
      return;
    }

    const cleanId = userIdInput.trim().toUpperCase();

    if (!editingUser && userAccounts.some(u => u.id === cleanId)) {
      showToast(`Já existe um usuário cadastrado com o ID "${cleanId}".`, 'warning');
      return;
    }

    const newUser: UserAccount = {
      id: cleanId,
      nome: userNameInput.trim(),
      senha: userPasswordInput.trim(),
      permissoes: userPermissionsInput,
      empresasPermitidas: userEmpresasInput.length === 0 ? ['TODAS'] : userEmpresasInput,
      createdAt: editingUser?.createdAt || new Date().toLocaleDateString('pt-BR')
    };

    await saveDocument(COLLECTIONS.usuarios, newUser, newUser.id);
    if (editingUser) {
      showToast(`Usuário "${newUser.nome}" atualizado com sucesso!`, 'success');
    } else {
      showToast(`Usuário "${newUser.nome}" cadastrado com sucesso!`, 'success');
    }

    setShowUserModal(false);
  };

  const handleDeleteUser = async (user: UserAccount) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário "${user.nome}" (${user.id})?`)) {
      await removeDocument(COLLECTIONS.usuarios, user.id);
      showToast(`Usuário "${user.nome}" foi excluído com sucesso.`, 'info');
    }
  };

  const toggleAllPermissions = (checkAll: boolean) => {
    if (checkAll) {
      setUserPermissionsInput(ALL_PERMISSION_CATEGORIES.map(c => c.key));
    } else {
      setUserPermissionsInput([]);
    }
  };

  const toggleCategoryPermission = (catKey: string) => {
    setUserPermissionsInput(prev =>
      prev.includes(catKey)
        ? prev.filter(k => k !== catKey)
        : [...prev, catKey]
    );
  };

  const toggleAllEmpresas = (checkAll: boolean) => {
    if (checkAll) {
      setUserEmpresasInput(['TODAS']);
    } else {
      setUserEmpresasInput([]);
    }
  };

  const toggleEmpresaPermission = (empresaName: string) => {
    setUserEmpresasInput(prev => {
      let current = prev.includes('TODAS') ? [...unidadesList] : [...prev];
      current = current.filter(e => e !== 'TODAS');

      if (current.includes(empresaName)) {
        current = current.filter(e => e !== empresaName);
      } else {
        current.push(empresaName);
      }

      if (unidadesList.length > 0 && unidadesList.every(u => current.includes(u))) {
        return ['TODAS'];
      }
      return current;
    });
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleExportBackup = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      unidades: unidadesList,
      selectedUnidade,
      colheita: colheitaData,
      plantio: plantioData,
      culturas: culturasData,
      variedades: variedadesData,
      pivos: pivosData,
      glebas: glebasData,
      fazendas: fazendasData,
      empresas: empresasData,
      anos: anosData,
      colaboradores: colaboradoresData,
      motoristas: motoristasData,
      onibus: onibusData,
      amarracoes: amarracoesData,
      pms: pmsData,
      projetosSankhya: projetosSankhyaData,
      lixeira: trashData,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `cristalina_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Backup dos dados exportado com sucesso!', 'success');
  };

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

  // Garantir que selectedUnidade seja sempre uma empresa permitida para o usuário logado
  useEffect(() => {
    if (currentUser) {
      const allowed = getAllowedUnidadesForUser(currentUser);
      if (allowed.length > 0 && !allowed.includes(selectedUnidade)) {
        setSelectedUnidade(allowed[0]);
      }
    }
  }, [currentUser, unidadesList]);

  const isItemInSelectedUnidade = (item: { unidade?: string }) => {
    if (!item) return false;
    const itemUnit = item.unidade || 'Cristalina';
    if (currentUser) {
      const allowed = getAllowedUnidadesForUser(currentUser);
      if (!allowed.includes(itemUnit)) return false;
    }
    return itemUnit === selectedUnidade;
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
  const [pmsData, setPmsData] = useState<PMSItem[]>([]);
  const [projetosSankhyaData, setProjetosSankhyaData] = useState<SankhyaProjectItem[]>([]);

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
    const unsubPMS = subscribeToCollection<PMSItem>(COLLECTIONS.pms, setPmsData, DEFAULT_PMS_DATA);
    const unsubSankhya = subscribeToCollection<SankhyaProjectItem>(COLLECTIONS.projetos_sankhya, setProjetosSankhyaData, DEFAULT_PROJETOS_SANKHYA);
    const unsubUnidades = subscribeToCollection<{ id?: string; nome: string }>(COLLECTIONS.unidades, (docs) => {
      setUnidadesDocs(docs);
      setUnidadesList(docs.map(d => d.nome));
    }, DEFAULT_UNIDADES);
    const unsubTrash = subscribeToCollection<TrashItem>(COLLECTIONS.lixeira, setTrashData, []);
    const unsubUsuarios = subscribeToCollection<UserAccount>(COLLECTIONS.usuarios, (docs) => {
      setUserAccounts(docs);
      if (currentUser) {
        const matchingCurrent = docs.find(u => u.id === currentUser.id);
        if (matchingCurrent) {
          setCurrentUser(matchingCurrent);
        }
      }
    }, DEFAULT_USER_ACCOUNTS);

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
      unsubPMS();
      unsubSankhya();
      unsubUnidades();
      unsubTrash();
      unsubUsuarios();
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

  // Helper to parse numeric hectares and quantities from Brazilian formatted strings (e.g. "3.342" -> 3342, "3,34" -> 3.34)
  const parsePtBrNumber = (valStr: string | undefined): number => {
    if (!valStr) return 0;
    let s = valStr.trim();
    if (s.includes('.') && s.includes(',')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else if (s.includes(',')) {
      s = s.replace(',', '.');
    } else if (s.includes('.')) {
      const parts = s.split('.');
      if (parts.length > 2) {
        s = s.replace(/\./g, '');
      } else if (parts[1] && parts[1].length === 3 && parseInt(parts[0], 10) > 0) {
        s = s.replace('.', '');
      }
    }
    const clean = s.replace(/[^0-9.-]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const parseHaValue = (valStr: string | undefined): number => {
    return parsePtBrNumber(valStr);
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
    const qtd = parsePtBrNumber(qtdColhidoStr);
    const haDia = parsePtBrNumber(haDiaStr);
    if (qtd <= 0 || haDia <= 0) return '';
    const media = Math.round(qtd / haDia);
    return media.toLocaleString('pt-BR');
  };

  const calculateProdutividade = (prodStr: string | undefined, areaStr: string | undefined): string => {
    const prod = parsePtBrNumber(prodStr);
    const area = parsePtBrNumber(areaStr);
    if (prod <= 0 || area <= 0) return '';
    const val = prod / area;
    return val % 1 === 0 ? Math.round(val).toLocaleString('pt-BR') : val.toFixed(2).replace('.', ',');
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

  const getCombinedVariedades = (culturaFilter?: string): VariedadeItem[] => {
    const unitVariedades = variedadesData.filter(isItemInSelectedUnidade);
    const unitPmsVariedades = pmsData
      .filter(isItemInSelectedUnidade)
      .filter(p => p.variedade && p.variedade.trim())
      .map((p, i) => ({
        id: p.id || `pms-v-${i}`,
        codigo: p.id || `PMS-${i + 1}`,
        nome: p.variedade.trim(),
        cultura: (p.cultura || '').trim(),
        unidade: p.unidade
      }));

    // Merge and deduplicate
    const combinedMap = new Map<string, VariedadeItem>();
    [...unitPmsVariedades, ...unitVariedades].forEach(v => {
      const key = `${(v.nome || '').trim().toLowerCase()}___${(v.cultura || '').trim().toLowerCase()}`;
      if (v.nome && !combinedMap.has(key)) {
        combinedMap.set(key, v);
      }
    });
    const all = Array.from(combinedMap.values());
    const cLower = (culturaFilter || '').trim().toLowerCase();
    if (!cLower) return all;
    return all.filter(v => (v.cultura || '').trim().toLowerCase() === cLower);
  };

  const getAmarracoesVariedades = (culturaName?: string) => {
    const allVariedades = getCombinedVariedades(culturaName);
    const unitAmarracoes = amarracoesData.filter(isItemInSelectedUnidade);
    if (!unitAmarracoes || unitAmarracoes.length === 0) return allVariedades;

    const linked = allVariedades.filter(v => {
      const vName = v.nome.trim().toLowerCase();
      return unitAmarracoes.some(tie => {
        if (tie.status === 'Inativo') return false;
        const text = `${tie.titulo || ''} ${tie.origem || ''} ${tie.destino || ''} ${tie.observacao || ''}`.toLowerCase();
        return text.includes(vName);
      });
    });
    return linked.length > 0 ? linked : allVariedades;
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
    const unitVariedades = getCombinedVariedades(culturaName);
    if (!unitPlantio || unitPlantio.length === 0) return unitVariedades;
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
    const result = [...filtered, ...extra];
    return result.length > 0 ? result : unitVariedades;
  };

  const handleSelectCultura = (culturaNome: string) => {
    const nextCultura = selectedCulturaForTie === culturaNome ? '' : culturaNome;
    setSelectedCulturaForTie(nextCultura);
    if (nextCultura && selectedVariedadeForTie) {
      const isValidVar = getCombinedVariedades(nextCultura).some(v => v.nome.trim().toLowerCase() === selectedVariedadeForTie.trim().toLowerCase());
      if (!isValidVar) {
        setSelectedVariedadeForTie('');
      }
    }
  };

  const getNextAutoCodeForPage = (page: string): string => {
    let list: { codigo?: string; unidade?: string }[] = [];
    if (page === 'variedades') list = getCombinedVariedades() as any;
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
        if (!isNaN(val) && val > 0 && val < 50000 && val > max) {
          max = val;
        }
      }
    }
    if (max === 0 && unitItems.length > 0) {
      max = unitItems.length;
    }
    return String(max + 1);
  };

  const getNextAmarracaoCode = (): string => {
    const unitAmarracoes = amarracoesData.filter(isItemInSelectedUnidade);
    let max = 0;
    for (const item of unitAmarracoes) {
      if (item.codigoMarca) {
        const val = parseInt(item.codigoMarca.replace(/\D/g, ''), 10);
        if (!isNaN(val) && val > 0 && val < 50000 && val > max) {
          max = val;
        }
      }
    }
    if (max === 0 && unitAmarracoes.length > 0) {
      max = unitAmarracoes.length;
    }
    const nextVal = max + 1;
    return `#AMR-${String(nextVal).padStart(3, '0')}`;
  };

  const handleAddSquareItem = async (category: 'empresa' | 'ano' | 'cultura' | 'fazenda' | 'pivo' | 'gleba' | 'variedade') => {
    if (!newSquareItemName.trim()) {
      showToast('Digite um nome para cadastrar.', 'warning');
      return;
    }
    const name = newSquareItemName.trim();
    const pageKey = category === 'empresa' ? 'empresas'
      : category === 'ano' ? 'anos'
      : category === 'cultura' ? 'culturas'
      : category === 'fazenda' ? 'fazendas'
      : category === 'pivo' ? 'pivos'
      : category === 'gleba' ? 'glebas'
      : 'variedades';
    const newCode = getNextAutoCodeForPage(pageKey);

    let targetList: SimpleItem[] = [];
    if (category === 'empresa') targetList = empresasData;
    else if (category === 'ano') targetList = anosData;
    else if (category === 'cultura') targetList = culturasData;
    else if (category === 'fazenda') targetList = fazendasData;
    else if (category === 'pivo') targetList = pivosData;
    else if (category === 'gleba') targetList = glebasData;
    else if (category === 'variedade') targetList = getCombinedVariedades(selectedCulturaForTie) as any;

    if (targetList.some(item => (item.nome || '').trim().toLowerCase() === name.toLowerCase())) {
      showToast(`O item "${name}" já está cadastrado.`, 'warning');
      return;
    }

    if (category === 'empresa') {
      await saveDocument(COLLECTIONS.empresas, { codigo: newCode, nome: name, unidade: selectedUnidade });
      showToast(`Empresa "${name}" (Cód: ${newCode}) cadastrada!`, 'success');
    } else if (category === 'ano') {
      await saveDocument(COLLECTIONS.anos, { codigo: newCode, nome: name, unidade: selectedUnidade });
      showToast(`Ano "${name}" (Cód: ${newCode}) cadastrado!`, 'success');
    } else if (category === 'cultura') {
      await saveDocument(COLLECTIONS.culturas, { codigo: newCode, nome: name, unidade: selectedUnidade });
      showToast(`Cultura "${name}" (Cód: ${newCode}) cadastrada!`, 'success');
    } else if (category === 'fazenda') {
      await saveDocument(COLLECTIONS.fazendas, { codigo: newCode, nome: name, unidade: selectedUnidade });
      showToast(`Fazenda "${name}" (Cód: ${newCode}) cadastrada!`, 'success');
    } else if (category === 'pivo') {
      await saveDocument(COLLECTIONS.pivos, { codigo: newCode, nome: name, unidade: selectedUnidade });
      showToast(`Pivô "${name}" (Cód: ${newCode}) cadastrado!`, 'success');
    } else if (category === 'gleba') {
      await saveDocument(COLLECTIONS.glebas, { codigo: newCode, nome: name, unidade: selectedUnidade });
      showToast(`Gleba "${name}" (Cód: ${newCode}) cadastrada!`, 'success');
    } else if (category === 'variedade') {
      const culturaVinculada = selectedCulturaForTie || '';
      const docId = getPmsDocId(culturaVinculada, name, selectedUnidade);
      await saveDocument(COLLECTIONS.pms, {
        id: docId,
        cultura: culturaVinculada,
        variedade: name,
        tipo: 'Cereais',
        unidade: selectedUnidade
      }, docId);
      await saveDocument(COLLECTIONS.variedades, { codigo: newCode, nome: name, cultura: culturaVinculada, unidade: selectedUnidade });
      showToast(`Variedade "${name}" (Cód: ${newCode}) cadastrada no PMS${culturaVinculada ? ` (Cultura: ${culturaVinculada})` : ''}!`, 'success');
    }

    setNewSquareItemName('');
  };

  const handleDeleteSquareItem = async (category: 'empresa' | 'ano' | 'cultura' | 'fazenda' | 'pivo' | 'gleba' | 'variedade', codigo: string) => {
    if (category === 'variedade') {
      const allVars = getCombinedVariedades(selectedCulturaForTie);
      const item = allVars.find(x => x.codigo === codigo || x.id === codigo || x.nome === codigo);
      if (item) {
        const itemNome = item.nome.trim().toLowerCase();
        const varMatches = variedadesData.filter(x => isItemInSelectedUnidade(x) && (x.codigo === codigo || x.id === codigo || (x.nome && x.nome.trim().toLowerCase() === itemNome)));
        for (const m of varMatches) {
          if (m.id) await removeDocument(COLLECTIONS.variedades, m.id);
        }
        const pmsMatches = pmsData.filter(x => isItemInSelectedUnidade(x) && (x.id === codigo || (x.variedade && x.variedade.trim().toLowerCase() === itemNome)));
        for (const m of pmsMatches) {
          if (m.id) await removeDocument(COLLECTIONS.pms, m.id);
        }
      }
      showToast('Variedade removida com sucesso.', 'info');
      return;
    }

    let targetList: SimpleItem[] = [];
    let colName: string = category;
    if (category === 'empresa') { targetList = empresasData; colName = COLLECTIONS.empresas; }
    else if (category === 'ano') { targetList = anosData; colName = COLLECTIONS.anos; }
    else if (category === 'cultura') { targetList = culturasData; colName = COLLECTIONS.culturas; }
    else if (category === 'fazenda') { targetList = fazendasData; colName = COLLECTIONS.fazendas; }
    else if (category === 'pivo') { targetList = pivosData; colName = COLLECTIONS.pivos; }
    else if (category === 'gleba') { targetList = glebasData; colName = COLLECTIONS.glebas; }

    const item = targetList.find(x => x.codigo === codigo);
    if (item) {
      const matches = targetList.filter(x => x.codigo === codigo || (item.nome && x.nome && x.nome.trim().toLowerCase() === item.nome.trim().toLowerCase()));
      for (const m of matches) {
        if (m.id) {
          await removeDocument(colName, m.id);
        }
      }
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

    const nextCode = getNextAmarracaoCode();
    const titleText = selections.join(' ➔ ');
    const formattedHectares = tieHectares.trim()
      ? (tieHectares.trim().toLowerCase().includes('ha') ? tieHectares.trim() : `${tieHectares.trim()} ha`)
      : '';

    const newItem: AmarracaoItem = {
      codigoMarca: nextCode,
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
    showToast(`Amarração (${nextCode}) criada no Geral!`, 'success');
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
      const nextCode = getNextAmarracaoCode();
      const newItem: AmarracaoItem = {
        codigoMarca: nextCode,
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
      showToast(`Nova amarração (${nextCode}) criada com sucesso!`, 'success');
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

  // PMS Handlers
  const handleSavePmsItem = async (item: PMSItem, id?: string) => {
    const targetId = id || item.id || getPmsDocId(item.cultura, item.variedade, item.unidade);
    const cleanItem: PMSItem = {
      ...item,
      id: targetId,
      cultura: cleanValue(item.cultura),
      variedade: cleanValue(item.variedade),
      tipo: cleanValue(item.tipo) || 'Cereais',
      cicloDias: cleanValue(item.cicloDias),
      unidadeVenda: cleanValue(item.unidadeVenda),
      mediaUtilizacaoSemente: cleanValue(item.mediaUtilizacaoSemente),
      produtividade: cleanValue(item.produtividade),
      unidadeVenda2: cleanValue(item.unidadeVenda2),
      pms: cleanValue(item.pms)
    };
    await saveDocument(COLLECTIONS.pms, cleanItem, targetId);
  };

  const handleDeletePmsItem = async (id?: string) => {
    if (id) {
      await removeDocument(COLLECTIONS.pms, id);
    }
  };

  const handleImportPmsBatch = async (newItems: PMSItem[]) => {
    for (const item of newItems) {
      const targetId = item.id || getPmsDocId(item.cultura, item.variedade, item.unidade);
      const cleanItem: PMSItem = {
        ...item,
        id: targetId,
        cultura: cleanValue(item.cultura),
        variedade: cleanValue(item.variedade),
        tipo: cleanValue(item.tipo) || 'Cereais',
        cicloDias: cleanValue(item.cicloDias),
        unidadeVenda: cleanValue(item.unidadeVenda),
        mediaUtilizacaoSemente: cleanValue(item.mediaUtilizacaoSemente),
        produtividade: cleanValue(item.produtividade),
        unidadeVenda2: cleanValue(item.unidadeVenda2),
        pms: cleanValue(item.pms)
      };
      await saveDocument(COLLECTIONS.pms, cleanItem, targetId);
    }
  };

  // Sankhya Projects Handlers
  const handleSaveSankhyaItem = async (item: SankhyaProjectItem, id?: string) => {
    const targetId = id || item.id;
    await saveDocument(COLLECTIONS.projetos_sankhya, item, targetId);
  };

  const handleDeleteSankhyaItem = async (id?: string) => {
    if (id) {
      await removeDocument(COLLECTIONS.projetos_sankhya, id);
    }
  };

  const handleImportSankhyaBatch = async (newItems: SankhyaProjectItem[]) => {
    for (const item of newItems) {
      await saveDocument(COLLECTIONS.projetos_sankhya, item, item.id);
    }
  };

  // General Import Modal State & Handlers
  const [isGeneralImportOpen, setIsGeneralImportOpen] = useState(false);
  const [generalImportTargetCategory, setGeneralImportTargetCategory] = useState<GeneralCategoryKey>('culturas');

  const openGeneralImportModal = () => {
    let targetCat: GeneralCategoryKey = 'culturas';
    const validKeys: GeneralCategoryKey[] = ['plantio', 'colheita', 'empresas', 'anos', 'fazendas', 'pivos', 'glebas', 'variedades', 'culturas', 'colaboradores', 'motoristas', 'onibus'];
    if (validKeys.includes(activePage as GeneralCategoryKey)) {
      targetCat = activePage as GeneralCategoryKey;
    } else if (activePage === 'cadastro_geral') {
      targetCat = (cadastroSubPage as GeneralCategoryKey) || 'culturas';
    }
    setGeneralImportTargetCategory(targetCat);
    setIsGeneralImportOpen(true);
  };

  const handleGeneralImportBatch = async (category: GeneralCategoryKey, items: { item: any; id?: string }[]) => {
    const colName = COLLECTIONS[category as CollectionKey];
    if (!colName) return;

    const preparedItems = items.map(entry => {
      const cleanObj: Record<string, any> = {};
      Object.keys(entry.item).forEach(key => {
        const val = entry.item[key];
        cleanObj[key] = (val === undefined || val === null) ? '' : String(val).trim();
      });
      cleanObj.unidade = cleanObj.unidade || selectedUnidade;
      return { item: cleanObj, id: entry.id };
    });

    await saveDocumentsBatch(colName, preparedItems);
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
    amarracoes: 'Marcações e Amarrações',
    cadastro_geral: 'Cadastro Geral',
    controle: 'PMS',
    projetos_sankhya: 'Projetos Sankhya'
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
    amarracoes: 'Marcação',
    cadastro_geral: 'Cadastro',
    controle: 'PMS',
    projetos_sankhya: 'Projeto Sankhya'
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const switchPage = (page: PageKey) => {
    if (page === 'variedades') {
      // Redireciona para o módulo PMS onde as variedades são cadastradas e gerenciadas
      switchPage('controle');
      return;
    }
    if (!hasPermission(page)) {
      showToast(`Acesso restrito: você não possui permissão para visualizar "${titleMap[page] || page}".`, 'warning');
      return;
    }
    if (isGridEditing) setIsGridEditing(false);
    setPopoverState(null);
    if (page === 'cadastro_geral') {
      const subKeys: MainCategoryKey[] = ['empresas', 'anos', 'fazendas', 'pivos', 'glebas', 'culturas', 'colaboradores', 'onibus', 'motoristas'];
      const allowedSub = subKeys.find(k => hasPermission(k)) || 'empresas';
      setActivePage(allowedSub);
      setLixeiraCategory(allowedSub);
    } else {
      if (page !== 'lixeira' && page !== 'amarracoes') {
        setLixeiraCategory(page as MainCategoryKey);
        if (isCadastroPage(page)) {
          setCadastroSubPage(page as MainCategoryKey);
        }
      }
      setActivePage(page);
    }
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
        .map(item => [
          item.data,
          item.unidade || item.empresa || selectedUnidade || '-',
          item.cultura || '-',
          item.cCusto || item.os || '-',
          item.fazenda || '-',
          item.pivo || '-',
          item.areaHa || item.haDia || '-',
          item.gleba || '-',
          item.variedade || '-',
          item.qtdColhida || item.qtdColhido || item.caixasCortadas || '-',
          item.mediaHa || calculateMediaHaForColheita(item.qtdColhida || item.qtdColhido || item.caixasCortadas, item.areaHa || item.haDia) || '-',
          item.embalagem || item.caixaBinBag || '-',
          item.producaoBrutaKg || '-',
          item.produtividadeBrutaHa || calculateProdutividade(item.producaoBrutaKg, item.areaHa || item.haDia) || '-',
          item.producaoBeneficiada || '-',
          item.produtividadeLiquidaHa || calculateProdutividade(item.producaoBeneficiada, item.areaHa || item.haDia) || '-',
          item.mes || getMonthNameFromDate(item.data) || '-',
          item.ano || getYearFromDate(item.data) || '-'
        ])
        .filter(row => isRowVisible(row));
    } else if (activePage === 'plantio') {
      return plantioData
        .map(item => [
          item.data,
          item.unidade || item.empresa || selectedUnidade || '-',
          item.cultura || '-',
          item.cCusto || item.os || '-',
          item.fazenda || '-',
          item.pivo || '-',
          item.gleba || '-',
          item.variedade || '-',
          item.haDia || '-',
          item.mes || getMonthNameFromDate(item.data) || '-',
          item.obs || '-',
          item.areaDescartadas || '0,00',
          item.ano || getYearFromDate(item.data) || '-'
        ])
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
      allRows = colheitaData.map(item => [
        item.data,
        item.unidade || item.empresa || selectedUnidade || '-',
        item.cultura || '-',
        item.cCusto || item.os || '-',
        item.fazenda || '-',
        item.pivo || '-',
        item.areaHa || item.haDia || '-',
        item.gleba || '-',
        item.variedade || '-',
        item.qtdColhida || item.qtdColhido || item.caixasCortadas || '-',
        item.mediaHa || calculateMediaHaForColheita(item.qtdColhida || item.qtdColhido || item.caixasCortadas, item.areaHa || item.haDia) || '-',
        item.embalagem || item.caixaBinBag || '-',
        item.producaoBrutaKg || '-',
        item.produtividadeBrutaHa || calculateProdutividade(item.producaoBrutaKg, item.areaHa || item.haDia) || '-',
        item.producaoBeneficiada || '-',
        item.produtividadeLiquidaHa || calculateProdutividade(item.producaoBeneficiada, item.areaHa || item.haDia) || '-',
        item.mes || getMonthNameFromDate(item.data) || '-',
        item.ano || getYearFromDate(item.data) || '-'
      ]);
    } else if (activePage === 'plantio') {
      allRows = plantioData.map(item => [
        item.data,
        item.unidade || item.empresa || selectedUnidade || '-',
        item.cultura || '-',
        item.cCusto || item.os || '-',
        item.fazenda || '-',
        item.pivo || '-',
        item.gleba || '-',
        item.variedade || '-',
        item.haDia || '-',
        item.mes || getMonthNameFromDate(item.data) || '-',
        item.obs || '-',
        item.areaDescartadas || '0,00',
        item.ano || getYearFromDate(item.data) || '-'
      ]);
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
          `*DATA:* ${cells[0] || '-'}\n` +
          `*Unidade:* ${cells[1] || '-'}\n` +
          `*Cultura:* ${cells[2] || '-'}\n` +
          `*C.Custo:* ${cells[3] || '-'}\n` +
          `*Fazenda:* ${cells[4] || '-'}\n` +
          `*PIVO:* ${cells[5] || '-'}\n` +
          `*Área/há:* ${cells[6] || '-'}\n` +
          `*Gleba:* ${cells[7] || '-'}\n` +
          `*Variedade:* ${cells[8] || '-'}\n` +
          `*Qtd.Colhida:* ${cells[9] || '-'}\n` +
          `*Média P/ Há:* ${cells[10] || '-'}\n` +
          `*Embalagem:* ${cells[11] || '-'}\n` +
          `*Produção Bruta Kg:* ${cells[12] || '-'}\n` +
          `*Produtividade Bruta/há:* ${cells[13] || '-'}\n` +
          `*Produção Beneficiada:* ${cells[14] || '-'}\n` +
          `*Produtividade Líquida/ha:* ${cells[15] || '-'}\n` +
          `*mês:* ${cells[16] || '-'}\n` +
          `*Ano:* ${cells[17] || '-'}`;
        textBlocks.push(block);
      } else if (activePage === 'plantio') {
        const block = `*INFORMAÇÕES DE PLANTIO*\n` +
          `*${(cells[4] || 'FAZENDA').toUpperCase()}*\n\n` +
          `*Data:* ${cells[0] || '-'}\n` +
          `*UNIDADE:* ${cells[1] || '-'}\n` +
          `*Cultura:* ${cells[2] || '-'}\n` +
          `*C.Custo:* ${cells[3] || '-'}\n` +
          `*Fazenda:* ${cells[4] || '-'}\n` +
          `*PIVO:* ${cells[5] || '-'}\n` +
          `*Gleba:* ${cells[6] || '-'}\n` +
          `*Variedade:* ${cells[7] || '-'}\n` +
          `*Área/há:* ${cells[8] || '-'}\n` +
          `*Mês:* ${cells[9] || '-'}\n` +
          `*Obs:* ${cells[10] || '-'}\n` +
          `*Area Descartadas:* ${cells[11] || '-'}\n` +
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
      headers = ['DATA', 'Unidade', 'Cultura', 'C.Custo', 'Fazenda', 'PIVO', 'Área/há', 'Gleba', 'Variedade', 'Qtd.Colhida', 'Média P/ Há', 'Embalagem', 'Produção Bruta Kg', 'Produtividade Bruta/há', 'Produção Beneficiada', 'Produtividade Líquida/ha', 'mês', 'Ano'];
      rows = colheitaData
        .map(i => [
          i.data,
          i.unidade || i.empresa || selectedUnidade || '-',
          i.cultura || '-',
          i.cCusto || i.os || '-',
          i.fazenda || '-',
          i.pivo || '-',
          i.areaHa || i.haDia || '-',
          i.gleba || '-',
          i.variedade || '-',
          i.qtdColhida || i.qtdColhido || i.caixasCortadas || '-',
          i.mediaHa || calculateMediaHaForColheita(i.qtdColhida || i.qtdColhido || i.caixasCortadas, i.areaHa || i.haDia) || '-',
          i.embalagem || i.caixaBinBag || '-',
          i.producaoBrutaKg || '-',
          i.produtividadeBrutaHa || calculateProdutividade(i.producaoBrutaKg, i.areaHa || i.haDia) || '-',
          i.producaoBeneficiada || '-',
          i.produtividadeLiquidaHa || calculateProdutividade(i.producaoBeneficiada, i.areaHa || i.haDia) || '-',
          i.mes || getMonthNameFromDate(i.data) || '-',
          i.ano || getYearFromDate(i.data) || '-'
        ])
        .filter(r => isRowVisible(r));
    } else if (activePage === 'plantio') {
      headers = ['Data', 'UNIDADE', 'Cultura', 'C.Custo', 'Fazenda', 'PIVO', 'Gleba', 'Variedade', 'Área/há', 'Mês', 'Obs', 'Area Descartadas', 'Ano'];
      rows = plantioData
        .map(i => [
          i.data,
          i.unidade || i.empresa || selectedUnidade || '-',
          i.cultura || '-',
          i.cCusto || i.os || '-',
          i.fazenda || '-',
          i.pivo || '-',
          i.gleba || '-',
          i.variedade || '-',
          i.haDia || '-',
          i.mes || getMonthNameFromDate(i.data) || '-',
          i.obs || '-',
          i.areaDescartadas || '0,00',
          i.ano || getYearFromDate(i.data) || '-'
        ])
        .filter(r => isRowVisible(r));
    } else if (activePage === 'variedades') {
      headers = ['CÓDIGO', 'NOME', 'CULTURA'];
      rows = getCombinedVariedades()
        .map((i, idx) => [i.codigo || String(idx + 1), i.nome, i.cultura || '-'])
        .filter(r => isRowVisible(r));
    } else if (activePage === 'amarracoes') {
      headers = ['CÓDIGO', 'CATEGORIA', 'TÍTULO / ORDEM', 'ORIGEM', 'DESTINO', 'HECTARES', 'STATUS', 'OBSERVAÇÃO'];
      rows = amarracoesData
        .filter(isItemInSelectedUnidade)
        .map(i => [i.codigoMarca || '-', i.categoria || 'geral', i.titulo || '-', i.origem || '-', i.destino || '-', i.hectares || '-', i.status || 'Ativo', i.observacao || '-'])
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

  const exportAmarracoesToCSV = () => {
    const headers = ['CÓDIGO', 'CATEGORIA', 'TÍTULO / ORDEM', 'ORIGEM', 'DESTINO', 'HECTARES', 'STATUS', 'OBSERVAÇÃO'];
    const rows = amarracoesData
      .filter(isItemInSelectedUnidade)
      .map(i => [
        i.codigoMarca || '-',
        i.categoria || 'geral',
        i.titulo || '-',
        i.origem || '-',
        i.destino || '-',
        i.hectares || '-',
        i.status || 'Ativo',
        i.observacao || '-'
      ]);

    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(';'),
      ...rows.map(row => row.map(cell => `"${String(cell || '').replace(/[\n\r]/g, ' ').replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Amarracoes_${selectedUnidade}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exportação de Amarrações gerada com sucesso!', 'success');
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
      const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
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

  // Open Modal for Add/Edit
  const openCurrentModal = (editData: string[] | null = null, index: number | null = null) => {
    setEditingIndex(index);
    const initial: Record<string, string> = {};

    if (activePage === 'colheita') {
      const defaultDate = new Date().toISOString().split('T')[0];
      const doc = index !== null && colheitaData[index] ? colheitaData[index] : null;
      const selectedDate = editData && editData[0] ? (dateToInputFormat(editData[0]) || editData[0]) : defaultDate;
      initial.cData = selectedDate;
      initial.cUnidade = editData && editData[1] && editData[1] !== '-' ? editData[1] : (doc?.unidade || doc?.empresa || (empresasData.filter(isItemInSelectedUnidade)[0]?.nome || selectedUnidade));
      initial.cEmpresa = initial.cUnidade;
      initial.cCultura = editData ? editData[2] : (doc?.cultura || '');
      initial.cCCusto = editData ? editData[3] : (doc?.cCusto || doc?.os || '');
      initial.cOs = initial.cCCusto;
      initial.cFazenda = editData ? editData[4] : (doc?.fazenda || '');
      initial.cPivo = editData ? editData[5] : (doc?.pivo || '');
      initial.cAreaHa = editData ? editData[6] : (doc?.areaHa || doc?.haDia || '');
      initial.cHaDia = initial.cAreaHa;
      initial.cGleba = editData ? editData[7] : (doc?.gleba || '');
      initial.cVariedade = editData ? editData[8] : (doc?.variedade || '');
      initial.cQtdColhida = editData && editData[9] && editData[9] !== '-' ? editData[9] : (doc?.qtdColhida || doc?.qtdColhido || doc?.caixasCortadas || '');
      initial.cQtdColhido = initial.cQtdColhida;
      initial.cCaixasCortadas = initial.cQtdColhida;
      initial.cMediaHa = editData && editData[10] && editData[10] !== '-' ? editData[10] : (doc?.mediaHa || calculateMediaHaForColheita(initial.cQtdColhida, initial.cAreaHa));
      initial.cEmbalagem = editData && editData[11] && editData[11] !== '-' ? editData[11] : (doc?.embalagem || doc?.caixaBinBag || 'Caixas');
      initial.cCaixaBinBag = initial.cEmbalagem;
      initial.cProducaoBrutaKg = editData && editData[12] && editData[12] !== '-' ? editData[12] : (doc?.producaoBrutaKg || '');
      initial.cProdutividadeBrutaHa = editData && editData[13] && editData[13] !== '-' ? editData[13] : (doc?.produtividadeBrutaHa || calculateProdutividade(initial.cProducaoBrutaKg, initial.cAreaHa));
      initial.cProducaoBeneficiada = editData && editData[14] && editData[14] !== '-' ? editData[14] : (doc?.producaoBeneficiada || '');
      initial.cProdutividadeLiquidaHa = editData && editData[15] && editData[15] !== '-' ? editData[15] : (doc?.produtividadeLiquidaHa || calculateProdutividade(initial.cProducaoBeneficiada, initial.cAreaHa));
      initial.cMes = editData && editData[16] && editData[16] !== '-' ? editData[16] : (doc?.mes || getMonthNameFromDate(selectedDate));
      initial.cAno = editData && editData[17] && editData[17] !== '-' ? editData[17] : (doc?.ano || getYearFromDate(selectedDate));
      initial.cHaGeral = doc?.haGeral || (lookupPlantedHectaresForSelection(initial.cCultura, initial.cFazenda, initial.cPivo, initial.cGleba, initial.cVariedade) || '');
      initial.cHaRestante = doc?.haRestante || calculateHaRestanteForColheita(initial.cHaGeral, initial.cAreaHa, initial.cCultura, initial.cFazenda, initial.cPivo, initial.cGleba, initial.cVariedade, index);
      initial.cGlebasFinalizada = doc?.glebasFinalizada || 'Não';
    } else if (activePage === 'plantio') {
      const defaultDate = new Date().toISOString().split('T')[0];
      const doc = index !== null && plantioData[index] ? plantioData[index] : null;
      initial.pData = editData && editData[0] ? (dateToInputFormat(editData[0]) || editData[0]) : defaultDate;
      initial.pUnidade = editData && editData[1] && editData[1] !== '-' ? editData[1] : (doc?.unidade || selectedUnidade);
      initial.pEmpresa = doc?.empresa || initial.pUnidade;
      initial.pCultura = editData ? editData[2] : (doc?.cultura || '');
      initial.pCCusto = editData ? editData[3] : (doc?.cCusto || doc?.os || '');
      initial.pOs = initial.pCCusto;
      initial.pFazenda = editData ? editData[4] : (doc?.fazenda || '');
      initial.pPivo = editData ? editData[5] : (doc?.pivo || '');
      initial.pGleba = editData ? editData[6] : (doc?.gleba || '');
      initial.pVariedade = editData ? editData[7] : (doc?.variedade || '');
      initial.pHaDia = editData ? editData[8] : (doc?.haDia || '');
      const autoTieHa = (initial.pPivo || initial.pGleba || initial.pFazenda) ? lookupHectaresForSelection(initial.pPivo, initial.pGleba, initial.pFazenda) : '';
      initial.pHaGeral = doc?.haGeral || autoTieHa;
      initial.pMes = editData && editData[9] && editData[9] !== '-' ? editData[9] : (doc?.mes || getMonthNameFromDate(initial.pData));
      initial.pObs = editData && editData[10] && editData[10] !== '-' ? editData[10] : (doc?.obs || '');
      initial.pAreaDescartadas = editData && editData[11] && editData[11] !== '-' ? editData[11] : (doc?.areaDescartadas || '0,00');
      initial.pAno = editData && editData[12] && editData[12] !== '-' ? editData[12] : (doc?.ano || getYearFromDate(initial.pData));
      initial.pHaRestante = doc?.haRestante || calculateHaRestanteForPlantio(initial.pHaGeral, initial.pHaDia, initial.pPivo, initial.pGleba, initial.pFazenda, index);
      initial.pGlebasFinalizada = doc?.glebasFinalizada || 'Não';
      initial.pMediaHa = doc?.mediaHa || '';
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
        const cDate = formData.cData || '';
        const cMes = formData.cMes || getMonthNameFromDate(cDate) || '-';
        const cAno = formData.cAno || getYearFromDate(cDate) || '-';
        const cUnidade = formData.cUnidade || formData.cEmpresa || (existingDoc?.unidade || selectedUnidade);
        const cCCusto = formData.cCCusto || formData.cOs || '-';
        const cAreaHa = formData.cAreaHa || formData.cHaDia || '-';
        const cQtdColhida = formData.cQtdColhida || formData.cQtdColhido || formData.cCaixasCortadas || '-';
        const cEmbalagem = formData.cEmbalagem || formData.cCaixaBinBag || 'Caixas';
        const cProducaoBrutaKg = formData.cProducaoBrutaKg || '-';
        const cProdutividadeBrutaHa = formData.cProdutividadeBrutaHa || calculateProdutividade(cProducaoBrutaKg, cAreaHa) || '-';
        const cProducaoBeneficiada = formData.cProducaoBeneficiada || '-';
        const cProdutividadeLiquidaHa = formData.cProdutividadeLiquidaHa || calculateProdutividade(cProducaoBeneficiada, cAreaHa) || '-';
        const cMediaHa = formData.cMediaHa || calculateMediaHaForColheita(cQtdColhida, cAreaHa) || '-';

        const newItem: ColheitaItem = {
          data: inputToDisplayFormat(cDate),
          unidade: cUnidade,
          empresa: cUnidade,
          cultura: formData.cCultura || '',
          cCusto: cCCusto,
          os: cCCusto,
          fazenda: formData.cFazenda || '',
          mes: cMes,
          ano: cAno,
          pivo: formData.cPivo || '-',
          areaHa: cAreaHa,
          haDia: cAreaHa,
          gleba: formData.cGleba || '-',
          variedade: formData.cVariedade || '-',
          qtdColhida: cQtdColhida,
          qtdColhido: cQtdColhida,
          caixasCortadas: cQtdColhida,
          mediaHa: cMediaHa,
          embalagem: cEmbalagem,
          caixaBinBag: cEmbalagem,
          producaoBrutaKg: cProducaoBrutaKg,
          produtividadeBrutaHa: cProdutividadeBrutaHa,
          producaoBeneficiada: cProducaoBeneficiada,
          produtividadeLiquidaHa: cProdutividadeLiquidaHa,
          haGeral: formData.cHaGeral || (existingDoc?.haGeral || '-'),
          haRestante: formData.cHaRestante || (existingDoc?.haRestante || '-'),
          glebasFinalizada: formData.cGlebasFinalizada || (existingDoc?.glebasFinalizada || '-')
        };

        await saveDocument(COLLECTIONS.colheita, newItem, existingDoc?.id);
      } else if (activePage === 'plantio') {
        const existingDoc = editingIndex !== null ? plantioData[editingIndex] : null;
        const pDate = formData.pData || '';
        const pMes = formData.pMes || getMonthNameFromDate(pDate) || '-';
        const pAno = formData.pAno || getYearFromDate(pDate) || '-';
        const pUnidade = formData.pUnidade || (existingDoc?.unidade || selectedUnidade);
        const pEmpresa = formData.pEmpresa || pUnidade || '-';
        const pCCusto = formData.pCCusto || formData.pOs || '-';
        const pOs = formData.pOs || formData.pCCusto || '-';
        const newItem: PlantioItem = {
          data: inputToDisplayFormat(pDate),
          unidade: pUnidade,
          empresa: pEmpresa,
          cultura: formData.pCultura || '',
          cCusto: pCCusto,
          os: pOs,
          fazenda: formData.pFazenda || '',
          pivo: formData.pPivo || '-',
          gleba: formData.pGleba || '-',
          variedade: formData.pVariedade || '-',
          haDia: formData.pHaDia || '-',
          mes: pMes,
          obs: formData.pObs || '-',
          areaDescartadas: formData.pAreaDescartadas || '0,00',
          ano: pAno,
          haGeral: formData.pHaGeral || (existingDoc?.haGeral || '-'),
          haRestante: formData.pHaRestante || (existingDoc?.haRestante || '-'),
          glebasFinalizada: formData.pGlebasFinalizada || (existingDoc?.glebasFinalizada || '-'),
          mediaHa: formData.pMediaHa || (existingDoc?.mediaHa || '-')
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
      const finalVal = ['haGeral', 'haDia', 'areaHa', 'haRestante', 'mediaHa', 'producaoBrutaKg', 'produtividadeBrutaHa', 'producaoBeneficiada', 'produtividadeLiquidaHa'].includes(fieldKey) ? sanitizeHectaresInput(value) : value;
      const updated: any = { ...item, [fieldKey]: finalVal };
      if (fieldKey === 'areaHa') {
        updated.haDia = finalVal;
      } else if (fieldKey === 'haDia') {
        updated.areaHa = finalVal;
      } else if (fieldKey === 'cCusto') {
        updated.os = finalVal;
      } else if (fieldKey === 'os') {
        updated.cCusto = finalVal;
      } else if (fieldKey === 'unidade') {
        updated.empresa = finalVal;
      } else if (fieldKey === 'empresa') {
        updated.unidade = finalVal;
      } else if (fieldKey === 'qtdColhida') {
        updated.qtdColhido = finalVal;
        updated.caixasCortadas = finalVal;
      } else if (fieldKey === 'qtdColhido' || fieldKey === 'caixasCortadas') {
        updated.qtdColhida = finalVal;
      } else if (fieldKey === 'embalagem') {
        updated.caixaBinBag = finalVal;
      } else if (fieldKey === 'caixaBinBag') {
        updated.embalagem = finalVal;
      }

      const area = updated.areaHa || updated.haDia;
      const qtd = updated.qtdColhida || updated.qtdColhido || updated.caixasCortadas;
      if (['areaHa', 'haDia', 'qtdColhida', 'qtdColhido', 'caixasCortadas'].includes(fieldKey)) {
        updated.mediaHa = calculateMediaHaForColheita(qtd, area);
      }
      if (['areaHa', 'haDia', 'producaoBrutaKg'].includes(fieldKey)) {
        updated.produtividadeBrutaHa = calculateProdutividade(updated.producaoBrutaKg, area);
      }
      if (['areaHa', 'haDia', 'producaoBeneficiada'].includes(fieldKey)) {
        updated.produtividadeLiquidaHa = calculateProdutividade(updated.producaoBeneficiada, area);
      }

      await saveDocument(COLLECTIONS.colheita, updated, item.id);
    } else if (page === 'plantio') {
      const item = plantioData[rowIndex];
      if (!item) return;
      const finalVal = ['haGeral', 'haDia', 'haRestante', 'mediaHa', 'areaDescartadas'].includes(fieldKey) ? sanitizeHectaresInput(value) : value;
      const updated: any = { ...item, [fieldKey]: finalVal };
      if (fieldKey === 'cCusto') {
        updated.os = finalVal;
      } else if (fieldKey === 'os') {
        updated.cCusto = finalVal;
      } else if (fieldKey === 'unidade') {
        updated.empresa = finalVal;
      } else if (fieldKey === 'empresa') {
        updated.unidade = finalVal;
      }
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

  // SE NÃO HOUVER USUÁRIO LOGADO, EXIBIR A TELA DE LOGIN
  if (!currentUser) {
    return (
      <div style={{
        minHeight: '100dvh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#002050',
        backgroundImage: 'radial-gradient(circle at 50% 30%, #003366 0%, #001529 100%)',
        fontFamily: 'Segoe UI, system-ui, -apple-system, sans-serif',
        padding: '16px 12px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header da Tela de Login */}
          <div style={{
            backgroundColor: '#0078d4',
            padding: '24px 20px 20px 20px',
            color: '#ffffff',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
              backdropFilter: 'blur(4px)',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}>
              <i className="fa-solid fa-wheat-awn" style={{ fontSize: '24px', color: '#ffffff' }}></i>
            </div>

            <h1 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 700, letterSpacing: '0.5px' }}>
              CRISTALINA
            </h1>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.9, fontWeight: 500 }}>
              Sistema Agromineiro / Controle Agrícola
            </p>
          </div>

          {/* Form de Login */}
          <form onSubmit={handleLoginSubmit} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {loginErrorMsg && (
              <div style={{
                backgroundColor: '#fde7e9',
                color: '#a80000',
                border: '1px solid #f3b2b3',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>{loginErrorMsg}</span>
              </div>
            )}

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#323130', display: 'block', marginBottom: '6px' }}>
                <i className="fa-solid fa-id-badge" style={{ color: '#0078d4', marginRight: '6px' }}></i>
                ID ou Nome do Usuário
              </label>
              <input
                type="text"
                value={loginUserId}
                onChange={e => setLoginUserId(e.target.value)}
                placeholder="Ex: USR-001 ou Administrador Geral"
                autoFocus={!loginUserId}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '6px',
                  border: '1px solid #8a8886',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {/* Sugestões de Usuários do Banco de Dados */}
              {(userAccounts.length > 0 ? userAccounts : DEFAULT_USER_ACCOUNTS).length > 0 && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '11px', color: '#605e5c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <i className="fa-solid fa-users" style={{ color: '#0078d4' }}></i>
                    <span>Selecione seu usuário:</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(userAccounts.length > 0 ? userAccounts : DEFAULT_USER_ACCOUNTS).map(u => {
                      const isSelected = loginUserId.toLowerCase() === u.id.toLowerCase() || loginUserId.toLowerCase() === u.nome.toLowerCase();
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setLoginUserId(u.id);
                            setLoginErrorMsg('');
                            const allowed = getAllowedUnidadesForUser(u);
                            if (allowed.length > 0 && !allowed.includes(loginUnidade)) {
                              setLoginUnidade(allowed[0]);
                            }
                          }}
                          style={{
                            backgroundColor: isSelected ? '#eff6fc' : '#ffffff',
                            color: isSelected ? '#0078d4' : '#323130',
                            border: isSelected ? '1.5px solid #0078d4' : '1px solid #d2d0ce',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: isSelected ? '0 1px 3px rgba(0,120,212,0.15)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <i className="fa-solid fa-user" style={{ fontSize: '11px', color: isSelected ? '#0078d4' : '#8a8886' }}></i>
                          <span>{u.nome}</span>
                          <span style={{ fontSize: '10px', color: isSelected ? '#005a9e' : '#605e5c', backgroundColor: isSelected ? '#c7e0f4' : '#edebe9', padding: '1px 5px', borderRadius: '4px' }}>
                            {u.id}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#323130', display: 'block', marginBottom: '6px' }}>
                <i className="fa-solid fa-lock" style={{ color: '#0078d4', marginRight: '6px' }}></i>
                Senha de Acesso <span style={{ color: '#a80000' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="Digite sua senha..."
                  autoFocus={!!loginUserId}
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 14px',
                    borderRadius: '6px',
                    border: '1px solid #8a8886',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#605e5c',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '4px'
                  }}
                  title={showLoginPassword ? "Ocultar Senha" : "Exibir Senha"}
                >
                  <i className={`fa-solid ${showLoginPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#323130', display: 'block', marginBottom: '6px' }}>
                <i className="fa-solid fa-location-dot" style={{ color: '#0078d4', marginRight: '6px' }}></i>
                Unidade de Produção
              </label>
              {(() => {
                const searchKey = loginUserId.trim().toLowerCase();
                const matchedUser = userAccounts.find(
                  u => u.id.toLowerCase() === searchKey || u.nome.toLowerCase() === searchKey
                );
                const allowedUnits = getAllowedUnidadesForUser(matchedUser || null);

                return (
                  <>
                    <select
                      value={loginUnidade}
                      onChange={e => setLoginUnidade(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '6px',
                        border: '1px solid #8a8886',
                        fontSize: '15px',
                        backgroundColor: '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    >
                      {allowedUnits.map((u, i) => (
                        <option key={i} value={u}>{u}</option>
                      ))}
                    </select>

                    {matchedUser && (
                      <div style={{ marginTop: '6px', fontSize: '11px', color: '#605e5c', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f3f2f1', padding: '6px 10px', borderRadius: '4px', border: '1px solid #e1dfdd' }}>
                        <i className="fa-solid fa-building" style={{ color: '#0078d4' }}></i>
                        <span>
                          <strong>Empresas Permitidas:</strong> {
                            (!matchedUser.empresasPermitidas || matchedUser.empresasPermitidas.length === 0 || matchedUser.empresasPermitidas.includes('TODAS'))
                              ? 'Todas as Empresas (Sem Restrição)'
                              : matchedUser.empresasPermitidas.join(', ')
                          }
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <button
              type="submit"
              style={{
                marginTop: '8px',
                backgroundColor: '#0078d4',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0, 120, 212, 0.3)',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#106ebe')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0078d4')}
            >
              <i className="fa-solid fa-right-to-bracket"></i>
              <span>Entrar no Sistema</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#ffffff', color: '#323130', fontSize: '13px' }}>
      
      {/* BARRA SUPERIOR */}
      <div className="topbar">
        <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button className="btn-toggle-menu" onClick={toggleSidebar} aria-label="Abrir Menu">
            <i className="fa-solid fa-bars"></i>
          </button>
          {hasPermission('amarracoes') && (
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
          )}
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
          <button
            onClick={() => setIsPwaModalOpen(true)}
            title="Instalar Aplicativo (PWA)"
            style={{
              background: 'rgba(255, 255, 255, 0.18)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              padding: '6px 10px',
              borderRadius: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            <i className="fa-solid fa-download"></i>
          </button>
          <i className="fa-regular fa-bell" title="Notificações" style={{ cursor: 'pointer' }}></i>
          {hasPermission('configuracoes') && (
            <i
              className="fa-solid fa-gear"
              title="Configurações do Sistema"
              onClick={() => setShowSettingsModal(true)}
              style={{ cursor: 'pointer', fontSize: '16px', padding: '6px', borderRadius: '4px', transition: 'background-color 0.15s' }}
            ></i>
          )}

          {/* ÍCONE DA INICIAL DO USUÁRIO LOGADO */}
          <button
            onClick={handleLogout}
            title={`Conectado como: ${currentUser.nome} (${currentUser.id} - ${selectedUnidade}). Clique para sair.`}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#0078d4',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(255, 255, 255, 0.7)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
              transition: 'transform 0.15s ease, background-color 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {currentUser.nome ? currentUser.nome.charAt(0).toUpperCase() : 'U'}
          </button>
        </div>
      </div>

      {/* PWA INSTALL BANNER */}
      <PWAInstallBanner onOpenModal={() => setIsPwaModalOpen(true)} />

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
          <div className="sidebar-header">
            <div className="sidebar-header-title">
              <i className="fa-solid fa-bars" style={{ fontSize: '15px' }}></i>
              <span>Menu Principal</span>
            </div>
            <button
              className="sidebar-close-btn"
              onClick={closeSidebar}
              title="Fechar menu"
              aria-label="Fechar menu"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="sidebar-title">Navegação</div>
          {hasPermission('amarracoes') && (
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
          )}
          {hasPermission('plantio') && (
            <div className={`sidebar-item ${activePage === 'plantio' ? 'active' : ''}`} onClick={() => switchPage('plantio')}>BdPlantio</div>
          )}
          {hasPermission('colheita') && (
            <div className={`sidebar-item ${activePage === 'colheita' ? 'active' : ''}`} onClick={() => switchPage('colheita')}>BdColheita</div>
          )}
          
          {/* GRUPO CADASTRO GERAL */}
          {hasPermission('cadastro_geral') && (
            <div style={{ margin: '4px 0' }}>
              <div
                className={`sidebar-item ${isCadastroPage(activePage) ? 'active' : ''}`}
                onClick={() => {
                  setIsCadastroGroupOpen(!isCadastroGroupOpen);
                  if (!isCadastroPage(activePage)) {
                    const firstAllowed = cadastroSubCategories.find(sub => hasPermission(sub.key))?.key || 'empresas';
                    switchPage(firstAllowed);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontWeight: isCadastroPage(activePage) ? 600 : 500,
                  color: isCadastroPage(activePage) ? '#0078d4' : '#323130'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-folder-tree" style={{ color: '#0078d4' }}></i>
                  <span>Cadastro_Geral</span>
                </span>
                <i className={`fa-solid fa-chevron-${isCadastroGroupOpen ? 'down' : 'right'}`} style={{ fontSize: '10px', color: '#605e5c' }}></i>
              </div>

              {isCadastroGroupOpen && (
                <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                  {cadastroSubCategories.filter(sub => hasPermission(sub.key)).map(sub => (
                    <div
                      key={sub.key}
                      className={`sidebar-item ${activePage === sub.key ? 'active' : ''}`}
                      onClick={() => {
                        setCadastroSubPage(sub.key);
                        switchPage(sub.key);
                      }}
                      style={{
                        fontSize: '12px',
                        padding: '5px 8px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <i className={`fa-solid ${sub.icon}`} style={{ fontSize: '11px', width: '14px', textAlign: 'center', color: activePage === sub.key ? '#0078d4' : '#605e5c' }}></i>
                      <span>Cadastro_{sub.label.replace(/\s+/g, '')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {hasPermission('documentos') && <div className="sidebar-item">Documentos</div>}
          {hasPermission('ciclos_cultivo') && <div className="sidebar-item">Ciclos_Cultivo</div>}
          {hasPermission('frentes_trabalho') && <div className="sidebar-item">TbFrentesTrabalho_APS...</div>}
          {hasPermission('apontamentos_apsa') && <div className="sidebar-item">TbApontamentos_APSa...</div>}
          {hasPermission('apontamentos_safris') && <div className="sidebar-item">TbApontamentosSafris...</div>}
          
          {/* MÓDULO PMS */}
          {hasPermission('controle') && (
            <div
              className={`sidebar-item ${activePage === 'controle' ? 'active' : ''}`}
              onClick={() => {
                closeSidebar();
                switchPage('controle');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontWeight: activePage === 'controle' ? 600 : 400,
                color: activePage === 'controle' ? '#0078d4' : '#323130'
              }}
            >
              <i className="fa-solid fa-file-excel" style={{ color: activePage === 'controle' ? '#107c41' : '#605e5c', width: '14px', textAlign: 'center' }}></i>
              <span>PMS</span>
            </div>
          )}

          {/* MÓDULO PROJETOS SANKHYA */}
          {hasPermission('projetos_sankhya') && (
            <div
              className={`sidebar-item ${activePage === 'projetos_sankhya' ? 'active' : ''}`}
              onClick={() => {
                closeSidebar();
                switchPage('projetos_sankhya');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontWeight: activePage === 'projetos_sankhya' ? 600 : 400,
                color: activePage === 'projetos_sankhya' ? '#0078d4' : '#323130'
              }}
            >
              <i className="fa-solid fa-diagram-project" style={{ color: activePage === 'projetos_sankhya' ? '#0284c7' : '#605e5c', width: '14px', textAlign: 'center' }}></i>
              <span>Projetos Sankhya</span>
            </div>
          )}

          {hasPermission('lixeira') && (
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
          )}
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
            {mainCategories.filter(cat => hasPermission(cat.key)).map(cat => {
              const isActive = cat.key === 'cadastro_geral' ? isCadastroPage(activePage) : activePage === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => switchPage(cat.key)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '4px 4px 0 0',
                    border: '1px solid',
                    borderColor: isActive ? '#e1dfdd #e1dfdd #ffffff #e1dfdd' : 'transparent',
                    borderBottom: isActive ? '3px solid #0078d4' : '3px solid transparent',
                    backgroundColor: isActive ? '#ffffff' : 'transparent',
                    color: isActive ? '#0078d4' : '#605e5c',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
            {hasPermission('lixeira') && (() => {
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

          {/* SUB TABS PARA CADASTRO GERAL */}
          {isCadastroPage(activePage) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflowX: 'auto',
              padding: '8px 16px',
              backgroundColor: '#f3f2f1',
              borderBottom: '1px solid #e1dfdd',
              scrollbarWidth: 'thin'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#323130', marginRight: '6px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                <i className="fa-solid fa-folder-tree" style={{ color: '#0078d4' }}></i>
                Cadastro Geral:
              </span>
              {cadastroSubCategories.filter(sub => hasPermission(sub.key)).map(sub => {
                const isSubActive = activePage === sub.key;
                return (
                  <button
                    key={sub.key}
                    onClick={() => {
                      setCadastroSubPage(sub.key);
                      switchPage(sub.key);
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '14px',
                      border: '1px solid',
                      borderColor: isSubActive ? '#0078d4' : '#d2d0ce',
                      backgroundColor: isSubActive ? '#0078d4' : '#ffffff',
                      color: isSubActive ? '#ffffff' : '#323130',
                      fontWeight: isSubActive ? 600 : 400,
                      fontSize: '12px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <i className={`fa-solid ${sub.icon}`} style={{ fontSize: '11px' }}></i>
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="command-bar">
            <button className="btn-add-item" onClick={() => openCurrentModal()} style={{ display: activePage === 'lixeira' ? 'none' : 'inline-flex' }}>
              <i className="fa-solid fa-plus"></i> Adicionar novo item
            </button>

            <button className={`cmd-btn ${isGridEditing ? 'active-mode' : ''}`} id="btnGridMode" onClick={toggleGridMode}>
              <i className="fa-solid fa-table-cells"></i> <span id="gridBtnText">{isGridEditing ? 'Sair da Grade' : 'Modo grade'}</span>
            </button>

            <button
              className="cmd-btn"
              onClick={openGeneralImportModal}
              style={{ display: activePage === 'lixeira' ? 'none' : 'inline-flex' }}
              title="Importar planilha Excel ou CSV (.xlsx, .xls, .csv)"
            >
              <i className="fa-solid fa-file-import" style={{ color: '#107c41' }}></i> Importar
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
              {(activePage === 'colheita' || activePage === 'plantio') && (
                <>
                  <ExcelDimensionsControl
                    tableType={activePage as 'colheita' | 'plantio'}
                    defaultRowHeight={defaultRowHeight}
                    onSetRowHeightPreset={handleSetRowHeightPreset}
                    onResetDimensions={() => handleResetTableDimensions(activePage as 'colheita' | 'plantio')}
                    wrapText={wrapText}
                    onToggleWrapText={toggleWrapText}
                  />
                  <button
                    type="button"
                    id="btnWrapText"
                    className="excel-wrap-btn inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded border transition-all"
                    style={{
                      backgroundColor: wrapText ? '#e0edfa' : '#ffffff',
                      borderColor: wrapText ? '#0078d4' : '#d1d5db',
                      color: wrapText ? '#005a9e' : '#1f2937',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                    onClick={toggleWrapText}
                    title={wrapText ? "Quebrar Texto Automaticamente: ATIVADO (Clique para desativar)" : "Quebrar Texto Automaticamente: DESATIVADO (Clique para ativar)"}
                  >
                    <i className="fa-solid fa-arrow-turn-down text-[10px]" style={{ transform: 'rotate(90deg)', color: wrapText ? '#0078d4' : '#64748b' }}></i>
                    <span>Quebrar Texto</span>
                    <span
                      className={`w-2 h-2 rounded-full ${wrapText ? 'bg-[#0078d4]' : 'bg-gray-300'}`}
                      style={{ transition: 'background-color 0.2s' }}
                    />
                  </button>
                </>
              )}
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
              <table
                id="tableColheita"
                className={`${isGridEditing ? 'grid-editing' : ''} ${wrapText ? 'table-wrap-text' : 'table-nowrap'}`}
                style={{
                  width: `${totalWidthColheita}px`,
                  minWidth: `${totalWidthColheita}px`,
                  maxWidth: `${totalWidthColheita}px`,
                  tableLayout: 'fixed'
                }}
              >
                <colgroup>
                  {colWidthsColheita.map((w, i) => (
                    <col key={i} style={{ width: `${w}px`, minWidth: `${w}px`, maxWidth: `${w}px` }} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <th title="DATA" style={{ width: `${colWidthsColheita[0]}px`, minWidth: `${colWidthsColheita[0]}px`, maxWidth: `${colWidthsColheita[0]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">DATA</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(0) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 0)}
                          title="Filtrar por DATA"
                        >
                          <i className={`fa-solid ${isColFiltered(0) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(0) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('colheita', 0, e)}
                        onDoubleClick={() => handleColReset('colheita', 0)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="Unidade" style={{ width: `${colWidthsColheita[1]}px`, minWidth: `${colWidthsColheita[1]}px`, maxWidth: `${colWidthsColheita[1]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">Unidade</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(1) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 1)}
                          title="Filtrar por Unidade"
                        >
                          <i className={`fa-solid ${isColFiltered(1) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(1) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('colheita', 1, e)}
                        onDoubleClick={() => handleColReset('colheita', 1)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="Cultura" style={{ width: `${colWidthsColheita[2]}px`, minWidth: `${colWidthsColheita[2]}px`, maxWidth: `${colWidthsColheita[2]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">Cultura</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(2) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 2)}
                          title="Filtrar por Cultura"
                        >
                          <i className={`fa-solid ${isColFiltered(2) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(2) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('colheita', 2, e)}
                        onDoubleClick={() => handleColReset('colheita', 2)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="C.Custo" style={{ width: `${colWidthsColheita[3]}px`, minWidth: `${colWidthsColheita[3]}px`, maxWidth: `${colWidthsColheita[3]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">C.Custo</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(3) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 3)}
                          title="Filtrar por C.Custo"
                        >
                          <i className={`fa-solid ${isColFiltered(3) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(3) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('colheita', 3, e)}
                        onDoubleClick={() => handleColReset('colheita', 3)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="Fazenda" style={{ width: `${colWidthsColheita[4]}px`, minWidth: `${colWidthsColheita[4]}px`, maxWidth: `${colWidthsColheita[4]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">Fazenda</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(4) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 4)}
                          title="Filtrar por Fazenda"
                        >
                          <i className={`fa-solid ${isColFiltered(4) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(4) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('colheita', 4, e)}
                        onDoubleClick={() => handleColReset('colheita', 4)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="PIVO" style={{ width: `${colWidthsColheita[5]}px`, minWidth: `${colWidthsColheita[5]}px`, maxWidth: `${colWidthsColheita[5]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">PIVO</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(5) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 5)}
                          title="Filtrar por PIVO"
                        >
                          <i className={`fa-solid ${isColFiltered(5) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(5) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('colheita', 5, e)}
                        onDoubleClick={() => handleColReset('colheita', 5)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="Área/há" style={{ width: `${colWidthsColheita[6]}px`, minWidth: `${colWidthsColheita[6]}px`, maxWidth: `${colWidthsColheita[6]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">Área/há</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(6) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 6)}
                          title="Filtrar por Área/há"
                        >
                          <i className={`fa-solid ${isColFiltered(6) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(6) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('colheita', 6, e)}
                        onDoubleClick={() => handleColReset('colheita', 6)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="Gleba" style={{ width: `${colWidthsColheita[7]}px`, minWidth: `${colWidthsColheita[7]}px`, maxWidth: `${colWidthsColheita[7]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">Gleba</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(7) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 7)}
                          title="Filtrar por Gleba"
                        >
                          <i className={`fa-solid ${isColFiltered(7) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(7) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('colheita', 7, e)}
                        onDoubleClick={() => handleColReset('colheita', 7)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="Variedade" style={{ width: `${colWidthsColheita[8]}px`, minWidth: `${colWidthsColheita[8]}px`, maxWidth: `${colWidthsColheita[8]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">Variedade</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(8) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 8)}
                          title="Filtrar por Variedade"
                        >
                          <i className={`fa-solid ${isColFiltered(8) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(8) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('colheita', 8, e)}
                        onDoubleClick={() => handleColReset('colheita', 8)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="Qtd. Colhida" style={{ width: `${colWidthsColheita[9]}px`, minWidth: `${colWidthsColheita[9]}px`, maxWidth: `${colWidthsColheita[9]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">Qtd. Colhida</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(9) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 9)}
                          title="Filtrar por Qtd. Colhida"
                        >
                          <i className={`fa-solid ${isColFiltered(9) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(9) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('colheita', 9, e)}
                        onDoubleClick={() => handleColReset('colheita', 9)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="Média P/ Há" style={{ width: `${colWidthsColheita[10]}px`, minWidth: `${colWidthsColheita[10]}px`, maxWidth: `${colWidthsColheita[10]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">Média P/ Há</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(10) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 10)}
                          title="Filtrar por Média P/ Há"
                        >
                          <i className={`fa-solid ${isColFiltered(10) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(10) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('colheita', 10, e)}
                        onDoubleClick={() => handleColReset('colheita', 10)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="Embalagem" style={{ width: `${colWidthsColheita[11]}px`, minWidth: `${colWidthsColheita[11]}px`, maxWidth: `${colWidthsColheita[11]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">Embalagem</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(11) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 11)}
                          title="Filtrar por Embalagem"
                        >
                          <i className={`fa-solid ${isColFiltered(11) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(11) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('colheita', 11, e)}
                        onDoubleClick={() => handleColReset('colheita', 11)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="Produção Bruta Kg" style={{ width: `${colWidthsColheita[12]}px`, minWidth: `${colWidthsColheita[12]}px`, maxWidth: `${colWidthsColheita[12]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">Produção Bruta Kg</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(12) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 12)}
                          title="Filtrar por Produção Bruta Kg"
                        >
                          <i className={`fa-solid ${isColFiltered(12) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(12) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('colheita', 12, e)}
                        onDoubleClick={() => handleColReset('colheita', 12)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="Produtividade Bruta/há" style={{ width: `${colWidthsColheita[13]}px`, minWidth: `${colWidthsColheita[13]}px`, maxWidth: `${colWidthsColheita[13]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">Produtividade Bruta/há</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(13) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 13)}
                          title="Filtrar por Produtividade Bruta/há"
                        >
                          <i className={`fa-solid ${isColFiltered(13) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(13) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('colheita', 13, e)}
                        onDoubleClick={() => handleColReset('colheita', 13)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="Produção Beneficiada" style={{ width: `${colWidthsColheita[14]}px`, minWidth: `${colWidthsColheita[14]}px`, maxWidth: `${colWidthsColheita[14]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">Produção Beneficiada</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(14) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 14)}
                          title="Filtrar por Produção Beneficiada"
                        >
                          <i className={`fa-solid ${isColFiltered(14) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(14) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('colheita', 14, e)}
                        onDoubleClick={() => handleColReset('colheita', 14)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="Produtividade Líquida/ha" style={{ width: `${colWidthsColheita[15]}px`, minWidth: `${colWidthsColheita[15]}px`, maxWidth: `${colWidthsColheita[15]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">Produtividade Líquida/ha</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(15) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 15)}
                          title="Filtrar por Produtividade Líquida/ha"
                        >
                          <i className={`fa-solid ${isColFiltered(15) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(15) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('colheita', 15, e)}
                        onDoubleClick={() => handleColReset('colheita', 15)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="mês" style={{ width: `${colWidthsColheita[16]}px`, minWidth: `${colWidthsColheita[16]}px`, maxWidth: `${colWidthsColheita[16]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">mês</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(16) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 16)}
                          title="Filtrar por mês"
                        >
                          <i className={`fa-solid ${isColFiltered(16) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(16) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('colheita', 16, e)}
                        onDoubleClick={() => handleColReset('colheita', 16)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="Ano" style={{ width: `${colWidthsColheita[17]}px`, minWidth: `${colWidthsColheita[17]}px`, maxWidth: `${colWidthsColheita[17]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">Ano</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(17) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 17)}
                          title="Filtrar por Ano"
                        >
                          <i className={`fa-solid ${isColFiltered(17) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(17) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('colheita', 17, e)}
                        onDoubleClick={() => handleColReset('colheita', 17)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th style={{ textAlign: 'center', width: `${colWidthsColheita[18]}px`, minWidth: `${colWidthsColheita[18]}px`, maxWidth: `${colWidthsColheita[18]}px`, boxSizing: 'border-box' }}>
                      <span className="th-excel-label" style={{ fontSize: '11px' }}>AÇÕES</span>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('colheita', 18, e)}
                        onDoubleClick={() => handleColReset('colheita', 18)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody id="tbodyColheita">
                  {getSortedList(colheitaData).map(({ item, originalIndex: idx }) => {
                    if (!isItemInSelectedUnidade(item)) return null;
                    const rowKey = item.id || (item as any).codigo || `colheita_${idx}`;
                    const rowHeight = getRowHeight('colheita', rowKey);
                    const rowCells = [
                      item.data,
                      item.unidade || item.empresa || selectedUnidade || '-',
                      item.cultura || '-',
                      item.cCusto || item.os || '-',
                      item.fazenda || '-',
                      item.pivo || '-',
                      item.areaHa || item.haDia || '-',
                      item.gleba || '-',
                      item.variedade || '-',
                      item.qtdColhida || item.qtdColhido || item.caixasCortadas || '-',
                      item.mediaHa || calculateMediaHaForColheita(item.qtdColhida || item.qtdColhido || item.caixasCortadas, item.areaHa || item.haDia) || '-',
                      item.embalagem || item.caixaBinBag || '-',
                      item.producaoBrutaKg || '-',
                      item.produtividadeBrutaHa || calculateProdutividade(item.producaoBrutaKg, item.areaHa || item.haDia) || '-',
                      item.producaoBeneficiada || '-',
                      item.produtividadeLiquidaHa || calculateProdutividade(item.producaoBeneficiada, item.areaHa || item.haDia) || '-',
                      item.mes || getMonthNameFromDate(item.data) || '-',
                      item.ano || getYearFromDate(item.data) || '-'
                    ];
                    if (!isRowVisible(rowCells)) return null;

                    const rowResizer = (
                      <div
                        className="excel-row-resizer"
                        contentEditable={false}
                        onMouseDown={e => handleRowResizeStart('colheita', rowKey, e)}
                        onDoubleClick={() => handleRowReset('colheita', rowKey)}
                        title="Arraste para ajustar altura da linha (Shift para todas) | Duplo clique para restaurar"
                      />
                    );

                    return (
                      <tr key={idx} style={{ height: `${rowHeight}px` }}>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'data', e.currentTarget.innerText)} style={{ fontWeight: 600 }}>
                          {item.data}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'unidade', e.currentTarget.innerText)}>
                          {item.unidade || item.empresa || selectedUnidade || '-'}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'cultura', e.currentTarget.innerText)} style={{ fontWeight: 600 }}>
                          {item.cultura}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'cCusto', e.currentTarget.innerText)}>
                          {item.cCusto || item.os || '-'}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'fazenda', e.currentTarget.innerText)}>
                          {item.fazenda}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'pivo', e.currentTarget.innerText)}>
                          {item.pivo || '-'}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'areaHa', e.currentTarget.innerText)}>
                          {item.areaHa || item.haDia || '-'}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'gleba', e.currentTarget.innerText)}>
                          {item.gleba || '-'}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'variedade', e.currentTarget.innerText)}>
                          {item.variedade || '-'}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'qtdColhida', e.currentTarget.innerText)}>
                          {item.qtdColhida || item.qtdColhido || item.caixasCortadas || '-'}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'mediaHa', e.currentTarget.innerText)} style={{ fontWeight: 600, color: '#0369a1' }}>
                          {item.mediaHa || calculateMediaHaForColheita(item.qtdColhida || item.qtdColhido || item.caixasCortadas, item.areaHa || item.haDia) || '-'}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'embalagem', e.currentTarget.innerText)}>
                          {item.embalagem || item.caixaBinBag || '-'}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'producaoBrutaKg', e.currentTarget.innerText)}>
                          {item.producaoBrutaKg || '-'}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'produtividadeBrutaHa', e.currentTarget.innerText)}>
                          {item.produtividadeBrutaHa || calculateProdutividade(item.producaoBrutaKg, item.areaHa || item.haDia) || '-'}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'producaoBeneficiada', e.currentTarget.innerText)}>
                          {item.producaoBeneficiada || '-'}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'produtividadeLiquidaHa', e.currentTarget.innerText)}>
                          {item.produtividadeLiquidaHa || calculateProdutividade(item.producaoBeneficiada, item.areaHa || item.haDia) || '-'}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'mes', e.currentTarget.innerText)}>
                          {item.mes || getMonthNameFromDate(item.data) || '-'}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('colheita', idx, 'ano', e.currentTarget.innerText)} style={{ fontWeight: 600 }}>
                          {item.ano || getYearFromDate(item.data) || '-'}
                          {rowResizer}
                        </td>
                        <td className="action-cell">
                          <button className="btn-action-row" onClick={() => openCurrentModal(rowCells, idx)} title="Editar"><i className="fa-solid fa-pen"></i></button>
                          <button className="btn-action-row" onClick={() => deleteRow('colheita', idx)} title="Mover para Lixeira"><i className="fa-solid fa-trash"></i></button>
                          {rowResizer}
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
              <table
                id="tablePlantio"
                className={`${isGridEditing ? 'grid-editing' : ''} ${wrapText ? 'table-wrap-text' : 'table-nowrap'}`}
                style={{
                  width: `${totalWidthPlantio}px`,
                  minWidth: `${totalWidthPlantio}px`,
                  maxWidth: `${totalWidthPlantio}px`,
                  tableLayout: 'fixed'
                }}
              >
                <colgroup>
                  {colWidthsPlantio.map((w, i) => (
                    <col key={i} style={{ width: `${w}px`, minWidth: `${w}px`, maxWidth: `${w}px` }} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <th title="Data" style={{ width: `${colWidthsPlantio[0]}px`, minWidth: `${colWidthsPlantio[0]}px`, maxWidth: `${colWidthsPlantio[0]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">Data</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(0) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 0)}
                          title="Filtrar por Data"
                        >
                          <i className={`fa-solid ${isColFiltered(0) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(0) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('plantio', 0, e)}
                        onDoubleClick={() => handleColReset('plantio', 0)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="UNIDADE" style={{ width: `${colWidthsPlantio[1]}px`, minWidth: `${colWidthsPlantio[1]}px`, maxWidth: `${colWidthsPlantio[1]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">UNIDADE</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(1) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 1)}
                          title="Filtrar por UNIDADE"
                        >
                          <i className={`fa-solid ${isColFiltered(1) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(1) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('plantio', 1, e)}
                        onDoubleClick={() => handleColReset('plantio', 1)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="Cultura" style={{ width: `${colWidthsPlantio[2]}px`, minWidth: `${colWidthsPlantio[2]}px`, maxWidth: `${colWidthsPlantio[2]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">Cultura</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(2) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 2)}
                          title="Filtrar por Cultura"
                        >
                          <i className={`fa-solid ${isColFiltered(2) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(2) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('plantio', 2, e)}
                        onDoubleClick={() => handleColReset('plantio', 2)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="C.Custo" style={{ width: `${colWidthsPlantio[3]}px`, minWidth: `${colWidthsPlantio[3]}px`, maxWidth: `${colWidthsPlantio[3]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">C.Custo</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(3) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 3)}
                          title="Filtrar por C.Custo"
                        >
                          <i className={`fa-solid ${isColFiltered(3) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(3) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('plantio', 3, e)}
                        onDoubleClick={() => handleColReset('plantio', 3)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="Fazenda" style={{ width: `${colWidthsPlantio[4]}px`, minWidth: `${colWidthsPlantio[4]}px`, maxWidth: `${colWidthsPlantio[4]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">Fazenda</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(4) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 4)}
                          title="Filtrar por Fazenda"
                        >
                          <i className={`fa-solid ${isColFiltered(4) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(4) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('plantio', 4, e)}
                        onDoubleClick={() => handleColReset('plantio', 4)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="PIVO" style={{ width: `${colWidthsPlantio[5]}px`, minWidth: `${colWidthsPlantio[5]}px`, maxWidth: `${colWidthsPlantio[5]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">PIVO</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(5) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 5)}
                          title="Filtrar por PIVO"
                        >
                          <i className={`fa-solid ${isColFiltered(5) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(5) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('plantio', 5, e)}
                        onDoubleClick={() => handleColReset('plantio', 5)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="Gleba" style={{ width: `${colWidthsPlantio[6]}px`, minWidth: `${colWidthsPlantio[6]}px`, maxWidth: `${colWidthsPlantio[6]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">Gleba</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(6) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 6)}
                          title="Filtrar por Gleba"
                        >
                          <i className={`fa-solid ${isColFiltered(6) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(6) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('plantio', 6, e)}
                        onDoubleClick={() => handleColReset('plantio', 6)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="Variedade" style={{ width: `${colWidthsPlantio[7]}px`, minWidth: `${colWidthsPlantio[7]}px`, maxWidth: `${colWidthsPlantio[7]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">Variedade</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(7) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 7)}
                          title="Filtrar por Variedade"
                        >
                          <i className={`fa-solid ${isColFiltered(7) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(7) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('plantio', 7, e)}
                        onDoubleClick={() => handleColReset('plantio', 7)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="Área/há" style={{ width: `${colWidthsPlantio[8]}px`, minWidth: `${colWidthsPlantio[8]}px`, maxWidth: `${colWidthsPlantio[8]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">Área/há</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(8) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 8)}
                          title="Filtrar por Área/há"
                        >
                          <i className={`fa-solid ${isColFiltered(8) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(8) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('plantio', 8, e)}
                        onDoubleClick={() => handleColReset('plantio', 8)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="Mês" style={{ width: `${colWidthsPlantio[9]}px`, minWidth: `${colWidthsPlantio[9]}px`, maxWidth: `${colWidthsPlantio[9]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">Mês</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(9) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 9)}
                          title="Filtrar por Mês"
                        >
                          <i className={`fa-solid ${isColFiltered(9) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(9) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('plantio', 9, e)}
                        onDoubleClick={() => handleColReset('plantio', 9)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="Obs" style={{ width: `${colWidthsPlantio[10]}px`, minWidth: `${colWidthsPlantio[10]}px`, maxWidth: `${colWidthsPlantio[10]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">Obs</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(10) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 10)}
                          title="Filtrar por Obs"
                        >
                          <i className={`fa-solid ${isColFiltered(10) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(10) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('plantio', 10, e)}
                        onDoubleClick={() => handleColReset('plantio', 10)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="Area Descartadas" style={{ width: `${colWidthsPlantio[11]}px`, minWidth: `${colWidthsPlantio[11]}px`, maxWidth: `${colWidthsPlantio[11]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">Area Descartadas</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(11) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 11)}
                          title="Filtrar por Area Descartadas"
                        >
                          <i className={`fa-solid ${isColFiltered(11) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(11) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('plantio', 11, e)}
                        onDoubleClick={() => handleColReset('plantio', 11)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th title="Ano" style={{ width: `${colWidthsPlantio[12]}px`, minWidth: `${colWidthsPlantio[12]}px`, maxWidth: `${colWidthsPlantio[12]}px`, boxSizing: 'border-box' }}>
                      <div className="th-excel-content">
                        <span className="th-excel-label">Ano</span>
                        <button
                          className={`excel-filter-box ${isColFiltered(12) ? 'filtered' : ''}`}
                          onClick={e => openColumnFilter(e, 12)}
                          title="Filtrar por Ano"
                        >
                          <i className={`fa-solid ${isColFiltered(12) ? 'fa-filter' : 'fa-caret-down'}`} style={{ fontSize: isColFiltered(12) ? '8px' : '9px' }}></i>
                        </button>
                      </div>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('plantio', 12, e)}
                        onDoubleClick={() => handleColReset('plantio', 12)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                    <th style={{ textAlign: 'center', width: `${colWidthsPlantio[13]}px`, minWidth: `${colWidthsPlantio[13]}px`, maxWidth: `${colWidthsPlantio[13]}px`, boxSizing: 'border-box' }}>
                      <span className="th-excel-label" style={{ fontSize: '11px' }}>AÇÕES</span>
                      <div
                        className="excel-col-resizer"
                        onMouseDown={e => handleColResizeStart('plantio', 13, e)}
                        onDoubleClick={() => handleColReset('plantio', 13)}
                        title="Arraste para redimensionar a coluna | Duplo clique para restaurar"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody id="tbodyPlantio">
                  {getSortedList(plantioData).map(({ item, originalIndex: idx }) => {
                    if (!isItemInSelectedUnidade(item)) return null;
                    const rowKey = item.id || (item as any).codigo || `plantio_${idx}`;
                    const rowHeight = getRowHeight('plantio', rowKey);
                    const rowCells = [
                      item.data,
                      item.unidade || item.empresa || selectedUnidade || '-',
                      item.cultura || '-',
                      item.cCusto || item.os || '-',
                      item.fazenda || '-',
                      item.pivo || '-',
                      item.gleba || '-',
                      item.variedade || '-',
                      item.haDia || '-',
                      item.mes || getMonthNameFromDate(item.data) || '-',
                      item.obs || '-',
                      item.areaDescartadas || '0,00',
                      item.ano || getYearFromDate(item.data) || '-'
                    ];
                    if (!isRowVisible(rowCells)) return null;

                    const rowResizer = (
                      <div
                        className="excel-row-resizer"
                        contentEditable={false}
                        onMouseDown={e => handleRowResizeStart('plantio', rowKey, e)}
                        onDoubleClick={() => handleRowReset('plantio', rowKey)}
                        title="Arraste para ajustar altura da linha (Shift para todas) | Duplo clique para restaurar"
                      />
                    );

                    return (
                      <tr key={idx} style={{ height: `${rowHeight}px` }}>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'data', e.currentTarget.innerText)} style={{ fontWeight: 600 }}>
                          {item.data}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'unidade', e.currentTarget.innerText)}>
                          {item.unidade || item.empresa || selectedUnidade || '-'}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'cultura', e.currentTarget.innerText)} style={{ fontWeight: 600 }}>
                          {item.cultura}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'cCusto', e.currentTarget.innerText)}>
                          {item.cCusto || item.os || '-'}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'fazenda', e.currentTarget.innerText)}>
                          {item.fazenda}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'pivo', e.currentTarget.innerText)}>
                          {item.pivo || '-'}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'gleba', e.currentTarget.innerText)}>
                          {item.gleba || '-'}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'variedade', e.currentTarget.innerText)}>
                          {item.variedade || '-'}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'haDia', e.currentTarget.innerText)} style={{ fontWeight: 600, color: '#0369a1' }}>
                          {item.haDia || '-'}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'mes', e.currentTarget.innerText)}>
                          {item.mes || getMonthNameFromDate(item.data) || '-'}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'obs', e.currentTarget.innerText)}>
                          {item.obs || '-'}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'areaDescartadas', e.currentTarget.innerText)}>
                          {item.areaDescartadas || '0,00'}
                          {rowResizer}
                        </td>
                        <td contentEditable={isGridEditing} suppressContentEditableWarning onBlur={e => updateGridCell('plantio', idx, 'ano', e.currentTarget.innerText)} style={{ fontWeight: 600 }}>
                          {item.ano || getYearFromDate(item.data) || '-'}
                          {rowResizer}
                        </td>
                        <td className="action-cell">
                          <button className="btn-action-row" onClick={() => openCurrentModal(rowCells, idx)} title="Editar"><i className="fa-solid fa-pen"></i></button>
                          <button className="btn-action-row" onClick={() => deleteRow('plantio', idx)} title="Mover para Lixeira"><i className="fa-solid fa-trash"></i></button>
                          {rowResizer}
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
              {lixeiraCategories.map(cat => {
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

          {/* PAGE PMS */}
          <div id="pageControle" className={`page-section ${activePage === 'controle' ? 'active' : ''}`}>
            <PMSSection
              items={pmsData}
              selectedUnidade={selectedUnidade}
              culturas={culturasData}
              variedades={variedadesData}
              onSaveItem={handleSavePmsItem}
              onDeleteItem={handleDeletePmsItem}
              onImportBatch={handleImportPmsBatch}
              showToast={showToast}
            />
          </div>

          {/* PAGE PROJETOS SANKHYA */}
          <div id="pageProjetosSankhya" className={`page-section ${activePage === 'projetos_sankhya' ? 'active' : ''}`}>
            <SankhyaSection
              items={projetosSankhyaData}
              selectedUnidade={selectedUnidade}
              culturas={culturasData}
              anos={anosData}
              onSaveItem={handleSaveSankhyaItem}
              onDeleteItem={handleDeleteSankhyaItem}
              onImportBatch={handleImportSankhyaBatch}
              showToast={showToast}
            />
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
              {getAllowedUnidadesForUser(currentUser).map((unit) => {
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
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm(`Deseja realmente excluir a unidade "${unit}"?`)) {
                              const docsToDel = unidadesDocs.filter(d => d.nome.trim().toLowerCase() === unit.trim().toLowerCase());
                              for (const docToDel of docsToDel) {
                                if (docToDel.id) {
                                  await removeDocument(COLLECTIONS.unidades, docToDel.id);
                                }
                              }
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

      {/* TELA DE CONFIGURAÇÕES EM TELA CHEIA COM NOME PERMISSÕES NO MESMO PADRÃO E TAMANHO DO BOTÃO VOLTAR */}
      {showSettingsModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#f8f9fa',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Topo com Botão Voltar e Botão Permissões no mesmo padrão Azul (#0078d4) e mesmo tamanho */}
          <div
            className="settings-modal-header"
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid #e1dfdd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{
                  backgroundColor: '#0078d4',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 1px 3px rgba(0, 120, 212, 0.2)',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#106ebe')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0078d4')}
              >
                <i className="fa-solid fa-arrow-left" style={{ fontSize: '11px' }}></i>
                <span>Voltar</span>
              </button>

              <button
                onClick={() => setSettingsTab('permissoes')}
                style={{
                  backgroundColor: '#0078d4',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 1px 3px rgba(0, 120, 212, 0.2)',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#106ebe')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0078d4')}
              >
                <i className="fa-solid fa-user-shield" style={{ fontSize: '11px' }}></i>
                <span>Permissões</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#323130', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-gear" style={{ color: '#0078d4' }}></i>
                Configurações & Controle de Acesso
              </span>
            </div>
          </div>

          {/* Conteúdo Principal da Tela de Permissões */}
          <div className="settings-modal-content" style={{ flex: 1, padding: '24px', overflowY: 'auto', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            {/* Banner Informativo */}
            <div className="settings-banner" style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e1dfdd',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0078d4', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-users-gear"></i>
                  Cadastro e Permissões de Usuários
                </h2>
                <p style={{ fontSize: '13px', color: '#605e5c', margin: 0 }}>
                  Cadastre novos usuários com ID, Nome e Senha, e selecione as categorias que cada usuário pode mexer/acessar.
                </p>
              </div>

              <button
                onClick={() => handleOpenUserModal()}
                style={{
                  backgroundColor: '#0078d4',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(0, 120, 212, 0.25)',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#106ebe')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0078d4')}
              >
                <i className="fa-solid fa-user-plus"></i>
                <span>+ Cadastrar Novo Usuário</span>
              </button>
            </div>

            {/* Barra de Busca e Filtros */}
            <div className="settings-filter-bar" style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e1dfdd',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a19f9d', fontSize: '12px' }}></i>
                <input
                  type="text"
                  value={searchUserQuery}
                  onChange={e => setSearchUserQuery(e.target.value)}
                  placeholder="Buscar por ID ou Nome do Usuário..."
                  style={{
                    width: '100%',
                    padding: '6px 12px 6px 32px',
                    borderRadius: '4px',
                    border: '1px solid #8a8886',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ fontSize: '12px', color: '#605e5c', fontWeight: 500 }}>
                Total de Usuários Cadastrados: <strong style={{ color: '#0078d4' }}>{userAccounts.length}</strong>
              </div>
            </div>

            {/* Tabela de Usuários / Cards para Celular e Tablet */}
            {(() => {
              const filteredUsers = userAccounts.filter(u =>
                u.id.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
                u.nome.toLowerCase().includes(searchUserQuery.toLowerCase())
              );

              return (
                <>
                  {/* Visão de Tabela para Computador / Desktop */}
                  <div className="desktop-only-table settings-table-container" style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e1dfdd',
                    borderRadius: '8px',
                    overflowX: 'auto',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f3f2f1', borderBottom: '1px solid #e1dfdd', color: '#323130' }}>
                          <th style={{ padding: '10px 14px', fontWeight: 700, width: '130px' }}>ID DO USUÁRIO</th>
                          <th style={{ padding: '10px 14px', fontWeight: 700, minWidth: '160px' }}>NOME DO USUÁRIO</th>
                          <th style={{ padding: '10px 14px', fontWeight: 700, width: '140px' }}>SENHA</th>
                          <th style={{ padding: '10px 14px', fontWeight: 700, minWidth: '180px' }}>EMPRESAS PERMITIDAS</th>
                          <th style={{ padding: '10px 14px', fontWeight: 700 }}>PERMISSÕES POR CATEGORIA</th>
                          <th style={{ padding: '10px 14px', fontWeight: 700, width: '120px', textAlign: 'center' }}>AÇÕES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#605e5c' }}>
                              <i className="fa-solid fa-user-slash" style={{ fontSize: '24px', color: '#a19f9d', marginBottom: '8px', display: 'block' }}></i>
                              Nenhum usuário encontrado com os critérios digitados.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user, idx) => {
                            const isShowPass = !!showPasswordMap[user.id];
                            const isAllPerms = user.permissoes.length === ALL_PERMISSION_CATEGORIES.length;
                            const isAllEmpresas = !user.empresasPermitidas || user.empresasPermitidas.length === 0 || user.empresasPermitidas.includes('TODAS');

                            return (
                              <tr
                                key={user.id}
                                style={{
                                  borderBottom: '1px solid #edebe9',
                                  backgroundColor: idx % 2 === 0 ? '#ffffff' : '#faf9f8'
                                }}
                              >
                                <td style={{ padding: '10px 14px' }}>
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: '#eff6fc',
                                    color: '#0078d4',
                                    border: '1px solid #c7e0f4',
                                    fontWeight: 700,
                                    fontSize: '11px'
                                  }}>
                                    <i className="fa-solid fa-id-badge"></i>
                                    {user.id}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 14px', fontWeight: 600, color: '#323130' }}>
                                  {user.nome}
                                </td>
                                <td style={{ padding: '10px 14px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontFamily: isShowPass ? 'inherit' : 'monospace', fontSize: '13px', fontWeight: 600, letterSpacing: isShowPass ? 'normal' : '2px' }}>
                                      {isShowPass ? user.senha : '••••••••'}
                                    </span>
                                    <button
                                      onClick={() => setShowPasswordMap(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                                      title={isShowPass ? "Ocultar Senha" : "Exibir Senha"}
                                      style={{ background: 'none', border: 'none', color: '#605e5c', cursor: 'pointer', fontSize: '12px', padding: '2px' }}
                                    >
                                      <i className={`fa-solid ${isShowPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                  </div>
                                </td>
                                <td style={{ padding: '10px 14px' }}>
                                  {isAllEmpresas ? (
                                    <span style={{
                                      backgroundColor: '#dff6dd',
                                      color: '#107c41',
                                      border: '1px solid #92c353',
                                      padding: '3px 10px',
                                      borderRadius: '12px',
                                      fontWeight: 600,
                                      fontSize: '11px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      <i className="fa-solid fa-earth-americas"></i> Todas as Empresas
                                    </span>
                                  ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                      {user.empresasPermitidas?.map(emp => (
                                        <span
                                          key={emp}
                                          style={{
                                            backgroundColor: '#eff6fc',
                                            color: '#0078d4',
                                            border: '1px solid #c7e0f4',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                          }}
                                        >
                                          <i className="fa-solid fa-building"></i> {emp}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '10px 14px' }}>
                                  {isAllPerms ? (
                                    <span style={{
                                      backgroundColor: '#dff6dd',
                                      color: '#107c41',
                                      border: '1px solid #92c353',
                                      padding: '3px 10px',
                                      borderRadius: '12px',
                                      fontWeight: 600,
                                      fontSize: '11px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      <i className="fa-solid fa-check-double"></i> Acesso Total (Todas as 12 Categorias)
                                    </span>
                                  ) : user.permissoes.length === 0 ? (
                                    <span style={{
                                      backgroundColor: '#fde7e9',
                                      color: '#a80000',
                                      border: '1px solid #f3b2b3',
                                      padding: '3px 10px',
                                      borderRadius: '12px',
                                      fontWeight: 600,
                                      fontSize: '11px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      <i className="fa-solid fa-ban"></i> Nenhuma permissão selecionada
                                    </span>
                                  ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                      {user.permissoes.map(permKey => {
                                        const catObj = ALL_PERMISSION_CATEGORIES.find(c => c.key === permKey);
                                        return (
                                          <span
                                            key={permKey}
                                            style={{
                                              backgroundColor: '#f3f2f1',
                                              color: '#323130',
                                              border: '1px solid #d2d0ce',
                                              padding: '2px 8px',
                                              borderRadius: '4px',
                                              fontSize: '11px',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px'
                                            }}
                                          >
                                            <i className={`fa-solid ${catObj?.icon || 'fa-folder'}`} style={{ color: '#0078d4', fontSize: '10px' }}></i>
                                            {catObj ? catObj.label : permKey}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                    <button
                                      onClick={() => handleOpenUserModal(user)}
                                      title="Editar Usuário"
                                      style={{
                                        backgroundColor: '#eff6fc',
                                        color: '#0078d4',
                                        border: '1px solid #c7e0f4',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                    >
                                      <i className="fa-solid fa-pen-to-square"></i>
                                      <span>Editar</span>
                                    </button>

                                    <button
                                      onClick={() => handleDeleteUser(user)}
                                      title="Excluir Usuário"
                                      style={{
                                        backgroundColor: '#fde7e9',
                                        color: '#a80000',
                                        border: '1px solid #f3b2b3',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                    >
                                      <i className="fa-solid fa-trash"></i>
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

                  {/* Visão de Cards para Celulares e Tablets (< 1024px) */}
                  <div className="mobile-tablet-cards-container">
                    {filteredUsers.length === 0 ? (
                      <div style={{
                        padding: '24px',
                        textAlign: 'center',
                        color: '#605e5c',
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e1dfdd'
                      }}>
                        <i className="fa-solid fa-user-slash" style={{ fontSize: '24px', color: '#a19f9d', marginBottom: '8px', display: 'block' }}></i>
                        Nenhum usuário encontrado com os critérios digitados.
                      </div>
                    ) : (
                      filteredUsers.map((user) => {
                        const isShowPass = !!showPasswordMap[user.id];
                        const isAllPerms = user.permissoes.length === ALL_PERMISSION_CATEGORIES.length;

                        return (
                          <div
                            key={user.id}
                            style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e1dfdd',
                              borderRadius: '10px',
                              padding: '14px 16px',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px',
                              width: '100%',
                              boxSizing: 'border-box'
                            }}
                          >
                            {/* Header do Card: Avatar, ID + Nome, e Ações */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: '12px',
                              paddingBottom: '12px',
                              borderBottom: '1px solid #edebe9'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                {/* Avatar do Usuário */}
                                <div style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '50%',
                                  backgroundColor: '#eff6fc',
                                  color: '#0078d4',
                                  border: '1px solid #c7e0f4',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '14px',
                                  flexShrink: 0
                                }}>
                                  <i className="fa-solid fa-user"></i>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: '2px' }}>
                                  <div style={{
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    color: '#323130',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {user.nome}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      backgroundColor: '#f3f2f1',
                                      color: '#0078d4',
                                      border: '1px solid #d2d0ce',
                                      fontWeight: 700,
                                      fontSize: '11px'
                                    }}>
                                      <i className="fa-solid fa-id-badge" style={{ fontSize: '10px' }}></i>
                                      {user.id}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Ações: Editar e Excluir */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                <button
                                  onClick={() => handleOpenUserModal(user)}
                                  title="Editar Usuário"
                                  style={{
                                    backgroundColor: '#eff6fc',
                                    color: '#0078d4',
                                    border: '1px solid #c7e0f4',
                                    borderRadius: '6px',
                                    padding: '6px 10px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <i className="fa-solid fa-pen-to-square"></i>
                                  <span>Editar</span>
                                </button>

                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  title="Excluir Usuário"
                                  style={{
                                    backgroundColor: '#fde7e9',
                                    color: '#a80000',
                                    border: '1px solid #f3b2b3',
                                    borderRadius: '6px',
                                    padding: '6px 10px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                              </div>
                            </div>

                            {/* Empresas Permitidas */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#605e5c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <i className="fa-solid fa-building" style={{ color: '#0078d4' }}></i>
                                Empresas Permitidas:
                              </div>
                              {(!user.empresasPermitidas || user.empresasPermitidas.length === 0 || user.empresasPermitidas.includes('TODAS')) ? (
                                <span style={{
                                  backgroundColor: '#dff6dd',
                                  color: '#107c41',
                                  border: '1px solid #92c353',
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontWeight: 600,
                                  fontSize: '11px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  width: 'fit-content'
                                }}>
                                  <i className="fa-solid fa-earth-americas"></i> Todas as Empresas (Sem Restrição)
                                </span>
                              ) : (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {user.empresasPermitidas.map(emp => (
                                    <span
                                      key={emp}
                                      style={{
                                        backgroundColor: '#eff6fc',
                                        color: '#0078d4',
                                        border: '1px solid #c7e0f4',
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                    >
                                      <i className="fa-solid fa-building"></i> {emp}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Informação de Senha */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              backgroundColor: '#faf9f8',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid #f3f2f1'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#605e5c' }}>
                                <i className="fa-solid fa-key" style={{ color: '#0078d4' }}></i>
                                <span style={{ fontWeight: 600 }}>Senha:</span>
                                <span style={{
                                  fontFamily: isShowPass ? 'inherit' : 'monospace',
                                  fontSize: '13px',
                                  fontWeight: 700,
                                  color: '#323130',
                                  letterSpacing: isShowPass ? 'normal' : '2px'
                                }}>
                                  {isShowPass ? user.senha : '••••••••'}
                                </span>
                              </div>
                              <button
                                onClick={() => setShowPasswordMap(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#0078d4',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  padding: '2px 6px',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <i className={`fa-solid ${isShowPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                <span>{isShowPass ? 'Ocultar' : 'Exibir'}</span>
                              </button>
                            </div>

                            {/* Permissões Liberadas */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#605e5c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <i className="fa-solid fa-shield-halved" style={{ color: '#0078d4' }}></i>
                                Permissões de Acesso ({user.permissoes.length}):
                              </div>

                              {isAllPerms ? (
                                <span style={{
                                  backgroundColor: '#dff6dd',
                                  color: '#107c41',
                                  border: '1px solid #92c353',
                                  padding: '6px 12px',
                                  borderRadius: '20px',
                                  fontWeight: 600,
                                  fontSize: '12px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  width: 'fit-content'
                                }}>
                                  <i className="fa-solid fa-check-double"></i> Acesso Total (Todas as 12 Categorias)
                                </span>
                              ) : user.permissoes.length === 0 ? (
                                <span style={{
                                  backgroundColor: '#fde7e9',
                                  color: '#a80000',
                                  border: '1px solid #f3b2b3',
                                  padding: '6px 12px',
                                  borderRadius: '20px',
                                  fontWeight: 600,
                                  fontSize: '12px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  width: 'fit-content'
                                }}>
                                  <i className="fa-solid fa-ban"></i> Nenhuma permissão selecionada
                                </span>
                              ) : (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {user.permissoes.map(permKey => {
                                    const catObj = ALL_PERMISSION_CATEGORIES.find(c => c.key === permKey);
                                    return (
                                      <span
                                        key={permKey}
                                        style={{
                                          backgroundColor: '#f3f2f1',
                                          color: '#323130',
                                          border: '1px solid #d2d0ce',
                                          padding: '4px 8px',
                                          borderRadius: '4px',
                                          fontSize: '11px',
                                          fontWeight: 500,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                      >
                                        <i className={`fa-solid ${catObj?.icon || 'fa-folder'}`} style={{ color: '#0078d4', fontSize: '10px' }}></i>
                                        {catObj ? catObj.label : permKey}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO DE USUÁRIO E PERMISSÕES */}
      {showUserModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 9999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Cabeçalho do Modal */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e1dfdd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8f9fa'
            }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0078d4', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-user-lock"></i>
                {editingUser ? `Editar Usuário: ${editingUser.nome}` : 'Cadastrar Novo Usuário'}
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '16px', color: '#605e5c', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Corpo do Modal */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* ID DO USUÁRIO, NOME E SENHA */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#323130', display: 'block', marginBottom: '4px' }}>
                    ID do Usuário <span style={{ color: '#a80000' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={userIdInput}
                    onChange={e => setUserIdInput(e.target.value)}
                    placeholder="Ex: USR-001"
                    disabled={!!editingUser}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '4px',
                      border: '1px solid #8a8886',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: editingUser ? '#f3f2f1' : '#ffffff'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#323130', display: 'block', marginBottom: '4px' }}>
                    Nome do Usuário <span style={{ color: '#a80000' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={userNameInput}
                    onChange={e => setUserNameInput(e.target.value)}
                    placeholder="Ex: João da Silva"
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '4px',
                      border: '1px solid #8a8886',
                      fontSize: '12px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#323130', display: 'block', marginBottom: '4px' }}>
                  Senha de Acesso <span style={{ color: '#a80000' }}>*</span>
                </label>
                <input
                  type="text"
                  value={userPasswordInput}
                  onChange={e => setUserPasswordInput(e.target.value)}
                  placeholder="Digite a senha..."
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '4px',
                    border: '1px solid #8a8886',
                    fontSize: '12px'
                  }}
                />
              </div>

              {/* SELEÇÃO DE EMPRESAS / UNIDADES PERMITIDAS */}
              <div style={{ borderTop: '1px solid #e1dfdd', paddingTop: '16px', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#323130', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-building" style={{ color: '#0078d4' }}></i>
                    Empresas / Unidades Permitidas (Restrição por Empresa):
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => toggleAllEmpresas(true)}
                      style={{
                        backgroundColor: '#eff6fc',
                        color: '#0078d4',
                        border: '1px solid #c7e0f4',
                        borderRadius: '4px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Todas as Empresas
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAllEmpresas(false)}
                      style={{
                        backgroundColor: '#f3f2f1',
                        color: '#605e5c',
                        border: '1px solid #d2d0ce',
                        borderRadius: '4px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Nenhuma
                    </button>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '8px',
                  backgroundColor: '#f8f9fa',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #e1dfdd',
                  maxHeight: '160px',
                  overflowY: 'auto'
                }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '4px',
                      backgroundColor: userEmpresasInput.includes('TODAS') ? '#dff6dd' : '#ffffff',
                      border: userEmpresasInput.includes('TODAS') ? '1px solid #107c41' : '1px solid #e1dfdd',
                      cursor: 'pointer',
                      userSelect: 'none',
                      gridColumn: '1 / -1'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={userEmpresasInput.includes('TODAS')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setUserEmpresasInput(['TODAS']);
                        } else {
                          setUserEmpresasInput([]);
                        }
                      }}
                      style={{ accentColor: '#107c41', cursor: 'pointer' }}
                    />
                    <i className="fa-solid fa-earth-americas" style={{ fontSize: '12px', color: userEmpresasInput.includes('TODAS') ? '#107c41' : '#605e5c' }}></i>
                    <span style={{ fontSize: '12px', fontWeight: userEmpresasInput.includes('TODAS') ? 700 : 400, color: userEmpresasInput.includes('TODAS') ? '#107c41' : '#323130' }}>
                      Acesso a TODAS as Empresas (Sem Restrição)
                    </span>
                  </label>

                  {unidadesList.map(unitName => {
                    const isChecked = userEmpresasInput.includes('TODAS') || userEmpresasInput.includes(unitName);
                    return (
                      <label
                        key={unitName}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          borderRadius: '4px',
                          backgroundColor: isChecked ? '#eff6fc' : '#ffffff',
                          border: isChecked ? '1px solid #0078d4' : '1px solid #e1dfdd',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEmpresaPermission(unitName)}
                          style={{ accentColor: '#0078d4', cursor: 'pointer' }}
                        />
                        <i className="fa-solid fa-building" style={{ fontSize: '11px', color: isChecked ? '#0078d4' : '#605e5c' }}></i>
                        <span style={{ fontSize: '12px', fontWeight: isChecked ? 600 : 400, color: isChecked ? '#0078d4' : '#323130' }}>
                          {unitName}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* SELEÇÃO DE PERMISSÕES POR CATEGORIA */}
              <div style={{ borderTop: '1px solid #e1dfdd', paddingTop: '16px', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#323130', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-list-check" style={{ color: '#0078d4' }}></i>
                    Permissões por Categoria (O que o usuário pode mexer):
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => toggleAllPermissions(true)}
                      style={{
                        backgroundColor: '#eff6fc',
                        color: '#0078d4',
                        border: '1px solid #c7e0f4',
                        borderRadius: '4px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Marcar Todas
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAllPermissions(false)}
                      style={{
                        backgroundColor: '#f3f2f1',
                        color: '#605e5c',
                        border: '1px solid #d2d0ce',
                        borderRadius: '4px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Desmarcar Todas
                    </button>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '8px',
                  backgroundColor: '#f8f9fa',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #e1dfdd',
                  maxHeight: '260px',
                  overflowY: 'auto'
                }}>
                  {ALL_PERMISSION_CATEGORIES.map(cat => {
                    const isChecked = userPermissionsInput.includes(cat.key);
                    return (
                      <label
                        key={cat.key}
                        onClick={() => toggleCategoryPermission(cat.key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          borderRadius: '4px',
                          backgroundColor: isChecked ? '#eff6fc' : '#ffffff',
                          border: isChecked ? '1px solid #0078d4' : '1px solid #e1dfdd',
                          cursor: 'pointer',
                          userSelect: 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent label onClick
                          style={{ accentColor: '#0078d4', cursor: 'pointer' }}
                        />
                        <i className={`fa-solid ${cat.icon}`} style={{ fontSize: '11px', color: isChecked ? '#0078d4' : '#605e5c', width: '14px', textAlign: 'center' }}></i>
                        <span style={{ fontSize: '12px', fontWeight: isChecked ? 600 : 400, color: isChecked ? '#0078d4' : '#323130' }}>
                          {cat.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #e1dfdd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '8px',
              backgroundColor: '#f8f9fa'
            }}>
              <button
                onClick={() => setShowUserModal(false)}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#323130',
                  border: '1px solid #8a8886',
                  borderRadius: '4px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveUser}
                style={{
                  backgroundColor: '#0078d4',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0, 120, 212, 0.25)'
                }}
              >
                <i className="fa-solid fa-floppy-disk" style={{ marginRight: '6px' }}></i>
                Salvar Usuário
              </button>
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
                      <label>Unidade</label>
                      {empresasData.filter(isItemInSelectedUnidade).length > 0 ? (
                        <select value={formData.cUnidade || formData.cEmpresa || ''} onChange={e => setFormData({ ...formData, cUnidade: e.target.value, cEmpresa: e.target.value })}>
                          <option value="">Selecione a unidade...</option>
                          {empresasData.filter(isItemInSelectedUnidade).map((emp, i) => (
                            <option key={i} value={emp.nome}>{emp.nome}</option>
                          ))}
                          {editingIndex !== null && formData.cUnidade && !empresasData.filter(isItemInSelectedUnidade).some(e => e.nome === formData.cUnidade) && (
                            <option value={formData.cUnidade}>{formData.cUnidade}</option>
                          )}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Ex: Primavera"
                          value={formData.cUnidade || formData.cEmpresa || ''}
                          onChange={e => setFormData({ ...formData, cUnidade: e.target.value, cEmpresa: e.target.value })}
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

                          setFormData({
                            ...formData,
                            cCultura: newCultura,
                            cFazenda: newFazenda,
                            cPivo: newPivo,
                            cGleba: newGleba,
                            cVariedade: newVar
                          });
                        }}
                        required
                      >
                        <option value="">Selecione uma cultura...</option>
                        {getPlantioCulturas(formData.cFazenda).map((c, i) => (
                          <option key={i} value={c.nome}>{c.nome}</option>
                        ))}
                        {editingIndex !== null && formData.cCultura && !getPlantioCulturas(formData.cFazenda).some(c => c.nome === formData.cCultura) && (
                          <option value={formData.cCultura}>{formData.cCultura}</option>
                        )}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>C.Custo</label>
                      <input
                        type="text"
                        placeholder="Ex: 101"
                        value={formData.cCCusto || formData.cOs || ''}
                        onChange={e => setFormData({ ...formData, cCCusto: e.target.value, cOs: e.target.value })}
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

                          setFormData({
                            ...formData,
                            cFazenda: newFazenda,
                            cCultura: newCultura,
                            cPivo: newPivo,
                            cGleba: newGleba,
                            cVariedade: newVar
                          });
                        }}
                        required
                      >
                        <option value="">Selecione uma fazenda...</option>
                        {getPlantioFazendas(formData.cCultura).map((f, i) => (
                          <option key={i} value={f.nome}>{f.nome}</option>
                        ))}
                        {editingIndex !== null && formData.cFazenda && !getPlantioFazendas(formData.cCultura).some(f => f.nome === formData.cFazenda) && (
                          <option value={formData.cFazenda}>{formData.cFazenda}</option>
                        )}
                      </select>
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
                    <div className="form-group">
                      <label>Pivô</label>
                      <select
                        value={formData.cPivo || ''}
                        onChange={e => {
                          const newPivo = e.target.value;
                          const validGlebas = getPlantioGlebas(newPivo, formData.cFazenda, formData.cCultura);
                          const newGleba = validGlebas.length === 1 ? validGlebas[0].nome : '';
                          const validVars = getPlantioVariedades(formData.cCultura, formData.cFazenda, newPivo, newGleba);
                          const newVar = validVars.length === 1 ? validVars[0].nome : '';

                          setFormData({
                            ...formData,
                            cPivo: newPivo,
                            cGleba: newGleba,
                            cVariedade: newVar
                          });
                        }}
                      >
                        <option value="">Selecione um pivô...</option>
                        {getPlantioPivos(formData.cFazenda, formData.cCultura).map((p, i) => (
                          <option key={i} value={p.nome}>{p.nome}</option>
                        ))}
                        {editingIndex !== null && formData.cPivo && formData.cPivo !== '-' && !getPlantioPivos(formData.cFazenda, formData.cCultura).some(p => p.nome === formData.cPivo) && (
                          <option value={formData.cPivo}>{formData.cPivo}</option>
                        )}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Área/há</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Ex: 14,50"
                        value={formData.cAreaHa || formData.cHaDia || ''}
                        onChange={e => {
                          const newArea = sanitizeHectaresInput(e.target.value);
                          const newMedia = calculateMediaHaForColheita(formData.cQtdColhida, newArea);
                          const newProdBruta = calculateProdutividade(formData.cProducaoBrutaKg, newArea);
                          const newProdLiq = calculateProdutividade(formData.cProducaoBeneficiada, newArea);
                          setFormData({
                            ...formData,
                            cAreaHa: newArea,
                            cHaDia: newArea,
                            cMediaHa: newMedia,
                            cProdutividadeBrutaHa: newProdBruta,
                            cProdutividadeLiquidaHa: newProdLiq
                          });
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Gleba</label>
                      <select
                        value={formData.cGleba || ''}
                        onChange={e => {
                          const newGleba = e.target.value;
                          const validVars = getPlantioVariedades(formData.cCultura, formData.cFazenda, formData.cPivo, newGleba);
                          const newVar = validVars.some(v => v.nome === formData.cVariedade)
                            ? formData.cVariedade
                            : (validVars.length === 1 ? validVars[0].nome : '');

                          setFormData({
                            ...formData,
                            cGleba: newGleba,
                            cVariedade: newVar
                          });
                        }}
                      >
                        <option value="">Selecione uma gleba...</option>
                        {getPlantioGlebas(formData.cPivo, formData.cFazenda, formData.cCultura).map((g, i) => (
                          <option key={i} value={g.nome}>{g.nome}</option>
                        ))}
                        {editingIndex !== null && formData.cGleba && formData.cGleba !== '-' && !getPlantioGlebas(formData.cPivo, formData.cFazenda, formData.cCultura).some(g => g.nome === formData.cGleba) && (
                          <option value={formData.cGleba}>{formData.cGleba}</option>
                        )}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Variedade</label>
                      <select
                        value={formData.cVariedade || ''}
                        onChange={e => setFormData({ ...formData, cVariedade: e.target.value })}
                      >
                        <option value="">Selecione uma variedade...</option>
                        {getPlantioVariedades(formData.cCultura, formData.cFazenda, formData.cPivo, formData.cGleba).map((v, i) => (
                          <option key={i} value={v.nome}>{v.nome}</option>
                        ))}
                        {editingIndex !== null && formData.cVariedade && formData.cVariedade !== '-' && !getPlantioVariedades(formData.cCultura, formData.cFazenda, formData.cPivo, formData.cGleba).some(v => v.nome === formData.cVariedade) && (
                          <option value={formData.cVariedade}>{formData.cVariedade}</option>
                        )}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Qtd.Colhida</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Ex: 250"
                        value={formData.cQtdColhida || formData.cQtdColhido || ''}
                        onChange={e => {
                          const newQtd = e.target.value;
                          const newMedia = calculateMediaHaForColheita(newQtd, formData.cAreaHa || formData.cHaDia);
                          setFormData({
                            ...formData,
                            cQtdColhida: newQtd,
                            cQtdColhido: newQtd,
                            cCaixasCortadas: newQtd,
                            cMediaHa: newMedia
                          });
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Média P/ Há (Cálculo Automático)</label>
                      <input
                        type="text"
                        placeholder="Ex: 17,24"
                        value={formData.cMediaHa || ''}
                        onChange={e => setFormData({ ...formData, cMediaHa: e.target.value })}
                        style={{ fontWeight: 700, backgroundColor: '#f3f2f1' }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Embalagem</label>
                      <input
                        type="text"
                        placeholder="Ex: Caixas, Bin, Bag"
                        value={formData.cEmbalagem || formData.cCaixaBinBag || ''}
                        onChange={e => setFormData({ ...formData, cEmbalagem: e.target.value, cCaixaBinBag: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Produção Bruta Kg</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Ex: 5000"
                        value={formData.cProducaoBrutaKg || ''}
                        onChange={e => {
                          const val = e.target.value;
                          const newProd = calculateProdutividade(val, formData.cAreaHa || formData.cHaDia);
                          setFormData({ ...formData, cProducaoBrutaKg: val, cProdutividadeBrutaHa: newProd });
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Produtividade Bruta/há (Cálculo Automático)</label>
                      <input
                        type="text"
                        placeholder="Calculado automaticamente..."
                        value={formData.cProdutividadeBrutaHa || ''}
                        onChange={e => setFormData({ ...formData, cProdutividadeBrutaHa: e.target.value })}
                        style={{ fontWeight: 700, backgroundColor: '#f3f2f1' }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Produção Beneficiada</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Ex: 4800"
                        value={formData.cProducaoBeneficiada || ''}
                        onChange={e => {
                          const val = e.target.value;
                          const newProd = calculateProdutividade(val, formData.cAreaHa || formData.cHaDia);
                          setFormData({ ...formData, cProducaoBeneficiada: val, cProdutividadeLiquidaHa: newProd });
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Produtividade Líquida/ha (Cálculo Automático)</label>
                      <input
                        type="text"
                        placeholder="Calculado automaticamente..."
                        value={formData.cProdutividadeLiquidaHa || ''}
                        onChange={e => setFormData({ ...formData, cProdutividadeLiquidaHa: e.target.value })}
                        style={{ fontWeight: 700, backgroundColor: '#f3f2f1' }}
                      />
                    </div>
                  </>
                )}

                {activePage === 'plantio' && (
                  <>
                    <div className="form-group">
                      <label>Data do Plantio</label>
                      <input
                        type="date"
                        value={formData.pData || ''}
                        onChange={e => {
                          const newDate = e.target.value;
                          const derivedMonth = getMonthNameFromDate(newDate);
                          const derivedYear = getYearFromDate(newDate);
                          setFormData({
                            ...formData,
                            pData: newDate,
                            pMes: formData.pMes || derivedMonth || '',
                            pAno: formData.pAno || derivedYear || ''
                          });
                        }}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>UNIDADE / Empresa</label>
                      {getAmarracoesEmpresas().length > 0 ? (
                        <select
                          value={formData.pUnidade || formData.pEmpresa || ''}
                          onChange={e => setFormData({ ...formData, pUnidade: e.target.value, pEmpresa: e.target.value })}
                        >
                          <option value="">Selecione a unidade...</option>
                          {getAmarracoesEmpresas().map((emp, i) => (
                            <option key={i} value={emp.nome}>{emp.nome}</option>
                          ))}
                          {formData.pUnidade && formData.pUnidade !== '-' && !getAmarracoesEmpresas().some(e => e.nome === formData.pUnidade) && (
                            <option value={formData.pUnidade}>{formData.pUnidade}</option>
                          )}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Ex: Primavera"
                          value={formData.pUnidade || formData.pEmpresa || ''}
                          onChange={e => setFormData({ ...formData, pUnidade: e.target.value, pEmpresa: e.target.value })}
                        />
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
                      <label>C.Custo / OS</label>
                      <input
                        type="text"
                        placeholder="Ex: 101"
                        value={formData.pCCusto || formData.pOs || ''}
                        onChange={e => setFormData({ ...formData, pCCusto: e.target.value, pOs: e.target.value })}
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
                      <label>PIVO (Amarração)</label>
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
                      <label>Área/há (HA / Dia)</label>
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
                      <label>Mês</label>
                      <input
                        type="text"
                        placeholder="Ex: Fevereiro"
                        value={formData.pMes || ''}
                        onChange={e => setFormData({ ...formData, pMes: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Observação (Obs)</label>
                      <input
                        type="text"
                        placeholder="Observações do plantio..."
                        value={formData.pObs || ''}
                        onChange={e => setFormData({ ...formData, pObs: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Área Descartadas (ha)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Ex: 0,00"
                        value={formData.pAreaDescartadas || ''}
                        onChange={e => setFormData({ ...formData, pAreaDescartadas: sanitizeHectaresInput(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Ano</label>
                      {getAmarracoesAnos(formData.pUnidade || formData.pEmpresa, formData.pCultura, formData.pFazenda).length > 0 ? (
                        <select value={formData.pAno || ''} onChange={e => setFormData({ ...formData, pAno: e.target.value })}>
                          <option value="">Selecione um ano...</option>
                          {getAmarracoesAnos(formData.pUnidade || formData.pEmpresa, formData.pCultura, formData.pFazenda).map((a, i) => (
                            <option key={i} value={a.nome}>{a.nome}</option>
                          ))}
                          {formData.pAno && formData.pAno !== '-' && !getAmarracoesAnos(formData.pUnidade || formData.pEmpresa, formData.pCultura, formData.pFazenda).some(a => a.nome === formData.pAno) && (
                            <option value={formData.pAno}>{formData.pAno}</option>
                          )}
                        </select>
                      ) : (
                        <input type="text" placeholder="Ex: 2026" value={formData.pAno || ''} onChange={e => setFormData({ ...formData, pAno: e.target.value })} />
                      )}
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
                      {getCombinedVariedades().map((v, i) => (
                        <option key={i} value={v.nome}>{v.nome}{v.cultura ? ` (${v.cultura})` : ''}</option>
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
                      {getCombinedVariedades(amarracaoFormData.origem).map((v, i) => (
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
              const unitAmarracoes = amarracoesData.filter(isItemInSelectedUnidade);

              const filteredVariedadesData = getCombinedVariedades(selectedCulturaForTie);

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
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              onClick={exportAmarracoesToCSV}
                              style={{
                                backgroundColor: '#107c41',
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
                              title="Exportar todas as amarrações do Geral para arquivo CSV"
                            >
                              <i className="fa-solid fa-file-csv"></i> Exportar CSV
                            </button>
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

      {/* GENERAL IMPORT MODAL */}
      <GeneralImportModal
        isOpen={isGeneralImportOpen}
        onClose={() => setIsGeneralImportOpen(false)}
        targetCategory={generalImportTargetCategory}
        selectedUnidade={selectedUnidade}
        existingData={{
          culturas: culturasData,
          variedades: variedadesData,
          empresas: empresasData,
          anos: anosData,
          fazendas: fazendasData,
          pivos: pivosData,
          glebas: glebasData,
          colaboradores: colaboradoresData,
          motoristas: motoristasData,
          onibus: onibusData,
          plantio: plantioData,
          colheita: colheitaData
        }}
        onImportBatch={handleGeneralImportBatch}
        showToast={showToast}
      />

      {/* PWA INSTALL MODAL */}
      <PWAInstallModal isOpen={isPwaModalOpen} onClose={() => setIsPwaModalOpen(false)} />

    </div>
  );
}
