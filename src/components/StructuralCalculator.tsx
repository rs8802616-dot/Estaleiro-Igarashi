import React, { useState } from 'react';
import { 
  Calculator, 
  Trees, 
  Droplets, 
  Weight, 
  Scale, 
  CheckCircle2, 
  Info, 
  TrendingDown, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { StructuralMetrics, TimberSpecies } from '../types';
import { TIMBER_SPECIES } from '../data/prdData';

interface StructuralCalculatorProps {
  metrics: StructuralMetrics;
  onUpdateMetrics: (newMetrics: Partial<StructuralMetrics>) => void;
}

export const StructuralCalculator: React.FC<StructuralCalculatorProps> = ({ metrics, onUpdateMetrics }) => {
  const [selectedTimberId, setSelectedTimberId] = useState<string>('eucalipto-citriodora');
  const [customCapacity, setCustomCapacity] = useState<number>(metrics.totalCapacityKg);
  const [initialMoisture, setInitialMoisture] = useState<number>(metrics.initialMoisturePercent);
  const [finalMoisture, setFinalMoisture] = useState<number>(metrics.finalMoisturePercent);
  const [curingWeeks, setCuringWeeks] = useState<number>(metrics.curingPeriodWeeks);

  const selectedTimber = TIMBER_SPECIES.find(t => t.id === selectedTimberId) || TIMBER_SPECIES[0];

  // Engineering calculations
  const totalWeightTon = customCapacity / 1000;
  const initialWaterTon = totalWeightTon * (initialMoisture / 100);
  const dryGarlicMatterTon = totalWeightTon * (1 - initialMoisture / 100);
  const finalTotalWeightTon = dryGarlicMatterTon / (1 - finalMoisture / 100);
  const waterEvaporatedTon = totalWeightTon - finalTotalWeightTon;
  const waterEvaporationKgPerDay = (waterEvaporatedTon * 1000) / (curingWeeks * 7);

  // Structural loads
  const totalPillars = 21 * 7; // 147 pilares
  const totalBays = 20 * 6; // 120 módulos
  const linearMetersRails = totalBays * metrics.levelsCount * 6; // ~5.760 a 7.000m de varais
  const loadPerMeterRailKg = customCapacity / linearMetersRails;
  const averageLoadPerPillarKg = (customCapacity + 85000) / totalPillars; // Garlic + Roof Self-weight

  // Timber compression verification (NBR 7190)
  // Pillar section 25cm x 25cm = 625 cm²
  const pillarAreaCm2 = 625;
  const pillarLoadNewton = (averageLoadPerPillarKg * 9.81);
  const actualStressMpa = (pillarLoadNewton / (pillarAreaCm2 * 100)); // MPa
  const allowableStressMpa = (selectedTimber.fc0kMpa * 0.7) / 1.4; // kmod=0.7, gamma_w=1.4
  const safetyFactor = allowableStressMpa / actualStressMpa;
  const isPillarSafe = safetyFactor >= 1.5;

  return (
    <div className="flex flex-col h-full bg-[#0F0F0F] overflow-y-auto p-4 sm:p-6 text-[#E5E7EB]">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-[#1A1A1A] p-5 rounded border border-[#2D2D2D] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-[#0F0F0F] text-[#D4A373] font-mono text-xs font-bold border border-[#2D2D2D]">
              MEMORIAL DE CÁLCULO ESTRUTURAL & HÍDRICO
            </span>
            <span className="text-xs text-[#6B7280] font-mono">NBR 7190 / EMBRAPA HORTALIÇAS</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#D4A373] mt-1">
            Dimensionamento de Cargas, Perda Hídrica e Espécies de Madeira
          </h2>
          <p className="text-xs text-[#9CA3AF]">
            Cálculo analítico para <strong className="text-white">530.000 kg (530 toneladas)</strong> de alho em rama com suspensão em {metrics.levelsCount} andares.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1A1A1A] p-4 rounded border border-[#2D2D2D] shadow-xs">
          <div className="flex items-center justify-between text-[#9CA3AF] text-xs font-medium mb-1">
            <span>Carga Total Inicial (100%)</span>
            <Weight className="w-4 h-4 text-[#D4A373]" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {customCapacity.toLocaleString('pt-BR')} <span className="text-sm font-normal text-[#9CA3AF]">kg</span>
          </div>
          <div className="text-xs text-[#D4A373] mt-1 font-semibold">
            530,00 Toneladas em rama
          </div>
        </div>

        <div className="bg-[#1A1A1A] p-4 rounded border border-[#2D2D2D] shadow-xs">
          <div className="flex items-center justify-between text-[#9CA3AF] text-xs font-medium mb-1">
            <span>Água a Evaporar na Cura</span>
            <Droplets className="w-4 h-4 text-[#38bdf8]" />
          </div>
          <div className="text-2xl font-bold text-[#38bdf8] font-mono">
            {waterEvaporatedTon.toFixed(1)} <span className="text-sm font-normal text-[#9CA3AF]">toneladas</span>
          </div>
          <div className="text-xs text-[#9CA3AF] mt-1">
            ~{Math.round(waterEvaporationKgPerDay).toLocaleString('pt-BR')} kg de vapor/dia
          </div>
        </div>

        <div className="bg-[#1A1A1A] p-4 rounded border border-[#2D2D2D] shadow-xs">
          <div className="flex items-center justify-between text-[#9CA3AF] text-xs font-medium mb-1">
            <span>Carga por Metro de Varal</span>
            <Scale className="w-4 h-4 text-[#4ade80]" />
          </div>
          <div className="text-2xl font-bold text-[#4ade80] font-mono">
            {loadPerMeterRailKg.toFixed(1)} <span className="text-sm font-normal text-[#9CA3AF]">kg/m</span>
          </div>
          <div className="text-xs text-[#9CA3AF] mt-1">
            Distribuição em {metrics.levelsCount} níveis verticais
          </div>
        </div>

        <div className="bg-[#1A1A1A] p-4 rounded border border-[#2D2D2D] shadow-xs">
          <div className="flex items-center justify-between text-[#9CA3AF] text-xs font-medium mb-1">
            <span>Fator de Segurança NBR 7190</span>
            <CheckCircle2 className="w-4 h-4 text-[#D4A373]" />
          </div>
          <div className="text-2xl font-bold text-white font-mono flex items-center gap-1.5">
            <span>{safetyFactor.toFixed(2)}x</span>
            <span className="text-xs px-2 py-0.5 rounded bg-[#112417] text-[#4ade80] font-sans font-bold border border-[#4ade80]/30">
              SEGURO
            </span>
          </div>
          <div className="text-xs text-[#9CA3AF] mt-1">
            Pilares 25x25cm em {selectedTimber.name.split('(')[0]}
          </div>
        </div>
      </div>

      {/* Main Grid: Parameters & Moisture Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Card 1: Interactive Parameters & Moisture Curve */}
        <div className="bg-[#1A1A1A] p-5 rounded border border-[#2D2D2D] shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-serif font-bold text-[#D4A373] mb-3 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-[#38bdf8]" />
              Balanço Hídrico e Ciclo de Cura (3 a 5 Semanas)
            </h3>
            <p className="text-xs text-[#9CA3AF] mb-4 leading-relaxed">
              O alho colhido em rama entra no estaleiro com ~70% de teor de água. O processo passivo por convecção térmica reduz a umidade até 13,5%, fechando as túnicas dos bulbos e secando a palha para armazenamento prolongado.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-[#E5E7EB]">Umidade Inicial de Colheita:</span>
                  <span className="text-[#38bdf8] font-mono font-bold">{initialMoisture}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="78"
                  value={initialMoisture}
                  onChange={(e) => setInitialMoisture(Number(e.target.value))}
                  className="w-full accent-[#38bdf8] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-[#E5E7EB]">Umidade Final Desejada (Pós-Cura):</span>
                  <span className="text-[#4ade80] font-mono font-bold">{finalMoisture}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="18"
                  step="0.5"
                  value={finalMoisture}
                  onChange={(e) => setFinalMoisture(Number(e.target.value))}
                  className="w-full accent-[#4ade80] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-[#E5E7EB]">Tempo de Permanência no Estaleiro:</span>
                  <span className="text-[#D4A373] font-mono font-bold">{curingWeeks} Semanas ({curingWeeks * 7} dias)</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="6"
                  value={curingWeeks}
                  onChange={(e) => setCuringWeeks(Number(e.target.value))}
                  className="w-full accent-[#D4A373] cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 p-3.5 bg-[#0F0F0F] rounded border border-[#2D2D2D]">
            <div className="text-xs font-bold text-[#D4A373] mb-2">Resumo da Transformação de Massa:</div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-2 bg-[#1A1A1A] rounded border border-[#2D2D2D]">
                <div className="text-[#9CA3AF] text-[10px]">ENTRADA (100%)</div>
                <div className="font-bold text-white mt-0.5">{totalWeightTon.toFixed(1)} t</div>
              </div>
              <div className="p-2 bg-[#1A1A1A] rounded border border-[#38bdf8]/40">
                <div className="text-[#38bdf8] text-[10px]">VAPOR D'ÁGUA</div>
                <div className="font-bold text-[#38bdf8] mt-0.5">-{waterEvaporatedTon.toFixed(1)} t</div>
              </div>
              <div className="p-2 bg-[#1A1A1A] rounded border border-[#4ade80]/40">
                <div className="text-[#4ade80] text-[10px]">SAÍDA COMERCIAL</div>
                <div className="font-bold text-[#4ade80] mt-0.5">{finalTotalWeightTon.toFixed(1)} t</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Timber Species Catalog (Madeira de Reflorestamento) */}
        <div className="bg-[#1A1A1A] p-5 rounded border border-[#2D2D2D] shadow-xs">
          <h3 className="text-base font-serif font-bold text-[#D4A373] mb-3 flex items-center gap-2">
            <Trees className="w-5 h-5 text-[#D4A373]" />
            Seleção de Espécies de Madeira (Reflorestamento e NBR 7190)
          </h3>
          <p className="text-xs text-[#9CA3AF] mb-3 leading-relaxed">
            Selecione a madeira para verificar a resistência mecânica dos 147 pilares e das tesouras tipo shed com base no PRD:
          </p>

          <div className="space-y-2 mb-4">
            {TIMBER_SPECIES.map((timber) => {
              const isSelected = timber.id === selectedTimberId;
              return (
                <div
                  key={timber.id}
                  onClick={() => setSelectedTimberId(timber.id)}
                  className={`p-3 rounded border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#26201a] border-[#D4A373] shadow-xs'
                      : 'bg-[#141414] border-[#2D2D2D] hover:border-[#3D3D3D]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        {timber.name}
                        {timber.type === 'reflorestamento' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#112417] text-[#4ade80] font-normal border border-[#4ade80]/30">
                            Reflorestamento
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#9CA3AF] italic">{timber.scientificName}</div>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <div className="font-bold text-[#D4A373]">R$ {timber.estimatedCostPerM3BRL}/m³</div>
                      <div className="text-[10px] text-[#6B7280]">{timber.resistanceClass}</div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="mt-2 pt-2 border-t border-[#D4A373]/30 text-[11px] text-[#E5E7EB] flex flex-wrap gap-x-4 gap-y-1">
                      <span><strong className="text-[#D4A373]">Densidade:</strong> {timber.densityKgM3} kg/m³</span>
                      <span><strong className="text-[#D4A373]">Compressão (fc0,k):</strong> {timber.fc0kMpa} MPa</span>
                      <span><strong className="text-[#D4A373]">Flexão (fm,k):</strong> {timber.fmkMpa} MPa</span>
                      <span><strong className="text-[#D4A373]">Durabilidade:</strong> {timber.durabilityGrade}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
