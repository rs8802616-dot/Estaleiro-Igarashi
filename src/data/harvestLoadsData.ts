import { GarlicVarietyInfo, TruckHarvestLoad, StorageCellAllocation } from '../types';

export const GARLIC_VARIETIES: GarlicVarietyInfo[] = [
  {
    id: 'roxo-nobre',
    name: 'Alho Roxo Nobre',
    colorHex: '#9333ea', // Roxo vívido
    bulbColorHex: '#f3e8ff', // Bulbo perolado com estrias arroxeadas
    strawColorHex: '#c29b38', // Palha dourada
    description: 'Variedade nobre de alta produtividade e valor comercial, padrão de cultivo em Cristalina-GO e Alto Paranaíba.',
    cycleDays: 35,
  },
  {
    id: 'ito',
    name: 'Alho Ito',
    colorHex: '#ea580c', // Âmbar alaranjado
    bulbColorHex: '#fff7ed',
    strawColorHex: '#b48528',
    description: 'Variedade selecionada de excelente conservação pós-colheita e grande calibre de dentes.',
    cycleDays: 30,
  },
  {
    id: 'chone',
    name: 'Alho Choné',
    colorHex: '#0284c7', // Azul cerúleo
    bulbColorHex: '#f0f9ff',
    strawColorHex: '#bca142',
    description: 'Variedade tradicional com ciclo precoce, muito uniforme e resistente a fungos durante a secagem.',
    cycleDays: 28,
  },
  {
    id: 'cateto-roxo',
    name: 'Alho Cateto Roxo',
    colorHex: '#e11d48', // Carmesim rubi
    bulbColorHex: '#ffe4e6',
    strawColorHex: '#a87e22',
    description: 'Excelente pungência e sabor marcante, casca arroxeada intensa com alta retenção de umidade inicial.',
    cycleDays: 38,
  },
  {
    id: 'branco-nacional',
    name: 'Alho Branco Nacional',
    colorHex: '#10b981', // Esmeralda
    bulbColorHex: '#ffffff',
    strawColorHex: '#cbb358',
    description: 'Bulbos grandes totalmente brancos, secagem rápida em varais bem ventilados.',
    cycleDays: 25,
  },
];

export const INITIAL_TRUCK_LOADS: TruckHarvestLoad[] = [
  {
    id: 'load-1042',
    romaneioNumber: 'ROM-1042',
    truckPlate: 'BRA-3K42',
    farm: 'Fazenda Igarashi',
    tract: 'Gleba 03 (Cerrado Alto)',
    pivot: 'Pivô Central 02',
    variety: 'Alho Roxo Nobre',
    varietyColor: '#9333ea',
    totalWeightKg: 36800,
    bagsCount: 240,
    timestamp: '2026-09-02 08:30',
    daysCuring: 3,
    driverName: 'Marcos Vinícius',
    notes: 'Carga pesada na balança rodoviária. Alocado em 2 galerias contíguas no veio frontal esquerdo.',
  },
  {
    id: 'load-1043',
    romaneioNumber: 'ROM-1043',
    truckPlate: 'ONX-8921',
    farm: 'Fazenda Santa Helena',
    tract: 'Gleba 07 (Baixada)',
    pivot: 'Pivô 05',
    variety: 'Alho Ito',
    varietyColor: '#ea580c',
    totalWeightKg: 28400,
    bagsCount: 190,
    timestamp: '2026-09-02 14:15',
    daysCuring: 3,
    driverName: 'Cleber Souza',
    notes: 'Colheita manual de rama inteira. Distribuído nas Galerias 3 e 4 do veio frontal.',
  },
  {
    id: 'load-1044',
    romaneioNumber: 'ROM-1044',
    truckPlate: 'JFW-5510',
    farm: 'Fazenda Campo Alegre',
    tract: 'Gleba 12 (Chapadão)',
    pivot: 'Pivô Central 09',
    variety: 'Alho Choné',
    varietyColor: '#0284c7',
    totalWeightKg: 42100,
    bagsCount: 280,
    timestamp: '2026-09-03 09:40',
    daysCuring: 2,
    driverName: 'Sebastião Alves',
    notes: 'Excelente sanidade foliar. Ocupou as Galerias 5 e 6 no veio frontal direito.',
  },
  {
    id: 'load-1045',
    romaneioNumber: 'ROM-1045',
    truckPlate: 'RTS-7144',
    farm: 'Fazenda Igarashi',
    tract: 'Gleba 02 (Sede)',
    pivot: 'Pivô Central 01',
    variety: 'Alho Cateto Roxo',
    varietyColor: '#e11d48',
    totalWeightKg: 32500,
    bagsCount: 215,
    timestamp: '2026-09-04 11:00',
    daysCuring: 1,
    driverName: 'Rodrigo Lima',
    notes: 'Carga pesada hoje cedo. Alocado no meio do estaleiro / veio fundos (Galerias 1, 2 e 3).',
  },
];

export function generateInitialAllocations(
  galleryCount: number,
  lengthBays: number,
  tierCount: number
): Record<string, StorageCellAllocation> {
  const allocations: Record<string, StorageCellAllocation> = {};
  const halfBays = Math.floor(lengthBays / 2);
  const halfGalleries = Math.floor(galleryCount / 2);

  // Helper de alocação de caminhão
  const allocate = (
    load: TruckHarvestLoad,
    galleries: number[],
    bays: number[],
    tiers: number[]
  ) => {
    const totalCells = galleries.length * bays.length * tiers.length;
    if (totalCells === 0) return;

    const kgPerCell = Math.round(load.totalWeightKg / totalCells);
    const bagsPerCell = Math.round((load.bagsCount / totalCells) * 10) / 10;

    galleries.forEach((g) => {
      if (g >= galleryCount) return;
      bays.forEach((b) => {
        if (b >= lengthBays) return;
        tiers.forEach((t) => {
          if (t >= tierCount) return;
          const cellKey = `g${g}_b${b}_t${t}`;
          allocations[cellKey] = {
            cellKey,
            galleryIdx: g,
            bayIdx: b,
            tierIdx: t,
            side: g < halfGalleries ? 'esquerda' : 'direita',
            half: b < halfBays ? 'frontal' : 'fundos',
            loadId: load.id,
            allocatedKg: kgPerCell,
            allocatedBags: bagsPerCell,
          };
        });
      });
    });
  };

  // Caminhão 1: Galerias 0, 1 (Galeria 1 e 2), Vãos 0 a 5, Níveis 0 a 3
  allocate(
    INITIAL_TRUCK_LOADS[0],
    [0, 1],
    [0, 1, 2, 3, 4, 5],
    [0, 1, 2, 3]
  );

  // Caminhão 2: Galerias 2, 3 (Galeria 3 e 4), Vãos 0 a 4, Níveis 0 a 3
  if (galleryCount >= 4) {
    allocate(
      INITIAL_TRUCK_LOADS[1],
      [2, 3],
      [0, 1, 2, 3, 4],
      [0, 1, 2, 3]
    );
  }

  // Caminhão 3: Galerias 4, 5 (Galeria 5 e 6), Vãos 0 a 6, Níveis 0 a 3
  if (galleryCount >= 6) {
    allocate(
      INITIAL_TRUCK_LOADS[2],
      [4, 5],
      [0, 1, 2, 3, 4, 5, 6],
      [0, 1, 2, 3]
    );
  }

  // Caminhão 4: Galerias 0, 1, 2, Vãos halfBays a halfBays + 4 (Veio Fundos), Níveis 1 a 4
  if (lengthBays >= 12) {
    const fundosBays = [halfBays, halfBays + 1, halfBays + 2, halfBays + 3, halfBays + 4];
    allocate(
      INITIAL_TRUCK_LOADS[3],
      [0, 1, Math.min(2, galleryCount - 1)],
      fundosBays,
      [1, 2, 3, 4].filter((t) => t < tierCount)
    );
  }

  return allocations;
}
