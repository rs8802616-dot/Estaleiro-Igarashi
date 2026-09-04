import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Maximize2,
  RotateCcw,
  Layers,
  Play,
  Pause,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Columns,
  X,
  Info,
  Sliders,
  Plus,
  Minus,
  Grid,
  Ruler,
  Zap,
  Tag,
  ShieldAlert,
  Flame,
  Truck,
  Scale,
  Printer
} from 'lucide-react';
import { StructuralMetrics, TruckHarvestLoad, StorageCellAllocation } from '../types';
import { RealPhotosModal } from './RealPhotosModal';
import { HarvestLoadsModal } from './HarvestLoadsModal';
import { PrintableWarehouseMapModal } from './PrintableWarehouseMapModal';
import { INITIAL_TRUCK_LOADS, generateInitialAllocations } from '../data/harvestLoadsData';

interface Warehouse3DViewProps {
  metrics: StructuralMetrics;
}

type PhotoMode = 'photoFront' | 'photoPlaque' | 'photoInternal' | 'photoLateral' | 'photoPanoramic';
type RenderStyle = 'realistic' | 'blueprint' | 'clay';

// Helper to create the official high-resolution canvas texture for the Estaleiro 03 sign (Igarashi)
function createPlaqueTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Background
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, 1024, 768);

  // Outer Border
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 14;
  ctx.strokeRect(10, 10, 1004, 748);

  // Top Dark Banner
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(16, 16, 992, 130);

  // Header Title
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ESTALEIRO DE ALHO', 512, 80);

  // Left Section: Big 03 & Estaleiro 7-Pillar Silhouette Icon
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 160px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('03', 230, 310);

  // Estaleiro Silhouette Icon
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(100, 480);
  ctx.lineTo(230, 410); // Ridge
  ctx.lineTo(360, 480);
  ctx.lineTo(345, 570);
  ctx.lineTo(115, 570);
  ctx.closePath();
  ctx.fill();

  // 7 Pillars Lines on Icon
  ctx.strokeStyle = '#f8f9fa';
  ctx.lineWidth = 5;
  const iconStep = (335 - 125) / 6;
  for (let i = 0; i <= 6; i++) {
    const ix = 125 + i * iconStep;
    ctx.beginPath();
    ctx.moveTo(ix, 475);
    ctx.lineTo(ix, 565);
    ctx.stroke();
  }

  // Divider Line
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(400, 170);
  ctx.lineTo(400, 600);
  ctx.stroke();

  // Right Section: Technical Capacity Info
  ctx.textAlign = 'left';
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('CAPACIDADE MÁXIMA:', 440, 210);

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 36px sans-serif';
  ctx.fillText('18,80 ha', 440, 260);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('CAPACIDADE MÁXIMA:', 440, 320);

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 36px sans-serif';
  ctx.fillText('527.904,00 Kg', 440, 370);

  ctx.fillStyle = '#059669';
  ctx.font = '900 34px sans-serif';
  ctx.fillText('CAPACIDADE ATUAL 100%', 440, 440);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('18,80 ha • 527.904,00 Kg', 440, 495);

  // Footer: Igarashi Logo
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(16, 610, 992, 138);

  ctx.fillStyle = '#059669';
  ctx.beginPath();
  ctx.arc(680, 678, 36, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('IG', 680, 688);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#059669';
  ctx.font = '900 54px sans-serif';
  ctx.fillText('IGARASHI', 735, 696);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  return texture;
}

// Helper to create technical bulletin sheet texture
function createBulletinTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 680;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 512, 680);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 668);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('FICHA DE CONTROLE TÉCNICO', 25, 45);

  ctx.fillStyle = '#475569';
  ctx.font = '16px sans-serif';
  ctx.fillText('LOTE: ALHO ROXO NACIONAL - SAFRA 2026', 25, 80);
  ctx.fillText('ORIGEM: CAMPOS 18,80 ha (IGARASHI)', 25, 110);
  ctx.fillText('ENTRADA: 12/08/2026 | UMIDADE INICIAL: 70%', 25, 140);
  ctx.fillText('CURA: NATURAL POR VENTILAÇÃO CRUZADA', 25, 170);
  ctx.fillText('STATUS: FASE 2 - SECAGEM DA PALHA', 25, 200);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  for (let y = 235; y <= 620; y += 38) {
    ctx.beginPath();
    ctx.moveTo(25, y);
    ctx.lineTo(485, y);
    ctx.stroke();
  }

  return new THREE.CanvasTexture(canvas);
}

// Helper to create high-definition corrugated fiber-cement roof tile texture without moire noise or cartoon artifacts
function createRoofTileTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // 1. Natural Brazilian industrial fiber-cement base tone (Telha Ondulada Cinza Real)
  ctx.fillStyle = '#6e7984';
  ctx.fillRect(0, 0, 1024, 1024);

  // 2. Soft sinusoidal wave corrugation across X (Perfil Ondulado Fibrocimento)
  const numWaves = 8;
  const waveWidth = 1024 / numWaves;

  for (let i = 0; i < numWaves; i++) {
    const x0 = i * waveWidth;
    const grad = ctx.createLinearGradient(x0, 0, x0 + waveWidth, 0);
    grad.addColorStop(0.0, 'rgba(45, 53, 62, 0.40)'); // Calha / Vale sombreado
    grad.addColorStop(0.22, 'rgba(95, 105, 115, 0.10)');
    grad.addColorStop(0.50, 'rgba(175, 188, 198, 0.45)'); // Crista da onda iluminada
    grad.addColorStop(0.78, 'rgba(95, 105, 115, 0.10)');
    grad.addColorStop(1.0, 'rgba(45, 53, 62, 0.40)'); // Calha / Vale sombreado

    ctx.fillStyle = grad;
    ctx.fillRect(x0, 0, waveWidth, 1024);

    // Linha suave de crista sem contraste excessivo (evita efeito moiré/flicker)
    ctx.strokeStyle = 'rgba(215, 226, 236, 0.18)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0 + waveWidth / 2, 0);
    ctx.lineTo(x0 + waveWidth / 2, 1024);
    ctx.stroke();
  }

  // 3. Transverse sheet overlaps (emendas longitudinais reais das telhas a cada 256px)
  for (let y = 0; y < 1024; y += 256) {
    // Sombra suave da sobreposição de placa
    ctx.fillStyle = 'rgba(25, 32, 40, 0.45)';
    ctx.fillRect(0, y, 1024, 5);

    // Borda iluminada chanfrada da telha
    ctx.fillStyle = 'rgba(200, 214, 226, 0.28)';
    ctx.fillRect(0, y + 5, 1024, 2);
  }

  // 4. Micro-textura mineral de cimento e fibras (evita aspecto liso plástico)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
  for (let n = 0; n < 2500; n++) {
    const rx = Math.random() * 1024;
    const ry = Math.random() * 1024;
    ctx.fillRect(rx, ry, 1, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 24);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 8;
  return texture;
}

export const Warehouse3DView: React.FC<Warehouse3DViewProps> = ({ metrics }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Dynamic 3D Group references
  const dynamicRootRef = useRef<THREE.Group | null>(null);
  const groupsRef = useRef<{
    slab?: THREE.Group;
    roundPillars?: THREE.Group;
    frontFacadeBeams?: THREE.Group;
    xBracings?: THREE.Group;
    galleryRails?: THREE.Group;
    garlicTiers?: THREE.Group;
    trusses?: THREE.Group;
    roofCover?: THREE.Group;
  }>({});

  // Performance ref: interactive proxy objects for raycasting
  const interactiveObjectsRef = useRef<THREE.Object3D[]>([]);

  // State
  const [galleryCount, setGalleryCount] = useState<number>(6); // Default 6 galerias = 7 pilares frontais
  const [lengthBays, setLengthBays] = useState<number>(16); // Default 16 vãos = 17 pilares de comprimento = 72m
  const [tierCount, setTierCount] = useState<number>(7); // Default 7 níveis verticais de altura
  const [garlicFillPercent, setGarlicFillPercent] = useState<number>(100); // 0% a 100% de carga de alho
  const [exploded, setExploded] = useState<number>(0);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [renderStyle, setRenderStyle] = useState<RenderStyle>('realistic');
  const [activePhotoMode, setActivePhotoMode] = useState<PhotoMode>('photoFront');
  const [showLayersMenu, setShowLayersMenu] = useState<boolean>(false);
  const [showQuantitiesModal, setShowQuantitiesModal] = useState<boolean>(false);
  const [showRealPhotosModal, setShowRealPhotosModal] = useState<boolean>(false);
  const [showHarvestModal, setShowHarvestModal] = useState<boolean>(false);
  const [showPrintMapModal, setShowPrintMapModal] = useState<boolean>(false);
  const [truckLoads, setTruckLoads] = useState<TruckHarvestLoad[]>(INITIAL_TRUCK_LOADS);
  const [cellAllocations, setCellAllocations] = useState<Record<string, StorageCellAllocation>>(() => {
    return generateInitialAllocations(6, 16, 7);
  });
  const [showSideBySideComparison, setShowSideBySideComparison] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : false;
  });
  const [isImmersive, setIsImmersive] = useState<boolean>(false);

  const [hoveredInfo, setHoveredInfo] = useState<{
    title: string;
    description: string;
    specs: string;
    load?: string;
  } | null>(null);

  // Layer Visibility
  const [layers, setLayers] = useState({
    slab: true,
    roundPillars: true,
    frontFacadeBeams: true,
    xBracings: true,
    galleryRails: true,
    garlicTiers: true, // Carga de alho
    trusses: true,
    roofCover: true,
  });

  // Dimensions
  const bW = 38; // 38m Width
  const bL = useMemo(() => lengthBays * 4.5, [lengthBays]); // e.g. 16 * 4.5 = 72m
  const bH = 14; // 14m Useful Height
  const ridgeH = 17.5; // Ridge height

  // Calculate Column Positions dynamically based on galleryCount
  const pillarColsX = useMemo(() => {
    const halfWidth = 18.0; // Span from -18m to +18m
    const numPillars = galleryCount + 1;
    const cols: number[] = [];

    if (galleryCount % 2 === 0) {
      // Even number of galleries -> exactly 1 central pillar at X = 0, half on left, half on right
      const half = galleryCount / 2;
      const step = halfWidth / half;
      for (let i = -half; i <= half; i++) {
        cols.push(Number((i * step).toFixed(2)));
      }
    } else {
      // Odd number of galleries -> evenly spaced
      const step = (halfWidth * 2) / galleryCount;
      for (let i = 0; i < numPillars; i++) {
        cols.push(Number((-halfWidth + i * step).toFixed(2)));
      }
    }
    return cols;
  }, [galleryCount]);

  // Pillar Rows along the length (lengthBays + 1 eixos a cada 4,5m)
  const pillarRowsZ = useMemo(() => {
    const rows: number[] = [];
    const halfL = bL / 2;
    for (let i = 0; i <= lengthBays; i++) {
      rows.push(Number((-halfL + i * 4.5).toFixed(2)));
    }
    return rows;
  }, [bL, lengthBays]);

  // Dynamic vertical tier elevations
  const tierElevations = useMemo(() => {
    const elevations: number[] = [];
    const minH = 2.0;
    const maxH = 13.6;
    if (tierCount <= 1) return [minH];
    const step = (maxH - minH) / (tierCount - 1);
    for (let i = 0; i < tierCount; i++) {
      elevations.push(Number((minH + i * step).toFixed(2)));
    }
    return elevations;
  }, [tierCount]);

  const totalPillarsCount = pillarColsX.length * pillarRowsZ.length;
  const gallerySpanMeters = useMemo(() => {
    return Number((36.0 / galleryCount).toFixed(2));
  }, [galleryCount]);

  // Capacity calculations proportional to modules (galerias × vãos × níveis)
  // Baseline: 6 galerias × 16 vãos × 7 níveis = 672 módulos = 527.904 kg (18,80 ha)
  const totalModules = galleryCount * lengthBays * tierCount;
  const maxCapacityKg = Math.round(totalModules * (527904 / (6 * 16 * 7)));

  // Real-time capacity from weighed truck loads if allocations exist
  const totalAllocatedKg = useMemo(() => {
    return (Object.values(cellAllocations) as StorageCellAllocation[]).reduce((sum, item) => sum + item.allocatedKg, 0);
  }, [cellAllocations]);

  const totalAllocatedBags = useMemo(() => {
    return (Object.values(cellAllocations) as StorageCellAllocation[]).reduce((sum, item) => sum + item.allocatedBags, 0);
  }, [cellAllocations]);

  const hasCellAllocations = Object.keys(cellAllocations).length > 0;
  const currentCapacityKg = hasCellAllocations
    ? totalAllocatedKg
    : Math.round(maxCapacityKg * (garlicFillPercent / 100));

  const maxHectares = Number((totalModules * (18.80 / (6 * 16 * 7))).toFixed(2));
  const currentHectares = hasCellAllocations
    ? Number(((totalAllocatedKg / 527904) * 18.80).toFixed(2))
    : Number((maxHectares * (garlicFillPercent / 100)).toFixed(2));

  // Photo presets aligned to gallery structure & user reference photos
  const photoPresets = useMemo(() => {
    const frontZ = bL / 2;
    return {
      photoFront: {
        id: 'photoFront',
        title: 'Foto 1: Fachada Frontal Real • Estaleiro 03 (Igarashi)',
        image: '/images (28).jpeg',
        subtitle: `${pillarColsX.length} Postes Frontais (${galleryCount} Galerias) • ${pillarRowsZ.length} Eixos (${bL}m) • ${tierCount} Níveis`,
        cameraPos: [0, 6.8, frontZ + 16],
        targetPos: [0, 6.8, 0],
        keyElements: [
          `${pillarColsX.length} Postes mestres roliços de eucalipto formando ${galleryCount} galerias simétricas`,
          `Vigamento horizontal de tábuas de madeira nos ${tierCount} níveis verticais de altura`,
          'Placa técnica oficial "ESTALEIRO DE ALHO 03 - IGARASHI" afixada no poste central',
          'Extintores de incêndio vermelhos de segurança afixados nos postes externos',
          `Carga de ${garlicFillPercent}% (${currentCapacityKg.toLocaleString('pt-BR')} kg de alho em rama)`,
          'Pátio frontal amplo de terra batida e acesso livre ao estaleiro',
        ],
      },
      photoPlaque: {
        id: 'photoPlaque',
        title: 'Foto 2: Placa Técnica Oficial • Estaleiro 03 (Igarashi)',
        image: '/images (29).jpeg',
        subtitle: `Capacidade Máx: ${maxHectares.toLocaleString('pt-BR')} ha / ${maxCapacityKg.toLocaleString('pt-BR')} Kg • Ocupação: ${garlicFillPercent}%`,
        cameraPos: [0, 7.5, frontZ + 4],
        targetPos: [0, 7.3, frontZ + 0.2],
        keyElements: [
          'Identificação em amarelo "ESTALEIRO DE ALHO" com número "03" e ícone de pilares',
          `Capacidade Máxima de Campo: ${maxHectares.toLocaleString('pt-BR')} hectares de cultivo`,
          `Capacidade Máxima de Massa: ${maxCapacityKg.toLocaleString('pt-BR')} Kg`,
          `Capacidade Atual de Safra: ${garlicFillPercent}% (${currentCapacityKg.toLocaleString('pt-BR')} Kg)`,
          'Fixação por amarração de ráfia e pregos no poste central roliço de eucalipto',
          'Ficha de controle fitossanitário afixada logo abaixo da placa',
        ],
      },
      photoInternal: {
        id: 'photoInternal',
        title: 'Foto 3: Detalhes dos Postes Roliços, Calços e Varais',
        image: '/images (29).jpeg',
        subtitle: `Eucalipto Tratado CCA Ø35cm, Tacos de Madeira em ${tierCount} Níveis e Feixes de Alho`,
        cameraPos: [-gallerySpanMeters, 4.2, 10],
        targetPos: [-gallerySpanMeters, 4.0, -10],
        keyElements: [
          'Postes de Eucalipto Citriodora tratado sob vácuo-pressão com CCA (Classe C60)',
          `Calços de madeira (tacos) pregados lateralmente em ${tierCount} níveis verticais de altura`,
          'Varas roliças horizontais apoiadas diretamente nos calços formando a galeria',
          'Feixes de alho amarrados pela palha com bulbos e raízes suspensos',
        ],
      },
      photoLateral: {
        id: 'photoLateral',
        title: `Foto 4: Fachada Longitudinal de ${bL}m • Beiral Amplo`,
        image: '/images (27).jpeg',
        subtitle: `Extensão Contínua de ${bL}m com ${pillarRowsZ.length} Eixos e Beirais de Proteção`,
        cameraPos: [36, 12, frontZ + 4],
        targetPos: [0, 6, 0],
        keyElements: [
          'Beiral largo de 2,50m para proteção contra chuvas de vento oblíquas',
          `${pillarRowsZ.length} eixos de postes roliços a cada 4,5m ao longo dos ${bL}m de comprimento`,
          'Pátio lateral amplo com solo rural batido e calços de concreto',
          'Abertura total permanente para convecção natural de ar e cura do alho',
        ],
      },
      photoPanoramic: {
        id: 'photoPanoramic',
        title: `Visão Geral 360° • Estaleiro 03 Completo (${pillarColsX.length} Pilares × ${pillarRowsZ.length} Eixos)`,
        image: '/images (27).jpeg',
        subtitle: `Perspectiva Aérea Mostrando a Malha de ${totalPillarsCount} Pilares e Pátio Operacional`,
        cameraPos: [52, 38, frontZ + 28],
        targetPos: [0, 7, 0],
        keyElements: [
          `${totalPillarsCount} postes mestres de eucalipto tratado Ø35cm (${pillarColsX.length} colunas × ${pillarRowsZ.length} eixos)`,
          `${pillarColsX.length} pilares na fachada com ${galleryCount} galerias contínuas`,
          `Capacidade calculada: ${currentCapacityKg.toLocaleString('pt-BR')} kg de alho em rama (${garlicFillPercent}% ocupação)`,
        ],
      },
    };
  }, [bL, galleryCount, lengthBays, pillarColsX, pillarRowsZ, tierCount, garlicFillPercent, currentCapacityKg, maxCapacityKg, maxHectares, gallerySpanMeters]);

  // Main Three.js Scene Setup (Runs Once on mount / style change)
  useEffect(() => {
    if (!mountRef.current) return;

    const getContainerSize = () => {
      if (!mountRef.current) return { width: window.innerWidth, height: window.innerHeight };
      const w = mountRef.current.clientWidth || mountRef.current.offsetWidth || window.innerWidth;
      const h = mountRef.current.clientHeight || mountRef.current.offsetHeight || (window.innerHeight - 110);
      return { width: Math.max(w, 200), height: Math.max(h, 200) };
    };

    const initialSize = getContainerSize();

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const skyColor = renderStyle === 'blueprint' ? 0x0f2744 : renderStyle === 'clay' ? 0xdcd6cc : 0x8cb4db;
    const groundColor = renderStyle === 'blueprint' ? 0x162c4a : renderStyle === 'clay' ? 0x6e5238 : 0x5a422d;

    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.Fog(skyColor, 140, 450);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, initialSize.width / initialSize.height, 0.2, 600);
    camera.position.set(0, 6.8, 52);
    cameraRef.current = camera;

    // 3. Renderer (High performance, optimized pixel ratio with logarithmicDepthBuffer)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      precision: 'highp',
      logarithmicDepthBuffer: true,
    });
    renderer.setSize(initialSize.width, initialSize.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.01;
    controls.minDistance = 3;
    controls.maxDistance = 300;
    controls.target.set(0, 6.8, 0);
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    controlsRef.current = controls;

    // 5. Lighting
    const hemiLight = new THREE.HemisphereLight(0xfff6e8, groundColor, 1.35);
    hemiLight.position.set(0, 80, 0);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffae8, 1.85);
    sunLight.position.set(50, 85, 45);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 300;
    const d = 70;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0001;
    sunLight.shadow.normalBias = 0.04;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xbad7f5, 0.55);
    fillLight.position.set(-50, 45, -40);
    scene.add(fillLight);

    // Root group for dynamic geometry rebuilds
    const dynamicRoot = new THREE.Group();
    scene.add(dynamicRoot);
    dynamicRootRef.current = dynamicRoot;

    // 6. Throttled Raycaster for smooth hover
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let lastRaycastTime = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastRaycastTime < 35) return;
      lastRaycastTime = now;

      if (!mountRef.current || !cameraRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(interactiveObjectsRef.current, false);

      if (intersects.length > 0 && intersects[0].object.userData && intersects[0].object.userData.title) {
        setHoveredInfo(intersects[0].object.userData as any);
      } else {
        setHoveredInfo(null);
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousemove', handlePointerMove);

    // 7. Animation Loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      if (controlsRef.current) {
        if (isAutoRotating) {
          controlsRef.current.autoRotate = true;
          controlsRef.current.autoRotateSpeed = 1.2;
        } else {
          controlsRef.current.autoRotate = false;
        }
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Resizing with ResizeObserver
    const handleUpdateSize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth || mountRef.current.offsetWidth || window.innerWidth;
      const h = mountRef.current.clientHeight || mountRef.current.offsetHeight || (window.innerHeight - 110);
      if (w > 0 && h > 0) {
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      handleUpdateSize();
    });

    resizeObserver.observe(mountRef.current);
    window.addEventListener('resize', handleUpdateSize);
    requestAnimationFrame(handleUpdateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleUpdateSize);
      domElement.removeEventListener('mousemove', handlePointerMove);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
    };
  }, [renderStyle]);

  // Rebuild Dynamic Structural Meshes with High-Performance InstancedMesh Batching
  useEffect(() => {
    const dynamicRoot = dynamicRootRef.current;
    if (!dynamicRoot) return;

    // Clear previous dynamic meshes cleanly
    while (dynamicRoot.children.length > 0) {
      const obj = dynamicRoot.children[0] as any;
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose());
        else obj.material.dispose();
      }
      dynamicRoot.remove(obj);
    }
    interactiveObjectsRef.current = [];

    // Shared Materials
    const roundEucalyptusMat = new THREE.MeshStandardMaterial({
      color: renderStyle === 'blueprint' ? 0x38bdf8 : renderStyle === 'clay' ? 0x8a6242 : 0x7a5332,
      roughness: 0.85,
      metalness: 0.05,
      wireframe: renderStyle === 'blueprint',
    });

    const woodenCleatMat = new THREE.MeshStandardMaterial({
      color: renderStyle === 'blueprint' ? 0x0284c7 : renderStyle === 'clay' ? 0x6b4423 : 0x5a391c,
      roughness: 0.85,
    });

    const railWoodMat = new THREE.MeshStandardMaterial({
      color: renderStyle === 'blueprint' ? 0x7dd3fc : renderStyle === 'clay' ? 0x9c744f : 0x8e633d,
      roughness: 0.8,
    });

    const garlicStrawMat = new THREE.MeshStandardMaterial({
      color: renderStyle === 'blueprint' ? 0xfde047 : 0xb89552,
      roughness: 0.92,
      wireframe: renderStyle === 'blueprint',
    });

    const garlicBulbMat = new THREE.MeshStandardMaterial({
      color: renderStyle === 'blueprint' ? 0xffffff : 0xf2ece1,
      roughness: 0.6,
      metalness: 0.02,
      wireframe: renderStyle === 'blueprint',
    });

    const roofTex = renderStyle === 'realistic' ? createRoofTileTexture() : null;
    const roofCoverMat = new THREE.MeshStandardMaterial({
      color: renderStyle === 'blueprint' ? 0x1e3a8a : renderStyle === 'clay' ? 0x9ca3af : 0x727d89,
      map: roofTex,
      roughness: 0.85,
      metalness: 0.05,
      wireframe: renderStyle === 'blueprint',
      side: THREE.DoubleSide,
      shadowSide: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    const ridgeCapMat = new THREE.MeshStandardMaterial({
      color: renderStyle === 'blueprint' ? 0x0284c7 : renderStyle === 'clay' ? 0x828a96 : 0x5a6572,
      roughness: 0.8,
      metalness: 0.08,
      wireframe: renderStyle === 'blueprint',
      side: THREE.DoubleSide,
      shadowSide: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });

    const gableTrimMat = new THREE.MeshStandardMaterial({
      color: renderStyle === 'blueprint' ? 0x0284c7 : renderStyle === 'clay' ? 0x785335 : 0x5a3e28,
      roughness: 0.85,
      metalness: 0.05,
      wireframe: renderStyle === 'blueprint',
    });

    const groundDirtMat = new THREE.MeshStandardMaterial({
      color: renderStyle === 'blueprint' ? 0x162c4a : renderStyle === 'clay' ? 0x6e5238 : 0x5a422d,
      roughness: 1.0,
    });

    const terrainMat = new THREE.MeshStandardMaterial({
      color: renderStyle === 'blueprint' ? 0x091e36 : renderStyle === 'clay' ? 0x523d29 : 0x445535,
      roughness: 1.0,
    });

    const steelBoltMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.85,
      roughness: 0.25,
    });

    const concreteBaseMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.9,
    });

    // Helper dummy transform
    const dummy = new THREE.Object3D();

    // --- A. Base Terrain & Yard ---
    const slabGroup = new THREE.Group();
    groupsRef.current.slab = slabGroup;

    const terrainGeo = new THREE.PlaneGeometry(380, 380);
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.rotation.x = -Math.PI / 2;
    terrainMesh.position.y = -0.22;
    terrainMesh.receiveShadow = true;
    slabGroup.add(terrainMesh);

    const floorGeo = new THREE.BoxGeometry(bW + 20, 0.4, bL + 28);
    const floorMesh = new THREE.Mesh(floorGeo, groundDirtMat);
    floorMesh.position.y = -0.2;
    floorMesh.receiveShadow = true;
    floorMesh.userData = {
      title: 'Pátio de Terra Batida Avermelhada & Saibro (Foto Real 28)',
      description: 'Solo rural natural compactado, garantindo escoamento pluvial e acesso operacional.',
      specs: `Dimensões: 38,00m × ${bL.toFixed(1)}m (Área Coberta: ~${(38 * bL).toFixed(0)} m²)`,
    };
    slabGroup.add(floorMesh);
    interactiveObjectsRef.current.push(floorMesh);
    dynamicRoot.add(slabGroup);

    // --- B. ROUND POSTS & CLEATS (HIGH-SPEED INSTANCED MESH BATCH) ---
    const roundPillarsGroup = new THREE.Group();
    groupsRef.current.roundPillars = roundPillarsGroup;

    const totalPosts = pillarColsX.length * pillarRowsZ.length;
    const totalCleats = totalPosts * tierElevations.length * 2;

    // 1. InstancedMesh for All Round Posts
    const postRadius = 0.17; // ~Ø35cm
    const postGeo = new THREE.CylinderGeometry(postRadius * 0.95, postRadius * 1.05, bH, 10);
    const postsInstanced = new THREE.InstancedMesh(postGeo, roundEucalyptusMat, totalPosts);
    postsInstanced.castShadow = true;
    postsInstanced.receiveShadow = true;

    // 2. InstancedMesh for Concrete Footings
    const footingGeo = new THREE.CylinderGeometry(0.28, 0.36, 0.35, 10);
    const footingsInstanced = new THREE.InstancedMesh(footingGeo, concreteBaseMat, totalPosts);
    footingsInstanced.receiveShadow = true;

    // 3. InstancedMesh for Cleats
    const cleatGeo = new THREE.BoxGeometry(0.1, 0.2, 0.38);
    const cleatsInstanced = new THREE.InstancedMesh(cleatGeo, woodenCleatMat, totalCleats);
    cleatsInstanced.castShadow = true;

    // 4. InstancedMesh for Steel Bolts
    const boltGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.14, 6);
    const boltsInstanced = new THREE.InstancedMesh(boltGeo, steelBoltMat, totalCleats);

    let postIdx = 0;
    let cleatIdx = 0;

    pillarColsX.forEach((px, colIdx) => {
      const isCenter = px === 0;
      const positionLabel = isCenter
        ? 'Pilar Central (Poste Oficial da Placa 03)'
        : px < 0
        ? `Pilar Esquerdo ${colIdx + 1} (${Math.abs(px)}m)`
        : `Pilar Direito ${colIdx - Math.floor(pillarColsX.length / 2)} (+${px}m)`;

      pillarRowsZ.forEach((pz, rowIdx) => {
        // Set Post Instance Matrix
        dummy.position.set(px, bH / 2, pz);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        postsInstanced.setMatrixAt(postIdx, dummy.matrix);

        // Set Footing Instance Matrix
        dummy.position.set(px, 0.17, pz);
        dummy.updateMatrix();
        footingsInstanced.setMatrixAt(postIdx, dummy.matrix);

        // Interactive proxy for front pillars
        if (rowIdx === pillarRowsZ.length - 1) {
          const proxyGeo = new THREE.BoxGeometry(0.5, bH, 0.5);
          const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
          const proxyMesh = new THREE.Mesh(proxyGeo, proxyMat);
          proxyMesh.position.set(px, bH / 2, pz);
          proxyMesh.userData = {
            title: `Poste Roliço Ø35cm • ${positionLabel}`,
            description: `Tora roliça de Eucalipto Citriodora tratado com CCA (Foto Real). Fachada frontal com ${pillarColsX.length} pilares mestres.`,
            specs: `Posição: X=${px.toFixed(1)}m, Z=${pz.toFixed(1)}m | Altura: 14,0m`,
            load: 'Carga nominal suportada: ~210 kN',
          };
          roundPillarsGroup.add(proxyMesh);
          interactiveObjectsRef.current.push(proxyMesh);
        }

        postIdx++;

        // Set Cleats & Bolts Instance Matrices
        tierElevations.forEach((th) => {
          [-0.2, 0.2].forEach((offsetX) => {
            dummy.position.set(px + offsetX, th, pz);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            cleatsInstanced.setMatrixAt(cleatIdx, dummy.matrix);

            dummy.position.set(px + offsetX, th + 0.04, pz);
            dummy.rotation.set(0, 0, Math.PI / 2);
            dummy.updateMatrix();
            boltsInstanced.setMatrixAt(cleatIdx, dummy.matrix);

            cleatIdx++;
          });
        });
      });

      // Top Longitudinal Beam
      const topBeamGeo = new THREE.CylinderGeometry(0.14, 0.14, bL, 8);
      const topBeam = new THREE.Mesh(topBeamGeo, roundEucalyptusMat);
      topBeam.rotation.x = Math.PI / 2;
      topBeam.position.set(px, bH, 0);
      topBeam.castShadow = true;
      roundPillarsGroup.add(topBeam);
    });

    postsInstanced.instanceMatrix.needsUpdate = true;
    footingsInstanced.instanceMatrix.needsUpdate = true;
    cleatsInstanced.instanceMatrix.needsUpdate = true;
    boltsInstanced.instanceMatrix.needsUpdate = true;

    roundPillarsGroup.add(postsInstanced);
    roundPillarsGroup.add(footingsInstanced);
    roundPillarsGroup.add(cleatsInstanced);
    roundPillarsGroup.add(boltsInstanced);
    dynamicRoot.add(roundPillarsGroup);

    // --- C. VIGAS E TÁBUAS HORIZONTAIS CONTÍNUAS NA FACHADA FRONTAL (Foto Real 28) ---
    const frontFacadeBeamsGroup = new THREE.Group();
    groupsRef.current.frontFacadeBeams = frontFacadeBeamsGroup;

    // Continuous horizontal planks across all front pillars at all elevation tiers
    const frontZ = bL / 2;
    const minFrontX = pillarColsX[0];
    const maxFrontX = pillarColsX[pillarColsX.length - 1];
    const frontSpan = maxFrontX - minFrontX + 0.6;

    tierElevations.forEach((h, tierIdx) => {
      const plankGeo = new THREE.BoxGeometry(frontSpan, 0.26, 0.08);
      const plankMesh = new THREE.Mesh(plankGeo, woodenCleatMat);
      plankMesh.position.set(0, h, frontZ + 0.18);
      plankMesh.castShadow = true;
      plankMesh.userData = {
        title: `Tábua de Travamento Horizontal da Fachada (Nível ${tierIdx + 1} - H=${h.toFixed(1)}m)`,
        description: `Viga de madeira contínua que une e trava todos os ${pillarColsX.length} pilares frontais horizontalmente (Foto Real 28).`,
        specs: `Comprimento: ${frontSpan.toFixed(1)}m | Seção: 8cm × 26cm | ${tierCount} Níveis`,
      };
      frontFacadeBeamsGroup.add(plankMesh);
      if (tierIdx === Math.floor(tierElevations.length / 2)) interactiveObjectsRef.current.push(plankMesh);
    });

    // --- PLACA TÉCNICA OFICIAL: ESTALEIRO DE ALHO 03 (IGARASHI) ---
    // Exact representation from the close-up photo (IMG20260828122618.jpg)
    const plaqueTexture = createPlaqueTexture();
    const plaqueMat = new THREE.MeshStandardMaterial({
      map: plaqueTexture,
      roughness: 0.4,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    // Plaque Backboard
    const plaqueBackGeo = new THREE.BoxGeometry(2.1, 1.55, 0.05);
    const plaqueBackMesh = new THREE.Mesh(plaqueBackGeo, woodenCleatMat);
    plaqueBackMesh.position.set(0, 7.5, frontZ + 0.27);
    plaqueBackMesh.castShadow = true;
    frontFacadeBeamsGroup.add(plaqueBackMesh);

    // Plaque Face Mesh
    const plaqueGeo = new THREE.PlaneGeometry(2.0, 1.45);
    const plaqueMesh = new THREE.Mesh(plaqueGeo, plaqueMat);
    plaqueMesh.position.set(0, 7.5, frontZ + 0.31);
    plaqueMesh.userData = {
      title: 'Placa Técnica Oficial: ESTALEIRO DE ALHO 03 (Igarashi)',
      description: 'Placa de identificação e capacidade de safra afixada no poste central de eucalipto.',
      specs: `Capacidade Máx: ${maxHectares.toLocaleString('pt-BR')} ha / ${maxCapacityKg.toLocaleString('pt-BR')} Kg | Atual: ${garlicFillPercent}%`,
      load: `${currentCapacityKg.toLocaleString('pt-BR')} Kg (${garlicFillPercent}% Ocupação)`,
    };
    frontFacadeBeamsGroup.add(plaqueMesh);
    interactiveObjectsRef.current.push(plaqueMesh);

    // Raffia Twine Binding Simulation (Cordas de ráfia amarrando a placa na viga de madeira)
    const twineGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.6, 6);
    const twineMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.9 });
    [-0.95, 0.95].forEach((tx) => {
      const twine = new THREE.Mesh(twineGeo, twineMat);
      twine.position.set(tx, 7.5, frontZ + 0.33);
      frontFacadeBeamsGroup.add(twine);
    });

    // Lower Bulletin Sheet (Ficha de Controle Fitossanitário)
    const bulletinTexture = createBulletinTexture();
    const bulletinMat = new THREE.MeshStandardMaterial({
      map: bulletinTexture,
      roughness: 0.7,
      side: THREE.DoubleSide,
    });
    const bulletinGeo = new THREE.PlaneGeometry(0.9, 1.2);
    const bulletinMesh = new THREE.Mesh(bulletinGeo, bulletinMat);
    bulletinMesh.position.set(0, 5.85, frontZ + 0.3);
    bulletinMesh.userData = {
      title: 'Ficha de Controle Fitossanitário de Campo (Lote 2026)',
      description: 'Registro de controle de umidade, temperatura e tempo de cura natural do alho.',
      specs: 'Safra: Alho Roxo Nacional | Entrada: 12/08/2026 | Secagem da Rama',
    };
    frontFacadeBeamsGroup.add(bulletinMesh);
    interactiveObjectsRef.current.push(bulletinMesh);

    // --- EXTINTORES DE INCÊNDIO NOS PILARES EXTERNOS (Segurança Agrícola) ---
    const extMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, metalness: 0.2 });
    const extHoseMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const extSignMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });

    [minFrontX, maxFrontX].forEach((extX, eIdx) => {
      const extGroup = new THREE.Group();
      extGroup.position.set(extX, 2.5, frontZ + 0.32);

      // Red Cylinder
      const extCylGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.65, 10);
      const extCyl = new THREE.Mesh(extCylGeo, extMat);
      extGroup.add(extCyl);

      // Top Dome & Valve
      const domeGeo = new THREE.SphereGeometry(0.11, 10, 8);
      const dome = new THREE.Mesh(domeGeo, extMat);
      dome.position.y = 0.32;
      extGroup.add(dome);

      // Black Hose
      const hoseGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6);
      const hose = new THREE.Mesh(hoseGeo, extHoseMat);
      hose.position.set(0.1, 0.05, 0.08);
      extGroup.add(hose);

      // Safety Sign
      const signGeo = new THREE.BoxGeometry(0.35, 0.35, 0.02);
      const signMesh = new THREE.Mesh(signGeo, extSignMat);
      signMesh.position.set(0, 0.65, 0.02);
      extGroup.add(signMesh);

      extGroup.userData = {
        title: `Extintor de Incêndio Pó Químico ABC (${eIdx === 0 ? 'Poste Esquerdo' : 'Poste Direito'})`,
        description: 'Equipamento de segurança obrigatório montado nos pilares perimetrais do estaleiro.',
        specs: 'Capacidade: 12 kg Pó Químico ABC | Normas de Segurança Rural',
      };
      frontFacadeBeamsGroup.add(extGroup);
      interactiveObjectsRef.current.push(extCyl);
    });

    dynamicRoot.add(frontFacadeBeamsGroup);

    // --- D. CONTRAVENTAMENTO EM "X" EM TODOS OS VÃOS ---
    const xBracingsGroup = new THREE.Group();
    groupsRef.current.xBracings = xBracingsGroup;

    [-frontZ, frontZ].forEach((gz) => {
      for (let c = 0; c < pillarColsX.length - 1; c++) {
        const x1 = pillarColsX[c];
        const x2 = pillarColsX[c + 1];
        const dx = x2 - x1;
        const braceLen = Math.sqrt(dx * dx + (bH - 2) * (bH - 2));
        const braceAngle = Math.atan2(bH - 2, dx);

        const braceGeo = new THREE.CylinderGeometry(0.08, 0.08, braceLen, 8);
        const brace1 = new THREE.Mesh(braceGeo, roundEucalyptusMat);
        brace1.position.set((x1 + x2) / 2, (bH + 2) / 2, gz);
        brace1.rotation.z = -braceAngle + Math.PI / 2;
        brace1.castShadow = true;
        xBracingsGroup.add(brace1);

        const brace2 = new THREE.Mesh(braceGeo, roundEucalyptusMat);
        brace2.position.set((x1 + x2) / 2, (bH + 2) / 2, gz);
        brace2.rotation.z = braceAngle - Math.PI / 2;
        brace2.castShadow = true;
        xBracingsGroup.add(brace2);

        // Barra Horizontal Intermediária de Amarração
        const tieGeo = new THREE.CylinderGeometry(0.09, 0.09, dx, 8);
        const tie = new THREE.Mesh(tieGeo, roundEucalyptusMat);
        tie.rotation.z = Math.PI / 2;
        tie.position.set((x1 + x2) / 2, 7.0, gz);
        xBracingsGroup.add(tie);
      }
    });

    dynamicRoot.add(xBracingsGroup);

    // --- E. VARAIS E LONGARINAS HORIZONTAIS DE CADA GALERIA ---
    const galleryRailsGroup = new THREE.Group();
    groupsRef.current.galleryRails = galleryRailsGroup;

    for (let c = 0; c < pillarColsX.length - 1; c++) {
      const x1 = pillarColsX[c];
      const x2 = pillarColsX[c + 1];
      const galleryCenterX = (x1 + x2) / 2;
      const galleryWidth = x2 - x1;

      const numRailsInGallery = Math.max(2, Math.min(6, Math.round(galleryWidth / 1.5)));

      tierElevations.forEach((h, tierIdx) => {
        for (let ri = 0; ri < numRailsInGallery; ri++) {
          const railOffset =
            numRailsInGallery > 1
              ? (ri - (numRailsInGallery - 1) / 2) * (galleryWidth / (numRailsInGallery + 0.3))
              : 0;
          const rx = galleryCenterX + railOffset;

          const railGeo = new THREE.CylinderGeometry(0.042, 0.042, bL - 0.6, 6);
          const rail = new THREE.Mesh(railGeo, railWoodMat);
          rail.rotation.x = Math.PI / 2;
          rail.position.set(rx, h + 0.1, 0);
          rail.castShadow = true;
          rail.userData = {
            title: `Vara Roliça de Apoio (Galeria ${c + 1} - Nível ${tierIdx + 1} H=${h.toFixed(1)}m)`,
            description:
              'Varal horizontal de madeira roliça de eucalipto onde os feixes de alho são pendurados pela rama (Foto 29).',
            specs: `Eucalipto Ø8-10cm | Comprimento: ${bL.toFixed(1)}m | Vão: ${galleryWidth.toFixed(1)}m`,
          };
          galleryRailsGroup.add(rail);
        }

        // Crossbars
        pillarRowsZ.forEach((pz) => {
          const crossBarGeo = new THREE.CylinderGeometry(0.045, 0.045, galleryWidth, 6);
          const crossBar = new THREE.Mesh(crossBarGeo, woodenCleatMat);
          crossBar.rotation.z = Math.PI / 2;
          crossBar.position.set(galleryCenterX, h, pz);
          galleryRailsGroup.add(crossBar);
        });
      });
    }

    dynamicRoot.add(galleryRailsGroup);

    // --- F. CARGA REALISTA DE ALHO EM RAMA (INDIVIDUAL POR GALERIA, VÃO, NÍVEL E VEIO) ---
    const garlicTiersGroup = new THREE.Group();
    groupsRef.current.garlicTiers = garlicTiersGroup;

    // Cache de materiais por cor de variedade de alho
    const varietyMatCache = new Map<string, { strawMat: THREE.MeshStandardMaterial; bulbMat: THREE.MeshStandardMaterial }>();

    const getVarietyMats = (colorHex: string) => {
      if (varietyMatCache.has(colorHex)) return varietyMatCache.get(colorHex)!;

      const strawMat = new THREE.MeshStandardMaterial({
        color: renderStyle === 'blueprint' ? 0xfde047 : 0xbfa058,
        roughness: 0.88,
        wireframe: renderStyle === 'blueprint',
      });

      // Bulbo com o matiz real da variedade
      const bulbColor = new THREE.Color(colorHex);
      const blendedBulb = new THREE.Color(0xf5efe6).lerp(bulbColor, 0.28);

      const bulbMat = new THREE.MeshStandardMaterial({
        color: renderStyle === 'blueprint' ? 0xffffff : blendedBulb.getHex(),
        roughness: 0.65,
        metalness: 0.02,
        wireframe: renderStyle === 'blueprint',
      });

      const mats = { strawMat, bulbMat };
      varietyMatCache.set(colorHex, mats);
      return mats;
    };

    const hasAllocations = Object.keys(cellAllocations).length > 0;
    const numFilledTiers = Math.round((garlicFillPercent / 100) * tierElevations.length);

    for (let c = 0; c < pillarColsX.length - 1; c++) {
      const x1 = pillarColsX[c];
      const x2 = pillarColsX[c + 1];
      const galleryCenterX = (x1 + x2) / 2;
      const galleryWidth = x2 - x1;

      for (let b = 0; b < lengthBays; b++) {
        const z1 = pillarRowsZ[b];
        const z2 = pillarRowsZ[b + 1];
        const bayCenterZ = (z1 + z2) / 2;
        const bayLen = Math.abs(z2 - z1) - 0.35; // 4.15m

        for (let tierIdx = 0; tierIdx < tierCount; tierIdx++) {
          const cellKey = `g${c}_b${b}_t${tierIdx}`;
          const alloc = cellAllocations[cellKey];

          // Se tiver alocações cadastradas da balança, respeita rigorosamente as células preenchidas
          // Se não tiver nenhuma alocação, usa o fallback de preenchimento percentual global
          const isFilled = alloc !== undefined || (!hasAllocations && tierIdx < numFilledTiers);
          if (!isFilled) continue;

          const load = alloc ? truckLoads.find((l) => l.id === alloc.loadId) : null;
          const varietyColor = load ? load.varietyColor : '#a855f7';
          const { strawMat, bulbMat } = getVarietyMats(varietyColor);

          const h = tierElevations[tierIdx];

          // Straw Mesh (Folhagem seca de alho suspensa nos varais roliços)
          const strawGeo = new THREE.BoxGeometry(galleryWidth * 0.88, 1.25, bayLen);
          const straw = new THREE.Mesh(strawGeo, strawMat);
          straw.position.set(galleryCenterX, h - 0.65, bayCenterZ);
          straw.castShadow = true;
          straw.receiveShadow = true;
          garlicTiersGroup.add(straw);

          // Bulbs & Roots (Bulbos amarrados e raízes no fundo da camada)
          const bulbGeo = new THREE.BoxGeometry(galleryWidth * 0.82, 0.45, bayLen);
          const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
          bulbMesh.position.set(galleryCenterX, h - 1.35, bayCenterZ);
          bulbMesh.castShadow = true;

          const isFront = b < lengthBays / 2;
          const isLeft = c < Math.floor(galleryCount / 2);

          if (load && alloc) {
            bulbMesh.userData = {
              title: `Alho em Rama • ${load.variety}`,
              description: `Fazenda: ${load.farm} • Gleba: ${load.tract} • Pivô: ${load.pivot}`,
              specs: `Romaneio: ${load.romaneioNumber} | Carga: ${load.totalWeightKg.toLocaleString('pt-BR')} kg (${load.bagsCount} bags) | No Vão: ${alloc.allocatedKg.toLocaleString('pt-BR')} kg (${alloc.allocatedBags} bags) | Cura: ${load.daysCuring} dias`,
              load: `Galeria ${c + 1} • Vão ${b + 1} (${isFront ? 'Veio Frente' : 'Veio Fundo'} / ${isLeft ? 'Veio Esq.' : 'Veio Dir.'}) • Nível ${tierIdx + 1}`,
            };
          } else {
            bulbMesh.userData = {
              title: `Carga de Alho em Rama • Galeria ${c + 1} (Nível ${tierIdx + 1})`,
              description: `Feixes de alho amarrados pela palha seca em plena cura natural (${currentCapacityKg.toLocaleString('pt-BR')} kg).`,
              specs: `Vão ${b + 1} (${(b * 4.5).toFixed(0)}m-${((b + 1) * 4.5).toFixed(0)}m) | Nível ${tierIdx + 1} (${h.toFixed(1)}m de altura)`,
              load: `${isFront ? 'Veio Frontal' : 'Veio Fundos'} • ${isLeft ? 'Veio Esquerdo' : 'Veio Direito'}`,
            };
          }

          garlicTiersGroup.add(bulbMesh);
          interactiveObjectsRef.current.push(bulbMesh);
        }
      }
    }
    garlicTiersGroup.visible = layers.garlicTiers && (hasAllocations || garlicFillPercent > 0);
    dynamicRoot.add(garlicTiersGroup);

    // --- G. TESOURAS DE COBERTURA ROLIÇAS (17 EIXOS A CADA 4,5M) ---
    const trussesGroup = new THREE.Group();
    groupsRef.current.trusses = trussesGroup;
    trussesGroup.userData = { baseElevation: bH };

    const overhangW = bW + 5.0; // 43m total de cobertura com beirais de 2,5m
    const halfOverhang = overhangW / 2; // 21.5m
    const deltaH = ridgeH - bH; // 3.5m
    const rafterAngle = Math.atan2(deltaH, halfOverhang); // inclinação do telhado
    const rafterSlopeLen = Math.sqrt(Math.pow(halfOverhang, 2) + Math.pow(deltaH, 2)); // 21.78m
    const cosA = Math.cos(rafterAngle);
    const sinA = Math.sin(rafterAngle);

    // Normal and tangent offsets
    const rafterDepth = 0.20; // 20cm viga da tesoura
    const purlinRadius = 0.055; // Ø11cm terças roliças
    const roofThickness = 0.08; // 8cm telhas fibrocimento 3D

    pillarRowsZ.forEach((pz) => {
      // Left Rafter (Viga Inclinada Esquerda da Tesoura)
      const leftRafterGeo = new THREE.BoxGeometry(rafterSlopeLen, rafterDepth, 0.18);
      const leftRafter = new THREE.Mesh(leftRafterGeo, roundEucalyptusMat);
      // Rafter center offset slightly downwards along normal so its top is the datum
      const rafNormOffset = -rafterDepth / 2;
      leftRafter.position.set(
        -halfOverhang / 2 + rafNormOffset * sinA,
        (bH + ridgeH) / 2 + rafNormOffset * cosA,
        pz
      );
      leftRafter.rotation.z = rafterAngle;
      leftRafter.castShadow = true;
      trussesGroup.add(leftRafter);

      // Right Rafter (Viga Inclinada Direita da Tesoura)
      const rightRafter = new THREE.Mesh(leftRafterGeo, roundEucalyptusMat);
      rightRafter.position.set(
        halfOverhang / 2 - rafNormOffset * sinA,
        (bH + ridgeH) / 2 + rafNormOffset * cosA,
        pz
      );
      rightRafter.rotation.z = -rafterAngle;
      rightRafter.castShadow = true;
      trussesGroup.add(rightRafter);

      // Bottom Tie (Linha / Tirante Inferior da Tesoura)
      const tieTrussGeo = new THREE.CylinderGeometry(0.1, 0.1, bW, 8);
      const tieTruss = new THREE.Mesh(tieTrussGeo, roundEucalyptusMat);
      tieTruss.rotation.z = Math.PI / 2;
      tieTruss.position.set(0, bH, pz);
      trussesGroup.add(tieTruss);

      // King Post (Pontalete Central na Cumeeira)
      const kingGeo = new THREE.CylinderGeometry(0.12, 0.12, deltaH + 0.1, 8);
      const king = new THREE.Mesh(kingGeo, woodenCleatMat);
      king.position.set(0, bH + deltaH / 2, pz);
      trussesGroup.add(king);

      // Truss Diagonals (Escoras / Diagonais)
      [-8.5, 8.5].forEach((dx) => {
        const diagGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.6, 6);
        const diag = new THREE.Mesh(diagGeo, woodenCleatMat);
        diag.position.set(dx / 2, bH + 1.4, pz);
        diag.rotation.z = (dx > 0 ? 1 : -1) * 0.55;
        trussesGroup.add(diag);
      });
    });

    // Purlins (Terças de Madeira Roliça Ø11cm assentadas estritamente SOBRE as tesouras e ABAIXO das telhas)
    const purlinNormOffset = purlinRadius; // apoiadas sobre as tesouras
    const purlinLength = bL + 3.0; // 75.0m
    const purlinFractions = [0.08, 0.22, 0.36, 0.50, 0.64, 0.78, 0.92]; // 7 terças intermediárias por água

    purlinFractions.forEach((frac) => {
      // Left slope purlin
      const lx = -halfOverhang + frac * halfOverhang;
      const ly = bH + frac * deltaH;
      const purlinGeo = new THREE.CylinderGeometry(purlinRadius, purlinRadius, purlinLength, 8);
      const leftPurlin = new THREE.Mesh(purlinGeo, woodenCleatMat);
      leftPurlin.rotation.x = Math.PI / 2;
      leftPurlin.position.set(
        lx - purlinNormOffset * sinA,
        ly + purlinNormOffset * cosA,
        0
      );
      leftPurlin.castShadow = true;
      trussesGroup.add(leftPurlin);

      // Right slope purlin
      const rx = halfOverhang - frac * halfOverhang;
      const ry = bH + frac * deltaH;
      const rightPurlin = new THREE.Mesh(purlinGeo, woodenCleatMat);
      rightPurlin.rotation.x = Math.PI / 2;
      rightPurlin.position.set(
        rx + purlinNormOffset * sinA,
        ry + purlinNormOffset * cosA,
        0
      );
      rightPurlin.castShadow = true;
      trussesGroup.add(rightPurlin);
    });

    dynamicRoot.add(trussesGroup);

    // --- H. COBERTURA EM DUAS ÁGUAS COM FIBROCIMENTO ONDULADO (Foto Real 27) ---
    const roofCoverGroup = new THREE.Group();
    groupsRef.current.roofCover = roofCoverGroup;
    roofCoverGroup.userData = { baseElevation: bH };

    const roofLength = bL + 3.6; // 75.6m com beiral frontal e traseiro de 1,8m
    // Centro da telha posicionado no topo das terças + metade da espessura da telha + 1cm folga
    const roofNormOffset = 2 * purlinRadius + roofThickness / 2 + 0.015; // ~0.165m acima da face superior da tesoura

    // 1. Left Roof Slope (Água Esquerda: de X = -21.5m a X = 0)
    const leftRoofGeo = new THREE.BoxGeometry(rafterSlopeLen + 0.2, roofThickness, roofLength);
    const leftRoof = new THREE.Mesh(leftRoofGeo, roofCoverMat);
    leftRoof.position.set(
      -halfOverhang / 2 - roofNormOffset * sinA,
      (bH + ridgeH) / 2 + roofNormOffset * cosA,
      0
    );
    leftRoof.rotation.z = rafterAngle;
    leftRoof.castShadow = true;
    leftRoof.receiveShadow = true;
    leftRoof.frustumCulled = false;
    leftRoof.userData = {
      title: 'Telhado em Duas Águas • Água Esquerda (Fibrocimento Ondulado)',
      description: 'Cobertura em telhas de fibrocimento onduladas com beiral de 2,50m para proteção contra chuvas de vento oblíquas.',
      specs: `Inclinação: 16,3% (${(rafterAngle * 180 / Math.PI).toFixed(1)}°) | Comprimento: ${roofLength.toFixed(1)}m | Área: ${(rafterSlopeLen * roofLength).toFixed(0)} m²`,
    };
    roofCoverGroup.add(leftRoof);
    interactiveObjectsRef.current.push(leftRoof);

    // 2. Right Roof Slope (Água Direita: de X = 0 a X = +21.5m)
    const rightRoof = new THREE.Mesh(leftRoofGeo, roofCoverMat);
    rightRoof.position.set(
      halfOverhang / 2 + roofNormOffset * sinA,
      (bH + ridgeH) / 2 + roofNormOffset * cosA,
      0
    );
    rightRoof.rotation.z = -rafterAngle;
    rightRoof.castShadow = true;
    rightRoof.receiveShadow = true;
    rightRoof.frustumCulled = false;
    rightRoof.userData = {
      title: 'Telhado em Duas Águas • Água Direita (Fibrocimento Ondulado)',
      description: 'Telhas de alta resistência fixadas por parafusos com arruela de vedação sobre terças de eucalipto.',
      specs: `Inclinação: 16,3% (${(rafterAngle * 180 / Math.PI).toFixed(1)}°) | Comprimento: ${roofLength.toFixed(1)}m | Área: ${(rafterSlopeLen * roofLength).toFixed(0)} m²`,
    };
    roofCoverGroup.add(rightRoof);
    interactiveObjectsRef.current.push(rightRoof);

    // 3. Cumeeira de Fibrocimento com Abas Articuladas no Vértice (Ridge Cap)
    const ridgeApexY = ridgeH + roofNormOffset * cosA + roofThickness / 2 + 0.03;
    const ridgeCapGroup = new THREE.Group();
    const flapW = 0.65; // 65cm de aba para cada água
    const flapGeo = new THREE.BoxGeometry(flapW, 0.03, roofLength + 0.1);

    // Aba esquerda da cumeeira
    const leftFlap = new THREE.Mesh(flapGeo, ridgeCapMat);
    leftFlap.rotation.z = rafterAngle;
    leftFlap.position.set(
      -(flapW / 2) * Math.cos(rafterAngle),
      ridgeApexY - (flapW / 2) * Math.sin(rafterAngle),
      0
    );
    leftFlap.castShadow = true;
    leftFlap.receiveShadow = true;
    leftFlap.frustumCulled = false;
    ridgeCapGroup.add(leftFlap);

    // Aba direita da cumeeira
    const rightFlap = new THREE.Mesh(flapGeo, ridgeCapMat);
    rightFlap.rotation.z = -rafterAngle;
    rightFlap.position.set(
      (flapW / 2) * Math.cos(rafterAngle),
      ridgeApexY - (flapW / 2) * Math.sin(rafterAngle),
      0
    );
    rightFlap.castShadow = true;
    rightFlap.receiveShadow = true;
    rightFlap.frustumCulled = false;
    ridgeCapGroup.add(rightFlap);

    // Vértice central cilíndrico de concordância
    const crestCylGeo = new THREE.CylinderGeometry(0.065, 0.065, roofLength + 0.1, 12);
    const crestCyl = new THREE.Mesh(crestCylGeo, ridgeCapMat);
    crestCyl.rotation.x = Math.PI / 2;
    crestCyl.position.set(0, ridgeApexY + 0.015, 0);
    crestCyl.castShadow = true;
    crestCyl.frustumCulled = false;
    ridgeCapGroup.add(crestCyl);

    ridgeCapGroup.frustumCulled = false;
    ridgeCapGroup.userData = {
      title: `Cumeeira Articulada de Fibrocimento (${roofLength.toFixed(1)}m)`,
      description: 'Elemento de vedação e arremate hermético no cume do telhado em duas águas.',
      specs: 'Largura total desdobrada: 130cm | Espessura: 6mm fibrocimento',
    };
    roofCoverGroup.add(ridgeCapGroup);

    // 4. Testeiras de Acabamento Frontal e Traseira nos Oitões (Gable Trims)
    [-roofLength / 2, roofLength / 2].forEach((gz) => {
      // Left gable fascia
      const fasciaGeo = new THREE.BoxGeometry(rafterSlopeLen + 0.22, 0.32, 0.07);
      const leftFascia = new THREE.Mesh(fasciaGeo, gableTrimMat);
      leftFascia.position.set(
        -halfOverhang / 2 - roofNormOffset * sinA,
        (bH + ridgeH) / 2 + roofNormOffset * cosA - 0.05,
        gz
      );
      leftFascia.rotation.z = rafterAngle;
      leftFascia.castShadow = true;
      leftFascia.frustumCulled = false;
      roofCoverGroup.add(leftFascia);

      // Right gable fascia
      const rightFascia = new THREE.Mesh(fasciaGeo, gableTrimMat);
      rightFascia.position.set(
        halfOverhang / 2 + roofNormOffset * sinA,
        (bH + ridgeH) / 2 + roofNormOffset * cosA - 0.05,
        gz
      );
      rightFascia.rotation.z = -rafterAngle;
      rightFascia.castShadow = true;
      rightFascia.frustumCulled = false;
      roofCoverGroup.add(rightFascia);
    });

    roofCoverGroup.frustumCulled = false;
    dynamicRoot.add(roofCoverGroup);
  }, [galleryCount, pillarColsX, pillarRowsZ, bL, tierCount, tierElevations, garlicFillPercent, currentCapacityKg, maxCapacityKg, maxHectares, renderStyle, cellAllocations, truckLoads]);

  // Ultra-fast layer visibility & explosion updates without destroying 3D buffers
  useEffect(() => {
    if (groupsRef.current.slab) groupsRef.current.slab.visible = layers.slab;
    if (groupsRef.current.roundPillars) groupsRef.current.roundPillars.visible = layers.roundPillars;
    if (groupsRef.current.frontFacadeBeams) groupsRef.current.frontFacadeBeams.visible = layers.frontFacadeBeams;
    if (groupsRef.current.xBracings) groupsRef.current.xBracings.visible = layers.xBracings;
    if (groupsRef.current.galleryRails) groupsRef.current.galleryRails.visible = layers.galleryRails;
    if (groupsRef.current.garlicTiers) groupsRef.current.garlicTiers.visible = layers.garlicTiers && garlicFillPercent > 0;
    if (groupsRef.current.trusses) groupsRef.current.trusses.visible = layers.trusses;
    if (groupsRef.current.roofCover) groupsRef.current.roofCover.visible = layers.roofCover;

    const factor = exploded / 100;
    if (groupsRef.current.galleryRails) groupsRef.current.galleryRails.position.y = factor * 14;
    if (groupsRef.current.garlicTiers) groupsRef.current.garlicTiers.position.y = factor * 14;
    if (groupsRef.current.trusses) groupsRef.current.trusses.position.y = factor * 22;
    if (groupsRef.current.roofCover) groupsRef.current.roofCover.position.y = factor * 22;
  }, [layers, garlicFillPercent, exploded]);

  // Camera preset handler
  const handleSelectPhotoMode = useCallback(
    (mode: PhotoMode) => {
      setActivePhotoMode(mode);
      if (!cameraRef.current || !controlsRef.current) return;

      const preset = photoPresets[mode];
      cameraRef.current.position.set(preset.cameraPos[0], preset.cameraPos[1], preset.cameraPos[2]);
      controlsRef.current.target.set(preset.targetPos[0], preset.targetPos[1], preset.targetPos[2]);
    },
    [photoPresets]
  );

  // Camera fly-to for a specific cell in 3D
  const handleSelectCellIn3D = useCallback(
    (galleryIdx: number, bayIdx: number, tierIdx: number) => {
      if (!cameraRef.current || !controlsRef.current) return;
      const x1 = pillarColsX[galleryIdx] ?? 0;
      const x2 = pillarColsX[galleryIdx + 1] ?? x1 + 6;
      const targetX = (x1 + x2) / 2;
      const z1 = pillarRowsZ[bayIdx] ?? 0;
      const z2 = pillarRowsZ[bayIdx + 1] ?? z1 + 4.5;
      const targetZ = (z1 + z2) / 2;
      const targetY = tierElevations[tierIdx] ?? 6;

      cameraRef.current.position.set(targetX + 6, targetY + 3.5, targetZ + 11);
      controlsRef.current.target.set(targetX, targetY, targetZ);
      setShowHarvestModal(false);
    },
    [pillarColsX, pillarRowsZ, tierElevations]
  );

  // Quick preset options for galleries
  const galleryPresets = [
    { count: 4, label: '4 Galerias (5 Pilares)', desc: '2 Esq + 1 Centro + 2 Dir (Vão: 9,0m)' },
    { count: 6, label: '6 Galerias (7 Pilares)', desc: '3 Esq + 1 Centro + 3 Dir (Vão: 6,0m) • Padrão Real (Foto 28)' },
    { count: 8, label: '8 Galerias (9 Pilares)', desc: '4 Esq + 1 Centro + 4 Dir (Vão: 4,5m)' },
    { count: 10, label: '10 Galerias (11 Pilares)', desc: '5 Esq + 1 Centro + 5 Dir (Vão: 3,6m)' },
    { count: 12, label: '12 Galerias (13 Pilares)', desc: '6 Esq + 1 Centro + 6 Dir (Vão: 3,0m)' },
  ];

  // Quick preset options for Length / Bays
  const lengthPresets = [
    { bays: 10, label: '45 metros (11 Eixos)', desc: '10 Vãos de 4,5m • Estrutura Compacta' },
    { bays: 12, label: '54 metros (13 Eixos)', desc: '12 Vãos de 4,5m • Médio Porte' },
    { bays: 16, label: '72 metros (17 Eixos)', desc: '16 Vãos de 4,5m • Padrão Real (Foto 27/28)' },
    { bays: 20, label: '90 metros (21 Eixos)', desc: '20 Vãos de 4,5m • Grande Porte' },
    { bays: 24, label: '108 metros (25 Eixos)', desc: '24 Vãos de 4,5m • Mega Estaleiro' },
  ];

  // Quick presets for Tiers / Levels
  const tierPresets = [
    { count: 5, label: '5 Níveis Verticais', desc: 'Espaçamento amplo entre varais (~2,9m)' },
    { count: 6, label: '6 Níveis Verticais', desc: 'Espaçamento intermediário (~2,3m)' },
    { count: 7, label: '7 Níveis Verticais', desc: 'Padrão Real (Foto 28/29) • Calços a cada ~1,9m' },
    { count: 8, label: '8 Níveis Verticais', desc: 'Alta densidade de pendura (~1,65m)' },
  ];

  // Quick presets for Garlic Load Percentage
  const garlicPresets = [
    { percent: 0, label: '0% (Vazio)', desc: 'Estrutura de madeira limpa sem carga de alho' },
    { percent: 25, label: '25% (Início)', desc: 'Primeiras camadas inferiores carregadas' },
    { percent: 50, label: '50% (Metade)', desc: 'Metade inferior dos varais preenchida' },
    { percent: 75, label: '75% (Três Quartos)', desc: 'Quase cheio, cura em andamento' },
    { percent: 100, label: '100% (Cheio)', desc: 'Capacidade Plena • Padrão Real da Foto (527.904 kg)' },
  ];

  return (
    <div
      className={`flex flex-col h-full w-full bg-[#0E0E0E] text-[#E5E7EB] overflow-hidden select-none relative ${
        isImmersive ? 'fixed inset-0 z-50' : ''
      }`}
    >
      {/* Top Header Navigation Bar */}
      <div className="bg-[#141414] border-b border-[#2D2D2D] z-10 shrink-0 shadow-lg">
        <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5 overflow-x-auto">
          {/* Title & Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#D4A373]/20 border border-[#D4A373] flex items-center justify-center text-[#D4A373] shrink-0 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-serif font-bold text-[#D4A373] flex items-center gap-1.5 leading-tight whitespace-nowrap">
                ESTALEIRO DE ALHO 03
                <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-[#26201a] text-[#EAB308] font-mono border border-[#EAB308]/40 font-semibold">
                  {pillarColsX.length} × {pillarRowsZ.length} Pilares • {bL}m
                </span>
              </h1>
            </div>
          </div>

          {/* Stepper 1: Quantidade de Galerias (Largura) */}
          <div className="flex items-center gap-1 bg-[#1A1A1A] p-1 rounded-lg border border-[#382F24] shrink-0">
            <div className="flex items-center gap-1 text-xs font-mono text-[#D4A373] px-1 font-semibold">
              <Grid className="w-3.5 h-3.5 text-[#EAB308]" />
              <span className="hidden sm:inline">Galerias:</span>
            </div>
            <div className="flex items-center gap-1 bg-[#121212] rounded px-1 py-0.5 border border-[#2D2D2D]">
              <button
                onClick={() => setGalleryCount((prev) => Math.max(2, prev - (prev % 2 === 0 ? 2 : 1)))}
                disabled={galleryCount <= 2}
                className="p-1 hover:bg-[#262626] disabled:opacity-30 text-[#E5E7EB] rounded transition-colors"
                title="Diminuir galerias"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                onClick={() => setShowQuantitiesModal(true)}
                className="px-1.5 py-0.5 text-xs font-bold text-[#FBBF24] hover:bg-[#262626] rounded transition-colors flex items-center gap-1"
                title="Abrir painel de quantidades"
              >
                <span>{galleryCount}</span>
                <span className="text-[10px] text-[#9CA3AF] font-normal">({pillarColsX.length} pil.)</span>
              </button>
              <button
                onClick={() => setGalleryCount((prev) => Math.min(14, prev + (prev % 2 === 0 ? 2 : 1)))}
                disabled={galleryCount >= 14}
                className="p-1 hover:bg-[#262626] disabled:opacity-30 text-[#E5E7EB] rounded transition-colors"
                title="Aumentar galerias"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Stepper 2: Quantidade de Eixos / Comprimento */}
          <div className="flex items-center gap-1 bg-[#1A1A1A] p-1 rounded-lg border border-[#382F24] shrink-0">
            <div className="flex items-center gap-1 text-xs font-mono text-[#D4A373] px-1 font-semibold">
              <Ruler className="w-3.5 h-3.5 text-[#EAB308]" />
              <span className="hidden sm:inline">Comprimento:</span>
            </div>
            <div className="flex items-center gap-1 bg-[#121212] rounded px-1 py-0.5 border border-[#2D2D2D]">
              <button
                onClick={() => setLengthBays((prev) => Math.max(6, prev - 2))}
                disabled={lengthBays <= 6}
                className="p-1 hover:bg-[#262626] disabled:opacity-30 text-[#E5E7EB] rounded transition-colors"
                title="Diminuir comprimento"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                onClick={() => setShowQuantitiesModal(true)}
                className="px-1.5 py-0.5 text-xs font-bold text-[#FBBF24] hover:bg-[#262626] rounded transition-colors flex items-center gap-1"
                title="Abrir painel de quantidades"
              >
                <span>{bL}m</span>
                <span className="text-[10px] text-[#9CA3AF] font-normal">({pillarRowsZ.length} eixos)</span>
              </button>
              <button
                onClick={() => setLengthBays((prev) => Math.min(28, prev + 2))}
                disabled={lengthBays >= 28}
                className="p-1 hover:bg-[#262626] disabled:opacity-30 text-[#E5E7EB] rounded transition-colors"
                title="Aumentar comprimento"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Quick Toggle: Garlic Load % */}
          <div className="flex items-center gap-1 bg-[#1A1A1A] p-1 rounded-lg border border-[#382F24] shrink-0">
            <button
              onClick={() => {
                const newPercent = garlicFillPercent === 100 ? 0 : garlicFillPercent === 0 ? 100 : 0;
                setGarlicFillPercent(newPercent);
                setLayers({ ...layers, garlicTiers: newPercent > 0 });
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                garlicFillPercent > 0
                  ? 'bg-[#EAB308] text-[#0A0A0A] shadow-md'
                  : 'bg-[#262626] text-[#9CA3AF] hover:text-white'
              }`}
              title="Alternar entre Carga de Alho e Estrutura Vazia"
            >
              <span>
                {garlicFillPercent > 0
                  ? `🌾 ${garlicFillPercent}% (${(currentCapacityKg / 1000).toFixed(1)} t)`
                  : '🪵 Estrutura Vazia'}
              </span>
            </button>
          </div>

          {/* Main "Balança & Romaneios" Button */}
          <button
            onClick={() => setShowHarvestModal(true)}
            className={`px-3 py-1.5 rounded text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 ${
              showHarvestModal
                ? 'bg-amber-400 text-neutral-950 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
            }`}
            title="Registrar pesagem de caminhões na balança e carregar por galerias, vãos, níveis e veios"
          >
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>Balança & Cargas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-amber-200 font-mono font-bold">
              {truckLoads.length} camilhões • {(totalAllocatedKg / 1000).toFixed(0)}t
            </span>
          </button>

          {/* Main "Imprimir Mapa do Estaleiro" Button */}
          <button
            onClick={() => setShowPrintMapModal(true)}
            className="px-3 py-1.5 rounded text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 bg-[#172554] border-sky-500/40 text-sky-300 hover:bg-sky-500/20 shadow-md"
            title="Abrir mapa técnico do estaleiro para impressão com quilos e variedades por vagão e resumo geral"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span>Imprimir Mapa</span>
          </button>

          {/* Main "Escolher Quantidade" Button */}
          <button
            onClick={() => setShowQuantitiesModal(!showQuantitiesModal)}
            className={`px-2.5 py-1.5 rounded text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 ${
              showQuantitiesModal
                ? 'bg-[#D4A373] text-[#0A0A0A] border-[#D4A373] shadow-md'
                : 'bg-[#1A1A1A] border-[#382F24] text-[#FBBF24] hover:bg-[#26201a]'
            }`}
            title="Abrir painel para escolher todas as quantidades do estaleiro"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Escolher Quantidades</span>
          </button>

          {/* Quick Photo Buttons: Direct View Alignment */}
          <div className="flex items-center gap-1 bg-[#1A1A1A] p-0.5 sm:p-1 rounded-lg border border-[#2D2D2D] text-xs font-mono shrink-0 overflow-x-auto">
            <button
              onClick={() => handleSelectPhotoMode('photoFront')}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-all whitespace-nowrap ${
                activePhotoMode === 'photoFront'
                  ? 'bg-[#D4A373] text-[#0A0A0A] font-bold shadow-md'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
              title="Fachada Frontal Completa (7 Pilares, Van Rurais, Placa 03)"
            >
              <span>🚜 Foto 1 (Fachada 7 Pilares)</span>
            </button>

            <button
              onClick={() => handleSelectPhotoMode('photoPlaque')}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-all whitespace-nowrap ${
                activePhotoMode === 'photoPlaque'
                  ? 'bg-[#D4A373] text-[#0A0A0A] font-bold shadow-md'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
              title="Placa Oficial Estaleiro 03 (Igarashi)"
            >
              <span>📋 Foto 2 (Placa Oficial)</span>
            </button>

            <button
              onClick={() => handleSelectPhotoMode('photoInternal')}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-all whitespace-nowrap hidden sm:flex ${
                activePhotoMode === 'photoInternal'
                  ? 'bg-[#D4A373] text-[#0A0A0A] font-bold shadow-md'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
              title="Postes Roliços, Calços e Varais"
            >
              <span>🖼️ Foto 3 (Postes/Calços)</span>
            </button>

            <button
              onClick={() => handleSelectPhotoMode('photoLateral')}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-all whitespace-nowrap hidden sm:flex ${
                activePhotoMode === 'photoLateral'
                  ? 'bg-[#D4A373] text-[#0A0A0A] font-bold shadow-md'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
              title="Fachada Longitudinal com Beiral Amplo"
            >
              <span>🏡 Foto 4 (Beiral)</span>
            </button>

            <button
              onClick={() => handleSelectPhotoMode('photoPanoramic')}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-all whitespace-nowrap hidden sm:flex ${
                activePhotoMode === 'photoPanoramic'
                  ? 'bg-[#D4A373] text-[#0A0A0A] font-bold shadow-md'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
              title="Visão Geral Completa"
            >
              <span>🌐 Geral 360°</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Side-by-side Photo Toggle */}
            <button
              onClick={() => setShowSideBySideComparison(!showSideBySideComparison)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs border font-semibold transition-all ${
                showSideBySideComparison
                  ? 'bg-[#26201a] border-[#D4A373] text-[#D4A373]'
                  : 'bg-[#1A1A1A] border-[#2D2D2D] text-[#9CA3AF] hover:text-white'
              }`}
              title="Alternar Painel de Fotos Reais de Referência"
            >
              <Columns className="w-3.5 h-3.5 text-[#EAB308]" />
              <span className="text-[11px] hidden md:inline">Foto Real</span>
            </button>

            {/* Gallery modal */}
            <button
              onClick={() => setShowRealPhotosModal(true)}
              className="p-1.5 bg-[#1A1A1A] hover:bg-[#262626] text-[#D4A373] border border-[#2D2D2D] rounded text-xs font-semibold"
              title="Ver Fotos Reais do Campo e Placa 03"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Layers */}
            <button
              onClick={() => setShowLayersMenu(!showLayersMenu)}
              className={`p-1.5 rounded border transition-colors ${
                showLayersMenu
                  ? 'bg-[#26201a] border-[#D4A373] text-[#D4A373]'
                  : 'bg-[#1A1A1A] border-[#2D2D2D] text-[#9CA3AF] hover:text-white'
              }`}
              title="Filtro de Camadas da Estrutura"
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Auto-Rotate */}
            <button
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              className={`p-1.5 rounded border transition-colors ${
                isAutoRotating
                  ? 'bg-[#26201a] border-[#D4A373] text-[#D4A373]'
                  : 'bg-[#1A1A1A] border-[#2D2D2D] text-[#9CA3AF] hover:text-white'
              }`}
              title="Girar 360°"
            >
              {isAutoRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {/* Fullscreen */}
            <button
              onClick={() => setIsImmersive(!isImmersive)}
              className="p-1.5 bg-[#1A1A1A] hover:bg-[#262626] text-[#9CA3AF] hover:text-white rounded border border-[#2D2D2D]"
              title="Modo Tela Cheia"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      <div className="relative flex-1 w-full h-full min-h-0 flex flex-col lg:flex-row overflow-hidden bg-[#0A0A0A]">
        {/* Left/Overlay Side: Real Photo Reference Card */}
        {showSideBySideComparison && (
          <div className="w-full lg:w-88 xl:w-96 bg-[#121212] border-b lg:border-b-0 lg:border-r border-[#2D2D2D] flex flex-col shrink-0 z-20 overflow-y-auto max-h-[35vh] lg:max-h-full shadow-2xl">
            {/* Header */}
            <div className="p-2.5 sm:p-3 border-b border-[#2D2D2D] bg-[#181818] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#D4A373]" />
                <span className="text-xs font-bold text-[#D4A373] font-serif">Foto Real do Campo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-1.5 py-0.5 bg-black/60 text-[#EAB308] rounded font-mono border border-[#EAB308]/30 font-bold">
                  {activePhotoMode === 'photoFront'
                    ? 'Foto 1 (Fachada 7 Pilares)'
                    : activePhotoMode === 'photoPlaque'
                    ? 'Foto 2 (Placa 03 Igarashi)'
                    : activePhotoMode === 'photoInternal'
                    ? 'Foto 3 (Postes/Calços)'
                    : 'Referência'}
                </span>
                <button
                  onClick={() => setShowSideBySideComparison(false)}
                  className="text-[#9CA3AF] hover:text-white lg:hidden text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Real Photo Visual / Plaque Rendering */}
            {activePhotoMode === 'photoPlaque' ? (
              <div className="p-3 bg-[#0A0A0A] flex flex-col items-center justify-center shrink-0">
                <div className="w-full bg-[#F8F9FA] text-[#1E293B] rounded-lg border-2 border-[#1E293B] p-3 shadow-xl">
                  <div className="bg-[#1E293B] text-[#FACC15] py-1 px-2 rounded font-bold text-center text-xs tracking-wider">
                    ESTALEIRO DE ALHO
                  </div>
                  <div className="flex items-center justify-between my-2">
                    <div className="text-center px-1">
                      <div className="text-3xl font-black text-[#1E293B] leading-none">03</div>
                      <div className="w-10 h-5 bg-[#334155] rounded-t-sm mx-auto mt-1 flex items-center justify-center text-[6px] text-white font-mono">
                        7 PILARES
                      </div>
                    </div>
                    <div className="space-y-0.5 text-[9px] border-l-2 border-[#E2E8F0] pl-2 font-mono">
                      <div className="text-[#475569]">CAPACIDADE MÁXIMA:</div>
                      <div className="font-bold text-[#0F172A]">18,80 ha • 527.904,00 Kg</div>
                      <div className="font-black text-[#059669]">CAPACIDADE ATUAL: 100%</div>
                      <div className="font-bold text-[#0F172A]">527.904,00 Kg</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1 pt-1 border-t border-[#E2E8F0]">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#059669] flex items-center justify-center text-[7px] text-white font-bold">
                      IG
                    </div>
                    <span className="font-black text-[11px] text-[#059669] tracking-wider">IGARASHI</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative h-36 sm:h-44 bg-black flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={photoPresets[activePhotoMode].image}
                  alt={photoPresets[activePhotoMode].title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1.5 left-2 right-2 px-2 py-0.5 bg-black/85 backdrop-blur-xs rounded text-[9px] sm:text-[10px] text-[#EAB308] font-mono border border-[#EAB308]/40 flex items-center justify-between">
                  <span>🔍 Foto Real de Campo</span>
                  <span className="text-[#9CA3AF]">Estaleiro 03 (Igarashi)</span>
                </div>
              </div>
            )}

            {/* Explanatory Points */}
            <div className="p-3 space-y-2.5 text-xs flex-1">
              <div>
                <h4 className="font-serif font-bold text-[#F3F4F6] text-xs leading-tight">
                  {photoPresets[activePhotoMode].title}
                </h4>
                <p className="text-[10px] text-[#D4A373] font-mono mt-0.5">
                  {photoPresets[activePhotoMode].subtitle}
                </p>
              </div>

              <div className="space-y-1.5 pt-1 border-t border-[#262626]">
                <div className="text-[9px] font-mono text-[#9CA3AF] uppercase font-semibold">
                  Correspondência Estrutural no Modelo 3D:
                </div>
                {photoPresets[activePhotoMode].keyElements.map((elem, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[10px] sm:text-[11px] text-[#D1D5DB]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#EAB308] shrink-0 mt-0.5" />
                    <span className="leading-snug">{elem}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3D Canvas Container */}
        <div className="relative flex-1 w-full h-full min-h-0 min-w-0 bg-[#0A0A0A] overflow-hidden flex flex-col">
          <div
            ref={mountRef}
            className="w-full h-full flex-1 min-h-0 cursor-grab active:cursor-grabbing relative"
          />

          {/* Floating Quantities & Dimensions Configurator Modal */}
          {showQuantitiesModal && (
            <div className="absolute inset-x-2 sm:inset-x-auto sm:left-4 top-3 z-40 bg-[#141414]/98 backdrop-blur-md border border-[#D4A373]/80 rounded-xl p-3.5 sm:p-4 shadow-2xl text-xs w-auto sm:w-[420px] max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#2D2D2D]">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#EAB308]" />
                  <span className="font-bold text-[#F3F4F6] text-xs uppercase tracking-wide">
                    Escolher Quantidades do Estaleiro
                  </span>
                </div>
                <button
                  onClick={() => setShowQuantitiesModal(false)}
                  className="text-[#9CA3AF] hover:text-white text-sm px-1.5 py-0.5 rounded hover:bg-[#262626]"
                >
                  ✕
                </button>
              </div>

              {/* Live Dimensions & Pillars Summary */}
              <div className="grid grid-cols-2 gap-2 p-2.5 mb-3 rounded-lg bg-[#181818] border border-[#2D2D2D] font-mono text-[11px]">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-[#9CA3AF]">Total de Postes:</div>
                  <div className="text-[#FBBF24] font-bold text-xs">
                    {totalPillarsCount} postes
                  </div>
                  <div className="text-[10px] text-[#9CA3AF]">
                    {pillarColsX.length} cols × {pillarRowsZ.length} eixos
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10px] text-[#9CA3AF]">Dimensões & Área:</div>
                  <div className="text-[#E5E7EB] font-bold text-xs">
                    38m × {bL}m (14m alt.)
                  </div>
                  <div className="text-[10px] text-[#10B981]">
                    ~{(38 * bL).toLocaleString('pt-BR')} m² de área
                  </div>
                </div>

                <div className="col-span-2 pt-1 border-t border-[#262626] flex items-center justify-between">
                  <span className="text-[10px] text-[#9CA3AF]">Capacidade Efetiva de Alho:</span>
                  <span className="text-[#EAB308] font-bold">
                    {currentCapacityKg.toLocaleString('pt-BR')} kg ({currentHectares.toLocaleString('pt-BR')} ha)
                  </span>
                </div>
              </div>

              <div className="space-y-3.5">
                {/* 1. Quantidade de Galerias (Largura) */}
                <div className="p-2.5 bg-[#1A1A1A] rounded-lg border border-[#2D2D2D]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[#E5E7EB] flex items-center gap-1.5">
                      <Grid className="w-3.5 h-3.5 text-[#D4A373]" />
                      Galerias na Largura:
                    </span>
                    <span className="font-mono font-bold text-[#EAB308]">
                      {galleryCount} Galerias • {pillarColsX.length} Pilares
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="range"
                      min="2"
                      max="14"
                      step="1"
                      value={galleryCount}
                      onChange={(e) => setGalleryCount(Number(e.target.value))}
                      className="flex-1 h-1.5 bg-[#262626] rounded-lg appearance-none cursor-pointer accent-[#D4A373]"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {galleryPresets.map((gp) => (
                      <button
                        key={gp.count}
                        onClick={() => setGalleryCount(gp.count)}
                        className={`px-2 py-1 rounded text-[10px] font-mono border transition-all ${
                          galleryCount === gp.count
                            ? 'bg-[#D4A373] text-[#0A0A0A] font-bold border-[#D4A373]'
                            : 'bg-[#141414] text-[#9CA3AF] border-[#2D2D2D] hover:text-white'
                        }`}
                      >
                        {gp.count} Gal. {gp.count === 6 && '★ Foto 28'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Quantidade de Eixos / Vãos no Comprimento */}
                <div className="p-2.5 bg-[#1A1A1A] rounded-lg border border-[#2D2D2D]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[#E5E7EB] flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-[#D4A373]" />
                      Comprimento do Estaleiro:
                    </span>
                    <span className="font-mono font-bold text-[#EAB308]">
                      {bL} Metros • {pillarRowsZ.length} Eixos
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="range"
                      min="6"
                      max="28"
                      step="2"
                      value={lengthBays}
                      onChange={(e) => setLengthBays(Number(e.target.value))}
                      className="flex-1 h-1.5 bg-[#262626] rounded-lg appearance-none cursor-pointer accent-[#D4A373]"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {lengthPresets.map((lp) => (
                      <button
                        key={lp.bays}
                        onClick={() => setLengthBays(lp.bays)}
                        className={`px-2 py-1 rounded text-[10px] font-mono border transition-all ${
                          lengthBays === lp.bays
                            ? 'bg-[#D4A373] text-[#0A0A0A] font-bold border-[#D4A373]'
                            : 'bg-[#141414] text-[#9CA3AF] border-[#2D2D2D] hover:text-white'
                        }`}
                      >
                        {lp.bays * 4.5}m ({lp.bays + 1} eixos) {lp.bays === 16 && '★ Foto 27'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Quantidade de Níveis Verticais de Varais */}
                <div className="p-2.5 bg-[#1A1A1A] rounded-lg border border-[#2D2D2D]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[#E5E7EB] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#D4A373]" />
                      Níveis Verticais (Varais):
                    </span>
                    <span className="font-mono font-bold text-[#EAB308]">
                      {tierCount} Níveis de Altura
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="range"
                      min="3"
                      max="9"
                      step="1"
                      value={tierCount}
                      onChange={(e) => setTierCount(Number(e.target.value))}
                      className="flex-1 h-1.5 bg-[#262626] rounded-lg appearance-none cursor-pointer accent-[#D4A373]"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {tierPresets.map((tp) => (
                      <button
                        key={tp.count}
                        onClick={() => setTierCount(tp.count)}
                        className={`px-2 py-1 rounded text-[10px] font-mono border transition-all ${
                          tierCount === tp.count
                            ? 'bg-[#D4A373] text-[#0A0A0A] font-bold border-[#D4A373]'
                            : 'bg-[#141414] text-[#9CA3AF] border-[#2D2D2D] hover:text-white'
                        }`}
                      >
                        {tp.count} Níveis {tp.count === 7 && '★ Foto 29'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Carga de Alho (% de Ocupação) */}
                <div className="p-2.5 bg-[#1A1A1A] rounded-lg border border-[#2D2D2D]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[#E5E7EB] flex items-center gap-1.5">
                      <span>🌾</span>
                      Carga de Alho em Rama:
                    </span>
                    <span className="font-mono font-bold text-[#EAB308]">
                      {garlicFillPercent}% • {(currentCapacityKg / 1000).toFixed(1)} toneladas
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="25"
                      value={garlicFillPercent}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setGarlicFillPercent(val);
                        setLayers((prev) => ({ ...prev, garlicTiers: val > 0 }));
                      }}
                      className="flex-1 h-1.5 bg-[#262626] rounded-lg appearance-none cursor-pointer accent-[#EAB308]"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {garlicPresets.map((gp) => (
                      <button
                        key={gp.percent}
                        onClick={() => {
                          setGarlicFillPercent(gp.percent);
                          setLayers((prev) => ({ ...prev, garlicTiers: gp.percent > 0 }));
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-mono border transition-all ${
                          garlicFillPercent === gp.percent
                            ? 'bg-[#EAB308] text-[#0A0A0A] font-bold border-[#EAB308]'
                            : 'bg-[#141414] text-[#9CA3AF] border-[#2D2D2D] hover:text-white'
                        }`}
                      >
                        {gp.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 mt-3 border-t border-[#2D2D2D] flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setGalleryCount(6);
                    setLengthBays(16);
                    setTierCount(7);
                    setGarlicFillPercent(100);
                    setLayers((prev) => ({ ...prev, garlicTiers: true }));
                  }}
                  className="px-2.5 py-1.5 rounded text-[11px] font-semibold text-[#D4A373] hover:bg-[#26201a] border border-[#382F24] transition-colors"
                >
                  ↺ Padrão Real das Fotos (6 Gal. • 72m • 7 Níveis)
                </button>
                <button
                  onClick={() => setShowQuantitiesModal(false)}
                  className="px-3 py-1.5 rounded text-[11px] font-bold bg-[#D4A373] text-[#0A0A0A] hover:bg-[#b88557] transition-colors"
                >
                  Concluir
                </button>
              </div>
            </div>
          )}

          {/* Floating Layers Menu */}
          {showLayersMenu && (
            <div className="absolute top-3 left-3 sm:left-4 z-40 bg-[#141414]/95 backdrop-blur-md border border-[#2D2D2D] rounded-lg p-3 shadow-2xl text-xs w-68 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2D2D2D]">
                <span className="font-bold text-[#D4A373] flex items-center gap-1.5 text-xs">
                  <Layers className="w-3.5 h-3.5" />
                  Camadas da Estrutura
                </span>
                <button
                  onClick={() => setShowLayersMenu(false)}
                  className="text-[#9CA3AF] hover:text-white text-xs px-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[#E5E7EB] cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={layers.roundPillars}
                    onChange={(e) => setLayers({ ...layers, roundPillars: e.target.checked })}
                    className="rounded accent-[#D4A373] w-3.5 h-3.5 bg-[#262626] border-[#2D2D2D]"
                  />
                  <span>{totalPillarsCount} Postes Roliços & Calços</span>
                </label>

                <label className="flex items-center gap-2 text-[#E5E7EB] cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={layers.frontFacadeBeams}
                    onChange={(e) => setLayers({ ...layers, frontFacadeBeams: e.target.checked })}
                    className="rounded accent-[#D4A373] w-3.5 h-3.5 bg-[#262626] border-[#2D2D2D]"
                  />
                  <span>Vigas Horizontais & Placa 03</span>
                </label>

                <label className="flex items-center gap-2 text-[#E5E7EB] cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={layers.garlicTiers}
                    onChange={(e) => setLayers({ ...layers, garlicTiers: e.target.checked })}
                    className="rounded accent-[#EAB308] w-3.5 h-3.5 bg-[#262626] border-[#2D2D2D]"
                  />
                  <span className="font-bold text-[#FBBF24]">Carga de Alho ({garlicFillPercent}% • {(currentCapacityKg / 1000).toFixed(1)} t)</span>
                </label>

                <label className="flex items-center gap-2 text-[#E5E7EB] cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={layers.galleryRails}
                    onChange={(e) => setLayers({ ...layers, galleryRails: e.target.checked })}
                    className="rounded accent-[#D4A373] w-3.5 h-3.5 bg-[#262626] border-[#2D2D2D]"
                  />
                  <span>Varas Roliças ({galleryCount} Galerias × {tierCount} Níveis)</span>
                </label>

                <label className="flex items-center gap-2 text-[#E5E7EB] cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={layers.roofCover}
                    onChange={(e) => setLayers({ ...layers, roofCover: e.target.checked })}
                    className="rounded accent-[#64748B] w-3.5 h-3.5 bg-[#262626] border-[#2D2D2D]"
                  />
                  <span>Telhado & Beirais de 2,5m</span>
                </label>
              </div>

              {/* Exploded Slider */}
              <div className="mt-2.5 pt-2 border-t border-[#262626]">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#9CA3AF] mb-1">
                  <span>Visão Explodida:</span>
                  <span className="text-[#D4A373] font-bold">{exploded}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={exploded}
                  onChange={(e) => setExploded(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#262626] rounded-lg appearance-none cursor-pointer accent-[#D4A373]"
                />
              </div>
            </div>
          )}

          {/* Quick HUD Metrics Overlay at Top-Right */}
          <div className="absolute top-3 right-3 z-20 pointer-events-none hidden sm:flex flex-col gap-1 items-end">
            <div className="bg-[#141414]/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#2D2D2D] shadow-lg text-[10px] font-mono text-[#E5E7EB] flex items-center gap-2">
              <span className="text-[#D4A373] font-bold">
                {pillarColsX.length} × {pillarRowsZ.length} Pilares ({bL}m)
              </span>
              <span className="text-[#4B5563]">|</span>
              <span className="text-[#EAB308] font-bold">
                {currentCapacityKg.toLocaleString('pt-BR')} kg ({garlicFillPercent}%)
              </span>
              <span className="text-[#4B5563]">|</span>
              <span className="text-[#10B981] flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#10B981]" /> 60 FPS
              </span>
            </div>
          </div>

          {/* Hover / 3D Raycasting Info Card */}
          {hoveredInfo && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-[#141414]/95 backdrop-blur-md border border-[#D4A373] text-[#E5E7EB] px-3.5 py-2 rounded-lg shadow-2xl max-w-sm pointer-events-none animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between gap-3 border-b border-[#2D2D2D] pb-1 mb-1">
                <span className="font-serif font-bold text-xs text-[#D4A373]">{hoveredInfo.title}</span>
                {hoveredInfo.load && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#D4A373]/20 text-[#D4A373] rounded border border-[#D4A373]/40 font-bold">
                    {hoveredInfo.load}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#9CA3AF] leading-snug">{hoveredInfo.description}</p>
              <div className="text-[10px] font-mono text-[#D4A373] mt-1 font-semibold">
                {hoveredInfo.specs}
              </div>
            </div>
          )}

          {/* Bottom Info & Reset Pill */}
          <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none flex items-center justify-between gap-2">
            <div className="bg-[#141414]/90 text-[#E5E7EB] backdrop-blur-xs px-2.5 py-1.5 rounded-md border border-[#2D2D2D] shadow-lg text-[10px] sm:text-[11px] font-mono flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>
                Estaleiro 03 • {pillarColsX.length} Pilares Frontais ({galleryCount} Galerias) • {pillarRowsZ.length} Eixos ({bL}m) • {tierCount} Níveis • {currentCapacityKg.toLocaleString('pt-BR')} kg ({garlicFillPercent}%)
              </span>
            </div>

            <button
              onClick={() => handleSelectPhotoMode(activePhotoMode)}
              className="pointer-events-auto flex items-center gap-1 px-2.5 py-1.5 bg-[#1A1A1A]/95 hover:bg-[#262626] text-[#D4A373] border border-[#2D2D2D] rounded-md text-xs font-semibold shadow-lg shrink-0"
              title="Realinhar Câmera com o Ângulo da Foto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Realinhar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real Photos Modal */}
      <RealPhotosModal isOpen={showRealPhotosModal} onClose={() => setShowRealPhotosModal(false)} />

      {/* Harvest Loads, Scale & Bay Allocation Modal */}
      <HarvestLoadsModal
        isOpen={showHarvestModal}
        onClose={() => setShowHarvestModal(false)}
        truckLoads={truckLoads}
        setTruckLoads={setTruckLoads}
        cellAllocations={cellAllocations}
        setCellAllocations={setCellAllocations}
        galleryCount={galleryCount}
        lengthBays={lengthBays}
        tierCount={tierCount}
        onSelectCellIn3D={handleSelectCellIn3D}
        onOpenPrintMap={() => setShowPrintMapModal(true)}
      />

      {/* Printable Warehouse Map Modal */}
      <PrintableWarehouseMapModal
        isOpen={showPrintMapModal}
        onClose={() => setShowPrintMapModal(false)}
        truckLoads={truckLoads}
        cellAllocations={cellAllocations}
        galleryCount={galleryCount}
        lengthBays={lengthBays}
        tierCount={tierCount}
      />
    </div>
  );
};
