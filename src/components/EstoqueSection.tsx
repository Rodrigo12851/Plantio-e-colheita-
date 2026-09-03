import React, { useState, useEffect, useMemo, useRef } from 'react';

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
  motoristas?: any[];
  onSaveEstoqueItem?: (item: EstoqueItem) => void;
  onDeleteEstoqueItem?: (id: string) => void;
  onSaveRomaneio?: (romaneio: RomaneioItem, baixarEstoque: boolean) => void;
  onDeleteRomaneio?: (id: string) => void;
  onSaveMovimentacao?: (mov: EstoqueMovimentacao) => void;
  showToast?: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

// Model types based on the user's application
interface ItemCad { id: number; nome: string; cod?: string; culturaId?: number; fazendaId?: number; pivoId?: number; glebasIds?: number[]; }
interface Movimento { id: number; data: string; controleId: number; glebaId: number; variedadeId?: number; produtoId?: number; localId?: number; embalagem: string; qtd: number; }

const DEFAULT_CADASTROS = {
  cultura: [
    { id: 1, cod: '001', nome: 'Cenoura' },
    { id: 2, cod: '002', nome: 'Cebola' },
    { id: 3, cod: '003', nome: 'Alho' },
    { id: 4, cod: '004', nome: 'Batata' }
  ],
  variedade: [
    { id: 1, culturaId: 1, nome: 'Híbrida Juliana' },
    { id: 2, culturaId: 1, nome: 'Brasília' },
    { id: 3, culturaId: 2, nome: 'Baia Periforme' },
    { id: 4, culturaId: 3, nome: 'Roxo Pérola' }
  ],
  produto: [
    { id: 1, culturaId: 1, cod: '101', nome: 'Cenoura Especial Calibre 2' },
    { id: 2, culturaId: 1, cod: '102', nome: 'Cenoura Padrão Calibre 1' },
    { id: 3, culturaId: 1, cod: '103', nome: 'Cenoura Descarte / Indústria' },
    { id: 4, culturaId: 2, cod: '201', nome: 'Cebola Caixa 3' },
    { id: 5, culturaId: 2, cod: '202', nome: 'Cebola Caixa 2' }
  ],
  local: [
    { id: 1, culturaId: 1, nome: 'Câmara Fria 01' },
    { id: 2, culturaId: 1, nome: 'Câmara Fria 02' },
    { id: 3, culturaId: 1, nome: 'Galpão Packing House' },
    { id: 4, culturaId: 2, nome: 'Galpão 03 Ventilado' }
  ],
  fazenda: [
    { id: 1, nome: 'Fazenda Cristalina' },
    { id: 2, nome: 'Fazenda Boa Vista' },
    { id: 3, nome: 'Fazenda Samambaia' }
  ],
  gleba: [
    { id: 1, nome: 'Gleba 01' },
    { id: 2, nome: 'Gleba 02' },
    { id: 3, nome: 'Gleba 03' },
    { id: 4, nome: 'Gleba 04' }
  ],
  pivo: [
    { id: 1, nome: 'Pivô 01' },
    { id: 2, nome: 'Pivô 02' },
    { id: 3, nome: 'Pivô 03' }
  ],
  controle: [
    { id: 1, cod: 'CTR-2025/26-01', fazendaId: 1, culturaId: 1, pivoId: 1, glebasIds: [1, 2] },
    { id: 2, cod: 'CTR-2025/26-02', fazendaId: 1, culturaId: 1, pivoId: 2, glebasIds: [3] },
    { id: 3, cod: 'CTR-2025/26-03', fazendaId: 2, culturaId: 2, pivoId: 3, glebasIds: [4] }
  ],
  usuario: [] as any[]
};

const DEFAULT_ENTRADAS: Movimento[] = [
  { id: 101, data: '2026-09-01', controleId: 1, glebaId: 1, variedadeId: 1, produtoId: 1, localId: 1, embalagem: 'Caixa', qtd: 450 },
  { id: 102, data: '2026-09-02', controleId: 1, glebaId: 2, variedadeId: 1, produtoId: 2, localId: 3, embalagem: 'Caixa', qtd: 320 },
  { id: 103, data: '2026-09-02', controleId: 1, glebaId: 1, variedadeId: 2, produtoId: 3, localId: 3, embalagem: 'Contentor', qtd: 28 },
  { id: 104, data: '2026-09-03', controleId: 3, glebaId: 4, variedadeId: 3, produtoId: 4, localId: 4, embalagem: 'Saco', qtd: 600 }
];

const DEFAULT_SAIDAS: Movimento[] = [
  { id: 201, data: '2026-09-03', controleId: 1, glebaId: 1, variedadeId: 1, produtoId: 1, localId: 1, embalagem: 'Caixa', qtd: 120 }
];

export const EstoqueSection: React.FC<EstoqueSectionProps> = ({ showToast }) => {
  // Navigation State
  const [paginaAtiva, setPaginaAtiva] = useState<'inicial' | 'cadastro' | 'configuracao' | 'relatorio-bonitao' | 'entrada' | 'saida' | 'romaneio'>('inicial');
  const [tipoAtual, setTipoAtual] = useState<string>('cultura');

  // Core Data
  const [cadastros, setCadastros] = useState(() => {
    try {
      const saved = localStorage.getItem('cadastros');
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return DEFAULT_CADASTROS;
  });

  const [entradas, setEntradas] = useState<Movimento[]>(() => {
    try {
      const saved = localStorage.getItem('entrada');
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return DEFAULT_ENTRADAS;
  });

  const [saidas, setSaidas] = useState<Movimento[]>(() => {
    try {
      const saved = localStorage.getItem('saida');
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return DEFAULT_SAIDAS;
  });

  // User State
  const [usuarioLogado, setUsuarioLogado] = useState(() => ({
    nome: "Operador Teste",
    podeEntrada: true,
    podeSaida: true,
    podeFurarEstoque: false,
    podeCadastrar: true,
    podeExcluir: true,
    permissoes: { exportarDados: true, imprimirRelatorio: true }
  }));

  // Save to LocalStorage
  const persistirDados = (novosCadastros = cadastros, novasEntradas = entradas, novasSaidas = saidas) => {
    try {
      localStorage.setItem('cadastros', JSON.stringify(novosCadastros));
      localStorage.setItem('entrada', JSON.stringify(novasEntradas));
      localStorage.setItem('saida', JSON.stringify(novasSaidas));
    } catch (e) { /* ignore */ }
  };

  // Helper date function
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

  // IA Assistant State & Logic
  const [perguntaIA, setPerguntaIA] = useState('');
  const [respostaIA, setRespostaIA] = useState<string | null>(null);

  // Filters State
  const [filtroGeral, setFiltroGeral] = useState('');
  const [menuExportarAberto, setMenuExportarAberto] = useState(false);

  // Relatório Bonitão State
  const [campoFiltroRel, setCampoFiltroRel] = useState<'data' | 'fazenda' | 'cultura' | 'produto' | 'tipo'>('data');
  const [valorFiltroRel, setValorFiltroRel] = useState('');
  const [filtrosAcumulados, setFiltrosAcumulados] = useState<Array<{ campo: string; label: string; valor: string; texto: string }>>([]);

  // Modal Detalhes (Aba Detalhes)
  const [abaDetalhesAberta, setAbaDetalhesAberta] = useState(false);
  const [tituloAba, setTituloAba] = useState('');
  const [tipoAbaDetalhes, setTipoAbaDetalhes] = useState<'cadastro' | 'entrada' | 'saida'>('cadastro');

  // Form Cadastros State
  const [idEditando, setIdEditando] = useState<number | null>(null);
  const [formCultura, setFormCultura] = useState({ cod: '', nome: '' });
  const [formVariedade, setFormVariedade] = useState({ culturaId: '', nome: '' });
  const [formProduto, setFormProduto] = useState({ culturaId: '', cod: '', nome: '' });
  const [formLocal, setFormLocal] = useState({ culturaId: '', nome: '' });
  const [formFazenda, setFormFazenda] = useState({ nome: '' });
  const [formGleba, setFormGleba] = useState({ nome: '' });
  const [formPivo, setFormPivo] = useState({ nome: '' });
  const [formControle, setFormControle] = useState({ cod: '', fazendaId: '', culturaId: '', pivoId: '', glebasIds: [] as number[] });

  // Form Entrada State
  const [formEntrada, setFormEntrada] = useState({
    id: null as number | null,
    data: dataHoje(),
    controleId: '',
    glebaId: '',
    variedadeId: '',
    produtoId: '',
    localId: '',
    embalagem: '',
    qtd: ''
  });

  // Form Saída State
  const [formSaida, setFormSaida] = useState({
    id: null as number | null,
    data: dataHoje(),
    controleId: '',
    glebaId: '',
    variedadeId: '',
    produtoId: '',
    localId: '',
    embalagem: '',
    qtd: ''
  });

  // Feedback Messages
  const [msgCad, setMsgCad] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);
  const [msgEntrada, setMsgEntrada] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);
  const [msgSaida, setMsgSaida] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);
  const [msgUsuario, setMsgUsuario] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);

  const mostrarMsg = (texto: string, tipo: 'sucesso' | 'erro', setMsg: any) => {
    setMsg({ texto, tipo });
    setTimeout(() => setMsg(null), 3000);
  };

  // Calculate Current Saldos
  const saldosAtuais = useMemo(() => {
    const saldos: Record<string, { localId: number; produtoId: number; controleId: number; glebaId: number; variedadeId: number; caixas: number; contentores: number; sacos: number }> = {};
    
    entradas.forEach(ent => {
      const chave = `${ent.localId || 0}_${ent.produtoId || 0}_${ent.controleId}_${ent.glebaId || 0}_${ent.variedadeId || 0}`;
      if (!saldos[chave]) {
        saldos[chave] = { localId: ent.localId || 0, produtoId: ent.produtoId || 0, controleId: ent.controleId, glebaId: ent.glebaId, variedadeId: ent.variedadeId || 0, caixas: 0, contentores: 0, sacos: 0 };
      }
      const qtd = parseInt(String(ent.qtd) || '0', 10);
      if (ent.embalagem === 'Caixa') saldos[chave].caixas += qtd;
      else if (ent.embalagem === 'Contentor') saldos[chave].contentores += qtd;
      else if (ent.embalagem === 'Saco') saldos[chave].sacos += qtd;
    });

    saidas.forEach(sai => {
      const chave = `${sai.localId || 0}_${sai.produtoId || 0}_${sai.controleId}_${sai.glebaId || 0}_${sai.variedadeId || 0}`;
      if (!saldos[chave]) {
        saldos[chave] = { localId: sai.localId || 0, produtoId: sai.produtoId || 0, controleId: sai.controleId, glebaId: sai.glebaId, variedadeId: sai.variedadeId || 0, caixas: 0, contentores: 0, sacos: 0 };
      }
      const qtd = parseInt(String(sai.qtd) || '0', 10);
      if (sai.embalagem === 'Caixa') saldos[chave].caixas -= qtd;
      else if (sai.embalagem === 'Contentor') saldos[chave].contentores -= qtd;
      else if (sai.embalagem === 'Saco') saldos[chave].sacos -= qtd;
    });

    return saldos;
  }, [entradas, saidas]);

  // Handle AI question
  const processarPerguntaIA = () => {
    const pergunta = perguntaIA.toLowerCase().trim();
    if (!pergunta) return;

    let tCaixas = 0, tContentores = 0, tSacos = 0;
    Object.keys(saldosAtuais).forEach(k => {
      tCaixas += saldosAtuais[k].caixas;
      tContentores += saldosAtuais[k].contentores;
      tSacos += saldosAtuais[k].sacos;
    });

    let totalSaidasCaixas = 0, totalSaidasContentores = 0, totalSaidasSacos = 0;
    saidas.forEach(s => {
      const q = parseInt(String(s.qtd || 0), 10);
      if (s.embalagem === 'Caixa') totalSaidasCaixas += q;
      if (s.embalagem === 'Contentor') totalSaidasContentores += q;
      if (s.embalagem === 'Saco') totalSaidasSacos += q;
    });

    let totalEntradasCaixas = 0, totalEntradasContentores = 0, totalEntradasSacos = 0;
    entradas.forEach(e => {
      const q = parseInt(String(e.qtd || 0), 10);
      if (e.embalagem === 'Caixa') totalEntradasCaixas += q;
      if (e.embalagem === 'Contentor') totalEntradasContentores += q;
      if (e.embalagem === 'Saco') totalEntradasSacos += q;
    });

    if (pergunta.includes('ir para') || pergunta.includes('abrir') || pergunta.includes('tela de')) {
      if (pergunta.includes('cadastro')) { setPaginaAtiva('cadastro'); setRespostaIA('🤖 Tela de cadastros aberta.'); return; }
      if (pergunta.includes('entrada')) { setPaginaAtiva('entrada'); setRespostaIA('🤖 Tela de entrada de estoque aberta.'); return; }
      if (pergunta.includes('saí') || pergunta.includes('saida')) { setPaginaAtiva('saida'); setRespostaIA('🤖 Tela de saída de estoque aberta.'); return; }
      if (pergunta.includes('relatório') || pergunta.includes('relatorio')) { setPaginaAtiva('relatorio-bonitao'); setRespostaIA('🤖 Relatório Avançado aberto.'); return; }
      if (pergunta.includes('inicial') || pergunta.includes('home')) { setPaginaAtiva('inicial'); setRespostaIA('🤖 Retornado à home principal.'); return; }
    }

    if (pergunta.includes('limpar') && (pergunta.includes('filtro') || pergunta.includes('pesquisa'))) {
      setFiltroGeral('');
      setFiltrosAcumulados([]);
      setRespostaIA('🤖 Filtros redefinidos com sucesso.');
      return;
    }

    if (pergunta.includes('saiu') || pergunta.includes('saida') || pergunta.includes('saídas')) {
      if (pergunta.includes('caixa')) {
        setRespostaIA(`📤 Já saíram um total de ${totalSaidasCaixas} caixas do estoque.`);
      } else if (pergunta.includes('contentor')) {
        setRespostaIA(`📤 Já saíram um total de ${totalSaidasContentores} contentores do estoque.`);
      } else if (pergunta.includes('saco')) {
        setRespostaIA(`📤 Já saíram um total de ${totalSaidasSacos} sacos do estoque.`);
      } else {
        setRespostaIA(`📤 Total de Saídas Realizadas: Caixas: ${totalSaidasCaixas} un. | Contentores: ${totalSaidasContentores} un. | Sacos: ${totalSaidasSacos} un.`);
      }
      return;
    }

    if (pergunta.includes('entrou') || pergunta.includes('entrada') || pergunta.includes('entradas')) {
      if (pergunta.includes('caixa')) {
        setRespostaIA(`📥 Foram lançadas ${totalEntradasCaixas} caixas no sistema.`);
      } else if (pergunta.includes('contentor')) {
        setRespostaIA(`📥 Foram lançados ${totalEntradasContentores} contentores no sistema.`);
      } else if (pergunta.includes('saco')) {
        setRespostaIA(`📥 Foram lançados ${totalEntradasSacos} sacos no sistema.`);
      } else {
        setRespostaIA(`📥 Total de Entradas: Caixas: ${totalEntradasCaixas} un. | Contentores: ${totalEntradasContentores} un. | Sacos: ${totalEntradasSacos} un.`);
      }
      return;
    }

    if (pergunta.includes('saldo') || pergunta.includes('tem no estoque') || pergunta.includes('atual') || pergunta.includes('resta')) {
      if (pergunta.includes('caixa')) {
        setRespostaIA(`🤖 O saldo disponível atual é de ${tCaixas} caixas em estoque.`);
      } else if (pergunta.includes('contentor')) {
        setRespostaIA(`🤖 O saldo disponível atual é de ${tContentores} contentores.`);
      } else if (pergunta.includes('saco')) {
        setRespostaIA(`🤖 O saldo disponível atual é de ${tSacos} sacos.`);
      } else {
        setRespostaIA(`🤖 Balanço Volumétrico Disponível: Caixas: ${tCaixas} un. | Contentores: ${tContentores} un. | Sacos: ${tSacos} un. (Total geral: ${tCaixas + tContentores + tSacos} volumes)`);
      }
      return;
    }

    setRespostaIA(`❌ IA: Comando não reconhecido. Exemplos: "Quantas caixas saíram?", "Qual o saldo total?", "Ir para a tela de entrada"`);
  };

  // Save Cadastros
  const salvarCadastro = () => {
    const novosCadastros = { ...cadastros };
    const id = idEditando || Date.now();

    if (tipoAtual === 'cultura') {
      const cod = formCultura.cod.trim();
      const nome = formCultura.nome.trim();
      if (!cod || !nome) return mostrarMsg('Preencha todos os campos', 'erro', setMsgCad);
      if (novosCadastros.cultura.some((c: any) => c.cod.toLowerCase() === cod.toLowerCase() && c.id !== id)) {
        return mostrarMsg('Este código de Cultura já existe!', 'erro', setMsgCad);
      }
      const idx = novosCadastros.cultura.findIndex((x: any) => x.id === id);
      if (idx >= 0) novosCadastros.cultura[idx] = { id, cod, nome };
      else novosCadastros.cultura.push({ id, cod, nome });
      setFormCultura({ cod: '', nome: '' });
    } else if (tipoAtual === 'variedade') {
      const culturaId = parseInt(formVariedade.culturaId, 10);
      const nome = formVariedade.nome.trim();
      if (!culturaId || !nome) return mostrarMsg('Preencha todos os campos', 'erro', setMsgCad);
      const idx = novosCadastros.variedade.findIndex((x: any) => x.id === id);
      if (idx >= 0) novosCadastros.variedade[idx] = { id, culturaId, nome };
      else novosCadastros.variedade.push({ id, culturaId, nome });
      setFormVariedade({ culturaId: '', nome: '' });
    } else if (tipoAtual === 'produto') {
      const culturaId = parseInt(formProduto.culturaId, 10);
      const cod = formProduto.cod.trim();
      const nome = formProduto.nome.trim();
      if (!culturaId || !cod || !nome) return mostrarMsg('Preencha todos os campos', 'erro', setMsgCad);
      if (novosCadastros.produto.some((p: any) => p.cod.toLowerCase() === cod.toLowerCase() && p.id !== id)) {
        return mostrarMsg('Este código de Produto já existe!', 'erro', setMsgCad);
      }
      const idx = novosCadastros.produto.findIndex((x: any) => x.id === id);
      if (idx >= 0) novosCadastros.produto[idx] = { id, culturaId, cod, nome };
      else novosCadastros.produto.push({ id, culturaId, cod, nome });
      setFormProduto({ culturaId: '', cod: '', nome: '' });
    } else if (tipoAtual === 'local') {
      const culturaId = parseInt(formLocal.culturaId, 10);
      const nome = formLocal.nome.trim();
      if (!culturaId || !nome) return mostrarMsg('Preencha todos os campos', 'erro', setMsgCad);
      const idx = novosCadastros.local.findIndex((x: any) => x.id === id);
      if (idx >= 0) novosCadastros.local[idx] = { id, culturaId, nome };
      else novosCadastros.local.push({ id, culturaId, nome });
      setFormLocal({ culturaId: '', nome: '' });
    } else if (tipoAtual === 'fazenda') {
      const nome = formFazenda.nome.trim();
      if (!nome) return mostrarMsg('Preencha o nome', 'erro', setMsgCad);
      const idx = novosCadastros.fazenda.findIndex((x: any) => x.id === id);
      if (idx >= 0) novosCadastros.fazenda[idx] = { id, nome };
      else novosCadastros.fazenda.push({ id, nome });
      setFormFazenda({ nome: '' });
    } else if (tipoAtual === 'gleba') {
      const nome = formGleba.nome.trim();
      if (!nome) return mostrarMsg('Preencha o nome', 'erro', setMsgCad);
      const idx = novosCadastros.gleba.findIndex((x: any) => x.id === id);
      if (idx >= 0) novosCadastros.gleba[idx] = { id, nome };
      else novosCadastros.gleba.push({ id, nome });
      setFormGleba({ nome: '' });
    } else if (tipoAtual === 'pivo') {
      const nome = formPivo.nome.trim();
      if (!nome) return mostrarMsg('Preencha o nome', 'erro', setMsgCad);
      const idx = novosCadastros.pivo.findIndex((x: any) => x.id === id);
      if (idx >= 0) novosCadastros.pivo[idx] = { id, nome };
      else novosCadastros.pivo.push({ id, nome });
      setFormPivo({ nome: '' });
    } else if (tipoAtual === 'controle') {
      const cod = formControle.cod.trim();
      const fazendaId = parseInt(formControle.fazendaId, 10);
      const culturaId = parseInt(formControle.culturaId, 10);
      const pivoId = parseInt(formControle.pivoId, 10);
      const glebasIds = formControle.glebasIds;
      if (!cod || !fazendaId || !culturaId || !pivoId || glebasIds.length === 0) {
        return mostrarMsg('Preencha tudo e selecione ao menos uma gleba', 'erro', setMsgCad);
      }
      const idx = novosCadastros.controle.findIndex((x: any) => x.id === id);
      if (idx >= 0) novosCadastros.controle[idx] = { id, cod, fazendaId, culturaId, pivoId, glebasIds };
      else novosCadastros.controle.push({ id, cod, fazendaId, culturaId, pivoId, glebasIds });
      setFormControle({ cod: '', fazendaId: '', culturaId: '', pivoId: '', glebasIds: [] });
    }

    setCadastros(novosCadastros);
    persistirDados(novosCadastros, entradas, saidas);
    setIdEditando(null);
    mostrarMsg('Salvo com sucesso!', 'sucesso', setMsgCad);
  };

  const cancelarEdicaoCadastro = () => {
    setIdEditando(null);
    setFormCultura({ cod: '', nome: '' });
    setFormVariedade({ culturaId: '', nome: '' });
    setFormProduto({ culturaId: '', cod: '', nome: '' });
    setFormLocal({ culturaId: '', nome: '' });
    setFormFazenda({ nome: '' });
    setFormGleba({ nome: '' });
    setFormPivo({ nome: '' });
    setFormControle({ cod: '', fazendaId: '', culturaId: '', pivoId: '', glebasIds: [] });
  };

  // Salvar Entrada
  const salvarEntrada = () => {
    const controleId = parseInt(formEntrada.controleId, 10);
    const glebaId = parseInt(formEntrada.glebaId, 10);
    const variedadeId = parseInt(formEntrada.variedadeId, 10) || undefined;
    const produtoId = parseInt(formEntrada.produtoId, 10);
    const localId = parseInt(formEntrada.localId, 10);
    const embalagem = formEntrada.embalagem;
    const qtd = parseInt(formEntrada.qtd, 10);

    if (!controleId || !glebaId || !produtoId || !localId || !embalagem || !qtd) {
      return mostrarMsg('Preencha todos os campos obrigatórios', 'erro', setMsgEntrada);
    }

    const id = formEntrada.id || Date.now();
    const novaEntrada: Movimento = {
      id,
      data: formEntrada.data || dataHoje(),
      controleId,
      glebaId,
      variedadeId,
      produtoId,
      localId,
      embalagem,
      qtd
    };

    let novasEntradas = [...entradas];
    const idx = novasEntradas.findIndex(e => e.id === id);
    if (idx >= 0) novasEntradas[idx] = novaEntrada;
    else novasEntradas.push(novaEntrada);

    setEntradas(novasEntradas);
    persistirDados(cadastros, novasEntradas, saidas);
    setFormEntrada({ id: null, data: dataHoje(), controleId: '', glebaId: '', variedadeId: '', produtoId: '', localId: '', embalagem: '', qtd: '' });
    mostrarMsg('Entrada cadastrada com sucesso!', 'sucesso', setMsgEntrada);
  };

  // Salvar Saída
  const salvarSaida = () => {
    const controleId = parseInt(formSaida.controleId, 10);
    const glebaId = parseInt(formSaida.glebaId, 10);
    const variedadeId = parseInt(formSaida.variedadeId, 10) || undefined;
    const produtoId = parseInt(formSaida.produtoId, 10);
    const localId = parseInt(formSaida.localId, 10);
    const embalagem = formSaida.embalagem;
    const qtd = parseInt(formSaida.qtd, 10);

    if (!controleId || !glebaId || !produtoId || !localId || !embalagem || !qtd) {
      return mostrarMsg('Preencha todos os campos', 'erro', setMsgSaida);
    }

    const chave = `${localId}_${produtoId}_${controleId}_${glebaId}_${variedadeId || 0}`;
    let saldoDisponivel = 0;
    if (saldosAtuais[chave]) {
      if (embalagem === 'Caixa') saldoDisponivel = saldosAtuais[chave].caixas;
      else if (embalagem === 'Contentor') saldoDisponivel = saldosAtuais[chave].contentores;
      else if (embalagem === 'Saco') saldoDisponivel = saldosAtuais[chave].sacos;
    }

    if (formSaida.id) {
      const regAntigo = saidas.find(s => s.id === formSaida.id);
      if (regAntigo && regAntigo.embalagem === embalagem && regAntigo.localId === localId && regAntigo.produtoId === produtoId && regAntigo.controleId === controleId && regAntigo.glebaId === glebaId) {
        saldoDisponivel += regAntigo.qtd;
      }
    }

    if (qtd > saldoDisponivel && !usuarioLogado.podeFurarEstoque) {
      return mostrarMsg(`Saldo insuficiente! Disponível: ${saldoDisponivel} un.`, 'erro', setMsgSaida);
    }

    const id = formSaida.id || Date.now();
    const novaSaida: Movimento = {
      id,
      data: formSaida.data || dataHoje(),
      controleId,
      glebaId,
      variedadeId,
      produtoId,
      localId,
      embalagem,
      qtd
    };

    let novasSaidas = [...saidas];
    const idx = novasSaidas.findIndex(s => s.id === id);
    if (idx >= 0) novasSaidas[idx] = novaSaida;
    else novasSaidas.push(novaSaida);

    setSaidas(novasSaidas);
    persistirDados(cadastros, entradas, novasSaidas);
    setFormSaida({ id: null, data: dataHoje(), controleId: '', glebaId: '', variedadeId: '', produtoId: '', localId: '', embalagem: '', qtd: '' });
    mostrarMsg('Saída registrada com sucesso!', 'sucesso', setMsgSaida);
  };

  // Detalhes & Ações (Exclusões / Edições)
  const abrirListaCadastros = () => {
    setTituloAba(`Lista: ${tipoAtual.toUpperCase()}`);
    setTipoAbaDetalhes('cadastro');
    setAbaDetalhesAberta(true);
  };

  const abrirListaEntrada = () => {
    setTituloAba('📥 Histórico de Entradas');
    setTipoAbaDetalhes('entrada');
    setAbaDetalhesAberta(true);
  };

  const abrirListaSaida = () => {
    setTituloAba('📤 Histórico de Saídas');
    setTipoAbaDetalhes('saida');
    setAbaDetalhesAberta(true);
  };

  const editarRegistro = (item: any) => {
    setAbaDetalhesAberta(false);
    setIdEditando(item.id);
    if (tipoAtual === 'cultura') setFormCultura({ cod: item.cod, nome: item.nome });
    else if (tipoAtual === 'variedade') setFormVariedade({ culturaId: String(item.culturaId), nome: item.nome });
    else if (tipoAtual === 'produto') setFormProduto({ culturaId: String(item.culturaId), cod: item.cod || '', nome: item.nome });
    else if (tipoAtual === 'local') setFormLocal({ culturaId: String(item.culturaId), nome: item.nome });
    else if (tipoAtual === 'fazenda') setFormFazenda({ nome: item.nome });
    else if (tipoAtual === 'gleba') setFormGleba({ nome: item.nome });
    else if (tipoAtual === 'pivo') setFormPivo({ nome: item.nome });
    else if (tipoAtual === 'controle') setFormControle({ cod: item.cod, fazendaId: String(item.fazendaId), culturaId: String(item.culturaId), pivoId: String(item.pivoId), glebasIds: item.glebasIds || [] });
  };

  const excluirRegistro = (id: number) => {
    if (!usuarioLogado.podeExcluir) { alert('Você não tem permissão para excluir registros!'); return; }
    if (!window.confirm('Tem certeza que deseja excluir este registro?')) return;
    const novosCadastros = { ...cadastros, [tipoAtual]: (cadastros as any)[tipoAtual].filter((x: any) => x.id !== id) };
    setCadastros(novosCadastros);
    persistirDados(novosCadastros, entradas, saidas);
  };

  const editarEntradaItem = (lanc: Movimento) => {
    setAbaDetalhesAberta(false);
    setPaginaAtiva('entrada');
    setFormEntrada({
      id: lanc.id,
      data: lanc.data,
      controleId: String(lanc.controleId),
      glebaId: String(lanc.glebaId),
      variedadeId: lanc.variedadeId ? String(lanc.variedadeId) : '',
      produtoId: lanc.produtoId ? String(lanc.produtoId) : '',
      localId: lanc.localId ? String(lanc.localId) : '',
      embalagem: lanc.embalagem,
      qtd: String(lanc.qtd)
    });
  };

  const excluirEntradaItem = (id: number) => {
    if (!usuarioLogado.podeExcluir) { alert('Você não tem permissão para excluir registros!'); return; }
    if (!window.confirm('Excluir lançamento de entrada?')) return;
    const novasEntradas = entradas.filter(e => e.id !== id);
    setEntradas(novasEntradas);
    persistirDados(cadastros, novasEntradas, saidas);
  };

  const editarSaidaItem = (lanc: Movimento) => {
    setAbaDetalhesAberta(false);
    setPaginaAtiva('saida');
    setFormSaida({
      id: lanc.id,
      data: lanc.data,
      controleId: String(lanc.controleId),
      glebaId: String(lanc.glebaId),
      variedadeId: lanc.variedadeId ? String(lanc.variedadeId) : '',
      produtoId: lanc.produtoId ? String(lanc.produtoId) : '',
      localId: lanc.localId ? String(lanc.localId) : '',
      embalagem: lanc.embalagem,
      qtd: String(lanc.qtd)
    });
  };

  const excluirSaidaItem = (id: number) => {
    if (!usuarioLogado.podeExcluir) { alert('Você não tem permissão para excluir registros!'); return; }
    if (!window.confirm('Excluir lançamento de saída?')) return;
    const novasSaidas = saidas.filter(s => s.id !== id);
    setSaidas(novasSaidas);
    persistirDados(cadastros, entradas, novasSaidas);
  };

  // Grouped Stocks for Resumo Screen
  const resumoEstoque = useMemo(() => {
    const saldos: Record<string, { localId: number; produtoId: number; controleId: number; glebasSet: Set<number>; variedadesSet: Set<number>; caixas: number; contentores: number; sacos: number }> = {};
    const termo = filtroGeral.toLowerCase().trim();

    entradas.forEach(ent => {
      const chave = `${ent.localId || 0}_${ent.produtoId || 0}_${ent.controleId}`;
      if (!saldos[chave]) {
        saldos[chave] = { localId: ent.localId || 0, produtoId: ent.produtoId || 0, controleId: ent.controleId, glebasSet: new Set(), variedadesSet: new Set(), caixas: 0, contentores: 0, sacos: 0 };
      }
      if (ent.glebaId) saldos[chave].glebasSet.add(ent.glebaId);
      if (ent.variedadeId) saldos[chave].variedadesSet.add(ent.variedadeId);
      const q = parseInt(String(ent.qtd || 0), 10);
      if (ent.embalagem === 'Caixa') saldos[chave].caixas += q;
      else if (ent.embalagem === 'Contentor') saldos[chave].contentores += q;
      else if (ent.embalagem === 'Saco') saldos[chave].sacos += q;
    });

    saidas.forEach(sai => {
      const chave = `${sai.localId || 0}_${sai.produtoId || 0}_${sai.controleId}`;
      if (!saldos[chave]) {
        saldos[chave] = { localId: sai.localId || 0, produtoId: sai.produtoId || 0, controleId: sai.controleId, glebasSet: new Set(), variedadesSet: new Set(), caixas: 0, contentores: 0, sacos: 0 };
      }
      if (sai.glebaId) saldos[chave].glebasSet.add(sai.glebaId);
      if (sai.variedadeId) saldos[chave].variedadesSet.add(sai.variedadeId);
      const q = parseInt(String(sai.qtd || 0), 10);
      if (sai.embalagem === 'Caixa') saldos[chave].caixas -= q;
      else if (sai.embalagem === 'Contentor') saldos[chave].contentores -= q;
      else if (sai.embalagem === 'Saco') saldos[chave].sacos -= q;
    });

    const grupos: Record<string, any[]> = {};
    Object.keys(saldos).forEach(k => {
      const item = saldos[k];
      if (item.caixas === 0 && item.contentores === 0 && item.sacos === 0) return;
      const ctrl = cadastros.controle.find((x: any) => x.id === item.controleId);
      const controleCod = ctrl?.cod || 'SEM CONTROLE';
      if (!grupos[controleCod]) grupos[controleCod] = [];
      grupos[controleCod].push(item);
    });

    const coresCabecalho = [
      { bg: '#0d47a1', border: '#0a3980', th: '#1a5276', thBorder: '#154360' },
      { bg: '#1b5e20', border: '#144517', th: '#1e8449', thBorder: '#196f3d' },
      { bg: '#b7950b', border: '#9a7d0a', th: '#d4ac0d', thBorder: '#b7950b' }
    ];

    const blocosFormatados = Object.keys(grupos).map((controleCodigo, idx) => {
      const cor = coresCabecalho[idx % coresCabecalho.length];
      let temCaixa = false, temContentor = false, temSaco = false;
      let nomeCultura = "";

      const itensFiltrados = grupos[controleCodigo].map(item => {
        const prodObj = cadastros.produto.find((x: any) => x.id === item.produtoId);
        const ctrlObj = cadastros.controle.find((x: any) => x.id === item.controleId);
        if (!nomeCultura && ctrlObj) {
          const cultObj = cadastros.cultura.find((x: any) => x.id === ctrlObj.culturaId);
          if (cultObj) nomeCultura = cultObj.nome.toUpperCase();
        }

        const localNome = limparNomeGalpao(cadastros.local.find((x: any) => x.id === item.localId)?.nome || '-');
        const produtoNomeLimpo = limparNomeProduto(prodObj?.nome || '-');
        const txtVariedade = Array.from(item.variedadesSet).map(id => cadastros.variedade.find((v: any) => v.id === id)?.nome).filter(Boolean).join(', ') || '-';
        const fazendaNome = cadastros.fazenda.find((x: any) => x.id === ctrlObj?.fazendaId)?.nome || '-';
        const pivoNome = limparNomePivo(cadastros.pivo.find((x: any) => x.id === ctrlObj?.pivoId)?.nome || '');
        let txtGleba = ctrlObj?.glebasIds ? ctrlObj.glebasIds.map((id: number) => cadastros.gleba.find((g: any) => g.id === id)?.nome).filter(Boolean).join(', ') : '-';
        txtGleba = txtGleba.replace(/gleba/gi, '').replace(/\s+/g, ' ').trim() || '-';
        const localidadeCombinada = pivoNome ? `${fazendaNome} ${pivoNome} / ${txtGleba}` : `${fazendaNome} / ${txtGleba}`;

        const matches = !termo || [prodObj?.cod || '', localNome, produtoNomeLimpo, localidadeCombinada, txtVariedade, controleCodigo].some(v => v.toLowerCase().includes(termo));
        if (!matches) return null;

        if (item.caixas !== 0) temCaixa = true;
        if (item.contentores !== 0) temContentor = true;
        if (item.sacos !== 0) temSaco = true;

        return {
          cod: prodObj?.cod || '-',
          localNome,
          produtoNomeLimpo,
          localidadeCombinada,
          txtVariedade,
          controleCodigo,
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
        itens: itensFiltrados
      };
    }).filter(b => b.itens.length > 0);

    return blocosFormatados;
  }, [entradas, saidas, cadastros, filtroGeral]);

  // Relatório Gerencial Query
  const movimentosRelatorio = useMemo(() => {
    let list: any[] = [];
    entradas.forEach(e => list.push({ ...e, tipo: 'Entrada', icone: '📥' }));
    saidas.forEach(s => list.push({ ...s, tipo: 'Saída', icone: '📤' }));

    filtrosAcumulados.forEach(f => {
      if (f.campo === "data") list = list.filter(m => m.data === f.valor);
      else if (f.campo === "tipo") list = list.filter(m => m.tipo === f.valor);
      else if (f.campo === "produto") list = list.filter(m => m.produtoId === parseInt(f.valor, 10));
      else if (f.campo === "fazenda" || f.campo === "cultura") {
        list = list.filter(m => {
          const ctrl = cadastros.controle.find((x: any) => x.id === m.controleId);
          if (!ctrl) return false;
          return f.campo === "fazenda" ? ctrl.fazendaId === parseInt(f.valor, 10) : ctrl.culturaId === parseInt(f.valor, 10);
        });
      }
    });

    list.sort((a, b) => (b.data || '').localeCompare(a.data || ''));
    return list;
  }, [entradas, saidas, cadastros, filtrosAcumulados]);

  // Export functions
  const exportarCSV = () => {
    let csv = "\uFEFFOp.;Data;Controle;Fazenda;Cultura;Pivô;Gleba;Variedade;Produto;Local;Embalagem;Qtd\r\n";
    movimentosRelatorio.forEach(m => {
      const ctrl = cadastros.controle.find((x: any) => x.id === m.controleId);
      const fazenda = cadastros.fazenda.find((x: any) => x.id === ctrl?.fazendaId)?.nome || '-';
      const cultura = cadastros.cultura.find((x: any) => x.id === ctrl?.culturaId)?.nome || '-';
      const pivo = cadastros.pivo.find((x: any) => x.id === ctrl?.pivoId)?.nome || '-';
      const gleba = cadastros.gleba.find((x: any) => x.id === m.glebaId)?.nome || '-';
      const variedadeItem = cadastros.variedade.find((x: any) => x.id === m.variedadeId)?.nome || '-';
      const produto = limparNomeProduto(cadastros.produto.find((x: any) => x.id === m.produtoId)?.nome || '-');
      const local = cadastros.local.find((x: any) => x.id === m.localId)?.nome || '-';
      const dataBR = m.data ? m.data.split('-').reverse().join('/') : '-';
      csv += `"${m.tipo}";"${dataBR}";"${ctrl?.cod || '-'}";"${fazenda}";"${cultura}";"${pivo}";"${gleba}";"${variedadeItem}";"${produto}";"${local}";"${m.embalagem}";"${m.qtd}"\r\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Relatorio_Estoque_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setMenuExportarAberto(false);
  };

  // Helper for Controle Change in Entrada
  const controleEntradaObj = useMemo(() => {
    if (!formEntrada.controleId) return null;
    return cadastros.controle.find((c: any) => c.id === parseInt(formEntrada.controleId, 10)) || null;
  }, [formEntrada.controleId, cadastros.controle]);

  // Helper for Controle Change in Saída
  const controleSaidaObj = useMemo(() => {
    if (!formSaida.controleId) return null;
    return cadastros.controle.find((c: any) => c.id === parseInt(formSaida.controleId, 10)) || null;
  }, [formSaida.controleId, cadastros.controle]);

  return (
    <div className="app-estoque-intacto" style={{ background: '#f8faf6', padding: '10px', minHeight: '100%', fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#333' }}>
      {/* SCOPED STYLES MATCHING THE EXACT USER CODE */}
      <style>{`
        .app-estoque-intacto * { box-sizing: border-box; }
        .app-estoque-intacto header { background: #0d47a1; color: white; padding: 10px 14px; border-radius: 6px; text-align: center; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .app-estoque-intacto header h1 { font-size: 15px; margin: 0; font-weight: bold; letter-spacing: 0.5px; }
        .app-estoque-intacto .card { background: white; border-radius: 6px; padding: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.15); margin-bottom: 10px; position: relative; border: 1px solid #e2e8f0; }
        .app-estoque-intacto .top-area { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
        .app-estoque-intacto .filtro { width: 100%; height: 36px; padding: 0 12px 0 34px; border: 1px solid #bbdefb; border-radius: 6px; background: #e3f2fd url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%230d47a1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3C/svg%3E") no-repeat 10px center; color: #0d47a1; font-size: 13px; }
        .app-estoque-intacto .filtro:focus { outline: none; border-color: #0d47a1; background-color: #fff; }
        .app-estoque-intacto .botoes-principais { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .app-estoque-intacto .btn-principal { width: 100%; padding: 10px 8px; border: 1px solid #0d47a1; border-radius: 6px; font-size: 13px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; background: #e3f2fd; color: #0d47a1; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
        .app-estoque-intacto .btn-principal:hover { background: #d4e8fc; }
        .app-estoque-intacto .btn-lupa-topo { position: absolute; top: 10px; right: 10px; width: 32px; height: 32px; background: #e3f2fd; border: 1px solid #0d47a1; border-radius: 50%; color: #0d47a1; font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 2px rgba(0,0,0,0.15); }
        .app-estoque-intacto .menu-tipos { display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap; border-bottom: 1px solid #eee; padding-bottom: 8px; }
        .app-estoque-intacto .btn-tipo { background: #f5f5f5; border: 1px solid #ddd; padding: 6px 10px; border-radius: 6px; font-size: 12px; color: #555; cursor: pointer; font-weight: 500; }
        .app-estoque-intacto .btn-tipo.ativa { background: #e3f2fd; color: #0d47a1; border-color: #bbdefb; font-weight: bold; }
        .app-estoque-intacto label { display: block; margin: 8px 0 2px; font-weight: 600; color: #444; font-size: 12px; }
        .app-estoque-intacto input, .app-estoque-intacto select { width: 100%; height: 34px; padding: 0 8px; border: 1px solid #ccc; border-radius: 6px; font-size: 13px; margin-bottom: 6px; background: #ffffff; }
        .app-estoque-intacto input:disabled, .app-estoque-intacto select:disabled { background: #f5f5f5; color: #666; cursor: not-allowed; }
        .app-estoque-intacto .multi-selecao { border: 1px solid #ccc; border-radius: 6px; padding: 6px; max-height: 120px; overflow-y: auto; background: #fff; margin-bottom: 6px; }
        .app-estoque-intacto .multi-selecao-item { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; cursor: pointer; font-size: 12px; font-weight: normal; }
        .app-estoque-intacto .multi-selecao-item input { width: auto; height: auto; margin-bottom: 0; cursor: pointer; }
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
        .app-estoque-intacto .btn-acao { width: 30px; height: 30px; border: 1px solid #dcdcdc; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; background: #ffffff; color: #444; }
        .app-estoque-intacto .btn-acao:hover { background: #f1f5f9; border-color: #cbd5e1; }
        .app-estoque-intacto .btn-acao svg { width: 16px; height: 16px; fill: currentColor; }
        .app-estoque-intacto .badge-mov { padding: 2px 5px; border-radius: 3px; font-weight: bold; font-size: 10px; text-transform: uppercase; }
        .app-estoque-intacto .badge-ent { background-color: #e6fcf5; color: #0ca678; border: 1px solid #c3fae8; }
        .app-estoque-intacto .badge-sai { background-color: #fff5f5; color: #c92a2a; border: 1px solid #ffdeeb; }
        .app-estoque-intacto .tag-filtro { background-color: #e7f5ff; color: #1c7ed6; border: 1px solid #d0ebff; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; height: 22px; }
        .app-estoque-intacto .tag-filtro .remover-tag { color: #fa5252; cursor: pointer; font-weight: bold; font-size: 13px; }
        .app-estoque-intacto .mini-planilha { width: 16px; height: 14px; border: 1.5px solid #107c41; border-radius: 2px; position: relative; background: #fff; display: flex; flex-direction: column; justify-content: space-between; padding: 1px; }
        .app-estoque-intacto .mini-planilha::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: #107c41; }
        .app-estoque-intacto .linha-planilha { height: 1.5px; background: #107c41; width: 7px; margin-left: 5px; }
      `}</style>

      {/* HEADER PRINCIPAL */}
      <header>
        <h1>CONTROLE DE ESTOQUE</h1>
      </header>

      {/* ========================================================================= */}
      {/* 1. PÁGINA INICIAL */}
      {/* ========================================================================= */}
      {paginaAtiva === 'inicial' && (
        <div className="card">
          <div className="top-area">
            {/* ASSISTENTE IA DO ESTOQUE */}
            <div className="card" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', marginBottom: '4px', padding: '8px' }}>
              <label style={{ color: '#1e40af', fontWeight: 'bold', marginTop: 0 }}>🤖 Assistente IA do Estoque</label>
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                <input
                  type="text"
                  value={perguntaIA}
                  onChange={(e) => setPerguntaIA(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') processarPerguntaIA(); }}
                  placeholder="Ex: 'Qual o saldo total?', 'Resumo de caixas', 'Abrir cadastro'"
                  style={{ marginBottom: 0, height: '32px' }}
                />
                <button
                  type="button"
                  onClick={processarPerguntaIA}
                  style={{ background: '#1e40af', color: 'white', border: 'none', padding: '0 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', height: '32px' }}
                >
                  Perguntar
                </button>
              </div>
              {respostaIA && (
                <div style={{ marginTop: '6px', padding: '6px', background: 'white', borderRadius: '4px', border: '1px solid #dbeafe', fontSize: '12px', color: '#1e3a8a', lineHeight: '1.4' }}>
                  {respostaIA}
                </div>
              )}
            </div>

            {/* FILTRO GERAL DE PESQUISA */}
            <input
              type="text"
              value={filtroGeral}
              onChange={(e) => setFiltroGeral(e.target.value)}
              className="filtro"
              placeholder="Pesquisar no Estoque Ativo..."
            />

            {/* BOTÕES PRINCIPAIS */}
            <div className="botoes-principais">
              <button className="btn-principal" onClick={() => setPaginaAtiva('cadastro')}>
                <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', fill: 'currentColor' }}>
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 4c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1z" />
                </svg>
                Cadastros
              </button>

              <button className="btn-principal" onClick={() => setPaginaAtiva('configuracao')}>
                <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', fill: 'currentColor' }}>
                  <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18 1.14-.23.41-.12.61l1.92 3.32c1.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0-.44-.17-.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                </svg>
                Configurações
              </button>

              <button className="btn-principal" onClick={() => setPaginaAtiva('entrada')}>📥 Entrada</button>
              <button className="btn-principal" onClick={() => setPaginaAtiva('saida')}>📤 Saída</button>
            </div>
          </div>

          {/* TABELAS DE RESUMO DE ESTOQUE POR CONTROLE / SAFRA */}
          <div id="containerResumoEstoque" className="tabela-wrapper">
            {resumoEstoque.length === 0 ? (
              <p className="vazio">Nenhum saldo ativo para exibir.</p>
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
                          <th style={{ background: bloco.cor.th, border: `1px solid ${bloco.cor.thBorder}`, color: 'white' }}>Cód</th>
                          <th style={{ background: bloco.cor.th, border: `1px solid ${bloco.cor.thBorder}`, color: 'white' }}>Local</th>
                          <th style={{ background: bloco.cor.th, border: `1px solid ${bloco.cor.thBorder}`, color: 'white' }}>Produto</th>
                          <th style={{ background: bloco.cor.th, border: `1px solid ${bloco.cor.thBorder}`, color: 'white' }}>Fazenda / Glebas</th>
                          <th style={{ background: bloco.cor.th, border: `1px solid ${bloco.cor.thBorder}`, color: 'white' }}>Variedades</th>
                          <th style={{ background: bloco.cor.th, border: `1px solid ${bloco.cor.thBorder}`, color: 'white' }}>Controle</th>
                          {bloco.temCaixa && <th style={{ background: bloco.cor.th, border: `1px solid ${bloco.cor.thBorder}`, color: 'white' }}>Caix</th>}
                          {bloco.temContentor && <th style={{ background: bloco.cor.th, border: `1px solid ${bloco.cor.thBorder}`, color: 'white' }}>Cont</th>}
                          {bloco.temSaco && <th style={{ background: bloco.cor.th, border: `1px solid ${bloco.cor.thBorder}`, color: 'white' }}>Sac</th>}
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
      {/* 2. PÁGINA CADASTROS */}
      {/* ========================================================================= */}
      {paginaAtiva === 'cadastro' && (
        <div className="card">
          <button className="btn-lupa-topo" onClick={abrirListaCadastros} title="Ver registros">🔍</button>
          <button className="btn btn-voltar" onClick={() => setPaginaAtiva('inicial')}>⬅️ Voltar</button>
          <h3 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 'bold' }}>Cadastros</h3>

          {/* MENU TIPOS */}
          <div className="menu-tipos">
            {['cultura', 'variedade', 'produto', 'local', 'fazenda', 'gleba', 'pivo', 'controle'].map((tipo) => (
              <button
                key={tipo}
                className={`btn-tipo ${tipoAtual === tipo ? 'ativa' : ''}`}
                onClick={() => { setTipoAtual(tipo); cancelarEdicaoCadastro(); }}
              >
                {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
              </button>
            ))}
          </div>

          {/* FORMULÁRIO CULTURA */}
          {tipoAtual === 'cultura' && (
            <div>
              <label>Código da Cultura (Apenas Números)</label>
              <input
                type="text"
                value={formCultura.cod}
                onChange={(e) => setFormCultura({ ...formCultura, cod: e.target.value.replace(/[^0-9]/g, '') })}
                placeholder="Ex: 001"
              />
              <label>Nome da Cultura</label>
              <input
                type="text"
                value={formCultura.nome}
                onChange={(e) => setFormCultura({ ...formCultura, nome: e.target.value })}
                placeholder="Ex: Cenoura"
              />
            </div>
          )}

          {/* FORMULÁRIO VARIEDADE */}
          {tipoAtual === 'variedade' && (
            <div>
              <label>Cultura</label>
              <select value={formVariedade.culturaId} onChange={(e) => setFormVariedade({ ...formVariedade, culturaId: e.target.value })}>
                <option value="">Selecione</option>
                {cadastros.cultura.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <label>Nome da Variedade</label>
              <input
                type="text"
                value={formVariedade.nome}
                onChange={(e) => setFormVariedade({ ...formVariedade, nome: e.target.value })}
                placeholder="Ex: Híbrida"
              />
            </div>
          )}

          {/* FORMULÁRIO PRODUTO */}
          {tipoAtual === 'produto' && (
            <div>
              <label>Cultura Vinculada</label>
              <select value={formProduto.culturaId} onChange={(e) => setFormProduto({ ...formProduto, culturaId: e.target.value })}>
                <option value="">Selecione</option>
                {cadastros.cultura.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <label>Código do Produto (Apenas Números)</label>
              <input
                type="text"
                value={formProduto.cod}
                onChange={(e) => setFormProduto({ ...formProduto, cod: e.target.value.replace(/[^0-9]/g, '') })}
                placeholder="Ex: 102"
              />
              <label>Nome do Produto (Classificação)</label>
              <input
                type="text"
                value={formProduto.nome}
                onChange={(e) => setFormProduto({ ...formProduto, nome: e.target.value })}
                placeholder="Ex: Cenoura Calibre 2"
              />
            </div>
          )}

          {/* FORMULÁRIO LOCAL */}
          {tipoAtual === 'local' && (
            <div>
              <label>Cultura Vinculada</label>
              <select value={formLocal.culturaId} onChange={(e) => setFormLocal({ ...formLocal, culturaId: e.target.value })}>
                <option value="">Selecione</option>
                {cadastros.cultura.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <label>Nome do Local de Depósito</label>
              <input
                type="text"
                value={formLocal.nome}
                onChange={(e) => setFormLocal({ ...formLocal, nome: e.target.value })}
                placeholder="Ex: Câmara Fria 1"
              />
            </div>
          )}

          {/* FORMULÁRIO FAZENDA */}
          {tipoAtual === 'fazenda' && (
            <div>
              <label>Nome da Fazenda</label>
              <input
                type="text"
                value={formFazenda.nome}
                onChange={(e) => setFormFazenda({ nome: e.target.value })}
                placeholder="Ex: Fazenda Boa Vista"
              />
            </div>
          )}

          {/* FORMULÁRIO GLEBA */}
          {tipoAtual === 'gleba' && (
            <div>
              <label>Nome/Número da Gleba</label>
              <input
                type="text"
                value={formGleba.nome}
                onChange={(e) => setFormGleba({ nome: e.target.value })}
                placeholder="Ex: Gleba 3"
              />
            </div>
          )}

          {/* FORMULÁRIO PIVÔ */}
          {tipoAtual === 'pivo' && (
            <div>
              <label>Nome/Número do Pivô</label>
              <input
                type="text"
                value={formPivo.nome}
                onChange={(e) => setFormPivo({ nome: e.target.value })}
                placeholder="Ex: Pivô 2"
              />
            </div>
          )}

          {/* FORMULÁRIO CONTROLE */}
          {tipoAtual === 'controle' && (
            <div>
              <label>Número de Controle</label>
              <input
                type="text"
                value={formControle.cod}
                onChange={(e) => setFormControle({ ...formControle, cod: e.target.value })}
                placeholder="Ex: CTR001"
              />
              <label>Fazenda</label>
              <select value={formControle.fazendaId} onChange={(e) => setFormControle({ ...formControle, fazendaId: e.target.value })}>
                <option value="">Selecione</option>
                {cadastros.fazenda.map((f: any) => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
              <label>Cultura</label>
              <select value={formControle.culturaId} onChange={(e) => setFormControle({ ...formControle, culturaId: e.target.value })}>
                <option value="">Selecione</option>
                {cadastros.cultura.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <label>Pivô</label>
              <select value={formControle.pivoId} onChange={(e) => setFormControle({ ...formControle, pivoId: e.target.value })}>
                <option value="">Selecione</option>
                {cadastros.pivo.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
              <label>Selecione as Glebas Vinculadas:</label>
              <div className="multi-selecao">
                {cadastros.gleba.map((g: any) => {
                  const isChecked = formControle.glebasIds.includes(g.id);
                  return (
                    <label key={g.id} className="multi-selecao-item">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) setFormControle({ ...formControle, glebasIds: [...formControle.glebasIds, g.id] });
                          else setFormControle({ ...formControle, glebasIds: formControle.glebasIds.filter((id: number) => id !== g.id) });
                        }}
                      />
                      <span>{g.nome}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* BOTÕES SALVAR / CANCELAR */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <button className="btn btn-salvar" onClick={salvarCadastro}>💾 Salvar</button>
            {idEditando !== null && (
              <button className="btn btn-cancelar" onClick={cancelarEdicaoCadastro}>❌ Cancelar</button>
            )}
          </div>

          {msgCad && <div className={`resultado ${msgCad.tipo}`}>{msgCad.texto}</div>}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PÁGINA CONFIGURAÇÕES E USUÁRIOS */}
      {/* ========================================================================= */}
      {paginaAtiva === 'configuracao' && (
        <div className="card">
          <button className="btn btn-voltar" onClick={() => setPaginaAtiva('inicial')}>⬅️ Voltar</button>
          <h3 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 'bold' }}>⚙️ Configurações e Usuários</h3>

          <div className="botoes-principais" style={{ marginBottom: '15px' }}>
            <button className="btn-principal" onClick={() => setPaginaAtiva('relatorio-bonitao')}>
              📊 Relatório Geral
            </button>
            <button
              className="btn-principal"
              onClick={() => {
                const el = document.getElementById('area-usuario-box');
                if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
              }}
            >
              🔧 Configurar Usuários
            </button>
          </div>

          <div id="area-usuario-box" className="card" style={{ display: 'none', background: '#fdfdfd', border: '1px solid #ddd' }}>
            <h4 style={{ marginBottom: '8px', color: '#0d47a1', fontWeight: 'bold' }}>Novo Usuário / Permissões</h4>
            <label>Nome / Login</label>
            <input type="text" id="loginUsuarioInput" placeholder="Ex: joao.silva" />
            <label>Senha</label>
            <input type="password" id="senhaUsuarioInput" placeholder="Senha de acesso" />

            <label style={{ marginTop: '12px', fontWeight: 'bold', color: '#000' }}>Marque as funções liberadas:</label>
            <div className="multi-selecao" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <label className="multi-selecao-item"><input type="checkbox" defaultChecked /> <span>📥 Permitir Lançar Entradas</span></label>
              <label className="multi-selecao-item"><input type="checkbox" defaultChecked /> <span>📤 Permitir Lançar Saídas</span></label>
              <label className="multi-selecao-item"><input type="checkbox" /> <span>⚠️ Permitir Venda sem Estoque (Furar)</span></label>
              <label className="multi-selecao-item"><input type="checkbox" defaultChecked /> <span>💾 Permitir Criar Cadastros Gerais</span></label>
              <label className="multi-selecao-item"><input type="checkbox" defaultChecked /> <span>❌ Permitir Exclusões no Sistema</span></label>
              <label className="multi-selecao-item"><input type="checkbox" defaultChecked /> <span>📋 Exportar Dados (Excel/PDF)</span></label>
              <label className="multi-selecao-item"><input type="checkbox" defaultChecked /> <span>🤖 Permitir Usar Assistente IA</span></label>
            </div>

            {msgUsuario && <div className={`resultado ${msgUsuario.tipo}`}>{msgUsuario.texto}</div>}
            <div style={{ marginTop: '8px' }}>
              <button
                className="btn btn-salvar"
                onClick={() => {
                  mostrarMsg("Usuário configurado e salvo com sucesso!", "sucesso", setMsgUsuario);
                }}
              >
                Salvar Usuário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PÁGINA RELATÓRIO GERAL AVANÇADO (RELATÓRIO BONITÃO) */}
      {/* ========================================================================= */}
      {paginaAtiva === 'relatorio-bonitao' && (
        <div className="card">
          <button className="btn btn-voltar" onClick={() => setPaginaAtiva('configuracao')}>⬅️ Voltar</button>

          {/* EXPORTAÇÃO HAMBURGUER */}
          <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
            <button
              onClick={() => setMenuExportarAberto(!menuExportarAberto)}
              title="Opções de Exportação"
              style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#444' }}
            >
              ☰
            </button>
            {menuExportarAberto && (
              <div style={{ position: 'absolute', right: 0, top: '28px', backgroundColor: 'white', minWidth: '140px', boxShadow: '0px 4px 8px rgba(0,0,0,0.15)', border: '1px solid #ddd', borderRadius: '6px', zIndex: 1000 }}>
                <div onClick={exportarCSV} style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                  <div className="mini-planilha"><div className="linha-planilha"></div><div className="linha-planilha"></div><div className="linha-planilha"></div></div>
                  <span style={{ color: '#107c41' }}>Excel / CSV</span>
                </div>
                <div onClick={() => { window.print(); setMenuExportarAberto(false); }} style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', borderTop: '1px solid #eee' }}>
                  <span style={{ color: '#e74c3c' }}>🖨️ Imprimir / PDF</span>
                </div>
              </div>
            )}
          </div>

          <h3 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 'bold' }}>📊 Relatório Geral Avançado</h3>

          {/* PAINEL DE FILTROS AVANÇADOS INTELIGENTES */}
          <div style={{ border: '1px solid #ced4da', borderRadius: '4px', backgroundColor: '#f8f9fa', marginBottom: '15px' }}>
            <div style={{ backgroundColor: '#e9ecef', padding: '6px 10px', fontWeight: 'bold', fontSize: '11px', color: '#495057', borderBottom: '1px solid #ced4da', textTransform: 'uppercase' }}>
              Filtros Avançados Inteligentes
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid #ced4da', flexWrap: 'wrap' }}>
              <div style={{ padding: '8px', flex: 1, minWidth: '260px', display: 'flex', gap: '8px', alignItems: 'flex-end', backgroundColor: '#ffffff' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#495057' }}>Campo de Filtragem</label>
                  <select value={campoFiltroRel} onChange={(e: any) => { setCampoFiltroRel(e.target.value); setValorFiltroRel(''); }}>
                    <option value="data">Período (Data)</option>
                    <option value="fazenda">Fazenda</option>
                    <option value="cultura">Cultura</option>
                    <option value="produto">Produto</option>
                    <option value="tipo">Tipo Movimento</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#495057' }}>Valor do Filtro</label>
                  {campoFiltroRel === 'data' && (
                    <input type="date" value={valorFiltroRel || dataHoje()} onChange={(e) => setValorFiltroRel(e.target.value)} />
                  )}
                  {campoFiltroRel === 'fazenda' && (
                    <select value={valorFiltroRel} onChange={(e) => setValorFiltroRel(e.target.value)}>
                      <option value="">Selecione</option>
                      {cadastros.fazenda.map((f: any) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                    </select>
                  )}
                  {campoFiltroRel === 'cultura' && (
                    <select value={valorFiltroRel} onChange={(e) => setValorFiltroRel(e.target.value)}>
                      <option value="">Selecione</option>
                      {cadastros.cultura.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  )}
                  {campoFiltroRel === 'produto' && (
                    <select value={valorFiltroRel} onChange={(e) => setValorFiltroRel(e.target.value)}>
                      <option value="">Selecione</option>
                      {cadastros.produto.map((p: any) => <option key={p.id} value={p.id}>{limparNomeProduto(p.nome)}</option>)}
                    </select>
                  )}
                  {campoFiltroRel === 'tipo' && (
                    <select value={valorFiltroRel} onChange={(e) => setValorFiltroRel(e.target.value)}>
                      <option value="">Selecione</option>
                      <option value="Entrada">Entrada (📥)</option>
                      <option value="Saída">Saída (📤)</option>
                    </select>
                  )}
                </div>
              </div>

              {/* AÇÕES FILTRO LATERAL */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '4px', padding: '6px 10px', backgroundColor: '#f1f3f5', borderLeft: '1px solid #ced4da', borderRight: '1px solid #ced4da', minWidth: '44px' }}>
                <button
                  className="btn-acao"
                  style={{ color: 'green', fontWeight: 'bold' }}
                  title="Adicionar Condição"
                  onClick={() => {
                    const val = valorFiltroRel || (campoFiltroRel === 'data' ? dataHoje() : '');
                    if (!val) return;
                    let label = "Campo";
                    let texto = val;
                    if (campoFiltroRel === 'data') { label = "Data"; texto = val.split('-').reverse().join('/'); }
                    else if (campoFiltroRel === 'fazenda') { label = "Fazenda"; texto = cadastros.fazenda.find((f: any) => f.id === parseInt(val, 10))?.nome || val; }
                    else if (campoFiltroRel === 'cultura') { label = "Cultura"; texto = cadastros.cultura.find((c: any) => c.id === parseInt(val, 10))?.nome || val; }
                    else if (campoFiltroRel === 'produto') { label = "Produto"; texto = limparNomeProduto(cadastros.produto.find((p: any) => p.id === parseInt(val, 10))?.nome || val); }
                    else if (campoFiltroRel === 'tipo') { label = "Tipo"; texto = val; }

                    if (!filtrosAcumulados.some(f => f.campo === campoFiltroRel && f.valor === val)) {
                      setFiltrosAcumulados([...filtrosAcumulados, { campo: campoFiltroRel, label, valor: val, texto }]);
                    }
                  }}
                >
                  ▼
                </button>
                <button className="btn-acao" style={{ color: 'red' }} title="Limpar Tudo" onClick={() => setFiltrosAcumulados([])}>
                  ❌
                </button>
              </div>

              {/* CONDIÇÕES ATIVAS */}
              <div style={{ padding: '8px', flex: 1.5, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#495057', textTransform: 'uppercase' }}>Condições Aplicadas Ativas:</div>
                <div style={{ border: '1px dashed #ced4da', borderRadius: '4px', backgroundColor: '#fff', minHeight: '45px', padding: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {filtrosAcumulados.map((f, idx) => (
                    <div key={idx} className="tag-filtro">
                      <span><strong>{f.label}:</strong> {f.texto}</span>
                      <span className="remover-tag" onClick={() => setFiltrosAcumulados(filtrosAcumulados.filter((_, i) => i !== idx))}>×</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* TABELA DO RELATÓRIO */}
          <div className="tabela-wrapper">
            {movimentosRelatorio.length === 0 ? (
              <p className="vazio">Nenhum registro encontrado com os filtros aplicados.</p>
            ) : (
              <table className="tabela" style={{ minWidth: '900px' }}>
                <thead>
                  <tr style={{ background: '#0d47a1', color: 'white' }}>
                    <th>Op.</th>
                    <th>Data</th>
                    <th>Controle</th>
                    <th>Fazenda</th>
                    <th>Cultura</th>
                    <th>Pivô</th>
                    <th>Gleba</th>
                    <th>Variedade</th>
                    <th>Produto</th>
                    <th>Local</th>
                    <th>Embalagem</th>
                    <th>Qtd</th>
                  </tr>
                </thead>
                <tbody>
                  {movimentosRelatorio.map((m, idx) => {
                    const ctrl = cadastros.controle.find((x: any) => x.id === m.controleId);
                    const fazenda = cadastros.fazenda.find((x: any) => x.id === ctrl?.fazendaId)?.nome || '-';
                    const cultura = cadastros.cultura.find((x: any) => x.id === ctrl?.culturaId)?.nome || '-';
                    const pivo = cadastros.pivo.find((x: any) => x.id === ctrl?.pivoId)?.nome || '-';
                    const gleba = cadastros.gleba.find((x: any) => x.id === m.glebaId)?.nome || '-';
                    const variedadeItem = cadastros.variedade.find((x: any) => x.id === m.variedadeId)?.nome || '-';
                    const produto = limparNomeProduto(cadastros.produto.find((x: any) => x.id === m.produtoId)?.nome || '-');
                    const local = cadastros.local.find((x: any) => x.id === m.localId)?.nome || '-';
                    const dataBR = m.data ? m.data.split('-').reverse().join('/') : '-';
                    return (
                      <tr key={idx}>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge-mov ${m.tipo === 'Entrada' ? 'badge-ent' : 'badge-sai'}`}>{m.icone}</span>
                        </td>
                        <td>{dataBR}</td>
                        <td><strong>{ctrl?.cod || '-'}</strong></td>
                        <td>{fazenda}</td>
                        <td>{cultura}</td>
                        <td>{pivo}</td>
                        <td>{gleba}</td>
                        <td>{variedadeItem}</td>
                        <td><strong>{produto}</strong></td>
                        <td>{local}</td>
                        <td>{m.embalagem}</td>
                        <td style={{ fontWeight: 'bold', color: m.tipo === 'Saída' ? '#dc3545' : '#1b5e20' }}>{m.qtd}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PÁGINA ENTRADA */}
      {/* ========================================================================= */}
      {paginaAtiva === 'entrada' && (
        <div className="card">
          <button className="btn-lupa-topo" onClick={abrirListaEntrada} title="Ver entradas">🔍</button>
          <button className="btn btn-voltar" onClick={() => setPaginaAtiva('inicial')}>⬅️ Voltar</button>
          <h3 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 'bold' }}>📥 Entrada de Estoque</h3>

          <div>
            <label>Data</label>
            <input type="date" value={formEntrada.data} disabled />

            <label>Número de Controle</label>
            <select
              value={formEntrada.controleId}
              onChange={(e) => {
                setFormEntrada({ ...formEntrada, controleId: e.target.value, glebaId: '', variedadeId: '', produtoId: '', localId: '' });
              }}
            >
              <option value="">Selecione</option>
              {cadastros.controle.map((c: any) => <option key={c.id} value={c.id}>{c.cod}</option>)}
            </select>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '8px 0' }}>
              <div>
                <label>Fazenda</label>
                <input type="text" disabled value={cadastros.fazenda.find((f: any) => f.id === controleEntradaObj?.fazendaId)?.nome || ''} />
              </div>
              <div>
                <label>Cultura</label>
                <input type="text" disabled value={cadastros.cultura.find((cu: any) => cu.id === controleEntradaObj?.culturaId)?.nome || ''} />
              </div>
              <div>
                <label>Pivô</label>
                <input type="text" disabled value={cadastros.pivo.find((p: any) => p.id === controleEntradaObj?.pivoId)?.nome || ''} />
              </div>
              <div>
                <label>Gleba</label>
                <select value={formEntrada.glebaId} onChange={(e) => setFormEntrada({ ...formEntrada, glebaId: e.target.value })}>
                  <option value="">Selecione</option>
                  {(controleEntradaObj?.glebasIds || []).map((gId: number) => {
                    const g = cadastros.gleba.find((x: any) => x.id === gId);
                    return g ? <option key={g.id} value={g.id}>{g.nome}</option> : null;
                  })}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              <div>
                <label>Variedade</label>
                <select value={formEntrada.variedadeId} onChange={(e) => setFormEntrada({ ...formEntrada, variedadeId: e.target.value })}>
                  <option value="">{controleEntradaObj ? 'Selecione' : 'Selecione o controle primeiro'}</option>
                  {controleEntradaObj && cadastros.variedade.filter((v: any) => v.culturaId === controleEntradaObj.culturaId).map((v: any) => (
                    <option key={v.id} value={v.id}>{v.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Tipo de Embalagem</label>
                <select value={formEntrada.embalagem} onChange={(e) => setFormEntrada({ ...formEntrada, embalagem: e.target.value })}>
                  <option value="">Selecione</option>
                  <option value="Saco">Saco</option>
                  <option value="Caixa">Caixa</option>
                  <option value="Contentor">Contentor</option>
                </select>
              </div>
            </div>

            <label>Produto (Classificação Comercial)</label>
            <select value={formEntrada.produtoId} onChange={(e) => setFormEntrada({ ...formEntrada, produtoId: e.target.value })}>
              <option value="">{controleEntradaObj ? 'Selecione' : 'Selecione o controle primeiro'}</option>
              {controleEntradaObj && cadastros.produto.filter((p: any) => p.culturaId === controleEntradaObj.culturaId).map((p: any) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>

            <label>Local de Armazenamento</label>
            <select value={formEntrada.localId} onChange={(e) => setFormEntrada({ ...formEntrada, localId: e.target.value })}>
              <option value="">{controleEntradaObj ? 'Selecione' : 'Selecione o controle primeiro'}</option>
              {controleEntradaObj && cadastros.local.filter((l: any) => l.culturaId === controleEntradaObj.culturaId).map((l: any) => (
                <option key={l.id} value={l.id}>{l.nome}</option>
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

            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              <button className="btn btn-salvar" onClick={salvarEntrada}>✅ Lançar Entrada</button>
              {formEntrada.id && (
                <button
                  className="btn btn-cancelar"
                  onClick={() => setFormEntrada({ id: null, data: dataHoje(), controleId: '', glebaId: '', variedadeId: '', produtoId: '', localId: '', embalagem: '', qtd: '' })}
                >
                  ❌ Cancelar
                </button>
              )}
            </div>

            {msgEntrada && <div className={`resultado ${msgEntrada.tipo}`}>{msgEntrada.texto}</div>}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PÁGINA SAÍDA */}
      {/* ========================================================================= */}
      {paginaAtiva === 'saida' && (
        <div className="card">
          <button className="btn-lupa-topo" onClick={abrirListaSaida} title="Ver saídas">🔍</button>
          <button className="btn btn-voltar" onClick={() => setPaginaAtiva('inicial')}>⬅️ Voltar</button>
          <h3 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 'bold' }}>📤 Saída de Estoque</h3>

          <div>
            <label>Data</label>
            <input type="date" value={formSaida.data} disabled />

            <label>Número de Controle</label>
            <select
              value={formSaida.controleId}
              onChange={(e) => {
                setFormSaida({ ...formSaida, controleId: e.target.value, produtoId: '', glebaId: '', variedadeId: '', localId: '', embalagem: '' });
              }}
            >
              <option value="">Selecione</option>
              {cadastros.controle.map((c: any) => <option key={c.id} value={c.id}>{c.cod}</option>)}
            </select>

            <label>Produto (Classificação Comercial)</label>
            <select
              value={formSaida.produtoId}
              onChange={(e) => {
                setFormSaida({ ...formSaida, produtoId: e.target.value });
              }}
            >
              <option value="">{controleSaidaObj ? 'Selecione o Produto' : 'Selecione o controle primeiro'}</option>
              {controleSaidaObj && cadastros.produto.filter((p: any) => p.culturaId === controleSaidaObj.culturaId).map((p: any) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '8px 0' }}>
              <div>
                <label>Fazenda</label>
                <input type="text" disabled value={cadastros.fazenda.find((f: any) => f.id === controleSaidaObj?.fazendaId)?.nome || ''} />
              </div>
              <div>
                <label>Cultura</label>
                <input type="text" disabled value={cadastros.cultura.find((cu: any) => cu.id === controleSaidaObj?.culturaId)?.nome || ''} />
              </div>
              <div>
                <label>Pivô</label>
                <input type="text" disabled value={cadastros.pivo.find((p: any) => p.id === controleSaidaObj?.pivoId)?.nome || ''} />
              </div>
              <div>
                <label>Gleba</label>
                <select value={formSaida.glebaId} onChange={(e) => setFormSaida({ ...formSaida, glebaId: e.target.value })}>
                  <option value="">Selecione</option>
                  {(controleSaidaObj?.glebasIds || []).map((gId: number) => {
                    const g = cadastros.gleba.find((x: any) => x.id === gId);
                    return g ? <option key={g.id} value={g.id}>{g.nome}</option> : null;
                  })}
                </select>
              </div>
            </div>

            <label>Variedade</label>
            <select value={formSaida.variedadeId} onChange={(e) => setFormSaida({ ...formSaida, variedadeId: e.target.value })}>
              <option value="">Selecione</option>
              {controleSaidaObj && cadastros.variedade.filter((v: any) => v.culturaId === controleSaidaObj.culturaId).map((v: any) => (
                <option key={v.id} value={v.id}>{v.nome}</option>
              ))}
            </select>

            <label>Local de Armazenamento</label>
            <select value={formSaida.localId} onChange={(e) => setFormSaida({ ...formSaida, localId: e.target.value })}>
              <option value="">Selecione</option>
              {controleSaidaObj && cadastros.local.filter((l: any) => l.culturaId === controleSaidaObj.culturaId).map((l: any) => (
                <option key={l.id} value={l.id}>{l.nome}</option>
              ))}
            </select>

            <label>Tipo de Embalagem</label>
            <select value={formSaida.embalagem} onChange={(e) => setFormSaida({ ...formSaida, embalagem: e.target.value })}>
              <option value="">Selecione</option>
              <option value="Caixa">Caixa</option>
              <option value="Contentor">Contentor</option>
              <option value="Saco">Saco</option>
            </select>

            <label>Quantidade (unidades)</label>
            <input
              type="number"
              min="1"
              value={formSaida.qtd}
              onChange={(e) => setFormSaida({ ...formSaida, qtd: e.target.value })}
              placeholder="Ex: 50"
            />

            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              <button className="btn btn-salvar" onClick={salvarSaida}>✅ Lançar Saída</button>
              {formSaida.id && (
                <button
                  className="btn btn-cancelar"
                  onClick={() => setFormSaida({ id: null, data: dataHoje(), controleId: '', glebaId: '', variedadeId: '', produtoId: '', localId: '', embalagem: '', qtd: '' })}
                >
                  ❌ Cancelar
                </button>
              )}
            </div>

            {msgSaida && <div className={`resultado ${msgSaida.tipo}`}>{msgSaida.texto}</div>}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. ABA DETALHES (MODAL COMPLETO) */}
      {/* ========================================================================= */}
      {abaDetalhesAberta && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', zIndex: 99999, justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'white', width: '95%', maxWidth: '850px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#e3f2fd', borderBottom: '2px solid #bbdefb' }}>
              <h3 style={{ color: '#0d47a1', fontWeight: 'bold', fontSize: '15px', margin: 0 }}>{tituloAba}</h3>
              <button
                onClick={() => setAbaDetalhesAberta(false)}
                style={{ background: '#0d47a1', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
              >
                &times;
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {tipoAbaDetalhes === 'cadastro' && (
                <div className="tabela-wrapper">
                  {(cadastros as any)[tipoAtual].length === 0 ? (
                    <p className="vazio">Nenhum registro encontrado</p>
                  ) : (
                    <table className="tabela">
                      <thead>
                        <tr>
                          <th style={{ color: 'white', background: '#1f7294' }}>Informações</th>
                          <th style={{ color: 'white', background: '#1f7294', textAlign: 'center', width: '80px' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(cadastros as any)[tipoAtual].map((item: any) => {
                          let info = '';
                          if (tipoAtual === 'cultura') info = `Cód: ${item.cod} | Nome: ${item.nome}`;
                          else if (tipoAtual === 'variedade') info = `Cultura: ${cadastros.cultura.find((c: any) => c.id === item.culturaId)?.nome || '-'} | Nome: ${item.nome}`;
                          else if (tipoAtual === 'produto') info = `Cultura: ${cadastros.cultura.find((c: any) => c.id === item.culturaId)?.nome || '-'} | Cód: ${item.cod} | Nome: ${item.nome}`;
                          else if (tipoAtual === 'local') info = `Cultura: ${cadastros.cultura.find((c: any) => c.id === item.culturaId)?.nome || '-'} | Nome: ${item.nome}`;
                          else if (tipoAtual === 'fazenda' || tipoAtual === 'gleba' || tipoAtual === 'pivo') info = `Nome: ${item.nome}`;
                          else if (tipoAtual === 'controle') {
                            const glebasNomes = (item.glebasIds || []).map((id: number) => cadastros.gleba.find((g: any) => g.id === id)?.nome).filter(Boolean).join(', ');
                            info = `Controle: ${item.cod} | Fazenda: ${cadastros.fazenda.find((f: any) => f.id === item.fazendaId)?.nome || '-'} | Glebas: [${glebasNomes}]`;
                          }
                          return (
                            <tr key={item.id}>
                              <td>{info}</td>
                              <td style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                <button className="btn-acao" onClick={() => editarRegistro(item)} title="Editar">
                                  <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                                </button>
                                <button className="btn-acao" onClick={() => excluirRegistro(item.id)} title="Excluir">
                                  <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {tipoAbaDetalhes === 'entrada' && (
                <div className="tabela-wrapper">
                  {entradas.length === 0 ? (
                    <p className="vazio">Nenhuma entrada cadastrada</p>
                  ) : (
                    <table className="tabela">
                      <thead>
                        <tr>
                          <th style={{ color: 'white', background: '#1f7294' }}>Data</th>
                          <th style={{ color: 'white', background: '#1f7294' }}>Local</th>
                          <th style={{ color: 'white', background: '#1f7294' }}>Produto</th>
                          <th style={{ color: 'white', background: '#1f7294' }}>Controle</th>
                          <th style={{ color: 'white', background: '#1f7294' }}>Qtd</th>
                          <th style={{ color: 'white', background: '#1f7294', textAlign: 'center', width: '80px' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entradas.map((l) => {
                          const dataBR = l.data ? l.data.split('-').reverse().join('/') : '-';
                          return (
                            <tr key={l.id}>
                              <td>{dataBR}</td>
                              <td>{cadastros.local.find((x: any) => x.id === l.localId)?.nome || '-'}</td>
                              <td>{cadastros.produto.find((x: any) => x.id === l.produtoId)?.nome || '-'}</td>
                              <td>{cadastros.controle.find((x: any) => x.id === l.controleId)?.cod || '-'}</td>
                              <td><strong>{l.qtd}</strong> ({l.embalagem})</td>
                              <td style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                <button className="btn-acao" onClick={() => editarEntradaItem(l)} title="Editar">
                                  <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                                </button>
                                <button className="btn-acao" onClick={() => excluirEntradaItem(l.id)} title="Excluir">
                                  <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {tipoAbaDetalhes === 'saida' && (
                <div className="tabela-wrapper">
                  {saidas.length === 0 ? (
                    <p className="vazio">Nenhuma saída cadastrada</p>
                  ) : (
                    <table className="tabela">
                      <thead>
                        <tr>
                          <th style={{ color: 'white', background: '#1f7294' }}>Data</th>
                          <th style={{ color: 'white', background: '#1f7294' }}>Local</th>
                          <th style={{ color: 'white', background: '#1f7294' }}>Produto</th>
                          <th style={{ color: 'white', background: '#1f7294' }}>Controle</th>
                          <th style={{ color: 'white', background: '#1f7294' }}>Qtd</th>
                          <th style={{ color: 'white', background: '#1f7294', textAlign: 'center', width: '80px' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {saidas.map((l) => {
                          const dataBR = l.data ? l.data.split('-').reverse().join('/') : '-';
                          return (
                            <tr key={l.id}>
                              <td>{dataBR}</td>
                              <td>{cadastros.local.find((x: any) => x.id === l.localId)?.nome || '-'}</td>
                              <td>{cadastros.produto.find((x: any) => x.id === l.produtoId)?.nome || '-'}</td>
                              <td>{cadastros.controle.find((x: any) => x.id === l.controleId)?.cod || '-'}</td>
                              <td style={{ color: '#dc3545', fontWeight: 'bold' }}>{l.qtd} ({l.embalagem})</td>
                              <td style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                <button className="btn-acao" onClick={() => editarSaidaItem(l)} title="Editar">
                                  <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                                </button>
                                <button className="btn-acao" onClick={() => excluirSaidaItem(l.id)} title="Excluir">
                                  <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
