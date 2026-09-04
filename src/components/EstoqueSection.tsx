import React, { useState, useMemo, useEffect } from 'react';
import {
  matchSankhyaProjectForTie,
  isCulturaHortifruti,
  matchAno,
  matchFazenda,
  matchCultura,
  matchPivo
} from '../lib/sankhyaMatcher';

// Interfaces exported for compatibility with App.tsx
export interface EstoqueItem {
  id?: string;
  codigo?: string;
  cultura: string;
  variedade: string;
  classificacao?: string;
  tipoEmbalagem: string;
  pesoUnitarioKg?: number;
  localArmazenamento: string;
  quantidade: number;
  pesoTotalKg: number;
  estoqueMinimo?: number;
  loteSafra?: string;
  fazendaOrigem?: string;
  unidade: string;
  status: 'Disponível' | 'Reservado' | 'Esgotado' | 'Quarentena';
  updatedAt: string;
}

export interface RomaneioItem {
  id?: string;
  numeroRomaneio: string;
  tipoRomaneio: string;
  dataEmissao: string;
  horaEmissao: string;
  status: string;
  remetenteNome: string;
  remetenteFazendaLocal: string;
  destinatarioNome: string;
  destinatarioCidadeUf: string;
  motoristaNome: string;
  placaVeiculo?: string;
  veiculoPlaca?: string;
  pesoLiquidoKg: number;
  unidade: string;
  itens?: any[];
  [key: string]: any;
}

export interface SaldoItem {
  controleCod: string;
  fazendaNome: string;
  culturaNome: string;
  pivoNome: string;
  glebaNome: string;
  variedadeNome: string;
  produtoNome: string;
  localNome: string;
  caixas: number;
  contentores: number;
  sacos: number;
}

export interface EstoqueMovimentacao {
  id: string;
  tipo: string;
  estoqueId?: string;
  produtoNome: string;
  quantidade: number;
  tipoEmbalagem: string;
  pesoKg: number;
  documentoRef?: string;
  dataHora: string;
  responsavel: string;
  motivo?: string;
  unidade: string;
}

export interface EstoqueSectionProps {
  items?: EstoqueItem[];
  romaneios?: RomaneioItem[];
  movimentacoes?: EstoqueMovimentacao[];
  selectedUnidade?: string;
  culturas?: any[];
  variedades?: any[];
  fazendas?: any[];
  pivos?: any[];
  glebas?: any[];
  colheitaData?: any[];
  plantioData?: any[];
  projetosSankhya?: any[];
  amarracoes?: any[];
  motoristas?: any[];
  onSaveEstoqueItem?: (item: EstoqueItem) => void;
  onDeleteEstoqueItem?: (id: string) => void;
  onSaveRomaneio?: (romaneio: RomaneioItem, baixarEstoque: boolean) => void;
  onDeleteRomaneio?: (id: string) => void;
  onSaveMovimentacao?: (mov: EstoqueMovimentacao) => void;
  onSaveAmarracao?: (item: any, id?: string) => Promise<void> | void;
  onDeleteAmarracao?: (id: string) => Promise<void> | void;
  showToast?: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

interface Movimento {
  id: number;
  data: string;
  controleCod: string;
  fazendaNome: string;
  culturaNome: string;
  pivoNome: string;
  glebaNome: string;
  variedadeNome: string;
  produtoNome: string;
  localNome: string;
  embalagem: string;
  qtd: number;
  origemColheitaId?: string;
}

const DEFAULT_ENTRADAS: Movimento[] = [
  { id: 101, data: '2026-09-01', controleCod: 'CTR-2025/26-01', fazendaNome: 'Fazenda Cristalina', culturaNome: 'Cenoura', pivoNome: 'Pivô 01', glebaNome: 'Gleba 01', variedadeNome: 'Híbrida Juliana', produtoNome: 'Especial Calibre 2', localNome: 'Câmara Fria 01', embalagem: 'Caixa', qtd: 450 },
  { id: 102, data: '2026-09-02', controleCod: 'CTR-2025/26-01', fazendaNome: 'Fazenda Cristalina', culturaNome: 'Cenoura', pivoNome: 'Pivô 01', glebaNome: 'Gleba 02', variedadeNome: 'Híbrida Juliana', produtoNome: 'Padrão Calibre 1', localNome: 'Galpão Packing House', embalagem: 'Caixa', qtd: 320 },
  { id: 103, data: '2026-09-02', controleCod: 'CTR-2025/26-01', fazendaNome: 'Fazenda Cristalina', culturaNome: 'Cenoura', pivoNome: 'Pivô 01', glebaNome: 'Gleba 01', variedadeNome: 'Brasília', produtoNome: 'Descarte / Indústria', localNome: 'Galpão Packing House', embalagem: 'Contentor', qtd: 28 },
  { id: 104, data: '2026-09-03', controleCod: 'CTR-2025/26-02', fazendaNome: 'Fazenda Boa Vista', culturaNome: 'Cebola', pivoNome: 'Pivô 03', glebaNome: 'Gleba 04', variedadeNome: 'Baia Periforme', produtoNome: 'Caixa 3', localNome: 'Galpão 03 Ventilado', embalagem: 'Saco', qtd: 600 }
];

const DEFAULT_SAIDAS: Movimento[] = [
  { id: 201, data: '2026-09-03', controleCod: 'CTR-2025/26-01', fazendaNome: 'Fazenda Cristalina', culturaNome: 'Cenoura', pivoNome: 'Pivô 01', glebaNome: 'Gleba 01', variedadeNome: 'Híbrida Juliana', produtoNome: 'Especial Calibre 2', localNome: 'Câmara Fria 01', embalagem: 'Caixa', qtd: 120 }
];

// Locais padrão de armazenagem
const LOCAIS_ARMAZENAMENTO_PADRAO = [
  'Câmara Fria 01',
  'Câmara Fria 02',
  'Galpão Packing House',
  'Galpão 03 Ventilado',
  'Silo 01',
  'Silo 02',
  'Tenda de Classificação'
];

export const EstoqueSection: React.FC<EstoqueSectionProps> = ({
  culturas = [],
  variedades = [],
  fazendas = [],
  pivos = [],
  glebas = [],
  colheitaData = [],
  plantioData = [],
  projetosSankhya = [],
  amarracoes = [],
  onSaveAmarracao,
  onDeleteAmarracao,
  showToast
}) => {
  // Navigation State
  const [paginaAtiva, setPaginaAtiva] = useState<'inicial' | 'entrada' | 'saida' | 'amarracoes'>('inicial');

  // Amarrações do Estoque State (combina as cadastradas no Firestore com locais)
  const [amarracoesLocais, setAmarracoesLocais] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('estoque_amarracoes_locais');
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return [];
  });

  const todasAmarracoes = useMemo(() => {
    const list: any[] = [...(amarracoes || [])];
    amarracoesLocais.forEach(loc => {
      if (!list.some(item => (item.id && item.id === loc.id) || (item.codigoMarca && item.codigoMarca === loc.codigoMarca))) {
        list.unshift(loc);
      }
    });
    return list;
  }, [amarracoes, amarracoesLocais]);

  const [formAmarracao, setFormAmarracao] = useState({
    id: null as string | null,
    codigoMarca: '',
    ano: '2025/26',
    cultura: '',
    fazenda: '',
    pivo: '',
    glebas: [] as string[],
    variedades: [] as string[],
    projetoSankhya: '',
    descricaoLote: '',
    identificacaoSankhya: '',
    hectares: '',
    observacao: ''
  });
  const [msgAmarracao, setMsgAmarracao] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);
  const [filtroAmarracao, setFiltroAmarracao] = useState('');

  // Core Data State (Entradas e Saídas)
  const [entradas, setEntradas] = useState<Movimento[]>(() => {
    try {
      const saved = localStorage.getItem('estoque_entradas_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return DEFAULT_ENTRADAS;
  });

  const [saidas, setSaidas] = useState<Movimento[]>(() => {
    try {
      const saved = localStorage.getItem('estoque_saidas_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return DEFAULT_SAIDAS;
  });

  const persistirDados = (novasEntradas = entradas, novasSaidas = saidas) => {
    try {
      localStorage.setItem('estoque_entradas_v2', JSON.stringify(novasEntradas));
      localStorage.setItem('estoque_saidas_v2', JSON.stringify(novasSaidas));
    } catch (e) { /* ignore */ }
  };

  const dataHoje = () => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  };

  // Cleaning string helpers
  const limparNomeProduto = (nome: string) => {
    if (!nome) return '-';
    return nome.replace(/crt/gi, '').replace(/rt/gi, '').replace(/cenoura/gi, '').replace(/cebola/gi, '').replace(/consumo/gi, '').replace(/\s+/g, ' ').trim() || nome;
  };

  const limparNomeGalpao = (nome: string) => {
    if (!nome) return '-';
    return nome.replace(/crt/gi, '').replace(/sgb/gi, '').replace(/bl/gi, '').replace(/sor/gi, '').replace(/sgp/gi, '').replace(/rt/gi, '').replace(/\s+/g, ' ').trim() || nome;
  };

  const limparNomePivo = (nome: string) => {
    if (!nome) return '';
    return nome.replace(/pivô/gi, '').replace(/pivo/gi, '').replace(/\s+/g, ' ').trim() || nome;
  };

  // Search Filter
  const [filtroGeral, setFiltroGeral] = useState('');

  // Form Entrada State
  const [formEntrada, setFormEntrada] = useState({
    id: null as number | null,
    data: dataHoje(),
    controleCod: '',
    fazendaNome: '',
    culturaNome: '',
    pivoNome: '',
    glebaNome: '',
    variedadeNome: '',
    produtoNome: '',
    localNome: 'Câmara Fria 01',
    embalagem: 'Caixa',
    qtd: ''
  });

  // Form Saída State
  const [formSaida, setFormSaida] = useState({
    id: null as number | null,
    data: dataHoje(),
    controleCod: '',
    fazendaNome: '',
    culturaNome: '',
    pivoNome: '',
    glebaNome: '',
    variedadeNome: '',
    produtoNome: '',
    localNome: '',
    embalagem: '',
    qtd: ''
  });

  // Feedback Messages
  const [msgEntrada, setMsgEntrada] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);
  const [msgSaida, setMsgSaida] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);

  const mostrarMsg = (texto: string, tipo: 'sucesso' | 'erro', setMsg: any) => {
    setMsg({ texto, tipo });
    setTimeout(() => setMsg(null), 3000);
  };

  // =========================================================================
  // INTEGRAÇÃO COM OS CADASTROS GERAIS DO CONTROLE AGRÍCOLA APONTADORES
  // =========================================================================

  // 1. Culturas interligadas de Hortifrúti (restrito exclusivamente a hortifrúti na Central de Amarrações e Estoque)
  const culturasHortifrutiDisponiveis = useMemo(() => {
    if (culturas && culturas.length > 0) {
      const hortis = culturas
        .filter(c => isCulturaHortifruti(c.nome, culturas))
        .map(c => c.nome.trim())
        .filter(Boolean);
      if (hortis.length > 0) return Array.from(new Set(hortis));
    }
    return ['Cenoura', 'Cebola', 'Alho', 'Batata', 'Batata Consumo', 'Batata Semente', 'Beterraba', 'Abobora', 'Mirtilo', 'Tomate'];
  }, [culturas]);

  const culturasDisponiveis = culturasHortifrutiDisponiveis;

  // 2. Fazendas interligadas
  const fazendasDisponiveis = useMemo(() => {
    if (fazendas && fazendas.length > 0) {
      return fazendas.map(f => f.nome.trim()).filter(Boolean);
    }
    return ['Fazenda Cristalina', 'Fazenda Boa Vista', 'Fazenda Samambaia'];
  }, [fazendas]);

  // 3. Pivôs interligados
  const pivosDisponiveis = useMemo(() => {
    if (pivos && pivos.length > 0) {
      return pivos.map(p => p.nome.trim()).filter(Boolean);
    }
    return ['Pivô 01', 'Pivô 02', 'Pivô 03', 'Pivô 04'];
  }, [pivos]);

  // 4. Glebas interligadas
  const glebasDisponiveis = useMemo(() => {
    if (glebas && glebas.length > 0) {
      return glebas.map(g => g.nome.trim()).filter(Boolean);
    }
    return ['Gleba 01', 'Gleba 02', 'Gleba 03', 'Gleba 04'];
  }, [glebas]);

  // 5. Variedades interligadas (filtráveis por Cultura)
  const getVariedadesParaCultura = (culturaNome: string) => {
    if (!culturaNome) return [];
    if (variedades && variedades.length > 0) {
      const vars = variedades
        .filter(v => !v.cultura || v.cultura.toLowerCase() === culturaNome.toLowerCase())
        .map(v => v.nome.trim());
      if (vars.length > 0) return Array.from(new Set(vars));
    }
    // Fallbacks inteligentes por cultura
    if (culturaNome.toLowerCase().includes('cenoura')) return ['Híbrida Juliana', 'Brasília', 'Kuronoda', 'Natuna'];
    if (culturaNome.toLowerCase().includes('cebola')) return ['Baia Periforme', 'Soberana', 'Sirius', 'Buccaneer'];
    if (culturaNome.toLowerCase().includes('alho')) return ['Roxo Pérola', 'Cateto Roxo', 'Chonan'];
    if (culturaNome.toLowerCase().includes('batata')) return ['Ágata', 'Cupido', 'Asterix', 'Markies'];
    return ['Padrão'];
  };

  // 6. Produtos / Classificações comerciais interligados por Cultura
  const getProdutosParaCultura = (culturaNome: string) => {
    if (!culturaNome) return ['Padrão Comercial'];
    const cult = culturaNome.toLowerCase();
    if (cult.includes('cenoura')) return ['Especial Calibre 2', 'Padrão Calibre 1', 'Média Calibre 3', 'Descarte / Indústria'];
    if (cult.includes('cebola')) return ['Caixa 3 (Graúda)', 'Caixa 2 (Média)', 'Caixa 1 (Miúda)', 'Descarte / Indústria'];
    if (cult.includes('alho')) return ['Alho Roxo Cat. 1', 'Alho Roxo Cat. 2', 'Alho Industrial'];
    if (cult.includes('batata')) return ['Batata Lavada Especial', 'Batata Lavada Padrão', 'Batata Miúda'];
    return ['Especial', 'Padrão', 'Segunda Linha'];
  };

  // 6.5. Projetos Sankhya estritamente de Hortifrúti (filtra grãos/cereais como Soja, Milho, etc.)
  const projetosSankhyaHortifruti = useMemo(() => {
    if (!projetosSankhya || projetosSankhya.length === 0) return [];
    return projetosSankhya.filter(p => {
      const ident = p.identificacao || '';
      const abrev = p.abreviacaoProjeto || '';
      return isCulturaHortifruti(abrev, culturas) || isCulturaHortifruti(ident, culturas);
    });
  }, [projetosSankhya, culturas]);

  // 7. Controles / Projetos interligados com Amarrações do Estoque + Projetos Sankhya + BdColheita + BdPlantio
  const controlesInterligados = useMemo(() => {
    const mapa = new Map<string, {
      controleCod: string;
      safra: string;
      fazendaNome?: string;
      culturaNome?: string;
      pivoNome?: string;
      glebaNome?: string;
      variedadeNome?: string;
      projetoSankhya?: string;
      descricaoLote?: string;
      isAmarracao?: boolean;
      label: string;
    }>();

    // Origem 0: Amarrações Cadastradas (Geral / Estoque) - PRIORIDADE MÁXIMA
    if (todasAmarracoes && todasAmarracoes.length > 0) {
      todasAmarracoes.forEach((a: any) => {
        const cod = a.codigoMarca?.trim() || a.descricaoLote?.trim() || (a.projetoSankhya ? `PRJ-${a.projetoSankhya}` : '');
        if (!cod) return;
        const safra = a.ano || '2025/26';
        const glebaStr = Array.isArray(a.glebas) && a.glebas.length > 0 ? a.glebas[0] : (a.gleba || '');
        const varStr = Array.isArray(a.variedades) && a.variedades.length > 0 ? a.variedades[0] : (a.variedade || '');
        const loteInfo = a.descricaoLote ? ` - Lote: ${a.descricaoLote}` : (a.projetoSankhya ? ` - Proj: ${a.projetoSankhya}` : '');

        mapa.set(cod, {
          controleCod: cod,
          safra,
          fazendaNome: a.fazenda || '',
          culturaNome: a.cultura || '',
          pivoNome: a.pivo || '',
          glebaNome: glebaStr,
          variedadeNome: varStr,
          projetoSankhya: a.projetoSankhya || '',
          descricaoLote: a.descricaoLote || '',
          isAmarracao: true,
          label: `🔗 [Amarração] ${cod} (${a.fazenda || ''} ${a.pivo || ''} - ${a.cultura || ''}${loteInfo} - Safra ${safra})`
        });

        // Se tiver descricaoLote e for diferente do código, indexar também pelo lote para facilitar localização
        if (a.descricaoLote && a.descricaoLote.trim() !== cod) {
          const loteCod = a.descricaoLote.trim();
          if (!mapa.has(loteCod)) {
            mapa.set(loteCod, {
              controleCod: loteCod,
              safra,
              fazendaNome: a.fazenda || '',
              culturaNome: a.cultura || '',
              pivoNome: a.pivo || '',
              glebaNome: glebaStr,
              variedadeNome: varStr,
              projetoSankhya: a.projetoSankhya || '',
              descricaoLote: a.descricaoLote || '',
              isAmarracao: true,
              label: `🏷️ [Lote] ${loteCod} (${a.fazenda || ''} ${a.pivo || ''} - ${a.cultura || ''} - Safra ${safra})`
            });
          }
        }
      });
    }

    // Origem 1: Projetos Sankhya (Apenas Hortifrúti para Estoque)
    if (projetosSankhyaHortifruti && projetosSankhyaHortifruti.length > 0) {
      projetosSankhyaHortifruti.forEach(p => {
        const cod = p.projeto?.trim();
        if (!cod) return;
        const safra = p.safra || '2025/26';
        if (!mapa.has(cod)) {
          mapa.set(cod, {
            controleCod: cod,
            safra,
            label: `${cod} (${p.identificacao || 'Sankhya'} - Safra ${safra})`
          });
        }
      });
    }

    // Origem 2: Apontamentos de Colheita (BdColheita)
    if (colheitaData && colheitaData.length > 0) {
      colheitaData.forEach(c => {
        const os = c.os?.trim() || c.cCusto?.trim();
        const cod = os ? `CTR-${os}` : `CTR-${c.ano || '2025/26'}-${c.pivo || '01'}`;
        const safra = c.ano ? (c.ano.includes('/') ? c.ano : `${c.ano}/${parseInt(c.ano.slice(-2)) + 1}`) : '2025/26';
        if (!mapa.has(cod)) {
          mapa.set(cod, {
            controleCod: cod,
            safra,
            fazendaNome: c.fazenda,
            culturaNome: c.cultura,
            pivoNome: c.pivo,
            glebaNome: c.gleba,
            variedadeNome: c.variedade,
            label: `${cod} (${c.fazenda || ''} ${c.pivo || ''} - ${c.cultura || ''} - Safra ${safra})`
          });
        }
      });
    }

    // Origem 3: Apontamentos de Plantio (BdPlantio)
    if (plantioData && plantioData.length > 0) {
      plantioData.forEach(p => {
        const os = p.os?.trim() || p.cCusto?.trim();
        const cod = os ? `CTR-${os}` : `CTR-${p.ano || '2025/26'}-${p.pivo || '01'}`;
        const safra = p.ano ? (p.ano.includes('/') ? p.ano : `${p.ano}/${parseInt(p.ano.slice(-2)) + 1}`) : '2025/26';
        if (!mapa.has(cod)) {
          mapa.set(cod, {
            controleCod: cod,
            safra,
            fazendaNome: p.fazenda,
            culturaNome: p.cultura,
            pivoNome: p.pivo,
            glebaNome: p.gleba,
            variedadeNome: p.variedade,
            label: `${cod} (${p.fazenda || ''} ${p.pivo || ''} - ${p.cultura || ''} - Safra ${safra})`
          });
        }
      });
    }

    // Controles padrão base caso a base inicial esteja vazia
    if (!mapa.has('CTR-2025/26-01')) {
      mapa.set('CTR-2025/26-01', { controleCod: 'CTR-2025/26-01', safra: '2025/26', fazendaNome: 'Fazenda Cristalina', culturaNome: 'Cenoura', pivoNome: 'Pivô 01', glebaNome: 'Gleba 01', variedadeNome: 'Híbrida Juliana', label: 'CTR-2025/26-01 (Fazenda Cristalina Pivô 01 - Cenoura)' });
    }
    if (!mapa.has('CTR-2025/26-02')) {
      mapa.set('CTR-2025/26-02', { controleCod: 'CTR-2025/26-02', safra: '2025/26', fazendaNome: 'Fazenda Boa Vista', culturaNome: 'Cebola', pivoNome: 'Pivô 03', glebaNome: 'Gleba 04', variedadeNome: 'Baia Periforme', label: 'CTR-2025/26-02 (Fazenda Boa Vista Pivô 03 - Cebola)' });
    }

    return Array.from(mapa.values());
  }, [todasAmarracoes, projetosSankhyaHortifruti, colheitaData, plantioData]);

  // Helpers para geração e manipulação de Amarrações
  const getProximoCodigoAmarracao = () => {
    const maxNum = todasAmarracoes.reduce((acc, curr) => {
      const cod = curr.codigoMarca || '';
      const match = cod.match(/M-(\d+)/i) || cod.match(/CTR-(\d+)/i);
      if (match) {
        const n = parseInt(match[1], 10);
        return n > acc ? n : acc;
      }
      return acc;
    }, 0);
    return `M-${String(maxNum + 1).padStart(4, '0')}`;
  };

  // Amarrações estritamente de Hortifrúti para a Central de Amarrações do Estoque
  const amarracoesHortifruti = useMemo(() => {
    return todasAmarracoes.filter(a => isCulturaHortifruti(a.cultura, culturas));
  }, [todasAmarracoes, culturas]);

  const amarracaoIsHorti = useMemo(() => {
    return isCulturaHortifruti(formAmarracao.cultura, culturas);
  }, [formAmarracao.cultura, culturas]);

  // Estados para controlar expansão opcional de todas as glebas/variedades do sistema caso o usuário queira
  const [mostrarTodasGlebas, setMostrarTodasGlebas] = useState(false);
  const [mostrarTodasVariedades, setMostrarTodasVariedades] = useState(false);

  // Cruzamento com a Central de Amarrações por Ano Safra + Cultura + Fazenda + Pivô
  const vinculoCentralAmarracao = useMemo(() => {
    if (!formAmarracao.ano || !formAmarracao.cultura || !formAmarracao.fazenda || !formAmarracao.pivo) {
      return {
        encontrado: false,
        amarracoesEncontradas: [] as any[],
        glebasVinculadas: [] as string[],
        variedadesVinculadas: [] as string[],
        hectaresVinculado: '',
        origemInfo: ''
      };
    }

    // 1. Busca na Central de Amarrações (todasAmarracoes)
    const matchesAmarracoes = (todasAmarracoes || []).filter(a => {
      if (formAmarracao.id && a.id === formAmarracao.id) return false;
      return (
        matchAno(formAmarracao.ano, a.ano) &&
        matchCultura(formAmarracao.cultura, a.cultura) &&
        matchFazenda(formAmarracao.fazenda, a.fazenda) &&
        matchPivo(formAmarracao.pivo, a.pivo)
      );
    });

    const glebaSet = new Set<string>();
    const varSet = new Set<string>();
    let hect = '';

    matchesAmarracoes.forEach(m => {
      // Extrai glebas
      if (m.glebas) {
        if (Array.isArray(m.glebas)) {
          m.glebas.forEach((g: any) => g && glebaSet.add(String(g).trim()));
        } else if (typeof m.glebas === 'string') {
          m.glebas.split(/[,;\n]+/).forEach((g: string) => g.trim() && glebaSet.add(g.trim()));
        }
      }
      if (m.gleba && typeof m.gleba === 'string') {
        m.gleba.split(/[,;\n]+/).forEach((g: string) => g.trim() && glebaSet.add(g.trim()));
      }
      if (m.titulo) {
        const matchG = m.titulo.match(/Gleba:\s*([^➔\n\r,]+)/i);
        if (matchG && matchG[1]) glebaSet.add(matchG[1].trim());
      }

      // Extrai variedades
      if (m.variedades) {
        if (Array.isArray(m.variedades)) {
          m.variedades.forEach((v: any) => v && varSet.add(String(v).trim()));
        } else if (typeof m.variedades === 'string') {
          m.variedades.split(/[,;\n]+/).forEach((v: string) => v.trim() && varSet.add(v.trim()));
        }
      }
      if (m.variedade && typeof m.variedade === 'string') {
        m.variedade.split(/[,;\n]+/).forEach((v: string) => v.trim() && varSet.add(v.trim()));
      }
      if (m.destino && !['Estoque', 'Geral', 'Venda'].includes(m.destino.trim())) {
        varSet.add(m.destino.trim());
      }
      if (m.titulo) {
        const matchV = m.titulo.match(/Variedade:\s*([^➔\n\r,]+)/i);
        if (matchV && matchV[1]) varSet.add(matchV[1].trim());
      }

      if (!hect && m.hectares) {
        hect = String(m.hectares).trim();
      }
    });

    let origem = matchesAmarracoes.length > 0 ? 'Central de Amarrações' : '';

    // 2. Se não encontrou na Central de Amarrações, busca também em plantioData e colheitaData
    if (matchesAmarracoes.length === 0) {
      const matchesPlantio = (plantioData || []).filter(p =>
        matchAno(formAmarracao.ano, p.ano) &&
        matchCultura(formAmarracao.cultura, p.cultura) &&
        matchFazenda(formAmarracao.fazenda, p.fazenda) &&
        matchPivo(formAmarracao.pivo, p.pivo)
      );
      matchesPlantio.forEach(p => {
        if (p.gleba) glebaSet.add(String(p.gleba).trim());
        if (p.variedade) varSet.add(String(p.variedade).trim());
        if (!hect && (p.area || p.hectares || p.ha)) hect = String(p.area || p.hectares || p.ha).trim();
      });

      const matchesColheita = (colheitaData || []).filter(c =>
        matchAno(formAmarracao.ano, c.ano) &&
        matchCultura(formAmarracao.cultura, c.cultura) &&
        matchFazenda(formAmarracao.fazenda, c.fazenda) &&
        matchPivo(formAmarracao.pivo, c.pivo)
      );
      matchesColheita.forEach(c => {
        if (c.gleba) glebaSet.add(String(c.gleba).trim());
        if (c.variedade) varSet.add(String(c.variedade).trim());
        if (!hect && (c.area || c.hectares || c.ha)) hect = String(c.area || c.hectares || c.ha).trim();
      });

      if (matchesPlantio.length > 0) origem = 'Apontamentos de Plantio';
      else if (matchesColheita.length > 0) origem = 'Apontamentos de Colheita';
    }

    const glebasList = Array.from(glebaSet).filter(Boolean);
    const varList = Array.from(varSet).filter(Boolean);

    return {
      encontrado: matchesAmarracoes.length > 0 || glebasList.length > 0 || varList.length > 0,
      amarracoesEncontradas: matchesAmarracoes,
      glebasVinculadas: glebasList,
      variedadesVinculadas: varList,
      hectaresVinculado: hect,
      origemInfo: origem
    };
  }, [formAmarracao.ano, formAmarracao.cultura, formAmarracao.fazenda, formAmarracao.pivo, formAmarracao.id, todasAmarracoes, plantioData, colheitaData]);

  // Auto-seleciona e preenche glebas e variedades vinculadas quando localizadas na Central
  useEffect(() => {
    if (vinculoCentralAmarracao.encontrado) {
      setFormAmarracao(prev => {
        let changed = false;
        let newGlebas = [...prev.glebas];
        let newVars = [...prev.variedades];
        let newHect = prev.hectares;

        if (vinculoCentralAmarracao.glebasVinculadas.length > 0) {
          const merged = Array.from(new Set([...prev.glebas, ...vinculoCentralAmarracao.glebasVinculadas]));
          if (merged.length !== prev.glebas.length) {
            newGlebas = merged;
            changed = true;
          }
        }

        if (vinculoCentralAmarracao.variedadesVinculadas.length > 0) {
          const merged = Array.from(new Set([...prev.variedades, ...vinculoCentralAmarracao.variedadesVinculadas]));
          if (merged.length !== prev.variedades.length) {
            newVars = merged;
            changed = true;
          }
        }

        if (!prev.hectares && vinculoCentralAmarracao.hectaresVinculado) {
          const cleanHect = vinculoCentralAmarracao.hectaresVinculado.replace(/[^\d.,]/g, '').replace(',', '.');
          if (cleanHect) {
            newHect = cleanHect;
            changed = true;
          }
        }

        if (!changed) return prev;
        return {
          ...prev,
          glebas: newGlebas,
          variedades: newVars,
          hectares: newHect
        };
      });
    }
  }, [vinculoCentralAmarracao]);

  // Lista de glebas para exibir na UI da amarração
  const glebasParaExibir = useMemo(() => {
    if (vinculoCentralAmarracao.glebasVinculadas.length > 0 && !mostrarTodasGlebas) {
      return vinculoCentralAmarracao.glebasVinculadas;
    }
    if (formAmarracao.fazenda) {
      const fazCore = formAmarracao.fazenda.toLowerCase();
      const glebasFaz = glebas
        .filter(g => g.fazenda && g.fazenda.toLowerCase().includes(fazCore))
        .map(g => g.nome.trim());
      if (glebasFaz.length > 0) return Array.from(new Set(glebasFaz));
    }
    return glebasDisponiveis;
  }, [vinculoCentralAmarracao.glebasVinculadas, mostrarTodasGlebas, formAmarracao.fazenda, glebas, glebasDisponiveis]);

  // Lista de variedades para exibir na UI da amarração
  const variedadesParaExibir = useMemo(() => {
    if (vinculoCentralAmarracao.variedadesVinculadas.length > 0 && !mostrarTodasVariedades) {
      return vinculoCentralAmarracao.variedadesVinculadas;
    }
    return getVariedadesParaCultura(formAmarracao.cultura);
  }, [vinculoCentralAmarracao.variedadesVinculadas, mostrarTodasVariedades, formAmarracao.cultura, variedades]);

  const sankhyaMatchForAmarracao = useMemo(() => {
    if (!formAmarracao.cultura || !formAmarracao.fazenda || !formAmarracao.pivo) {
      return { matches: [], lotes: [], descricaoLote: '', projetoSankhya: '', identificacaoSankhya: '' };
    }
    return matchSankhyaProjectForTie({
      ano: formAmarracao.ano,
      cultura: formAmarracao.cultura,
      fazenda: formAmarracao.fazenda,
      pivo: formAmarracao.pivo,
      glebas: formAmarracao.glebas,
      sankhyaProjects: projetosSankhyaHortifruti,
      isHortifruti: true // Na Central de Amarrações do Estoque, é estritamente Hortifrúti
    });
  }, [formAmarracao.ano, formAmarracao.cultura, formAmarracao.fazenda, formAmarracao.pivo, formAmarracao.glebas, projetosSankhyaHortifruti]);

  // Auto-preenche os campos de Projeto Sankhya e Lote quando o reconhecimento inteligente localiza o projeto correspondente
  useEffect(() => {
    if (sankhyaMatchForAmarracao.matches.length > 0) {
      const best = sankhyaMatchForAmarracao.matches[0].project;
      setFormAmarracao(prev => {
        // Se ambos já estão preenchidos com os valores detectados, evita re-render
        if (prev.projetoSankhya === best.projeto && prev.descricaoLote === best.descricaoLote) {
          return prev;
        }
        return {
          ...prev,
          projetoSankhya: best.projeto || prev.projetoSankhya,
          descricaoLote: best.descricaoLote || prev.descricaoLote,
          identificacaoSankhya: best.identificacao || prev.identificacaoSankhya
        };
      });
    }
  }, [sankhyaMatchForAmarracao]);

  const salvarAmarracao = async (e?: React.FormEvent, lancarEntradaApos = false) => {
    if (e) e.preventDefault();

    if (!formAmarracao.cultura) {
      setMsgAmarracao({ texto: 'Por favor, selecione a Cultura.', tipo: 'erro' });
      return;
    }
    if (!formAmarracao.fazenda) {
      setMsgAmarracao({ texto: 'Por favor, selecione a Fazenda.', tipo: 'erro' });
      return;
    }

    const codigoFinal = formAmarracao.codigoMarca.trim() || getProximoCodigoAmarracao();
    const glebaStr = formAmarracao.glebas.join(', ');
    const varStr = formAmarracao.variedades.join(', ');
    const autoTitle = `Fazenda: ${formAmarracao.fazenda} ➔ Pivô: ${formAmarracao.pivo || 'Geral'} ➔ Cultura: ${formAmarracao.cultura}${glebaStr ? ` ➔ Gleba: ${glebaStr}` : ''}${varStr ? ` ➔ Variedade: ${varStr}` : ''}`;

    const novaAmarracao = {
      id: formAmarracao.id || `amarracao_${Date.now()}`,
      codigoMarca: codigoFinal,
      categoria: 'geral',
      titulo: autoTitle,
      origem: `${formAmarracao.fazenda} / ${formAmarracao.pivo || 'Geral'}`,
      destino: 'Estoque',
      status: 'Ativo' as const,
      ano: formAmarracao.ano || '2025/26',
      cultura: formAmarracao.cultura,
      fazenda: formAmarracao.fazenda,
      pivo: formAmarracao.pivo || '',
      glebas: formAmarracao.glebas,
      variedades: formAmarracao.variedades,
      descricaoLote: formAmarracao.descricaoLote || sankhyaMatchForAmarracao.descricaoLote || '',
      projetoSankhya: formAmarracao.projetoSankhya || sankhyaMatchForAmarracao.projetoSankhya || '',
      identificacaoSankhya: formAmarracao.identificacaoSankhya || sankhyaMatchForAmarracao.identificacaoSankhya || '',
      hectares: formAmarracao.hectares,
      observacao: formAmarracao.observacao,
      updatedAt: new Date().toISOString()
    };

    // 1. Salvar no Firestore se handler estiver disponível
    if (onSaveAmarracao) {
      try {
        await onSaveAmarracao(novaAmarracao, formAmarracao.id || undefined);
      } catch (err) {
        console.error('Erro ao persistir amarração:', err);
      }
    }

    // 2. Atualizar estado local para resposta instantânea
    setAmarracoesLocais(prev => {
      const filtered = prev.filter(p => p.id !== novaAmarracao.id && p.codigoMarca !== novaAmarracao.codigoMarca);
      const updated = [novaAmarracao, ...filtered];
      try {
        localStorage.setItem('estoque_amarracoes_locais', JSON.stringify(updated));
      } catch (e) { /* ignore */ }
      return updated;
    });

    setMsgAmarracao({
      texto: `Amarração ${codigoFinal} salva com sucesso!`,
      tipo: 'sucesso'
    });
    if (showToast) {
      showToast(`Amarração ${codigoFinal} registrada com sucesso!`, 'success');
    }

    if (lancarEntradaApos) {
      // Já preenche e abre o formulário de Entrada!
      setFormEntrada({
        id: null,
        data: dataHoje(),
        controleCod: codigoFinal,
        fazendaNome: formAmarracao.fazenda,
        culturaNome: formAmarracao.cultura,
        pivoNome: formAmarracao.pivo || pivosDisponiveis[0] || '',
        glebaNome: formAmarracao.glebas[0] || glebasDisponiveis[0] || '',
        variedadeNome: formAmarracao.variedades[0] || getVariedadesParaCultura(formAmarracao.cultura)[0] || '',
        produtoNome: getProdutosParaCultura(formAmarracao.cultura)[0] || '',
        localNome: LOCAIS_ARMAZENAMENTO_PADRAO[0],
        embalagem: 'Caixa',
        qtd: ''
      });
      setPaginaAtiva('entrada');
    } else {
      // Limpar formulário de amarração preparando para a próxima
      setFormAmarracao({
        id: null,
        codigoMarca: '',
        ano: formAmarracao.ano,
        cultura: formAmarracao.cultura,
        fazenda: formAmarracao.fazenda,
        pivo: formAmarracao.pivo,
        glebas: [],
        variedades: [],
        projetoSankhya: '',
        descricaoLote: '',
        identificacaoSankhya: '',
        hectares: '',
        observacao: ''
      });
    }
  };

  const lancarEntradaParaAmarracao = (a: any) => {
    const cod = a.codigoMarca || a.descricaoLote || '';
    const glebaPrimeira = (Array.isArray(a.glebas) && a.glebas.length > 0) ? a.glebas[0] : (a.gleba || '');
    const varPrimeira = (Array.isArray(a.variedades) && a.variedades.length > 0) ? a.variedades[0] : (a.variedade || '');
    setFormEntrada({
      id: null,
      data: dataHoje(),
      controleCod: cod,
      fazendaNome: a.fazenda || '',
      culturaNome: a.cultura || '',
      pivoNome: a.pivo || '',
      glebaNome: glebaPrimeira,
      variedadeNome: varPrimeira || getVariedadesParaCultura(a.cultura)[0] || '',
      produtoNome: getProdutosParaCultura(a.cultura)[0] || '',
      localNome: LOCAIS_ARMAZENAMENTO_PADRAO[0],
      embalagem: 'Caixa',
      qtd: ''
    });
    setPaginaAtiva('entrada');
    if (showToast) {
      showToast(`Entrada pronta para amarração ${cod}!`, 'info');
    }
  };

  const lancarSaidaParaAmarracao = (a: any) => {
    const cod = a.codigoMarca || a.descricaoLote || '';
    const itemSaldo = listaSaldosAtuais.find(s => s.controleCod === cod);
    const glebaPrimeira = (Array.isArray(a.glebas) && a.glebas.length > 0) ? a.glebas[0] : (a.gleba || '');
    const varPrimeira = (Array.isArray(a.variedades) && a.variedades.length > 0) ? a.variedades[0] : (a.variedade || '');

    setFormSaida({
      id: null,
      data: dataHoje(),
      controleCod: cod,
      fazendaNome: itemSaldo?.fazendaNome || a.fazenda || '',
      culturaNome: itemSaldo?.culturaNome || a.cultura || '',
      pivoNome: itemSaldo?.pivoNome || a.pivo || '',
      glebaNome: itemSaldo?.glebaNome || glebaPrimeira,
      variedadeNome: itemSaldo?.variedadeNome || varPrimeira,
      produtoNome: itemSaldo?.produtoNome || getProdutosParaCultura(a.cultura)[0] || '',
      localNome: itemSaldo?.localNome || LOCAIS_ARMAZENAMENTO_PADRAO[0],
      embalagem: (itemSaldo?.caixas && itemSaldo.caixas > 0) ? 'Caixa' : (itemSaldo?.contentores && itemSaldo.contentores > 0) ? 'Contentor' : 'Saco',
      qtd: ''
    });
    setPaginaAtiva('saida');
    if (showToast) {
      showToast(`Saída pronta para o controle ${cod}!`, 'info');
    }
  };

  const excluirAmarracao = async (id: string, codigo?: string) => {
    if (!window.confirm(`Deseja realmente remover a amarração ${codigo || id}?`)) return;
    if (onDeleteAmarracao) {
      try {
        await onDeleteAmarracao(id);
      } catch (e) {
        console.error('Erro ao excluir amarração via Firestore:', e);
      }
    }
    setAmarracoesLocais(prev => {
      const updated = prev.filter(p => p.id !== id && p.codigoMarca !== codigo);
      try {
        localStorage.setItem('estoque_amarracoes_locais', JSON.stringify(updated));
      } catch (e) { /* ignore */ }
      return updated;
    });
    if (showToast) {
      showToast(`Amarração removida.`, 'info');
    }
  };

  // =========================================================================
  // CÁLCULO DE SALDOS DE ESTOQUE
  // =========================================================================
  const saldosAtuais = useMemo((): Record<string, SaldoItem> => {
    const saldos: Record<string, SaldoItem> = {};

    entradas.forEach(ent => {
      const chave = `${ent.controleCod}_${ent.localNome}_${ent.produtoNome}_${ent.variedadeNome}_${ent.glebaNome}`;
      if (!saldos[chave]) {
        saldos[chave] = {
          controleCod: ent.controleCod,
          fazendaNome: ent.fazendaNome,
          culturaNome: ent.culturaNome,
          pivoNome: ent.pivoNome,
          glebaNome: ent.glebaNome,
          variedadeNome: ent.variedadeNome,
          produtoNome: ent.produtoNome,
          localNome: ent.localNome,
          caixas: 0,
          contentores: 0,
          sacos: 0
        };
      }
      const qtd = parseInt(String(ent.qtd) || '0', 10);
      if (ent.embalagem === 'Caixa') saldos[chave].caixas += qtd;
      else if (ent.embalagem === 'Contentor') saldos[chave].contentores += qtd;
      else if (ent.embalagem === 'Saco') saldos[chave].sacos += qtd;
    });

    saidas.forEach(sai => {
      const chave = `${sai.controleCod}_${sai.localNome}_${sai.produtoNome}_${sai.variedadeNome}_${sai.glebaNome}`;
      if (!saldos[chave]) {
        saldos[chave] = {
          controleCod: sai.controleCod,
          fazendaNome: sai.fazendaNome,
          culturaNome: sai.culturaNome,
          pivoNome: sai.pivoNome,
          glebaNome: sai.glebaNome,
          variedadeNome: sai.variedadeNome,
          produtoNome: sai.produtoNome,
          localNome: sai.localNome,
          caixas: 0,
          contentores: 0,
          sacos: 0
        };
      }
      const qtd = parseInt(String(sai.qtd) || '0', 10);
      if (sai.embalagem === 'Caixa') saldos[chave].caixas -= qtd;
      else if (sai.embalagem === 'Contentor') saldos[chave].contentores -= qtd;
      else if (sai.embalagem === 'Saco') saldos[chave].sacos -= qtd;
    });

    return saldos;
  }, [entradas, saidas]);

  const listaSaldosAtuais = useMemo((): SaldoItem[] => {
    return Object.values(saldosAtuais);
  }, [saldosAtuais]);

  // Controles que possuem saldo positivo para Saída
  const controlesComSaldoParaSaida = useMemo(() => {
    const setControles = new Set<string>();
    listaSaldosAtuais.forEach(s => {
      if (s.caixas > 0 || s.contentores > 0 || s.sacos > 0) {
        setControles.add(s.controleCod);
      }
    });
    return Array.from(setControles);
  }, [listaSaldosAtuais]);

  // Itens de saldo para o Controle selecionado na Saída
  const itensComSaldoNoControleSaida = useMemo(() => {
    if (!formSaida.controleCod) return [];
    return listaSaldosAtuais.filter(s =>
      s.controleCod === formSaida.controleCod && (s.caixas > 0 || s.contentores > 0 || s.sacos > 0)
    );
  }, [formSaida.controleCod, listaSaldosAtuais]);

  // =========================================================================
  // SALVAMENTO DE ENTRADAS E SAÍDAS
  // =========================================================================
  const salvarEntrada = () => {
    if (!formEntrada.controleCod || !formEntrada.fazendaNome || !formEntrada.culturaNome || !formEntrada.produtoNome || !formEntrada.qtd) {
      return mostrarMsg('Preencha os campos obrigatórios (Controle, Cultura, Produto e Quantidade)', 'erro', setMsgEntrada);
    }

    const qtd = parseInt(formEntrada.qtd, 10);
    if (isNaN(qtd) || qtd <= 0) {
      return mostrarMsg('A quantidade deve ser um número maior que zero', 'erro', setMsgEntrada);
    }

    const id = formEntrada.id || Date.now();
    const novaEntrada: Movimento = {
      id,
      data: formEntrada.data || dataHoje(),
      controleCod: formEntrada.controleCod,
      fazendaNome: formEntrada.fazendaNome,
      culturaNome: formEntrada.culturaNome,
      pivoNome: formEntrada.pivoNome,
      glebaNome: formEntrada.glebaNome,
      variedadeNome: formEntrada.variedadeNome,
      produtoNome: formEntrada.produtoNome,
      localNome: formEntrada.localNome || 'Câmara Fria 01',
      embalagem: formEntrada.embalagem || 'Caixa',
      qtd
    };

    const novasEntradas = [...entradas];
    const idx = novasEntradas.findIndex(e => e.id === id);
    if (idx >= 0) novasEntradas[idx] = novaEntrada;
    else novasEntradas.push(novaEntrada);

    setEntradas(novasEntradas);
    persistirDados(novasEntradas, saidas);
    mostrarMsg('Entrada registrada com sucesso no Estoque!', 'sucesso', setMsgEntrada);
    if (showToast) showToast(`Entrada de ${qtd} ${novaEntrada.embalagem}s lançada no estoque!`, 'success');
    setPaginaAtiva('inicial');
  };

  const salvarSaida = () => {
    if (!formSaida.controleCod || !formSaida.produtoNome || !formSaida.embalagem || !formSaida.qtd) {
      return mostrarMsg('Preencha todos os campos obrigatórios para saída', 'erro', setMsgSaida);
    }

    const qtd = parseInt(formSaida.qtd, 10);
    if (isNaN(qtd) || qtd <= 0) {
      return mostrarMsg('A quantidade deve ser um número maior que zero', 'erro', setMsgSaida);
    }

    // Validação de saldo
    const chave = `${formSaida.controleCod}_${formSaida.localNome}_${formSaida.produtoNome}_${formSaida.variedadeNome}_${formSaida.glebaNome}`;
    const saldoItem = saldosAtuais[chave];
    let saldoDisponivel = 0;
    if (saldoItem) {
      if (formSaida.embalagem === 'Caixa') saldoDisponivel = saldoItem.caixas;
      else if (formSaida.embalagem === 'Contentor') saldoDisponivel = saldoItem.contentores;
      else if (formSaida.embalagem === 'Saco') saldoDisponivel = saldoItem.sacos;
    }

    if (qtd > saldoDisponivel) {
      return mostrarMsg(`Saldo insuficiente! Saldo disponível no local: ${saldoDisponivel} un.`, 'erro', setMsgSaida);
    }

    const id = formSaida.id || Date.now();
    const novaSaida: Movimento = {
      id,
      data: formSaida.data || dataHoje(),
      controleCod: formSaida.controleCod,
      fazendaNome: formSaida.fazendaNome,
      culturaNome: formSaida.culturaNome,
      pivoNome: formSaida.pivoNome,
      glebaNome: formSaida.glebaNome,
      variedadeNome: formSaida.variedadeNome,
      produtoNome: formSaida.produtoNome,
      localNome: formSaida.localNome,
      embalagem: formSaida.embalagem,
      qtd
    };

    const novasSaidas = [...saidas];
    const idx = novasSaidas.findIndex(s => s.id === id);
    if (idx >= 0) novasSaidas[idx] = novaSaida;
    else novasSaidas.push(novaSaida);

    setSaidas(novasSaidas);
    persistirDados(entradas, novasSaidas);
    mostrarMsg('Saída registrada com sucesso do Estoque!', 'sucesso', setMsgSaida);
    if (showToast) showToast(`Saída de ${qtd} ${novaSaida.embalagem}s baixada do estoque!`, 'success');
    setPaginaAtiva('inicial');
  };

  // =========================================================================
  // AGRUPAMENTO E FORMATAÇÃO DA TABELA PRINCIPAL
  // =========================================================================
  const resumoEstoque = useMemo(() => {
    const termo = filtroGeral.toLowerCase().trim();
    const grupos: Record<string, SaldoItem[]> = {};

    listaSaldosAtuais.forEach(item => {
      if (item.caixas === 0 && item.contentores === 0 && item.sacos === 0) return;
      const ctrl = item.controleCod || 'SEM CONTROLE';
      if (!grupos[ctrl]) grupos[ctrl] = [];
      grupos[ctrl].push(item);
    });

    const coresCabecalho = [
      { bg: '#0d47a1', border: '#0a3980', th: '#1a5276', thBorder: '#154360' },
      { bg: '#1b5e20', border: '#144517', th: '#1e8449', thBorder: '#196f3d' },
      { bg: '#b7950b', border: '#9a7d0a', th: '#d4ac0d', thBorder: '#b7950b' }
    ];

    const blocos = Object.keys(grupos).map((controleCodigo, idx) => {
      const cor = coresCabecalho[idx % coresCabecalho.length];
      let temCaixa = false, temContentor = false, temSaco = false;
      let nomeCultura = '';

      const itens = grupos[controleCodigo].map((item, itemIdx) => {
        if (!nomeCultura && item.culturaNome) {
          nomeCultura = item.culturaNome.toUpperCase();
        }

        const localNome = limparNomeGalpao(item.localNome);
        const produtoNomeLimpo = limparNomeProduto(item.produtoNome);
        const pivoLimpo = limparNomePivo(item.pivoNome);
        const localidadeCombinada = pivoLimpo
          ? `${item.fazendaNome} ${pivoLimpo} / ${item.glebaNome || '-'}`
          : `${item.fazendaNome} / ${item.glebaNome || '-'}`;

        const matches = !termo || [
          item.controleCod,
          item.culturaNome,
          localNome,
          produtoNomeLimpo,
          localidadeCombinada,
          item.variedadeNome
        ].some(v => v && v.toLowerCase().includes(termo));

        if (!matches) return null;

        if (item.caixas !== 0) temCaixa = true;
        if (item.contentores !== 0) temContentor = true;
        if (item.sacos !== 0) temSaco = true;

        return {
          cod: String(100 + itemIdx + 1),
          localNome,
          produtoNomeLimpo,
          localidadeCombinada,
          txtVariedade: item.variedadeNome || '-',
          controleCodigo: item.controleCod,
          caixas: item.caixas,
          contentores: item.contentores,
          sacos: item.sacos
        };
      }).filter(Boolean);

      let textoSafra = '2025/26';
      if (controleCodigo.includes('24/25')) textoSafra = '2024/25';
      else if (controleCodigo.includes('25/26')) textoSafra = '2025/26';
      else if (controleCodigo.includes('26/27')) textoSafra = '2026/27';

      return {
        controleCodigo,
        nomeCultura: nomeCultura || 'CULTURA',
        textoSafra,
        cor,
        temCaixa,
        temContentor,
        temSaco,
        itens
      };
    }).filter(b => b.itens.length > 0);

    return blocos;
  }, [saldosAtuais, filtroGeral]);

  return (
    <div className="app-estoque-intacto" style={{ background: '#f8faf6', padding: '10px', minHeight: '100%', fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#333' }}>
      <style>{`
        .app-estoque-intacto * { box-sizing: border-box; }
        .app-estoque-intacto .card { background: white; border-radius: 6px; padding: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.15); margin-bottom: 10px; position: relative; border: 1px solid #e2e8f0; }
        .app-estoque-intacto .top-area { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
        .app-estoque-intacto .filtro { width: 100%; height: 36px; padding: 0 12px 0 34px; border: 1px solid #bbdefb; border-radius: 6px; background: #e3f2fd url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%230d47a1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3C/svg%3E") no-repeat 10px center; color: #0d47a1; font-size: 13px; }
        .app-estoque-intacto .filtro:focus { outline: none; border-color: #0d47a1; background-color: #fff; }
        .app-estoque-intacto .botoes-principais { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
        @media (max-width: 640px) {
          .app-estoque-intacto .botoes-principais { grid-template-columns: 1fr; }
        }
        .app-estoque-intacto .btn-principal { width: 100%; padding: 10px 8px; border: 1px solid #0d47a1; border-radius: 6px; font-size: 13px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; background: #e3f2fd; color: #0d47a1; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
        .app-estoque-intacto .btn-principal:hover { background: #d4e8fc; }
        .app-estoque-intacto .btn-amarracao-principal { border: 1.5px solid #8b5cf6 !important; background: #f5f3ff !important; color: #6d28d9 !important; box-shadow: 0 1px 3px rgba(139, 92, 246, 0.2) !important; }
        .app-estoque-intacto .btn-amarracao-principal:hover { background: #ede9fe !important; }
        .app-estoque-intacto label { display: block; margin: 8px 0 2px; font-weight: 600; color: #444; font-size: 12px; }
        .app-estoque-intacto input, .app-estoque-intacto select { width: 100%; height: 34px; padding: 0 8px; border: 1px solid #ccc; border-radius: 6px; font-size: 13px; margin-bottom: 6px; background: #ffffff; }
        .app-estoque-intacto input:disabled, .app-estoque-intacto select:disabled { background: #f5f5f5; color: #666; cursor: not-allowed; }
        .app-estoque-intacto .btn { height: 34px; padding: 0 14px; border: none; border-radius: 6px; font-size: 13px; font-weight: bold; cursor: pointer; margin-top: 4px; }
        .app-estoque-intacto .btn-salvar { background: #0d47a1; color: white; margin-right: 6px; }
        .app-estoque-intacto .btn-cancelar { background: #6c757d; color: white; }
        .app-estoque-intacto .btn-voltar { background: #757575; color: white; margin-bottom: 12px; height: 30px; padding: 0 10px; font-size: 12px; }
        .app-estoque-intacto .resultado { margin-top: 12px; padding: 8px; border-radius: 6px; text-align: center; font-weight: bold; font-size: 13px; }
        .app-estoque-intacto .sucesso { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .app-estoque-intacto .erro { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .app-estoque-intacto .tabela-wrapper { width: 100%; overflow-x: auto; margin-top: 4px; }
        .app-estoque-intacto .tabela { width: 100%; border-collapse: collapse; table-layout: auto; }
        .app-estoque-intacto .tabela th { padding: 6px 4px; text-align: left; font-weight: bold; font-size: 11px; white-space: nowrap; }
        .app-estoque-intacto .tabela td { padding: 6px 4px; border: 1px solid #ddd; font-size: 11px; white-space: nowrap; }
        .app-estoque-intacto .tabela tr:nth-child(even) { background: #f2f7f9; }
        .app-estoque-intacto .vazio { padding: 30px; text-align: center; color: #777; font-style: italic; font-size: 12px; }
      `}</style>

      {/* ========================================================================= */}
      {/* 1. TELA PRINCIPAL (ESTOQUE ATIVO) */}
      {/* ========================================================================= */}
      {paginaAtiva === 'inicial' && (
        <div className="card">
          <div className="top-area">
            {/* PESQUISAR NO ESTOQUE ATIVO */}
            <input
              type="text"
              value={filtroGeral}
              onChange={(e) => setFiltroGeral(e.target.value)}
              className="filtro"
              placeholder="Pesquisar no Estoque Ativo..."
            />

            {/* BOTÕES DE AÇÃO: ENTRADA, AMARRAÇÕES E SAÍDA */}
            <div className="botoes-principais">
              <button
                className="btn-principal"
                onClick={() => {
                  setFormEntrada({
                    id: null,
                    data: dataHoje(),
                    controleCod: controlesInterligados[0]?.controleCod || '',
                    fazendaNome: controlesInterligados[0]?.fazendaNome || fazendasDisponiveis[0] || '',
                    culturaNome: controlesInterligados[0]?.culturaNome || culturasDisponiveis[0] || '',
                    pivoNome: controlesInterligados[0]?.pivoNome || pivosDisponiveis[0] || '',
                    glebaNome: controlesInterligados[0]?.glebaNome || glebasDisponiveis[0] || '',
                    variedadeNome: getVariedadesParaCultura(controlesInterligados[0]?.culturaNome || culturasDisponiveis[0])[0] || '',
                    produtoNome: getProdutosParaCultura(controlesInterligados[0]?.culturaNome || culturasDisponiveis[0])[0] || '',
                    localNome: LOCAIS_ARMAZENAMENTO_PADRAO[0],
                    embalagem: 'Caixa',
                    qtd: ''
                  });
                  setPaginaAtiva('entrada');
                }}
              >
                📥 Entrada
              </button>

              <button
                className="btn-principal btn-amarracao-principal"
                onClick={() => {
                  setPaginaAtiva('amarracoes');
                }}
              >
                🔗 Amarrações
              </button>

              <button
                className="btn-principal"
                onClick={() => {
                  const ctrlInicial = controlesComSaldoParaSaida[0] || '';
                  const itemSaldo = listaSaldosAtuais.find(s => s.controleCod === ctrlInicial && (s.caixas > 0 || s.contentores > 0 || s.sacos > 0));
                  setFormSaida({
                    id: null,
                    data: dataHoje(),
                    controleCod: ctrlInicial,
                    fazendaNome: itemSaldo?.fazendaNome || '',
                    culturaNome: itemSaldo?.culturaNome || '',
                    pivoNome: itemSaldo?.pivoNome || '',
                    glebaNome: itemSaldo?.glebaNome || '',
                    variedadeNome: itemSaldo?.variedadeNome || '',
                    produtoNome: itemSaldo?.produtoNome || '',
                    localNome: itemSaldo?.localNome || '',
                    embalagem: itemSaldo?.caixas > 0 ? 'Caixa' : itemSaldo?.contentores > 0 ? 'Contentor' : 'Saco',
                    qtd: ''
                  });
                  setPaginaAtiva('saida');
                }}
              >
                📤 Saída
              </button>
            </div>
          </div>

          {/* TABELAS DE RESUMO POR CONTROLE E SAFRA */}
          <div id="containerResumoEstoque" className="tabela-wrapper">
            {resumoEstoque.length === 0 ? (
              <p className="vazio">Nenhum saldo ativo para exibir no momento.</p>
            ) : (
              resumoEstoque.map((bloco, bIdx) => (
                <div key={bIdx} style={{ marginTop: '10px', marginBottom: '8px' }}>
                  <div
                    style={{
                      backgroundColor: bloco.cor.bg,
                      color: 'white',
                      border: `1px solid ${bloco.cor.border}`,
                      textAlign: 'left',
                      padding: '5px 8px',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      borderRadius: '4px 4px 0 0',
                      textTransform: 'uppercase'
                    }}
                  >
                    CONTROLE DE ESTOQUE {bloco.nomeCultura} - SAFRA - {bloco.textoSafra}
                  </div>
                  <div className="tabela-wrapper">
                    <table className="tabela">
                      <thead>
                        <tr>
                          <th style={{ background: bloco.cor.th, border: `1px solid ${bloco.cor.thBorder}`, color: 'white' }}>CÓD</th>
                          <th style={{ background: bloco.cor.th, border: `1px solid ${bloco.cor.thBorder}`, color: 'white' }}>LOCAL</th>
                          <th style={{ background: bloco.cor.th, border: `1px solid ${bloco.cor.thBorder}`, color: 'white' }}>PRODUTO</th>
                          <th style={{ background: bloco.cor.th, border: `1px solid ${bloco.cor.thBorder}`, color: 'white' }}>FAZENDA / GLEBAS</th>
                          <th style={{ background: bloco.cor.th, border: `1px solid ${bloco.cor.thBorder}`, color: 'white' }}>VARIEDADES</th>
                          <th style={{ background: bloco.cor.th, border: `1px solid ${bloco.cor.thBorder}`, color: 'white' }}>CONTROLE</th>
                          {bloco.temCaixa && <th style={{ background: bloco.cor.th, border: `1px solid ${bloco.cor.thBorder}`, color: 'white' }}>CAIX</th>}
                          {bloco.temContentor && <th style={{ background: bloco.cor.th, border: `1px solid ${bloco.cor.thBorder}`, color: 'white' }}>CONT</th>}
                          {bloco.temSaco && <th style={{ background: bloco.cor.th, border: `1px solid ${bloco.cor.thBorder}`, color: 'white' }}>SAC</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {bloco.itens.map((f: any, fIdx: number) => (
                          <tr key={fIdx}>
                            <td><strong>{f.cod}</strong></td>
                            <td>{f.localNome}</td>
                            <td><strong>{f.produtoNomeLimpo}</strong></td>
                            <td>{f.localidadeCombinada}</td>
                            <td>{f.txtVariedade}</td>
                            <td>{f.controleCodigo}</td>
                            {bloco.temCaixa && (
                              <td style={{ fontWeight: 'bold', color: f.caixas < 0 ? '#dc3545' : '#0d47a1' }}>
                                {f.caixas < 0 ? '-' : ''}{Math.abs(f.caixas)}
                              </td>
                            )}
                            {bloco.temContentor && (
                              <td style={{ fontWeight: 'bold', color: f.contentores < 0 ? '#dc3545' : '#0d47a1' }}>
                                {f.contentores < 0 ? '-' : ''}{Math.abs(f.contentores)}
                              </td>
                            )}
                            {bloco.temSaco && (
                              <td style={{ fontWeight: 'bold', color: f.sacos < 0 ? '#dc3545' : '#0d47a1' }}>
                                {f.sacos < 0 ? '-' : ''}{Math.abs(f.sacos)}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TELA ENTRADA (TOTALMENTE INTERLIGADA COM O CONTROLE AGRÍCOLA) */}
      {/* ========================================================================= */}
      {paginaAtiva === 'entrada' && (
        <div className="card">
          <button className="btn btn-voltar" onClick={() => setPaginaAtiva('inicial')}>⬅️ Voltar</button>
          <h3 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 'bold' }}>📥 Entrada de Estoque</h3>

          <div>
            <label>Data da Entrada</label>
            <input type="date" value={formEntrada.data} onChange={(e) => setFormEntrada({ ...formEntrada, data: e.target.value })} />

            {/* SELEÇÃO DO NÚMERO DE CONTROLE INTERLIGADO */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', marginBottom: '2px' }}>
              <label style={{ margin: 0 }}>Número de Controle / Projeto (Interligado)</label>
              <button
                type="button"
                onClick={() => setPaginaAtiva('amarracoes')}
                style={{
                  fontSize: '11px',
                  background: '#f5f3ff',
                  color: '#6d28d9',
                  border: '1px solid #c4b5fd',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🔗 Criar / Ver Amarrações
              </button>
            </div>
            <select
              value={formEntrada.controleCod}
              onChange={(e) => {
                const cod = e.target.value;
                const match = controlesInterligados.find(c => c.controleCod === cod);
                setFormEntrada(prev => ({
                  ...prev,
                  controleCod: cod,
                  fazendaNome: match?.fazendaNome || prev.fazendaNome || fazendasDisponiveis[0] || '',
                  culturaNome: match?.culturaNome || prev.culturaNome || culturasDisponiveis[0] || '',
                  pivoNome: match?.pivoNome || prev.pivoNome || pivosDisponiveis[0] || '',
                  glebaNome: match?.glebaNome || prev.glebaNome || glebasDisponiveis[0] || '',
                  variedadeNome: match?.variedadeNome || getVariedadesParaCultura(match?.culturaNome || prev.culturaNome)[0] || '',
                  produtoNome: getProdutosParaCultura(match?.culturaNome || prev.culturaNome)[0] || ''
                }));
              }}
            >
              <option value="">Selecione o Controle...</option>
              {controlesInterligados.map(c => (
                <option key={c.controleCod} value={c.controleCod}>{c.label}</option>
              ))}
            </select>

            {/* CAMPOS INTERLIGADOS DE FAZENDA, CULTURA, PIVÔ E GLEBA */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '8px 0' }}>
              <div>
                <label>Fazenda (Cadastro Geral)</label>
                <select
                  value={formEntrada.fazendaNome}
                  onChange={(e) => setFormEntrada({ ...formEntrada, fazendaNome: e.target.value })}
                >
                  <option value="">Selecione a Fazenda</option>
                  {fazendasDisponiveis.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Cultura (Cadastro Geral)</label>
                <select
                  value={formEntrada.culturaNome}
                  onChange={(e) => {
                    const cult = e.target.value;
                    setFormEntrada({
                      ...formEntrada,
                      culturaNome: cult,
                      variedadeNome: getVariedadesParaCultura(cult)[0] || '',
                      produtoNome: getProdutosParaCultura(cult)[0] || ''
                    });
                  }}
                >
                  <option value="">Selecione a Cultura</option>
                  {culturasDisponiveis.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Pivô (Cadastro Geral)</label>
                <select
                  value={formEntrada.pivoNome}
                  onChange={(e) => setFormEntrada({ ...formEntrada, pivoNome: e.target.value })}
                >
                  <option value="">Selecione o Pivô</option>
                  {pivosDisponiveis.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Gleba (Cadastro Geral)</label>
                <select
                  value={formEntrada.glebaNome}
                  onChange={(e) => setFormEntrada({ ...formEntrada, glebaNome: e.target.value })}
                >
                  <option value="">Selecione a Gleba</option>
                  {glebasDisponiveis.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label>Variedade (Vinculada à Cultura)</label>
                <select
                  value={formEntrada.variedadeNome}
                  onChange={(e) => setFormEntrada({ ...formEntrada, variedadeNome: e.target.value })}
                >
                  <option value="">Selecione a Variedade</option>
                  {getVariedadesParaCultura(formEntrada.culturaNome).map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Tipo de Embalagem</label>
                <select
                  value={formEntrada.embalagem}
                  onChange={(e) => setFormEntrada({ ...formEntrada, embalagem: e.target.value })}
                >
                  <option value="Caixa">Caixa</option>
                  <option value="Saco">Saco</option>
                  <option value="Contentor">Contentor / Bin</option>
                </select>
              </div>
            </div>

            <label>Produto (Classificação Comercial)</label>
            <select
              value={formEntrada.produtoNome}
              onChange={(e) => setFormEntrada({ ...formEntrada, produtoNome: e.target.value })}
            >
              <option value="">Selecione o Produto</option>
              {getProdutosParaCultura(formEntrada.culturaNome).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <label>Local de Armazenamento</label>
            <select
              value={formEntrada.localNome}
              onChange={(e) => setFormEntrada({ ...formEntrada, localNome: e.target.value })}
            >
              {LOCAIS_ARMAZENAMENTO_PADRAO.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            <label>Quantidade (unidades)</label>
            <input
              type="number"
              min="1"
              value={formEntrada.qtd}
              onChange={(e) => setFormEntrada({ ...formEntrada, qtd: e.target.value })}
              placeholder="Ex: 120"
            />

            <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
              <button className="btn btn-salvar" onClick={salvarEntrada}>✅ Lançar Entrada</button>
              <button className="btn btn-cancelar" onClick={() => setPaginaAtiva('inicial')}>❌ Cancelar</button>
            </div>

            {msgEntrada && <div className={`resultado ${msgEntrada.tipo}`}>{msgEntrada.texto}</div>}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2.5. TELA DE AMARRAÇÕES (VINCULA SAFRA, FAZENDA, PIVÔ, MÚLTIPLAS GLEBAS, VARIEDADES E SANKHYA) */}
      {/* ========================================================================= */}
      {paginaAtiva === 'amarracoes' && (
        <div className="card" style={{ borderTop: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <button className="btn btn-voltar" style={{ margin: 0 }} onClick={() => setPaginaAtiva('inicial')}>⬅️ Voltar ao Estoque</button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn"
                style={{ background: '#e3f2fd', color: '#0d47a1', border: '1px solid #90caf9', height: '30px', padding: '0 10px', fontSize: '12px' }}
                onClick={() => {
                  setPaginaAtiva('entrada');
                }}
              >
                📥 Ir para Entrada
              </button>
              <button
                type="button"
                className="btn"
                style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', height: '30px', padding: '0 10px', fontSize: '12px' }}
                onClick={() => {
                  setPaginaAtiva('saida');
                }}
              >
                📤 Ir para Saída
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>
              🔗
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#5b21b6' }}>
                Central de Marcações e Amarrações do Estoque
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#6b7280' }}>
                Vincule Fazenda, Pivô, múltiplas Glebas e Variedades. O sistema cruza com o Projeto Sankhya e identifica o lote para entrada e saída.
              </p>
            </div>
          </div>

          {/* FORMULÁRIO DE CADASTRO / EDIÇÃO DE AMARRAÇÃO */}
          <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '12px', marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold', color: '#6b21a8', fontSize: '13px' }}>
                {formAmarracao.id ? '✏️ Editando Amarração' : '➕ Nova Amarração para o Estoque'}
              </span>
              <span style={{ fontSize: '11px', color: '#7e22ce', background: '#f3e8ff', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                Código: {formAmarracao.codigoMarca.trim() || getProximoCodigoAmarracao()}
              </span>
            </div>

            <form onSubmit={(e) => salvarAmarracao(e, false)}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                {/* CÓDIGO DA MARCA / CONTROLE */}
                <div>
                  <label>Código da Marca / Controle</label>
                  <input
                    type="text"
                    placeholder={`Ex: ${getProximoCodigoAmarracao()}`}
                    value={formAmarracao.codigoMarca}
                    onChange={(e) => setFormAmarracao({ ...formAmarracao, codigoMarca: e.target.value })}
                  />
                </div>

                {/* ANO / SAFRA */}
                <div>
                  <label>Ano Safra</label>
                  <select
                    value={formAmarracao.ano}
                    onChange={(e) => {
                      setFormAmarracao(prev => ({
                        ...prev,
                        ano: e.target.value,
                        glebas: [],
                        variedades: []
                      }));
                      setMostrarTodasGlebas(false);
                      setMostrarTodasVariedades(false);
                    }}
                  >
                    <option value="2025/26">2025/26 (Safra Atual)</option>
                    <option value="2026/27">2026/27</option>
                    <option value="2024/25">2024/25</option>
                    <option value="2023/24">2023/24</option>
                  </select>
                </div>

                {/* CULTURA */}
                <div>
                  <label>Cultura *</label>
                  <select
                    value={formAmarracao.cultura}
                    onChange={(e) => {
                      const cult = e.target.value;
                      setFormAmarracao(prev => ({
                        ...prev,
                        cultura: cult,
                        variedades: [],
                        glebas: []
                      }));
                      setMostrarTodasGlebas(false);
                      setMostrarTodasVariedades(false);
                    }}
                  >
                    <option value="">Selecione a Cultura...</option>
                    {culturasDisponiveis.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* FAZENDA */}
                <div>
                  <label>Fazenda *</label>
                  <select
                    value={formAmarracao.fazenda}
                    onChange={(e) => {
                      const faz = e.target.value;
                      setFormAmarracao(prev => ({
                        ...prev,
                        fazenda: faz,
                        glebas: [],
                        variedades: []
                      }));
                      setMostrarTodasGlebas(false);
                      setMostrarTodasVariedades(false);
                    }}
                  >
                    <option value="">Selecione a Fazenda...</option>
                    {fazendasDisponiveis.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                {/* PIVÔ */}
                <div>
                  <label>Pivô</label>
                  <select
                    value={formAmarracao.pivo}
                    onChange={(e) => {
                      const piv = e.target.value;
                      setFormAmarracao(prev => ({
                        ...prev,
                        pivo: piv,
                        glebas: [],
                        variedades: []
                      }));
                      setMostrarTodasGlebas(false);
                      setMostrarTodasVariedades(false);
                    }}
                  >
                    <option value="">Selecione o Pivô...</option>
                    {pivosDisponiveis.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* HECTARES */}
                <div>
                  <label>Área (ha)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 85.5"
                    value={formAmarracao.hectares}
                    onChange={(e) => setFormAmarracao({ ...formAmarracao, hectares: e.target.value })}
                  />
                </div>
              </div>

              {/* SELEÇÃO MÚLTIPLA DE GLEBAS (FILTRADAS PELA CENTRAL DE AMARRAÇÕES) */}
              <div style={{ marginTop: '10px', background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                  <label style={{ margin: 0, fontWeight: 'bold', color: '#334155' }}>
                    🌱 Glebas Vinculadas ({formAmarracao.glebas.length} selecionada{formAmarracao.glebas.length === 1 ? '' : 's'})
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      style={{ fontSize: '11px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}
                      onClick={() => {
                        setFormAmarracao(prev => ({ ...prev, glebas: Array.from(new Set([...prev.glebas, ...glebasParaExibir])) }));
                      }}
                    >
                      Selecionar Todas
                    </button>
                    <button
                      type="button"
                      style={{ fontSize: '11px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}
                      onClick={() => setFormAmarracao(prev => ({ ...prev, glebas: [] }))}
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                {/* Banner de status do vínculo da Central de Amarrações */}
                {vinculoCentralAmarracao.glebasVinculadas.length > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#166534' }}>
                      <span style={{ fontSize: '14px' }}>🔗</span>
                      <span>
                        <strong>Vínculo Central de Amarrações:</strong> {vinculoCentralAmarracao.glebasVinculadas.length} gleba(s) vinculada(s) localizada(s) ({vinculoCentralAmarracao.glebasVinculadas.join(', ')})
                        {vinculoCentralAmarracao.amarracoesEncontradas.length > 0 && ` [${vinculoCentralAmarracao.amarracoesEncontradas.map(a => a.codigoMarca || a.id).join(', ')}]`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMostrarTodasGlebas(prev => !prev)}
                      style={{ fontSize: '11px', color: '#15803d', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      {mostrarTodasGlebas ? '🔒 Ver apenas vinculadas' : '👁️ Ver todas do sistema'}
                    </button>
                  </div>
                ) : formAmarracao.pivo && formAmarracao.fazenda ? (
                  <div style={{ padding: '6px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '8px', fontSize: '12px', color: '#64748b' }}>
                    ℹ️ Nenhuma amarração anterior localizada na Central para {formAmarracao.fazenda} - {formAmarracao.pivo} ({formAmarracao.ano}). Exibindo todas as glebas para você criar este vínculo.
                  </div>
                ) : (
                  <div style={{ padding: '6px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '8px', fontSize: '12px', color: '#64748b' }}>
                    💡 Selecione <strong>Ano Safra</strong>, <strong>Cultura</strong>, <strong>Fazenda</strong> e <strong>Pivô</strong> acima para cruzar e carregar as glebas vinculadas na Central.
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '110px', overflowY: 'auto', padding: '4px' }}>
                  {glebasParaExibir.length === 0 ? (
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Nenhuma gleba disponível para a seleção atual.</span>
                  ) : (
                    glebasParaExibir.map(nomeGleba => {
                      const checked = formAmarracao.glebas.includes(nomeGleba);
                      return (
                        <button
                          key={nomeGleba}
                          type="button"
                          onClick={() => {
                            setFormAmarracao(prev => ({
                              ...prev,
                              glebas: checked ? prev.glebas.filter(g => g !== nomeGleba) : [...prev.glebas, nomeGleba]
                            }));
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            border: checked ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                            background: checked ? '#dcfce7' : '#ffffff',
                            color: checked ? '#14532d' : '#475569',
                            fontWeight: checked ? 'bold' : 'normal',
                            transition: 'all 0.15s'
                          }}
                        >
                          <span>{checked ? '✓' : '+'}</span>
                          <span>{nomeGleba}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* SELEÇÃO MÚLTIPLA DE VARIEDADES (FILTRADAS PELA CENTRAL DE AMARRAÇÕES) */}
              <div style={{ marginTop: '10px', background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                  <label style={{ margin: 0, fontWeight: 'bold', color: '#334155' }}>
                    🌾 Variedades Vinculadas ({formAmarracao.variedades.length} selecionada{formAmarracao.variedades.length === 1 ? '' : 's'})
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      style={{ fontSize: '11px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}
                      onClick={() => {
                        setFormAmarracao(prev => ({ ...prev, variedades: Array.from(new Set([...prev.variedades, ...variedadesParaExibir])) }));
                      }}
                    >
                      Selecionar Todas
                    </button>
                    <button
                      type="button"
                      style={{ fontSize: '11px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}
                      onClick={() => setFormAmarracao(prev => ({ ...prev, variedades: [] }))}
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                {/* Banner de status do vínculo da Central de Amarrações */}
                {vinculoCentralAmarracao.variedadesVinculadas.length > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#1e40af' }}>
                      <span style={{ fontSize: '14px' }}>🌾</span>
                      <span>
                        <strong>Vínculo Central de Amarrações:</strong> {vinculoCentralAmarracao.variedadesVinculadas.length} variedade(s) vinculada(s) localizada(s) ({vinculoCentralAmarracao.variedadesVinculadas.join(', ')})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMostrarTodasVariedades(prev => !prev)}
                      style={{ fontSize: '11px', color: '#1d4ed8', background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      {mostrarTodasVariedades ? '🔒 Ver apenas vinculadas' : '👁️ Ver todas do sistema'}
                    </button>
                  </div>
                ) : formAmarracao.pivo && formAmarracao.fazenda ? (
                  <div style={{ padding: '6px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '8px', fontSize: '12px', color: '#64748b' }}>
                    ℹ️ Nenhuma amarração anterior localizada na Central para {formAmarracao.fazenda} - {formAmarracao.pivo} ({formAmarracao.ano}). Exibindo variedades cadastradas para a cultura.
                  </div>
                ) : (
                  <div style={{ padding: '6px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '8px', fontSize: '12px', color: '#64748b' }}>
                    💡 Selecione <strong>Ano Safra</strong>, <strong>Cultura</strong>, <strong>Fazenda</strong> e <strong>Pivô</strong> acima para cruzar e carregar as variedades vinculadas na Central.
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '110px', overflowY: 'auto', padding: '4px' }}>
                  {variedadesParaExibir.length === 0 ? (
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Nenhuma variedade disponível para a cultura atual.</span>
                  ) : (
                    variedadesParaExibir.map(nomeVar => {
                      const checked = formAmarracao.variedades.includes(nomeVar);
                      return (
                        <button
                          key={nomeVar}
                          type="button"
                          onClick={() => {
                            setFormAmarracao(prev => ({
                              ...prev,
                              variedades: checked ? prev.variedades.filter(v => v !== nomeVar) : [...prev.variedades, nomeVar]
                            }));
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            border: checked ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                            background: checked ? '#dbeafe' : '#ffffff',
                            color: checked ? '#1e3a8a' : '#475569',
                            fontWeight: checked ? 'bold' : 'normal',
                            transition: 'all 0.15s'
                          }}
                        >
                          <span>{checked ? '✓' : '+'}</span>
                          <span>{nomeVar}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ANÁLISE E CRONOMETRIA COM PROJETO SANKHYA */}
              <div style={{ marginTop: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '15px' }}>⚡</span>
                    <strong style={{ color: '#166534', fontSize: '13px' }}>
                      Reconhecimento Inteligente Sankhya (Hortifrúti: Cultura + Fazenda + Pivô)
                    </strong>
                  </div>
                  {sankhyaMatchForAmarracao.matches.length > 0 ? (
                    <span style={{ fontSize: '11px', background: '#16a34a', color: '#ffffff', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                      ✓ {sankhyaMatchForAmarracao.matches.length} projeto(s) Hortifrúti localizado(s)
                    </span>
                  ) : (formAmarracao.cultura && formAmarracao.fazenda && formAmarracao.pivo) ? (
                    <span style={{ fontSize: '11px', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                      Nenhum projeto Sankhya localizado
                    </span>
                  ) : null}
                </div>

                {sankhyaMatchForAmarracao.matches.length > 0 && (
                  <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '6px', padding: '8px 10px', marginBottom: '10px', fontSize: '12px', color: '#14532d' }}>
                    <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>✓ Projeto Detectado:</span>
                      <span style={{ background: '#ffffff', padding: '1px 6px', borderRadius: '4px', border: '1px solid #86efac', color: '#166534' }}>
                        {formAmarracao.projetoSankhya || sankhyaMatchForAmarracao.projetoSankhya}
                      </span>
                      {(formAmarracao.descricaoLote || sankhyaMatchForAmarracao.descricaoLote) && (
                        <>
                          <span style={{ marginLeft: '4px' }}>| Lote:</span>
                          <span style={{ background: '#ffffff', padding: '1px 6px', borderRadius: '4px', border: '1px solid #86efac', color: '#166534' }}>
                            {formAmarracao.descricaoLote || sankhyaMatchForAmarracao.descricaoLote}
                          </span>
                        </>
                      )}
                    </div>
                    {sankhyaMatchForAmarracao.identificacaoSankhya && (
                      <div style={{ fontSize: '11px', color: '#15803d', marginTop: '3px', fontStyle: 'italic' }}>
                        Identificação Sankhya: <strong>{sankhyaMatchForAmarracao.identificacaoSankhya}</strong>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#14532d', fontWeight: 'bold' }}>Projeto Sankhya Detectado</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input
                        type="text"
                        placeholder="Ex: 101100405"
                        value={formAmarracao.projetoSankhya || sankhyaMatchForAmarracao.projetoSankhya}
                        onChange={(e) => setFormAmarracao({ ...formAmarracao, projetoSankhya: e.target.value })}
                        style={{ background: '#ffffff', borderColor: '#86efac' }}
                      />
                      {sankhyaMatchForAmarracao.matches.length > 1 && (
                        <select
                          style={{ width: '140px', background: '#ffffff', borderColor: '#86efac', fontSize: '11px' }}
                          value={formAmarracao.projetoSankhya}
                          onChange={(e) => {
                            const matchItem = sankhyaMatchForAmarracao.matches.find(m => m.project.projeto === e.target.value);
                            if (matchItem) {
                              setFormAmarracao(prev => ({
                                ...prev,
                                projetoSankhya: matchItem.project.projeto,
                                identificacaoSankhya: matchItem.project.identificacao,
                                descricaoLote: matchItem.project.descricaoLote || prev.descricaoLote
                              }));
                            }
                          }}
                        >
                          <option value="">Outros projetos ({sankhyaMatchForAmarracao.matches.length})...</option>
                          {sankhyaMatchForAmarracao.matches.map(m => (
                            <option key={m.project.projeto} value={m.project.projeto}>
                              {m.project.projeto} - {m.project.descricaoLote || m.project.identificacao}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#14532d', fontWeight: 'bold' }}>Descrição do Lote Sankhya (Usado no Estoque)</label>
                    <input
                      type="text"
                      placeholder="Ex: LOTE-01 / CEB-P02"
                      value={formAmarracao.descricaoLote || sankhyaMatchForAmarracao.descricaoLote}
                      onChange={(e) => setFormAmarracao({ ...formAmarracao, descricaoLote: e.target.value })}
                      style={{ background: '#ffffff', borderColor: '#86efac', fontWeight: 'bold', color: '#166534' }}
                    />
                  </div>
                </div>

                {(!sankhyaMatchForAmarracao.matches || sankhyaMatchForAmarracao.matches.length === 0) && formAmarracao.cultura && formAmarracao.fazenda && formAmarracao.pivo && (
                  <div style={{ fontSize: '11px', color: '#92400e', marginTop: '6px', background: '#fffbeb', padding: '6px 8px', borderRadius: '4px', border: '1px solid #fef3c7' }}>
                    💡 Dica: Nenhum projeto Sankhya de Hortifrúti cadastrado para "{formAmarracao.cultura} + {formAmarracao.fazenda} + {formAmarracao.pivo}" na Safra {formAmarracao.ano}. Você pode preencher manualmente o número do projeto e lote acima.
                  </div>
                )}
              </div>

              {/* OBSERVAÇÃO */}
              <div style={{ marginTop: '8px' }}>
                <label>Observação da Amarração</label>
                <input
                  type="text"
                  placeholder="Anotação opcional sobre esta amarração ou lote..."
                  value={formAmarracao.observacao}
                  onChange={(e) => setFormAmarracao({ ...formAmarracao, observacao: e.target.value })}
                />
              </div>

              {/* BOTÕES DE AÇÃO DO FORMULÁRIO */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  className="btn"
                  style={{ background: '#6d28d9', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  💾 {formAmarracao.id ? 'Salvar Alterações' : 'Salvar Amarração'}
                </button>

                <button
                  type="button"
                  className="btn"
                  style={{ background: '#059669', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => salvarAmarracao(undefined, true)}
                >
                  📥 Salvar e Lançar Entrada Agora
                </button>

                <button
                  type="button"
                  className="btn"
                  style={{ background: '#64748b', color: 'white' }}
                  onClick={() => {
                    setFormAmarracao({
                      id: null,
                      codigoMarca: '',
                      ano: '2025/26',
                      cultura: '',
                      fazenda: '',
                      pivo: '',
                      glebas: [],
                      variedades: [],
                      projetoSankhya: '',
                      descricaoLote: '',
                      identificacaoSankhya: '',
                      hectares: '',
                      observacao: ''
                    });
                    setMsgAmarracao(null);
                  }}
                >
                  🧹 Limpar
                </button>
              </div>

              {msgAmarracao && (
                <div className={`resultado ${msgAmarracao.tipo}`} style={{ marginTop: '8px' }}>
                  {msgAmarracao.texto}
                </div>
              )}
            </form>
          </div>

          {/* LISTAGEM DE AMARRAÇÕES CADASTRADAS */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>
                📋 Amarrações Hortifrúti Registradas ({amarracoesHortifruti.length})
              </h4>
              <input
                type="text"
                placeholder="Filtrar por código, cultura, fazenda, lote..."
                value={filtroAmarracao}
                onChange={(e) => setFiltroAmarracao(e.target.value)}
                style={{ width: '260px', height: '30px', margin: 0, fontSize: '12px' }}
              />
            </div>

            {amarracoesHortifruti.length === 0 ? (
              <div className="vazio" style={{ background: '#ffffff', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                Nenhuma amarração de hortifrúti cadastrada no momento. Crie sua amarração no formulário acima para vincular automaticamente com o projeto Sankhya e integrar com as entradas e saídas de estoque.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {amarracoesHortifruti
                  .filter(a => {
                    if (!filtroAmarracao) return true;
                    const termo = filtroAmarracao.toLowerCase();
                    return (
                      (a.codigoMarca && a.codigoMarca.toLowerCase().includes(termo)) ||
                      (a.cultura && a.cultura.toLowerCase().includes(termo)) ||
                      (a.fazenda && a.fazenda.toLowerCase().includes(termo)) ||
                      (a.pivo && a.pivo.toLowerCase().includes(termo)) ||
                      (a.descricaoLote && a.descricaoLote.toLowerCase().includes(termo)) ||
                      (a.projetoSankhya && a.projetoSankhya.toLowerCase().includes(termo))
                    );
                  })
                  .map((a: any) => {
                    const glebasLista = Array.isArray(a.glebas) && a.glebas.length > 0 ? a.glebas : (a.gleba ? [a.gleba] : []);
                    const variedadesLista = Array.isArray(a.variedades) && a.variedades.length > 0 ? a.variedades : (a.variedade ? [a.variedade] : []);

                    return (
                      <div
                        key={a.id || a.codigoMarca}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#6d28d9', background: '#f5f3ff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #ddd6fe' }}>
                              🔗 {a.codigoMarca || 'S/CÓD'}
                            </span>
                            <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>
                              {a.fazenda} {a.pivo ? `• ${a.pivo}` : ''}
                            </span>
                            <span style={{ fontSize: '11px', background: '#dcfce7', color: '#14532d', padding: '1px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                              {a.cultura}
                            </span>
                            <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '10px' }}>
                              Safra {a.ano || '2025/26'}
                            </span>
                            {a.descricaoLote && (
                              <span style={{ fontSize: '11px', background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                                🏷️ Lote: {a.descricaoLote}
                              </span>
                            )}
                            {a.projetoSankhya && (
                              <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '10px' }}>
                                Sankhya: {a.projetoSankhya}
                              </span>
                            )}
                          </div>

                          {/* AÇÕES DA AMARRAÇÃO: LANÇAR ENTRADA, LANÇAR SAÍDA, EDITAR, EXCLUIR */}
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              type="button"
                              title="Lançar Entrada para esta amarração"
                              style={{ background: '#e3f2fd', color: '#0d47a1', border: '1px solid #90caf9', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                              onClick={() => lancarEntradaParaAmarracao(a)}
                            >
                              📥 Entrada
                            </button>
                            <button
                              type="button"
                              title="Lançar Saída para esta amarração"
                              style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                              onClick={() => lancarSaidaParaAmarracao(a)}
                            >
                              📤 Saída
                            </button>
                            <button
                              type="button"
                              title="Editar amarração"
                              style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 6px', fontSize: '11px', cursor: 'pointer' }}
                              onClick={() => {
                                setFormAmarracao({
                                  id: a.id || null,
                                  codigoMarca: a.codigoMarca || '',
                                  ano: a.ano || '2025/26',
                                  cultura: a.cultura || '',
                                  fazenda: a.fazenda || '',
                                  pivo: a.pivo || '',
                                  glebas: glebasLista,
                                  variedades: variedadesLista,
                                  projetoSankhya: a.projetoSankhya || '',
                                  descricaoLote: a.descricaoLote || '',
                                  identificacaoSankhya: a.identificacaoSankhya || '',
                                  hectares: a.hectares || '',
                                  observacao: a.observacao || ''
                                });
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              title="Remover amarração"
                              style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '4px', padding: '3px 6px', fontSize: '11px', cursor: 'pointer' }}
                              onClick={() => excluirAmarracao(a.id, a.codigoMarca)}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        {/* DETALHES DE GLEBAS E VARIEDADES */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          <div>
                            <strong style={{ color: '#334155' }}>Glebas ({glebasLista.length}): </strong>
                            {glebasLista.length > 0 ? (
                              <span style={{ color: '#15803d', fontWeight: '500' }}>{glebasLista.join(', ')}</span>
                            ) : (
                              <span style={{ fontStyle: 'italic' }}>Nenhuma vinculada</span>
                            )}
                          </div>
                          <div>
                            <strong style={{ color: '#334155' }}>Variedades ({variedadesLista.length}): </strong>
                            {variedadesLista.length > 0 ? (
                              <span style={{ color: '#1d4ed8', fontWeight: '500' }}>{variedadesLista.join(', ')}</span>
                            ) : (
                              <span style={{ fontStyle: 'italic' }}>Nenhuma vinculada</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TELA SAÍDA (TOTALMENTE INTERLIGADA COM OS SALDOS DO SISTEMA) */}
      {/* ========================================================================= */}
      {paginaAtiva === 'saida' && (
        <div className="card">
          <button className="btn btn-voltar" onClick={() => setPaginaAtiva('inicial')}>⬅️ Voltar</button>
          <h3 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 'bold' }}>📤 Saída de Estoque</h3>

          <div>
            <label>Data da Saída</label>
            <input type="date" value={formSaida.data} onChange={(e) => setFormSaida({ ...formSaida, data: e.target.value })} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', marginBottom: '2px' }}>
              <label style={{ margin: 0 }}>Número de Controle com Saldo</label>
              <button
                type="button"
                onClick={() => setPaginaAtiva('amarracoes')}
                style={{
                  fontSize: '11px',
                  background: '#f5f3ff',
                  color: '#6d28d9',
                  border: '1px solid #c4b5fd',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🔗 Ver Amarrações
              </button>
            </div>
            <select
              value={formSaida.controleCod}
              onChange={(e) => {
                const cod = e.target.value;
                const primeiroComSaldo = listaSaldosAtuais.find(s => s.controleCod === cod && (s.caixas > 0 || s.contentores > 0 || s.sacos > 0));
                setFormSaida({
                  ...formSaida,
                  controleCod: cod,
                  fazendaNome: primeiroComSaldo?.fazendaNome || '',
                  culturaNome: primeiroComSaldo?.culturaNome || '',
                  pivoNome: primeiroComSaldo?.pivoNome || '',
                  glebaNome: primeiroComSaldo?.glebaNome || '',
                  variedadeNome: primeiroComSaldo?.variedadeNome || '',
                  produtoNome: primeiroComSaldo?.produtoNome || '',
                  localNome: primeiroComSaldo?.localNome || '',
                  embalagem: primeiroComSaldo?.caixas > 0 ? 'Caixa' : primeiroComSaldo?.contentores > 0 ? 'Contentor' : 'Saco'
                });
              }}
            >
              <option value="">Selecione o Controle com saldo...</option>
              {controlesComSaldoParaSaida.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* ITENS DISPONÍVEIS NESTE CONTROLE */}
            <label>Produto / Lote Disponível no Controle</label>
            <select
              value={formSaida.produtoNome}
              onChange={(e) => {
                const prod = e.target.value;
                const match = itensComSaldoNoControleSaida.find(s => s.produtoNome === prod);
                if (match) {
                  setFormSaida({
                    ...formSaida,
                    produtoNome: prod,
                    localNome: match.localNome,
                    variedadeNome: match.variedadeNome,
                    glebaNome: match.glebaNome,
                    embalagem: match.caixas > 0 ? 'Caixa' : match.contentores > 0 ? 'Contentor' : 'Saco'
                  });
                } else {
                  setFormSaida({ ...formSaida, produtoNome: prod });
                }
              }}
            >
              <option value="">Selecione o Produto em estoque...</option>
              {Array.from(new Set(itensComSaldoNoControleSaida.map(s => s.produtoNome))).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '8px 0' }}>
              <div>
                <label>Fazenda</label>
                <input type="text" disabled value={formSaida.fazendaNome} />
              </div>
              <div>
                <label>Cultura</label>
                <input type="text" disabled value={formSaida.culturaNome} />
              </div>
              <div>
                <label>Pivô</label>
                <input type="text" disabled value={formSaida.pivoNome} />
              </div>
              <div>
                <label>Gleba</label>
                <input type="text" disabled value={formSaida.glebaNome} />
              </div>
            </div>

            <label>Variedade</label>
            <input type="text" disabled value={formSaida.variedadeNome} />

            <label>Local de Armazenamento</label>
            <select
              value={formSaida.localNome}
              onChange={(e) => setFormSaida({ ...formSaida, localNome: e.target.value })}
            >
              <option value="">Selecione o Local...</option>
              {Array.from(new Set(itensComSaldoNoControleSaida.map(s => s.localNome))).map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            <label>Tipo de Embalagem</label>
            <select
              value={formSaida.embalagem}
              onChange={(e) => setFormSaida({ ...formSaida, embalagem: e.target.value })}
            >
              <option value="Caixa">Caixa</option>
              <option value="Saco">Saco</option>
              <option value="Contentor">Contentor / Bin</option>
            </select>

            {/* SALDO EM TEMPO REAL */}
            {(() => {
              const chave = `${formSaida.controleCod}_${formSaida.localNome}_${formSaida.produtoNome}_${formSaida.variedadeNome}_${formSaida.glebaNome}`;
              const s = saldosAtuais[chave];
              let saldoAtual = 0;
              if (s) {
                if (formSaida.embalagem === 'Caixa') saldoAtual = s.caixas;
                else if (formSaida.embalagem === 'Contentor') saldoAtual = s.contentores;
                else if (formSaida.embalagem === 'Saco') saldoAtual = s.sacos;
              }
              return (
                <div style={{ padding: '6px 10px', background: '#e3f2fd', borderRadius: '4px', margin: '6px 0', fontSize: '12px', color: '#0d47a1', fontWeight: 'bold' }}>
                  Saldo disponível neste lote: {saldoAtual} {formSaida.embalagem || 'unidades'}
                </div>
              );
            })()}

            <label>Quantidade a Baixar (unidades)</label>
            <input
              type="number"
              min="1"
              value={formSaida.qtd}
              onChange={(e) => setFormSaida({ ...formSaida, qtd: e.target.value })}
              placeholder="Ex: 50"
            />

            <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
              <button className="btn btn-salvar" onClick={salvarSaida}>✅ Lançar Saída</button>
              <button className="btn btn-cancelar" onClick={() => setPaginaAtiva('inicial')}>❌ Cancelar</button>
            </div>

            {msgSaida && <div className={`resultado ${msgSaida.tipo}`}>{msgSaida.texto}</div>}
          </div>
        </div>
      )}
    </div>
  );
};
