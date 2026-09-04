import React, { useState, useMemo } from 'react';
import { TruckHarvestLoad, StorageCellAllocation, GarlicVarietyInfo } from '../types';
import { GARLIC_VARIETIES, INITIAL_TRUCK_LOADS, generateInitialAllocations } from '../data/harvestLoadsData';
import { 
  Truck, 
  Scale, 
  Layers, 
  Grid3X3, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  Boxes, 
  RotateCcw,
  X,
  Info,
  ChevronRight,
  Printer
} from 'lucide-react';

interface HarvestLoadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  truckLoads: TruckHarvestLoad[];
  setTruckLoads: React.Dispatch<React.SetStateAction<TruckHarvestLoad[]>>;
  cellAllocations: Record<string, StorageCellAllocation>;
  setCellAllocations: React.Dispatch<React.SetStateAction<Record<string, StorageCellAllocation>>>;
  galleryCount: number;
  lengthBays: number;
  tierCount: number;
  onSelectCellIn3D?: (galleryIdx: number, bayIdx: number, tierIdx: number) => void;
  onOpenPrintMap?: () => void;
}

export const HarvestLoadsModal: React.FC<HarvestLoadsModalProps> = ({
  isOpen,
  onClose,
  truckLoads,
  setTruckLoads,
  cellAllocations,
  setCellAllocations,
  galleryCount,
  lengthBays,
  tierCount,
  onSelectCellIn3D,
  onOpenPrintMap,
}) => {
  const [activeTab, setActiveTab] = useState<'registrar' | 'mapa' | 'cargas'>('registrar');
  const [selectedTierView, setSelectedTierView] = useState<number>(0); // Para o mapa 2D

  // Formulário de Nova Carga
  const [formData, setFormData] = useState({
    romaneioNumber: `ROM-${1040 + truckLoads.length + 1}`,
    truckPlate: 'BRA-9A20',
    farm: 'Fazenda Igarashi',
    tract: 'Gleba 04 (Planalto)',
    pivot: 'Pivô Central 03',
    varietyId: 'roxo-nobre',
    totalWeightKg: 32000,
    bagsCount: 220,
    driverName: 'Antônio Ferreira',
    daysCuring: 1,
    notes: '',
  });

  // Alocação espacial no estaleiro (onde os bags serão distribuídos)
  const [selectedGalleries, setSelectedGalleries] = useState<number[]>([0, 1]); // Galerias 1 e 2
  const [baySelectionMode, setBaySelectionMode] = useState<'frontal' | 'fundos' | 'inteiro' | 'faixa'>('frontal');
  const [bayRangeStart, setBayRangeStart] = useState<number>(1);
  const [bayRangeEnd, setBayRangeEnd] = useState<number>(Math.min(6, lengthBays));
  const [tierSelectionMode, setTierSelectionMode] = useState<'inferiores' | 'medios' | 'superiores' | 'todos'>('inferiores');

  // Metades e limites
  const halfBays = Math.floor(lengthBays / 2);
  const halfGalleries = Math.floor(galleryCount / 2);

  // Vãos calculados com base no modo
  const computedBays = useMemo(() => {
    if (baySelectionMode === 'frontal') {
      return Array.from({ length: halfBays }, (_, i) => i);
    } else if (baySelectionMode === 'fundos') {
      return Array.from({ length: lengthBays - halfBays }, (_, i) => halfBays + i);
    } else if (baySelectionMode === 'inteiro') {
      return Array.from({ length: lengthBays }, (_, i) => i);
    } else {
      const start = Math.max(0, bayRangeStart - 1);
      const end = Math.min(lengthBays - 1, bayRangeEnd - 1);
      const list: number[] = [];
      for (let i = start; i <= end; i++) list.push(i);
      return list;
    }
  }, [baySelectionMode, halfBays, lengthBays, bayRangeStart, bayRangeEnd]);

  // Níveis calculados com base no modo
  const computedTiers = useMemo(() => {
    if (tierSelectionMode === 'inferiores') {
      return Array.from({ length: Math.min(3, tierCount) }, (_, i) => i);
    } else if (tierSelectionMode === 'medios') {
      const start = Math.floor(tierCount / 3);
      return Array.from({ length: Math.min(3, tierCount - start) }, (_, i) => start + i);
    } else if (tierSelectionMode === 'superiores') {
      const start = Math.max(0, tierCount - 3);
      return Array.from({ length: tierCount - start }, (_, i) => start + i);
    } else {
      return Array.from({ length: tierCount }, (_, i) => i);
    }
  }, [tierSelectionMode, tierCount]);

  // Total de células selecionadas para a nova carga
  const targetCellsCount = selectedGalleries.length * computedBays.length * computedTiers.length;
  const kgPerTargetCell = targetCellsCount > 0 ? Math.round(formData.totalWeightKg / targetCellsCount) : 0;
  const bagsPerTargetCell = targetCellsCount > 0 ? Math.round((formData.bagsCount / targetCellsCount) * 10) / 10 : 0;

  // Variedade atual selecionada
  const currentVariety = useMemo(() => {
    return GARLIC_VARIETIES.find((v) => v.id === formData.varietyId) || GARLIC_VARIETIES[0];
  }, [formData.varietyId]);

  // Estatísticas gerais de ocupação
  const totalAllocatedCells = Object.keys(cellAllocations).length;
  const totalAvailableCells = galleryCount * lengthBays * tierCount;
  const totalKgAllocated = useMemo(() => {
    return (Object.values(cellAllocations) as StorageCellAllocation[]).reduce((sum, item) => sum + item.allocatedKg, 0);
  }, [cellAllocations]);
  const totalBagsAllocated = useMemo(() => {
    return (Object.values(cellAllocations) as StorageCellAllocation[]).reduce((sum, item) => sum + item.allocatedBags, 0);
  }, [cellAllocations]);

  if (!isOpen) return null;

  // Handler de registro e alocação da carga de caminhão
  const handleRegisterAndAllocate = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedGalleries.length === 0) {
      alert('Por favor, selecione ao menos uma Galeria para descarregar o caminhão.');
      return;
    }
    if (computedBays.length === 0) {
      alert('Selecione os vãos de comprimento do estaleiro.');
      return;
    }
    if (computedTiers.length === 0) {
      alert('Selecione os níveis verticais para pendurar o alho.');
      return;
    }

    const newLoadId = `load-${Date.now()}`;
    const newLoad: TruckHarvestLoad = {
      id: newLoadId,
      romaneioNumber: formData.romaneioNumber.trim() || `ROM-${Math.floor(1000 + Math.random() * 9000)}`,
      truckPlate: formData.truckPlate.trim() || undefined,
      farm: formData.farm.trim() || 'Fazenda Principal',
      tract: formData.tract.trim() || 'Gleba Geral',
      pivot: formData.pivot.trim() || 'Pivô 01',
      variety: currentVariety.name,
      varietyColor: currentVariety.colorHex,
      totalWeightKg: Number(formData.totalWeightKg) || 20000,
      bagsCount: Number(formData.bagsCount) || 150,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      daysCuring: Number(formData.daysCuring) || 0,
      driverName: formData.driverName.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    };

    // Preenche as células selecionadas
    const newAllocations = { ...cellAllocations };

    selectedGalleries.forEach((g) => {
      computedBays.forEach((b) => {
        computedTiers.forEach((t) => {
          const cellKey = `g${g}_b${b}_t${t}`;
          newAllocations[cellKey] = {
            cellKey,
            galleryIdx: g,
            bayIdx: b,
            tierIdx: t,
            side: g < halfGalleries ? 'esquerda' : 'direita',
            half: b < halfBays ? 'frontal' : 'fundos',
            loadId: newLoadId,
            allocatedKg: kgPerTargetCell,
            allocatedBags: bagsPerTargetCell,
          };
        });
      });
    });

    setTruckLoads((prev) => [newLoad, ...prev]);
    setCellAllocations(newAllocations);
    setActiveTab('mapa');

    // Prepara formulário para o próximo caminhão
    setFormData((prev) => ({
      ...prev,
      romaneioNumber: `ROM-${1040 + truckLoads.length + 2}`,
      truckPlate: '',
      totalWeightKg: 30000,
      bagsCount: 200,
    }));
  };

  // Desalocar uma carga inteira
  const handleRemoveLoad = (loadId: string) => {
    setTruckLoads((prev) => prev.filter((l) => l.id !== loadId));
    setCellAllocations((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (next[key].loadId === loadId) delete next[key];
      });
      return next;
    });
  };

  // Esvaziar uma célula individual
  const handleClearCell = (cellKey: string) => {
    setCellAllocations((prev) => {
      const next = { ...prev };
      delete next[cellKey];
      return next;
    });
  };

  // Restaurar dados padrão de demonstração
  const handleResetToDemo = () => {
    setTruckLoads(INITIAL_TRUCK_LOADS);
    setCellAllocations(generateInitialAllocations(galleryCount, lengthBays, tierCount));
  };

  // Limpar todo o estaleiro
  const handleClearAll = () => {
    if (confirm('Tem certeza de que deseja esvaziar todo o estaleiro?')) {
      setTruckLoads([]);
      setCellAllocations({});
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-[#141820] border border-amber-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-200">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#0d1017]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  Balança, Romaneios & Carregamento do Estaleiro
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-semibold">
                  Safra Real
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Controle individual por comprimento (vãos), galerias, níveis e veios com pesagem de caminhões e bags.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenPrintMap && (
              <button
                onClick={onOpenPrintMap}
                className="px-3 py-1.5 text-xs rounded-lg bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border border-sky-600/40 transition-colors flex items-center space-x-1.5 font-semibold"
                title="Abrir mapa do estaleiro para impressão ou PDF com quilos e variedades por vagão e resumo geral"
              >
                <Printer className="w-3.5 h-3.5 text-sky-400" />
                <span>Imprimir Mapa</span>
              </button>
            )}
            <button
              onClick={handleResetToDemo}
              className="px-3 py-1.5 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors flex items-center space-x-1.5"
              title="Restaurar cargas de exemplo da safra"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Cargas Exemplo</span>
            </button>
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 text-xs rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 transition-colors flex items-center space-x-1.5"
              title="Esvaziar todo o estaleiro"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Estaleiro</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Resumo Rápido de Indicadores do Estaleiro */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3 bg-[#10141d] border-b border-neutral-800 text-xs">
          <div className="flex flex-col">
            <span className="text-neutral-400">Total Pesado na Balança</span>
            <span className="text-base font-bold text-amber-400 font-mono">
              {(totalKgAllocated / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ton
              <span className="text-xs text-neutral-400 font-normal ml-1">({totalKgAllocated.toLocaleString('pt-BR')} kg)</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-neutral-400">Total de Bags Alocados</span>
            <span className="text-base font-bold text-sky-400 font-mono">
              {Math.round(totalBagsAllocated).toLocaleString('pt-BR')} bags
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-neutral-400">Caminhões Recebidos</span>
            <span className="text-base font-bold text-emerald-400 font-mono">
              {truckLoads.length} caminhões
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-neutral-400">Ocupação do Estaleiro</span>
            <div className="flex items-center space-x-2 mt-0.5">
              <div className="flex-1 bg-neutral-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (totalAllocatedCells / totalAvailableCells) * 100)}%` }}
                />
              </div>
              <span className="font-mono text-white font-semibold">
                {((totalAllocatedCells / totalAvailableCells) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-neutral-800 px-6 bg-[#0e121a]">
          <button
            onClick={() => setActiveTab('registrar')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'registrar'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Registrar Carga de Caminhão (Balança)</span>
          </button>
          <button
            onClick={() => setActiveTab('mapa')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'mapa'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            <span>Mapa 2D de Ocupação ({galleryCount} Galerias × {lengthBays} Vãos)</span>
          </button>
          <button
            onClick={() => setActiveTab('cargas')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'cargas'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Histórico de Romaneios ({truckLoads.length})</span>
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ==================== ABA 1: REGISTRAR CARGA DE CAMINHÃO ==================== */}
          {activeTab === 'registrar' && (
            <form onSubmit={handleRegisterAndAllocate} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Coluna Esquerda: Dados da Balança e Safra */}
                <div className="lg:col-span-6 bg-[#161c27] p-5 rounded-xl border border-neutral-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                    <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                      <Scale className="w-4 h-4 text-amber-400" />
                      <span>1. Pesagem na Balança Rodoviária</span>
                    </h3>
                    <span className="text-[11px] text-neutral-400 font-mono">Entrada de Colheita</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                        Nº do Romaneio
                      </label>
                      <input
                        type="text"
                        value={formData.romaneioNumber}
                        onChange={(e) => setFormData({ ...formData, romaneioNumber: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-[#0f131a] border border-neutral-700 rounded-lg text-white font-mono focus:border-amber-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                        Placa do Caminhão
                      </label>
                      <input
                        type="text"
                        value={formData.truckPlate}
                        onChange={(e) => setFormData({ ...formData, truckPlate: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-[#0f131a] border border-neutral-700 rounded-lg text-white font-mono focus:border-amber-500 outline-none"
                        placeholder="Ex: BRA-3K42"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                        Fazenda
                      </label>
                      <input
                        type="text"
                        value={formData.farm}
                        onChange={(e) => setFormData({ ...formData, farm: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-[#0f131a] border border-neutral-700 rounded-lg text-white focus:border-amber-500 outline-none"
                        placeholder="Ex: Fazenda Igarashi"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                        Gleba
                      </label>
                      <input
                        type="text"
                        value={formData.tract}
                        onChange={(e) => setFormData({ ...formData, tract: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-[#0f131a] border border-neutral-700 rounded-lg text-white focus:border-amber-500 outline-none"
                        placeholder="Ex: Gleba 04"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                        Pivô
                      </label>
                      <input
                        type="text"
                        value={formData.pivot}
                        onChange={(e) => setFormData({ ...formData, pivot: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-[#0f131a] border border-neutral-700 rounded-lg text-white focus:border-amber-500 outline-none"
                        placeholder="Ex: Pivô Central 02"
                        required
                      />
                    </div>
                  </div>

                  {/* Seleção de Variedade */}
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">
                      Variedade de Alho em Rama
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {GARLIC_VARIETIES.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, varietyId: v.id })}
                          className={`p-2 rounded-lg text-left text-xs border transition-all flex items-center space-x-2 ${
                            formData.varietyId === v.id
                              ? 'border-amber-500 bg-amber-500/10 text-white'
                              : 'border-neutral-800 bg-[#0f131a] text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          <div 
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: v.colorHex }}
                          />
                          <span className="font-medium truncate">{v.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Peso e Bags */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-[#0f131a] border border-neutral-800">
                      <label className="block text-[11px] font-medium text-amber-400 mb-1">
                        Peso Líquido na Balança (kg)
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          step="100"
                          min="1000"
                          max="80000"
                          value={formData.totalWeightKg}
                          onChange={(e) => setFormData({ ...formData, totalWeightKg: Number(e.target.value) })}
                          className="w-full text-lg font-bold bg-transparent text-white font-mono outline-none"
                          required
                        />
                        <span className="text-xs text-neutral-400 font-mono">kg</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 mt-1 block">
                        = {(formData.totalWeightKg / 1000).toFixed(1)} toneladas de rama
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0f131a] border border-neutral-800">
                      <label className="block text-[11px] font-medium text-sky-400 mb-1">
                        Quantidade de Bags no Caminhão
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="10"
                          max="800"
                          value={formData.bagsCount}
                          onChange={(e) => setFormData({ ...formData, bagsCount: Number(e.target.value) })}
                          className="w-full text-lg font-bold bg-transparent text-white font-mono outline-none"
                          required
                        />
                        <span className="text-xs text-neutral-400 font-mono">bags</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 mt-1 block">
                        ~ {(formData.totalWeightKg / Math.max(1, formData.bagsCount)).toFixed(0)} kg/bag
                      </span>
                    </div>
                  </div>

                  {/* Motorista e Dias de Cura */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                        Motorista
                      </label>
                      <input
                        type="text"
                        value={formData.driverName}
                        onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-[#0f131a] border border-neutral-700 rounded-lg text-white focus:border-amber-500 outline-none"
                        placeholder="Nome do motorista"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                        Dias em Cura
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={formData.daysCuring}
                        onChange={(e) => setFormData({ ...formData, daysCuring: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs bg-[#0f131a] border border-neutral-700 rounded-lg text-white font-mono focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Coluna Direita: Seleção de Destino (Galerias, Vãos, Níveis e Veios) */}
                <div className="lg:col-span-6 bg-[#161c27] p-5 rounded-xl border border-neutral-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                    <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                      <Grid3X3 className="w-4 h-4 text-emerald-400" />
                      <span>2. Onde Alocar no Estaleiro (Dividir por Galerias)</span>
                    </h3>
                    <span className="text-[11px] text-emerald-400 font-mono">Descarregamento</span>
                  </div>

                  {/* A. Escolha de Galerias (pode ser mais de uma galeria como o usuário pediu!) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-white flex items-center space-x-1.5">
                        <span>Galerias na Largura:</span>
                        <span className="text-[11px] text-neutral-400 font-normal">
                          (Selecione as galerias para dividir a carga em bags)
                        </span>
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedGalleries(Array.from({ length: halfGalleries }, (_, i) => i))}
                          className="text-[10px] px-2 py-0.5 rounded bg-sky-950 hover:bg-sky-900 border border-sky-700/50 text-sky-200 font-medium"
                          title="Selecionar todas as galerias do Veio Esquerdo"
                        >
                          Veio Esquerdo (G1-G{halfGalleries})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedGalleries(Array.from({ length: galleryCount - halfGalleries }, (_, i) => i + halfGalleries))}
                          className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-200 font-medium"
                          title="Selecionar todas as galerias do Veio Direito"
                        >
                          Veio Direito (G{halfGalleries + 1}-G{galleryCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedGalleries(Array.from({ length: galleryCount }, (_, i) => i))}
                          className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium"
                        >
                          Todas
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {Array.from({ length: galleryCount }, (_, i) => {
                        const isSelected = selectedGalleries.includes(i);
                        const isLeft = i < halfGalleries;
                        const isMidLeft = i === halfGalleries - 1;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedGalleries(selectedGalleries.filter((g) => g !== i));
                              } else {
                                setSelectedGalleries([...selectedGalleries, i].sort((a, b) => a - b));
                              }
                            }}
                            className={`p-2.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center relative ${
                              isMidLeft ? 'ring-1 ring-red-500/40' : ''
                            } ${
                              isSelected
                                ? 'border-amber-500 bg-amber-500/20 text-white font-bold'
                                : 'border-neutral-800 bg-[#0f131a] text-neutral-400 hover:border-neutral-700'
                            }`}
                          >
                            <span className="text-xs font-mono">Gal. {i + 1}</span>
                            <span className="text-[9px] text-neutral-400 font-normal">
                              {isLeft ? 'Veio Esq.' : 'Veio Dir.'}
                            </span>
                            {isMidLeft && (
                              <span className="text-[7.5px] text-red-400 uppercase font-bold tracking-tight mt-0.5">
                                Meio ►
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* B. Escolha de Vãos no Comprimento (Meio Frontal / Meio Fundos / Faixa) */}
                  <div>
                    <label className="text-xs font-semibold text-white block mb-1.5">
                      Comprimento / Meio do Estaleiro (Vãos):
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setBaySelectionMode('frontal')}
                        className={`p-2 rounded-lg text-xs font-medium border text-center transition-all ${
                          baySelectionMode === 'frontal'
                            ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                            : 'border-neutral-800 bg-[#0f131a] text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        Meio Frente (1 a {halfBays})
                      </button>
                      <button
                        type="button"
                        onClick={() => setBaySelectionMode('fundos')}
                        className={`p-2 rounded-lg text-xs font-medium border text-center transition-all ${
                          baySelectionMode === 'fundos'
                            ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                            : 'border-neutral-800 bg-[#0f131a] text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        Meio Fundo ({halfBays + 1} a {lengthBays})
                      </button>
                      <button
                        type="button"
                        onClick={() => setBaySelectionMode('inteiro')}
                        className={`p-2 rounded-lg text-xs font-medium border text-center transition-all ${
                          baySelectionMode === 'inteiro'
                            ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                            : 'border-neutral-800 bg-[#0f131a] text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        Comprimento Todo ({lengthBays} vãos)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBaySelectionMode('faixa')}
                        className={`p-2 rounded-lg text-xs font-medium border text-center transition-all ${
                          baySelectionMode === 'faixa'
                            ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                            : 'border-neutral-800 bg-[#0f131a] text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        Faixa Específica
                      </button>
                    </div>

                    {baySelectionMode === 'faixa' && (
                      <div className="flex items-center space-x-3 p-2.5 rounded-lg bg-[#0f131a] border border-neutral-800 text-xs">
                        <span>Do Vão:</span>
                        <input
                          type="number"
                          min="1"
                          max={lengthBays}
                          value={bayRangeStart}
                          onChange={(e) => setBayRangeStart(Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-center text-white font-mono"
                        />
                        <span>Até o Vão:</span>
                        <input
                          type="number"
                          min={bayRangeStart}
                          max={lengthBays}
                          value={bayRangeEnd}
                          onChange={(e) => setBayRangeEnd(Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-center text-white font-mono"
                        />
                        <span className="text-neutral-500">({computedBays.length} vãos selecionados)</span>
                      </div>
                    )}
                  </div>

                  {/* C. Escolha de Níveis Verticais */}
                  <div>
                    <label className="text-xs font-semibold text-white block mb-1.5">
                      Níveis Verticais de Varais ({tierCount} níveis disponíveis):
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setTierSelectionMode('inferiores')}
                        className={`p-2 rounded-lg text-xs font-medium border text-center transition-all ${
                          tierSelectionMode === 'inferiores'
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                            : 'border-neutral-800 bg-[#0f131a] text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        Inferiores (Níveis 1 a 3)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTierSelectionMode('medios')}
                        className={`p-2 rounded-lg text-xs font-medium border text-center transition-all ${
                          tierSelectionMode === 'medios'
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                            : 'border-neutral-800 bg-[#0f131a] text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        Médios (Centro)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTierSelectionMode('superiores')}
                        className={`p-2 rounded-lg text-xs font-medium border text-center transition-all ${
                          tierSelectionMode === 'superiores'
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                            : 'border-neutral-800 bg-[#0f131a] text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        Superiores (Cume)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTierSelectionMode('todos')}
                        className={`p-2 rounded-lg text-xs font-medium border text-center transition-all ${
                          tierSelectionMode === 'todos'
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                            : 'border-neutral-800 bg-[#0f131a] text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        Todos os {tierCount} Níveis
                      </button>
                    </div>
                  </div>

                  {/* Resumo da Distribuição em Tempo Real */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-500/10 to-emerald-500/10 border border-amber-500/30 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Resumo do Descarregamento:</span>
                      </span>
                      <span className="font-mono text-amber-400 font-bold">
                        {targetCellsCount} seções preenchidas
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-neutral-300">
                      <div>
                        <span className="text-neutral-500 block">Por seção/módulo:</span>
                        <span className="font-mono font-bold text-white">
                          {kgPerTargetCell.toLocaleString('pt-BR')} kg
                          <span className="text-neutral-400 font-normal"> ({bagsPerTargetCell} bags)</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block">Galerias selecionadas:</span>
                        <span className="font-mono text-white">
                          {selectedGalleries.map((g) => `G${g + 1}`).join(', ') || 'Nenhuma'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botão de Envio */}
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2"
                  >
                    <Scale className="w-5 h-5" />
                    <span>Descarregar Caminhão e Alocar no Estaleiro</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ==================== ABA 2: MAPA 2D DE OCUPAÇÃO DO ESTALEIRO ==================== */}
          {activeTab === 'mapa' && (
            <div className="space-y-4">
              {/* Barra de Seleção de Nível Vertical */}
              <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-[#161c27] border border-neutral-800 gap-3">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-white">Visualizar Nível de Altura:</span>
                  <div className="flex space-x-1">
                    {Array.from({ length: tierCount }, (_, t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTierView(t)}
                        className={`px-2.5 py-1 text-xs rounded font-mono font-medium transition-all ${
                          selectedTierView === t
                            ? 'bg-amber-500 text-neutral-950 font-bold shadow'
                            : 'bg-[#0f131a] text-neutral-400 hover:text-white border border-neutral-800'
                        }`}
                      >
                        Nível {t + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs text-neutral-400">
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-800 border border-neutral-600 inline-block" />
                    <span>Vazio</span>
                  </span>
                  {GARLIC_VARIETIES.map((v) => (
                    <span key={v.id} className="flex items-center space-x-1">
                      <span 
                        className="w-2.5 h-2.5 rounded-full inline-block" 
                        style={{ backgroundColor: v.colorHex }}
                      />
                      <span>{v.name.replace('Alho ', '')}</span>
                    </span>
                  ))}

                  <span className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px] tracking-wide uppercase flex items-center space-x-1 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>Linha Vermelha: Meio do Estaleiro</span>
                  </span>

                  {onOpenPrintMap && (
                    <button
                      type="button"
                      onClick={onOpenPrintMap}
                      className="ml-2 px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors flex items-center space-x-1 shadow-sm"
                      title="Abrir mapa do estaleiro pronto para impressão (PDF/A4)"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimir Mapa</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Matriz 2D: Galerias (Colunas) × Vãos do Comprimento (Linhas) */}
              <div className="overflow-x-auto border border-neutral-800 rounded-xl bg-[#10141d] p-4">
                <div className="min-w-[720px]">
                  {/* Cabeçalho de Galerias */}
                  <div className="grid grid-cols-[100px_repeat(var(--galleries),1fr)] gap-2 mb-2 font-mono text-xs text-center"
                    style={{ '--galleries': galleryCount } as any}
                  >
                    <div className="text-neutral-500 font-sans text-left pl-2">Vãos (4,5m)</div>
                    {Array.from({ length: galleryCount }, (_, g) => {
                      const isMidLeft = g === halfGalleries - 1;
                      const isMidRight = g === halfGalleries;
                      return (
                        <div 
                          key={g} 
                          className={`py-1.5 px-1 rounded font-bold border relative ${
                            isMidLeft ? 'border-r-4 border-r-red-500' : ''
                          } ${
                            g < halfGalleries 
                              ? 'bg-sky-950/30 border-sky-800/40 text-sky-300' 
                              : 'bg-indigo-950/30 border-indigo-800/40 text-indigo-300'
                          }`}
                        >
                          Galeria {g + 1}
                          <span className="block text-[9px] font-normal text-neutral-400">
                            {g < halfGalleries ? 'Veio Esquerdo' : 'Veio Direito'}
                          </span>
                          {isMidLeft && (
                            <span className="block text-[8px] font-black text-red-400 uppercase mt-0.5 tracking-tight">
                              ◄ MEIO
                            </span>
                          )}
                          {isMidRight && (
                            <span className="block text-[8px] font-black text-red-400 uppercase mt-0.5 tracking-tight">
                              MEIO ►
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Linhas de Vãos */}
                  <div className="space-y-1.5">
                    {Array.from({ length: lengthBays }, (_, b) => {
                      const isFront = b < halfBays;
                      return (
                        <div 
                          key={b} 
                          className="grid grid-cols-[100px_repeat(var(--galleries),1fr)] gap-2 items-center"
                          style={{ '--galleries': galleryCount } as any}
                        >
                          {/* Identificação do Vão */}
                          <div className="text-[11px] font-mono text-neutral-400 pl-2">
                            <span className="font-bold text-white">Vão {b + 1}</span>
                            <span className="text-[9px] text-neutral-500 block">
                              {(b * 4.5).toFixed(0)}m - {((b + 1) * 4.5).toFixed(0)}m
                              <span className="ml-1 text-amber-500/80">({isFront ? 'Frente' : 'Fundo'})</span>
                            </span>
                          </div>

                          {/* Células das Galerias neste Vão e no Nível selecionado */}
                          {Array.from({ length: galleryCount }, (_, g) => {
                            const isMidLeft = g === halfGalleries - 1;
                            const cellKey = `g${g}_b${b}_t${selectedTierView}`;
                            const alloc = cellAllocations[cellKey];
                            const load = alloc ? truckLoads.find((l) => l.id === alloc.loadId) : null;

                            if (alloc && load) {
                              return (
                                <div
                                  key={g}
                                  className={`group relative p-2 rounded-lg border text-left transition-all hover:scale-[1.02] cursor-pointer ${
                                    isMidLeft ? 'border-r-4 border-r-red-500' : ''
                                  }`}
                                  style={{
                                    backgroundColor: `${load.varietyColor}20`,
                                    borderColor: `${load.varietyColor}70`,
                                  }}
                                  onClick={() => {
                                    if (onSelectCellIn3D) onSelectCellIn3D(g, b, selectedTierView);
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <span 
                                      className="text-[10px] font-bold truncate max-w-[80px]"
                                      style={{ color: load.varietyColor }}
                                    >
                                      {load.pivot}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleClearCell(cellKey);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-red-400 transition-opacity"
                                      title="Remover alho deste vão"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="text-[11px] font-mono font-bold text-white mt-0.5">
                                    {alloc.allocatedKg.toLocaleString('pt-BR')} kg
                                  </div>
                                  <div className="text-[9px] text-neutral-400 flex items-center justify-between">
                                    <span>{alloc.allocatedBags} bags</span>
                                    <span className="truncate ml-1">{load.variety.replace('Alho ', '')}</span>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={g}
                                onClick={() => {
                                  setSelectedGalleries([g]);
                                  setBaySelectionMode('faixa');
                                  setBayRangeStart(b + 1);
                                  setBayRangeEnd(b + 1);
                                  setActiveTab('registrar');
                                }}
                                className={`h-14 rounded-lg border border-dashed border-neutral-800 bg-[#0f131a]/60 hover:bg-neutral-800/40 hover:border-amber-500/40 transition-all flex flex-col items-center justify-center cursor-pointer text-neutral-600 hover:text-amber-400 ${
                                  isMidLeft ? 'border-r-4 border-r-red-500/80' : ''
                                }`}
                                title={`Clique para preencher Galeria ${g + 1}, Vão ${b + 1}, Nível ${selectedTierView + 1}`}
                              >
                                <Plus className="w-3.5 h-3.5 mb-0.5" />
                                <span className="text-[9px] font-mono">Vazio</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== ABA 3: HISTÓRICO DE ROMANEIOS / CAMINHÕES ==================== */}
          {activeTab === 'cargas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  Caminhões Registrados na Balança ({truckLoads.length} romaneios)
                </h3>
                <button
                  onClick={() => setActiveTab('registrar')}
                  className="px-3 py-1.5 text-xs rounded-lg bg-amber-500 text-neutral-950 font-bold hover:bg-amber-400 transition-colors flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Caminhão</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {truckLoads.map((load) => {
                  // Calcula quantas células este caminhão ocupa
                  const occupiedCells = (Object.values(cellAllocations) as StorageCellAllocation[]).filter((a) => a.loadId === load.id);
                  const galleriesOccupied = Array.from(new Set(occupiedCells.map((c) => c.galleryIdx + 1))).sort((a, b) => a - b);
                  const baysOccupied = Array.from(new Set(occupiedCells.map((c) => c.bayIdx + 1))).sort((a, b) => a - b);
                  const tiersOccupied = Array.from(new Set(occupiedCells.map((c) => c.tierIdx + 1))).sort((a, b) => a - b);

                  return (
                    <div
                      key={load.id}
                      className="p-4 rounded-xl bg-[#161c27] border border-neutral-800 hover:border-neutral-700 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: load.varietyColor }}
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-bold text-white font-mono">{load.romaneioNumber}</span>
                              {load.truckPlate && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">
                                  {load.truckPlate}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-neutral-400 font-medium">{load.variety}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveLoad(load.id)}
                          className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                          title="Remover caminhão e esvaziar células"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-neutral-800/80">
                        <div>
                          <span className="text-[11px] text-neutral-500 block">Origem de Campo:</span>
                          <span className="font-medium text-white">{load.farm}</span>
                          <span className="text-neutral-400 block text-[10px]">
                            {load.tract} • {load.pivot}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-neutral-500 block">Pesagem na Balança:</span>
                          <span className="font-mono font-bold text-amber-400 text-sm">
                            {load.totalWeightKg.toLocaleString('pt-BR')} kg
                          </span>
                          <span className="text-neutral-400 block text-[10px] font-mono">
                            {load.bagsCount} bags (~{(load.totalWeightKg / Math.max(1, load.bagsCount)).toFixed(0)} kg/bag)
                          </span>
                        </div>
                      </div>

                      {/* Alocação Física no Estaleiro */}
                      <div className="text-[11px] space-y-1">
                        <span className="text-neutral-400 block font-medium">Localização no Estaleiro:</span>
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          <span className="px-2 py-0.5 rounded bg-neutral-800 text-amber-300 font-mono">
                            {galleriesOccupied.length > 0 ? `Galerias: ${galleriesOccupied.join(', ')}` : 'Nenhuma galeria'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-neutral-800 text-sky-300 font-mono">
                            {baysOccupied.length > 0 ? `Vãos: ${baysOccupied[0]}-${baysOccupied[baysOccupied.length - 1]}` : 'Nenhum vão'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-neutral-800 text-emerald-300 font-mono">
                            {tiersOccupied.length > 0 ? `Níveis: ${tiersOccupied.join(', ')}` : 'Nenhum nível'}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-500 block pt-1">
                          Distribuído em {occupiedCells.length} módulos no estaleiro.
                        </span>
                      </div>
                    </div>
                  );
                })}

                {truckLoads.length === 0 && (
                  <div className="col-span-2 py-12 text-center text-neutral-500 bg-[#161c27] rounded-xl border border-dashed border-neutral-800">
                    <Truck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Nenhum caminhão registrado ainda.</p>
                    <button
                      onClick={() => setActiveTab('registrar')}
                      className="mt-3 px-4 py-2 text-xs rounded-lg bg-amber-500 text-neutral-950 font-bold hover:bg-amber-400 transition-colors"
                    >
                      Registrar Primeira Carga
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-800 bg-[#0d1017] text-xs text-neutral-400">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-amber-400" />
            <span>
              Cada seção preenchida atualiza automaticamente a malha 3D com a cor da variedade e a rastreabilidade do lote.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors"
          >
            Fechar e Ver no 3D
          </button>
        </div>
      </div>
    </div>
  );
};
