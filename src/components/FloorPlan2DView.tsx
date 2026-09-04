import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Layers,
  Sparkles,
  Download,
  Printer,
  Wind,
  Truck,
  CheckCircle2,
  Info
} from 'lucide-react';
import { StructuralMetrics, BlueprintTheme } from '../types';

interface FloorPlan2DViewProps {
  metrics: StructuralMetrics;
}

export const FloorPlan2DView: React.FC<FloorPlan2DViewProps> = ({ metrics }) => {
  const [zoom, setZoom] = useState<number>(0.7);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [theme, setTheme] = useState<BlueprintTheme>('graph-paper');
  const [showThemeMenu, setShowThemeMenu] = useState<boolean>(false);
  const [showOriginalComparison, setShowOriginalComparison] = useState<boolean>(false);
  const [showLayersMenu, setShowLayersMenu] = useState<boolean>(false);
  const [isImmersive, setIsImmersive] = useState<boolean>(false);

  // Layers
  const [layers, setLayers] = useState({
    pillars: true,
    garlicModules: true,
    louvers: true,
    truck: true,
    dimensions: true,
    doors: true,
    grid: true,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; dist?: number }>({ x: 0, y: 0 });

  const svgWidth = 1180;
  const svgHeight = 1560;

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
  }, []);

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

  // Palette configs based on theme
  const getThemeStyles = () => {
    switch (theme) {
      case 'graph-paper':
        return {
          bg: '#FCFBF7',
          gridLine: '#E4DFD5',
          woodColor: '#8C6239',
          woodFill: '#F4ECE1',
          woodStroke: '#3E2723',
          garlicDot: '#3E2723',
          louverColor: '#0284C7',
          louverFill: '#BAE6FD',
          doorColor: '#0284C7',
          textMain: '#1F2937',
          textSub: '#4B5563',
          borderDim: '#D1C7B7',
          dimLine: '#3E2723',
          truckBody: '#475569',
        };
      case 'blueprint-blue':
        return {
          bg: '#0F2744',
          gridLine: '#1E3E66',
          woodColor: '#38BDF8',
          woodFill: '#163359',
          woodStroke: '#7DD3FC',
          garlicDot: '#BAE6FD',
          louverColor: '#7DD3FC',
          louverFill: '#0C4A6E',
          doorColor: '#7DD3FC',
          textMain: '#F0F9FF',
          textSub: '#93C5FD',
          borderDim: '#38BDF8',
          dimLine: '#38BDF8',
          truckBody: '#38BDF8',
        };
      case 'realistic-wood':
        return {
          bg: '#1C1510',
          gridLine: '#2D221B',
          woodColor: '#E6A86C',
          woodFill: '#2E1E14',
          woodStroke: '#D4A373',
          garlicDot: '#FDE68A',
          louverColor: '#38BDF8',
          louverFill: '#0F2744',
          doorColor: '#38BDF8',
          textMain: '#FEF3C7',
          textSub: '#D4A373',
          borderDim: '#D4A373',
          dimLine: '#D4A373',
          truckBody: '#64748B',
        };
      case 'cad-dark':
      default:
        return {
          bg: '#0A0A0A',
          gridLine: '#181818',
          woodColor: '#D4A373',
          woodFill: '#1A1A1A',
          woodStroke: '#D4A373',
          garlicDot: '#E5E7EB',
          louverColor: '#38BDF8',
          louverFill: '#1E293B',
          doorColor: '#38BDF8',
          textMain: '#E5E7EB',
          textSub: '#9CA3AF',
          borderDim: '#D4A373',
          dimLine: '#D4A373',
          truckBody: '#4ADE80',
        };
    }
  };

  const ts = getThemeStyles();

  // Layout bounds for Planta Baixa matching image 2 (IMG_20260827_221551.png.jpg)
  const planX = 210;
  const planY = 130;
  const planW = 720;  // Represents 80.00m
  const planH = 1200; // Represents 90.00m / 120.00m

  // 8 Grid Rows (vertical spacing) & 4 Column lines (3 bays)
  const numBaysY = 8;
  const bayH = planH / numBaysY;
  const bayWLeft = planW * 0.35;
  const bayWCenter = planW * 0.30;
  const bayWRight = planW * 0.35;

  return (
    <div className={`flex flex-col h-full bg-[#0F0F0F] text-[#E5E7EB] overflow-hidden select-none relative ${isImmersive ? 'fixed inset-0 z-50' : ''}`}>
      {/* Top Control Bar */}
      {!isImmersive && (
        <div className="bg-[#111111] border-b border-[#2D2D2D] z-10 shrink-0">
          <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5 overflow-x-auto scrollbar-none">
            {/* Title & Scale */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="px-2 py-0.5 bg-[#1A1A1A] text-[#D4A373] font-mono text-[11px] sm:text-xs font-bold rounded border border-[#2D2D2D] flex items-center gap-1.5 shadow-xs">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#D4A373] animate-pulse"></span>
                <span>PLANTA BAIXA</span>
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-serif font-bold text-[#D4A373] tracking-tight flex items-center gap-1.5">
                  VISÃO DE CIMA (NÍVEL 0.00)
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1A1A1A] text-[#D4A373] font-mono border border-[#D4A373]/30">
                    1:300
                  </span>
                </h2>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={handleFitToScreen}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[#1A1A1A] hover:bg-[#262626] text-[#D4A373] rounded border border-[#2D2D2D] font-semibold transition-colors"
                title="Ajustar Planta à Tela"
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
                title="Camadas da Planta Baixa"
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

              {/* Photo reference comparison */}
              <button
                onClick={() => setShowOriginalComparison(!showOriginalComparison)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[#26201a] hover:bg-[#33261a] text-[#D4A373] rounded border border-[#D4A373]/50 font-semibold transition-colors"
                title="Comparar com a foto da prancha"
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
        {/* Layers Drawer */}
        {showLayersMenu && (
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-40 bg-[#1A1A1A]/95 backdrop-blur-xs border border-[#2D2D2D] rounded p-3 shadow-2xl text-xs w-64 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2D2D2D]">
              <span className="font-bold text-[#D4A373] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Camadas da Planta
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
                  checked={layers.pillars}
                  onChange={(e) => setLayers({ ...layers, pillars: e.target.checked })}
                  className="rounded accent-[#D4A373] w-4 h-4 bg-[#262626] border-[#2D2D2D]"
                />
                <span>Pilares 25×25 cm</span>
              </label>

              <label className="flex items-center gap-2.5 text-[#E5E7EB] cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={layers.garlicModules}
                  onChange={(e) => setLayers({ ...layers, garlicModules: e.target.checked })}
                  className="rounded accent-[#D4A373] w-4 h-4 bg-[#262626] border-[#2D2D2D]"
                />
                <span>Estruturas de Alho em Rama</span>
              </label>

              <label className="flex items-center gap-2.5 text-[#E5E7EB] cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={layers.louvers}
                  onChange={(e) => setLayers({ ...layers, louvers: e.target.checked })}
                  className="rounded accent-[#38bdf8] w-4 h-4 bg-[#262626] border-[#2D2D2D]"
                />
                <span>Venezianas Reguláveis</span>
              </label>

              <label className="flex items-center gap-2.5 text-[#E5E7EB] cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={layers.truck}
                  onChange={(e) => setLayers({ ...layers, truck: e.target.checked })}
                  className="rounded accent-[#4ade80] w-4 h-4 bg-[#262626] border-[#2D2D2D]"
                />
                <span>Caminhão na Baia 3.50m</span>
              </label>

              <label className="flex items-center gap-2.5 text-[#E5E7EB] cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={layers.doors}
                  onChange={(e) => setLayers({ ...layers, doors: e.target.checked })}
                  className="rounded accent-[#0284C7] w-4 h-4 bg-[#262626] border-[#2D2D2D]"
                />
                <span>Portões de Acesso Duplo</span>
              </label>

              <label className="flex items-center gap-2.5 text-[#E5E7EB] cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={layers.dimensions}
                  onChange={(e) => setLayers({ ...layers, dimensions: e.target.checked })}
                  className="rounded accent-[#D4A373] w-4 h-4 bg-[#262626] border-[#2D2D2D]"
                />
                <span>Cotas Técnicas (80.00 / 25.00 / 3.50)</span>
              </label>
            </div>
          </div>
        )}

        {/* Original Drawing Comparison Modal */}
        {showOriginalComparison && (
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-40 w-80 sm:w-96 bg-[#1A1A1A] rounded border border-[#D4A373]/60 p-3.5 shadow-2xl animate-in fade-in zoom-in-95 max-w-[calc(100vw-32px)]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2D2D2D]">
              <span className="text-xs font-bold text-[#D4A373] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#D4A373]" />
                Prancha Original da Planta Baixa
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
                src="1787878560389.png"
                alt="Original Architectural Blueprint Sheet"
                className="w-full object-contain max-h-56"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
              Reprodução 1:1 de <strong>PLANTA BAIXA - NÍVEL 0.00 (escala: 1:300)</strong>, contendo as cotas 80.00, 25.00, 3.50, 90.00, 28.00, caminhão na vaga de descarga, venezianas reguláveis, matriz pontilhada de alho e linha de corte A-A'.
            </p>
          </div>
        )}

        {/* Bottom Dimensions Pill */}
        <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-20 pointer-events-none">
          <div className="bg-[#1A1A1A]/90 text-[#E5E7EB] backdrop-blur-xs px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded border border-[#2D2D2D] shadow-lg text-[11px] sm:text-xs font-mono flex items-center gap-3">
            <div><span className="text-[#6B7280]">PLANTA:</span> <span className="text-white font-medium ml-1">80,00m × 90,00m</span></div>
            <div><span className="text-[#6B7280]">PILAR:</span> <span className="text-[#D4A373] font-bold ml-1">25×25 cm</span></div>
            <div><span className="text-[#6B7280]">BAIA CAMINHÃO:</span> <span className="text-[#4ade80] font-bold ml-1">3,50 m</span></div>
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
                <pattern id="fp-grid-pattern" width="25" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 25 0 L 0 0 0 25" fill="none" stroke={ts.gridLine} strokeWidth="0.6" />
                </pattern>

                <marker id="fp-arrow-marker" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 2 L 8 5 L 0 8 z" fill={ts.dimLine} />
                </marker>
              </defs>

              {/* Grid Background */}
              {layers.grid && <rect width={svgWidth} height={svgHeight} fill="url(#fp-grid-pattern)" />}

              {/* ================= BUILDING FLOOR CONCRETE SLAB OUTLINE ================= */}
              <rect
                x={planX}
                y={planY}
                width={planW}
                height={planH}
                fill={theme === 'graph-paper' ? '#FAF6EF' : '#121212'}
                stroke={ts.woodStroke}
                strokeWidth="2.5"
              />

              {/* ================= VENEZIANAS REGULÁVEIS (LATERAIS) ================= */}
              {layers.louvers && (
                <g id="venezianas-laterais">
                  {/* Left Side Louvers (8 units) */}
                  {Array.from({ length: 8 }).map((_, i) => {
                    const ly = planY + 25 + i * (planH / 8);
                    return (
                      <g key={`louver-left-${i}`}>
                        <rect x={planX - 16} y={ly + 10} width="16" height={bayH - 35} fill={ts.louverFill} stroke={ts.louverColor} strokeWidth="1.5" />
                        {/* Louver angle slates */}
                        {Array.from({ length: 4 }).map((_, b) => (
                          <line
                            key={`sl-l-${b}`}
                            x1={planX - 14}
                            y1={ly + 25 + b * 22}
                            x2={planX - 2}
                            y2={ly + 35 + b * 22}
                            stroke={ts.louverColor}
                            strokeWidth="1.5"
                          />
                        ))}
                      </g>
                    );
                  })}

                  {/* Right Side Louvers (8 units) */}
                  {Array.from({ length: 8 }).map((_, i) => {
                    const ly = planY + 25 + i * (planH / 8);
                    return (
                      <g key={`louver-right-${i}`}>
                        <rect x={planX + planW} y={ly + 10} width="16" height={bayH - 35} fill={ts.louverFill} stroke={ts.louverColor} strokeWidth="1.5" />
                        {Array.from({ length: 4 }).map((_, b) => (
                          <line
                            key={`sl-r-${b}`}
                            x1={planX + planW + 2}
                            y1={ly + 25 + b * 22}
                            x2={planX + planW + 14}
                            y2={ly + 35 + b * 22}
                            stroke={ts.louverColor}
                            strokeWidth="1.5"
                          />
                        ))}
                      </g>
                    );
                  })}

                  {/* Callout: VENEZIANAS REGULÁVEIS (Upper Right) */}
                  <g id="callout-venezianas-1" transform={`translate(${planX + planW + 40}, ${planY + 320})`}>
                    <path d="M 0 0 L -25 0 L -25 15" fill="none" stroke={ts.woodStroke} strokeWidth="1.2" />
                    <circle cx="-25" cy="15" r="3" fill={ts.louverColor} />
                    <text x="10" y="-8" fill={ts.textMain} fontSize="12" fontWeight="bold" fontFamily="monospace">
                      VENEZIANAS
                    </text>
                    <text x="10" y="8" fill={ts.textMain} fontSize="12" fontWeight="bold" fontFamily="monospace">
                      REGULÁVEIS
                    </text>
                  </g>

                  {/* Callout: VENEZIANAS REGULÁVEIS (Lower Right) */}
                  <g id="callout-venezianas-2" transform={`translate(${planX + planW + 40}, ${planY + 760})`}>
                    <path d="M 0 0 L -30 0 L -30 -30" fill="none" stroke={ts.woodStroke} strokeWidth="1.2" />
                    <circle cx="-30" cy="-30" r="3" fill={ts.louverColor} />
                    <text x="10" y="-8" fill={ts.textMain} fontSize="12" fontWeight="bold" fontFamily="monospace">
                      VENEZIANAS
                    </text>
                    <text x="10" y="8" fill={ts.textMain} fontSize="12" fontWeight="bold" fontFamily="monospace">
                      REGULÁVEIS
                    </text>
                  </g>
                </g>
              )}

              {/* ================= DOUBLE ACCESS DOORS (TOP & BOTTOM) ================= */}
              {layers.doors && (
                <g id="doors-top-bottom">
                  {/* Top Left Double Door */}
                  <g id="top-door-left" transform={`translate(${planX + 120}, ${planY})`}>
                    <line x1="0" y1="0" x2="60" y2="0" stroke="#FFFFFF" strokeWidth="4" />
                    {/* Door leaves swung open */}
                    <line x1="0" y1="0" x2="20" y2="-20" stroke={ts.doorColor} strokeWidth="2" />
                    <line x1="60" y1="0" x2="40" y2="-20" stroke={ts.doorColor} strokeWidth="2" />
                    <path d="M 20 -20 A 30 30 0 0 1 0 0" fill="none" stroke={ts.doorColor} strokeWidth="1" strokeDasharray="3 3" />
                    <path d="M 40 -20 A 30 30 0 0 0 60 0" fill="none" stroke={ts.doorColor} strokeWidth="1" strokeDasharray="3 3" />
                  </g>

                  {/* Top Right Double Door */}
                  <g id="top-door-right" transform={`translate(${planX + 380}, ${planY})`}>
                    <line x1="0" y1="0" x2="60" y2="0" stroke="#FFFFFF" strokeWidth="4" />
                    <line x1="0" y1="0" x2="20" y2="-20" stroke={ts.doorColor} strokeWidth="2" />
                    <line x1="60" y1="0" x2="40" y2="-20" stroke={ts.doorColor} strokeWidth="2" />
                    <path d="M 20 -20 A 30 30 0 0 1 0 0" fill="none" stroke={ts.doorColor} strokeWidth="1" strokeDasharray="3 3" />
                    <path d="M 40 -20 A 30 30 0 0 0 60 0" fill="none" stroke={ts.doorColor} strokeWidth="1" strokeDasharray="3 3" />
                  </g>

                  {/* Bottom Left Double Door */}
                  <g id="bot-door-left" transform={`translate(${planX + 140}, ${planY + planH})`}>
                    <line x1="0" y1="0" x2="60" y2="0" stroke="#FFFFFF" strokeWidth="4" />
                    <line x1="0" y1="0" x2="20" y2="20" stroke={ts.doorColor} strokeWidth="2" />
                    <line x1="60" y1="0" x2="40" y2="20" stroke={ts.doorColor} strokeWidth="2" />
                    <path d="M 20 20 A 30 30 0 0 0 0 0" fill="none" stroke={ts.doorColor} strokeWidth="1" strokeDasharray="3 3" />
                    <path d="M 40 20 A 30 30 0 0 1 60 0" fill="none" stroke={ts.doorColor} strokeWidth="1" strokeDasharray="3 3" />
                  </g>

                  {/* Bottom Right Double Door */}
                  <g id="bot-door-right" transform={`translate(${planX + 380}, ${planY + planH})`}>
                    <line x1="0" y1="0" x2="60" y2="0" stroke="#FFFFFF" strokeWidth="4" />
                    <line x1="0" y1="0" x2="20" y2="20" stroke={ts.doorColor} strokeWidth="2" />
                    <line x1="60" y1="0" x2="40" y2="20" stroke={ts.doorColor} strokeWidth="2" />
                    <path d="M 20 20 A 30 30 0 0 0 0 0" fill="none" stroke={ts.doorColor} strokeWidth="1" strokeDasharray="3 3" />
                    <path d="M 40 20 A 30 30 0 0 1 60 0" fill="none" stroke={ts.doorColor} strokeWidth="1" strokeDasharray="3 3" />
                  </g>
                </g>
              )}

              {/* ================= CAMINHÃO ESTACIONADO NA VAGA SUPERIOR DIREITA (3.50m) ================= */}
              {layers.truck && (
                <g id="truck-top-right-bay" transform={`translate(${planX + planW - 75}, ${planY + 20})`}>
                  {/* Outer Truck Outline */}
                  <rect x="0" y="0" width="55" height="120" rx="5" fill="#1E293B" stroke="#475569" strokeWidth="1.8" />
                  {/* Windshield & Cabin at bottom of vehicle */}
                  <path d="M 6 95 L 49 95 L 45 112 L 10 112 Z" fill="#38BDF8" opacity="0.6" stroke="#475569" strokeWidth="1" />
                  <rect x="5" y="85" width="45" height="30" rx="3" fill="none" stroke="#475569" strokeWidth="1.5" />
                  {/* Side Mirrors */}
                  <rect x="-6" y="96" width="6" height="12" rx="2" fill="#475569" />
                  <rect x="55" y="96" width="6" height="12" rx="2" fill="#475569" />
                  {/* Cargo Bed Ribs (Linhas verticais da carroceria de carga) */}
                  {Array.from({ length: 8 }).map((_, r) => (
                    <line key={`truck-bed-rib-${r}`} x1={8 + r * 5} y1="8" x2={8 + r * 5} y2="80" stroke="#94A3B8" strokeWidth="0.8" />
                  ))}
                </g>
              )}

              {/* ================= ESTRUTURAS DE MADEIRA COM ALHO EM RAMA (MATRIZ PONTILHADA) ================= */}
              {layers.garlicModules && (
                <g id="matriz-alhos-planta">
                  {/* 3 Main Column Arrays of Hanging Garlic Bundles (Left Bay, Center Bay, Right Bay) */}
                  {/* Array Column 1: Left Wing (6 columns of dots) */}
                  {Array.from({ length: 6 }).map((_, c) => {
                    const gx = planX + 50 + c * 24;
                    return (
                      <g key={`garlic-col-left-${c}`}>
                        {Array.from({ length: 44 }).map((_, r) => {
                          const gy = planY + 35 + r * 25;
                          return (
                            <circle
                              key={`g-dot-l-${c}-${r}`}
                              cx={gx}
                              cy={gy}
                              r="2.2"
                              fill="none"
                              stroke={ts.garlicDot}
                              strokeWidth="0.8"
                            />
                          );
                        })}
                      </g>
                    );
                  })}

                  {/* Array Column 2: Center Left (4 columns of dots) */}
                  {Array.from({ length: 4 }).map((_, c) => {
                    const gx = planX + 270 + c * 22;
                    return (
                      <g key={`garlic-col-mid1-${c}`}>
                        {Array.from({ length: 44 }).map((_, r) => {
                          const gy = planY + 35 + r * 25;
                          return (
                            <circle
                              key={`g-dot-m1-${c}-${r}`}
                              cx={gx}
                              cy={gy}
                              r="2.2"
                              fill="none"
                              stroke={ts.garlicDot}
                              strokeWidth="0.8"
                            />
                          );
                        })}
                      </g>
                    );
                  })}

                  {/* Central Aisle Label text (CORREDOR / ACESSO vertical) */}
                  <text
                    x={planX + 380}
                    y={planY + 600}
                    textAnchor="middle"
                    transform={`rotate(-90, ${planX + 380}, ${planY + 600})`}
                    fill={ts.textSub}
                    fontSize="11"
                    fontFamily="monospace"
                    letterSpacing="3"
                  >
                    CORREDOR
                  </text>

                  {/* Array Column 3: Center Right & Right Wing (6 columns of dots) */}
                  {Array.from({ length: 6 }).map((_, c) => {
                    const gx = planX + 410 + c * 24;
                    return (
                      <g key={`garlic-col-mid2-${c}`}>
                        {Array.from({ length: 44 }).map((_, r) => {
                          // Leave space where truck is parked on the top right
                          const gy = planY + 35 + r * 25;
                          if (c >= 3 && r < 6) return null;
                          return (
                            <circle
                              key={`g-dot-m2-${c}-${r}`}
                              cx={gx}
                              cy={gy}
                              r="2.2"
                              fill="none"
                              stroke={ts.garlicDot}
                              strokeWidth="0.8"
                            />
                          );
                        })}
                      </g>
                    );
                  })}

                  {/* Callout: ESTRUTURAS DE MADEIRA COM ALHO EM RAMA (Top Right) */}
                  <g id="callout-alho-1" transform={`translate(${planX + planW + 40}, ${planY + 230})`}>
                    <path d="M 0 0 L -80 0 L -120 -30" fill="none" stroke={ts.woodStroke} strokeWidth="1.2" />
                    <circle cx="-120" cy="-30" r="3" fill={ts.woodStroke} />
                    <text x="10" y="-8" fill={ts.textMain} fontSize="12" fontWeight="bold" fontFamily="monospace">
                      ESTRUTURAS DE
                    </text>
                    <text x="10" y="8" fill={ts.textMain} fontSize="12" fontWeight="bold" fontFamily="monospace">
                      MADEIRA COM
                    </text>
                    <text x="10" y="24" fill={ts.textMain} fontSize="12" fontWeight="bold" fontFamily="monospace">
                      ALHO EM RAMA
                    </text>
                  </g>

                  {/* Callout: ESTRUTURAS DE MADEIRA COM ALHO EM RAMA (Middle Right) */}
                  <g id="callout-alho-2" transform={`translate(${planX + planW + 40}, ${planY + 500})`}>
                    <path d="M 0 0 L -80 0 L -120 -30" fill="none" stroke={ts.woodStroke} strokeWidth="1.2" />
                    <circle cx="-120" cy="-30" r="3" fill={ts.woodStroke} />
                    <text x="10" y="-8" fill={ts.textMain} fontSize="12" fontWeight="bold" fontFamily="monospace">
                      ESTRUTURAS DE
                    </text>
                    <text x="10" y="8" fill={ts.textMain} fontSize="12" fontWeight="bold" fontFamily="monospace">
                      MADEIRA COM
                    </text>
                    <text x="10" y="24" fill={ts.textMain} fontSize="12" fontWeight="bold" fontFamily="monospace">
                      ALHO EM RAMA
                    </text>
                  </g>
                </g>
              )}

              {/* ================= SECTION CUTTING LINE A - A' (CORTE HORIZONTAL) ================= */}
              <g id="corte-linha-aa">
                <line
                  x1={planX - 45}
                  y1={planY + planH * 0.52}
                  x2={planX + planW + 45}
                  y2={planY + planH * 0.52}
                  stroke={ts.woodStroke}
                  strokeWidth="1.8"
                  strokeDasharray="14 6 3 6"
                />

                {/* Left Cut Symbol: A with arrow pointing down */}
                <g id="corte-left-a" transform={`translate(${planX - 35}, ${planY + planH * 0.52})`}>
                  <line x1="0" y1="0" x2="-20" y2="0" stroke={ts.woodStroke} strokeWidth="2" />
                  <line x1="-20" y1="0" x2="-20" y2="25" stroke={ts.woodStroke} strokeWidth="2" />
                  <polygon points="-24,25 -16,25 -20,35" fill={ts.woodStroke} />
                  <text x="-38" y="18" fill={ts.textMain} fontSize="16" fontWeight="bold" fontFamily="monospace">
                    A
                  </text>
                </g>

                {/* Right Cut Symbol: A' with arrow pointing down */}
                <g id="corte-right-a" transform={`translate(${planX + planW + 35}, ${planY + planH * 0.52})`}>
                  <line x1="0" y1="0" x2="20" y2="0" stroke={ts.woodStroke} strokeWidth="2" />
                  <line x1="20" y1="0" x2="20" y2="25" stroke={ts.woodStroke} strokeWidth="2" />
                  <polygon points="16,25 24,25 20,35" fill={ts.woodStroke} />
                  <text x="30" y="18" fill={ts.textMain} fontSize="16" fontWeight="bold" fontFamily="monospace">
                    A'
                  </text>
                </g>
              </g>

              {/* ================= PILARES DE MADEIRA 25x25cm (GRID & CALLOUTS) ================= */}
              {layers.pillars && (
                <g id="pilares-25x25-grid">
                  {/* Grid Lines between pillars */}
                  {Array.from({ length: 4 }).map((_, c) => {
                    const px = planX + c * (planW / 3);
                    return (
                      <line
                        key={`grid-line-col-${c}`}
                        x1={px}
                        y1={planY}
                        x2={px}
                        y2={planY + planH}
                        stroke={ts.woodStroke}
                        strokeWidth="0.8"
                        strokeDasharray="4 4"
                        opacity="0.4"
                      />
                    );
                  })}
                  {Array.from({ length: 9 }).map((_, r) => {
                    const py = planY + r * (planH / 8);
                    return (
                      <line
                        key={`grid-line-row-${r}`}
                        x1={planX}
                        y1={py}
                        x2={planX + planW}
                        y2={py}
                        stroke={ts.woodStroke}
                        strokeWidth="0.8"
                        strokeDasharray="4 4"
                        opacity="0.4"
                      />
                    );
                  })}

                  {/* 4 columns x 9 rows of Timber Pillars 25x25cm */}
                  {Array.from({ length: 4 }).map((_, c) => {
                    const px = planX + c * (planW / 3);
                    return (
                      <g key={`pillar-col-${c}`}>
                        {Array.from({ length: 9 }).map((_, r) => {
                          const py = planY + r * (planH / 8);
                          return (
                            <g key={`p-node-${c}-${r}`}>
                              {/* Footing square outline */}
                              <rect
                                x={px - 8}
                                y={py - 8}
                                width="16"
                                height="16"
                                fill={theme === 'graph-paper' ? '#FFFFFF' : '#262626'}
                                stroke={ts.woodStroke}
                                strokeWidth="1.2"
                              />
                              {/* Pillar cross hatch (25x25cm) */}
                              <line x1={px - 8} y1={py - 8} x2={px + 8} y2={py + 8} stroke={ts.woodStroke} strokeWidth="1" />
                              <line x1={px - 8} y1={py + 8} x2={px + 8} y2={py - 8} stroke={ts.woodStroke} strokeWidth="1" />
                            </g>
                          );
                        })}
                      </g>
                    );
                  })}

                  {/* Callout: PILARES DE MADEIRA 25x25cm (Top Right) */}
                  <g id="callout-pilar-top" transform={`translate(${planX + planW + 40}, ${planY + 110})`}>
                    <path d="M 0 0 L -30 0 L -40 -105" fill="none" stroke={ts.woodStroke} strokeWidth="1.2" />
                    <circle cx="-40" cy="-105" r="3" fill={ts.woodStroke} />
                    <text x="10" y="-8" fill={ts.textMain} fontSize="12" fontWeight="bold" fontFamily="monospace">
                      PILARES DE
                    </text>
                    <text x="10" y="8" fill={ts.textMain} fontSize="12" fontWeight="bold" fontFamily="monospace">
                      MADEIRA
                    </text>
                    <text x="10" y="24" fill={ts.textMain} fontSize="12" fontWeight="bold" fontFamily="monospace">
                      25x25cm
                    </text>
                  </g>

                  {/* Callout: PILARES DE MADEIRA (Second Row Right) */}
                  <g id="callout-pilar-2" transform={`translate(${planX + planW + 40}, ${planY + 170})`}>
                    <path d="M 0 0 L -30 0 L -40 -20" fill="none" stroke={ts.woodStroke} strokeWidth="1.2" />
                    <circle cx="-40" cy="-20" r="3" fill={ts.woodStroke} />
                    <text x="10" y="-8" fill={ts.textMain} fontSize="12" fontWeight="bold" fontFamily="monospace">
                      PILARES DE
                    </text>
                    <text x="10" y="8" fill={ts.textMain} fontSize="12" fontWeight="bold" fontFamily="monospace">
                      MADEIRA
                    </text>
                  </g>
                </g>
              )}

              {/* ================= CALLOUT: PISO DE CONCRETO SIMPLES (BOTTOM RIGHT) ================= */}
              <g id="callout-piso-concreto" transform={`translate(${planX + planW + 40}, ${planY + planH - 80})`}>
                <path d="M 0 0 L -60 0 L -120 -40" fill="none" stroke={ts.woodStroke} strokeWidth="1.2" />
                <circle cx="-120" cy="-40" r="3" fill={ts.woodStroke} />
                <text x="10" y="-8" fill={ts.textMain} fontSize="12" fontWeight="bold" fontFamily="monospace">
                  PISO DE CONCRETO
                </text>
                <text x="10" y="8" fill={ts.textMain} fontSize="12" fontWeight="bold" fontFamily="monospace">
                  SIMPLES
                </text>
              </g>

              {/* ================= DIMENSION LINES (COTAS TÉCNICAS) ================= */}
              {layers.dimensions && (
                <g id="cotas-tecnicas-planta">
                  {/* TOP COTAS */}
                  {/* Outer Top Cota: 80.00 */}
                  <line x1={planX} y1={planY - 70} x2={planX + planW} y2={planY - 70} stroke={ts.dimLine} strokeWidth="1.2" />
                  <line x1={planX} y1={planY - 80} x2={planX} y2={planY - 10} stroke={ts.dimLine} strokeWidth="1" />
                  <line x1={planX + planW} y1={planY - 80} x2={planX + planW} y2={planY - 10} stroke={ts.dimLine} strokeWidth="1" />
                  {/* Oblique ticks */}
                  <line x1={planX - 6} y1={planY - 64} x2={planX + 6} y2={planY - 76} stroke={ts.dimLine} strokeWidth="1.5" />
                  <line x1={planX + planW - 6} y1={planY - 64} x2={planX + planW + 6} y2={planY - 76} stroke={ts.dimLine} strokeWidth="1.5" />
                  <text x={planX + planW / 2} y={planY - 78} textAnchor="middle" fill={ts.textMain} fontSize="15" fontWeight="bold" fontFamily="monospace">
                    80.00
                  </text>

                  {/* Inner Top Cotas: 25.00 (Central Aisle) and 3.50 (Right Truck Bay) */}
                  <line x1={planX + planW * 0.33} y1={planY - 45} x2={planX + planW * 0.66} y2={planY - 45} stroke={ts.dimLine} strokeWidth="1.2" />
                  <line x1={planX + planW * 0.33} y1={planY - 55} x2={planX + planW * 0.33} y2={planY - 10} stroke={ts.dimLine} strokeWidth="1" />
                  <line x1={planX + planW * 0.66} y1={planY - 55} x2={planX + planW * 0.66} y2={planY - 10} stroke={ts.dimLine} strokeWidth="1" />
                  <line x1={planX + planW * 0.33 - 5} y1={planY - 40} x2={planX + planW * 0.33 + 5} y2={planY - 50} stroke={ts.dimLine} strokeWidth="1.5" />
                  <line x1={planX + planW * 0.66 - 5} y1={planY - 40} x2={planX + planW * 0.66 + 5} y2={planY - 50} stroke={ts.dimLine} strokeWidth="1.5" />
                  <text x={planX + planW * 0.495} y={planY - 52} textAnchor="middle" fill={ts.textMain} fontSize="14" fontWeight="bold" fontFamily="monospace">
                    25.00
                  </text>

                  {/* 3.50 Truck Cota Top Right */}
                  <line x1={planX + planW - 80} y1={planY - 45} x2={planX + planW} y2={planY - 45} stroke={ts.dimLine} strokeWidth="1.2" />
                  <line x1={planX + planW - 80} y1={planY - 55} x2={planX + planW - 80} y2={planY - 10} stroke={ts.dimLine} strokeWidth="1" />
                  <line x1={planX + planW - 80 - 5} y1={planY - 40} x2={planX + planW - 80 + 5} y2={planY - 50} stroke={ts.dimLine} strokeWidth="1.5" />
                  <text x={planX + planW - 40} y={planY - 52} textAnchor="middle" fill={ts.textMain} fontSize="14" fontWeight="bold" fontFamily="monospace">
                    3.50
                  </text>

                  {/* LEFT COTAS */}
                  {/* Outer Left Cota: 90.00 / 120.00 */}
                  <line x1={planX - 85} y1={planY} x2={planX - 85} y2={planY + planH} stroke={ts.dimLine} strokeWidth="1.2" />
                  <line x1={planX - 95} y1={planY} x2={planX - 10} y2={planY} stroke={ts.dimLine} strokeWidth="1" />
                  <line x1={planX - 95} y1={planY + planH} x2={planX - 10} y2={planY + planH} stroke={ts.dimLine} strokeWidth="1" />
                  <line x1={planX - 91} y1={planY + 6} x2={planX - 79} y2={planY - 6} stroke={ts.dimLine} strokeWidth="1.5" />
                  <line x1={planX - 91} y1={planY + planH + 6} x2={planX - 79} y2={planY + planH - 6} stroke={ts.dimLine} strokeWidth="1.5" />
                  <text
                    x={planX - 98}
                    y={planY + planH / 2}
                    textAnchor="middle"
                    transform={`rotate(-90, ${planX - 98}, ${planY + planH / 2})`}
                    fill={ts.textMain}
                    fontSize="15"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    90.00
                  </text>

                  {/* Inner Left Cota: 28.00 */}
                  <line x1={planX - 55} y1={planY} x2={planX - 55} y2={planY + planH * 0.35} stroke={ts.dimLine} strokeWidth="1.2" />
                  <line x1={planX - 65} y1={planY + planH * 0.35} x2={planX - 10} y2={planY + planH * 0.35} stroke={ts.dimLine} strokeWidth="1" />
                  <line x1={planX - 61} y1={planY + planH * 0.35 + 6} x2={planX - 49} y2={planY + planH * 0.35 - 6} stroke={ts.dimLine} strokeWidth="1.5" />
                  <text
                    x={planX - 68}
                    y={planY + (planH * 0.35) / 2}
                    textAnchor="middle"
                    transform={`rotate(-90, ${planX - 68}, ${planY + (planH * 0.35) / 2})`}
                    fill={ts.textMain}
                    fontSize="14"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    28.00
                  </text>

                  {/* BOTTOM COTA: 80.00 */}
                  <line x1={planX} y1={planY + planH + 65} x2={planX + planW} y2={planY + planH + 65} stroke={ts.dimLine} strokeWidth="1.2" />
                  <line x1={planX} y1={planY + planH + 10} x2={planX} y2={planY + planH + 75} stroke={ts.dimLine} strokeWidth="1" />
                  <line x1={planX + planW} y1={planY + planH + 10} x2={planX + planW} y2={planY + planH + 75} stroke={ts.dimLine} strokeWidth="1" />
                  <line x1={planX - 6} y1={planY + planH + 71} x2={planX + 6} y2={planY + planH + 59} stroke={ts.dimLine} strokeWidth="1.5" />
                  <line x1={planX + planW - 6} y1={planY + planH + 71} x2={planX + planW + 6} y2={planY + planH + 59} stroke={ts.dimLine} strokeWidth="1.5" />
                  <text x={planX + planW / 2} y={planY + planH + 85} textAnchor="middle" fill={ts.textMain} fontSize="15" fontWeight="bold" fontFamily="monospace">
                    80.00
                  </text>

                  {/* Arrow pointing A to section cut at bottom center */}
                  <g id="bottom-corte-marker" transform={`translate(${planX + planW * 0.44}, ${planY + planH + 40})`}>
                    <line x1="0" y1="0" x2="0" y2="-25" stroke={ts.woodStroke} strokeWidth="1.5" />
                    <polygon points="-4,-25 4,-25 0,-35" fill={ts.woodStroke} />
                    <text x="-8" y="-5" fill={ts.textMain} fontSize="15" fontWeight="bold" fontFamily="monospace">
                      A
                    </text>
                  </g>
                </g>
              )}

              {/* ================= TITLE BLOCK AT BOTTOM LEFT ================= */}
              {/* Exactly matching "PLANTA BAIXA - NÍVEL 0.00 (escala: 1:300)" */}
              <g id="title-block-planta-baixa" transform={`translate(${planX - 40}, ${planY + planH + 120})`}>
                <text
                  x="0"
                  y="0"
                  fill={ts.textMain}
                  fontSize="18"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  letterSpacing="0.5"
                  textDecoration="underline"
                >
                  PLANTA BAIXA - NÍVEL 0.00
                </text>
                <text
                  x="0"
                  y="22"
                  fill={ts.textSub}
                  fontSize="13"
                  fontFamily="monospace"
                >
                  (escala: 1:300)
                </text>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
