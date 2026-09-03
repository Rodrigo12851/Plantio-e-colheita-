import { SankhyaProjectItem } from '../components/SankhyaSection';

export interface SankhyaMatchResult {
  matches: {
    project: SankhyaProjectItem;
    glebaMatch?: string;
  }[];
  lotes: string[];
  descricaoLote: string;
  projetoSankhya: string;
  identificacaoSankhya: string;
}

export function normalizeText(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

/**
 * Normaliza número/identificador de pivô para comparação flexível
 * Ex: "Pivô 02" -> "2", "P2" -> "2", "01" -> "1"
 */
export function extractPivoDigits(pivo: string | undefined): string {
  if (!pivo) return '';
  const digits = pivo.replace(/\D/g, '');
  if (digits) {
    return parseInt(digits, 10).toString();
  }
  return normalizeText(pivo);
}

/**
 * Remove prefixos de fazenda como "FAZENDA " para comparar apenas o nome essencial
 * Ex: "Fazenda Crioulo" -> "CRIOULO", "Fazenda Samambaia" -> "SAMAMBAIA"
 */
export function extractFazendaCore(fazenda: string | undefined): string {
  if (!fazenda) return '';
  let norm = normalizeText(fazenda);
  norm = norm.replace(/^FAZENDA\s+/, '').replace(/^FZ\s+/, '').trim();
  return norm;
}

/**
 * Normaliza ano safra para comparação flexível
 * Ex: "2025/26" -> ["2025/26", "25/26", "2025", "2026"]
 */
export function extractSafraTokens(safra: string | undefined): string[] {
  if (!safra) return [];
  const clean = normalizeText(safra).replace(/\s+/g, '');
  const tokens = [clean];
  if (clean.includes('/')) {
    const parts = clean.split('/');
    tokens.push(parts[0], parts[1]);
    if (parts[0].length === 4 && parts[1].length === 2) {
      tokens.push(`${parts[0].slice(2)}/${parts[1]}`);
    }
  } else if (clean.includes('-')) {
    const parts = clean.split('-');
    tokens.push(parts[0], parts[1]);
  }
  return Array.from(new Set(tokens.filter(Boolean)));
}

/**
 * Verifica se a cultura é Hortifrúti (não leva gleba na identificação Sankhya)
 * ou Cereais (leva gleba na identificação Sankhya)
 */
export function isCulturaHortifruti(
  cultura: string | undefined,
  culturasData?: { nome: string; tipo?: string }[]
): boolean {
  if (!cultura) return false;
  const normCult = normalizeText(cultura);

  // 1. Consulta o cadastro de culturas se disponível
  if (culturasData && culturasData.length > 0) {
    const found = culturasData.find(c => normalizeText(c.nome) === normCult);
    if (found?.tipo) {
      return normalizeText(found.tipo) === 'HORTIFRUTI';
    }
  }

  // 2. Regras heurísticas agrícolas conhecidas
  const hortiList = [
    'CEBOLA',
    'CENOURA',
    'ALHO',
    'BATATA',
    'TOMATE',
    'BETERRABA',
    'PIMENTAO',
    'MELANCIA',
    'MELAO',
    'ABOBORA',
    'REPOLHO',
    'COUVE'
  ];

  return hortiList.some(h => normCult.includes(h));
}

/**
 * Analisa a identificação de um projeto Sankhya
 * Ex: "SOJA - CRIOULO - PIVO 2 - C1 - 2025/26"
 * Ex: "CEBOLA - CRIOULO - PIVO 1 - 2025/26"
 */
export function parseIdentificacaoSankhya(ident: string | undefined): {
  cultura?: string;
  fazenda?: string;
  pivo?: string;
  gleba?: string;
  safra?: string;
} {
  if (!ident) return {};
  const parts = ident.split('-').map(p => p.trim());
  if (parts.length >= 4) {
    return {
      cultura: parts[0],
      fazenda: parts[1],
      pivo: parts[2],
      gleba: parts.length >= 5 ? parts[3] : undefined,
      safra: parts[parts.length - 1]
    };
  }
  return {};
}

/**
 * Motor de correspondência inteligente:
 * Analisa a identificação no projeto Sankhya para encontrar a descrição do lote
 * conforme Safra, Cultura, Fazenda, Pivô e Gleba (se Cereais)
 */
export function matchSankhyaProjectForTie({
  ano,
  cultura,
  fazenda,
  pivo,
  glebas,
  sankhyaProjects,
  isHortifruti: forceHorti
}: {
  ano?: string;
  cultura?: string;
  fazenda?: string;
  pivo?: string;
  glebas?: string[];
  sankhyaProjects: SankhyaProjectItem[];
  isHortifruti?: boolean;
}): SankhyaMatchResult {
  const result: SankhyaMatchResult = {
    matches: [],
    lotes: [],
    descricaoLote: '',
    projetoSankhya: '',
    identificacaoSankhya: ''
  };

  if (!sankhyaProjects || sankhyaProjects.length === 0) return result;
  if (!cultura) return result;

  const normCult = normalizeText(cultura);
  const isHorti = forceHorti !== undefined ? forceHorti : isCulturaHortifruti(cultura);
  const fazCore = extractFazendaCore(fazenda);
  const pivoDigits = extractPivoDigits(pivo);
  const safraTokens = extractSafraTokens(ano);

  // Filtra projetos que correspondam aos critérios básicos: Cultura, Safra, Fazenda, Pivô
  for (const proj of sankhyaProjects) {
    const identNorm = normalizeText(proj.identificacao);
    const abrevNorm = normalizeText(proj.abreviacaoProjeto);
    const safraNorm = normalizeText(proj.safra);

    // 1. Validação de Cultura
    const matchCult =
      identNorm.includes(normCult) ||
      abrevNorm.includes(normCult) ||
      (normCult.includes('SOJA') && identNorm.includes('SOJA')) ||
      (normCult.includes('MILHO') && identNorm.includes('MILHO')) ||
      (normCult.includes('FEIJAO') && identNorm.includes('FEIJAO')) ||
      (normCult.includes('CEBOLA') && identNorm.includes('CEBOLA')) ||
      (normCult.includes('CENOURA') && identNorm.includes('CENOURA')) ||
      (normCult.includes('ALHO') && identNorm.includes('ALHO')) ||
      (normCult.includes('BATATA') && identNorm.includes('BATATA'));

    if (!matchCult) continue;

    // 2. Validação de Safra / Ano (se fornecido)
    if (safraTokens.length > 0) {
      const matchSafra = safraTokens.some(
        tok => safraNorm.includes(tok) || identNorm.includes(tok)
      );
      if (!matchSafra) continue;
    }

    // 3. Validação de Fazenda (se fornecida)
    if (fazCore) {
      const matchFaz = identNorm.includes(fazCore);
      if (!matchFaz) continue;
    }

    // 4. Validação de Pivô (se fornecido)
    if (pivoDigits) {
      // Procura padrões como "PIVO 2", "PIVO 02", "PIVÔ 2", "- 2 -", "P 2"
      const pivoRegex = new RegExp(`\\bPIV[OÔ]\\s*0?${pivoDigits}\\b|\\bP\\s*0?${pivoDigits}\\b`, 'i');
      const matchPivo = pivoRegex.test(identNorm) || identNorm.includes(`PIVO ${pivoDigits}`);
      if (!matchPivo) continue;
    }

    // 5. Validação de Gleba
    if (isHorti) {
      // Para Hortifrúti: "Não tem a gleba nas descrições", portanto aceita direto!
      result.matches.push({
        project: proj
      });
    } else {
      // Para Cereais: "caso for caso de cereais vai ter. Ele vai analisar essas coisas."
      if (glebas && glebas.length > 0) {
        let glebaMatched: string | undefined;
        for (const g of glebas) {
          const gNorm = normalizeText(g);
          // Verifica se a gleba (ex: "C1", "C2", "GLEBA 1") está na identificação
          const gClean = gNorm.replace(/^GLEBA\s+/, '').trim();
          const gRegex = new RegExp(`\\b${gClean}\\b|\\b${gNorm}\\b`, 'i');
          if (gRegex.test(identNorm) || identNorm.includes(`- ${gClean} -`) || identNorm.includes(` ${gClean} `)) {
            glebaMatched = g;
            break;
          }
        }
        if (glebaMatched) {
          result.matches.push({
            project: proj,
            glebaMatch: glebaMatched
          });
        }
      } else {
        // Sem gleba informada, adiciona o projeto como correspondência geral
        result.matches.push({
          project: proj
        });
      }
    }
  }

  // Monta os lotes e projetos consolidados
  const lotesSet = new Set<string>();
  const projSet = new Set<string>();
  const identsSet = new Set<string>();

  result.matches.forEach(m => {
    if (m.project.descricaoLote) lotesSet.add(m.project.descricaoLote.trim());
    if (m.project.projeto) projSet.add(m.project.projeto.trim());
    if (m.project.identificacao) identsSet.add(m.project.identificacao.trim());
  });

  result.lotes = Array.from(lotesSet);
  result.descricaoLote = result.lotes.join(', ');
  result.projetoSankhya = Array.from(projSet).join(', ');
  result.identificacaoSankhya = Array.from(identsSet).join(' | ');

  return result;
}
