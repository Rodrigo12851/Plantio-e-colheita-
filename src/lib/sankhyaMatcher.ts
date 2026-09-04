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
 * Converte numeral romano (I a XXX) para arábico
 */
export function romanToArabic(roman: string): number | null {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  const r = roman.trim().toUpperCase();
  if (r === 'VIIII') return 9;
  if (!/^[IVXLCDM]+$/.test(r)) return null;
  let total = 0;
  for (let i = 0; i < r.length; i++) {
    const curr = map[r[i]];
    const next = map[r[i + 1]];
    if (next && next > curr) {
      total += next - curr;
      i++;
    } else {
      total += curr;
    }
  }
  return total > 0 && total < 100 ? total : null;
}

/**
 * Converte numeral arábico (1 a 99) para romano
 */
export function arabicToRoman(num: number): string {
  const lookup: [number, string][] = [
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'],
    [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let res = '';
  let n = num;
  for (const [val, rom] of lookup) {
    while (n >= val) {
      res += rom;
      n -= val;
    }
  }
  return res;
}

/**
 * Gera todos os tokens equivalentes de um pivô (arábico, romano, com e sem zeros à esquerda)
 * Ex: "X" -> ["X", "10", "010"]
 * Ex: "10" -> ["10", "X", "010"]
 * Ex: "Pivô 02" -> ["2", "02", "II"]
 * Ex: "SQ" -> ["SQ"]
 */
export function extractPivoTokens(pivo: string | undefined): string[] {
  if (!pivo) return [];
  const norm = normalizeText(pivo);
  const clean = norm.replace(/^PIV[OÔ]\s*/i, '').replace(/^P\s*/i, '').trim();
  const tokens = new Set<string>();
  if (clean) tokens.add(clean);
  if (norm) tokens.add(norm);

  // Se contém dígitos arábicos
  const digits = clean.replace(/\D/g, '');
  if (digits) {
    const num = parseInt(digits, 10);
    if (!isNaN(num) && num > 0) {
      tokens.add(num.toString());
      tokens.add(num.toString().padStart(2, '0'));
      const rom = arabicToRoman(num);
      if (rom) {
        tokens.add(rom);
        if (rom === 'IX') tokens.add('VIIII');
      }
    }
  } else {
    // Se for numeral romano puro (ex: X, VII, II, etc.)
    const arab = romanToArabic(clean);
    if (arab) {
      tokens.add(arab.toString());
      tokens.add(arab.toString().padStart(2, '0'));
      const rom = arabicToRoman(arab);
      if (rom) tokens.add(rom);
      if (clean === 'IX') tokens.add('VIIII');
      if (clean === 'VIIII') tokens.add('IX');
    }
  }
  return Array.from(tokens).filter(Boolean);
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
  const clean = normalizeText(pivo).replace(/^PIV[OÔ]\s*/i, '').replace(/^P\s*/i, '').trim();
  const arab = romanToArabic(clean);
  if (arab !== null) {
    return arab.toString();
  }
  return clean;
}

/**
 * Remove prefixos de fazenda como "FAZENDA " para comparar apenas o nome essencial
 * Ex: "Fazenda Crioulo" -> "CRIOULO", "Fazenda Samambaia" -> "SAMAMBAIA", "Ipê" -> "IPE"
 */
export function extractFazendaCore(fazenda: string | undefined): string {
  if (!fazenda) return '';
  let norm = normalizeText(fazenda);
  norm = norm.replace(/^FAZENDA\s+/, '').replace(/^FZ\s+/, '').replace(/^FAZ\s+/, '').trim();
  return norm;
}

/**
 * Extrai anos de safras em formatos variados (2025/26, 2026, 2025/2026, etc.)
 */
export function extractYears(str: string | undefined | null): string[] {
  if (!str) return [];
  const s = String(str).replace(/\s/g, '');
  const years = new Set<string>();
  const slashMatch = s.match(/(\d{4})\/(\d{2,4})/);
  if (slashMatch) {
    const y1 = parseInt(slashMatch[1], 10);
    let y2 = parseInt(slashMatch[2], 10);
    if (slashMatch[2].length === 2) {
      const century = Math.floor(y1 / 100) * 100;
      y2 = century + y2;
    }
    years.add(String(y1));
    years.add(String(y2));
    years.add(String(y1).slice(-2));
    years.add(String(y2).slice(-2));
    years.add(`${y1}/${String(y2).slice(-2)}`);
    years.add(`${y1}/${y2}`);
  }
  const d4 = s.match(/\d{4}/g) || [];
  d4.forEach(y => {
    years.add(y);
    years.add(y.slice(-2));
  });
  return Array.from(years);
}

/**
 * Compara dois anos ou safras (ex: "2025/26" com "2026")
 */
export function matchAno(ano1: string | undefined | null, ano2: string | undefined | null): boolean {
  if (!ano1 || !ano2) return true;
  const s1 = String(ano1).trim();
  const s2 = String(ano2).trim();
  if (s1 === s2) return true;
  const y1 = extractYears(s1);
  const y2 = extractYears(s2);
  return y1.some(y => y2.includes(y));
}

/**
 * Compara nomes de fazenda removendo acentos e prefixos
 */
export function matchFazenda(faz1: string | undefined | null, faz2: string | undefined | null): boolean {
  if (!faz1 || !faz2) return false;
  const n1 = extractFazendaCore(faz1);
  const n2 = extractFazendaCore(faz2);
  return n1 === n2 || n1.includes(n2) || n2.includes(n1);
}

/**
 * Compara nomes de cultura removendo acentos e caixa
 */
export function matchCultura(cult1: string | undefined | null, cult2: string | undefined | null): boolean {
  if (!cult1 || !cult2) return false;
  const n1 = normalizeText(cult1);
  const n2 = normalizeText(cult2);
  return n1 === n2 || n1.includes(n2) || n2.includes(n1);
}

/**
 * Compara identificadores de pivô (romano, arábico, prefixos)
 */
export function matchPivo(piv1: string | undefined | null, piv2: string | undefined | null): boolean {
  if (!piv1 || !piv2) return false;
  const t1 = extractPivoTokens(piv1);
  const t2 = extractPivoTokens(piv2);
  return t1.some(t => t2.includes(t));
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
    'COUVE',
    'MIRTILO',
    'MORANGO',
    'PEPINO',
    'BROCOLIS',
    'CHUCHU'
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
  const pivoTokens = extractPivoTokens(pivo);
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
      let matchFaz = identNorm.includes(fazCore);
      if (!matchFaz) {
        // Tenta sem sufixos numéricos (ex: "BOA VISTA 03" -> "BOA VISTA")
        const withoutNums = fazCore.replace(/\s*\d+$/, '').trim();
        if (withoutNums && identNorm.includes(withoutNums)) {
          matchFaz = true;
        }
      }
      if (!matchFaz) continue;
    }

    // 4. Validação de Pivô (se fornecido - suporta arábico, romano e com/sem zeros)
    if (pivoTokens.length > 0) {
      const matchPivo = pivoTokens.some(tok => {
        const escaped = tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pivoRegex = new RegExp(
          `\\bPIV[OÔ]\\s*0?${escaped}\\b|\\bP\\s*0?${escaped}\\b|\\b${escaped}\\b`,
          'i'
        );
        return (
          pivoRegex.test(identNorm) ||
          identNorm.includes(`PIVO ${tok}`) ||
          identNorm.includes(`PIVÔ ${tok}`) ||
          identNorm.includes(`PIVO0${tok}`) ||
          identNorm.includes(`PIVO: ${tok}`) ||
          identNorm.includes(`- ${tok} -`) ||
          identNorm.includes(`- ${tok}`) ||
          identNorm.includes(` ${tok} -`) ||
          identNorm.endsWith(` ${tok}`)
        );
      });
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
