import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Layers, 
  Wind, 
  Eye, 
  Download, 
  Printer, 
  Ruler, 
  SunMedium,
  CheckCircle2,
  Sliders,
  Sparkles
} from 'lucide-react';
import { LayerVisibility, BlueprintTheme, StructuralMetrics } from '../types';

interface Blueprint2DViewProps {
  metrics: StructuralMetrics;
  onUpdateMetrics?: (newMetrics: Partial<StructuralMetrics>) => void;
}

export const Blueprint2DView: React.FC<Blueprint2DViewProps> = ({ metrics, onUpdateMetrics }) => {
  const [zoom, setZoom] = useState<number>(0.6);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [theme, setTheme] = useState<BlueprintTheme>('cad-dark');
  const [activeTab, setActiveTab] = useState<'drawing' | 'layers' | 'dimensions'>('drawing');
  const [animatedFlow, setAnimatedFlow] = useState<boolean>(true);
  const [showOriginalComparison, setShowOriginalComparison] = useState<boolean>(false);
  const [showLayersMenu, setShowLayersMenu] = useState<boolean>(false);
  const [showMetricsDetails, setShowMetricsDetails] = useState<boolean>(false);
  const [isImmersive, setIsImmersive] = useState<boolean>(false);
  const [showThemeMenu, setShowThemeMenu] = useState<boolean>(false);
  const [levelsCount, setLevelsCount] = useState<number>(metrics.levelsCount || 8);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const [layers, setLayers] = useState<LayerVisibility>({
    structure: true,
    garlicRacks: true,
    airflow: true,
    dimensions: true,
    annotations: true,
    foundation: true,
    grid: true,
  });

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; dist?: number }>({ x: 0, y: 0 });

  // SVG Dimension parameters matching the 2D architectural section
  const svgWidth = 1400;
  const svgHeight = 900;

  // Auto-fit to screen function
  const handleFitToScreen = () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    if (containerWidth === 0 || containerHeight === 0) return;

    const padding = window.innerWidth < 640 ? 16 : 40;
    const scaleX = (containerWidth - padding) / svgWidth;
    const scaleY = (containerHeight - padding) / svgHeight;
    const fitScale = Math.max(Math.min(scaleX, scaleY), 0.2);

    setZoom(fitScale);
    setPan({ x: 0, y: 0 });
  };

  // Initial fit & resize handler
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitToScreen();
    }, 100);

    const handleResize = () => {
      handleFitToScreen();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Sync levels with parent metrics
  const handleLevelsChange = (val: number) => {
    setLevelsCount(val);
    if (onUpdateMetrics) {
      onUpdateMetrics({ levelsCount: val });
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.15, 3.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.15, 0.2));
  const handleResetZoom = () => handleFitToScreen();

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch handlers for mobile
  const getTouchDistance = (e: React.TouchEvent) => {
    if (e.touches.length < 2) return 0;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      touchStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      };
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = getTouchDistance(e);
      touchStartRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        dist,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setPan({
        x: e.touches[0].clientX - touchStartRef.current.x,
        y: e.touches[0].clientY - touchStartRef.current.y,
      });
    } else if (e.touches.length === 2 && touchStartRef.current.dist) {
      const newDist = getTouchDistance(e);
      if (newDist > 0 && touchStartRef.current.dist > 0) {
        const factor = newDist / touchStartRef.current.dist;
        setZoom(prev => Math.max(Math.min(prev * factor, 3.5), 0.2));
        touchStartRef.current.dist = newDist;
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Geometry calculations
  const groundY = 720;
  const buildingWidth = 980;
  const buildingLeft = 210;
  const buildingRight = buildingLeft + buildingWidth;
  const eaveOverhang = 70; // Beiral
  const wallLeft = buildingLeft;
  const wallRight = buildingRight;
  
  // Height definitions (representing 15m to 18m scale)
  const eaveHeightY = 260; // Top of wall / eave level (15m mark)
  const ridgeY = 110; // Ridge peak / cumeeira (18m mark)
  const centerTrussX = buildingLeft + buildingWidth / 2; // 700

  // 7 vertical structural pillars
  const pillarCount = 7;
  const bayWidth = buildingWidth / (pillarCount - 1); // 6 vãos
  const pillarXPositions = Array.from({ length: pillarCount }, (_, i) => buildingLeft + i * bayWidth);

  // Theme color palettes
  const themeStyles = {
    'graph-paper': {
      bg: '#fcfbf7',
      gridMajor: '#e3dcce',
      gridMinor: '#f1ede4',
      inkPrimary: '#1a1816',
      inkSecondary: '#3f3c36',
      wood: '#5c3a21',
      woodFill: '#ebd8c3',
      garlicHead: '#fbf8ee',
      garlicStroke: '#3a3428',
      garlicStem: '#8c7e60',
      airStream: '#0284c7',
      airFill: 'rgba(56, 189, 248, 0.22)',
      concrete: '#8d8b82',
      concreteHatch: '#4b4843',
      ground: '#73634e',
      annotation: '#181512',
      annotationLeader: '#26221d',
      title: '#11100e',
      highlight: '#d97706',
    },
    'blueprint-blue': {
      bg: '#0f2744',
      gridMajor: '#1d3e68',
      gridMinor: '#143154',
      inkPrimary: '#ffffff',
      inkSecondary: '#b9d4f5',
      wood: '#93c5fd',
      woodFill: '#173b64',
      garlicHead: '#e0f2fe',
      garlicStroke: '#38bdf8',
      garlicStem: '#7dd3fc',
      airStream: '#38bdf8',
      airFill: 'rgba(56, 189, 248, 0.3)',
      concrete: '#94a3b8',
      concreteHatch: '#cbd5e1',
      ground: '#475569',
      annotation: '#ffffff',
      annotationLeader: '#7dd3fc',
      title: '#ffffff',
      highlight: '#38bdf8',
    },
    'cad-dark': {
      bg: '#0A0A0A',
      gridMajor: '#262626',
      gridMinor: '#161616',
      inkPrimary: '#E5E7EB',
      inkSecondary: '#9CA3AF',
      wood: '#D4A373',
      woodFill: '#241a12',
      garlicHead: '#fef3c7',
      garlicStroke: '#D4A373',
      garlicStem: '#a16207',
      airStream: '#38bdf8',
      airFill: 'rgba(56, 189, 248, 0.25)',
      concrete: '#3f3f46',
      concreteHatch: '#71717a',
      ground: '#52525b',
      annotation: '#D4A373',
      annotationLeader: '#6B7280',
      title: '#E5E7EB',
      highlight: '#D4A373',
    },
    'realistic-wood': {
      bg: '#121212',
      gridMajor: '#282828',
      gridMinor: '#1c1c1c',
      inkPrimary: '#E5E7EB',
      inkSecondary: '#9CA3AF',
      wood: '#D4A373',
      woodFill: '#261a10',
      garlicHead: '#fffbeb',
      garlicStroke: '#D4A373',
      garlicStem: '#65a30d',
      airStream: '#38bdf8',
      airFill: 'rgba(56, 189, 248, 0.25)',
      concrete: '#52525b',
      concreteHatch: '#71717a',
      ground: '#52525b',
      annotation: '#E5E7EB',
      annotationLeader: '#71717a',
      title: '#D4A373',
      highlight: '#D4A373',
    },
  }[theme];

  // Helper to render garlic clusters in each bay and level
  const renderGarlicRack = (bayIdx: number, levelIdx: number) => {
    const xLeft = pillarXPositions[bayIdx] + 12;
    const xRight = pillarXPositions[bayIdx + 1] - 12;
    const rackWidth = xRight - xLeft;
    
    // Vertical spacing for levels
    const rackBottom = groundY - 35;
    const rackTop = eaveHeightY + 45;
    const totalRackHeight = rackBottom - rackTop;
    const levelSpacing = totalRackHeight / levelsCount;
    const yRail = rackTop + levelIdx * levelSpacing;

    // Number of garlic bunches per rail
    const garlicCount = 9;
    const garlicSpacing = rackWidth / (garlicCount + 1);

    return (
      <g key={`rack-${bayIdx}-${levelIdx}`} className="transition-opacity duration-300">
        {/* Horizontal Wooden Rail (Varal de madeira) */}
        <line
          x1={xLeft - 8}
          y1={yRail}
          x2={xRight + 8}
          y2={yRail}
          stroke={themeStyles.wood}
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Support brackets on pillars */}
        <rect
          x={xLeft - 10}
          y={yRail - 2}
          width="5"
          height="10"
          fill={themeStyles.wood}
        />
        <rect
          x={xRight + 5}
          y={yRail - 2}
          width="5"
          height="10"
          fill={themeStyles.wood}
        />

        {/* Hanging garlic strings / réstias */}
        {Array.from({ length: garlicCount }).map((_, gIdx) => {
          const gx = xLeft + (gIdx + 1) * garlicSpacing;
          const dropHeight = Math.min(26, levelSpacing * 0.72);
          
          return (
            <g key={`garlic-${gIdx}`} transform={`translate(${gx}, ${yRail})`}>
              {/* String / Rama tied to rail */}
              <path
                d={`M 0 0 Q ${gIdx % 2 === 0 ? 1 : -1} ${dropHeight * 0.4} 0 ${dropHeight * 0.6}`}
                stroke={themeStyles.garlicStem}
                strokeWidth="1.6"
                fill="none"
              />
              
              {/* Garlic heads cluster (Réstia com múltiplos bulbos) */}
              <g transform={`translate(0, ${dropHeight * 0.65})`}>
                {/* Background bulb shadows */}
                <ellipse cx="-3.5" cy="4" rx="4.5" ry="5.5" fill={themeStyles.garlicHead} stroke={themeStyles.garlicStroke} strokeWidth="1" />
                <ellipse cx="3.5" cy="4" rx="4.5" ry="5.5" fill={themeStyles.garlicHead} stroke={themeStyles.garlicStroke} strokeWidth="1" />
                <ellipse cx="0" cy="8" rx="5" ry="6" fill={themeStyles.garlicHead} stroke={themeStyles.garlicStroke} strokeWidth="1.1" />
                
                {/* Central main bulb details / segments */}
                <path d="M 0 3 Q -2 8 0 13 Q 2 8 0 3" stroke={themeStyles.garlicStroke} strokeWidth="0.8" fill="none" />
                <path d="M -3 4 Q -5 9 -2 13" stroke={themeStyles.garlicStroke} strokeWidth="0.7" fill="none" />
                <path d="M 3 4 Q 5 9 2 13" stroke={themeStyles.garlicStroke} strokeWidth="0.7" fill="none" />
                
                {/* Dried root tufts */}
                <path d="M -2 14 L -3 16 M 0 14.5 L 0 17 M 2 14 L 3 16" stroke={themeStyles.garlicStem} strokeWidth="0.8" strokeLinecap="round" />
              </g>
            </g>
          );
        })}
      </g>
    );
  };

  const handleExportSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'estaleiro-alho-corte-2d.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`flex flex-col h-full bg-[#0F0F0F] text-[#E5E7EB] overflow-hidden select-none relative ${isImmersive ? 'fixed inset-0 z-50' : ''}`}>
      {/* Top CAD Control Bar - Responsive Mobile & Desktop */}
      {!isImmersive && (
        <div className="bg-[#111111] border-b border-[#2D2D2D] z-10 shrink-0">
          {/* Main Top Bar */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5 overflow-x-auto scrollbar-none">
            {/* Title & Scale Badge */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="px-2 py-0.5 bg-[#1A1A1A] text-[#D4A373] font-mono text-[11px] sm:text-xs font-bold rounded border border-[#2D2D2D] flex items-center gap-1.5 shadow-xs">
                <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#D4A373] animate-pulse"></span>
                <span>1:150</span>
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-serif font-bold text-[#D4A373] tracking-tight flex items-center gap-1.5">
                  CORTE A-A'
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1A1A1A] text-[#D4A373] font-mono border border-[#D4A373]/30">
                    SC-01
                  </span>
                </h2>
              </div>
            </div>

            {/* View & Tool Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Auto Fit Button */}
              <button
                id="fit-screen-btn"
                onClick={handleFitToScreen}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[#1A1A1A] hover:bg-[#262626] text-[#D4A373] rounded border border-[#2D2D2D] font-semibold transition-colors"
                title="Ajustar Desenho à Tela"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#D4A373]" />
                <span className="hidden xs:inline text-[11px]">Ajustar</span>
              </button>

              {/* Zoom Controls */}
              <div className="flex items-center bg-[#1A1A1A] rounded border border-[#2D2D2D] p-0.5">
                <button
                  id="zoom-out-btn"
                  onClick={handleZoomOut}
                  className="p-1 text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#262626] rounded"
                  title="Afastar (-)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-[#9CA3AF] px-1 min-w-[34px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  id="zoom-in-btn"
                  onClick={handleZoomIn}
                  className="p-1 text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#262626] rounded"
                  title="Aproximar (+)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  id="zoom-reset-btn"
                  onClick={handleResetZoom}
                  className="p-1 text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#262626] rounded border-l border-[#2D2D2D]"
                  title="Centralizar e Redefinir"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>

              {/* Layers Button */}
              <button
                id="toggle-layers-btn"
                onClick={() => setShowLayersMenu(!showLayersMenu)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition-colors ${
                  showLayersMenu
                    ? 'bg-[#26201a] border-[#D4A373] text-[#D4A373] font-semibold'
                    : 'bg-[#1A1A1A] border-[#2D2D2D] text-[#9CA3AF] hover:text-[#E5E7EB]'
                }`}
                title="Camadas do Desenho"
              >
                <Layers className="w-3.5 h-3.5 text-[#D4A373]" />
                <span className="text-[11px]">Camadas</span>
              </button>

              {/* Theme Dropdown / Quick Toggle */}
              <div className="relative">
                <button
                  id="theme-menu-btn"
                  onClick={() => setShowThemeMenu(!showThemeMenu)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[#1A1A1A] hover:bg-[#262626] text-[#9CA3AF] hover:text-[#E5E7EB] rounded border border-[#2D2D2D] transition-colors"
                  title="Mudar Tema CAD"
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme === 'cad-dark' ? '#111' : theme === 'blueprint-blue' ? '#0f2744' : theme === 'graph-paper' ? '#fcfbf7' : '#2b1b11', border: '1px solid #D4A373' }}></span>
                  <span className="hidden sm:inline text-[11px] capitalize">{theme.split('-')[0]}</span>
                </button>

                {showThemeMenu && (
                  <div className="absolute right-0 top-full mt-1.5 z-40 bg-[#1A1A1A] border border-[#2D2D2D] rounded shadow-2xl p-1 w-36 font-mono text-xs animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => { setTheme('cad-dark'); setShowThemeMenu(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between ${theme === 'cad-dark' ? 'bg-[#262626] text-[#D4A373] font-bold' : 'text-[#9CA3AF] hover:bg-[#222]'}`}
                    >
                      <span>Dark CAD</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#111] border border-[#555]"></span>
                    </button>
                    <button
                      onClick={() => { setTheme('blueprint-blue'); setShowThemeMenu(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between ${theme === 'blueprint-blue' ? 'bg-[#262626] text-[#D4A373] font-bold' : 'text-[#9CA3AF] hover:bg-[#222]'}`}
                    >
                      <span>Blueprint</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0f2744] border border-[#38bdf8]"></span>
                    </button>
                    <button
                      onClick={() => { setTheme('graph-paper'); setShowThemeMenu(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between ${theme === 'graph-paper' ? 'bg-[#262626] text-[#D4A373] font-bold' : 'text-[#9CA3AF] hover:bg-[#222]'}`}
                    >
                      <span>Papel Técnico</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#fcfbf7] border border-[#ccc]"></span>
                    </button>
                    <button
                      onClick={() => { setTheme('realistic-wood'); setShowThemeMenu(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between ${theme === 'realistic-wood' ? 'bg-[#262626] text-[#D4A373] font-bold' : 'text-[#9CA3AF] hover:bg-[#222]'}`}
                    >
                      <span>Render Madeira</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2b1b11] border border-[#D4A373]"></span>
                    </button>
                  </div>
                )}
              </div>

              {/* Animation Toggle */}
              <button
                id="toggle-airflow-anim-btn"
                onClick={() => setAnimatedFlow(!animatedFlow)}
                className={`hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition-colors ${
                  animatedFlow
                    ? 'bg-[#1A1A1A] border-[#D4A373]/60 text-[#D4A373] font-semibold'
                    : 'bg-[#1A1A1A] border-[#2D2D2D] text-[#9CA3AF] hover:bg-[#262626]'
                }`}
                title="Animar Fluxo Térmico"
              >
                <Wind className={`w-3.5 h-3.5 ${animatedFlow ? 'text-[#D4A373] animate-spin-slow' : 'text-[#6B7280]'}`} />
                <span className="text-[11px]">Fluxo</span>
              </button>

              {/* Original Spec Toggle */}
              <button
                id="view-original-spec-btn"
                onClick={() => setShowOriginalComparison(!showOriginalComparison)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition-colors ${
                  showOriginalComparison
                    ? 'bg-[#26201a] border-[#D4A373] text-[#D4A373] font-semibold'
                    : 'bg-[#1A1A1A] border-[#2D2D2D] text-[#9CA3AF] hover:text-[#E5E7EB]'
                }`}
                title="Comparar com Foto Original"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D4A373]" />
                <span className="hidden sm:inline text-[11px]">Foto Original</span>
              </button>

              {/* Immersive / Fullscreen Mode */}
              <button
                id="toggle-fullscreen-btn"
                onClick={() => setIsImmersive(true)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[#1A1A1A] hover:bg-[#262626] text-[#9CA3AF] hover:text-white rounded border border-[#2D2D2D] transition-colors"
                title="Modo Tela Limpa / Foco"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#D4A373]" />
                <span className="hidden md:inline text-[11px]">Foco</span>
              </button>

              {/* Export Button */}
              <button
                id="export-svg-btn"
                onClick={handleExportSVG}
                className="hidden lg:flex items-center gap-1 px-2.5 py-1 bg-[#D4A373] text-[#0F0F0F] hover:bg-[#c49262] text-xs font-semibold rounded shadow-xs transition-colors"
                title="Exportar Vetor SVG"
              >
                <Download className="w-3.5 h-3.5 text-[#0F0F0F]" />
                <span className="text-[11px]">SVG</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Exit Button when in Immersive Mode */}
      {isImmersive && (
        <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
          <button
            onClick={handleFitToScreen}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A]/90 backdrop-blur-xs text-[#D4A373] hover:bg-[#262626] border border-[#2D2D2D] rounded shadow-xl text-xs font-semibold"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Ajustar</span>
          </button>
          <button
            onClick={() => setIsImmersive(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4A373] text-[#0F0F0F] hover:bg-[#c49262] rounded shadow-xl text-xs font-bold"
          >
            <span>✕ Sair do Foco</span>
          </button>
        </div>
      )}

      {/* Main Canvas Area */}
      <div 
        className="relative flex-1 bg-[#0A0A0A] overflow-hidden touch-none" 
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* Layer Visibility Drawer / Modal */}
        {showLayersMenu && (
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-30 flex flex-col gap-2 bg-[#1A1A1A]/95 backdrop-blur-md p-3.5 rounded border border-[#D4A373]/60 shadow-2xl text-xs w-64 max-w-[calc(100vw-32px)] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#2D2D2D] font-semibold text-[#D4A373]">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#D4A373]" />
                Camadas do Projeto
              </span>
              <button
                onClick={() => setShowLayersMenu(false)}
                className="text-[#9CA3AF] hover:text-white text-xs font-bold px-1.5 py-0.5 rounded bg-[#262626]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 py-1">
              <label className="flex items-center gap-2.5 text-[#E5E7EB] cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={layers.structure}
                  onChange={(e) => setLayers({ ...layers, structure: e.target.checked })}
                  className="rounded accent-[#D4A373] w-4 h-4 bg-[#262626] border-[#2D2D2D]"
                />
                <span>Estrutura Madeira / Shed</span>
              </label>

              <label className="flex items-center gap-2.5 text-[#E5E7EB] cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={layers.garlicRacks}
                  onChange={(e) => setLayers({ ...layers, garlicRacks: e.target.checked })}
                  className="rounded accent-[#D4A373] w-4 h-4 bg-[#262626] border-[#2D2D2D]"
                />
                <span>Réstias de Alho em Rama</span>
              </label>

              <label className="flex items-center gap-2.5 text-[#E5E7EB] cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={layers.airflow}
                  onChange={(e) => setLayers({ ...layers, airflow: e.target.checked })}
                  className="rounded accent-[#38bdf8] w-4 h-4 bg-[#262626] border-[#2D2D2D]"
                />
                <span>Fluxo de Ar (Chaminé)</span>
              </label>

              <label className="flex items-center gap-2.5 text-[#E5E7EB] cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={layers.annotations}
                  onChange={(e) => setLayers({ ...layers, annotations: e.target.checked })}
                  className="rounded accent-[#D4A373] w-4 h-4 bg-[#262626] border-[#2D2D2D]"
                />
                <span>Textos & Callouts Técnicos</span>
              </label>

              <label className="flex items-center gap-2.5 text-[#E5E7EB] cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={layers.foundation}
                  onChange={(e) => setLayers({ ...layers, foundation: e.target.checked })}
                  className="rounded accent-[#D4A373] w-4 h-4 bg-[#262626] border-[#2D2D2D]"
                />
                <span>Fundações & Solo Compactado</span>
              </label>

              <label className="flex items-center gap-2.5 text-[#E5E7EB] cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={layers.dimensions}
                  onChange={(e) => setLayers({ ...layers, dimensions: e.target.checked })}
                  className="rounded accent-[#D4A373] w-4 h-4 bg-[#262626] border-[#2D2D2D]"
                />
                <span>Linhas de Cota & Metragem</span>
              </label>

              <label className="flex items-center gap-2.5 text-[#E5E7EB] cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={layers.grid}
                  onChange={(e) => setLayers({ ...layers, grid: e.target.checked })}
                  className="rounded accent-[#D4A373] w-4 h-4 bg-[#262626] border-[#2D2D2D]"
                />
                <span>Papel Milimetrado (Grade)</span>
              </label>
            </div>

            <div className="pt-2 border-t border-[#2D2D2D] flex items-center justify-between text-[11px]">
              <span className="text-[#9CA3AF]">Andares:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleLevelsChange(Math.max(4, levelsCount - 1))}
                  className="w-5 h-5 rounded bg-[#262626] text-white flex items-center justify-center font-bold"
                >
                  -
                </button>
                <span className="font-mono font-bold text-[#D4A373]">{levelsCount}</span>
                <button
                  onClick={() => handleLevelsChange(Math.min(10, levelsCount + 1))}
                  className="w-5 h-5 rounded bg-[#262626] text-white flex items-center justify-center font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Original Image Floating Modal Overlay when requested */}
        {showOriginalComparison && (
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-40 w-80 sm:w-96 bg-[#1A1A1A] rounded border border-[#D4A373]/60 p-3.5 shadow-2xl animate-in fade-in zoom-in-95 max-w-[calc(100vw-32px)]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2D2D2D]">
              <span className="text-xs font-bold text-[#D4A373] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#D4A373]" />
                Foto Original do PRD
              </span>
              <button
                onClick={() => setShowOriginalComparison(false)}
                className="text-[#9CA3AF] hover:text-white text-xs font-bold px-1.5 py-0.5 rounded bg-[#262626]"
              >
                ✕
              </button>
            </div>
            <div className="relative rounded overflow-hidden border border-[#2D2D2D] bg-[#0A0A0A]">
              <img
                src="Screenshot_2026-08-27-21-34-25-12_680d03679600f7af0b4c700c6b270fe7.jpg"
                alt="Original Estaleiro 2D Blueprint"
                className="w-full object-contain max-h-56"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="mt-2 text-[11px] text-[#9CA3AF] leading-tight">
              Desenho 1:1 fiel à planta fornecida, com 7 colunas, tesoura shed e fluxo térmico por convecção natural.
            </p>
          </div>
        )}

        {/* Mobile & Desktop Dimensions Pill (Colapsável para não tampar a tela) */}
        <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-20">
          <div 
            onClick={() => setShowMetricsDetails(!showMetricsDetails)}
            className="cursor-pointer bg-[#1A1A1A]/90 text-[#E5E7EB] backdrop-blur-xs px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded border border-[#2D2D2D] hover:border-[#D4A373]/50 shadow-lg text-[11px] sm:text-xs font-mono flex items-center gap-2 sm:gap-3 transition-colors"
          >
            <div><span className="text-[#6B7280]">DIMENSÃO:</span> <span className="text-white font-medium ml-1">38m × 18m</span></div>
            <div className="hidden sm:block"><span className="text-[#6B7280]">PÉ-DIREITO:</span> <span className="text-white font-medium ml-1">15,5m</span></div>
            <div><span className="text-[#D4A373] font-bold">{levelsCount} Níveis</span></div>
            <span className="text-[#6B7280] text-[10px]">{showMetricsDetails ? '▲' : '▼'}</span>
          </div>

          {showMetricsDetails && (
            <div className="mt-1.5 p-3 bg-[#1A1A1A] border border-[#2D2D2D] rounded shadow-2xl text-xs font-mono space-y-1 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between gap-4"><span className="text-[#6B7280]">Largura Total:</span> <span className="text-white font-bold">38,00 m (6 vãos de 6,33m)</span></div>
              <div className="flex justify-between gap-4"><span className="text-[#6B7280]">Pé-Direito Lateral:</span> <span className="text-white font-bold">15,50 m</span></div>
              <div className="flex justify-between gap-4"><span className="text-[#6B7280]">Altura Cumeeira:</span> <span className="text-white font-bold">18,00 m</span></div>
              <div className="flex justify-between gap-4"><span className="text-[#6B7280]">Capacidade Carga:</span> <span className="text-[#D4A373] font-bold">530.000 kg (530t)</span></div>
              <div className="flex justify-between gap-4"><span className="text-[#6B7280]">Colunas Portantes:</span> <span className="text-[#D4A373] font-bold">7 Pilares (25x25cm)</span></div>
            </div>
          )}
        </div>

        {/* Interactive SVG Drawing Container */}
        <div
          className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            <svg
              ref={svgRef}
              width={svgWidth}
              height={svgHeight}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="shadow-2xl rounded-sm"
              style={{ backgroundColor: themeStyles.bg }}
            >
              <defs>
                {/* Graph paper pattern (Milimetrado fino) */}
                <pattern id="grid-minor" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke={themeStyles.gridMinor} strokeWidth="0.65" />
                </pattern>
                
                {/* Major grid lines (Linhas mestras a cada 50px) */}
                <pattern id="grid-major" width="50" height="50" patternUnits="userSpaceOnUse">
                  <rect width="50" height="50" fill="url(#grid-minor)" />
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke={themeStyles.gridMajor} strokeWidth="1.2" />
                </pattern>

                {/* Foundation Soil Hatching Pattern */}
                <pattern id="soil-hatch" width="20" height="20" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="20" stroke={themeStyles.concreteHatch} strokeWidth="1.2" opacity="0.4" />
                </pattern>

                {/* Concrete Hatching Pattern */}
                <pattern id="concrete-dots" width="16" height="16" patternUnits="userSpaceOnUse">
                  <circle cx="4" cy="4" r="0.8" fill={themeStyles.concreteHatch} opacity="0.6" />
                  <circle cx="12" cy="12" r="0.8" fill={themeStyles.concreteHatch} opacity="0.6" />
                  <path d="M 8 2 L 10 4 L 8 6 Z" fill={themeStyles.concreteHatch} opacity="0.4" />
                </pattern>

                {/* Arrow markers for leaders and airflow */}
                <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill={themeStyles.airStream} />
                </marker>
                <marker id="arrow-leader" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 2 L 8 5 L 0 8 z" fill={themeStyles.annotationLeader} />
                </marker>
                <marker id="dot-leader" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4">
                  <circle cx="5" cy="5" r="3.5" fill={themeStyles.annotationLeader} />
                </marker>
                <marker id="dimension-tick" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6">
                  <line x1="2" y1="8" x2="8" y2="2" stroke={themeStyles.annotationLeader} strokeWidth="1.5" />
                </marker>

                {/* Linear gradient for smooth airflow tubes */}
                <linearGradient id="air-gradient-left" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#0284c7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                </linearGradient>

                {/* Wood texture filter */}
                <filter id="wood-emboss">
                  <feDropShadow dx="0" dy="1" stdDeviation="0.5" floodColor="#000" floodOpacity="0.2" />
                </filter>
              </defs>

              {/* 1. BACKGROUND GRID (PAPEL MILIMETRADO) */}
              {layers.grid && (
                <rect width={svgWidth} height={svgHeight} fill="url(#grid-major)" />
              )}

              {/* Outer architectural sheet border */}
              <rect
                x="30"
                y="30"
                width={svgWidth - 60}
                height={svgHeight - 60}
                fill="none"
                stroke={themeStyles.inkPrimary}
                strokeWidth="1.8"
              />
              <rect
                x="34"
                y="34"
                width={svgWidth - 68}
                height={svgHeight - 68}
                fill="none"
                stroke={themeStyles.inkSecondary}
                strokeWidth="0.8"
              />

              {/* 2. FOUNDATION & SOIL LAYER */}
              {layers.foundation && (
                <g id="layer-foundation">
                  {/* Natural terrain ground surface line with organic hatching */}
                  <path
                    d={`M 80 ${groundY} L ${wallLeft - 60} ${groundY} 
                       Q ${wallLeft - 20} ${groundY + 4} ${wallLeft} ${groundY}
                       L ${wallRight} ${groundY}
                       Q ${wallRight + 30} ${groundY - 2} ${svgWidth - 80} ${groundY}`}
                    stroke={themeStyles.ground}
                    strokeWidth="3.2"
                    fill="none"
                  />

                  {/* Compacted Ground Layer (SOLO COMPACTADO) */}
                  <rect
                    x={wallLeft - 40}
                    y={groundY}
                    width={buildingWidth + 80}
                    height="65"
                    fill="url(#soil-hatch)"
                    stroke={themeStyles.ground}
                    strokeWidth="1.2"
                  />
                  <line
                    x1={wallLeft - 40}
                    y1={groundY + 65}
                    x2={wallRight + 40}
                    y2={groundY + 65}
                    stroke={themeStyles.ground}
                    strokeWidth="1.8"
                    strokeDasharray="4 3"
                  />

                  {/* Concrete Footing Blocks / Sapatas em Concreto Armado sob cada pilar */}
                  {pillarXPositions.map((px, idx) => {
                    const isEdge = idx === 0 || idx === pillarCount - 1;
                    const blockW = isEdge ? 42 : 36;
                    const blockH = isEdge ? 48 : 42;
                    return (
                      <g key={`footing-${idx}`}>
                        {/* Concrete block */}
                        <rect
                          x={px - blockW / 2}
                          y={groundY - 6}
                          width={blockW}
                          height={blockH}
                          fill={themeStyles.concrete}
                          stroke={themeStyles.inkPrimary}
                          strokeWidth="2.2"
                        />
                        {/* Concrete fill texture */}
                        <rect
                          x={px - blockW / 2 + 2}
                          y={groundY - 4}
                          width={blockW - 4}
                          height={blockH - 4}
                          fill="url(#concrete-dots)"
                        />
                        {/* Steel anchoring plates / Sapata metálica */}
                        <rect
                          x={px - 14}
                          y={groundY - 10}
                          width="28"
                          height="6"
                          fill="#475569"
                          stroke={themeStyles.inkPrimary}
                          strokeWidth="1.2"
                        />
                        {/* Anchor bolts */}
                        <circle cx={px - 8} cy={groundY - 7} r="1.5" fill="#ffffff" />
                        <circle cx={px + 8} cy={groundY - 7} r="1.5" fill="#ffffff" />
                      </g>
                    );
                  })}
                </g>
              )}

              {/* 3. TIMBER STRUCTURE (COLUMNS & ROOF TRUSS) */}
              {layers.structure && (
                <g id="layer-structure">
                  {/* 7 Vertical Wooden Pillars (Pilares Maciços de Madeira Tratada) */}
                  {pillarXPositions.map((px, idx) => {
                    const isEdge = idx === 0 || idx === pillarCount - 1;
                    const pilarWidth = isEdge ? 14 : 12;

                    // Calculate the top Y where this pillar meets the truss lower chord or ridge
                    const topY = eaveHeightY;

                    return (
                      <g key={`pillar-${idx}`}>
                        {/* Main vertical wood column */}
                        <rect
                          x={px - pilarWidth / 2}
                          y={topY}
                          width={pilarWidth}
                          height={groundY - topY - 10}
                          fill={themeStyles.woodFill}
                          stroke={themeStyles.wood}
                          strokeWidth="2.4"
                        />
                        {/* Internal wood grain line */}
                        <line
                          x1={px}
                          y1={topY + 5}
                          x2={px}
                          y2={groundY - 15}
                          stroke={themeStyles.wood}
                          strokeWidth="0.8"
                          strokeDasharray="18 10 35 12"
                        />
                      </g>
                    );
                  })}

                  {/* Top Wall Plates / Vigas de Frechal & Lintels connecting pillar tops */}
                  <rect
                    x={wallLeft - 10}
                    y={eaveHeightY - 8}
                    width={buildingWidth + 20}
                    height="16"
                    fill={themeStyles.woodFill}
                    stroke={themeStyles.wood}
                    strokeWidth="2.2"
                  />

                  {/* === ROOF TRUSS (TESOURA DE MADEIRA TIPO SHED / TRELIÇA TRIANGULAR) === */}
                  {/* Bottom Chord (Tirante / Linha da Tesoura) */}
                  <rect
                    x={wallLeft - eaveOverhang + 15}
                    y={eaveHeightY - 12}
                    width={buildingWidth + 2 * eaveOverhang - 30}
                    height="14"
                    fill={themeStyles.woodFill}
                    stroke={themeStyles.wood}
                    strokeWidth="2.5"
                  />

                  {/* Upper Rafter Chords (Pernas da Tesoura / Banzo Superior Inclinado) */}
                  {/* Left Slope */}
                  <polygon
                    points={`
                      ${wallLeft - eaveOverhang},${eaveHeightY + 12}
                      ${wallLeft - eaveOverhang},${eaveHeightY - 2}
                      ${centerTrussX},${ridgeY - 14}
                      ${centerTrussX},${ridgeY}
                      ${wallLeft - eaveOverhang + 15},${eaveHeightY + 18}
                    `}
                    fill={themeStyles.woodFill}
                    stroke={themeStyles.wood}
                    strokeWidth="2.8"
                  />

                  {/* Right Slope */}
                  <polygon
                    points={`
                      ${wallRight + eaveOverhang},${eaveHeightY + 12}
                      ${wallRight + eaveOverhang},${eaveHeightY - 2}
                      ${centerTrussX},${ridgeY - 14}
                      ${centerTrussX},${ridgeY}
                      ${wallRight + eaveOverhang - 15},${eaveHeightY + 18}
                    `}
                    fill={themeStyles.woodFill}
                    stroke={themeStyles.wood}
                    strokeWidth="2.8"
                  />

                  {/* Ridge Cap & Zenithal Vent Opening (Lanternim de Cumeeira) */}
                  <polygon
                    points={`
                      ${centerTrussX - 35},${ridgeY - 8}
                      ${centerTrussX},${ridgeY - 26}
                      ${centerTrussX + 35},${ridgeY - 8}
                      ${centerTrussX + 28},${ridgeY - 2}
                      ${centerTrussX},${ridgeY - 18}
                      ${centerTrussX - 28},${ridgeY - 2}
                    `}
                    fill={themeStyles.woodFill}
                    stroke={themeStyles.wood}
                    strokeWidth="2"
                  />

                  {/* Central King Post (Pontalete Central de Cumeeira) */}
                  <rect
                    x={centerTrussX - 7}
                    y={ridgeY - 10}
                    width="14"
                    height={eaveHeightY - ridgeY}
                    fill={themeStyles.woodFill}
                    stroke={themeStyles.wood}
                    strokeWidth="2.4"
                  />

                  {/* Intermediate Vertical Posts (Montantes Verticais da Treliça) */}
                  {pillarXPositions.slice(1, -1).map((px, pIdx) => {
                    // Calculate truss upper line at this X
                    const distFromCenter = Math.abs(px - centerTrussX);
                    const slope = (eaveHeightY - ridgeY) / (buildingWidth / 2);
                    const localTrussY = ridgeY + distFromCenter * slope;

                    if (Math.abs(px - centerTrussX) < 10) return null; // King post handled above

                    return (
                      <g key={`post-${pIdx}`}>
                        <rect
                          x={px - 5.5}
                          y={localTrussY}
                          width="11"
                          height={eaveHeightY - localTrussY - 10}
                          fill={themeStyles.woodFill}
                          stroke={themeStyles.wood}
                          strokeWidth="2"
                        />
                      </g>
                    );
                  })}

                  {/* Diagonal Struts & Bracing (Diagonais / Escoras de Contraventamento da Tesoura) */}
                  {/* Left half diagonals */}
                  <line x1={pillarXPositions[0]} y1={eaveHeightY - 10} x2={pillarXPositions[1]} y2={ridgeY + (buildingWidth/2 - bayWidth)* ((eaveHeightY-ridgeY)/(buildingWidth/2))} stroke={themeStyles.wood} strokeWidth="3" />
                  <line x1={pillarXPositions[1]} y1={eaveHeightY - 10} x2={pillarXPositions[2]} y2={ridgeY + (buildingWidth/2 - 2*bayWidth)* ((eaveHeightY-ridgeY)/(buildingWidth/2))} stroke={themeStyles.wood} strokeWidth="3" />
                  <line x1={pillarXPositions[2]} y1={eaveHeightY - 10} x2={centerTrussX} y2={ridgeY} stroke={themeStyles.wood} strokeWidth="3" />

                  {/* Right half diagonals */}
                  <line x1={pillarXPositions[6]} y1={eaveHeightY - 10} x2={pillarXPositions[5]} y2={ridgeY + (buildingWidth/2 - bayWidth)* ((eaveHeightY-ridgeY)/(buildingWidth/2))} stroke={themeStyles.wood} strokeWidth="3" />
                  <line x1={pillarXPositions[5]} y1={eaveHeightY - 10} x2={pillarXPositions[4]} y2={ridgeY + (buildingWidth/2 - 2*bayWidth)* ((eaveHeightY-ridgeY)/(buildingWidth/2))} stroke={themeStyles.wood} strokeWidth="3" />
                  <line x1={pillarXPositions[4]} y1={eaveHeightY - 10} x2={centerTrussX} y2={ridgeY} stroke={themeStyles.wood} strokeWidth="3" />

                  {/* Roof Tile Rafters / Beiral Extensions */}
                  <line
                    x1={wallLeft - eaveOverhang - 5}
                    y1={eaveHeightY + 16}
                    x2={wallLeft + 20}
                    y2={eaveHeightY - 8}
                    stroke={themeStyles.wood}
                    strokeWidth="3.5"
                  />
                  <line
                    x1={wallRight + eaveOverhang + 5}
                    y1={eaveHeightY + 16}
                    x2={wallRight - 20}
                    y2={eaveHeightY - 8}
                    stroke={themeStyles.wood}
                    strokeWidth="3.5"
                  />

                  {/* === SIDE VENTILATION OPENINGS / LOUVERS (ABERTURAS LATERAIS NO BEIRAL) === */}
                  {/* Left Side Ventilation Box */}
                  <g id="left-vent-louver">
                    <rect
                      x={wallLeft - 6}
                      y={eaveHeightY + 8}
                      width="20"
                      height="54"
                      fill="#e0f2fe"
                      stroke={themeStyles.wood}
                      strokeWidth="2"
                    />
                    {/* Louver blades */}
                    <line x1={wallLeft - 4} y1={eaveHeightY + 18} x2={wallLeft + 12} y2={eaveHeightY + 14} stroke={themeStyles.wood} strokeWidth="1.8" />
                    <line x1={wallLeft - 4} y1={eaveHeightY + 28} x2={wallLeft + 12} y2={eaveHeightY + 24} stroke={themeStyles.wood} strokeWidth="1.8" />
                    <line x1={wallLeft - 4} y1={eaveHeightY + 38} x2={wallLeft + 12} y2={eaveHeightY + 34} stroke={themeStyles.wood} strokeWidth="1.8" />
                    <line x1={wallLeft - 4} y1={eaveHeightY + 48} x2={wallLeft + 12} y2={eaveHeightY + 44} stroke={themeStyles.wood} strokeWidth="1.8" />
                  </g>

                  {/* Right Side Ventilation Box */}
                  <g id="right-vent-louver">
                    <rect
                      x={wallRight - 14}
                      y={eaveHeightY + 8}
                      width="20"
                      height="54"
                      fill="#e0f2fe"
                      stroke={themeStyles.wood}
                      strokeWidth="2"
                    />
                    {/* Louver blades */}
                    <line x1={wallRight - 12} y1={eaveHeightY + 14} x2={wallRight + 4} y2={eaveHeightY + 18} stroke={themeStyles.wood} strokeWidth="1.8" />
                    <line x1={wallRight - 12} y1={eaveHeightY + 24} x2={wallRight + 4} y2={eaveHeightY + 28} stroke={themeStyles.wood} strokeWidth="1.8" />
                    <line x1={wallRight - 12} y1={eaveHeightY + 34} x2={wallRight + 4} y2={eaveHeightY + 38} stroke={themeStyles.wood} strokeWidth="1.8" />
                    <line x1={wallRight - 12} y1={eaveHeightY + 44} x2={wallRight + 4} y2={eaveHeightY + 48} stroke={themeStyles.wood} strokeWidth="1.8" />
                  </g>
                </g>
              )}

              {/* 4. GARLIC HANGING TIERS / VARAIS COM ALHO EM RAMA */}
              {layers.garlicRacks && (
                <g id="layer-garlic-racks">
                  {Array.from({ length: pillarCount - 1 }).map((_, bayIdx) => {
                    return Array.from({ length: levelsCount }).map((_, lvlIdx) => {
                      return renderGarlicRack(bayIdx, lvlIdx);
                    });
                  })}
                </g>
              )}

              {/* 5. AIRFLOW THERMODYNAMICS / EFEITO CHAMINÉ (VETORES AZUIS CURVOS) */}
              {layers.airflow && (
                <g id="layer-airflow" className={animatedFlow ? 'animate-pulse' : ''}>
                  {/* Left Inflow Arrow (Curva azul entrando pela abertura esquerda) */}
                  <path
                    d={`M ${wallLeft - 130} ${eaveHeightY + 70} 
                       C ${wallLeft - 80} ${eaveHeightY + 65}, ${wallLeft - 30} ${eaveHeightY + 45}, ${wallLeft + 30} ${eaveHeightY + 35}
                       S ${wallLeft + 120} ${eaveHeightY + 30}, ${wallLeft + 160} ${eaveHeightY + 32}`}
                    fill="none"
                    stroke={themeStyles.airStream}
                    strokeWidth="5"
                    strokeLinecap="round"
                    markerEnd="url(#arrow-blue)"
                    opacity="0.85"
                  />
                  {/* Air tube body left */}
                  <path
                    d={`M ${wallLeft - 130} ${eaveHeightY + 70} 
                       C ${wallLeft - 80} ${eaveHeightY + 65}, ${wallLeft - 30} ${eaveHeightY + 45}, ${wallLeft + 30} ${eaveHeightY + 35}
                       L ${wallLeft + 30} ${eaveHeightY + 22}
                       C ${wallLeft - 30} ${eaveHeightY + 32}, ${wallLeft - 80} ${eaveHeightY + 52}, ${wallLeft - 130} ${eaveHeightY + 58}
                       Z`}
                    fill={themeStyles.airFill}
                    stroke={themeStyles.airStream}
                    strokeWidth="1.2"
                  />

                  {/* Right Inflow Arrow (Curva azul entrando pela abertura direita) */}
                  <path
                    d={`M ${wallRight + 130} ${eaveHeightY + 50} 
                       C ${wallRight + 80} ${eaveHeightY + 45}, ${wallRight + 30} ${eaveHeightY + 35}, ${wallRight - 30} ${eaveHeightY + 30}
                       S ${wallRight - 120} ${eaveHeightY + 26}, ${wallRight - 160} ${eaveHeightY + 28}`}
                    fill="none"
                    stroke={themeStyles.airStream}
                    strokeWidth="5"
                    strokeLinecap="round"
                    markerEnd="url(#arrow-blue)"
                    opacity="0.85"
                  />
                  {/* Air tube body right */}
                  <path
                    d={`M ${wallRight + 130} ${eaveHeightY + 50} 
                       C ${wallRight + 80} ${eaveHeightY + 45}, ${wallRight + 30} ${eaveHeightY + 35}, ${wallRight - 30} ${eaveHeightY + 30}
                       L ${wallRight - 30} ${eaveHeightY + 18}
                       C ${wallRight + 30} ${eaveHeightY + 22}, ${wallRight + 80} ${eaveHeightY + 32}, ${wallRight + 130} ${eaveHeightY + 38}
                       Z`}
                    fill={themeStyles.airFill}
                    stroke={themeStyles.airStream}
                    strokeWidth="1.2"
                  />

                  {/* Upward Convective Flow Curves through the Truss (Exaustão Zenital) */}
                  <path
                    d={`M ${centerTrussX - 160} ${eaveHeightY - 10} 
                       C ${centerTrussX - 140} ${eaveHeightY - 60}, ${centerTrussX - 90} ${ridgeY + 80}, ${centerTrussX - 45} ${ridgeY + 15}
                       S ${centerTrussX - 20} ${ridgeY - 30}, ${centerTrussX - 5} ${ridgeY - 55}`}
                    fill="none"
                    stroke={themeStyles.airStream}
                    strokeWidth="4"
                    strokeLinecap="round"
                    markerEnd="url(#arrow-blue)"
                    strokeDasharray={animatedFlow ? "8 4" : "none"}
                    opacity="0.9"
                  />

                  <path
                    d={`M ${centerTrussX + 160} ${eaveHeightY - 10} 
                       C ${centerTrussX + 140} ${eaveHeightY - 60}, ${centerTrussX + 90} ${ridgeY + 80}, ${centerTrussX + 45} ${ridgeY + 15}
                       S ${centerTrussX + 20} ${ridgeY - 30}, ${centerTrussX + 5} ${ridgeY - 55}`}
                    fill="none"
                    stroke={themeStyles.airStream}
                    strokeWidth="4"
                    strokeLinecap="round"
                    markerEnd="url(#arrow-blue)"
                    strokeDasharray={animatedFlow ? "8 4" : "none"}
                    opacity="0.9"
                  />

                  {/* Inter-level thermal updraft micro-currents (Subindo entre as réstias) */}
                  {pillarXPositions.slice(0, -1).map((px, i) => {
                    const cx = px + bayWidth / 2;
                    return (
                      <path
                        key={`updraft-${i}`}
                        d={`M ${cx} ${groundY - 50} Q ${cx + (i % 2 === 0 ? 6 : -6)} ${groundY - 240} ${cx} ${eaveHeightY + 40}`}
                        fill="none"
                        stroke={themeStyles.airStream}
                        strokeWidth="1.8"
                        strokeDasharray="4 6"
                        opacity="0.45"
                      />
                    );
                  })}
                </g>
              )}

              {/* 6. TECHNICAL LABELS & CALLOUTS (IDÊNTICOS À IMAGEM FORNECIDA) */}
              {layers.annotations && (
                <g id="layer-annotations" className="font-sans">
                  {/* Callout 1: TESOURA DE MADEIRA TIPO SHED */}
                  <g id="callout-truss">
                    <line
                      x1={centerTrussX + 180}
                      y1={ridgeY - 45}
                      x2={centerTrussX + 70}
                      y2={ridgeY + 25}
                      stroke={themeStyles.annotationLeader}
                      strokeWidth="1.4"
                      markerEnd="url(#dot-leader)"
                    />
                    <text
                      x={centerTrussX + 185}
                      y={ridgeY - 48}
                      fill={themeStyles.annotation}
                      fontSize="14"
                      fontWeight="bold"
                      fontFamily="Architects Daughter, JetBrains Mono, sans-serif"
                    >
                      TESOURA DE MADEIRA TIPO SHED
                    </text>
                  </g>

                  {/* Callout 2: FLUXO DE AR NATURAL (Superior Esquerdo) */}
                  <g id="callout-airflow-top">
                    <line
                      x1={centerTrussX - 250}
                      y1={ridgeY - 25}
                      x2={centerTrussX - 110}
                      y2={ridgeY + 60}
                      stroke={themeStyles.annotationLeader}
                      strokeWidth="1.4"
                      markerEnd="url(#dot-leader)"
                    />
                    <text
                      x={centerTrussX - 255}
                      y={ridgeY - 28}
                      textAnchor="end"
                      fill={themeStyles.annotation}
                      fontSize="13"
                      fontWeight="bold"
                      fontFamily="Architects Daughter, JetBrains Mono, sans-serif"
                    >
                      FLUXO DE AR NATURAL
                    </text>
                  </g>

                  {/* Callout 3: ABERTURA DE VENTILAÇÃO NO BEIRAL (Lateral Esquerda) */}
                  <g id="callout-vent-left">
                    <line
                      x1={wallLeft - 140}
                      y1={eaveHeightY - 80}
                      x2={wallLeft - 4}
                      y2={eaveHeightY + 25}
                      stroke={themeStyles.annotationLeader}
                      strokeWidth="1.4"
                      markerEnd="url(#dot-leader)"
                    />
                    <text
                      x={wallLeft - 145}
                      y={eaveHeightY - 95}
                      textAnchor="end"
                      fill={themeStyles.annotation}
                      fontSize="13"
                      fontWeight="bold"
                      fontFamily="Architects Daughter, JetBrains Mono, sans-serif"
                    >
                      ABERTURA DE
                    </text>
                    <text
                      x={wallLeft - 145}
                      y={eaveHeightY - 78}
                      textAnchor="end"
                      fill={themeStyles.annotation}
                      fontSize="13"
                      fontWeight="bold"
                      fontFamily="Architects Daughter, JetBrains Mono, sans-serif"
                    >
                      VENTILAÇÃO NO
                    </text>
                    <text
                      x={wallLeft - 145}
                      y={eaveHeightY - 61}
                      textAnchor="end"
                      fill={themeStyles.annotation}
                      fontSize="13"
                      fontWeight="bold"
                      fontFamily="Architects Daughter, JetBrains Mono, sans-serif"
                    >
                      BEIRAL
                    </text>
                  </g>

                  {/* Callout 4: ABERTURA DE AR NATURAL / FLUXO DE AR NATURAL (Lateral Direita) */}
                  <g id="callout-vent-right">
                    <line
                      x1={wallRight + 120}
                      y1={eaveHeightY - 70}
                      x2={wallRight + 4}
                      y2={eaveHeightY + 25}
                      stroke={themeStyles.annotationLeader}
                      strokeWidth="1.4"
                      markerEnd="url(#dot-leader)"
                    />
                    <text
                      x={wallRight + 125}
                      y={eaveHeightY - 85}
                      fill={themeStyles.annotation}
                      fontSize="13"
                      fontWeight="bold"
                      fontFamily="Architects Daughter, JetBrains Mono, sans-serif"
                    >
                      ABERTURA DE
                    </text>
                    <text
                      x={wallRight + 125}
                      y={eaveHeightY - 68}
                      fill={themeStyles.annotation}
                      fontSize="13"
                      fontWeight="bold"
                      fontFamily="Architects Daughter, JetBrains Mono, sans-serif"
                    >
                      NATURAL
                    </text>

                    {/* Lower callout on right side */}
                    <line
                      x1={wallRight + 130}
                      y1={eaveHeightY + 80}
                      x2={wallRight + 12}
                      y2={eaveHeightY + 45}
                      stroke={themeStyles.annotationLeader}
                      strokeWidth="1.4"
                      markerEnd="url(#dot-leader)"
                    />
                    <text
                      x={wallRight + 135}
                      y={eaveHeightY + 75}
                      fill={themeStyles.annotation}
                      fontSize="12"
                      fontWeight="bold"
                      fontFamily="Architects Daughter, JetBrains Mono, sans-serif"
                    >
                      FLUXO DE AR
                    </text>
                    <text
                      x={wallRight + 135}
                      y={eaveHeightY + 92}
                      fill={themeStyles.annotation}
                      fontSize="12"
                      fontWeight="bold"
                      fontFamily="Architects Daughter, JetBrains Mono, sans-serif"
                    >
                      NATURAL
                    </text>
                  </g>

                  {/* Callout 5: ALHO EM RAMA PENDURADO P/ CURA */}
                  <g id="callout-garlic">
                    <line
                      x1={wallRight + 120}
                      y1={groundY - 210}
                      x2={pillarXPositions[5] + 80}
                      y2={groundY - 230}
                      stroke={themeStyles.annotationLeader}
                      strokeWidth="1.4"
                      markerEnd="url(#dot-leader)"
                    />
                    <text
                      x={wallRight + 125}
                      y={groundY - 225}
                      fill={themeStyles.annotation}
                      fontSize="13"
                      fontWeight="bold"
                      fontFamily="Architects Daughter, JetBrains Mono, sans-serif"
                    >
                      ALHO EM RAMA
                    </text>
                    <text
                      x={wallRight + 125}
                      y={groundY - 208}
                      fill={themeStyles.annotation}
                      fontSize="13"
                      fontWeight="bold"
                      fontFamily="Architects Daughter, JetBrains Mono, sans-serif"
                    >
                      PENDURADO
                    </text>
                    <text
                      x={wallRight + 125}
                      y={groundY - 191}
                      fill={themeStyles.annotation}
                      fontSize="13"
                      fontWeight="bold"
                      fontFamily="Architects Daughter, JetBrains Mono, sans-serif"
                    >
                      P/ CURA
                    </text>
                  </g>

                  {/* Callout 6: SOLO COMPACTADO (Centro) */}
                  <g id="callout-soil">
                    <line
                      x1={centerTrussX + 80}
                      y1={groundY + 85}
                      x2={centerTrussX + 20}
                      y2={groundY + 25}
                      stroke={themeStyles.annotationLeader}
                      strokeWidth="1.4"
                      markerEnd="url(#dot-leader)"
                    />
                    <text
                      x={centerTrussX + 85}
                      y={groundY + 90}
                      fill={themeStyles.annotation}
                      fontSize="13"
                      fontWeight="bold"
                      fontFamily="Architects Daughter, JetBrains Mono, sans-serif"
                    >
                      SOLO COMPACTADO
                    </text>
                  </g>

                  {/* Callout 7: SOLO COMPACTADO TREATED (Direita) */}
                  <g id="callout-soil-treated">
                    <line
                      x1={wallRight + 30}
                      y1={groundY + 45}
                      x2={wallRight + 2}
                      y2={groundY + 15}
                      stroke={themeStyles.annotationLeader}
                      strokeWidth="1.4"
                      markerEnd="url(#dot-leader)"
                    />
                    <text
                      x={wallRight + 35}
                      y={groundY + 40}
                      fill={themeStyles.annotation}
                      fontSize="13"
                      fontWeight="bold"
                      fontFamily="Architects Daughter, JetBrains Mono, sans-serif"
                    >
                      SOLO
                    </text>
                    <text
                      x={wallRight + 35}
                      y={groundY + 56}
                      fill={themeStyles.annotation}
                      fontSize="13"
                      fontWeight="bold"
                      fontFamily="Architects Daughter, JetBrains Mono, sans-serif"
                    >
                      COMPACTADO
                    </text>
                    <text
                      x={wallRight + 35}
                      y={groundY + 72}
                      fill={themeStyles.annotation}
                      fontSize="12"
                      fontWeight="bold"
                      fontFamily="Architects Daughter, JetBrains Mono, sans-serif"
                    >
                      TREATED
                    </text>
                  </g>

                  {/* MAIN TITLE BLOCK (CORTE LONGITUDINAL A-A' - Escala 1:150) */}
                  <g id="main-title-block" transform={`translate(${wallLeft - 100}, ${groundY + 80})`}>
                    <text
                      x="0"
                      y="0"
                      fill={themeStyles.title}
                      fontSize="20"
                      fontWeight="900"
                      textDecoration="underline"
                      letterSpacing="0.5"
                      fontFamily="JetBrains Mono, monospace, sans-serif"
                    >
                      CORTE LONGITUDINAL A-A'
                    </text>
                    <text
                      x="0"
                      y="20"
                      fill={themeStyles.inkSecondary}
                      fontSize="12"
                      fontWeight="600"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      (escala: 1:150)
                    </text>
                  </g>
                </g>
              )}

              {/* 7. ARCHITECTURAL DIMENSIONS & COTAS */}
              {layers.dimensions && (
                <g id="layer-dimensions" className="font-mono text-xs">
                  {/* Top Total Width Dimension (38.00m) */}
                  <g id="dim-total-width">
                    <line x1={wallLeft} y1={eaveHeightY - 100} x2={wallRight} y2={eaveHeightY - 100} stroke={themeStyles.annotationLeader} strokeWidth="1.2" />
                    <line x1={wallLeft} y1={eaveHeightY - 110} x2={wallLeft} y2={eaveHeightY - 90} stroke={themeStyles.annotationLeader} strokeWidth="1.5" />
                    <line x1={wallRight} y1={eaveHeightY - 110} x2={wallRight} y2={eaveHeightY - 90} stroke={themeStyles.annotationLeader} strokeWidth="1.5" />
                    
                    {/* Dimension witness extension lines */}
                    <line x1={wallLeft} y1={eaveHeightY - 90} x2={wallLeft} y2={eaveHeightY - 10} stroke={themeStyles.annotationLeader} strokeWidth="0.8" strokeDasharray="3 3" />
                    <line x1={wallRight} y1={eaveHeightY - 90} x2={wallRight} y2={eaveHeightY - 10} stroke={themeStyles.annotationLeader} strokeWidth="0.8" strokeDasharray="3 3" />
                    
                    <rect x={centerTrussX - 45} y={eaveHeightY - 112} width="90" height="20" fill={themeStyles.bg} rx="3" />
                    <text x={centerTrussX} y={eaveHeightY - 98} textAnchor="middle" fill={themeStyles.highlight} fontSize="13" fontWeight="bold">
                      38,00 m
                    </text>
                  </g>

                  {/* Bay by bay modular dimensions (6 vãos de ~6,33m) */}
                  {pillarXPositions.slice(0, -1).map((px, i) => {
                    const nextPx = pillarXPositions[i + 1];
                    const midX = (px + nextPx) / 2;
                    return (
                      <g key={`dim-bay-${i}`}>
                        <line x1={px} y1={groundY + 115} x2={nextPx} y2={groundY + 115} stroke={themeStyles.annotationLeader} strokeWidth="1" />
                        <line x1={px} y1={groundY + 108} x2={px} y2={groundY + 122} stroke={themeStyles.annotationLeader} strokeWidth="1.2" />
                        <line x1={nextPx} y1={groundY + 108} x2={nextPx} y2={groundY + 122} stroke={themeStyles.annotationLeader} strokeWidth="1.2" />
                        <text x={midX} y={groundY + 127} textAnchor="middle" fill={themeStyles.inkSecondary} fontSize="10">
                          6,33 m
                        </text>
                      </g>
                    );
                  })}

                  {/* Left Height Dimension: Pé-direito livre (15,50m) */}
                  <g id="dim-clear-height">
                    <line x1={wallLeft - 80} y1={groundY} x2={wallLeft - 80} y2={eaveHeightY} stroke={themeStyles.annotationLeader} strokeWidth="1.2" />
                    <line x1={wallLeft - 90} y1={groundY} x2={wallLeft - 70} y2={groundY} stroke={themeStyles.annotationLeader} strokeWidth="1.5" />
                    <line x1={wallLeft - 90} y1={eaveHeightY} x2={wallLeft - 70} y2={eaveHeightY} stroke={themeStyles.annotationLeader} strokeWidth="1.5" />
                    
                    <line x1={wallLeft - 70} y1={eaveHeightY} x2={wallLeft - 10} y2={eaveHeightY} stroke={themeStyles.annotationLeader} strokeWidth="0.8" strokeDasharray="3 3" />
                    <line x1={wallLeft - 70} y1={groundY} x2={wallLeft - 10} y2={groundY} stroke={themeStyles.annotationLeader} strokeWidth="0.8" strokeDasharray="3 3" />
                    
                    <text x={wallLeft - 88} y={(groundY + eaveHeightY) / 2} textAnchor="end" fill={themeStyles.highlight} fontSize="12" fontWeight="bold">
                      h = 15,50 m (Pé-Direito)
                    </text>
                  </g>

                  {/* Total Ridge Height Dimension: Altura total (18,00m) */}
                  <g id="dim-ridge-height">
                    <line x1={wallRight + 90} y1={groundY} x2={wallRight + 90} y2={ridgeY} stroke={themeStyles.annotationLeader} strokeWidth="1.2" />
                    <line x1={wallRight + 80} y1={groundY} x2={wallRight + 100} y2={groundY} stroke={themeStyles.annotationLeader} strokeWidth="1.5" />
                    <line x1={wallRight + 80} y1={ridgeY} x2={wallRight + 100} y2={ridgeY} stroke={themeStyles.annotationLeader} strokeWidth="1.5" />
                    
                    <line x1={centerTrussX} y1={ridgeY} x2={wallRight + 90} y2={ridgeY} stroke={themeStyles.annotationLeader} strokeWidth="0.8" strokeDasharray="3 3" />
                    <line x1={wallRight} y1={groundY} x2={wallRight + 90} y2={groundY} stroke={themeStyles.annotationLeader} strokeWidth="0.8" strokeDasharray="3 3" />
                    
                    <text x={wallRight + 98} y={(groundY + ridgeY) / 2} textAnchor="start" fill={themeStyles.highlight} fontSize="12" fontWeight="bold">
                      H = 18,00 m (Cumeeira)
                    </text>
                  </g>
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
