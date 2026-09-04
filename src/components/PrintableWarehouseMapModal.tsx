import React, { useState, useMemo } from 'react';
import {
  Printer,
  X,
  FileText,
  Layers,
  Scale,
  Calendar,
  CheckCircle2,
  Info,
  Truck,
  MapPin,
  TrendingUp,
  Download,
  Filter,
  Eye,
  Building2,
  ChevronDown
} from 'lucide-react';
import { TruckHarvestLoad, StorageCellAllocation } from '../types';

interface PrintableWarehouseMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  truckLoads: TruckHarvestLoad[];
  cellAllocations: Record<string, StorageCellAllocation>;
  galleryCount: number;
  lengthBays: number;
  tierCount: number;
}

export const PrintableWarehouseMapModal: React.FC<PrintableWarehouseMapModalProps> = ({
  isOpen,
  onClose,
  truckLoads,
  cellAllocations,
  galleryCount,
  lengthBays,
  tierCount,
}) => {
  const [viewMode, setViewMode] = useState<'consolidated' | 'by-tier'>('consolidated');
  const [selectedTier, setSelectedTier] = useState<number>(0);
  const [filterVariety, setFilterVariety] = useState<string>('all');
  const [printFormat, setPrintFormat] = useState<'single-page' | 'multi-page'>('single-page');
  const [a4LayoutMode, setA4LayoutMode] = useState<'map-maximized' | 'with-romaneios'>('map-maximized'); // 'map-maximized' dedica 85%+ da folha ao mapa do estaleiro
  const [printScale, setPrintScale] = useState<number>(100); // 100% preenche totalmente a folha A4 em paisagem
  const [mapDensity, setMapDensity] = useState<'normal' | 'large' | 'extra-large'>('extra-large'); // 'extra-large' por padrão para o mapa do estaleiro ficar grande e espaçoso
  const [showPrintTips, setShowPrintTips] = useState<boolean>(false);
  const [currentDate] = useState(() => {
    const d = new Date();
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  });
  const [currentTime] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  });

  // Lista de todas as alocações como array tipado
  const allocationsList = useMemo(() => {
    return Object.values(cellAllocations) as StorageCellAllocation[];
  }, [cellAllocations]);

  // Mapa rápido de cargas por ID
  const loadsById = useMemo(() => {
    const map: Record<string, TruckHarvestLoad> = {};
    truckLoads.forEach((l) => {
      map[l.id] = l;
    });
    return map;
  }, [truckLoads]);

  // Totais Gerais do Mapa
  const totalKg = useMemo(() => {
    return allocationsList.reduce((sum, item) => sum + item.allocatedKg, 0);
  }, [allocationsList]);

  const totalBags = useMemo(() => {
    return Math.round(allocationsList.reduce((sum, item) => sum + item.allocatedBags, 0));
  }, [allocationsList]);

  const totalAvailableCells = galleryCount * lengthBays * tierCount;
  const totalOccupiedCells = allocationsList.length;
  const occupancyPercent = totalAvailableCells > 0 ? (totalOccupiedCells / totalAvailableCells) * 100 : 0;

  // Resumo por Variedade de Alho
  const varietySummary = useMemo(() => {
    const stats: Record<
      string,
      {
        variety: string;
        color: string;
        totalKg: number;
        totalBags: number;
        cellCount: number;
        farms: Set<string>;
        tracts: Set<string>;
        pivots: Set<string>;
        trucks: Set<string>;
        romaneios: Set<string>;
      }
    > = {};

    allocationsList.forEach((alloc) => {
      const load = loadsById[alloc.loadId];
      if (!load) return;

      if (!stats[load.variety]) {
        stats[load.variety] = {
          variety: load.variety,
          color: load.varietyColor || '#7c3aed',
          totalKg: 0,
          totalBags: 0,
          cellCount: 0,
          farms: new Set(),
          tracts: new Set(),
          pivots: new Set(),
          trucks: new Set(),
          romaneios: new Set(),
        };
      }

      stats[load.variety].totalKg += alloc.allocatedKg;
      stats[load.variety].totalBags += alloc.allocatedBags;
      stats[load.variety].cellCount += 1;
      if (load.farm) stats[load.variety].farms.add(load.farm);
      if (load.tract) stats[load.variety].tracts.add(load.tract);
      if (load.pivot) stats[load.variety].pivots.add(load.pivot);
      if (load.truckPlate) stats[load.variety].trucks.add(load.truckPlate);
      if (load.romaneioNumber) stats[load.variety].romaneios.add(load.romaneioNumber);
    });

    return Object.values(stats).sort((a, b) => b.totalKg - a.totalKg);
  }, [allocationsList, loadsById]);

  // Resumo por Lado / Meio do Estaleiro
  const sectorSummary = useMemo(() => {
    let leftKg = 0;
    let leftBags = 0;
    let rightKg = 0;
    let rightBags = 0;
    let frontKg = 0;
    let frontBags = 0;
    let backKg = 0;
    let backBags = 0;

    const midGallery = Math.floor(galleryCount / 2);
    const midBay = Math.floor(lengthBays / 2);

    allocationsList.forEach((alloc) => {
      if (alloc.galleryIdx < midGallery) {
        leftKg += alloc.allocatedKg;
        leftBags += alloc.allocatedBags;
      } else {
        rightKg += alloc.allocatedKg;
        rightBags += alloc.allocatedBags;
      }

      if (alloc.bayIdx < midBay) {
        frontKg += alloc.allocatedKg;
        frontBags += alloc.allocatedBags;
      } else {
        backKg += alloc.allocatedKg;
        backBags += alloc.allocatedBags;
      }
    });

    return {
      leftKg,
      leftBags: Math.round(leftBags),
      rightKg,
      rightBags: Math.round(rightBags),
      frontKg,
      frontBags: Math.round(frontBags),
      backKg,
      backBags: Math.round(backBags),
    };
  }, [allocationsList, galleryCount, lengthBays]);

  // Matriz Consolidada por Vão (Vagão) e Galeria
  // Para cada par (galeria, vão), agrega todos os níveis
  const consolidatedGrid = useMemo(() => {
    const grid: Record<
      string,
      {
        galleryIdx: number;
        bayIdx: number;
        totalKg: number;
        totalBags: number;
        varieties: Array<{ name: string; color: string; kg: number; bags: number }>;
        tiers: number[];
        farms: string[];
        tracts: string[];
        pivots: string[];
        romaneios: string[];
      }
    > = {};

    for (let c = 0; c < galleryCount; c++) {
      for (let b = 0; b < lengthBays; b++) {
        const key = `g${c}_b${b}`;
        grid[key] = {
          galleryIdx: c,
          bayIdx: b,
          totalKg: 0,
          totalBags: 0,
          varieties: [],
          tiers: [],
          farms: [],
          tracts: [],
          pivots: [],
          romaneios: [],
        };
      }
    }

    allocationsList.forEach((alloc) => {
      const key = `g${alloc.galleryIdx}_b${alloc.bayIdx}`;
      const cell = grid[key];
      if (!cell) return;

      const load = loadsById[alloc.loadId];
      cell.totalKg += alloc.allocatedKg;
      cell.totalBags += alloc.allocatedBags;
      if (!cell.tiers.includes(alloc.tierIdx + 1)) {
        cell.tiers.push(alloc.tierIdx + 1);
      }

      if (load) {
        const existingVar = cell.varieties.find((v) => v.name === load.variety);
        if (existingVar) {
          existingVar.kg += alloc.allocatedKg;
          existingVar.bags += alloc.allocatedBags;
        } else {
          cell.varieties.push({
            name: load.variety,
            color: load.varietyColor || '#7c3aed',
            kg: alloc.allocatedKg,
            bags: alloc.allocatedBags,
          });
        }

        if (load.farm && !cell.farms.includes(load.farm)) cell.farms.push(load.farm);
        if (load.tract && !cell.tracts.includes(load.tract)) cell.tracts.push(load.tract);
        if (load.pivot && !cell.pivots.includes(load.pivot)) cell.pivots.push(load.pivot);
        if (load.romaneioNumber && !cell.romaneios.includes(load.romaneioNumber)) {
          cell.romaneios.push(load.romaneioNumber);
        }
      }
    });

    // Ordena os níveis e arredonda bags para evitar dízimas de ponto flutuante
    Object.values(grid).forEach((c) => {
      c.tiers.sort((a, b) => a - b);
      c.totalBags = Math.round(c.totalBags);
      c.varieties.forEach((v) => {
        v.bags = Math.round(v.bags);
      });
    });

    return grid;
  }, [allocationsList, galleryCount, lengthBays, loadsById]);

  // Lista de Variedades Únicas para filtro
  const availableVarieties = useMemo(() => {
    return Array.from(new Set(truckLoads.map((l) => l.variety)));
  }, [truckLoads]);

  if (!isOpen) return null;

  // Função para acionar impressão oficial
  const handlePrint = () => {
    window.print();
  };

  // Exportar resumo para arquivo CSV
  const handleExportCSV = () => {
    const headers = [
      'Vagao_Vao',
      'Galeria',
      'Veio_Transversal',
      'Meio_Longitudinal',
      'Niveis_Ocupados',
      'Total_Kg',
      'Total_Bags',
      'Variedades',
      'Romaneios',
      'Fazendas',
      'Glebas',
      'Pivos',
    ];

    const rows: string[] = [];
    rows.push(headers.join(';'));

    for (let b = 0; b < lengthBays; b++) {
      for (let c = 0; c < galleryCount; c++) {
        const key = `g${c}_b${b}`;
        const cell = consolidatedGrid[key];
        if (!cell || cell.totalKg === 0) continue;

        const isLeft = c < Math.floor(galleryCount / 2);
        const isFront = b < Math.floor(lengthBays / 2);

        const row = [
          `Vagao ${b + 1}`,
          `Galeria ${c + 1}`,
          isLeft ? 'Veio Esquerdo' : 'Veio Direito',
          isFront ? 'Meio Frente' : 'Meio Fundos',
          `Niveis ${cell.tiers.join(',')}`,
          cell.totalKg,
          cell.totalBags,
          cell.varieties.map((v) => `${v.name} (${v.kg}kg)`).join(' | '),
          cell.romaneios.join(','),
          cell.farms.join(','),
          cell.tracts.join(','),
          cell.pivots.join(','),
        ];
        rows.push(row.map((val) => `"${val}"`).join(';'));
      }
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(rows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `Mapa_Estaleiro_03_${currentDate.replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      {/* Estilos específicos de impressão para gerar layout limpo A4 em Paisagem */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: ${printFormat === 'single-page' ? (a4LayoutMode === 'map-maximized' ? '1.5mm 2mm 1.5mm 2mm' : '2mm 3mm 2mm 3mm') : '8mm 6mm 8mm 6mm'};
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-warehouse-map-root,
          #printable-warehouse-map-root * {
            visibility: visible !important;
          }
          #printable-warehouse-map-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: ${printFormat === 'single-page' ? (a4LayoutMode === 'map-maximized' ? '0.5mm 1.5mm' : '1mm 2mm') : '4mm 6mm'} !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            ${
              printFormat === 'single-page'
                ? `
              transform: scale(${printScale / 100}) !important;
              transform-origin: top center !important;
            `
                : ''
            }
          }
          .no-print {
            display: none !important;
          }
          .print-break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .print-border-solid {
            border: 1px solid #94a3b8 !important;
          }
          .print-bg-gray {
            background-color: #f8fafc !important;
          }
        }
      `}</style>

      <div className="bg-[#12161f] border border-[#D4A373]/50 rounded-xl shadow-2xl w-full max-w-7xl max-h-[96vh] flex flex-col overflow-hidden text-neutral-100">
        {/* Barra Superior / Ações de Impressão (Ocultada na impressão) */}
        <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-2.5 border-b border-neutral-800 bg-[#161c27] gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-neutral-100">
                  Mapa do Estaleiro para Impressão
                </h2>
                <span className={`text-[11px] px-2 py-0.5 rounded font-mono font-bold border ${
                  printFormat === 'single-page'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {printFormat === 'single-page' ? '✓ 1 Página A4 Otimizada' : 'Modo Multi-Páginas'}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Visualização e ficha de campo com quilos, variedades por vagão e resumo geral
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* SELETOR DE FORMATO: FOLHA ÚNICA A4 VS MULTI-PÁGINAS */}
            <div className="flex items-center bg-[#0e1219] p-1 rounded-lg border border-neutral-700 text-xs">
              <button
                type="button"
                onClick={() => setPrintFormat('single-page')}
                className={`px-3 py-1 rounded font-medium transition-all flex items-center gap-1.5 ${
                  printFormat === 'single-page'
                    ? 'bg-emerald-600 text-white font-bold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Ajustar perfeitamente em 1 única folha A4 Paisagem"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>1 Folha A4</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('multi-page')}
                className={`px-3 py-1 rounded font-medium transition-all ${
                  printFormat === 'multi-page'
                    ? 'bg-neutral-700 text-white font-bold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Exibir em formato estendido com tabelas grandes (múltiplas páginas)"
              >
                <span>Multi-Páginas</span>
              </button>
            </div>

            {/* SELETOR DE MODO NA FOLHA ÚNICA: MAPA MAXIMIZADO VS COM ROMANEIOS */}
            {printFormat === 'single-page' && (
              <div className="flex items-center bg-[#0e1219] p-1 rounded-lg border border-neutral-700 text-xs">
                <button
                  type="button"
                  onClick={() => setA4LayoutMode('map-maximized')}
                  className={`px-2.5 py-1 rounded font-medium transition-all flex items-center gap-1 ${
                    a4LayoutMode === 'map-maximized'
                      ? 'bg-amber-600 text-white font-bold shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="O mapa do estaleiro preenche praticamente toda a folha A4 com células altas e letras grandes"
                >
                  <span>🗺️ Mapa Maximizado</span>
                </button>
                <button
                  type="button"
                  onClick={() => setA4LayoutMode('with-romaneios')}
                  className={`px-2.5 py-1 rounded font-medium transition-all flex items-center gap-1 ${
                    a4LayoutMode === 'with-romaneios'
                      ? 'bg-neutral-700 text-white font-bold shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Incluir também a tabela detalhada de romaneios de caminhão no rodapé"
                >
                  <span>📋 + Romaneios</span>
                </button>
              </div>
            )}

            {/* SELETOR DE TAMANHO DO ESTALEIRO & ESCALA A4 (se formato Folha Única) */}
            {printFormat === 'single-page' && (
              <>
                <div className="flex items-center gap-1.5 bg-[#0e1219] px-2.5 py-1 rounded-lg border border-neutral-700 text-xs">
                  <span className="text-neutral-400 text-[11px]">Tamanho Células:</span>
                  <select
                    value={mapDensity}
                    onChange={(e) => setMapDensity(e.target.value as 'normal' | 'large' | 'extra-large')}
                    className="bg-transparent text-amber-400 font-bold focus:outline-none cursor-pointer"
                    title="Aumente para o mapa do estaleiro preencher ao máximo o espaço livre na folha A4"
                  >
                    <option value="extra-large" className="bg-neutral-900 text-neutral-100">Extra Grande (Preenchimento Total)</option>
                    <option value="large" className="bg-neutral-900 text-neutral-100">Grande</option>
                    <option value="normal" className="bg-neutral-900 text-neutral-100">Normal</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-[#0e1219] px-2.5 py-1 rounded-lg border border-neutral-700 text-xs">
                  <span className="text-neutral-400 text-[11px]">Escala A4:</span>
                  <select
                    value={printScale}
                    onChange={(e) => setPrintScale(Number(e.target.value))}
                    className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer"
                    title="Ajuste a escala para preencher 100% da folha física"
                  >
                    <option value={100} className="bg-neutral-900 text-neutral-100">100% (Padrão)</option>
                    <option value={104} className="bg-neutral-900 text-neutral-100">104% (Máxima)</option>
                    <option value={96} className="bg-neutral-900 text-neutral-100">96% (Margem Segura)</option>
                    <option value={92} className="bg-neutral-900 text-neutral-100">92%</option>
                  </select>
                </div>
              </>
            )}

            {/* Dicas de Impressão A4 */}
            <button
              type="button"
              onClick={() => setShowPrintTips(!showPrintTips)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs transition-all ${
                showPrintTips
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
              }`}
              title="Ver recomendações para impressão perfeita em 1 página A4"
            >
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Dicas A4</span>
            </button>

            {/* Seletor de Modo de Exibição */}
            <div className="flex items-center bg-[#0e1219] p-1 rounded-lg border border-neutral-700 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('consolidated')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  viewMode === 'consolidated'
                    ? 'bg-amber-500 text-neutral-950 font-bold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Soma todos os níveis por vão e galeria"
              >
                Consolidado
              </button>
              <button
                type="button"
                onClick={() => setViewMode('by-tier')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  viewMode === 'by-tier'
                    ? 'bg-amber-500 text-neutral-950 font-bold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Exibir um nível vertical específico"
              >
                Por Nível
              </button>
            </div>

            {/* Seletor de Nível (se ativo) */}
            {viewMode === 'by-tier' && (
              <div className="flex items-center gap-1 bg-[#0e1219] px-2 py-1 rounded-lg border border-neutral-700 text-xs">
                <span className="text-neutral-400">Nível:</span>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(Number(e.target.value))}
                  className="bg-transparent text-amber-400 font-bold focus:outline-none cursor-pointer"
                >
                  {Array.from({ length: tierCount }).map((_, i) => (
                    <option key={i} value={i} className="bg-neutral-900 text-neutral-100">
                      Nível {i + 1} ({((i + 1) * 1.8 + 1.2).toFixed(1)}m)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Botão Exportar CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold transition-all"
              title="Exportar dados do mapa em planilha CSV"
            >
              <Download className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            {/* Botão Principal: IMPRIMIR */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              title="Imprimir mapa em 1 folha A4 ou salvar como PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>

            {/* Fechar */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors ml-1"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BANNER DE DICAS PARA 1 FOLHA A4 */}
        {showPrintTips && (
          <div className="bg-amber-950/40 border-b border-amber-500/30 px-6 py-2 flex items-center justify-between text-xs text-amber-200 no-print animate-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Como garantir 1 única folha A4:</strong> Na caixa de diálogo de impressão do navegador, defina a <strong>Orientação como Paisagem (Landscape)</strong>, <strong>Margens como 'Mínimas' ou 'Padrão'</strong>, e marque a opção <strong>'Gráficos de segundo plano'</strong> para imprimir as cores das variedades e a linha divisória vermelha do meio.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPrintTips(false)}
              className="text-amber-400 hover:text-white ml-3 font-bold text-xs"
            >
              Fechar
            </button>
          </div>
        )}

        {/* ÁREA IMPRIMÍVEL DO DOCUMENTO (Folha de Papel Técnica com visual limpo para campo) */}
        <div className="overflow-y-auto flex-1 p-2 sm:p-4 bg-neutral-900/60 flex justify-center">
          <div
            id="printable-warehouse-map-root"
            className={`w-full max-w-[1420px] bg-white text-neutral-900 rounded-lg shadow-2xl border border-neutral-300 font-sans ${
              printFormat === 'single-page' ? 'p-2 sm:p-3 print:p-0' : 'p-4 sm:p-6'
            }`}
          >
            {printFormat === 'single-page' ? (
              /* ========================================================================= */
              /* LAYOUT 100% OTIMIZADO PARA 1 ÚNICA FOLHA A4 PAISAGEM (PÁGINA ÚNICA)     */
              /* ========================================================================= */
              (() => {
                const isMaximized = a4LayoutMode === 'map-maximized';
                const isExtraLarge = mapDensity === 'extra-large';
                const isLarge = mapDensity === 'large';
                const mapRowPy = isMaximized
                  ? isExtraLarge
                    ? 'py-2.5 sm:py-3.5 px-2'
                    : isLarge
                    ? 'py-2 sm:py-2.5 px-2'
                    : 'py-1.5 px-1.5'
                  : isExtraLarge
                  ? 'py-2 sm:py-2.5 px-2'
                  : isLarge
                  ? 'py-1.5 sm:py-2 px-1.5'
                  : 'py-1 px-1';
                const mapKgText = isMaximized
                  ? isExtraLarge
                    ? 'text-[12px] sm:text-[13.5px]'
                    : isLarge
                    ? 'text-[11px] sm:text-xs'
                    : 'text-[10px]'
                  : isExtraLarge
                  ? 'text-[11px] sm:text-xs'
                  : isLarge
                  ? 'text-[10px] sm:text-[11px]'
                  : 'text-[9px]';
                const mapBagText = isMaximized
                  ? isExtraLarge
                    ? 'text-[10px] sm:text-[11px]'
                    : isLarge
                    ? 'text-[9.5px]'
                    : 'text-[8.5px]'
                  : 'text-[8px] sm:text-[9px]';
                const mapTagText = isMaximized
                  ? isExtraLarge
                    ? 'text-[9.5px] sm:text-[10.5px]'
                    : isLarge
                    ? 'text-[9px]'
                    : 'text-[8px]'
                  : 'text-[8px]';
                const mapBayText = isMaximized
                  ? isExtraLarge
                    ? 'text-xs sm:text-[13px]'
                    : isLarge
                    ? 'text-[11px]'
                    : 'text-[10px]'
                  : 'text-[9.5px] sm:text-[10.5px]';

                return (
              <div className="flex flex-col gap-1.5 sm:gap-2 w-full">
                {/* CABEÇALHO TÉCNICO OFICIAL COMPACTO */}
                <div className="border-b-2 border-neutral-900 pb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-emerald-900 text-emerald-100 flex items-center justify-center font-black text-sm tracking-wider shadow-sm">
                      GI
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800">
                          GRUPO IGARASHI • UNIDADE DE CURA NATURAL DE ALHO
                        </span>
                        <span className="text-[8px] px-1 py-0.2 rounded bg-neutral-100 text-neutral-800 font-bold border border-neutral-300">
                          ESTALEIRO 03
                        </span>
                      </div>
                      <h1 className="text-sm sm:text-base font-black text-neutral-950 uppercase tracking-tight leading-none mt-0.5">
                        MAPA DE OCUPAÇÃO & ROMANEIOS • {viewMode === 'consolidated' ? 'CONSOLIDADO GERAL (TODOS OS NÍVEIS)' : `NÍVEL ${selectedTier + 1} (${((selectedTier + 1) * 1.8 + 1.2).toFixed(1)}M)`}
                      </h1>
                      <div className="text-[8.5px] font-medium text-neutral-600 flex items-center gap-1.5 mt-0.5">
                        <span>Dimensões: 36,0m × 72,0m • Altura: 15,0m</span>
                        <span>•</span>
                        <span>{galleryCount} Galerias × {lengthBays} Vãos (Vagões 4,5m) × {tierCount} Níveis</span>
                        <span>•</span>
                        <span className="font-semibold text-neutral-800">Capacidade Nominal: 527.904 kg (18,80 ha)</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[8.5px] text-neutral-600 bg-neutral-50 px-2.5 py-1 rounded border border-neutral-200 shrink-0">
                    <div>
                      <span className="font-semibold text-neutral-900">Emissão: </span>
                      {currentDate} às {currentTime}
                    </div>
                    <div>
                      <span className="font-semibold text-neutral-900">Status: </span>
                      <span className="text-emerald-700 font-bold">Safra em Plena Cura</span>
                    </div>
                    <div className="font-black text-emerald-800 tracking-tight">
                      {isMaximized ? 'MAPA MAXIMIZADO • FOLHA ÚNICA' : 'FOLHA ÚNICA OFICIAL • PÁGINA 1/1'}
                    </div>
                  </div>
                </div>

                {/* RESUMO TÉCNICO: MODO MAXIMIZADO (HORIZONTAL ULTRA-COMPACTO) VS MODO COM BLOCOS EXPANDIDOS */}
                {isMaximized ? (
                  <div className="flex flex-col gap-1 print-break-inside-avoid">
                    {/* Barra de Totais e Balanço de Veios */}
                    <div className="grid grid-cols-12 gap-1.5 text-[9px] bg-neutral-50 p-1.5 rounded border border-neutral-200 items-center">
                      <div className="col-span-3 flex items-center gap-1.5 border-r border-neutral-200 pr-2">
                        <div className="text-[7.5px] font-bold uppercase text-neutral-500 leading-none">Carga Total:</div>
                        <div className="text-xs font-black text-neutral-950 font-mono">
                          {totalKg.toLocaleString('pt-BR')} kg
                        </div>
                        <div className="text-[8px] font-bold text-amber-800 font-mono">
                          ({(totalKg / 1000).toFixed(1)}t • {totalBags} bags)
                        </div>
                      </div>

                      <div className="col-span-2 flex items-center gap-1.5 border-r border-neutral-200 pr-2">
                        <div className="text-[7.5px] font-bold uppercase text-neutral-500 leading-none">Ocupação:</div>
                        <div className="text-xs font-black text-neutral-950 font-mono">
                          {occupancyPercent.toFixed(1)}%
                        </div>
                        <div className="text-[7.5px] text-neutral-500">
                          ({totalOccupiedCells}/{totalAvailableCells})
                        </div>
                      </div>

                      <div className="col-span-4 flex items-center justify-between border-r border-neutral-200 pr-2 font-mono text-[8.5px]">
                        <div>
                          <span className="font-bold text-neutral-600">Veio Esq. (G1-3): </span>
                          <strong className="text-neutral-950 font-black">{sectorSummary.leftKg.toLocaleString('pt-BR')} kg</strong> ({sectorSummary.leftBags}b)
                        </div>
                        <span className="text-neutral-300">|</span>
                        <div>
                          <span className="font-bold text-neutral-600">Veio Dir. (G4-6): </span>
                          <strong className="text-neutral-950 font-black">{sectorSummary.rightKg.toLocaleString('pt-BR')} kg</strong> ({sectorSummary.rightBags}b)
                        </div>
                      </div>

                      <div className="col-span-3 flex items-center justify-end gap-2 font-mono text-[8.5px]">
                        <div>
                          <span className="text-neutral-500">Frente: </span>
                          <strong>{sectorSummary.frontKg.toLocaleString('pt-BR')} kg</strong>
                        </div>
                        <span className="text-neutral-300">•</span>
                        <div>
                          <span className="text-neutral-500">Fundos: </span>
                          <strong>{sectorSummary.backKg.toLocaleString('pt-BR')} kg</strong>
                        </div>
                      </div>
                    </div>

                    {/* Linha de Variedades com Bolinhas Coloridas */}
                    <div className="flex flex-wrap items-center justify-between gap-1 px-2 py-1 bg-neutral-50 rounded border border-neutral-200 text-[8.5px]">
                      <div className="font-bold text-neutral-700 uppercase text-[8px]">
                        Variedades:
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        {varietySummary.map((v) => {
                          const percent = totalKg > 0 ? (v.totalKg / totalKg) * 100 : 0;
                          return (
                            <div key={v.variety} className="flex items-center gap-1.5 font-mono">
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-black/30 shrink-0"
                                style={{ backgroundColor: v.color }}
                              />
                              <span className="font-bold text-neutral-900 font-sans">{v.variety}:</span>
                              <span className="font-black text-neutral-950">{v.totalKg.toLocaleString('pt-BR')} kg</span>
                              <span className="text-neutral-500 text-[7.5px]">({Math.round(v.totalBags)}b • {percent.toFixed(0)}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* FAIXA SUPERIOR TRADICIONAL (3 BLOCOS HORIZONTAIS) */
                  <div className="grid grid-cols-12 gap-2 text-[9px] print-break-inside-avoid">
                    {/* Bloco 1: KPIs Rápidos (4 colunas) */}
                    <div className="col-span-4 grid grid-cols-2 gap-1.5 p-1.5 bg-neutral-50 border border-neutral-200 rounded">
                      <div className="border-r border-neutral-200 pr-1.5">
                        <div className="text-[7.5px] uppercase font-bold text-neutral-500">Carga Armazenada</div>
                        <div className="text-xs font-black text-neutral-950 font-mono leading-tight">
                          {totalKg.toLocaleString('pt-BR')} <span className="text-[8.5px] font-normal">kg</span>
                        </div>
                        <div className="text-[8.5px] font-bold text-amber-800 font-mono">
                          {(totalKg / 1000).toFixed(1)} toneladas
                        </div>
                      </div>

                      <div className="pl-1">
                        <div className="text-[7.5px] uppercase font-bold text-neutral-500">Total de Bags</div>
                        <div className="text-xs font-black text-neutral-950 font-mono leading-tight">
                          {totalBags.toLocaleString('pt-BR')} <span className="text-[8.5px] font-normal">bags</span>
                        </div>
                        <div className="text-[8.5px] text-neutral-600">
                          Méd: {totalBags > 0 ? Math.round(totalKg / totalBags) : 0} kg/bag
                        </div>
                      </div>

                      <div className="border-r border-neutral-200 pr-1.5 pt-1 border-t border-neutral-200">
                        <div className="text-[7.5px] uppercase font-bold text-neutral-500">Ocupação Real</div>
                        <div className="text-xs font-black text-neutral-950 font-mono leading-tight">
                          {occupancyPercent.toFixed(1)}%
                        </div>
                        <div className="text-[8px] text-neutral-500">
                          {totalOccupiedCells}/{totalAvailableCells} módulos
                        </div>
                      </div>

                      <div className="pl-1 pt-1 border-t border-neutral-200">
                        <div className="text-[7.5px] uppercase font-bold text-neutral-500">Caminhões / Romaneios</div>
                        <div className="text-xs font-black text-neutral-950 font-mono leading-tight">
                          {truckLoads.length} <span className="text-[8.5px] font-normal">cargas</span>
                        </div>
                        <div className="text-[8px] text-neutral-500">
                          {varietySummary.length} variedades
                        </div>
                      </div>
                    </div>

                    {/* Bloco 2: Balanço dos Veios e Eixo Central (4 colunas) */}
                    <div className="col-span-4 p-1.5 bg-neutral-50 border border-neutral-200 rounded flex flex-col justify-between">
                      <div className="flex items-center justify-between pb-0.5 border-b border-neutral-200 text-[8.5px] font-bold uppercase tracking-wider text-neutral-700">
                        <span>Balanço de Carga & Veios</span>
                        <span className="text-red-700 font-black">Divisão Central (G3 | G4)</span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 py-1">
                        <div className="bg-white p-1 rounded border border-neutral-200">
                          <div className="text-[7px] font-bold text-neutral-500 uppercase">Veio Esquerdo (G1-G3)</div>
                          <div className="font-black text-neutral-950 font-mono text-[10.5px] leading-tight">
                            {sectorSummary.leftKg.toLocaleString('pt-BR')} kg
                          </div>
                          <div className="text-[8px] text-neutral-600">
                            {sectorSummary.leftBags} bags ({(sectorSummary.leftKg / 1000).toFixed(1)}t)
                          </div>
                        </div>

                        <div className="bg-white p-1 rounded border border-neutral-200">
                          <div className="text-[7px] font-bold text-neutral-500 uppercase">Veio Direito (G4-G6)</div>
                          <div className="font-black text-neutral-950 font-mono text-[10.5px] leading-tight">
                            {sectorSummary.rightKg.toLocaleString('pt-BR')} kg
                          </div>
                          <div className="text-[8px] text-neutral-600">
                            {sectorSummary.rightBags} bags ({(sectorSummary.rightKg / 1000).toFixed(1)}t)
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[8px] text-neutral-600 pt-0.5 border-t border-neutral-200 font-mono">
                        <span>Frente (V01-08): <strong>{sectorSummary.frontKg.toLocaleString('pt-BR')} kg</strong> ({sectorSummary.frontBags}b)</span>
                        <span>•</span>
                        <span>Fundos (V09-16): <strong>{sectorSummary.backKg.toLocaleString('pt-BR')} kg</strong> ({sectorSummary.backBags}b)</span>
                      </div>
                    </div>

                    {/* Bloco 3: Variedades de Alho (4 colunas) */}
                    <div className="col-span-4 p-1.5 bg-neutral-50 border border-neutral-200 rounded flex flex-col justify-between">
                      <div className="flex items-center justify-between pb-0.5 border-b border-neutral-200 text-[8.5px] font-bold uppercase tracking-wider text-neutral-700">
                        <span>Variedades de Alho</span>
                        <span className="text-neutral-500">{varietySummary.length} cadastradas</span>
                      </div>

                      <div className="space-y-0.5 py-0.5 overflow-hidden">
                        {varietySummary.map((v) => {
                          const percent = totalKg > 0 ? (v.totalKg / totalKg) * 100 : 0;
                          return (
                            <div key={v.variety} className="flex items-center justify-between text-[8.5px]">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full border border-black/20 shrink-0"
                                  style={{ backgroundColor: v.color }}
                                />
                                <span className="font-bold text-neutral-900 truncate max-w-[90px]">{v.variety}</span>
                              </div>
                              <div className="font-mono text-neutral-800">
                                <span className="font-bold">{v.totalKg.toLocaleString('pt-BR')} kg</span> ({Math.round(v.totalBags)} b) • <span className="font-black text-amber-800">{percent.toFixed(0)}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-[7.5px] text-neutral-500 truncate pt-0.5 border-t border-neutral-200">
                        Origens: {Array.from(new Set(varietySummary.flatMap((v) => Array.from(v.farms)))).slice(0, 3).join(', ')}
                      </div>
                    </div>
                  </div>
                )}

                {/* MATRIZ CENTRAL: TABELA EXPANDIDA DO MAPA (16 VÃOS × 6 GALERIAS COM A LINHA DO MEIO VERMELHA) */}
                <div className="border-2 border-neutral-400 rounded-md overflow-hidden print-break-inside-avoid shadow-xs">
                  <table className="w-full text-left border-collapse leading-tight">
                    <thead>
                      {/* Faixa Macro: Veio Esquerdo vs Meio vs Veio Direito */}
                      <tr className="bg-neutral-900 text-white font-sans text-[9px] sm:text-[10px]">
                        <th colSpan={2} className="py-2 px-2 text-center font-bold uppercase border-r border-neutral-700 w-28">
                          Posição Longitudinal
                        </th>
                        <th colSpan={Math.floor(galleryCount / 2)} className="py-2 px-2 text-center font-black uppercase tracking-wider bg-neutral-800 border-r-4 border-r-red-600 print:border-r-4 print:border-r-red-600 text-[10.5px] sm:text-xs">
                          ◄ VEIO ESQUERDO (Galerias 1 a 3 • Lado Esquerdo do Meio)
                        </th>
                        <th colSpan={galleryCount - Math.floor(galleryCount / 2)} className="py-2 px-2 text-center font-black uppercase tracking-wider bg-neutral-800 border-r border-neutral-700 text-[10.5px] sm:text-xs">
                          VEIO DIREITO (Galerias 4 a 6 • Lado Direito do Meio) ►
                        </th>
                        <th className="py-2 px-2 text-right font-black uppercase w-24 bg-neutral-950 text-[10.5px] sm:text-xs">
                          Total Vão
                        </th>
                      </tr>

                      {/* Cabeçalho das Colunas Individuais */}
                      <tr className="bg-neutral-800 text-neutral-200 font-sans border-b border-neutral-400 text-[9px] sm:text-[10px]">
                        <th className="py-1.5 px-1.5 text-center w-14 border-r border-neutral-700 font-black">Vagão</th>
                        <th className="py-1.5 px-1.5 text-center w-14 border-r border-neutral-700 font-bold">Posição</th>
                        {Array.from({ length: galleryCount }).map((_, c) => {
                          const midG = Math.floor(galleryCount / 2);
                          const isMidLeft = c === midG - 1;
                          const isMidRight = c === midG;
                          return (
                            <th
                              key={c}
                              className={`py-1.5 px-2 text-center ${
                                isMidLeft
                                  ? 'border-r-4 border-r-red-600 print:border-r-4 print:border-r-red-600 bg-neutral-800'
                                  : 'border-r border-neutral-700'
                              }`}
                            >
                              <div className="font-black text-[10.5px] text-white">Gal. {c + 1}</div>
                              {isMidLeft && (
                                <div className="text-[7.5px] font-black text-red-400 uppercase tracking-tighter">
                                  ◄ MEIO DO ESTALEIRO
                                </div>
                              )}
                              {isMidRight && (
                                <div className="text-[7.5px] font-black text-red-400 uppercase tracking-tighter">
                                  MEIO DO ESTALEIRO ►
                                </div>
                              )}
                            </th>
                          );
                        })}
                        <th className="py-1.5 px-2 text-right font-bold w-24 bg-neutral-900 text-white">Total Vão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {Array.from({ length: lengthBays }).map((_, b) => {
                        const isFront = b < Math.floor(lengthBays / 2);
                        let bayTotalKg = 0;
                        let bayTotalBags = 0;

                        for (let c = 0; c < galleryCount; c++) {
                          if (viewMode === 'consolidated') {
                            const cell = consolidatedGrid[`g${c}_b${b}`];
                            if (cell) {
                              bayTotalKg += cell.totalKg;
                              bayTotalBags += cell.totalBags;
                            }
                          } else {
                            const alloc = cellAllocations[`g${c}_b${b}_t${selectedTier}`];
                            if (alloc) {
                              bayTotalKg += alloc.allocatedKg;
                              bayTotalBags += alloc.allocatedBags;
                            }
                          }
                        }

                        return (
                          <tr key={b} className={b % 2 === 0 ? 'bg-white' : 'bg-neutral-50/70'}>
                            {/* Número do Vagão */}
                            <td className={`${mapRowPy} text-center font-black font-mono bg-neutral-100 border-r border-neutral-300 ${mapBayText}`}>
                              Vão {String(b + 1).padStart(2, '0')}
                            </td>

                            {/* Posição Frente / Fundos */}
                            <td className={`${mapRowPy} px-1 text-center font-mono border-r border-neutral-300`}>
                              <span className={`px-1.5 py-0.5 rounded font-bold ${isExtraLarge || isLarge ? 'text-[8.5px]' : 'text-[8px]'} ${isFront ? 'text-amber-900 bg-amber-100' : 'text-blue-900 bg-blue-100'}`}>
                                {isFront ? 'Frente' : 'Fundos'}
                              </span>
                              <div className="text-[7px] text-neutral-400 mt-0.5">
                                {(b * 4.5).toFixed(0)}-{((b + 1) * 4.5).toFixed(0)}m
                              </div>
                            </td>

                            {/* Galerias 1 a 6 */}
                            {Array.from({ length: galleryCount }).map((_, c) => {
                              const midG = Math.floor(galleryCount / 2);
                              const isMidDivider = c === midG - 1;
                              const borderClass = isMidDivider
                                ? 'border-r-4 border-r-red-600 print:border-r-4 print:border-r-red-600'
                                : 'border-r border-neutral-300';

                              if (viewMode === 'consolidated') {
                                const cell = consolidatedGrid[`g${c}_b${b}`];
                                const hasGarlic = cell && cell.totalKg > 0;

                                return (
                                  <td
                                    key={c}
                                    className={`${mapRowPy} align-middle ${borderClass} ${
                                      hasGarlic ? 'bg-amber-50/60' : 'bg-neutral-50/30'
                                    }`}
                                  >
                                    {hasGarlic ? (
                                      <div className="flex items-center justify-between gap-1 leading-tight">
                                        <div className="flex items-baseline gap-1 shrink-0">
                                          <span className={`font-black text-neutral-950 font-mono ${mapKgText}`}>
                                            {cell.totalKg.toLocaleString('pt-BR')} kg
                                          </span>
                                          <span className={`${mapBagText} text-neutral-600 font-mono font-bold`}>
                                            ({Math.round(cell.totalBags)}b)
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          {cell.varieties.map((v, vIdx) => (
                                            <span
                                              key={vIdx}
                                              className={`px-1.5 py-0.5 rounded ${mapTagText} font-bold border-2 shadow-xs truncate max-w-[95px]`}
                                              style={{
                                                backgroundColor: `${v.color}22`,
                                                borderColor: v.color,
                                                color: '#0f172a',
                                              }}
                                              title={`${v.name}: ${v.kg}kg (${Math.round(v.bags)} bags)`}
                                            >
                                              {v.name}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className={`text-center ${mapBagText} text-neutral-400 italic py-0.5`}>Livre</div>
                                    )}
                                  </td>
                                );
                              } else {
                                const alloc = cellAllocations[`g${c}_b${b}_t${selectedTier}`];
                                const load = alloc ? loadsById[alloc.loadId] : null;

                                return (
                                  <td
                                    key={c}
                                    className={`${mapRowPy} align-middle ${borderClass} ${
                                      alloc ? 'bg-amber-50/60' : 'bg-neutral-50/30'
                                    }`}
                                  >
                                    {alloc && load ? (
                                      <div className="flex items-center justify-between gap-1 leading-tight">
                                        <div className="flex items-baseline gap-1 shrink-0">
                                          <span className={`font-black text-neutral-950 font-mono ${mapKgText}`}>
                                            {alloc.allocatedKg.toLocaleString('pt-BR')} kg
                                          </span>
                                          <span className={`${mapBagText} text-neutral-600 font-mono font-bold`}>
                                            ({Math.round(alloc.allocatedBags)}b)
                                          </span>
                                        </div>
                                        <span
                                          className={`px-1.5 py-0.5 rounded ${mapTagText} font-bold border-2 shadow-xs truncate max-w-[95px]`}
                                          style={{
                                            backgroundColor: `${load.varietyColor}22`,
                                            borderColor: load.varietyColor,
                                            color: '#0f172a',
                                          }}
                                        >
                                          {load.variety}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className={`text-center ${mapBagText} text-neutral-400 italic py-0.5`}>Livre</div>
                                    )}
                                  </td>
                                );
                              }
                            })}

                            {/* Total Acumulado do Vagão */}
                            <td className={`${mapRowPy} text-right font-mono bg-neutral-100 font-bold border-l border-neutral-300`}>
                              {bayTotalKg > 0 ? (
                                <div>
                                  <span className={`font-black text-neutral-950 ${mapKgText}`}>{bayTotalKg.toLocaleString('pt-BR')} kg</span>
                                  <span className={`${mapBagText} text-neutral-500 font-normal ml-1`}>({Math.round(bayTotalBags)}b)</span>
                                </div>
                              ) : (
                                <span className="text-neutral-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-neutral-200 font-bold font-mono text-neutral-950 border-t-2 border-neutral-800">
                        <td colSpan={2} className={`${mapRowPy} text-center uppercase font-sans font-black ${mapBayText}`}>
                          Totais
                        </td>
                        {Array.from({ length: galleryCount }).map((_, c) => {
                          const midG = Math.floor(galleryCount / 2);
                          const isMidDivider = c === midG - 1;
                          let galKg = 0;
                          let galBags = 0;
                          for (let b = 0; b < lengthBays; b++) {
                            const cell = consolidatedGrid[`g${c}_b${b}`];
                            if (cell) {
                              galKg += cell.totalKg;
                              galBags += cell.totalBags;
                            }
                          }
                          return (
                            <td
                              key={c}
                              className={`${mapRowPy} text-center ${
                                isMidDivider
                                  ? 'border-r-4 border-r-red-600 print:border-r-4 print:border-r-red-600'
                                  : 'border-r border-neutral-300'
                              }`}
                            >
                              <div className={`font-black ${mapKgText}`}>{galKg.toLocaleString('pt-BR')} kg</div>
                              <div className={`${mapBagText} text-neutral-700 font-bold font-sans`}>
                                {Math.round(galBags)} bags ({(galKg / 1000).toFixed(1)}t)
                              </div>
                              {isMidDivider && (
                                <div className="text-[7.5px] font-black text-red-600 uppercase tracking-tighter">
                                  ▲ MEIO DO ESTALEIRO ▲
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className={`${mapRowPy} text-right font-black text-amber-950 bg-amber-200`}>
                          <div className={`font-black ${mapKgText}`}>{totalKg.toLocaleString('pt-BR')} kg</div>
                          <div className={`${mapBagText} text-amber-950 font-bold font-sans`}>
                            {Math.round(totalBags)} bags ({(totalKg / 1000).toFixed(1)}t)
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* FAIXA INFERIOR: CONDICIONAL ENTRE MODO MAXIMIZADO (SOMENTE ASSINATURAS E VALIDAÇÃO COMPACTAS) E MODO COM TABELA DE ROMANEIOS */}
                {isMaximized ? (
                  <div className="flex items-center justify-between gap-4 pt-2 border-t border-neutral-300 print-break-inside-avoid">
                    <div className="flex items-center gap-4 text-[8.5px] text-neutral-600 font-mono">
                      <span><strong>Total Romaneios:</strong> {truckLoads.length} cargas</span>
                      <span>•</span>
                      <span><strong>Capacidade Nominal:</strong> 527.904 kg (18,80 ha)</span>
                      <span>•</span>
                      <span><strong>Eficiência Ocupação:</strong> {occupancyPercent.toFixed(1)}%</span>
                      <span>•</span>
                      <span className="text-neutral-400">Emissão: {currentDate} às {currentTime} • Grupo Igarashi - Estaleiro 03</span>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-center min-w-[150px]">
                        <div className="border-t border-neutral-900 w-full mb-1"></div>
                        <div className="font-bold text-neutral-950 text-[8.5px] uppercase">
                          Resp. Estaleiro & Balança
                        </div>
                        <div className="text-[7px] text-neutral-500">Conferência Física & Pesagem</div>
                      </div>
                      <div className="text-center min-w-[150px]">
                        <div className="border-t border-neutral-900 w-full mb-1"></div>
                        <div className="font-bold text-neutral-950 text-[8.5px] uppercase">
                          Eng. Agrônomo / Qualidade
                        </div>
                        <div className="text-[7px] text-neutral-500">Monitoramento de Cura Natural</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-12 gap-2.5 pt-1.5 border-t border-neutral-300 print-break-inside-avoid">
                    {/* Coluna Esquerda: Romaneios de Caminhões Pesados (7 colunas) */}
                    <div className="col-span-7">
                      <div className="text-[8.5px] font-bold uppercase tracking-wider text-neutral-800 mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-neutral-900" />
                          <span>Relação de Romaneios Pesados ({truckLoads.length} cargas)</span>
                        </div>
                        <span className="text-[8px] font-mono text-neutral-500 font-normal">
                          Carga Total: {totalKg.toLocaleString('pt-BR')} kg ({Math.round(totalBags)} bags)
                        </span>
                      </div>

                      <div className="border border-neutral-300 rounded overflow-hidden">
                        <table className="w-full text-left text-[8px] font-sans border-collapse leading-tight">
                          <thead>
                            <tr className="bg-neutral-100 text-neutral-700 font-bold border-b border-neutral-300 text-[8px]">
                              <th className="py-1 px-1.5">Romaneio</th>
                              <th className="py-1 px-1.5">Placa</th>
                              <th className="py-1 px-1.5">Variedade</th>
                              <th className="py-1 px-1.5">Origem (Fazenda / Pivô)</th>
                              <th className="py-1 px-1.5 text-right font-mono">Peso Líquido</th>
                              <th className="py-1 px-1.5 text-right font-mono">Bags</th>
                              <th className="py-1 px-1.5">Vãos/Galerias</th>
                              <th className="py-1 px-1 text-center">Cura</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200 font-mono text-[8px]">
                            {truckLoads.map((load) => {
                              const occupied = allocationsList.filter((a) => a.loadId === load.id);
                              const gOccupied = Array.from(new Set(occupied.map((c) => Number(c.galleryIdx) + 1))).sort((a: number, b: number) => a - b);
                              const bOccupied = Array.from(new Set(occupied.map((c) => Number(c.bayIdx) + 1))).sort((a: number, b: number) => a - b);
                              return (
                                <tr key={load.id} className="hover:bg-neutral-50">
                                  <td className="py-1 px-1.5 font-bold text-neutral-950 font-mono">{load.romaneioNumber}</td>
                                  <td className="py-1 px-1.5 text-neutral-700">{load.truckPlate || 'S/ Placa'}</td>
                                  <td className="py-1 px-1.5 font-sans font-bold flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: load.varietyColor }} />
                                    <span className="truncate max-w-[65px]">{load.variety}</span>
                                  </td>
                                  <td className="py-1 px-1.5 font-sans text-neutral-700 truncate max-w-[95px]">
                                    {load.farm} • P{load.pivot}
                                  </td>
                                  <td className="py-1 px-1.5 text-right font-bold text-neutral-900 font-mono">
                                    {load.totalWeightKg.toLocaleString('pt-BR')} kg
                                  </td>
                                  <td className="py-1 px-1.5 text-right text-neutral-700 font-mono">{load.bagsCount} b</td>
                                  <td className="py-1 px-1.5 font-sans text-[7.5px] text-neutral-700 truncate max-w-[90px]">
                                    G:{gOccupied.join(',')} V:{bOccupied.join(',')}
                                  </td>
                                  <td className="py-1 px-1 text-center text-emerald-800 font-bold font-sans">
                                    {load.daysCuring}d
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Coluna Direita: Termo de Conferência & Assinaturas Oficiais (5 colunas) */}
                    <div className="col-span-5 flex flex-col justify-between pl-1">
                      <div className="text-[8.5px] font-bold uppercase tracking-wider text-neutral-800 mb-1">
                        Termo de Conferência & Validação Oficial
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-3 pb-1 text-center">
                        <div>
                          <div className="border-t border-neutral-900 w-full mb-1"></div>
                          <div className="font-bold text-neutral-950 text-[8.5px] uppercase">
                            Resp. Estaleiro & Balança
                          </div>
                          <div className="text-[7px] text-neutral-500 leading-tight">
                            Conferência de Peso Líquido, Bags e Alocação
                          </div>
                        </div>

                        <div>
                          <div className="border-t border-neutral-900 w-full mb-1"></div>
                          <div className="font-bold text-neutral-950 text-[8.5px] uppercase">
                            Eng. Agrônomo / Qualidade
                          </div>
                          <div className="text-[7px] text-neutral-500 leading-tight">
                            Sanidade e Monitoramento de Cura Natural
                          </div>
                        </div>
                      </div>

                      <div className="text-[7.5px] text-neutral-400 font-mono text-center pt-1.5 border-t border-neutral-200 leading-none">
                        Grupo Igarashi • Sistema Integrado de Estaleiros de Alho • Estaleiro 03 • Emissão: {currentDate} às {currentTime} • Documento Oficial em Folha Única A4
                      </div>
                    </div>
                  </div>
                )}
              </div>
                );
              })()
            ) : (
              /* ========================================================================= */
              /* LAYOUT EXPANDIDO MULTI-PÁGINAS                                            */
              /* ========================================================================= */
              <div>
            {/* CABEÇALHO TÉCNICO OFICIAL */}
            <div className="border-b-2 border-neutral-900 pb-3 mb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-md bg-emerald-900 text-emerald-100 flex items-center justify-center font-bold text-xl tracking-wider shadow-sm">
                    GI
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-800">
                      GRUPO IGARASHI • UNIDADE DE CURA NATURAL DE ALHO
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-neutral-950 uppercase tracking-tight">
                      MAPA DE OCUPAÇÃO & ROMANEIOS • ESTALEIRO 03
                    </h1>
                    <div className="text-xs font-medium text-neutral-600 flex flex-wrap items-center gap-2 mt-0.5">
                      <span>
                        Estrutura: {galleryCount} Galerias × {lengthBays} Vãos (Vagões de 4,5m) × {tierCount} Níveis
                      </span>
                      <span>•</span>
                      <span>Dimensões: 36,0m × 72,0m • Altura: 15,0m</span>
                      <span>•</span>
                      <span className="font-semibold text-neutral-800">Capacidade Nominal: 527.904 kg (18,80 ha)</span>
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs text-neutral-600 bg-neutral-100 px-3 py-2 rounded border border-neutral-300 shrink-0">
                  <div>
                    <span className="font-semibold text-neutral-900">Emissão: </span>
                    {currentDate} às {currentTime}
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-900">Modo: </span>
                    {viewMode === 'consolidated'
                      ? 'Consolidado Geral (Todos os Níveis)'
                      : `Nível ${selectedTier + 1} (${((selectedTier + 1) * 1.8 + 1.2).toFixed(1)}m)`}
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-900">Status da Safra: </span>
                    <span className="text-emerald-700 font-bold">Safra em Plena Cura</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO 1: RESUMO GERAL EXECUTIVO (KPIS) */}
            <div className="mb-4 print-break-inside-avoid">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-neutral-900" />
                <span>1. Resumo Geral de Carga & Balança</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3">
                <div className="p-2.5 rounded bg-neutral-50 border border-neutral-200">
                  <div className="text-[10px] uppercase font-bold text-neutral-500">Carga Total Armazenada</div>
                  <div className="text-lg sm:text-xl font-black text-neutral-950 font-mono mt-0.5">
                    {totalKg.toLocaleString('pt-BR')} <span className="text-xs font-normal">kg</span>
                  </div>
                  <div className="text-[11px] font-semibold text-amber-700 font-mono">
                    {(totalKg / 1000).toFixed(1)} toneladas de rama
                  </div>
                </div>

                <div className="p-2.5 rounded bg-neutral-50 border border-neutral-200">
                  <div className="text-[10px] uppercase font-bold text-neutral-500">Total de Bags Pesados</div>
                  <div className="text-lg sm:text-xl font-black text-neutral-950 font-mono mt-0.5">
                    {totalBags.toLocaleString('pt-BR')} <span className="text-xs font-normal">bags</span>
                  </div>
                  <div className="text-[11px] font-medium text-neutral-600">
                    Média: {totalBags > 0 ? Math.round(totalKg / totalBags) : 0} kg/bag
                  </div>
                </div>

                <div className="p-2.5 rounded bg-neutral-50 border border-neutral-200">
                  <div className="text-[10px] uppercase font-bold text-neutral-500">Taxa de Ocupação Real</div>
                  <div className="text-lg sm:text-xl font-black text-neutral-950 font-mono mt-0.5">
                    {occupancyPercent.toFixed(1)}%
                  </div>
                  <div className="text-[11px] font-medium text-neutral-600">
                    {totalOccupiedCells} de {totalAvailableCells} módulos ocupados
                  </div>
                </div>

                <div className="p-2.5 rounded bg-neutral-50 border border-neutral-200">
                  <div className="text-[10px] uppercase font-bold text-neutral-500">Caminhões / Romaneios</div>
                  <div className="text-lg sm:text-xl font-black text-neutral-950 font-mono mt-0.5">
                    {truckLoads.length} <span className="text-xs font-normal">cargas</span>
                  </div>
                  <div className="text-[11px] font-medium text-neutral-600">
                    {varietySummary.length} variedades identificadas
                  </div>
                </div>
              </div>

              {/* Tabela de Resumo por Variedade de Alho */}
              <div className="border border-neutral-300 rounded overflow-hidden mb-3">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 text-neutral-700 font-bold border-b border-neutral-300 text-[11px]">
                      <th className="py-1.5 px-2.5">Variedade de Alho</th>
                      <th className="py-1.5 px-2 text-right">Peso Líquido (kg)</th>
                      <th className="py-1.5 px-2 text-right">Toneladas</th>
                      <th className="py-1.5 px-2 text-right">Qtd. Bags</th>
                      <th className="py-1.5 px-2 text-right">% do Total</th>
                      <th className="py-1.5 px-2.5">Fazendas / Glebas / Pivôs de Origem</th>
                      <th className="py-1.5 px-2 text-center">Romaneios</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 font-mono text-[11px]">
                    {varietySummary.map((v) => {
                      const percent = totalKg > 0 ? (v.totalKg / totalKg) * 100 : 0;
                      return (
                        <tr key={v.variety} className="hover:bg-neutral-50">
                          <td className="py-1.5 px-2.5 font-sans font-bold flex items-center gap-1.5 text-neutral-900">
                            <span
                              className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                              style={{ backgroundColor: v.color }}
                            />
                            <span>{v.variety}</span>
                          </td>
                          <td className="py-1.5 px-2 text-right font-bold text-neutral-950">
                            {v.totalKg.toLocaleString('pt-BR')} kg
                          </td>
                          <td className="py-1.5 px-2 text-right text-neutral-700">
                            {(v.totalKg / 1000).toFixed(1)} t
                          </td>
                          <td className="py-1.5 px-2 text-right text-neutral-800">{v.totalBags} bags</td>
                          <td className="py-1.5 px-2 text-right font-bold text-amber-800">
                            {percent.toFixed(1)}%
                          </td>
                          <td className="py-1.5 px-2.5 font-sans text-neutral-700 text-[10px]">
                            {Array.from(v.farms).join(', ') || 'N/A'} • Gleba:{' '}
                            {Array.from(v.tracts).join(', ') || 'N/A'} • Pivô:{' '}
                            {Array.from(v.pivots).join(', ') || 'N/A'}
                          </td>
                          <td className="py-1.5 px-2 text-center text-neutral-600 text-[10px]">
                            {Array.from(v.romaneios).join(', ')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Sub-Resumo de Veios e Meio do Estaleiro */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border border-neutral-200 p-2 rounded bg-neutral-50">
                <div className="p-1.5 rounded bg-sky-50/60 border border-sky-200">
                  <span className="text-[10px] text-sky-900 font-bold uppercase block">
                    Veio Esquerdo (G1 a G{Math.floor(galleryCount / 2)}):
                  </span>
                  <span className="font-bold font-mono text-neutral-900">
                    {sectorSummary.leftKg.toLocaleString('pt-BR')} kg
                  </span>{' '}
                  <span className="text-neutral-600 text-[10px] font-mono">
                    ({Math.round(sectorSummary.leftBags)} bags)
                  </span>
                  <span className="block text-[9px] text-sky-700 mt-0.5 font-medium">Lado Esquerdo do Meio</span>
                </div>
                <div className="p-1.5 rounded bg-indigo-50/60 border border-indigo-200">
                  <span className="text-[10px] text-indigo-900 font-bold uppercase block">
                    Veio Direito (G{Math.floor(galleryCount / 2) + 1} a G{galleryCount}):
                  </span>
                  <span className="font-bold font-mono text-neutral-900">
                    {sectorSummary.rightKg.toLocaleString('pt-BR')} kg
                  </span>{' '}
                  <span className="text-neutral-600 text-[10px] font-mono">
                    ({Math.round(sectorSummary.rightBags)} bags)
                  </span>
                  <span className="block text-[9px] text-indigo-700 mt-0.5 font-medium">Lado Direito do Meio</span>
                </div>
                <div className="p-1.5 rounded bg-neutral-50 border border-neutral-200">
                  <span className="text-[10px] text-neutral-600 font-bold uppercase block">
                    Setor Frente (Vãos 1 a {Math.floor(lengthBays / 2)}):
                  </span>
                  <span className="font-bold font-mono text-neutral-900">
                    {sectorSummary.frontKg.toLocaleString('pt-BR')} kg
                  </span>{' '}
                  <span className="text-neutral-600 text-[10px] font-mono">
                    ({Math.round(sectorSummary.frontBags)} bags)
                  </span>
                  <span className="block text-[9px] text-neutral-500 mt-0.5">Comprimento Inicial (0m a {(Math.floor(lengthBays / 2) * 4.5).toFixed(0)}m)</span>
                </div>
                <div className="p-1.5 rounded bg-neutral-50 border border-neutral-200">
                  <span className="text-[10px] text-neutral-600 font-bold uppercase block">
                    Setor Fundos (Vãos {Math.floor(lengthBays / 2) + 1} a {lengthBays}):
                  </span>
                  <span className="font-bold font-mono text-neutral-900">
                    {sectorSummary.backKg.toLocaleString('pt-BR')} kg
                  </span>{' '}
                  <span className="text-neutral-600 text-[10px] font-mono">
                    ({Math.round(sectorSummary.backBags)} bags)
                  </span>
                  <span className="block text-[9px] text-neutral-500 mt-0.5">Comprimento Final ({(Math.floor(lengthBays / 2) * 4.5).toFixed(0)}m a {(lengthBays * 4.5).toFixed(0)}m)</span>
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: MAPA MATRICIAL GRÁFICO POR VAGÃO (VÃO) E GALERIA */}
            <div className="mb-4 print-break-inside-avoid">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-neutral-900" />
                  <span>
                    2. Planta Gráfica do Estaleiro • Informações por Vagão (Vão de 4,5m) & Galeria
                  </span>
                </div>
                <div className="text-[10px] font-mono text-neutral-500">
                  Sentido: Frente (Vão 01) ➔ Fundos (Vão {String(lengthBays).padStart(2, '0')})
                </div>
              </div>

              {/* Legenda de Orientação com Eixo Central / Meio do Estaleiro */}
              <div className="flex flex-wrap items-center justify-between text-[10px] font-semibold text-neutral-700 bg-neutral-100 px-3 py-1.5 rounded border border-neutral-300 mb-2 gap-2">
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                  <span className="flex items-center gap-1.5 text-sky-950 font-bold">
                    <span className="w-2.5 h-2.5 bg-sky-700 rounded-xs inline-block"></span>
                    <span>Veio Esquerdo (G1 a G{Math.floor(galleryCount / 2)})</span>
                  </span>

                  {/* DESTAQUE OFICIAL: O MEIO DO ESTALEIRO ENTRE AS GALERIAS */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-600 text-white font-black text-[10px] tracking-wider shadow-sm uppercase">
                    <span className="w-2 h-2 rounded-full bg-white inline-block" />
                    <span>Linha Vermelha Vertical = MEIO DO ESTALEIRO (Eixo Central)</span>
                  </span>

                  <span className="flex items-center gap-1.5 text-indigo-950 font-bold">
                    <span className="w-2.5 h-2.5 bg-indigo-700 rounded-xs inline-block"></span>
                    <span>Veio Direito (G{Math.floor(galleryCount / 2) + 1} a G{galleryCount})</span>
                  </span>
                </div>

                <div className="flex items-center gap-3 text-neutral-500 text-[9px] font-mono">
                  <span>Comprimento: Vão 01 (Frente) ➔ Vão {String(lengthBays).padStart(2, '0')} (Fundos)</span>
                </div>
              </div>

              {/* TABELA / MATRIZ PLANTA BAIXA IMPRIMÍVEL */}
              <div className="overflow-x-auto border border-neutral-400 rounded">
                <table className="w-full text-left border-collapse text-neutral-900 text-[10px]">
                  <thead>
                    {/* Linha de Agrupamento Macro: Veio Esquerdo | MEIO DO ESTALEIRO | Veio Direito */}
                    <tr className="bg-neutral-900 text-white font-bold text-[9px] tracking-wider uppercase">
                      <th colSpan={2} className="py-1.5 px-2 text-center bg-neutral-950 text-neutral-400 border-r border-neutral-700 font-mono">
                        VAGÕES (COMPRIMENTO)
                      </th>
                      <th
                        colSpan={Math.floor(galleryCount / 2)}
                        className="py-1.5 px-2 text-center bg-[#0c1f38] text-sky-200 border-r-4 border-r-red-600 print:border-r-4 print:border-r-black font-bold tracking-wider"
                      >
                        ◄ VEIO ESQUERDO (Galerias 1 a {Math.floor(galleryCount / 2)} • Lado Esquerdo do Meio)
                      </th>
                      <th
                        colSpan={galleryCount - Math.floor(galleryCount / 2)}
                        className="py-1.5 px-2 text-center bg-[#17153b] text-indigo-200 border-r border-neutral-700 font-bold tracking-wider"
                      >
                        VEIO DIREITO (Galerias {Math.floor(galleryCount / 2) + 1} a {galleryCount} • Lado Direito do Meio) ►
                      </th>
                      <th className="py-1.5 px-2 text-right bg-neutral-950 text-neutral-400 font-mono">
                        TOTAIS
                      </th>
                    </tr>

                    {/* Linha das Galerias Individuais */}
                    <tr className="bg-neutral-800 text-white font-bold border-b border-neutral-600">
                      <th className="py-2 px-2 text-center w-16 border-r border-neutral-700">Vagão</th>
                      <th className="py-2 px-2 text-center w-20 border-r border-neutral-700">Posição</th>
                      {Array.from({ length: galleryCount }).map((_, c) => {
                        const midG = Math.floor(galleryCount / 2);
                        const isMidLeftBoundary = c === midG - 1;
                        const isMidRightBoundary = c === midG;
                        const isLeft = c < midG;

                        return (
                          <th
                            key={c}
                            className={`py-2 px-2 text-center ${
                              isMidLeftBoundary
                                ? 'border-r-4 border-r-red-600 print:border-r-4 print:border-r-black bg-neutral-800/95'
                                : 'border-r border-neutral-700 last:border-r-0'
                            }`}
                          >
                            <div className="font-bold">Galeria {c + 1}</div>
                            <div className="text-[9px] font-normal text-neutral-300">
                              {isLeft ? 'Veio Esq.' : 'Veio Dir.'} (L: 6,0m)
                            </div>
                            {isMidLeftBoundary && (
                              <div className="text-[8px] font-black text-red-300 bg-red-950/90 px-1 py-0.5 rounded border border-red-500/60 mt-1 uppercase tracking-tight">
                                ◄ MEIO DO ESTALEIRO
                              </div>
                            )}
                            {isMidRightBoundary && (
                              <div className="text-[8px] font-black text-red-300 bg-red-950/90 px-1 py-0.5 rounded border border-red-500/60 mt-1 uppercase tracking-tight">
                                MEIO DO ESTALEIRO ►
                              </div>
                            )}
                          </th>
                        );
                      })}
                      <th className="py-2 px-2 text-right w-24 bg-neutral-900">Total do Vagão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-300">
                    {Array.from({ length: lengthBays }).map((_, b) => {
                      const isFront = b < Math.floor(lengthBays / 2);

                      // Soma total de kg e bags deste vagão específico através de todas as galerias
                      let bayTotalKg = 0;
                      let bayTotalBags = 0;

                      for (let c = 0; c < galleryCount; c++) {
                        if (viewMode === 'consolidated') {
                          const cell = consolidatedGrid[`g${c}_b${b}`];
                          if (cell) {
                            bayTotalKg += cell.totalKg;
                            bayTotalBags += cell.totalBags;
                          }
                        } else {
                          const alloc = cellAllocations[`g${c}_b${b}_t${selectedTier}`];
                          if (alloc) {
                            bayTotalKg += alloc.allocatedKg;
                            bayTotalBags += alloc.allocatedBags;
                          }
                        }
                      }

                      return (
                        <tr key={b} className={`hover:bg-neutral-50 ${b % 2 === 0 ? 'bg-white' : 'bg-neutral-50/60'}`}>
                          {/* Número do Vagão */}
                          <td className="py-1.5 px-2 text-center font-bold font-mono bg-neutral-100 border-r border-neutral-300">
                            <span className="px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-900">
                              Vão {String(b + 1).padStart(2, '0')}
                            </span>
                          </td>

                          {/* Posição no Comprimento (Frente / Fundos) */}
                          <td className="py-1.5 px-2 text-center text-[9px] font-medium text-neutral-600 border-r border-neutral-300">
                            <span
                              className={`px-1 py-0.5 rounded font-bold ${
                                isFront
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-blue-100 text-blue-900 border border-blue-300'
                              }`}
                            >
                              {isFront ? 'Frente' : 'Fundos'}
                            </span>
                            <div className="text-[8px] text-neutral-400 font-mono mt-0.5">
                              {(b * 4.5).toFixed(0)}m-
                              {((b + 1) * 4.5).toFixed(0)}m
                            </div>
                          </td>

                          {/* Células das Galerias */}
                          {Array.from({ length: galleryCount }).map((_, c) => {
                            const midG = Math.floor(galleryCount / 2);
                            const isMidDivider = c === midG - 1;
                            const borderClass = isMidDivider
                              ? 'border-r-4 border-r-red-600 print:border-r-4 print:border-r-black'
                              : 'border-r border-neutral-300 last:border-r-0';

                            if (viewMode === 'consolidated') {
                              const cell = consolidatedGrid[`g${c}_b${b}`];
                              const hasGarlic = cell && cell.totalKg > 0;

                              return (
                                <td
                                  key={c}
                                  className={`py-1.5 px-2 align-top transition-colors ${borderClass} ${
                                    hasGarlic ? 'bg-amber-50/50' : 'bg-neutral-50/30'
                                  }`}
                                >
                                  {hasGarlic ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between font-mono">
                                        <span className="font-black text-neutral-950 text-[11px]">
                                          {cell.totalKg.toLocaleString('pt-BR')} kg
                                        </span>
                                        <span className="text-neutral-600 font-semibold text-[10px]">
                                          {Math.round(cell.totalBags)} bags
                                        </span>
                                      </div>

                                      {/* Variedades presentes neste vagão */}
                                      <div className="flex flex-wrap gap-1">
                                        {cell.varieties.map((v) => (
                                          <span
                                            key={v.name}
                                            className="inline-flex items-center gap-1 px-1 py-0.2 rounded text-[9px] font-bold border border-black/15"
                                            style={{
                                              backgroundColor: `${v.color}22`,
                                              color: '#1e1b4b',
                                              borderColor: v.color,
                                            }}
                                          >
                                            <span
                                              className="w-1.5 h-1.5 rounded-full"
                                              style={{ backgroundColor: v.color }}
                                            />
                                            <span>{v.name}</span>
                                          </span>
                                        ))}
                                      </div>

                                      {/* Metadados adicionais: Níveis e Romaneios */}
                                      <div className="text-[8.5px] text-neutral-600 font-sans leading-tight">
                                        <span className="font-semibold text-neutral-800">
                                          Níveis: {cell.tiers.join(', ')}
                                        </span>
                                        {cell.farms.length > 0 && (
                                          <div>{cell.farms[0]} {cell.pivots.length > 0 ? `(${cell.pivots[0]})` : ''}</div>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="h-full flex items-center justify-center py-2 text-[9px] text-neutral-400 italic">
                                      Vazio / Livre
                                    </div>
                                  )}
                                </td>
                              );
                            } else {
                              // Modo por Nível Específico
                              const key = `g${c}_b${b}_t${selectedTier}`;
                              const alloc = cellAllocations[key];
                              const load = alloc ? loadsById[alloc.loadId] : null;

                              return (
                                <td
                                  key={c}
                                  className={`py-1.5 px-2 align-top ${borderClass} ${
                                    alloc ? 'bg-amber-50/70' : 'bg-neutral-50/30'
                                  }`}
                                >
                                  {alloc && load ? (
                                    <div className="space-y-0.5">
                                      <div className="flex items-center justify-between font-mono">
                                        <span className="font-black text-neutral-950 text-[11px]">
                                          {alloc.allocatedKg.toLocaleString('pt-BR')} kg
                                        </span>
                                        <span className="text-neutral-600 font-semibold text-[10px]">
                                          {Math.round(alloc.allocatedBags)} bags
                                        </span>
                                      </div>
                                      <div
                                        className="inline-flex items-center gap-1 px-1 py-0.2 rounded text-[9px] font-bold border"
                                        style={{
                                          backgroundColor: `${load.varietyColor}22`,
                                          color: '#1e1b4b',
                                          borderColor: load.varietyColor,
                                        }}
                                      >
                                        <span>{load.variety}</span>
                                      </div>
                                      <div className="text-[8.5px] text-neutral-600">
                                        {load.farm} • {load.pivot}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="py-2 text-center text-[9px] text-neutral-400 italic">
                                      Livre
                                    </div>
                                  )}
                                </td>
                              );
                            }
                          })}

                          {/* Total Acumulado do Vagão (Linha) */}
                          <td className="py-1.5 px-2 text-right font-mono bg-neutral-100 font-bold border-l border-neutral-300">
                            <div className="text-neutral-950 text-[11px]">
                              {bayTotalKg > 0 ? `${bayTotalKg.toLocaleString('pt-BR')} kg` : '-'}
                            </div>
                            {bayTotalBags > 0 && (
                              <div className="text-[9px] text-neutral-500 font-normal">
                                {Math.round(bayTotalBags)} bags
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-neutral-200 font-bold font-mono text-neutral-950 border-t-2 border-neutral-800 text-[11px]">
                      <td colSpan={2} className="py-2 px-2 text-center uppercase font-sans font-black">
                        Totais por Galeria
                      </td>
                      {Array.from({ length: galleryCount }).map((_, c) => {
                        const midG = Math.floor(galleryCount / 2);
                        const isMidDivider = c === midG - 1;
                        let galKg = 0;
                        let galBags = 0;
                        for (let b = 0; b < lengthBays; b++) {
                          const cell = consolidatedGrid[`g${c}_b${b}`];
                          if (cell) {
                            galKg += cell.totalKg;
                            galBags += cell.totalBags;
                          }
                        }
                        return (
                          <td
                            key={c}
                            className={`py-2 px-2 text-center ${
                              isMidDivider
                                ? 'border-r-4 border-r-red-600 print:border-r-4 print:border-r-black'
                                : 'border-r border-neutral-300'
                            }`}
                          >
                            <div>{galKg.toLocaleString('pt-BR')} kg</div>
                            <div className="text-[9px] text-neutral-600 font-normal font-sans">
                              {Math.round(galBags)} bags ({(galKg / 1000).toFixed(1)}t)
                            </div>
                            {isMidDivider && (
                              <div className="text-[8px] font-black text-red-600 print:text-black uppercase tracking-tighter mt-0.5">
                                ▲ MEIO DO ESTALEIRO ▲
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2 px-2 text-right font-black text-amber-950 bg-amber-200">
                        <div>{totalKg.toLocaleString('pt-BR')} kg</div>
                        <div className="text-[9px] text-amber-900 font-normal font-sans">
                          {Math.round(totalBags)} bags ({(totalKg / 1000).toFixed(1)}t)
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* SEÇÃO 3: TABELA DE ROMANEIOS E REGISTRO DE CAMINHÕES */}
            <div className="mb-4 print-break-inside-avoid">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-neutral-900" />
                <span>3. Relação de Romaneios Pesados na Balança Rodoviária</span>
              </div>

              <div className="border border-neutral-300 rounded overflow-hidden">
                <table className="w-full text-left text-xs border-collapse font-sans text-[10.5px]">
                  <thead>
                    <tr className="bg-neutral-100 text-neutral-700 font-bold border-b border-neutral-300 text-[10px]">
                      <th className="py-1.5 px-2">Romaneio</th>
                      <th className="py-1.5 px-2">Placa</th>
                      <th className="py-1.5 px-2">Origem (Fazenda / Gleba / Pivô)</th>
                      <th className="py-1.5 px-2">Variedade</th>
                      <th className="py-1.5 px-2 text-right font-mono">Peso Líquido</th>
                      <th className="py-1.5 px-2 text-right font-mono">Bags</th>
                      <th className="py-1.5 px-2">Localização no Estaleiro</th>
                      <th className="py-1.5 px-2 text-center">Cura</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 font-mono text-[10.5px]">
                    {truckLoads.map((load) => {
                      const occupied = allocationsList.filter((a) => a.loadId === load.id);
                      const gOccupied = Array.from(new Set(occupied.map((c) => Number(c.galleryIdx + 1)))).sort(
                        (a: number, b: number) => a - b
                      );
                      const bOccupied = Array.from(new Set(occupied.map((c) => Number(c.bayIdx + 1)))).sort(
                        (a: number, b: number) => a - b
                      );
                      const tOccupied = Array.from(new Set(occupied.map((c) => Number(c.tierIdx + 1)))).sort(
                        (a: number, b: number) => a - b
                      );

                      return (
                        <tr key={load.id} className="hover:bg-neutral-50">
                          <td className="py-1.5 px-2 font-bold text-neutral-950 font-mono">{load.romaneioNumber}</td>
                          <td className="py-1.5 px-2 text-neutral-700 font-mono">{load.truckPlate || 'S/ Placa'}</td>
                          <td className="py-1.5 px-2 font-sans text-neutral-800">
                            {load.farm} • Gleba {load.tract} • Pivô {load.pivot}
                          </td>
                          <td className="py-1.5 px-2 font-sans font-bold flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: load.varietyColor }}
                            />
                            <span>{load.variety}</span>
                          </td>
                          <td className="py-1.5 px-2 text-right font-bold text-neutral-900 font-mono">
                            {load.totalWeightKg.toLocaleString('pt-BR')} kg
                          </td>
                          <td className="py-1.5 px-2 text-right text-neutral-700 font-mono">{load.bagsCount} bags</td>
                          <td className="py-1.5 px-2 font-sans text-[10px] text-neutral-700">
                            Gal: {gOccupied.join(', ') || 'N/A'} • Vãos: {bOccupied.join(', ') || 'N/A'} • Níveis:{' '}
                            {tOccupied.join(', ') || 'N/A'}
                          </td>
                          <td className="py-1.5 px-2 text-center text-emerald-800 font-bold font-sans">
                            {load.daysCuring} dias
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SEÇÃO 4: TERMO DE CONFERÊNCIA & ASSINATURAS OFICIAIS */}
            <div className="pt-3 border-t border-neutral-300 text-xs text-neutral-600 print-break-inside-avoid">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 mb-2">
                <div className="text-center">
                  <div className="border-t border-neutral-900 w-3/4 mx-auto mb-1"></div>
                  <div className="font-bold text-neutral-950 text-xs uppercase">
                    Responsável pelo Estaleiro & Balança
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    Conferência de Peso Líquido, Bags e Alocação por Vão
                  </div>
                </div>

                <div className="text-center">
                  <div className="border-t border-neutral-900 w-3/4 mx-auto mb-1"></div>
                  <div className="font-bold text-neutral-950 text-xs uppercase">
                    Engenheiro Agrônomo / Controle de Qualidade
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    Atestado de Sanidade, Umidade e Monitoramento de Cura Natural
                  </div>
                </div>
              </div>

              <div className="text-center text-[9px] text-neutral-400 font-mono pt-3">
                Grupo Igarashi • Sistema Integrado de Gestão de Estaleiros de Alho • Estaleiro 03 • Gerado eletronicamente em {currentDate} às {currentTime}
              </div>
            </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
