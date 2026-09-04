import { StructuralMetrics, TimberSpecies } from '../types';

export const DEFAULT_METRICS: StructuralMetrics = {
  totalCapacityKg: 527904, // Exato da placa oficial: 527.904,00 Kg (18,80 ha)
  lengthMeters: 72,
  widthMeters: 38,
  usefulHeightMeters: 14.0,
  ridgeHeightMeters: 17.5,
  levelsCount: 7, // 7 Níveis verticais de varais
  baysCount: 7, // 7 pilares no pórtico frontal (6 galerias de 6,0m)
  pillarSpacingMeters: 6.0,
  garlicPerLinearMeterKg: 14.5,
  initialMoisturePercent: 70,
  finalMoisturePercent: 13.5,
  curingPeriodWeeks: 4,
};

export const TIMBER_SPECIES: TimberSpecies[] = [
  {
    id: 'eucalipto-citriodora',
    name: 'Eucalipto Citriodora (Corymbia citriodora)',
    scientificName: 'Corymbia citriodora (Tratado em Autoclave CCA/CCB)',
    type: 'reflorestamento',
    densityKgM3: 950,
    resistanceClass: 'C60 (Alto Desempenho)',
    fc0kMpa: 62.0,
    fmkMpa: 124.0,
    durabilityGrade: 'Alta (Autoclavada CCA/CCB)',
    recommendedUse: 'Pilares principais, tesouras de cobertura e vigas mestras de alta carga.',
    estimatedCostPerM3BRL: 1450,
  },
  {
    id: 'eucalipto-grandis',
    name: 'Eucalipto Grandis / Saligna (Tratado)',
    scientificName: 'Eucalyptus grandis',
    type: 'reflorestamento',
    densityKgM3: 640,
    resistanceClass: 'C30 (Estrutural Padrão)',
    fc0kMpa: 40.3,
    fmkMpa: 70.3,
    durabilityGrade: 'Alta (Autoclavada CCA/CCB)',
    recommendedUse: 'Varais secundários de suspensão de alho, terças de telhado e contraventamentos.',
    estimatedCostPerM3BRL: 1100,
  },
  {
    id: 'pinus-taeda',
    name: 'Pinus Taeda / Elliottii (Autoclavado)',
    scientificName: 'Pinus taeda',
    type: 'reflorestamento',
    densityKgM3: 520,
    resistanceClass: 'C20 (Estrutural Leve)',
    fc0kMpa: 28.5,
    fmkMpa: 48.0,
    durabilityGrade: 'Alta (Autoclavada CCA/CCB)',
    recommendedUse: 'Varais removíveis de alho, ripas de ventilação e passarelas de inspeção.',
    estimatedCostPerM3BRL: 850,
  },
  {
    id: 'itauba',
    name: 'Itaúba Amarela (Manejo Sustentável)',
    scientificName: 'Mezilaurus itauba',
    type: 'nativa-manejo',
    densityKgM3: 960,
    resistanceClass: 'C60',
    fc0kMpa: 67.2,
    fmkMpa: 130.5,
    durabilityGrade: 'Muito Alta',
    recommendedUse: 'Bases de pilares em contato com solo/umidade e sapatas estruturais.',
    estimatedCostPerM3BRL: 3200,
  },
  {
    id: 'garapeira',
    name: 'Garapeira / Grápia',
    scientificName: 'Apuleia leiocarpa',
    type: 'nativa-manejo',
    densityKgM3: 830,
    resistanceClass: 'C40',
    fc0kMpa: 51.5,
    fmkMpa: 95.0,
    durabilityGrade: 'Muito Alta',
    recommendedUse: 'Treliças principais, nós estruturais e vigamentos de alta solicitação.',
    estimatedCostPerM3BRL: 2800,
  }
];

export const PRD_SECTIONS = {
  title: 'Documento de Requisitos de Projeto (PRD)',
  project: 'Estaleiro Industrial de Madeira para Cura de Alho em Rama',
  capacity: '530.000 kg (530 toneladas)',
  version: '2.4 - Engenharia & Arquitetura 2D',
  sections: [
    {
      id: 1,
      title: '1. Visão Geral do Produto / Projeto',
      content:
        'O projeto consiste na construção de um galpão industrial rústico de grande porte inteiramente estruturado em madeira tratada maciça, projetado especificamente para otimizar o processo tradicional de cura e secagem natural de alho em rama (réstias e feixes) em larga escala comercial. A infraestrutura atende a exigências sanitárias e agronômicas de ventilação cruzada contínua, prevenindo apodrecimento por fungos e assegurando perda hídrica homogênea.',
    },
    {
      id: 2,
      title: '2. Especificações Técnicas e Dimensionais',
      table: [
        { parameter: 'Capacidade de Carga Total (100%)', spec: '530.000 kg de alho em rama' },
        { parameter: 'Dimensões Estimadas em Planta', spec: '120,00m de comprimento x 36,00m a 40,00m de largura (4.560 m² a 4.800 m² de área útil)' },
        { parameter: 'Pé-Direito e Altura Total', spec: 'Pé-direito livre útil de 15,00m a 16,00m; Altura total de cumeeira de 18,00m' },
        { parameter: 'Estrutura Construtiva', spec: 'Pilares maciços de madeira tratada (mínimo 25x25cm a 30x30cm), vigas transversais e tesouras tipo shed/treliça; fundações em blocos/sapatas de concreto armado elevadas do solo' },
        { parameter: 'Piso & Fundação', spec: 'Solo compactado tratado estabilizado mecanicamente ou brita graduada tratada para drenagem e controle térmico' },
        { parameter: 'Cobertura & Beirais', spec: 'Telhas cerâmicas térmicas ou fibrocimento estrutural com aberturas zenitais contínuas no cume e beirais amplos (1,50m a 2,00m) para proteção contra chuva de vento' },
        { parameter: 'Módulos de Cura', spec: '20 vãos longitudinais de 6,00m x 6 vãos transversais com 8 andares de varais de suspensão' },
      ],
    },
    {
      id: 3,
      title: '3. Arquitetura Operacional e Sistema de Secagem',
      subtitle: 'Princípio de Ventilação Natural (Efeito Chaminé / Termossifão)',
      description:
        'O projeto descarta o uso de refrigeração forçada artificial cara, utilizando a aerodinâmica passiva para economia energética de 100% no processo de cura:',
      points: [
        {
          name: 'Entrada de Ar Fresco Inferior',
          desc: 'O ar fresco externo e com menor temperatura entra pelas venezianas reguláveis nas laterais inferiores e beirais baixos ao longo de todo o perímetro de 120 metros.',
        },
        {
          name: 'Circulação Vertical Multicorredor',
          desc: 'O alho é pendurado em múltiplos andares (de 1 a 10 níveis, padrão 8 andares) em varais e treliças internas de madeira maciça, com espaçamento calibrado de 0,60m a 0,80m entre réstias para vazão desobstruída.',
        },
        {
          name: 'Exaustão Zenital por Convecção',
          desc: 'O calor metabólico residual e a umidade liberados pelos bulbos (mais de 170 toneladas de vapor d’água evaporadas no ciclo) tornam o ar interno menos denso. O ar sobe por convecção natural (efeito chaminé), sendo expelido pelas aberturas zenitais e lanternins na cumeeira de 18 metros de altura.',
        },
      ],
    },
    {
      id: 4,
      title: '4. Etapas e Fluxo de Trabalho Operacional',
      steps: [
        {
          step: '1. Recepção e Carga',
          details: 'Caminhões e carretas acessam pelas pistas centrais e laterais de 120m para descarga imediata dos feixes e réstias recém-colhidos com teor de umidade inicial entre 68% e 72%.',
        },
        {
          step: '2. Suspensão em Varais',
          details: 'Equipes especializadas distribuem e penduram os feixes nos 8 andares de varais em madeira, preenchendo as 530 toneladas de baixo para cima com suporte de plataformas móveis leves.',
        },
        {
          step: '3. Cura Lenta Natural',
          details: 'O produto permanece pendurado por 3 a 5 semanas sob monitoramento de temperatura e umidade relativa, promovendo o fechamento natural das cascas (túnicas) e secagem da rama.',
        },
        {
          step: '4. Processamento Pós-Cura',
          details: 'Retirada das réstias secas (umidade final de 12-14%), transferência para setor frontal de limpeza, toalete, corte de raiz/rama, calibragem por diâmetro e encaixotamento/ensaque comercial.',
        },
      ],
    },
    {
      id: 5,
      title: '5. Próximos Passos de Engenharia & Execução',
      items: [
        'Aprovação do projeto arquitetônico 2D (planta baixa e corte longitudinal/transversal detalhado com cotas e escala técnica).',
        'Definição e aquisição das espécies de madeira de reflorestamento tratadas em autoclave (Eucalipto Citriodora C60 com impregnação CCA segundo NBR 7190).',
        'Cálculo estrutural e memorial descritivo de carga permanente + sobrecarga dos varais (peso total de 530.000 kg de alho + peso próprio da estrutura + esforço de vento nas tesouras shed).',
        'Detalhamento das sapatas em blocos de concreto armado e drenagem perimetral do solo compactado.',
      ],
    },
  ],
};
