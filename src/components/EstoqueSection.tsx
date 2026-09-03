import React, { useState, useMemo } from 'react';

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
  placaVeiculo: string;
  pesoLiquidoKg: number;
  unidade: string;
  itens?: any[];
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
  motoristas?: any[];
  onSaveEstoqueItem?: (item: EstoqueItem) => void;
  onDeleteEstoqueItem?: (id: string) => void;
  onSaveRomaneio?: (romaneio: RomaneioItem, baixarEstoque: boolean) => void;
  onDeleteRomaneio?: (id: string) => void;
  onSaveMovimentacao?: (mov: EstoqueMovimentacao) => void;
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
  showToast
}) => {
  // Navigation State
  const [paginaAtiva, setPaginaAtiva] = useState<'inicial' | 'entrada' | 'saida'>('inicial');

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

  // 1. Culturas interligadas
  const culturasDisponiveis = useMemo(() => {
    if (culturas && culturas.length > 0) {
      return culturas.map(c => c.nome.trim()).filter(Boolean);
    }
    return ['Cenoura', 'Cebola', 'Alho', 'Batata', 'Milho Doce'];
  }, [culturas]);

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

  // 7. Controles / Projetos interligados com Projetos Sankhya + BdColheita + BdPlantio
  const controlesInterligados = useMemo(() => {
    const mapa = new Map<string, { controleCod: string; safra: string; fazendaNome?: string; culturaNome?: string; pivoNome?: string; glebaNome?: string; variedadeNome?: string; label: string }>();

    // Origem 1: Projetos Sankhya
    if (projetosSankhya && projetosSankhya.length > 0) {
      projetosSankhya.forEach(p => {
        const cod = p.projeto?.trim();
        if (!cod) return;
        const safra = p.safra || '2025/26';
        mapa.set(cod, {
          controleCod: cod,
          safra,
          label: `${cod} (${p.identificacao || 'Sankhya'} - Safra ${safra})`
        });
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
  }, [projetosSankhya, colheitaData, plantioData]);

  // =========================================================================
  // CÁLCULO DE SALDOS DE ESTOQUE
  // =========================================================================
  const saldosAtuais = useMemo(() => {
    const saldos: Record<string, {
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
    }> = {};

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

  // Controles que possuem saldo positivo para Saída
  const controlesComSaldoParaSaida = useMemo(() => {
    const setControles = new Set<string>();
    Object.values(saldosAtuais).forEach(s => {
      if (s.caixas > 0 || s.contentores > 0 || s.sacos > 0) {
        setControles.add(s.controleCod);
      }
    });
    return Array.from(setControles);
  }, [saldosAtuais]);

  // Itens de saldo para o Controle selecionado na Saída
  const itensComSaldoNoControleSaida = useMemo(() => {
    if (!formSaida.controleCod) return [];
    return Object.values(saldosAtuais).filter(s =>
      s.controleCod === formSaida.controleCod && (s.caixas > 0 || s.contentores > 0 || s.sacos > 0)
    );
  }, [formSaida.controleCod, saldosAtuais]);

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

  // Sincronização direta das cargas colhidas em BdColheita
  const sincronizarCargasColheita = () => {
    if (!colheitaData || colheitaData.length === 0) {
      if (showToast) showToast('Nenhum apontamento em BdColheita para sincronizar.', 'info');
      return;
    }

    const novasEntradas = [...entradas];
    let inseridos = 0;

    colheitaData.forEach(c => {
      const idRef = `colh_${c.id || `${c.data}_${c.os}_${c.fazenda}_${c.pivo}_${c.gleba}`}`;
      // Evita duplicar carga já sincronizada
      const jaExiste = novasEntradas.some(e => e.origemColheitaId === idRef);
      if (!jaExiste) {
        const qtdNum = parseInt(c.caixasCortadas || c.qtdColhida || c.qtdColhido || '0', 10);
        if (qtdNum > 0) {
          const os = c.os?.trim() || c.cCusto?.trim();
          const controleCod = os ? `CTR-${os}` : `CTR-${c.ano || '2025/26'}-${c.pivo || '01'}`;
          const embalagem = c.embalagem || c.caixaBinBag || 'Caixa';
          novasEntradas.push({
            id: Date.now() + Math.floor(Math.random() * 1000),
            data: c.data || dataHoje(),
            controleCod,
            fazendaNome: c.fazenda || 'Fazenda Cristalina',
            culturaNome: c.cultura || 'Cenoura',
            pivoNome: c.pivo || '',
            glebaNome: c.gleba || '',
            variedadeNome: c.variedade || '',
            produtoNome: 'Padrão Comercial',
            localNome: 'Câmara Fria 01',
            embalagem: embalagem.includes('Contentor') || embalagem.includes('Bin') ? 'Contentor' : embalagem.includes('Saco') || embalagem.includes('Bag') ? 'Saco' : 'Caixa',
            qtd: qtdNum,
            origemColheitaId: idRef
          });
          inseridos++;
        }
      }
    });

    if (inseridos > 0) {
      setEntradas(novasEntradas);
      persistirDados(novasEntradas, saidas);
      if (showToast) showToast(`Sincronização concluída: ${inseridos} cargas de BdColheita inseridas no Estoque!`, 'success');
    } else {
      if (showToast) showToast('O Estoque já está totalmente sincronizado com BdColheita.', 'info');
    }
  };

  // =========================================================================
  // AGRUPAMENTO E FORMATAÇÃO DA TABELA PRINCIPAL
  // =========================================================================
  const resumoEstoque = useMemo(() => {
    const termo = filtroGeral.toLowerCase().trim();
    const grupos: Record<string, typeof saldosAtuais[keyof typeof saldosAtuais][]> = {};

    Object.values(saldosAtuais).forEach(item => {
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
        .app-estoque-intacto .botoes-principais { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .app-estoque-intacto .btn-principal { width: 100%; padding: 10px 8px; border: 1px solid #0d47a1; border-radius: 6px; font-size: 13px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; background: #e3f2fd; color: #0d47a1; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
        .app-estoque-intacto .btn-principal:hover { background: #d4e8fc; }
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

            {/* BOTÕES DE AÇÃO: ENTRADA, SAÍDA E SINCRONIZAR COM BDCOLHEITA */}
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
                className="btn-principal"
                onClick={() => {
                  const ctrlInicial = controlesComSaldoParaSaida[0] || '';
                  const itemSaldo = Object.values(saldosAtuais).find(s => s.controleCod === ctrlInicial && (s.caixas > 0 || s.contentores > 0 || s.sacos > 0));
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

            {/* BOTÃO DE INTERLIGAÇÃO DIRETA COM AS CARGAS COLHIDAS */}
            {colheitaData && colheitaData.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                <button
                  type="button"
                  onClick={sincronizarCargasColheita}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#0d47a1',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Puxa e sincroniza automaticamente os apontamentos de colheita para o estoque"
                >
                  🔄 Sincronizar com BdColheita ({colheitaData.length} apontamentos disponíveis)
                </button>
              </div>
            )}
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
            <label>Número de Controle / Projeto (Interligado)</label>
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
      {/* 3. TELA SAÍDA (TOTALMENTE INTERLIGADA COM OS SALDOS DO SISTEMA) */}
      {/* ========================================================================= */}
      {paginaAtiva === 'saida' && (
        <div className="card">
          <button className="btn btn-voltar" onClick={() => setPaginaAtiva('inicial')}>⬅️ Voltar</button>
          <h3 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 'bold' }}>📤 Saída de Estoque</h3>

          <div>
            <label>Data da Saída</label>
            <input type="date" value={formSaida.data} onChange={(e) => setFormSaida({ ...formSaida, data: e.target.value })} />

            <label>Número de Controle com Saldo</label>
            <select
              value={formSaida.controleCod}
              onChange={(e) => {
                const cod = e.target.value;
                const primeiroComSaldo = Object.values(saldosAtuais).find(s => s.controleCod === cod && (s.caixas > 0 || s.contentores > 0 || s.sacos > 0));
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
