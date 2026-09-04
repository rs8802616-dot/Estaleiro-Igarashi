import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Sparkles,
  Download,
  Printer,
  CheckCircle2,
  Building2,
  FileSpreadsheet,
  Layers,
  Info,
  Package
} from 'lucide-react';
import { StructuralMetrics, BlueprintTheme } from '../types';

interface LateralElevationViewProps {
  metrics: StructuralMetrics;
}

export const LateralElevationView: React.FC<LateralElevationViewProps> = ({ metrics }) => {
  const [subView, setSubView] = useState<'estaleiros-200' | 'lateral-facade-150' | 'frontal-facade'>('estaleiros-200');
  const [zoom, setZoom] = useState<number>(0.75);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [theme, setTheme] = useState<BlueprintTheme>('graph-paper');
  const [showThemeMenu, setShowThemeMenu] = useState<boolean>(false);
  const [showOriginalComparison, setShowOriginalComparison] = useState<boolean>(false);
  const [isImmersive, setIsImmersive] = useState<boolean>(false);
  const [selectedBay, setSelectedBay] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; dist?: number }>({ x: 0, y: 0 });

  const svgWidth = 1450;
  const svgHeight = 780;

  // Auto-fit function
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
  }, [subView]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.15, 3.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.15, 0.2));
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
        setZoom(prev => Math.max(Math.min(prev * factor, 3.5), 0.2));
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
          woodColor: '#8C6239',
          woodFill: '#F4ECE1',
          woodStroke: '#3E2723',
          garlicMesh: '#654321',
          garlicDot: '#5C4033',
          louverColor: '#0284C7',
          textMain: '#1F2937',
          textSub: '#4B5563',
          borderDim: '#D1C7B7',
          dimLine: '#3E2723',
        };
      case 'blueprint-blue':
        return {
          bg: '#0F2744',
          gridLine: '#1E3E66',
          woodColor: '#38BDF8',
          woodFill: '#163359',
          woodStroke: '#7DD3FC',
          garlicMesh: '#93C5FD',
          garlicDot: '#BAE6FD',
          louverColor: '#7DD3FC',
          textMain: '#F0F9FF',
          textSub: '#93C5FD',
          borderDim: '#38BDF8',
          dimLine: '#38BDF8',
        };
      case 'realistic-wood':
        return {
          bg: '#1C1510',
          gridLine: '#2D221B',
          woodColor: '#E6A86C',
          woodFill: '#2E1E14',
          woodStroke: '#D4A373',
          garlicMesh: '#D97706',
          garlicDot: '#FDE68A',
          louverColor: '#38BDF8',
          textMain: '#FEF3C7',
          textSub: '#D4A373',
          borderDim: '#D4A373',
          dimLine: '#D4A373',
        };
      case 'cad-dark':
      default:
        return {
          bg: '#0A0A0A',
          gridLine: '#181818',
          woodColor: '#D4A373',
          woodFill: '#1A1A1A',
          woodStroke: '#D4A373',
          garlicMesh: '#A3A3A3',
          garlicDot: '#E5E7EB',
          louverColor: '#38BDF8',
          textMain: '#E5E7EB',
          textSub: '#9CA3AF',
          borderDim: '#D4A373',
          dimLine: '#D4A373',
        };
    }
  };

  const ts = getThemeStyles();

  // Bay coordinates matching the 4-bay proportion: 120m | 40m | 12m | 12m
  // Drawing box bounds:
  const originX = 100;
  const originY = 80;
  const frameWidth = 1250;
  const frameHeight = 440; // Represents 6m height

  // Relative bay widths matching drawing visual ratios:
  // Bay 1: ~380px (120m)
  // Bay 2: ~380px (40m)
  // Bay 3: ~245px (12m)
  // Bay 4: ~245px (12m)
  const bayWidths = [380, 380, 245, 245];
  const postPositions = [
    originX,
    originX + bayWidths[0],
    originX + bayWidths[0] + bayWidths[1],
    originX + bayWidths[0] + bayWidths[1] + bayWidths[2],
    originX + frameWidth,
  ];

  return (
    <div className={`flex flex-col h-full bg-[#0F0F0F] text-[#E5E7EB] overflow-hidden select-none relative ${isImmersive ? 'fixed inset-0 z-50' : ''}`}>
      {/* Sub-navigation & CAD Controls */}
      {!isImmersive && (
        <div className="bg-[#111111] border-b border-[#2D2D2D] z-10 shrink-0">
          <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5 overflow-x-auto scrollbar-none">
            {/* View Selector Buttons (Tabs) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setSubView('estaleiros-200')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all border ${
                  subView === 'estaleiros-200'
                    ? 'bg-[#26201a] text-[#D4A373] border-[#D4A373] shadow-xs'
                    : 'bg-[#1A1A1A] text-[#9CA3AF] hover:text-[#E5E7EB] border-[#2D2D2D]'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Sistema de Penduração (Estaleiros 1:200)</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-[#D4A373]/20 text-[#D4A373] font-mono ml-0.5">
                  Principal
                </span>
              </button>

              <button
                onClick={() => setSubView('lateral-facade-150')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all border ${
                  subView === 'lateral-facade-150'
                    ? 'bg-[#26201a] text-[#D4A373] border-[#D4A373] shadow-xs'
                    : 'bg-[#1A1A1A] text-[#9CA3AF] hover:text-[#E5E7EB] border-[#2D2D2D]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Fachada Lateral Externa (1:150)</span>
              </button>
            </div>

            {/* Quick CAD Tools */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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

              {/* Photo reference comparison */}
              <button
                onClick={() => setShowOriginalComparison(!showOriginalComparison)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[#26201a] hover:bg-[#33261a] text-[#D4A373] rounded border border-[#D4A373]/50 font-semibold transition-colors"
                title="Ver Desenho Original"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D4A373]" />
                <span className="hidden sm:inline text-[11px]">Original</span>
              </button>

              {/* Focus mode */}
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
        {/* Original Drawing Comparison Modal */}
        {showOriginalComparison && (
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-40 w-80 sm:w-96 bg-[#1A1A1A] rounded border border-[#D4A373]/60 p-3.5 shadow-2xl animate-in fade-in zoom-in-95 max-w-[calc(100vw-32px)]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2D2D2D]">
              <span className="text-xs font-bold text-[#D4A373] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#D4A373]" />
                Prancha Original do Sistema de Estaleiros
              </span>
              <button
                onClick={() => setShowOriginalComparison(false)}
                className="text-[#9CA3AF] hover:text-white text-xs font-bold px-1.5 py-0.5 rounded bg-[#262626]"
              >
                ✕
              </button>
            </div>
            <div className="bg-black/50 rounded p-1 border border-[#2D2D2D] mb-2 flex items-center justify-center overflow-hidden">
              <img
                src="1787879339839.png"
                alt="Original Architectural Blueprint Sheet"
                className="w-full object-contain max-h-56"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
              Reprodução 1:1 do <strong>DETALHE DO SISTEMA DE PENDURAÇÃO INDUSTRIAL (ESTALEIROS) Scale 1:200</strong>, contendo os 4 vãos (120m, 40m, 12m, 12m), altura 6m, mão-francesa de contraventamento, 4 andares de varais e feixes de alho em malha.
            </p>
          </div>
        )}

        {/* Dimension and specs summary pill at bottom */}
        <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-20 pointer-events-none">
          <div className="bg-[#1A1A1A]/90 text-[#E5E7EB] backdrop-blur-xs px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded border border-[#2D2D2D] shadow-lg text-[11px] sm:text-xs font-mono flex items-center gap-3">
            <div><span className="text-[#6B7280]">ALTURA:</span> <span className="text-[#D4A373] font-bold ml-1">6,00 m</span></div>
            <div><span className="text-[#6B7280]">ESTALEIROS:</span> <span className="text-white font-medium ml-1">4 Níveis</span></div>
            <div><span className="text-[#6B7280]">VÃOS:</span> <span className="text-[#4ade80] font-bold ml-1">120m | 40m | 12m | 12m</span></div>
          </div>
        </div>

        {/* SVG Viewport */}
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
                <pattern id="est-technical-grid" width="25" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 25 0 L 0 0 0 25" fill="none" stroke={ts.gridLine} strokeWidth="0.6" />
                </pattern>

                {/* Wood Grain Texture for Beams and Pillars */}
                <pattern id="est-wood-pattern" width="120" height="20" patternUnits="userSpaceOnUse">
                  <rect width="120" height="20" fill={theme === 'graph-paper' ? '#FAF6EF' : '#2A1D15'} />
                  <path d="M 0 5 Q 30 7 60 4 T 120 6" fill="none" stroke={ts.woodColor} strokeWidth="0.6" opacity="0.6" />
                  <path d="M 0 12 Q 40 10 80 14 T 120 11" fill="none" stroke={ts.woodColor} strokeWidth="0.6" opacity="0.6" />
                  <path d="M 0 17 Q 20 18 50 16 T 120 17" fill="none" stroke={ts.woodColor} strokeWidth="0.5" opacity="0.4" />
                </pattern>

                <pattern id="est-wood-vertical" width="20" height="120" patternUnits="userSpaceOnUse">
                  <rect width="20" height="120" fill={theme === 'graph-paper' ? '#FAF6EF' : '#2A1D15'} />
                  <path d="M 5 0 Q 7 30 4 60 T 6 120" fill="none" stroke={ts.woodColor} strokeWidth="0.6" opacity="0.6" />
                  <path d="M 12 0 Q 10 40 14 80 T 11 120" fill="none" stroke={ts.woodColor} strokeWidth="0.6" opacity="0.6" />
                </pattern>

                {/* Garlic Net / Mesh Pattern for Feixes de Alho */}
                <pattern id="garlic-mesh-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 0 5 L 5 0 L 10 5 L 5 10 Z" fill="none" stroke={ts.garlicMesh} strokeWidth="0.5" />
                  <circle cx="5" cy="5" r="1.5" fill={ts.garlicDot} />
                </pattern>

                {/* Dimension Arrows */}
                <marker id="est-dim-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 2 L 8 5 L 0 8 z" fill={ts.dimLine} />
                </marker>
              </defs>

              {/* Grid Background */}
              <rect width={svgWidth} height={svgHeight} fill="url(#est-technical-grid)" />

              {/* ========================================================================= */}
              {/* VIEW 1: DETALHE DO SISTEMA DE PENDURAÇÃO INDUSTRIAL (ESTALEIROS) Scale 1:200 */}
              {/* EXACT MATCH TO IMG_20260827_221526.png.jpg */}
              {/* ========================================================================= */}
              {subView === 'estaleiros-200' && (
                <g id="drawing-estaleiros-1-200">
                  {/* Ground Line (Piso / Linha de Terra) */}
                  <line
                    x1={originX - 40}
                    y1={originY + frameHeight}
                    x2={originX + frameWidth + 40}
                    y2={originY + frameHeight}
                    stroke={ts.woodStroke}
                    strokeWidth="3.5"
                  />

                  {/* Top Continuous Horizontal Wooden Beam (Viga Contínua Superior) */}
                  <g id="top-horizontal-beam">
                    <rect
                      x={originX}
                      y={originY - 24}
                      width={frameWidth}
                      height="24"
                      fill="url(#est-wood-pattern)"
                      stroke={ts.woodStroke}
                      strokeWidth="2"
                    />
                    {/* Beam internal joints over pillars */}
                    {postPositions.map((px, idx) => (
                      <line
                        key={`beam-joint-${idx}`}
                        x1={px}
                        y1={originY - 24}
                        x2={px}
                        y2={originY}
                        stroke={ts.woodStroke}
                        strokeWidth="1.5"
                      />
                    ))}
                  </g>

                  {/* 5 Vertical Timber Pillars (Pilares Verticais de Madeira com Veios) */}
                  {postPositions.map((px, idx) => (
                    <g key={`timber-post-${idx}`} id={`post-${idx}`}>
                      <rect
                        x={px - 10}
                        y={originY - 24}
                        width="20"
                        height={frameHeight + 24}
                        fill="url(#est-wood-vertical)"
                        stroke={ts.woodStroke}
                        strokeWidth="1.8"
                      />
                      {/* Vertical grain lines inside pillar */}
                      <line x1={px - 3} y1={originY} x2={px - 3} y2={originY + frameHeight} stroke={ts.woodColor} strokeWidth="0.8" opacity="0.6" />
                      <line x1={px + 4} y1={originY} x2={px + 4} y2={originY + frameHeight} stroke={ts.woodColor} strokeWidth="0.8" opacity="0.6" />
                    </g>
                  ))}

                  {/* Diagonal Timber Brace (Mão-Francesa no canto superior esquerdo do primeiro vão) */}
                  <g id="diagonal-timber-brace">
                    <polygon
                      points={`${originX + 10},${originY + 80} ${originX + 10},${originY + 105} ${originX + 105},${originY} ${originX + 80},${originY}`}
                      fill={theme === 'graph-paper' ? '#FAF6EF' : '#2A1D15'}
                      stroke={ts.woodStroke}
                      strokeWidth="1.8"
                    />
                    <line x1={originX + 18} y1={originY + 85} x2={originX + 88} y2={originY + 5} stroke={ts.woodColor} strokeWidth="0.8" />
                  </g>

                  {/* 4 BAYS OF HANGING GARLIC ESTALEIROS */}
                  {bayWidths.map((bWidth, bIdx) => {
                    const startX = postPositions[bIdx] + 10;
                    const endX = postPositions[bIdx + 1] - 10;
                    const actualWidth = endX - startX;

                    // Number of hanging garlic bundles per bay based on width
                    const numBundles = bIdx < 2 ? 18 : 12;
                    const bundleSpacing = actualWidth / numBundles;

                    return (
                      <g key={`garlic-bay-${bIdx}`} id={`garlic-bay-${bIdx}`}>
                        {/* 4 Horizontal Rails per Bay (4 Andares de Varais de Madeira) */}
                        {Array.from({ length: 4 }).map((_, rIdx) => {
                          const railY = originY + 70 + rIdx * 95;

                          return (
                            <g key={`rail-${bIdx}-${rIdx}`} id={`rail-${bIdx}-${rIdx}`}>
                              {/* Horizontal Timber Varão / Rail (Ø15cm) */}
                              <rect
                                x={startX}
                                y={railY - 5}
                                width={actualWidth}
                                height="10"
                                rx="2"
                                fill={ts.woodFill}
                                stroke={ts.woodStroke}
                                strokeWidth="1.5"
                              />

                              {/* Hanging Garlic Bundles (Feixes de Alho em Rama com Rede e Malha) */}
                              {Array.from({ length: numBundles }).map((_, gIdx) => {
                                const gx = startX + bundleSpacing * gIdx + bundleSpacing * 0.5;
                                const bagTopY = railY + 5;
                                const bagHeight = 55;

                                return (
                                  <g key={`bundle-${bIdx}-${rIdx}-${gIdx}`} transform={`translate(${gx}, ${bagTopY})`}>
                                    {/* Suspension loop / String attached to rail */}
                                    <line x1="0" y1="-5" x2="0" y2="4" stroke={ts.woodStroke} strokeWidth="1.2" />
                                    
                                    {/* Garlic Bag Shape (Drop / Teardrop netted sack) */}
                                    <path
                                      d="M -7,6 C -11,22 -11,46 0,55 C 11,46 11,22 7,6 Z"
                                      fill={theme === 'graph-paper' ? '#FAF4EA' : '#231812'}
                                      stroke={ts.woodStroke}
                                      strokeWidth="1.2"
                                    />

                                    {/* Cross-hatch mesh netting lines on garlic bag */}
                                    <path
                                      d="M -5,12 L 5,42 M -8,22 L 6,50 M -8,34 L 2,54 M 5,12 L -5,42 M 8,22 L -6,50 M 8,34 L -2,54"
                                      stroke={ts.garlicMesh}
                                      strokeWidth="0.7"
                                      opacity="0.8"
                                    />

                                    {/* Individual garlic bulb circles inside netting */}
                                    <circle cx="-3" cy="22" r="2.5" fill={ts.garlicDot} stroke={ts.woodStroke} strokeWidth="0.4" />
                                    <circle cx="3" cy="25" r="2.8" fill={ts.garlicDot} stroke={ts.woodStroke} strokeWidth="0.4" />
                                    <circle cx="-1" cy="35" r="3.2" fill={ts.garlicDot} stroke={ts.woodStroke} strokeWidth="0.4" />
                                    <circle cx="4" cy="42" r="2.7" fill={ts.garlicDot} stroke={ts.woodStroke} strokeWidth="0.4" />
                                    <circle cx="-3" cy="46" r="2.6" fill={ts.garlicDot} stroke={ts.woodStroke} strokeWidth="0.4" />
                                    <circle cx="0" cy="51" r="2" fill={ts.garlicDot} />
                                  </g>
                                );
                              })}
                            </g>
                          );
                        })}
                      </g>
                    );
                  })}

                  {/* Detail A Callout Arc on Top Right (Dashed Arc exactly matching original drawing) */}
                  <g id="detail-a-callout-arc">
                    <path
                      d={`M ${originX + frameWidth - 160},${originY - 10} A 130 130 0 0 1 ${originX + frameWidth + 30},${originY + 160}`}
                      fill="none"
                      stroke={ts.dimLine}
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                    />
                  </g>

                  {/* ================= DIMENSION LINES (COTAS TÉCNICAS) ================= */}
                  {/* Left Vertical Dimension Line: 6m */}
                  <g id="dim-vertical-left">
                    {/* Extension lines */}
                    <line x1={originX - 45} y1={originY - 24} x2={originX - 15} y2={originY - 24} stroke={ts.dimLine} strokeWidth="1.2" />
                    <line x1={originX - 45} y1={originY + frameHeight} x2={originX - 15} y2={originY + frameHeight} stroke={ts.dimLine} strokeWidth="1.2" />
                    {/* Main vertical dimension line */}
                    <line x1={originX - 35} y1={originY - 24} x2={originX - 35} y2={originY + frameHeight} stroke={ts.dimLine} strokeWidth="1.2" />
                    {/* Tick / Arrows */}
                    <line x1={originX - 42} y1={originY - 17} x2={originX - 28} y2={originY - 31} stroke={ts.dimLine} strokeWidth="1.5" />
                    <line x1={originX - 42} y1={originY + frameHeight + 7} x2={originX - 28} y2={originY + frameHeight - 7} stroke={ts.dimLine} strokeWidth="1.5" />
                    {/* Label: 6m */}
                    <text
                      x={originX - 50}
                      y={originY + frameHeight / 2}
                      textAnchor="middle"
                      transform={`rotate(-90, ${originX - 50}, ${originY + frameHeight / 2})`}
                      fill={ts.textMain}
                      fontSize="14"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      6m
                    </text>
                  </g>

                  {/* Bottom Horizontal Dimension Lines: 120m | 40m | 12m | 12m */}
                  <g id="dim-horizontal-bottom">
                    {/* Main continuous dimension line */}
                    <line
                      x1={originX}
                      y1={originY + frameHeight + 40}
                      x2={originX + frameWidth}
                      y2={originY + frameHeight + 40}
                      stroke={ts.dimLine}
                      strokeWidth="1.2"
                    />

                    {/* Vertical tick marks at each post */}
                    {postPositions.map((px, pIdx) => (
                      <g key={`bot-tick-${pIdx}`}>
                        {/* Extension line from post bottom */}
                        <line x1={px} y1={originY + frameHeight + 5} x2={px} y2={originY + frameHeight + 55} stroke={ts.dimLine} strokeWidth="1" />
                        {/* Oblique CAD tick */}
                        <line x1={px - 6} y1={originY + frameHeight + 46} x2={px + 6} y2={originY + frameHeight + 34} stroke={ts.dimLine} strokeWidth="1.5" />
                      </g>
                    ))}

                    {/* Labels under each bay: 120m, 40m, 12m, 12m */}
                    <text
                      x={originX + bayWidths[0] / 2}
                      y={originY + frameHeight + 65}
                      textAnchor="middle"
                      fill={ts.textMain}
                      fontSize="14"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      120m
                    </text>
                    <text
                      x={originX + bayWidths[0] + bayWidths[1] / 2}
                      y={originY + frameHeight + 65}
                      textAnchor="middle"
                      fill={ts.textMain}
                      fontSize="14"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      40m
                    </text>
                    <text
                      x={originX + bayWidths[0] + bayWidths[1] + bayWidths[2] / 2}
                      y={originY + frameHeight + 65}
                      textAnchor="middle"
                      fill={ts.textMain}
                      fontSize="14"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      12m
                    </text>
                    <text
                      x={originX + bayWidths[0] + bayWidths[1] + bayWidths[2] + bayWidths[3] / 2}
                      y={originY + frameHeight + 65}
                      textAnchor="middle"
                      fill={ts.textMain}
                      fontSize="14"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      12m
                    </text>
                  </g>

                  {/* Bottom Left Title Block matching original drawing exactly */}
                  <g id="title-block-estaleiros" transform={`translate(${originX - 10}, ${originY + frameHeight + 110})`}>
                    <text
                      x="0"
                      y="0"
                      fill={ts.textMain}
                      fontSize="16"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                      letterSpacing="0.5"
                      textDecoration="underline"
                    >
                      DETALHE DO SISTEMA DE PENDURAÇÃO INDUSTRIAL (ESTALEIROS)
                    </text>
                    <text
                      x="0"
                      y="20"
                      fill={ts.textSub}
                      fontSize="12"
                      fontFamily="monospace"
                    >
                      Scale 1:200
                    </text>
                  </g>
                </g>
              )}

              {/* ========================================================================= */}
              {/* VIEW 2: FACHADA LATERAL EXTERNA (1:150) */}
              {/* ========================================================================= */}
              {subView === 'lateral-facade-150' && (
                <g id="drawing-fachada-lateral-1-150">
                  {/* Ground level */}
                  <line x1="80" y1="640" x2="1370" y2="640" stroke="#4B5563" strokeWidth="3" />

                  {/* Shed Roof Slope */}
                  <polygon
                    points="120,240 1330,340 1330,370 120,270"
                    fill="#3E2723"
                    stroke={ts.woodStroke}
                    strokeWidth="2.5"
                  />

                  {/* Wall Exterior Wood Siding (Madeira Tratada) */}
                  <rect
                    x="120"
                    y="270"
                    width="1210"
                    height="370"
                    fill={theme === 'graph-paper' ? '#F4ECE1' : '#1A1A1A'}
                    stroke={ts.woodStroke}
                    strokeWidth="2"
                  />

                  {/* Vertical Siding Planks */}
                  {Array.from({ length: 48 }).map((_, p) => (
                    <line
                      key={`siding-${p}`}
                      x1={145 + p * 25}
                      y1={270 + (p * 25 * 70) / 1210}
                      x2={145 + p * 25}
                      y2="640"
                      stroke={ts.woodColor}
                      strokeWidth="0.7"
                      opacity="0.4"
                    />
                  ))}

                  {/* Lateral Louvers Array (12 Louver Modules) */}
                  {Array.from({ length: 12 }).map((_, m) => {
                    const lx = 160 + m * 95;
                    return (
                      <g key={`facade-louver-${m}`}>
                        <rect x={lx} y="440" width="70" height="90" fill="#0F172A" stroke="#0284C7" strokeWidth="1.5" />
                        {Array.from({ length: 5 }).map((_, b) => (
                          <line key={`b-${b}`} x1={lx + 5} y1={455 + b * 15} x2={lx + 65} y2={455 + b * 15} stroke="#38BDF8" strokeWidth="1.2" />
                        ))}
                      </g>
                    );
                  })}

                  {/* Access Door */}
                  <g id="access-door" transform="translate(680, 520)">
                    <rect x="0" y="0" width="90" height="120" fill="#0F172A" stroke={ts.woodStroke} strokeWidth="2" />
                    <line x1="45" y1="0" x2="45" y2="120" stroke={ts.woodStroke} strokeWidth="1.5" />
                  </g>

                  {/* Dimensions */}
                  <line x1="120" y1="690" x2="1330" y2="690" stroke={ts.dimLine} strokeWidth="1.5" />
                  <line x1="120" y1="680" x2="120" y2="700" stroke={ts.dimLine} strokeWidth="1.5" />
                  <line x1="1330" y1="680" x2="1330" y2="700" stroke={ts.dimLine} strokeWidth="1.5" />
                  <text x="725" y="715" textAnchor="middle" fill={ts.textMain} fontSize="14" fontWeight="bold" fontFamily="monospace">
                    COMPRIMENTO TOTAL: 120,00 m
                  </text>

                  {/* Title Block */}
                  <g id="title-block-fachada" transform="translate(120, 120)">
                    <text x="0" y="0" fill={ts.textMain} fontSize="18" fontWeight="bold" fontFamily="sans-serif" textDecoration="underline">
                      ELEVAÇÃO LATERAL
                    </text>
                    <text x="0" y="20" fill={ts.textSub} fontSize="12" fontFamily="monospace">
                      (escala: 1:150)
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
