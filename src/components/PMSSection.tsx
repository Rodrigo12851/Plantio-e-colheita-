import React, { useState, useRef } from 'react';
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
  onSaveItem: (item: PMSItem, id?: string) => Promise<void>;
  onDeleteItem: (id?: string) => Promise<void>;
  onImportBatch: (newItems: PMSItem[]) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

export const PMSSection: React.FC<PMSSectionProps> = ({
  items,
  selectedUnidade,
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
  const [importedPreview, setImportedPreview] = useState<PMSItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter items by selected unidade and filters
  const unidadeItems = items.filter(item => !item.unidade || item.unidade === selectedUnidade || selectedUnidade === 'TODAS');

  const filteredItems = unidadeItems.filter(item => {
    const matchesSearch =
      !searchQuery ||
      item.cultura?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.variedade?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pms?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tipo?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCultura = filterCultura === 'TODAS' || item.cultura === filterCultura;
    const matchesTipo = filterTipo === 'TODOS' || item.tipo === filterTipo;

    return matchesSearch && matchesCultura && matchesTipo;
  });

  const uniqueCulturas = Array.from(new Set(unidadeItems.map(i => i.cultura).filter(Boolean))).sort();
  const uniqueTipos = Array.from(new Set(unidadeItems.map(i => i.tipo).filter(Boolean))).sort();

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
    setFormCultura(item.cultura || '');
    setFormVariedade(item.variedade || '');
    setFormTipo(item.tipo || 'Cereais');
    setFormCicloDias(String(item.cicloDias ?? ''));
    setFormUnidadeVenda(item.unidadeVenda || 'Sacas');
    setFormMediaUtilizacaoSemente(String(item.mediaUtilizacaoSemente ?? ''));
    setFormProdutividade(String(item.produtividade ?? ''));
    setFormUnidadeVenda2(item.unidadeVenda2 || 'sacas p/há');
    setFormPMS(item.pms || '');
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCultura.trim()) {
      showToast('Por favor, informe a Cultura.', 'warning');
      return;
    }
    if (!formVariedade.trim()) {
      showToast('Por favor, informe a Variedade.', 'warning');
      return;
    }

    const payload: PMSItem = {
      cultura: formCultura.trim(),
      variedade: formVariedade.trim(),
      tipo: formTipo.trim(),
      cicloDias: formCicloDias.trim(),
      unidadeVenda: formUnidadeVenda.trim(),
      mediaUtilizacaoSemente: formMediaUtilizacaoSemente.trim(),
      produtividade: formProdutividade.trim(),
      unidadeVenda2: formUnidadeVenda2.trim(),
      pms: formPMS.trim(),
      unidade: selectedUnidade
    };

    await onSaveItem(payload, editingItem?.id);
    setIsModalOpen(false);
    showToast(editingItem ? 'Item PMS atualizado com sucesso!' : 'Item PMS adicionado com sucesso!', 'success');
  };

  const handleDelete = async (item: PMSItem) => {
    if (window.confirm(`Deseja realmente excluir o registro da variedade "${item.variedade}" (${item.cultura})?`)) {
      await onDeleteItem(item.id);
      showToast('Item excluído com sucesso!', 'info');
    }
  };

  // Process Excel / CSV File
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

        const headerRow = (jsonData[0] as string[]).map(h => String(h || '').trim().toLowerCase());
        
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

        const parsedItems: PMSItem[] = [];

        for (let r = 1; r < jsonData.length; r++) {
          const row = jsonData[r] as any[];
          if (!row || row.length === 0) continue;

          // If no specific header match found, fallback to positional index:
          // 0: Cultura, 1: Variedade, 2: Tipo, 3: Ciclo, 4: Unidade Venda, 5: Media, 6: Produtividade, 7: Unidade Venda 2, 8: PMS
          const colCultura = idxCultura !== -1 ? row[idxCultura] : row[0];
          const colVariedade = idxVariedade !== -1 ? row[idxVariedade] : row[1];
          const colTipo = idxTipo !== -1 ? row[idxTipo] : row[2];
          const colCiclo = idxCiclo !== -1 ? row[idxCiclo] : row[3];
          const colUnidVenda = idxUnidVenda !== -1 ? row[idxUnidVenda] : row[4];
          const colMedia = idxMedia !== -1 ? row[idxMedia] : row[5];
          const colProd = idxProd !== -1 ? row[idxProd] : row[6];
          const colUnidVenda2 = idxUnidVenda2 !== -1 ? row[idxUnidVenda2] : (row[7] || 'sacas p/há');
          const colPMS = idxPMS !== -1 ? row[idxPMS] : row[8];

          if (colCultura || colVariedade) {
            parsedItems.push({
              cultura: String(colCultura || '').trim(),
              variedade: String(colVariedade || '').trim(),
              tipo: String(colTipo || 'Cereais').trim(),
              cicloDias: String(colCiclo ?? '').trim(),
              unidadeVenda: String(colUnidVenda ?? '').trim(),
              mediaUtilizacaoSemente: String(colMedia ?? '').trim(),
              produtividade: String(colProd ?? '').trim(),
              unidadeVenda2: String(colUnidVenda2 ?? 'sacas p/há').trim(),
              pms: String(colPMS ?? '').trim(),
              unidade: selectedUnidade
            });
          }
        }

        if (parsedItems.length === 0) {
          showToast('Nenhum registro válido foi encontrado na planilha.', 'warning');
          return;
        }

        setImportedPreview(parsedItems);
        setIsImportModalOpen(true);
        showToast(`${parsedItems.length} linhas lidas da planilha! Revise e clique em Importar.`, 'info');
      } catch (err) {
        console.error(err);
        showToast('Erro ao ler a planilha. Verifique se o arquivo é um .xlsx, .xls ou .csv válido.', 'warning');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = async () => {
    if (importedPreview.length === 0) return;
    await onImportBatch(importedPreview);
    setIsImportModalOpen(false);
    setImportedPreview([]);
    showToast(`Sucesso! ${importedPreview.length} registros foram importados para o PMS.`, 'success');
  };

  const handleExportExcel = () => {
    const dataToExport = filteredItems.map(item => ({
      'Cultura': item.cultura,
      'Variedade': item.variedade,
      'Tipo': item.tipo,
      'Ciclo em Dias': item.cicloDias,
      'Unidade de venda': item.unidadeVenda,
      'Média Utilização Semente': item.mediaUtilizacaoSemente,
      'Produtividade': item.produtividade,
      'Unidade de Venda': item.unidadeVenda2,
      'PMS': item.pms
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PMS');
    XLSX.writeFile(workbook, `PMS_${selectedUnidade}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('Planilha Excel exportada com sucesso!', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #edebe9', overflow: 'hidden' }}>
      {/* Top Header Bar */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #edebe9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: '#faf9f8'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            backgroundColor: '#107c41',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 700
          }}>
            <i className="fa-solid fa-file-excel"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#323130' }}>
                PMS
              </h2>
              <span style={{
                backgroundColor: '#e1dfdd',
                color: '#323130',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600
              }}>
                {filteredItems.length} registros
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#605e5c' }}>
              Tabela oficial de parâmetros, variedades, ciclo, produtividade e especificações de PMS
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleOpenAddModal}
            style={{
              backgroundColor: '#0078d4',
              color: '#ffffff',
              border: 'none',
              borderRadius: '2px',
              padding: '7px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            <i className="fa-solid fa-plus"></i> Adicionar novo item
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
            title="Importar planilha do Excel (.xlsx, .xls ou .csv)"
            style={{
              backgroundColor: '#107c41',
              color: '#ffffff',
              border: 'none',
              borderRadius: '2px',
              padding: '7px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            <i className="fa-solid fa-file-import"></i> Importar Excel
          </button>

          <button
            onClick={handleExportExcel}
            style={{
              backgroundColor: '#ffffff',
              color: '#323130',
              border: '1px solid #8a8886',
              borderRadius: '2px',
              padding: '7px 12px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className="fa-solid fa-file-export"></i> Exportar
          </button>

          <button
            onClick={handlePrint}
            style={{
              backgroundColor: '#ffffff',
              color: '#323130',
              border: '1px solid #8a8886',
              borderRadius: '2px',
              padding: '7px 12px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className="fa-solid fa-print"></i> Imprimir
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        padding: '12px 20px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #edebe9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#605e5c',
              fontSize: '13px'
            }}></i>
            <input
              type="text"
              placeholder="Pesquisar por cultura, variedade ou PMS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 32px',
                fontSize: '13px',
                border: '1px solid #8a8886',
                borderRadius: '2px',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#605e5c'
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          <select
            value={filterCultura}
            onChange={(e) => setFilterCultura(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '13px',
              border: '1px solid #8a8886',
              borderRadius: '2px',
              backgroundColor: '#ffffff'
            }}
          >
            <option value="TODAS">Todas as Culturas</option>
            {uniqueCulturas.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '13px',
              border: '1px solid #8a8886',
              borderRadius: '2px',
              backgroundColor: '#ffffff'
            }}
          >
            <option value="TODOS">Todos os Tipos</option>
            {uniqueTipos.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container Styled Like User's Excel */}
      <div style={{ overflowX: 'auto', maxHeight: '680px' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '13px',
          textAlign: 'left'
        }}>
          <thead>
            <tr style={{
              backgroundColor: '#5ea244',
              color: '#ffffff',
              fontWeight: 700,
              borderBottom: '2px solid #4d8836',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <th style={{ padding: '10px 14px', borderRight: '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>
                Cultura <i className="fa-solid fa-caret-down" style={{ fontSize: '11px', opacity: 0.8, marginLeft: '4px' }}></i>
              </th>
              <th style={{ padding: '10px 14px', borderRight: '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>
                Variedade <i className="fa-solid fa-caret-down" style={{ fontSize: '11px', opacity: 0.8, marginLeft: '4px' }}></i>
              </th>
              <th style={{ padding: '10px 14px', borderRight: '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>
                Tipo <i className="fa-solid fa-caret-down" style={{ fontSize: '11px', opacity: 0.8, marginLeft: '4px' }}></i>
              </th>
              <th style={{ padding: '10px 14px', borderRight: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                Ciclo em Dias <i className="fa-solid fa-caret-down" style={{ fontSize: '11px', opacity: 0.8, marginLeft: '4px' }}></i>
              </th>
              <th style={{ padding: '10px 14px', borderRight: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                Unidade de venda <i className="fa-solid fa-caret-down" style={{ fontSize: '11px', opacity: 0.8, marginLeft: '4px' }}></i>
              </th>
              <th style={{ padding: '10px 14px', borderRight: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                Média Utilização Semente <i className="fa-solid fa-caret-down" style={{ fontSize: '11px', opacity: 0.8, marginLeft: '4px' }}></i>
              </th>
              <th style={{ padding: '10px 14px', borderRight: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                Produtividade <i className="fa-solid fa-arrow-up-wide-short" style={{ fontSize: '11px', opacity: 0.8, marginLeft: '4px' }}></i>
              </th>
              <th style={{ padding: '10px 14px', borderRight: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                Unidade de Venda <i className="fa-solid fa-caret-down" style={{ fontSize: '11px', opacity: 0.8, marginLeft: '4px' }}></i>
              </th>
              <th style={{ padding: '10px 14px', borderRight: '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>
                PMS <i className="fa-solid fa-caret-down" style={{ fontSize: '11px', opacity: 0.8, marginLeft: '4px' }}></i>
              </th>
              <th style={{ padding: '10px 14px', textAlign: 'center', width: '90px', whiteSpace: 'nowrap' }}>
                AÇÕES
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: '40px 20px', textAlign: 'center', color: '#605e5c' }}>
                  <i className="fa-solid fa-file-excel" style={{ fontSize: '32px', color: '#a19f9d', marginBottom: '8px', display: 'block' }}></i>
                  Nenhum registro PMS encontrado com os filtros atuais.
                </td>
              </tr>
            ) : (
              filteredItems.map((row, idx) => {
                // Alternating zebra row matching the blueish/white Excel rows
                const isEven = idx % 2 === 0;
                const bgColor = isEven ? '#d9e1f2' : '#ffffff';

                return (
                  <tr
                    key={row.id || `${row.cultura}-${row.variedade}-${idx}`}
                    style={{
                      backgroundColor: bgColor,
                      borderBottom: '1px solid #c8d1e2',
                      color: '#000000',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#b4c6e7'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = bgColor; }}
                  >
                    <td style={{ padding: '8px 14px', fontWeight: 600, borderRight: '1px solid #d0d7de' }}>
                      {row.cultura}
                    </td>
                    <td style={{ padding: '8px 14px', fontWeight: 500, borderRight: '1px solid #d0d7de' }}>
                      {row.variedade}
                    </td>
                    <td style={{ padding: '8px 14px', borderRight: '1px solid #d0d7de' }}>
                      {row.tipo}
                    </td>
                    <td style={{ padding: '8px 14px', textAlign: 'center', borderRight: '1px solid #d0d7de' }}>
                      {row.cicloDias || '-'}
                    </td>
                    <td style={{ padding: '8px 14px', textAlign: 'center', borderRight: '1px solid #d0d7de' }}>
                      {row.unidadeVenda || '-'}
                    </td>
                    <td style={{ padding: '8px 14px', textAlign: 'center', borderRight: '1px solid #d0d7de' }}>
                      {row.mediaUtilizacaoSemente || '-'}
                    </td>
                    <td style={{ padding: '8px 14px', textAlign: 'center', fontWeight: 600, borderRight: '1px solid #d0d7de' }}>
                      {row.produtividade || '-'}
                    </td>
                    <td style={{ padding: '8px 14px', textAlign: 'center', borderRight: '1px solid #d0d7de' }}>
                      {row.unidadeVenda2 || '-'}
                    </td>
                    <td style={{ padding: '8px 14px', fontWeight: 500, color: row.pms ? '#0b5394' : '#666666', borderRight: '1px solid #d0d7de' }}>
                      {row.pms || '-'}
                    </td>
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleOpenEditModal(row)}
                          title="Editar registro"
                          style={{
                            background: 'none',
                            border: '1px solid #8a8886',
                            borderRadius: '2px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            color: '#323130',
                            backgroundColor: '#ffffff'
                          }}
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
                          title="Excluir registro"
                          style={{
                            background: 'none',
                            border: '1px solid #a80000',
                            borderRadius: '2px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            color: '#a80000',
                            backgroundColor: '#ffffff'
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

      {/* Modal Add / Edit */}
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
            borderRadius: '4px',
            width: '100%',
            maxWidth: '620px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            border: '1px solid #edebe9'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #edebe9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f3f2f1'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fa-solid fa-file-excel" style={{ color: '#107c41', fontSize: '18px' }}></i>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#323130' }}>
                  {editingItem ? 'Editar Item PMS' : 'Adicionar Novo Item PMS'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#605e5c' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveModal} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#323130', marginBottom: '4px' }}>
                    Cultura *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Soja, Milheto, Feijão Carioca"
                    value={formCultura}
                    onChange={(e) => setFormCultura(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '13px',
                      border: '1px solid #8a8886',
                      borderRadius: '2px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#323130', marginBottom: '4px' }}>
                    Variedade *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: BRS 1502, CZ37B51, Neo 750"
                    value={formVariedade}
                    onChange={(e) => setFormVariedade(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '13px',
                      border: '1px solid #8a8886',
                      borderRadius: '2px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#323130', marginBottom: '4px' }}>
                    Tipo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Cereais, Hortifruti"
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '13px',
                      border: '1px solid #8a8886',
                      borderRadius: '2px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#323130', marginBottom: '4px' }}>
                    Ciclo em Dias
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 120, 90, 80"
                    value={formCicloDias}
                    onChange={(e) => setFormCicloDias(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '13px',
                      border: '1px solid #8a8886',
                      borderRadius: '2px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#323130', marginBottom: '4px' }}>
                    Unidade de Venda
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Sacas, Kg"
                    value={formUnidadeVenda}
                    onChange={(e) => setFormUnidadeVenda(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '13px',
                      border: '1px solid #8a8886',
                      borderRadius: '2px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#323130', marginBottom: '4px' }}>
                    Média Utilização Semente
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 50"
                    value={formMediaUtilizacaoSemente}
                    onChange={(e) => setFormMediaUtilizacaoSemente(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '13px',
                      border: '1px solid #8a8886',
                      borderRadius: '2px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#323130', marginBottom: '4px' }}>
                    Produtividade
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 70, 50, 60"
                    value={formProdutividade}
                    onChange={(e) => setFormProdutividade(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '13px',
                      border: '1px solid #8a8886',
                      borderRadius: '2px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#323130', marginBottom: '4px' }}>
                    Unidade de Venda (Prod.)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: sacas p/há"
                    value={formUnidadeVenda2}
                    onChange={(e) => setFormUnidadeVenda2(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '13px',
                      border: '1px solid #8a8886',
                      borderRadius: '2px'
                    }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#323130', marginBottom: '4px' }}>
                    PMS (Peso de Mil Sementes / Especificação)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: CZ37B51: 171 Gramas, PMS Dama: 250 Grmas"
                    value={formPMS}
                    onChange={(e) => setFormPMS(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '13px',
                      border: '1px solid #8a8886',
                      borderRadius: '2px'
                    }}
                  />
                </div>
              </div>

              <div style={{
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid #edebe9',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px'
              }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#323130',
                    border: '1px solid #8a8886',
                    borderRadius: '2px',
                    padding: '8px 16px',
                    fontSize: '13px',
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
                    borderRadius: '2px',
                    padding: '8px 20px',
                    fontSize: '13px',
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

      {/* Modal Preview of Excel Import */}
      {isImportModalOpen && (
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
            borderRadius: '4px',
            width: '100%',
            maxWidth: '860px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            border: '1px solid #edebe9'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #edebe9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f3f2f1'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fa-solid fa-file-excel" style={{ color: '#107c41', fontSize: '20px' }}></i>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#323130' }}>
                    Pré-visualização da Importação Excel
                  </h3>
                  <span style={{ fontSize: '12px', color: '#605e5c' }}>
                    {importedPreview.length} registros prontos para serem salvos
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#605e5c' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#5ea244', color: '#ffffff', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>Cultura</th>
                    <th style={{ padding: '8px' }}>Variedade</th>
                    <th style={{ padding: '8px' }}>Tipo</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Ciclo (Dias)</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Produtividade</th>
                    <th style={{ padding: '8px' }}>PMS</th>
                  </tr>
                </thead>
                <tbody>
                  {importedPreview.slice(0, 50).map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #edebe9', backgroundColor: i % 2 === 0 ? '#f8f9fa' : '#ffffff' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600 }}>{row.cultura}</td>
                      <td style={{ padding: '6px 8px' }}>{row.variedade}</td>
                      <td style={{ padding: '6px 8px' }}>{row.tipo}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{row.cicloDias || '-'}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{row.produtividade || '-'}</td>
                      <td style={{ padding: '6px 8px', color: '#0b5394' }}>{row.pms || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importedPreview.length > 50 && (
                <div style={{ textAlign: 'center', padding: '10px', color: '#605e5c', fontSize: '12px' }}>
                  ... e mais {importedPreview.length - 50} linhas
                </div>
              )}
            </div>

            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #edebe9',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              backgroundColor: '#faf9f8'
            }}>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#323130',
                  border: '1px solid #8a8886',
                  borderRadius: '2px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                style={{
                  backgroundColor: '#107c41',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '2px',
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <i className="fa-solid fa-check"></i> Confirmar e Importar {importedPreview.length} Registros
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
