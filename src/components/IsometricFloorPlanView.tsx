import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Sparkles,
  Wind,
  Truck,
  Box,
  Eye,
  Sliders,
  Info,
  CheckCircle2,
  Package,
  ArrowUpRight,
  TrendingUp,
  Compass
} from 'lucide-react';
import { StructuralMetrics, BlueprintTheme } from '../types';

interface IsometricFloorPlanViewProps {
  metrics: StructuralMetrics;
}

export const IsometricFloorPlanView: React.FC<IsometricFloorPlanViewProps> = ({ metrics }) => {
  const [zoom, setZoom] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [theme, setTheme] = useState<BlueprintTheme>('graph-paper');
  const [showThemeMenu, setShowThemeMenu] = useState<boolean>(false);
  const [showLayersMenu, setShowLayersMenu] = useState<boolean>(false);
  const [isImmersive, setIsImmersive] = useState<boolean>(false);
  const [explodedLevel, setExplodedLevel] = useState<number>(0); // 0% to 100%
  const [selectedTier, setSelectedTier] = useState<number | 'all'>('all');
  const [hoveredElement, setHoveredElement] = useState<{
    title: string;
    description: string;
    spec: string;
    load?: string;
  } | null>(null);

  // Layers toggle
  const [layers, setLayers] = useState({
    slab: true,
    pillars: true,
    garlicTiers: true,
    mezzanine: true,
    roofTrusses: true,
    roofCovering: false,
    airflow: true,
    truck: true,
    dimensions: true,
    grid: true,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; dist?: number }>({ x: 0, y: 0 });

  const svgWidth = 1280;
  const svgHeight = 920;

  // Auto-fit function
  const handleFitToScreen = () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    if (containerWidth === 0 || containerHeight === 0) return;

    const padding = window.innerWidth < 640 ? 16 : 40;
    const scaleX = (containerWidth - padding) / svgWidth;
    const scaleY = (containerHeight - padding) / svgHeight;
    const fitScale = Math.max(Math.min(scaleX, scaleY), 0.3);

    setZoom(fitScale);
    setPan({ x: 0, y: 20 });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitToScreen();
    }, 100);

    const handleResize = () => handleFitToScreen();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 3.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.25));
  const handleResetZoom = () => handleFitToScreen();

  // Mouse pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    touchStartRef.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - touchStartRef.current.x,
      y: e.clientY - touchStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch pan & pinch zoom
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
        setZoom((prev) => Math.max(Math.min(prev * factor, 3.5), 0.25));
        touchStartRef.current.dist = newDist;
      }
    }
  };

  const handleTouchEnd = () => setIsDragging(false);

  // Theme palettes
  const getThemeStyles = () => {
    switch (theme) {
      case 'graph-paper':
        return {
          bg: '#FCFBF7',
          gridLine: '#E5DFD5',
          woodMain: '#8C6239',
          woodDark: '#5E3E1E',
          woodLight: '#D2B48C',
          woodTop: '#F4ECE1',
          garlicDot: '#5C381E',
          garlicTier: '#D97706',
          garlicTierFill: '#FEF3C7',
          slabTop: '#EAE6DC',
          slabSide: '#D5CFC3',
          slabFront: '#C3BCAD',
          louverColor: '#0284C7',
          louverFill: '#BAE6FD',
          doorColor: '#0284C7',
          textMain: '#1F2937',
          textSub: '#4B5563',
          dimLine: '#3E2723',
          truckBody: '#475569',
          roofTruss: '#8C6239',
          airCool: '#0284C7',
          airWarm: '#EA580C',
        };
      case 'blueprint-blue':
        return {
          bg: '#0F2744',
          gridLine: '#1E3E66',
          woodMain: '#38BDF8',
          woodDark: '#0369A1',
          woodLight: '#7DD3FC',
          woodTop: '#1E40AF',
          garlicDot: '#FDE047',
          garlicTier: '#FBBF24',
          garlicTierFill: '#78350F',
          slabTop: '#163359',
          slabSide: '#0C2340',
          slabFront: '#091A30',
          louverColor: '#7DD3FC',
          louverFill: '#0C4A6E',
          doorColor: '#7DD3FC',
          textMain: '#F0F9FF',
          textSub: '#93C5FD',
          dimLine: '#38BDF8',
          truckBody: '#38BDF8',
          roofTruss: '#38BDF8',
          airCool: '#38BDF8',
          airWarm: '#F87171',
        };
      case 'realistic-wood':
        return {
          bg: '#18130F',
          gridLine: '#2B2018',
          woodMain: '#C1844D',
          woodDark: '#6A411F',
          woodLight: '#E6A86C',
          woodTop: '#8A5328',
          garlicDot: '#FDE68A',
          garlicTier: '#F59E0B',
          garlicTierFill: '#451A03',
          slabTop: '#383431',
          slabSide: '#292624',
          slabFront: '#1E1B19',
          louverColor: '#38BDF8',
          louverFill: '#0C4A6E',
          doorColor: '#38BDF8',
          textMain: '#FEF3C7',
          textSub: '#D4A373',
          dimLine: '#D4A373',
          truckBody: '#64748B',
          roofTruss: '#D4A373',
          airCool: '#38BDF8',
          airWarm: '#F97316',
        };
      case 'cad-dark':
      default:
        return {
          bg: '#0A0A0A',
          gridLine: '#1B1B1B',
          woodMain: '#D4A373',
          woodDark: '#8C6239',
          woodLight: '#F3D2B5',
          woodTop: '#3D2817',
          garlicDot: '#FDE68A',
          garlicTier: '#F59E0B',
          garlicTierFill: '#2E1E14',
          slabTop: '#1E1E1E',
          slabSide: '#151515',
          slabFront: '#0F0F0F',
          louverColor: '#38BDF8',
          louverFill: '#1E293B',
          doorColor: '#38BDF8',
          textMain: '#E5E7EB',
          textSub: '#9CA3AF',
          dimLine: '#D4A373',
          truckBody: '#4ADE80',
          roofTruss: '#D4A373',
          airCool: '#38BDF8',
          airWarm: '#FB923C',
        };
    }
  };

  const ts = getThemeStyles();

  // ================= 3D ISOMETRIC ENGINE (45° PERSPECTIVE) =================
  // Mathematical isometric projection: 30° / 30° angle
  const originX = 640;
  const originY = 560;
  const isoCos = Math.cos((30 * Math.PI) / 180); // ~0.866
  const isoSin = Math.sin((30 * Math.PI) / 180); // ~0.500

  // Scales for building: width (X: 0 to 400), length (Y: 0 to 600), height (Z: 0 to 220)
  const toIso = (x: number, y: number, z: number = 0) => {
    const ix = originX + (x - y) * isoCos;
    const iy = originY + (x + y) * isoSin - z;
    return { x: ix, y: iy };
  };

  // Convert 3D Point to string for SVG polygon
  const pt = (x: number, y: number, z: number = 0) => {
    const p = toIso(x, y, z);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  };

  // Exploded offsets
  const explodeFactor = explodedLevel / 100;
  const zOffsetSlab = 0;
  const zOffsetTier1 = explodeFactor * 25;
  const zOffsetTier2 = explodeFactor * 55;
  const zOffsetTier3 = explodeFactor * 85;
  const zOffsetTier4 = explodeFactor * 115;
  const zOffsetTier5 = explodeFactor * 145;
  const zOffsetTier6 = explodeFactor * 175;
  const zOffsetMezzanine = explodeFactor * 200;
  const zOffsetRoof = explodeFactor * 240;

  // Geometry dimensions in isometric space
  const barnW = 420; // Width across bays (X axis)
  const barnL = 600; // Length along building (Y axis)
  const slabThickness = 14;

  // Pillar grid coordinates
  // 4 Pillar lines across X: 0 (Left), 130 (Mid-Left), 290 (Mid-Right), 420 (Right)
  // With 25.00m central driveway / corridor between X=130 and X=290
  const pillarColsX = [15, 140, 280, 405];
  // 7 Bents along Y axis
  const pillarRowsY = [20, 110, 200, 290, 380, 470, 560];
  const postH = 150; // Pillar height before roof

  return (
    <div className={`flex flex-col h-full bg-[#0F0F0F] text-[#E5E7EB] overflow-hidden select-none relative ${isImmersive ? 'fixed inset-0 z-50' : ''}`}>
      {/* Top Control Bar */}
      {!isImmersive && (
        <div className="bg-[#111111] border-b border-[#2D2D2D] z-10 shrink-0">
          <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5 overflow-x-auto scrollbar-none">
            {/* Title & Badge */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="px-2 py-0.5 bg-[#1A1A1A] text-[#D4A373] font-mono text-[11px] sm:text-xs font-bold rounded border border-[#2D2D2D] flex items-center gap-1.5 shadow-xs">
                <Compass className="w-3.5 h-3.5 text-[#D4A373]" />
                <span>ISOMÉTRICA 45°</span>
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-serif font-bold text-[#D4A373] tracking-tight flex items-center gap-1.5">
                  VISÃO ESPACIAL DO ESTALEIRO
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1A1A1A] text-[#D4A373] font-mono border border-[#D4A373]/30">
                    Axonométrica 2D
                  </span>
                </h2>
              </div>
            </div>

            {/* Quick Tier Filter Buttons */}
            <div className="hidden xl:flex items-center gap-1 bg-[#1A1A1A] p-0.5 rounded border border-[#2D2D2D] text-[11px] font-mono">
              <span className="text-[#6B7280] px-1.5">Níveis:</span>
              <button
                onClick={() => setSelectedTier('all')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  selectedTier === 'all' ? 'bg-[#D4A373] text-[#0F0F0F] font-bold' : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                Todos (1-6)
              </button>
              {[1, 2, 3, 4, 5, 6].map((lvl) => (
                <button
                  key={`filter-tier-${lvl}`}
                  onClick={() => setSelectedTier(lvl)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    selectedTier === lvl ? 'bg-[#D4A373] text-[#0F0F0F] font-bold' : 'text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  N{lvl}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Exploded View Slider */}
              <div className="flex items-center gap-1.5 bg-[#1A1A1A] px-2 py-1 rounded border border-[#2D2D2D]">
                <Sliders className="w-3.5 h-3.5 text-[#D4A373]" />
                <span className="hidden sm:inline text-[11px] font-mono text-[#9CA3AF]">Explodir:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={explodedLevel}
                  onChange={(e) => setExplodedLevel(Number(e.target.value))}
                  className="w-16 sm:w-24 h-1.5 bg-[#262626] rounded-lg appearance-none cursor-pointer accent-[#D4A373]"
                  title="Visão Explodida dos Níveis"
                />
                <span className="text-[10px] font-mono text-[#D4A373] w-6 text-right">
                  {explodedLevel}%
                </span>
              </div>

              {/* Fit Screen */}
              <button
                onClick={handleFitToScreen}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[#1A1A1A] hover:bg-[#262626] text-[#D4A373] rounded border border-[#2D2D2D] font-semibold transition-colors"
                title="Ajustar à Tela"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#D4A373]" />
                <span className="hidden xs:inline text-[11px]">Ajustar</span>
              </button>

              {/* Zoom Buttons */}
              <div className="flex items-center bg-[#1A1A1A] rounded border border-[#2D2D2D] p-0.5">
                <button
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
                  onClick={handleZoomIn}
                  className="p-1 text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#262626] rounded"
                  title="Aproximar (+)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="p-1 text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#262626] rounded border-l border-[#2D2D2D]"
                  title="Redefinir"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>

              {/* Layers Button */}
              <button
                onClick={() => setShowLayersMenu(!showLayersMenu)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition-colors ${
                  showLayersMenu
                    ? 'bg-[#26201a] border-[#D4A373] text-[#D4A373] font-semibold'
                    : 'bg-[#1A1A1A] border-[#2D2D2D] text-[#9CA3AF] hover:text-[#E5E7EB]'
                }`}
                title="Camadas Isométricas"
              >
                <Layers className="w-3.5 h-3.5 text-[#D4A373]" />
                <span className="text-[11px]">Camadas</span>
              </button>

              {/* Theme Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowThemeMenu(!showThemeMenu)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[#1A1A1A] hover:bg-[#262626] text-[#9CA3AF] hover:text-[#E5E7EB] rounded border border-[#2D2D2D] transition-colors"
                  title="Alterar Tema CAD"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        theme === 'cad-dark'
                          ? '#111'
                          : theme === 'blueprint-blue'
                          ? '#0f2744'
                          : theme === 'graph-paper'
                          ? '#fcfbf7'
                          : '#2b1b11',
                      border: '1px solid #D4A373',
                    }}
                  ></span>
                  <span className="hidden sm:inline text-[11px] capitalize">
                    {theme === 'graph-paper' ? 'Papel Técnico' : theme === 'cad-dark' ? 'Dark CAD' : theme === 'blueprint-blue' ? 'Blueprint' : 'Madeira'}
                  </span>
                </button>

                {showThemeMenu && (
                  <div className="absolute right-0 top-full mt-1.5 z-40 bg-[#1A1A1A] border border-[#2D2D2D] rounded shadow-2xl p-1 w-40 font-mono text-xs animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => {
                        setTheme('graph-paper');
                        setShowThemeMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between ${
                        theme === 'graph-paper' ? 'bg-[#262626] text-[#D4A373] font-bold' : 'text-[#9CA3AF] hover:bg-[#222]'
                      }`}
                    >
                      <span>Papel Técnico</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#fcfbf7] border border-[#ccc]"></span>
                    </button>
                    <button
                      onClick={() => {
                        setTheme('cad-dark');
                        setShowThemeMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between ${
                        theme === 'cad-dark' ? 'bg-[#262626] text-[#D4A373] font-bold' : 'text-[#9CA3AF] hover:bg-[#222]'
                      }`}
                    >
                      <span>Dark CAD</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#111] border border-[#555]"></span>
                    </button>
                    <button
                      onClick={() => {
                        setTheme('blueprint-blue');
                        setShowThemeMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between ${
                        theme === 'blueprint-blue' ? 'bg-[#262626] text-[#D4A373] font-bold' : 'text-[#9CA3AF] hover:bg-[#222]'
                      }`}
                    >
                      <span>Blueprint Azul</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0f2744] border border-[#38bdf8]"></span>
                    </button>
                  </div>
                )}
              </div>

              {/* Fullscreen / Focus Mode */}
              <button
                onClick={() => setIsImmersive(true)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[#1A1A1A] hover:bg-[#262626] text-[#9CA3AF] hover:text-white rounded border border-[#2D2D2D] transition-colors"
                title="Modo Tela Cheia"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#D4A373]" />
                <span className="hidden md:inline text-[11px]">Foco</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Exit Button for Immersive Mode */}
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
        {/* Layers Drawer */}
        {showLayersMenu && (
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-40 bg-[#1A1A1A]/95 backdrop-blur-xs border border-[#2D2D2D] rounded p-3 shadow-2xl text-xs w-64 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2D2D2D]">
              <span className="font-bold text-[#D4A373] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Camadas Isométricas
              </span>
              <button
                onClick={() => setShowLayersMenu(false)}
                className="text-[#9CA3AF] hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 text-[#E5E7EB] cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={layers.slab}
                  onChange={(e) => setLayers({ ...layers, slab: e.target.checked })}
                  className="rounded accent-[#D4A373] w-4 h-4 bg-[#262626] border-[#2D2D2D]"
                />
                <span>Piso de Concreto Simples</span>
              </label>

              <label className="flex items-center gap-2.5 text-[#E5E7EB] cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={layers.pillars}
                  onChange={(e) => setLayers({ ...layers, pillars: e.target.checked })}
                  className="rounded accent-[#D4A373] w-4 h-4 bg-[#262626] border-[#2D2D2D]"
                />
                <span>Pilares 25×25cm & Vigas</span>
              </label>

              <label className="flex items-center gap-2.5 text-[#E5E7EB] cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={layers.garlicTiers}
                  onChange={(e) => setLayers({ ...layers, garlicTiers: e.target.checked })}
                  className="rounded accent-[#D97706] w-4 h-4 bg-[#262626] border-[#2D2D2D]"
                />
                <span>Níveis de Carga (Estaleiros de Alho)</span>
              </label>

              <label className="flex items-center gap-2.5 text-[#E5E7EB] cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={layers.mezzanine}
                  onChange={(e) => setLayers({ ...layers, mezzanine: e.target.checked })}
                  className="rounded accent-[#D4A373] w-4 h-4 bg-[#262626] border-[#2D2D2D]"
                />
                <span>Passarelas & Corredor Central</span>
              </label>

              <label className="flex items-center gap-2.5 text-[#E5E7EB] cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={layers.roofTrusses}
                  onChange={(e) => setLayers({ ...layers, roofTrusses: e.target.checked })}
                  className="rounded accent-[#D4A373] w-4 h-4 bg-[#262626] border-[#2D2D2D]"
                />
                <span>Tesouras de Cobertura & Lanternim</span>
              </label>

              <label className="flex items-center gap-2.5 text-[#E5E7EB] cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={layers.roofCovering}
                  onChange={(e) => setLayers({ ...layers, roofCovering: e.target.checked })}
                  className="rounded accent-[#D4A373] w-4 h-4 bg-[#262626] border-[#2D2D2D]"
                />
                <span>Telhado Completo (Opaque)</span>
              </label>

              <label className="flex items-center gap-2.5 text-[#E5E7EB] cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={layers.truck}
                  onChange={(e) => setLayers({ ...layers, truck: e.target.checked })}
                  className="rounded accent-[#4ADE80] w-4 h-4 bg-[#262626] border-[#2D2D2D]"
                />
                <span>Caminhão na Baia de Descarga</span>
              </label>

              <label className="flex items-center gap-2.5 text-[#E5E7EB] cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={layers.airflow}
                  onChange={(e) => setLayers({ ...layers, airflow: e.target.checked })}
                  className="rounded accent-[#38BDF8] w-4 h-4 bg-[#262626] border-[#2D2D2D]"
                />
                <span>Fluxo Convectivo de Ar (Termodinâmica)</span>
              </label>

              <label className="flex items-center gap-2.5 text-[#E5E7EB] cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={layers.dimensions}
                  onChange={(e) => setLayers({ ...layers, dimensions: e.target.checked })}
                  className="rounded accent-[#D4A373] w-4 h-4 bg-[#262626] border-[#2D2D2D]"
                />
                <span>Cotas Isométricas (80m × 90m × 18m)</span>
              </label>
            </div>
          </div>
        )}

        {/* Hover Information Overlay Box */}
        {hoveredElement && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-[#1A1A1A]/95 backdrop-blur-md border border-[#D4A373] text-[#E5E7EB] px-4 py-2.5 rounded shadow-2xl max-w-md pointer-events-none animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between gap-4 border-b border-[#2D2D2D] pb-1 mb-1">
              <span className="font-serif font-bold text-sm text-[#D4A373]">
                {hoveredElement.title}
              </span>
              {hoveredElement.load && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#D4A373]/20 text-[#D4A373] rounded border border-[#D4A373]/40">
                  {hoveredElement.load}
                </span>
              )}
            </div>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              {hoveredElement.description}
            </p>
            <div className="text-[11px] font-mono text-[#D4A373] mt-1 font-semibold">
              Dimensão / Norma: {hoveredElement.spec}
            </div>
          </div>
        )}

        {/* Bottom Floating Legend / Specs */}
        <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-20 pointer-events-none">
          <div className="bg-[#1A1A1A]/90 text-[#E5E7EB] backdrop-blur-xs px-3 py-2 rounded border border-[#2D2D2D] shadow-lg text-[11px] sm:text-xs font-mono flex flex-wrap items-center gap-3">
            <div>
              <span className="text-[#6B7280]">PERSPECTIVA:</span>{' '}
              <span className="text-white font-medium">Axonométrica Isométrica 45°</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-[#6B7280]">ESTRUTURA:</span>{' '}
              <span className="text-[#D4A373] font-bold">Madeira Maciça Rolada/Serrada</span>
            </div>
            <div>
              <span className="text-[#6B7280]">CARGA TOTAL:</span>{' '}
              <span className="text-[#F59E0B] font-bold">530.000 kg (530t)</span>
            </div>
            <div>
              <span className="text-[#6B7280]">NÍVEIS:</span>{' '}
              <span className="text-[#38BDF8] font-bold">6 Níveis Úteis</span>
            </div>
          </div>
        </div>

        {/* SVG Drawing Canvas */}
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
              width={svgWidth}
              height={svgHeight}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              style={{ backgroundColor: ts.bg }}
              className="rounded shadow-2xl border border-[#2D2D2D]"
            >
              <defs>
                {/* Technical Millimeter Grid Pattern */}
                <pattern id="iso-grid-pattern" width="28" height="28" patternUnits="userSpaceOnUse">
                  <path d="M 28 0 L 0 0 0 28" fill="none" stroke={ts.gridLine} strokeWidth="0.5" />
                </pattern>

                {/* Garlic Rack Dot Pattern */}
                <pattern id="iso-garlic-texture" width="12" height="12" patternUnits="userSpaceOnUse">
                  <circle cx="6" cy="6" r="2.5" fill={ts.garlicDot} opacity="0.85" />
                </pattern>

                {/* Linear Gradients for 3D Lighting */}
                <linearGradient id="iso-wood-beam" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={ts.woodLight} />
                  <stop offset="100%" stopColor={ts.woodMain} />
                </linearGradient>

                <linearGradient id="iso-wood-pillar" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={ts.woodLight} />
                  <stop offset="50%" stopColor={ts.woodMain} />
                  <stop offset="100%" stopColor={ts.woodDark} />
                </linearGradient>

                <linearGradient id="iso-slab-top" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={ts.slabTop} />
                  <stop offset="100%" stopColor={ts.slabSide} />
                </linearGradient>

                <linearGradient id="air-gradient-cool" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0284C7" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.2" />
                </linearGradient>

                <linearGradient id="air-gradient-warm" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0.9" />
                </linearGradient>

                {/* Arrow markers */}
                <marker id="iso-dim-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                  <path d="M 0 2 L 8 5 L 0 8 z" fill={ts.dimLine} />
                </marker>

                <marker id="air-arrow-cool" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 2 L 8 5 L 0 8 z" fill="#38BDF8" />
                </marker>

                <marker id="air-arrow-warm" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 2 L 8 5 L 0 8 z" fill="#EF4444" />
                </marker>
              </defs>

              {/* Background Grid */}
              {layers.grid && <rect width={svgWidth} height={svgHeight} fill="url(#iso-grid-pattern)" />}

              {/* ================= 1. CONCRETE BASE SLAB & DRIVEWAY (NÍVEL 0.00) ================= */}
              {layers.slab && (
                <g id="iso-concrete-slab" className="transition-all duration-300">
                  {/* Surrounding Ground Perimeter Lines */}
                  <polygon
                    points={`${pt(-40, -40, zOffsetSlab)} ${pt(barnW + 40, -40, zOffsetSlab)} ${pt(barnW + 40, barnL + 40, zOffsetSlab)} ${pt(-40, barnL + 40, zOffsetSlab)}`}
                    fill="none"
                    stroke={ts.gridLine}
                    strokeWidth="1"
                    strokeDasharray="6 6"
                  />

                  {/* Concrete Slab Top Face */}
                  <polygon
                    points={`${pt(0, 0, zOffsetSlab)} ${pt(barnW, 0, zOffsetSlab)} ${pt(barnW, barnL, zOffsetSlab)} ${pt(0, barnL, zOffsetSlab)}`}
                    fill="url(#iso-slab-top)"
                    stroke={ts.woodMain}
                    strokeWidth="1.2"
                    onMouseEnter={() =>
                      setHoveredElement({
                        title: 'Piso de Concreto Simples (Nível 0.00)',
                        description: 'Radier/Laje de concreto armado simples de alta resistência para tráfego pesado e estocagem.',
                        spec: 'fck ≥ 25 MPa | Espessura 15cm | Malha Q-196',
                        load: 'Sobrecarga: 4.500 kg/m²',
                      })
                    }
                    onMouseLeave={() => setHoveredElement(null)}
                  />

                  {/* Concrete Slab Front Edge (Left Side) */}
                  <polygon
                    points={`${pt(0, barnL, zOffsetSlab)} ${pt(barnW, barnL, zOffsetSlab)} ${pt(barnW, barnL, zOffsetSlab - slabThickness)} ${pt(0, barnL, zOffsetSlab - slabThickness)}`}
                    fill={ts.slabFront}
                    stroke={ts.woodMain}
                    strokeWidth="1"
                  />

                  {/* Concrete Slab Side Edge (Right Side) */}
                  <polygon
                    points={`${pt(barnW, 0, zOffsetSlab)} ${pt(barnW, barnL, zOffsetSlab)} ${pt(barnW, barnL, zOffsetSlab - slabThickness)} ${pt(barnW, 0, zOffsetSlab - slabThickness)}`}
                    fill={ts.slabSide}
                    stroke={ts.woodMain}
                    strokeWidth="1"
                  />

                  {/* Concrete Slab Left Edge */}
                  <polygon
                    points={`${pt(0, 0, zOffsetSlab)} ${pt(0, barnL, zOffsetSlab)} ${pt(0, barnL, zOffsetSlab - slabThickness)} ${pt(0, 0, zOffsetSlab - slabThickness)}`}
                    fill={ts.slabSide}
                    stroke={ts.woodMain}
                    strokeWidth="1"
                  />

                  {/* Central Logistics Corridor Road Strip (25.00m width aisle) */}
                  <polygon
                    points={`${pt(140, 0, zOffsetSlab + 0.5)} ${pt(280, 0, zOffsetSlab + 0.5)} ${pt(280, barnL, zOffsetSlab + 0.5)} ${pt(140, barnL, zOffsetSlab + 0.5)}`}
                    fill={theme === 'graph-paper' ? '#DFD9CD' : '#141414'}
                    stroke={ts.woodMain}
                    strokeWidth="0.8"
                    strokeDasharray="4 4"
                  />

                  {/* Road Center Line (Marcador de Tráfego de Caminhões) */}
                  <line
                    x1={toIso(210, 0, zOffsetSlab + 1).x}
                    y1={toIso(210, 0, zOffsetSlab + 1).y}
                    x2={toIso(210, barnL, zOffsetSlab + 1).x}
                    y2={toIso(210, barnL, zOffsetSlab + 1).y}
                    stroke={ts.woodLight}
                    strokeWidth="1.2"
                    strokeDasharray="10 8"
                  />

                  {/* Pillar Concrete Footing Blocks (Sapatas Isoladas dos Pilares) */}
                  {pillarColsX.map((px) =>
                    pillarRowsY.map((py) => (
                      <g key={`footing-${px}-${py}`}>
                        <polygon
                          points={`${pt(px - 6, py - 6, zOffsetSlab + 2)} ${pt(px + 6, py - 6, zOffsetSlab + 2)} ${pt(px + 6, py + 6, zOffsetSlab + 2)} ${pt(px - 6, py + 6, zOffsetSlab + 2)}`}
                          fill={ts.woodDark}
                          stroke={ts.woodMain}
                          strokeWidth="0.8"
                        />
                      </g>
                    ))
                  )}
                </g>
              )}

              {/* ================= 2. TRUCK ON LOGISTICS BAY (CAMINHÃO 3.50m) ================= */}
              {layers.truck && (
                <g
                  id="iso-unloading-truck"
                  className="cursor-pointer"
                  onMouseEnter={() =>
                    setHoveredElement({
                      title: 'Caminhão de Descarga (Vaga 3,50m)',
                      description: 'Baia de descarregamento rápido direto sob os estaleiros para abastecimento vertical dos níveis 1 a 6.',
                      spec: 'Giro livre no corredor de 25m | Capacidade: 15.000 kg/viagem',
                      load: 'Carga viva de circulação: 300 kN',
                    })
                  }
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  {/* Positioned inside central aisle near Y=120 */}
                  {(() => {
                    const tx = 185;
                    const ty = 80;
                    const tw = 50;
                    const tl = 110;
                    const th = 40;
                    const cabinL = 35;
                    const cabinH = 32;

                    return (
                      <g>
                        {/* Truck Shadows */}
                        <polygon
                          points={`${pt(tx - 4, ty - 4, zOffsetSlab + 1)} ${pt(tx + tw + 4, ty - 4, zOffsetSlab + 1)} ${pt(tx + tw + 4, ty + tl + 4, zOffsetSlab + 1)} ${pt(tx - 4, ty + tl + 4, zOffsetSlab + 1)}`}
                          fill="#000000"
                          opacity="0.25"
                        />

                        {/* Truck Cargo Box (Caçamba de Alho) */}
                        {/* Left Face */}
                        <polygon
                          points={`${pt(tx, ty + cabinL, zOffsetSlab + 8)} ${pt(tx, ty + tl, zOffsetSlab + 8)} ${pt(tx, ty + tl, zOffsetSlab + 8 + th)} ${pt(tx, ty + cabinL, zOffsetSlab + 8 + th)}`}
                          fill="#1E293B"
                          stroke="#475569"
                          strokeWidth="1"
                        />
                        {/* Front Face */}
                        <polygon
                          points={`${pt(tx, ty + tl, zOffsetSlab + 8)} ${pt(tx + tw, ty + tl, zOffsetSlab + 8)} ${pt(tx + tw, ty + tl, zOffsetSlab + 8 + th)} ${pt(tx, ty + tl, zOffsetSlab + 8 + th)}`}
                          fill="#0F172A"
                          stroke="#475569"
                          strokeWidth="1"
                        />
                        {/* Top Face */}
                        <polygon
                          points={`${pt(tx, ty + cabinL, zOffsetSlab + 8 + th)} ${pt(tx + tw, ty + cabinL, zOffsetSlab + 8 + th)} ${pt(tx + tw, ty + tl, zOffsetSlab + 8 + th)} ${pt(tx, ty + tl, zOffsetSlab + 8 + th)}`}
                          fill="#334155"
                          stroke="#475569"
                          strokeWidth="1"
                        />

                        {/* Truck Cabin (Cabine Dianteira) */}
                        {/* Cabin Top */}
                        <polygon
                          points={`${pt(tx + 4, ty, zOffsetSlab + 8 + cabinH)} ${pt(tx + tw - 4, ty, zOffsetSlab + 8 + cabinH)} ${pt(tx + tw - 4, ty + cabinL, zOffsetSlab + 8 + cabinH)} ${pt(tx + 4, ty + cabinL, zOffsetSlab + 8 + cabinH)}`}
                          fill="#38BDF8"
                          stroke="#0284C7"
                          strokeWidth="1"
                        />
                        {/* Cabin Left */}
                        <polygon
                          points={`${pt(tx + 4, ty, zOffsetSlab + 8)} ${pt(tx + 4, ty + cabinL, zOffsetSlab + 8)} ${pt(tx + 4, ty + cabinL, zOffsetSlab + 8 + cabinH)} ${pt(tx + 4, ty, zOffsetSlab + 8 + cabinH)}`}
                          fill="#0284C7"
                          stroke="#0369A1"
                          strokeWidth="1"
                        />
                        {/* Cabin Windshield */}
                        <polygon
                          points={`${pt(tx + 6, ty + 2, zOffsetSlab + 18)} ${pt(tx + tw - 6, ty + 2, zOffsetSlab + 18)} ${pt(tx + tw - 6, ty + 12, zOffsetSlab + 8 + cabinH - 2)} ${pt(tx + 6, ty + 12, zOffsetSlab + 8 + cabinH - 2)}`}
                          fill="#BAE6FD"
                          stroke="#38BDF8"
                          strokeWidth="0.8"
                        />

                        {/* Cargo slats / Feixes de Alho no caminhão */}
                        <text
                          x={toIso(tx + tw / 2, ty + tl / 2 + 10, zOffsetSlab + th + 12).x}
                          y={toIso(tx + tw / 2, ty + tl / 2 + 10, zOffsetSlab + th + 12).y}
                          fill="#FDE68A"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          ALHO EM RAMA (15t)
                        </text>
                      </g>
                    );
                  })()}
                </g>
              )}

              {/* ================= 3. TIMBER PILLARS 25x25cm (PILARES MESTRES) ================= */}
              {layers.pillars && (
                <g id="iso-timber-pillars">
                  {pillarColsX.map((px, colIdx) =>
                    pillarRowsY.map((py, rowIdx) => {
                      const pw = 7; // 25cm in scale
                      const ph = postH;

                      return (
                        <g
                          key={`pillar-3d-${colIdx}-${rowIdx}`}
                          className="cursor-pointer"
                          onMouseEnter={() =>
                            setHoveredElement({
                              title: `Pilar Mestre de Madeira 25×25cm (Eixo ${String.fromCharCode(65 + colIdx)}-${rowIdx + 1})`,
                              description: 'Pilar estrutural maciço em Eucalipto Citriodora tratado / Garapeira para suportar até 6 níveis de estaleiros.',
                              spec: 'Seção: 250×250 mm | fc0,k ≥ 54 MPa | Classe C40/C60',
                              load: 'Carga Axial Máxima: 285 kN',
                            })
                          }
                          onMouseLeave={() => setHoveredElement(null)}
                        >
                          {/* Pillar Left Face */}
                          <polygon
                            points={`${pt(px - pw / 2, py - pw / 2, zOffsetSlab)} ${pt(px - pw / 2, py + pw / 2, zOffsetSlab)} ${pt(px - pw / 2, py + pw / 2, zOffsetSlab + ph)} ${pt(px - pw / 2, py - pw / 2, zOffsetSlab + ph)}`}
                            fill={ts.woodMain}
                            stroke={ts.woodDark}
                            strokeWidth="0.8"
                          />

                          {/* Pillar Front Face */}
                          <polygon
                            points={`${pt(px - pw / 2, py + pw / 2, zOffsetSlab)} ${pt(px + pw / 2, py + pw / 2, zOffsetSlab)} ${pt(px + pw / 2, py + pw / 2, zOffsetSlab + ph)} ${pt(px - pw / 2, py + pw / 2, zOffsetSlab + ph)}`}
                            fill={ts.woodDark}
                            stroke={ts.woodMain}
                            strokeWidth="0.8"
                          />

                          {/* Pillar Top Face */}
                          <polygon
                            points={`${pt(px - pw / 2, py - pw / 2, zOffsetSlab + ph)} ${pt(px + pw / 2, py - pw / 2, zOffsetSlab + ph)} ${pt(px + pw / 2, py + pw / 2, zOffsetSlab + ph)} ${pt(px - pw / 2, py + pw / 2, zOffsetSlab + ph)}`}
                            fill={ts.woodLight}
                            stroke={ts.woodDark}
                            strokeWidth="0.8"
                          />

                          {/* Diagonal Bracing (Mão Francesa) on outer pillars */}
                          {(colIdx === 0 || colIdx === pillarColsX.length - 1) && rowIdx > 0 && (
                            <polygon
                              points={`${pt(px, py, zOffsetSlab + ph - 25)} ${pt(px, py - 30, zOffsetSlab + ph)} ${pt(px, py - 30, zOffsetSlab + ph - 6)} ${pt(px, py, zOffsetSlab + ph - 31)}`}
                              fill={ts.woodMain}
                              stroke={ts.woodDark}
                              strokeWidth="0.8"
                            />
                          )}
                        </g>
                      );
                    })
                  )}

                  {/* Longitudinal Main Girders (Vigas Longarinas Mestras) */}
                  {pillarColsX.map((px, colIdx) => (
                    <g key={`long-girder-${colIdx}`}>
                      {/* Top main continuous beam connecting all rows */}
                      <polygon
                        points={`${pt(px - 3, 0, zOffsetSlab + postH)} ${pt(px + 3, 0, zOffsetSlab + postH)} ${pt(px + 3, barnL, zOffsetSlab + postH)} ${pt(px - 3, barnL, zOffsetSlab + postH)}`}
                        fill={ts.woodLight}
                        stroke={ts.woodDark}
                        strokeWidth="0.9"
                      />
                      <polygon
                        points={`${pt(px + 3, 0, zOffsetSlab + postH)} ${pt(px + 3, barnL, zOffsetSlab + postH)} ${pt(px + 3, barnL, zOffsetSlab + postH - 10)} ${pt(px + 3, 0, zOffsetSlab + postH - 10)}`}
                        fill={ts.woodDark}
                        stroke={ts.woodMain}
                        strokeWidth="0.9"
                      />
                    </g>
                  ))}

                  {/* Transverse Cross Beams at each bent (Vigas Travessas) */}
                  {pillarRowsY.map((py, rowIdx) => (
                    <g key={`trans-beam-${rowIdx}`}>
                      <polygon
                        points={`${pt(0, py - 3, zOffsetSlab + postH - 2)} ${pt(barnW, py - 3, zOffsetSlab + postH - 2)} ${pt(barnW, py + 3, zOffsetSlab + postH - 2)} ${pt(0, py + 3, zOffsetSlab + postH - 2)}`}
                        fill={ts.woodLight}
                        stroke={ts.woodDark}
                        strokeWidth="0.8"
                      />
                    </g>
                  ))}
                </g>
              )}

              {/* ================= 4. GARLIC HANGING TIERS (NÍVEIS DE CARGA 1 a 6) ================= */}
              {layers.garlicTiers && (
                <g id="iso-garlic-load-tiers">
                  {/* Render 6 tiers across Left Wing (X: 20 to 130) and Right Wing (X: 290 to 400) */}
                  {[
                    { level: 1, zBase: 25, zOff: zOffsetTier1, color: '#D97706', label: 'Nível 1 (H=2.5m)' },
                    { level: 2, zBase: 48, zOff: zOffsetTier2, color: '#F59E0B', label: 'Nível 2 (H=4.8m)' },
                    { level: 3, zBase: 71, zOff: zOffsetTier3, color: '#FBBF24', label: 'Nível 3 (H=7.1m)' },
                    { level: 4, zBase: 94, zOff: zOffsetTier4, color: '#FDE047', label: 'Nível 4 (H=9.4m)' },
                    { level: 5, zBase: 117, zOff: zOffsetTier5, color: '#F59E0B', label: 'Nível 5 (H=11.7m)' },
                    { level: 6, zBase: 140, zOff: zOffsetTier6, color: '#D97706', label: 'Nível 6 (H=14.0m)' },
                  ].map((tier) => {
                    const isVisible = selectedTier === 'all' || selectedTier === tier.level;
                    if (!isVisible) return null;

                    const effectiveZ = tier.zBase + tier.zOff;
                    const tierH = 16;

                    return (
                      <g
                        key={`garlic-tier-${tier.level}`}
                        className="cursor-pointer transition-all duration-300"
                        onMouseEnter={() =>
                          setHoveredElement({
                            title: `Estaleiro de Alho - ${tier.label}`,
                            description: `Nível ${tier.level} de cura com varais transversais de eucalipto suportando feixes de alho em rama com secagem natural.`,
                            spec: `Espaçamento entre varais: 35cm | Carga linear: 14 kg/m`,
                            load: `Capacidade deste nível: ~88.300 kg (${(530000 / 6 / 1000).toFixed(1)} t)`,
                          })
                        }
                        onMouseLeave={() => setHoveredElement(null)}
                      >
                        {/* ---------------- LEFT WING TIERS (X: 18 to 135) ---------------- */}
                        {/* Timber Rack Frame Shelf */}
                        <polygon
                          points={`${pt(20, 20, effectiveZ)} ${pt(135, 20, effectiveZ)} ${pt(135, barnL - 20, effectiveZ)} ${pt(20, barnL - 20, effectiveZ)}`}
                          fill={theme === 'graph-paper' ? '#FEF3C7' : '#2D1B0D'}
                          stroke={tier.color}
                          strokeWidth="1.2"
                          opacity="0.88"
                        />

                        {/* Garlic Bundles Texture Lines (Varais de Alho) */}
                        {Array.from({ length: 14 }).map((_, r) => {
                          const ry = 35 + r * 38;
                          return (
                            <line
                              key={`varal-left-${tier.level}-${r}`}
                              x1={toIso(24, ry, effectiveZ + 2).x}
                              y1={toIso(24, ry, effectiveZ + 2).y}
                              x2={toIso(131, ry, effectiveZ + 2).x}
                              y2={toIso(131, ry, effectiveZ + 2).y}
                              stroke={ts.woodDark}
                              strokeWidth="1"
                            />
                          );
                        })}

                        {/* Hanging Garlic Bulb Bulges (Frente do nível esquerdo) */}
                        <polygon
                          points={`${pt(20, barnL - 20, effectiveZ)} ${pt(135, barnL - 20, effectiveZ)} ${pt(135, barnL - 20, effectiveZ - tierH)} ${pt(20, barnL - 20, effectiveZ - tierH)}`}
                          fill={tier.color}
                          stroke={ts.woodDark}
                          strokeWidth="1"
                          opacity="0.9"
                        />

                        {/* Side edge */}
                        <polygon
                          points={`${pt(135, 20, effectiveZ)} ${pt(135, barnL - 20, effectiveZ)} ${pt(135, barnL - 20, effectiveZ - tierH)} ${pt(135, 20, effectiveZ - tierH)}`}
                          fill={ts.woodDark}
                          stroke={tier.color}
                          strokeWidth="0.8"
                          opacity="0.8"
                        />

                        {/* ---------------- RIGHT WING TIERS (X: 285 to 400) ---------------- */}
                        {/* Timber Rack Frame Shelf */}
                        <polygon
                          points={`${pt(285, 20, effectiveZ)} ${pt(400, 20, effectiveZ)} ${pt(400, barnL - 20, effectiveZ)} ${pt(285, barnL - 20, effectiveZ)}`}
                          fill={theme === 'graph-paper' ? '#FEF3C7' : '#2D1B0D'}
                          stroke={tier.color}
                          strokeWidth="1.2"
                          opacity="0.88"
                        />

                        {/* Garlic Bundles Texture Lines (Varais de Alho Direita) */}
                        {Array.from({ length: 14 }).map((_, r) => {
                          const ry = 35 + r * 38;
                          return (
                            <line
                              key={`varal-right-${tier.level}-${r}`}
                              x1={toIso(289, ry, effectiveZ + 2).x}
                              y1={toIso(289, ry, effectiveZ + 2).y}
                              x2={toIso(396, ry, effectiveZ + 2).x}
                              y2={toIso(396, ry, effectiveZ + 2).y}
                              stroke={ts.woodDark}
                              strokeWidth="1"
                            />
                          );
                        })}

                        {/* Hanging Garlic Bulb Bulges (Frente do nível direito) */}
                        <polygon
                          points={`${pt(285, barnL - 20, effectiveZ)} ${pt(400, barnL - 20, effectiveZ)} ${pt(400, barnL - 20, effectiveZ - tierH)} ${pt(285, barnL - 20, effectiveZ - tierH)}`}
                          fill={tier.color}
                          stroke={ts.woodDark}
                          strokeWidth="1"
                          opacity="0.9"
                        />

                        {/* Side edge */}
                        <polygon
                          points={`${pt(400, 20, effectiveZ)} ${pt(400, barnL - 20, effectiveZ)} ${pt(400, barnL - 20, effectiveZ - tierH)} ${pt(400, 20, effectiveZ - tierH)}`}
                          fill={ts.woodDark}
                          stroke={tier.color}
                          strokeWidth="0.8"
                          opacity="0.8"
                        />

                        {/* Tier Label Tag Badge */}
                        <g transform={`translate(${toIso(408, barnL / 2, effectiveZ).x}, ${toIso(408, barnL / 2, effectiveZ).y})`}>
                          <rect x="0" y="-8" width="55" height="16" rx="3" fill="#1A1A1A" stroke={tier.color} strokeWidth="1" />
                          <text x="27" y="3" fill={tier.color} fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                            NÍVEL {tier.level}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* ================= 5. MEZZANINE INSPECTION CATWALKS (PASSARELAS METÁLICAS/MADEIRA) ================= */}
              {layers.mezzanine && (
                <g
                  id="iso-mezzanine-catwalks"
                  className="cursor-pointer"
                  onMouseEnter={() =>
                    setHoveredElement({
                      title: 'Passarelas Técnicas de Inspeção & Manejo (H=7.50m)',
                      description: 'Plataforma suspensa com piso antiderrapante e guarda-corpo para conferência fitossanitária e ventilação.',
                      spec: 'Largura: 1,20m | Guarda-corpo: 1,10m com rodapé | NR-12 / NR-18',
                      load: 'Sobrecarga de uso: 250 kg/m²',
                    })
                  }
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  {/* Left Catwalk Along Central Corridor (X=135) */}
                  {(() => {
                    const mzZ = 75 + zOffsetMezzanine;
                    return (
                      <g>
                        {/* Walkway floor */}
                        <polygon
                          points={`${pt(135, 20, mzZ)} ${pt(155, 20, mzZ)} ${pt(155, barnL - 20, mzZ)} ${pt(135, barnL - 20, mzZ)}`}
                          fill={theme === 'graph-paper' ? '#C2B299' : '#334155'}
                          stroke={ts.woodMain}
                          strokeWidth="1"
                        />
                        {/* Guardrail lines */}
                        <line
                          x1={toIso(155, 20, mzZ + 15).x}
                          y1={toIso(155, 20, mzZ + 15).y}
                          x2={toIso(155, barnL - 20, mzZ + 15).x}
                          y2={toIso(155, barnL - 20, mzZ + 15).y}
                          stroke="#38BDF8"
                          strokeWidth="1.2"
                        />
                      </g>
                    );
                  })()}

                  {/* Right Catwalk Along Central Corridor (X=265) */}
                  {(() => {
                    const mzZ = 75 + zOffsetMezzanine;
                    return (
                      <g>
                        {/* Walkway floor */}
                        <polygon
                          points={`${pt(265, 20, mzZ)} ${pt(285, 20, mzZ)} ${pt(285, barnL - 20, mzZ)} ${pt(265, barnL - 20, mzZ)}`}
                          fill={theme === 'graph-paper' ? '#C2B299' : '#334155'}
                          stroke={ts.woodMain}
                          strokeWidth="1"
                        />
                        {/* Guardrail lines */}
                        <line
                          x1={toIso(265, 20, mzZ + 15).x}
                          y1={toIso(265, 20, mzZ + 15).y}
                          x2={toIso(265, barnL - 20, mzZ + 15).x}
                          y2={toIso(265, barnL - 20, mzZ + 15).y}
                          stroke="#38BDF8"
                          strokeWidth="1.2"
                        />
                      </g>
                    );
                  })()}
                </g>
              )}

              {/* ================= 6. ROOF TRUSSES & LANTERNIM (TESOURAS & COBERTURA) ================= */}
              {layers.roofTrusses && (
                <g
                  id="iso-roof-trusses"
                  className="cursor-pointer"
                  onMouseEnter={() =>
                    setHoveredElement({
                      title: 'Tesouras de Madeira & Lanternim Superior (H=18.00m)',
                      description: 'Estrutura de cobertura com tesouras triangulares de madeira e lanternim contínuo para exaustão convectiva.',
                      spec: 'Vão livre central: 25m | Inclinação do telhado: 22° | Madeira Serrada',
                      load: 'Carga de vento: 0.6 kN/m² | NBR 7190 / NBR 6123',
                    })
                  }
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  {/* Ridge height = postH + 45 */}
                  {(() => {
                    const rzBase = postH + zOffsetRoof;
                    const ridgeZ = rzBase + 45;
                    const ridgeX = barnW / 2; // 210

                    return (
                      <g>
                        {/* Roof Trusses at each pillar bent */}
                        {pillarRowsY.map((py, i) => (
                          <g key={`truss-bent-${i}`}>
                            {/* Left Rafter (Perna Esquerda) */}
                            <line
                              x1={toIso(0, py, rzBase).x}
                              y1={toIso(0, py, rzBase).y}
                              x2={toIso(ridgeX, py, ridgeZ).x}
                              y2={toIso(ridgeX, py, ridgeZ).y}
                              stroke={ts.roofTruss}
                              strokeWidth="2"
                            />
                            {/* Right Rafter (Perna Direita) */}
                            <line
                              x1={toIso(barnW, py, rzBase).x}
                              y1={toIso(barnW, py, rzBase).y}
                              x2={toIso(ridgeX, py, ridgeZ).x}
                              y2={toIso(ridgeX, py, ridgeZ).y}
                              stroke={ts.roofTruss}
                              strokeWidth="2"
                            />
                            {/* Bottom Chord (Linha da Tesoura) */}
                            <line
                              x1={toIso(0, py, rzBase).x}
                              y1={toIso(0, py, rzBase).y}
                              x2={toIso(barnW, py, rzBase).x}
                              y2={toIso(barnW, py, rzBase).y}
                              stroke={ts.roofTruss}
                              strokeWidth="1.8"
                            />
                            {/* King Post (Pendural Central) */}
                            <line
                              x1={toIso(ridgeX, py, rzBase).x}
                              y1={toIso(ridgeX, py, rzBase).y}
                              x2={toIso(ridgeX, py, ridgeZ).x}
                              y2={toIso(ridgeX, py, ridgeZ).y}
                              stroke={ts.roofTruss}
                              strokeWidth="1.5"
                            />
                            {/* Diagonals / Struts (Escoras) */}
                            <line
                              x1={toIso(ridgeX * 0.5, py, rzBase).x}
                              y1={toIso(ridgeX * 0.5, py, rzBase).y}
                              x2={toIso(ridgeX, py, rzBase + 22).x}
                              y2={toIso(ridgeX, py, rzBase + 22).y}
                              stroke={ts.roofTruss}
                              strokeWidth="1.2"
                            />
                            <line
                              x1={toIso(barnW - ridgeX * 0.5, py, rzBase).x}
                              y1={toIso(barnW - ridgeX * 0.5, py, rzBase).y}
                              x2={toIso(ridgeX, py, rzBase + 22).x}
                              y2={toIso(ridgeX, py, rzBase + 22).y}
                              stroke={ts.roofTruss}
                              strokeWidth="1.2"
                            />
                          </g>
                        ))}

                        {/* Main Ridge Beam (Cumeeira Longitudinal) */}
                        <line
                          x1={toIso(ridgeX, 0, ridgeZ).x}
                          y1={toIso(ridgeX, 0, ridgeZ).y}
                          x2={toIso(ridgeX, barnL, ridgeZ).x}
                          y2={toIso(ridgeX, barnL, ridgeZ).y}
                          stroke={ts.woodLight}
                          strokeWidth="2.5"
                        />

                        {/* Top Continuous Lanternim Box (Lanternim de Ventilação) */}
                        {/* Lanternim Roof Overhang */}
                        <polygon
                          points={`${pt(ridgeX - 30, 0, ridgeZ + 12)} ${pt(ridgeX + 30, 0, ridgeZ + 12)} ${pt(ridgeX + 30, barnL, ridgeZ + 12)} ${pt(ridgeX - 30, barnL, ridgeZ + 12)}`}
                          fill={theme === 'graph-paper' ? '#E5DFD5' : '#1E293B'}
                          stroke={ts.roofTruss}
                          strokeWidth="1.2"
                        />
                        {/* Lanternim Side Vents (Grelhas de Saída de Ar) */}
                        <polygon
                          points={`${pt(ridgeX + 25, 0, ridgeZ + 10)} ${pt(ridgeX + 25, barnL, ridgeZ + 10)} ${pt(ridgeX + 25, barnL, ridgeZ - 2)} ${pt(ridgeX + 25, 0, ridgeZ - 2)}`}
                          fill="#0284C7"
                          stroke={ts.roofTruss}
                          strokeWidth="0.8"
                          opacity="0.6"
                        />

                        {/* Optional Semi-Transparent or Opaque Roof Sheeting */}
                        {layers.roofCovering && (
                          <g id="roof-sheeting-sheath">
                            {/* Left Roof Plane */}
                            <polygon
                              points={`${pt(0, 0, rzBase)} ${pt(ridgeX, 0, ridgeZ)} ${pt(ridgeX, barnL, ridgeZ)} ${pt(0, barnL, rzBase)}`}
                              fill={theme === 'graph-paper' ? '#F4ECE1' : '#1E293B'}
                              stroke={ts.roofTruss}
                              strokeWidth="1"
                              opacity="0.75"
                            />
                            {/* Right Roof Plane */}
                            <polygon
                              points={`${pt(ridgeX, 0, ridgeZ)} ${pt(barnW, 0, rzBase)} ${pt(barnW, barnL, rzBase)} ${pt(ridgeX, barnL, ridgeZ)}`}
                              fill={theme === 'graph-paper' ? '#EAE0D1' : '#0F172A'}
                              stroke={ts.roofTruss}
                              strokeWidth="1"
                              opacity="0.75"
                            />
                          </g>
                        )}
                      </g>
                    );
                  })()}
                </g>
              )}

              {/* ================= 7. AIRFLOW THERMODYNAMIC VECTORS (TERMODINÂMICA 3D) ================= */}
              {layers.airflow && (
                <g id="iso-airflow-thermodynamics" className="pointer-events-none">
                  {/* Cool Air Inflow Vectors along side louvers (Left & Right) */}
                  {Array.from({ length: 4 }).map((_, a) => {
                    const ay = 80 + a * 130;
                    const p1 = toIso(-30, ay, zOffsetSlab + 20);
                    const p2 = toIso(20, ay, zOffsetSlab + 25);
                    const p3 = toIso(80, ay, zOffsetSlab + 40);

                    return (
                      <g key={`cool-air-l-${a}`}>
                        <path
                          d={`M ${p1.x} ${p1.y} Q ${p2.x} ${p2.y} ${p3.x} ${p3.y}`}
                          fill="none"
                          stroke="#38BDF8"
                          strokeWidth="2.2"
                          strokeDasharray="6 4"
                          markerEnd="url(#air-arrow-cool)"
                        />
                      </g>
                    );
                  })}

                  {/* Hot / Moist Air Convective Rising Currents exiting through Lanternim */}
                  {Array.from({ length: 3 }).map((_, h) => {
                    const hy = 120 + h * 160;
                    const rz = postH + zOffsetRoof + 45;
                    const p1 = toIso(barnW / 2, hy, 70 + zOffsetTier3);
                    const p2 = toIso(barnW / 2, hy, rz + 10);
                    const p3 = toIso(barnW / 2, hy - 30, rz + 40);

                    return (
                      <g key={`warm-air-rise-${h}`}>
                        <path
                          d={`M ${p1.x} ${p1.y} Q ${p2.x} ${p2.y} ${p3.x} ${p3.y}`}
                          fill="none"
                          stroke="#EF4444"
                          strokeWidth="2.4"
                          strokeDasharray="6 3"
                          markerEnd="url(#air-arrow-warm)"
                        />
                        <text
                          x={p3.x + 10}
                          y={p3.y}
                          fill="#EF4444"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          EXAUSTÃO TÉRMICA (35°C)
                        </text>
                      </g>
                    );
                  })}

                  {/* Cold air label */}
                  <text
                    x={toIso(-50, 200, zOffsetSlab + 20).x}
                    y={toIso(-50, 200, zOffsetSlab + 20).y}
                    fill="#0284C7"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    AR FRESCO (VENEZIANAS)
                  </text>
                </g>
              )}

              {/* ================= 8. ISOMETRIC DIMENSIONS & CALLOUT LABELS (COTAS 3D) ================= */}
              {layers.dimensions && (
                <g id="iso-dimensions" className="pointer-events-none font-mono">
                  {/* Width Cota: 80.00m (Across X Axis at Front) */}
                  {(() => {
                    const pStart = toIso(0, barnL + 25, zOffsetSlab);
                    const pEnd = toIso(barnW, barnL + 25, zOffsetSlab);
                    const pMid = toIso(barnW / 2, barnL + 35, zOffsetSlab);

                    return (
                      <g>
                        <line x1={pStart.x} y1={pStart.y} x2={pEnd.x} y2={pEnd.y} stroke={ts.dimLine} strokeWidth="1.5" />
                        {/* Extension ticks */}
                        <line
                          x1={toIso(0, barnL, zOffsetSlab).x}
                          y1={toIso(0, barnL, zOffsetSlab).y}
                          x2={toIso(0, barnL + 35, zOffsetSlab).x}
                          y2={toIso(0, barnL + 35, zOffsetSlab).y}
                          stroke={ts.dimLine}
                          strokeWidth="1"
                        />
                        <line
                          x1={toIso(barnW, barnL, zOffsetSlab).x}
                          y1={toIso(barnW, barnL, zOffsetSlab).y}
                          x2={toIso(barnW, barnL + 35, zOffsetSlab).x}
                          y2={toIso(barnW, barnL + 35, zOffsetSlab).y}
                          stroke={ts.dimLine}
                          strokeWidth="1"
                        />
                        <rect x={pMid.x - 30} y={pMid.y - 9} width="60" height="16" rx="2" fill={ts.bg} stroke={ts.dimLine} strokeWidth="0.8" />
                        <text x={pMid.x} y={pMid.y + 3} fill={ts.textMain} fontSize="11" fontWeight="bold" textAnchor="middle">
                          80.00 m
                        </text>
                      </g>
                    );
                  })()}

                  {/* Length Cota: 90.00m / 120.00m (Along Y Axis at Left Side) */}
                  {(() => {
                    const pStart = toIso(-25, 0, zOffsetSlab);
                    const pEnd = toIso(-25, barnL, zOffsetSlab);
                    const pMid = toIso(-35, barnL / 2, zOffsetSlab);

                    return (
                      <g>
                        <line x1={pStart.x} y1={pStart.y} x2={pEnd.x} y2={pEnd.y} stroke={ts.dimLine} strokeWidth="1.5" />
                        {/* Extension ticks */}
                        <line
                          x1={toIso(0, 0, zOffsetSlab).x}
                          y1={toIso(0, 0, zOffsetSlab).y}
                          x2={toIso(-35, 0, zOffsetSlab).x}
                          y2={toIso(-35, 0, zOffsetSlab).y}
                          stroke={ts.dimLine}
                          strokeWidth="1"
                        />
                        <line
                          x1={toIso(0, barnL, zOffsetSlab).x}
                          y1={toIso(0, barnL, zOffsetSlab).y}
                          x2={toIso(-35, barnL, zOffsetSlab).x}
                          y2={toIso(-35, barnL, zOffsetSlab).y}
                          stroke={ts.dimLine}
                          strokeWidth="1"
                        />
                        <rect x={pMid.x - 32} y={pMid.y - 9} width="64" height="16" rx="2" fill={ts.bg} stroke={ts.dimLine} strokeWidth="0.8" />
                        <text x={pMid.x} y={pMid.y + 3} fill={ts.textMain} fontSize="11" fontWeight="bold" textAnchor="middle">
                          120.00 m
                        </text>
                      </g>
                    );
                  })()}

                  {/* Total Height Cota: 18.00m (Vertical Z Axis at Front Right Corner) */}
                  {(() => {
                    const pStart = toIso(barnW + 25, barnL, zOffsetSlab);
                    const pEnd = toIso(barnW + 25, barnL, zOffsetSlab + postH + 45);
                    const pMid = toIso(barnW + 35, barnL, zOffsetSlab + (postH + 45) / 2);

                    return (
                      <g>
                        <line x1={pStart.x} y1={pStart.y} x2={pEnd.x} y2={pEnd.y} stroke={ts.dimLine} strokeWidth="1.5" />
                        {/* Extension lines */}
                        <line
                          x1={toIso(barnW, barnL, zOffsetSlab).x}
                          y1={toIso(barnW, barnL, zOffsetSlab).y}
                          x2={toIso(barnW + 35, barnL, zOffsetSlab).x}
                          y2={toIso(barnW + 35, barnL, zOffsetSlab).y}
                          stroke={ts.dimLine}
                          strokeWidth="1"
                        />
                        <line
                          x1={toIso(barnW, barnL, zOffsetSlab + postH + 45).x}
                          y1={toIso(barnW, barnL, zOffsetSlab + postH + 45).y}
                          x2={toIso(barnW + 35, barnL, zOffsetSlab + postH + 45).x}
                          y2={toIso(barnW + 35, barnL, zOffsetSlab + postH + 45).y}
                          stroke={ts.dimLine}
                          strokeWidth="1"
                        />
                        <rect x={pMid.x - 30} y={pMid.y - 9} width="60" height="16" rx="2" fill={ts.bg} stroke={ts.dimLine} strokeWidth="0.8" />
                        <text x={pMid.x} y={pMid.y + 3} fill={ts.textMain} fontSize="11" fontWeight="bold" textAnchor="middle">
                          18.00 m
                        </text>
                      </g>
                    );
                  })()}
                </g>
              )}

              {/* ================= COMPASS ROSE (NORTE MAGNÉTICO 3D) ================= */}
              <g id="iso-compass" transform="translate(1180, 110)">
                <circle cx="0" cy="0" r="30" fill={theme === 'graph-paper' ? '#FAF6EF' : '#1A1A1A'} stroke={ts.woodMain} strokeWidth="1.5" />
                <path d="M 0 -24 L 6 0 L 0 4 L -6 0 Z" fill="#EF4444" />
                <path d="M 0 24 L 6 0 L 0 -4 L -6 0 Z" fill={ts.textSub} />
                <text x="0" y="-27" fill="#EF4444" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  N
                </text>
                <text x="0" y="36" fill={ts.textSub} fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  S
                </text>
                <text x="35" y="4" fill={ts.textSub} fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  L
                </text>
                <text x="-35" y="4" fill={ts.textSub} fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  O
                </text>
              </g>

              {/* Technical Title Stamp in Corner */}
              <g id="iso-title-block" transform="translate(40, 60)">
                <rect
                  x="0"
                  y="0"
                  width="270"
                  height="72"
                  rx="4"
                  fill={theme === 'graph-paper' ? '#FFFFFF' : '#111111'}
                  stroke={ts.woodMain}
                  strokeWidth="1.2"
                  opacity="0.95"
                />
                <text x="12" y="20" fill={ts.textMain} fontSize="12" fontWeight="bold" fontFamily="monospace">
                  PLANTA ISOMÉTRICA ESPACIAL 45°
                </text>
                <text x="12" y="36" fill={ts.textSub} fontSize="10" fontFamily="monospace">
                  ESTALEIRO INDUSTRIAL DE ALHO EM RAMA
                </text>
                <text x="12" y="52" fill={ts.woodMain} fontSize="10" fontWeight="bold" fontFamily="monospace">
                  CAPACIDADE: 530.000 KG | 6 NÍVEIS
                </text>
                <text x="12" y="65" fill={ts.textSub} fontSize="9" fontFamily="monospace">
                  ESCALA VISUAL: 1:350 AXONOMÉTRICA
                </text>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
