import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';

export interface SankhyaProjectItem {
  id?: string;
  projeto: string;
  identificacao: string;
  abreviacaoProjeto: string;
  descricaoLote: string;
  safra: string;
  unidade?: string;
}

export interface SimpleItemProp {
  id?: string;
  codigo?: string;
  nome: string;
  tipo?: 'Hortifruti' | 'Cereais' | string;
  unidade?: string;
}

export interface ImportSankhyaDiff {
  field: string;
  label: string;
  oldVal: string;
  newVal: string;
}

export interface ParsedImportSankhyaItem extends SankhyaProjectItem {
  importStatus: 'identical' | 'update' | 'new';
  existingId?: string;
  diffs: ImportSankhyaDiff[];
}

export const cleanSankhyaValue = (val: any): string => {
  if (val === undefined || val === null) return '';
  const s = String(val).trim();
  if (s.toLowerCase() === 'undefined' || s.toLowerCase() === 'null') return '';
  return s;
};

export const normalizeSankhyaText = (str: any): string => {
  if (str === undefined || str === null) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ' ');
};

export const getSankhyaDocId = (projeto: string, safra?: string, identificacao?: string, unidade?: string): string => {
  const normProj = normalizeSankhyaText(projeto).replace(/[^a-z0-9]/g, '_');
  const normSafra = safra ? `_${normalizeSankhyaText(safra).replace(/[^a-z0-9]/g, '_')}` : '';
  const normId = identificacao ? `_${normalizeSankhyaText(identificacao).substring(0, 15).replace(/[^a-z0-9]/g, '_')}` : '';
  const normU = (unidade && unidade !== 'TODAS') ? `_${normalizeSankhyaText(unidade).replace(/[^a-z0-9]/g, '_')}` : '';
  return `sankhya_${normProj}${normSafra}${normId}${normU}`;
};

export const DEFAULT_PROJETOS_SANKHYA: SankhyaProjectItem[] = [
  {
    projeto: '301.101.201',
    identificacao: 'SOJA - CRIOULO - PIVO 2 - C1 - 2025/26',
    abreviacaoProjeto: 'SOJA',
    descricaoLote: 'SGB-2025/26-1201',
    safra: '2025/26',
    unidade: 'Cristalina'
  },
  {
    projeto: '301.101.202',
    identificacao: 'SOJA - CRIOULO - PIVO 3 - C2 - 2025/26',
    abreviacaoProjeto: 'SOJA',
    descricaoLote: 'SGB-2025/26-1202',
    safra: '2025/26',
    unidade: 'Cristalina'
  }
];

interface SankhyaSectionProps {
  items: SankhyaProjectItem[];
  selectedUnidade: string;
  culturas?: SimpleItemProp[];
  anos?: SimpleItemProp[];
  onSaveItem: (item: SankhyaProjectItem, id?: string) => Promise<void>;
  onDeleteItem: (id?: string) => Promise<void>;
  onImportBatch: (newItems: SankhyaProjectItem[]) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

export const SankhyaSection: React.FC<SankhyaSectionProps> = ({
  items,
  selectedUnidade,
  culturas = [],
  anos = [],
  onSaveItem,
  onDeleteItem,
  onImportBatch,
  showToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCultura, setFilterCultura] = useState('TODAS');
  const [filterSafra, setFilterSafra] = useState('TODAS');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SankhyaProjectItem | null>(null);

  const [formProjeto, setFormProjeto] = useState('');
  const [formIdentificacao, setFormIdentificacao] = useState('');
  const [formAbreviacaoProjeto, setFormAbreviacaoProjeto] = useState('');
  const [formDescricaoLote, setFormDescricaoLote] = useState('');
  const [formSafra, setFormSafra] = useState('');

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedPreview, setImportedPreview] = useState<ParsedImportSankhyaItem[]>([]);
  const [previewFilterTab, setPreviewFilterTab] = useState<'ALL' | 'CHANGES' | 'IDENTICAL'>('ALL');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-deduplicate items in memory
  const deduplicatedItems = useMemo(() => {
    const map = new Map<string, SankhyaProjectItem>();
    items.forEach(it => {
      // Support legacy keys if existing in Firestore
      const proj = cleanSankhyaValue(it.projeto || (it as any).codigoProjeto);
      const ident = cleanSankhyaValue(it.identificacao || (it as any).descricao);
      const abrev = cleanSankhyaValue(it.abreviacaoProjeto || (it as any).cultura);
      const lote = cleanSankhyaValue(it.descricaoLote || (it as any).observacao);
      const saf = cleanSankhyaValue(it.safra || (it as any).dataInicio);
      const unid = (it.unidade || '').trim().toLowerCase();

      const normalizedItem: SankhyaProjectItem = {
        id: it.id,
        projeto: proj,
        identificacao: ident,
        abreviacaoProjeto: abrev,
        descricaoLote: lote,
        safra: saf,
        unidade: it.unidade
      };

      const key = `${normalizeSankhyaText(proj)}___${normalizeSankhyaText(ident)}___${unid}`;
      if (!proj && !ident) return;

      if (map.has(key)) {
        const existing = map.get(key)!;
        if (lote.length > existing.descricaoLote.length || abrev.length > existing.abreviacaoProjeto.length) {
          map.set(key, normalizedItem);
        }
      } else {
        map.set(key, normalizedItem);
      }
    });
    return Array.from(map.values());
  }, [items]);

  // Unit isolation
  const unidadeItems = useMemo(() => {
    return deduplicatedItems.filter(item => !item.unidade || item.unidade === selectedUnidade || selectedUnidade === 'TODAS');
  }, [deduplicatedItems, selectedUnidade]);

  // Unique filters
  const uniqueCulturas = useMemo(() => {
    const fromCulturas = culturas.map(c => cleanSankhyaValue(c.nome)).filter(Boolean);
    const fromItems = unidadeItems.map(i => cleanSankhyaValue(i.abreviacaoProjeto)).filter(Boolean);
    return Array.from(new Set([...fromCulturas, ...fromItems])).sort();
  }, [culturas, unidadeItems]);

  const uniqueSafras = useMemo(() => {
    const fromAnos = anos.map(a => cleanSankhyaValue(a.nome)).filter(Boolean);
    const fromItems = unidadeItems.map(i => cleanSankhyaValue(i.safra)).filter(Boolean);
    return Array.from(new Set([...fromAnos, ...fromItems])).sort();
  }, [anos, unidadeItems]);

  // Filtered view
  const filteredItems = useMemo(() => {
    return unidadeItems.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const cProj = cleanSankhyaValue(item.projeto);
      const cIdent = cleanSankhyaValue(item.identificacao);
      const cAbrev = cleanSankhyaValue(item.abreviacaoProjeto);
      const cLote = cleanSankhyaValue(item.descricaoLote);
      const cSafra = cleanSankhyaValue(item.safra);

      const matchesSearch =
        !q ||
        cProj.toLowerCase().includes(q) ||
        cIdent.toLowerCase().includes(q) ||
        cAbrev.toLowerCase().includes(q) ||
        cLote.toLowerCase().includes(q) ||
        cSafra.toLowerCase().includes(q);

      const matchesCultura = filterCultura === 'TODAS' || cAbrev.toLowerCase() === filterCultura.toLowerCase();
      const matchesSafra = filterSafra === 'TODAS' || cSafra.toLowerCase() === filterSafra.toLowerCase();

      return matchesSearch && matchesCultura && matchesSafra;
    });
  }, [unidadeItems, searchQuery, filterCultura, filterSafra]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormProjeto('');
    setFormIdentificacao('');
    setFormAbreviacaoProjeto(culturas[0]?.nome || '');
    setFormDescricaoLote('');
    setFormSafra(anos[0]?.nome || '2025/26');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: SankhyaProjectItem) => {
    setEditingItem(item);
    setFormProjeto(cleanSankhyaValue(item.projeto));
    setFormIdentificacao(cleanSankhyaValue(item.identificacao));
    setFormAbreviacaoProjeto(cleanSankhyaValue(item.abreviacaoProjeto));
    setFormDescricaoLote(cleanSankhyaValue(item.descricaoLote));
    setFormSafra(cleanSankhyaValue(item.safra));
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const cProj = cleanSankhyaValue(formProjeto);
    const cIdent = cleanSankhyaValue(formIdentificacao);
    const cAbrev = cleanSankhyaValue(formAbreviacaoProjeto);
    const cLote = cleanSankhyaValue(formDescricaoLote);
    const cSafra = cleanSankhyaValue(formSafra);

    if (!cProj) {
      showToast('Por favor, informe o Projeto (ex: 301.101.201).', 'warning');
      return;
    }
    if (!cIdent) {
      showToast('Por favor, informe a Identificação do Projeto.', 'warning');
      return;
    }

    const docId = editingItem?.id || getSankhyaDocId(cProj, cSafra, cIdent, selectedUnidade);

    const payload: SankhyaProjectItem = {
      id: docId,
      projeto: cProj,
      identificacao: cIdent,
      abreviacaoProjeto: cAbrev,
      descricaoLote: cLote,
      safra: cSafra,
      unidade: selectedUnidade
    };

    // If new item, check for duplicates
    if (!editingItem?.id) {
      const existing = deduplicatedItems.find(
        i =>
          normalizeSankhyaText(i.projeto) === normalizeSankhyaText(payload.projeto) &&
          normalizeSankhyaText(i.identificacao) === normalizeSankhyaText(payload.identificacao) &&
          (!i.unidade || i.unidade === selectedUnidade || selectedUnidade === 'TODAS')
      );
      if (existing?.id) {
        if (window.confirm(`Já existe um Projeto Sankhya "${payload.projeto} - ${payload.identificacao}". Deseja atualizar o registro existente?`)) {
          await onSaveItem(payload, existing.id);
          setIsModalOpen(false);
          showToast('Projeto Sankhya existente atualizado com sucesso!', 'success');
          return;
        }
      }
    }

    await onSaveItem(payload, docId);
    setIsModalOpen(false);
    showToast(editingItem ? 'Projeto Sankhya atualizado!' : 'Projeto Sankhya cadastrado!', 'success');
  };

  const handleDelete = async (item: SankhyaProjectItem) => {
    if (window.confirm(`Deseja realmente excluir o projeto "${cleanSankhyaValue(item.projeto)} - ${cleanSankhyaValue(item.identificacao)}"?`)) {
      await onDeleteItem(item.id);
      showToast('Projeto excluído com sucesso!', 'info');
    }
  };

  // Excel / CSV File Parsing strictly supporting:
  // "Projeto", "Identificação", "Abreviação Projeto", "Descrição do Lote", "Safra"
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

        const headerRow = (jsonData[0] as any[]).map(h => normalizeSankhyaText(h));

        const findIndex = (keywords: string[]) => {
          return headerRow.findIndex(h => keywords.some(k => h.includes(k)));
        };

        const idxProj = findIndex(['projeto', 'cod', 'codigo']);
        const idxIdent = findIndex(['identificacao', 'identificacao projeto', 'descricao', 'nome']);
        const idxAbrev = findIndex(['abreviacao', 'abreviacao projeto', 'abrev', 'cultura']);
        const idxLote = findIndex(['descricao do lote', 'descricao lote', 'lote', 'sgb']);
        const idxSafra = findIndex(['safra', 'ano', 'ano safra']);

        // Build map of existing items
        const existingMap = new Map<string, SankhyaProjectItem>();
        deduplicatedItems.forEach(it => {
          const key = `${normalizeSankhyaText(it.projeto)}___${normalizeSankhyaText(it.identificacao)}`;
          if (it.projeto || it.identificacao) {
            existingMap.set(key, it);
          }
        });

        const parsedMap = new Map<string, ParsedImportSankhyaItem>();

        for (let r = 1; r < jsonData.length; r++) {
          const row = jsonData[r] as any[];
          if (!row || row.length === 0) continue;

          const colProj = cleanSankhyaValue(idxProj !== -1 ? row[idxProj] : row[0]);
          const colIdent = cleanSankhyaValue(idxIdent !== -1 ? row[idxIdent] : row[1]);
          const colAbrev = cleanSankhyaValue(idxAbrev !== -1 ? row[idxAbrev] : row[2]);
          const colLote = cleanSankhyaValue(idxLote !== -1 ? row[idxLote] : row[3]);
          const colSafra = cleanSankhyaValue(idxSafra !== -1 ? row[idxSafra] : row[4]);

          if (!colProj && !colIdent) continue;

          const finalProj = colProj || `PRJ-${r}`;
          const finalIdent = colIdent || finalProj;
          const normKey = `${normalizeSankhyaText(finalProj)}___${normalizeSankhyaText(finalIdent)}`;
          const existingItem = existingMap.get(normKey);

          const diffs: ImportSankhyaDiff[] = [];

          if (existingItem) {
            if (normalizeSankhyaText(existingItem.abreviacaoProjeto) !== normalizeSankhyaText(colAbrev) && colAbrev !== '') {
              diffs.push({ field: 'abreviacaoProjeto', label: 'Abreviação Projeto', oldVal: existingItem.abreviacaoProjeto, newVal: colAbrev });
            }
            if (cleanSankhyaValue(existingItem.descricaoLote) !== colLote && colLote !== '') {
              diffs.push({ field: 'descricaoLote', label: 'Descrição do Lote', oldVal: existingItem.descricaoLote || '(vazio)', newVal: colLote });
            }
            if (cleanSankhyaValue(existingItem.safra) !== colSafra && colSafra !== '') {
              diffs.push({ field: 'safra', label: 'Safra', oldVal: existingItem.safra || '(vazio)', newVal: colSafra });
            }
          }

          let importStatus: 'identical' | 'update' | 'new' = 'new';
          if (existingItem) {
            importStatus = diffs.length > 0 ? 'update' : 'identical';
          }

          const targetDocId = existingItem?.id || getSankhyaDocId(finalProj, colSafra, finalIdent, selectedUnidade);

          const parsedItem: ParsedImportSankhyaItem = {
            id: targetDocId,
            projeto: finalProj,
            identificacao: finalIdent,
            abreviacaoProjeto: colAbrev || existingItem?.abreviacaoProjeto || '',
            descricaoLote: colLote || existingItem?.descricaoLote || '',
            safra: colSafra || existingItem?.safra || '',
            unidade: selectedUnidade,
            importStatus,
            existingId: existingItem?.id,
            diffs
          };

          parsedMap.set(normKey, parsedItem);
        }

        const parsedItems = Array.from(parsedMap.values());

        if (parsedItems.length === 0) {
          showToast('Nenhum registro de projeto válido foi encontrado na planilha.', 'warning');
          return;
        }

        setImportedPreview(parsedItems);
        setPreviewFilterTab('ALL');
        setIsImportModalOpen(true);

        const newCount = parsedItems.filter(i => i.importStatus === 'new').length;
        const updateCount = parsedItems.filter(i => i.importStatus === 'update').length;
        const identicalCount = parsedItems.filter(i => i.importStatus === 'identical').length;

        showToast(`Análise concluída: ${newCount} novos, ${updateCount} a atualizar, ${identicalCount} idênticos mantidos.`, 'info');
      } catch (err) {
        console.error(err);
        showToast('Erro ao ler a planilha. Verifique se é um arquivo Excel ou CSV válido.', 'warning');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = async () => {
    const itemsToSave = importedPreview.filter(i => i.importStatus === 'new' || i.importStatus === 'update');

    if (itemsToSave.length === 0) {
      showToast('Todos os registros já estão idênticos no sistema. Nenhuma gravação necessária.', 'info');
      setIsImportModalOpen(false);
      return;
    }

    setIsImporting(true);
    try {
      const sanitizedBatch: SankhyaProjectItem[] = itemsToSave.map(item => ({
        id: item.id || getSankhyaDocId(item.projeto, item.safra, item.identificacao, selectedUnidade),
        projeto: cleanSankhyaValue(item.projeto),
        identificacao: cleanSankhyaValue(item.identificacao),
        abreviacaoProjeto: cleanSankhyaValue(item.abreviacaoProjeto),
        descricaoLote: cleanSankhyaValue(item.descricaoLote),
        safra: cleanSankhyaValue(item.safra),
        unidade: selectedUnidade
      }));

      await onImportBatch(sanitizedBatch);
      setIsImportModalOpen(false);

      const newCount = itemsToSave.filter(i => i.importStatus === 'new').length;
      const updateCount = itemsToSave.filter(i => i.importStatus === 'update').length;
      const identicalSkipped = importedPreview.length - itemsToSave.length;

      setImportedPreview([]);
      showToast(`Importação concluída: ${newCount} novos projetos, ${updateCount} atualizados. ${identicalSkipped} idênticos preservados.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar os registros importados.', 'warning');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = filteredItems.map(item => ({
      'Projeto': cleanSankhyaValue(item.projeto),
      'Identificação': cleanSankhyaValue(item.identificacao),
      'Abreviação Projeto': cleanSankhyaValue(item.abreviacaoProjeto),
      'Descrição do Lote': cleanSankhyaValue(item.descricaoLote),
      'Safra': cleanSankhyaValue(item.safra)
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Projetos_Sankhya');
    XLSX.writeFile(workbook, `Projetos_Sankhya_${selectedUnidade}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('Planilha Excel de Projetos Sankhya exportada com sucesso!', 'success');
  };

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
      {/* Top Header Bar */}
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
            width: '32px',
            height: '32px',
            borderRadius: '4px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px',
            fontWeight: 700
          }}>
            <i className="fa-solid fa-diagram-project"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>
                Projetos Sankhya
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
                backgroundColor: '#e0f2fe',
                color: '#0369a1',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: 600,
                border: '1px solid #bae6fd'
              }}>
                <i className="fa-solid fa-link" style={{ marginRight: '3px' }}></i> Vinculado a Culturas
              </span>
            </div>
            <p style={{ margin: '1px 0 0 0', fontSize: '11px', color: '#64748b' }}>
              Controle de Projetos Sankhya: Projeto, Identificação, Abreviação Projeto (Cultura), Descrição do Lote e Safra
            </p>
          </div>
        </div>

        {/* Action Buttons */}
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
            <i className="fa-solid fa-plus"></i> Novo Projeto
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
            title="Importar projetos do Sankhya / Excel (Projeto, Identificação, Abreviação Projeto, Descrição do Lote, Safra)"
            style={{
              backgroundColor: '#0284c7',
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
            title="Exportar planilha de projetos para Excel"
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
            onClick={() => window.print()}
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

      {/* Filter and Search Bar */}
      <div style={{
        padding: '6px 14px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '260px' }}>
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
              placeholder="Buscar por projeto, identificação, lote, safra..."
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
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Abreviação Projeto (Cultura):</label>
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
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Safra:</label>
            <select
              value={filterSafra}
              onChange={(e) => setFilterSafra(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                border: '1px solid #cbd5e1',
                borderRadius: '3px',
                backgroundColor: '#ffffff',
                color: '#1e293b'
              }}
            >
              <option value="TODAS">Todas as Safras</option>
              {uniqueSafras.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: '#64748b' }}>
          Exibindo <strong>{filteredItems.length}</strong> de <strong>{unidadeItems.length}</strong> projetos
        </div>
      </div>

      {/* Projects Table - Compact columns without excessive horizontal space */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '12px',
          textAlign: 'left',
          tableLayout: 'fixed'
        }}>
          <colgroup>
            <col style={{ width: '130px' }} />
            <col style={{ width: '330px' }} />
            <col style={{ width: '160px' }} />
            <col style={{ width: '180px' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: 'auto' }} />
          </colgroup>
          <thead>
            <tr style={{
              backgroundColor: '#0369a1',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
              borderBottom: '2px solid #075985',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <th style={{ padding: '6px 10px', borderRight: '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>
                Projeto
              </th>
              <th style={{ padding: '6px 10px', borderRight: '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>
                Identificação
              </th>
              <th style={{ padding: '6px 10px', borderRight: '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>
                Abreviação Projeto
              </th>
              <th style={{ padding: '6px 10px', borderRight: '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>
                Descrição do Lote
              </th>
              <th style={{ padding: '6px 10px', borderRight: '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>
                Safra
              </th>
              <th style={{ padding: '6px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                Ações
              </th>
              <th style={{ padding: '6px 0', border: 'none' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Nenhum projeto Sankhya encontrado
                  </div>
                  <div style={{ fontSize: '12px' }}>
                    Cadastre um novo projeto ou importe sua planilha do Sankhya.
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <tr
                    key={item.id || `${item.projeto}_${idx}`}
                    style={{
                      backgroundColor: isEven ? '#ffffff' : '#f8fafc',
                      borderBottom: '1px solid #e2e8f0',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0f2fe')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isEven ? '#ffffff' : '#f8fafc')}
                  >
                    {/* 1. Projeto */}
                    <td style={{ padding: '6px 10px', borderRight: '1px solid #e2e8f0', fontWeight: 700, color: '#0369a1', fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {cleanSankhyaValue(item.projeto)}
                    </td>

                    {/* 2. Identificação */}
                    <td style={{ padding: '6px 10px', borderRight: '1px solid #e2e8f0', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={cleanSankhyaValue(item.identificacao)}>
                      {cleanSankhyaValue(item.identificacao)}
                    </td>

                    {/* 3. Abreviação Projeto (Cultura) */}
                    <td style={{ padding: '6px 10px', borderRight: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '1px 7px',
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        border: '1px solid #bbf7d0',
                        borderRadius: '3px',
                        fontWeight: 700,
                        fontSize: '11px'
                      }}>
                        <i className="fa-solid fa-seedling" style={{ marginRight: '4px', fontSize: '10px' }}></i>
                        {cleanSankhyaValue(item.abreviacaoProjeto) || '-'}
                      </span>
                    </td>

                    {/* 4. Descrição do Lote */}
                    <td style={{ padding: '6px 10px', borderRight: '1px solid #e2e8f0', color: '#334155', fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {cleanSankhyaValue(item.descricaoLote) || '-'}
                    </td>

                    {/* 5. Safra */}
                    <td style={{ padding: '6px 10px', borderRight: '1px solid #e2e8f0', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
                      {cleanSankhyaValue(item.safra) || '-'}
                    </td>

                    {/* Ações */}
                    <td style={{ padding: '6px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          title="Editar Projeto"
                          style={{
                            backgroundColor: '#eff6fc',
                            color: '#0078d4',
                            border: '1px solid #c7e0f4',
                            borderRadius: '3px',
                            padding: '3px 7px',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          title="Excluir Projeto"
                          style={{
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: '3px',
                            padding: '3px 7px',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </td>

                    {/* Trailing spacer cell */}
                    <td style={{ padding: '0', border: 'none' }}></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL NOVO / EDITAR PROJETO SANKHYA */}
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
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
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
                <i className="fa-solid fa-diagram-project" style={{ color: '#0284c7' }}></i>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                  {editingItem ? 'Editar Projeto Sankhya' : 'Novo Projeto Sankhya'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '15px' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveModal} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Campo 1: Projeto */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Projeto *
                </label>
                <input
                  type="text"
                  required
                  value={formProjeto}
                  onChange={(e) => setFormProjeto(e.target.value)}
                  placeholder="Ex: 301.101.201"
                  style={{
                    width: '100%',
                    padding: '7px 9px',
                    fontSize: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    backgroundColor: '#ffffff',
                    fontFamily: 'monospace'
                  }}
                />
                <span style={{ fontSize: '10px', color: '#64748b' }}>Código / Número identificador do Projeto no Sankhya</span>
              </div>

              {/* Campo 2: Identificação */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Identificação *
                </label>
                <input
                  type="text"
                  required
                  value={formIdentificacao}
                  onChange={(e) => setFormIdentificacao(e.target.value)}
                  placeholder="Ex: SOJA - CRIOULO - PIVO 2 - C1 - 2025/26"
                  style={{
                    width: '100%',
                    padding: '7px 9px',
                    fontSize: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    backgroundColor: '#ffffff'
                  }}
                />
                <span style={{ fontSize: '10px', color: '#64748b' }}>Nome completo de identificação do projeto</span>
              </div>

              {/* Campo 3: Abreviação Projeto (Vinculada à Cultura) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                    Abreviação Projeto (Cultura Vinculada) *
                  </label>
                  <span style={{ fontSize: '10px', color: '#0369a1', fontWeight: 600 }}>
                    <i className="fa-solid fa-link"></i> Cadastro Culturas
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={formAbreviacaoProjeto}
                    onChange={(e) => setFormAbreviacaoProjeto(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '7px 9px',
                      fontSize: '12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      backgroundColor: '#ffffff',
                      color: '#1e293b'
                    }}
                  >
                    <option value="">Selecione uma Cultura do Cadastro...</option>
                    {uniqueCulturas.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Ou digite outra..."
                    value={formAbreviacaoProjeto}
                    onChange={(e) => setFormAbreviacaoProjeto(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '7px 9px',
                      fontSize: '12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Cultura vinculada ao Cadastro_Culturas (ex: SOJA, MILHO, FEIJÃO)</span>
              </div>

              {/* Campo 4: Descrição do Lote */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Descrição do Lote
                </label>
                <input
                  type="text"
                  value={formDescricaoLote}
                  onChange={(e) => setFormDescricaoLote(e.target.value)}
                  placeholder="Ex: SGB-2025/26-1201"
                  style={{
                    width: '100%',
                    padding: '7px 9px',
                    fontSize: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    backgroundColor: '#ffffff',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              {/* Campo 5: Safra */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                    Safra
                  </label>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Ano Safra</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={formSafra}
                    onChange={(e) => setFormSafra(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '7px 9px',
                      fontSize: '12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      backgroundColor: '#ffffff',
                      color: '#1e293b'
                    }}
                  >
                    <option value="">Selecione ou digite...</option>
                    {uniqueSafras.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Ex: 2025/26"
                    value={formSafra}
                    onChange={(e) => setFormSafra(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '7px 9px',
                      fontSize: '12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </div>
              </div>

              <div style={{
                marginTop: '10px',
                paddingTop: '12px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px'
              }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
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
                  type="submit"
                  style={{
                    backgroundColor: '#0078d4',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 18px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <i className="fa-solid fa-floppy-disk"></i> Salvar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE IMPORTAÇÃO COM VERIFICAÇÃO ANTI-DUPLICAÇÃO */}
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
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            width: '100%',
            maxWidth: '850px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            {/* Header */}
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-file-excel" style={{ color: '#0284c7' }}></i>
                  Importação de Projetos Sankhya
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                  Colunas suportadas: <strong>Projeto | Identificação | Abreviação Projeto | Descrição do Lote | Safra</strong>
                </p>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '16px' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Summary & Tabs */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setPreviewFilterTab('ALL')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: '1px solid',
                    cursor: 'pointer',
                    borderColor: previewFilterTab === 'ALL' ? '#0284c7' : '#cbd5e1',
                    backgroundColor: previewFilterTab === 'ALL' ? '#e0f2fe' : '#ffffff',
                    color: previewFilterTab === 'ALL' ? '#0369a1' : '#475569'
                  }}
                >
                  Todos ({importedPreview.length})
                </button>
                <button
                  onClick={() => setPreviewFilterTab('CHANGES')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: '1px solid',
                    cursor: 'pointer',
                    borderColor: previewFilterTab === 'CHANGES' ? '#16a34a' : '#cbd5e1',
                    backgroundColor: previewFilterTab === 'CHANGES' ? '#dcfce7' : '#ffffff',
                    color: previewFilterTab === 'CHANGES' ? '#15803d' : '#475569'
                  }}
                >
                  Novos / Alterações ({importedPreview.filter(i => i.importStatus === 'new' || i.importStatus === 'update').length})
                </button>
                <button
                  onClick={() => setPreviewFilterTab('IDENTICAL')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: '1px solid',
                    cursor: 'pointer',
                    borderColor: previewFilterTab === 'IDENTICAL' ? '#64748b' : '#cbd5e1',
                    backgroundColor: previewFilterTab === 'IDENTICAL' ? '#f1f5f9' : '#ffffff',
                    color: previewFilterTab === 'IDENTICAL' ? '#334155' : '#475569'
                  }}
                >
                  Já Idênticos ({importedPreview.filter(i => i.importStatus === 'identical').length})
                </button>
              </div>

              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Unidade destino: <strong>{selectedUnidade}</strong>
              </div>
            </div>

            {/* Preview Table */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', maxHeight: '420px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', color: '#334155', position: 'sticky', top: 0, zIndex: 5, borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '6px 8px' }}>Status</th>
                    <th style={{ padding: '6px 8px' }}>Projeto</th>
                    <th style={{ padding: '6px 8px' }}>Identificação</th>
                    <th style={{ padding: '6px 8px' }}>Abreviação Projeto</th>
                    <th style={{ padding: '6px 8px' }}>Descrição do Lote</th>
                    <th style={{ padding: '6px 8px' }}>Safra</th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePreviewItems.map((item, idx) => {
                    const isNew = item.importStatus === 'new';
                    const isUpdate = item.importStatus === 'update';
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: isNew ? '#f0fdf4' : isUpdate ? '#eff6fc' : '#ffffff' }}>
                        <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>
                          {isNew && (
                            <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '10px' }}>
                              + NOVO
                            </span>
                          )}
                          {isUpdate && (
                            <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '10px' }}>
                              ATUALIZAR
                            </span>
                          )}
                          {item.importStatus === 'identical' && (
                            <span style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, fontSize: '10px' }}>
                              IDÊNTICO
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '6px 8px', fontWeight: 700, color: '#0369a1', fontFamily: 'monospace' }}>
                          {item.projeto}
                        </td>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>
                          {item.identificacao}
                        </td>
                        <td style={{ padding: '6px 8px', color: '#15803d', fontWeight: 600 }}>
                          {item.abreviacaoProjeto || '-'}
                        </td>
                        <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>
                          {item.descricaoLote || '-'}
                        </td>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>
                          {item.safra || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <span style={{ fontSize: '12px', color: '#475569' }}>
                Total a gravar: <strong>{importedPreview.filter(i => i.importStatus === 'new' || i.importStatus === 'update').length}</strong> registros
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  disabled={isImporting}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
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
                  onClick={handleConfirmImport}
                  disabled={isImporting}
                  style={{
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 18px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: isImporting ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isImporting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Gravando...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check"></i> Confirmar Importação
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
