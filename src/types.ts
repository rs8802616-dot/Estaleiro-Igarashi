export type ViewMode = 
  | 'modelo-3d'
  | 'corte-aa' 
  | 'planta-baixa' 
  | 'elevacao-lateral' 
  | 'corte-bb' 
  | 'isometrica'
  | 'calculos' 
  | 'termodinamica' 
  | 'prd-completo';

export type BlueprintTheme = 'graph-paper' | 'blueprint-blue' | 'cad-dark' | 'realistic-wood';

export interface LayerVisibility {
  structure: boolean;
  garlicRacks: boolean;
  airflow: boolean;
  dimensions: boolean;
  annotations: boolean;
  foundation: boolean;
  grid: boolean;
}

export interface StructuralMetrics {
  totalCapacityKg: number; // 530,000 kg
  lengthMeters: number; // 120m
  widthMeters: number; // 36 - 40m
  usefulHeightMeters: number; // 15 - 16m
  ridgeHeightMeters: number; // 18m
  levelsCount: number; // 5 - 10 levels
  baysCount: number; // typically 6-7 cross bays, 20 longitudinal bays
  pillarSpacingMeters: number; // 6m
  garlicPerLinearMeterKg: number; // ~12-15 kg/m
  initialMoisturePercent: number; // ~68-72%
  finalMoisturePercent: number; // ~13-14%
  curingPeriodWeeks: number; // 3 - 5 weeks
}

export interface TimberSpecies {
  id: string;
  name: string;
  scientificName: string;
  type: 'reflorestamento' | 'nativa-manejo';
  densityKgM3: number;
  resistanceClass: string;
  fc0kMpa: number; // Resistência à compressão paralela
  fmkMpa: number; // Resistência à flexão
  durabilityGrade: 'Alta (Autoclavada CCA/CCB)' | 'Muito Alta' | 'Média';
  recommendedUse: string;
  estimatedCostPerM3BRL: number;
}

export interface GarlicVarietyInfo {
  id: string;
  name: string;
  colorHex: string;
  bulbColorHex: string;
  strawColorHex: string;
  description: string;
  cycleDays: number;
}

export interface TruckHarvestLoad {
  id: string;
  romaneioNumber: string;
  truckPlate?: string;
  farm: string; // Fazenda
  tract: string; // Gleba
  pivot: string; // Pivô
  variety: string; // Variedade de alho
  varietyColor: string; // Cor visual da variedade
  totalWeightKg: number; // Peso líquido de alho em rama na balança
  bagsCount: number; // Quantidade de bags
  timestamp: string; // Data e hora da pesagem
  daysCuring: number; // Dias de cura no estaleiro
  driverName?: string;
  notes?: string;
}

export interface StorageCellAllocation {
  cellKey: string; // formato: `g${galleryIdx}_b${bayIdx}_t${tierIdx}`
  galleryIdx: number; // 0 a galleryCount - 1
  bayIdx: number; // 0 a lengthBays - 1
  tierIdx: number; // 0 a tierCount - 1
  side: 'esquerda' | 'direita'; // Lado/veio transversal
  half: 'frontal' | 'fundos'; // Metade longitudinal (meio do estaleiro)
  loadId: string; // ID da carga de caminhão vinculada
  allocatedKg: number;
  allocatedBags: number;
}
