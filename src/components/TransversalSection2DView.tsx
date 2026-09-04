import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Layers,
  Sparkles,
  Truck,
  Wind
} from 'lucide-react';
import { StructuralMetrics, BlueprintTheme } from '../types';

interface TransversalSection2DViewProps {
  metrics: StructuralMetrics;
}

export const TransversalSection2DView: React.FC<TransversalSection2DViewProps> = ({ metrics }) => {
  const [zoom, setZoom] = useState<number>(0.7);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [theme, setTheme] = useState<BlueprintTheme>('cad-dark');
  const [showThemeMenu, setShowThemeMenu] = useState<boolean>(false);
  const [showOriginalComparison, setShowOriginalComparison] = useState<boolean>(false);
  const [isImmersive, setIsImmersive] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; dist?: number }>({ x: 0, y: 0 });

  const svgWidth = 1350;
  const svgHeight = 980;

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

  const getThemeStyles = () => {
    switch (theme) {
      case 'graph-paper':
        return {
          bg: '#FCFBF7',
          gridLine: '#E4DFD5',
          woodColor: '#8C6239',
          woodFill: '#F4ECE1',
          garlicDot: '#5C4033',
          louverColor: '#0284C7',
          textMain: '#1F2937',
          textSub: '#4B5563',
          borderDim: '#D1C7B7',
        };
      case 'blueprint-blue':
        return {
          bg: '#0F2744',
          gridLine: '#1E3E66',
          woodColor: '#38BDF8',
          woodFill: '#163359',
          garlicDot: '#BAE6FD',
          louverColor: '#7DD3FC',
          textMain: '#F0F9FF',
          textSub: '#93C5FD',
          borderDim: '#38BDF8',
        };
      case 'realistic-wood':
        return {
          bg: '#1C1510',
          gridLine: '#2D221B',
          woodColor: '#E6A86C',
          woodFill: '#2E1E14',
          garlicDot: '#FDE68A',
          louverColor: '#38BDF8',
          textMain: '#FEF3C7',
          textSub: '#D4A373',
          borderDim: '#D4A373',
        };
      case 'cad-dark':
      default:
        return {
          bg: '#0A0A0A',
          gridLine: '#181818',
          woodColor: '#D4A373',
          woodFill: '#1A1A1A',
          garlicDot: '#E5E7EB',
          louverColor: '#38BDF8',
          textMain: '#E5E7EB',
          textSub: '#9CA3AF',
          borderDim: '#D4A373',
        };
    }
  };

  const ts = getThemeStyles();

  return (
    <div className={`flex flex-col h-full bg-[#0F0F0F] text-[#E5E7EB] overflow-hidden select-none relative ${isImmersive ? 'fixed inset-0 z-50' : ''}`}>
      {/* Top Bar */}
      {!isImmersive && (
        <div className="bg-[#111111] border-b border-[#2D2D2D] z-10 shrink-0">
          <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2 shrink-0">
              <div className="px-2 py-0.5 bg-[#1A1A1A] text-[#D4A373] font-mono text-[11px] sm:text-xs font-bold rounded border border-[#2D2D2D] flex items-center gap-1.5 shadow-xs">
                <Truck className="w-3.5 h-3.5 text-[#4ade80]" />
                <span>CORTE B-B'</span>
              </div>
              <h2 className="text-xs sm:text-sm font-serif font-bold text-[#D4A373] tracking-tight flex items-center gap-1.5">
                CORTE TRANSVERSAL COM CAMINHÃO
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1A1A1A] text-[#D4A373] font-mono border border-[#D4A373]/30">
                  1:100
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={handleFitToScreen}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[#1A1A1A] hover:bg-[#262626] text-[#D4A373] rounded border border-[#2D2D2D] font-semibold transition-colors"
                title="Ajustar Corte à Tela"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#D4A373]" />
                <span className="hidden xs:inline text-[11px]">Ajustar</span>
              </button>

              <div className="flex items-center bg-[#1A1A1A] rounded border border-[#2D2D2D] p-0.5">
                <button onClick={handleZoomOut} className="p-1 text-[#9CA3AF] hover:text-[#E5E7EB] rounded">
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-[#9CA3AF] px-1 min-w-[34px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button onClick={handleZoomIn} className="p-1 text-[#9CA3AF] hover:text-[#E5E7EB] rounded">
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleResetZoom} className="p-1 text-[#9CA3AF] hover:text-[#E5E7EB] rounded border-l border-[#2D2D2D]">
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>

              {/* Theme */}
              <div className="relative">
                <button
                  onClick={() => setShowThemeMenu(!showThemeMenu)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[#1A1A1A] hover:bg-[#262626] text-[#9CA3AF] hover:text-[#E5E7EB] rounded border border-[#2D2D2D] transition-colors"
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
                      onClick={() => { setTheme('graph-paper'); setShowThemeMenu(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between ${theme === 'graph-paper' ? 'bg-[#262626] text-[#D4A373] font-bold' : 'text-[#9CA3AF] hover:bg-[#222]'}`}
                    >
                      <span>Papel Técnico</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#fcfbf7] border border-[#ccc]"></span>
                    </button>
                    <button
                      onClick={() => { setTheme('blueprint-blue'); setShowThemeMenu(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between ${theme === 'blueprint-blue' ? 'bg-[#262626] text-[#D4A373] font-bold' : 'text-[#9CA3AF] hover:bg-[#222]'}`}
                    >
                      <span>Blueprint</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0f2744] border border-[#38bdf8]"></span>
                    </button>
                  </div>
                )}
              </div>

              {/* Focus */}
              <button
                onClick={() => setIsImmersive(true)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[#1A1A1A] hover:bg-[#262626] text-[#9CA3AF] hover:text-white rounded border border-[#2D2D2D] transition-colors"
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

      {/* Drawing Canvas */}
      <div
        className="relative flex-1 bg-[#0A0A0A] overflow-hidden touch-none"
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
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
                <pattern id="bb-grid" width="25" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 25 0 L 0 0 0 25" fill="none" stroke={ts.gridLine} strokeWidth="0.6" />
                </pattern>
                <marker id="bb-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 2 L 8 5 L 0 8 z" fill="#38bdf8" />
                </marker>
              </defs>

              <rect width={svgWidth} height={svgHeight} fill="url(#bb-grid)" />
              <rect x="40" y="40" width={svgWidth - 80} height={svgHeight - 80} fill="none" stroke={ts.borderDim} strokeWidth="1.5" />

              {/* Ground level */}
              <line x1="80" y1="780" x2="1270" y2="780" stroke="#4B5563" strokeWidth="3" />
              {Array.from({ length: 36 }).map((_, i) => (
                <line key={`bb-soil-${i}`} x1={100 + i * 32} y1="780" x2={80 + i * 32} y2="800" stroke="#4B5563" strokeWidth="1.2" />
              ))}
              <text x="1100" y="820" fill={ts.textSub} fontSize="13" fontWeight="bold" fontFamily="monospace">
                SOLO COMPACTADO
              </text>

              {/* Concrete Foundations */}
              <rect x="185" y="780" width="50" height="40" fill="#262626" stroke="#6B7280" strokeWidth="1.5" />
              <rect x="525" y="780" width="50" height="40" fill="#262626" stroke="#6B7280" strokeWidth="1.5" />
              <rect x="775" y="780" width="50" height="40" fill="#262626" stroke="#6B7280" strokeWidth="1.5" />
              <rect x="1115" y="780" width="50" height="40" fill="#262626" stroke="#6B7280" strokeWidth="1.5" />

              {/* ================= TIMBER TRUSS ROOF (TESOURA DE MADEIRA TIPO SHED) ================= */}
              <polygon
                points="180,260 675,120 1170,260 1170,285 675,145 180,285"
                fill="#3E2723"
                stroke={ts.woodColor}
                strokeWidth="2.5"
              />

              {/* Truss Inner Web Structure */}
              <line x1="675" y1="145" x2="675" y2="285" stroke={ts.woodColor} strokeWidth="2.5" />
              <line x1="427" y1="202" x2="550" y2="285" stroke={ts.woodColor} strokeWidth="2" />
              <line x1="922" y1="202" x2="800" y2="285" stroke={ts.woodColor} strokeWidth="2" />
              <line x1="303" y1="243" x2="427" y2="285" stroke={ts.woodColor} strokeWidth="2" />
              <line x1="1046" y1="243" x2="922" y2="285" stroke={ts.woodColor} strokeWidth="2" />
              <line x1="180" y1="285" x2="1170" y2="285" stroke={ts.woodColor} strokeWidth="3" />

              {/* Callout: Estrutura de Suspensão Top */}
              <g id="callout-suspensao" transform="translate(675, 75)">
                <text x="0" y="0" textAnchor="middle" fill={ts.textMain} fontSize="13" fontWeight="bold" fontFamily="monospace">
                  ESTRUTURA DE SUSPENSÃO
                </text>
                <line x1="0" y1="10" x2="0" y2="40" stroke={ts.woodColor} strokeWidth="1.2" />
                <circle cx="0" cy="40" r="3" fill={ts.woodColor} />
              </g>

              {/* 4 Main Wood Columns (Pilares de Madeira 25x25cm) */}
              <rect x="200" y="285" width="20" height="495" fill={ts.woodColor} stroke="#000" strokeWidth="1" />
              <rect x="540" y="285" width="20" height="495" fill={ts.woodColor} stroke="#000" strokeWidth="1" />
              <rect x="790" y="285" width="20" height="495" fill={ts.woodColor} stroke="#000" strokeWidth="1" />
              <rect x="1130" y="285" width="20" height="495" fill={ts.woodColor} stroke="#000" strokeWidth="1" />

              {/* ================= LEFT WING: HANGING GARLIC RACKS (6 LEVELS) ================= */}
              {Array.from({ length: 6 }).map((_, lvl) => {
                const ly = 340 + lvl * 70;
                return (
                  <g key={`left-garlic-lvl-${lvl}`}>
                    <line x1="220" y1={ly} x2="540" y2={ly} stroke={ts.woodColor} strokeWidth="2.5" />
                    {Array.from({ length: 8 }).map((_, g) => (
                      <g key={`left-g-${lvl}-${g}`} transform={`translate(${240 + g * 35}, ${ly})`}>
                        <line x1="0" y1="0" x2="0" y2="15" stroke="#D4A373" strokeWidth="0.8" />
                        <circle cx="0" cy="18" r="4.5" fill={ts.garlicDot} stroke={ts.woodColor} strokeWidth="0.5" />
                        <circle cx="-3" cy="24" r="4" fill={ts.garlicDot} stroke={ts.woodColor} strokeWidth="0.5" />
                        <circle cx="3" cy="24" r="4" fill={ts.garlicDot} stroke={ts.woodColor} strokeWidth="0.5" />
                      </g>
                    ))}
                  </g>
                );
              })}

              {/* ================= RIGHT WING: HANGING GARLIC RACKS (6 LEVELS) ================= */}
              {Array.from({ length: 6 }).map((_, lvl) => {
                const ly = 340 + lvl * 70;
                return (
                  <g key={`right-garlic-lvl-${lvl}`}>
                    <line x1="810" y1={ly} x2="1130" y2={ly} stroke={ts.woodColor} strokeWidth="2.5" />
                    {Array.from({ length: 8 }).map((_, g) => (
                      <g key={`right-g-${lvl}-${g}`} transform={`translate(${830 + g * 35}, ${ly})`}>
                        <line x1="0" y1="0" x2="0" y2="15" stroke="#D4A373" strokeWidth="0.8" />
                        <circle cx="0" cy="18" r="4.5" fill={ts.garlicDot} stroke={ts.woodColor} strokeWidth="0.5" />
                        <circle cx="-3" cy="24" r="4" fill={ts.garlicDot} stroke={ts.woodColor} strokeWidth="0.5" />
                        <circle cx="3" cy="24" r="4" fill={ts.garlicDot} stroke={ts.woodColor} strokeWidth="0.5" />
                      </g>
                    ))}
                  </g>
                );
              })}

              {/* ================= CENTRAL SPAN (25.00m): MEZZANINE WALKWAYS & TRUCK ================= */}
              {/* Mezzanine Walkway Catwalks crossing the central bay */}
              <g id="central-mezzanine-bridges">
                <rect x="560" y="380" width="230" height="12" fill="#8D5B4C" stroke={ts.woodColor} strokeWidth="1.5" />
                <line x1="560" y1="360" x2="790" y2="360" stroke="#D4A373" strokeWidth="1.5" strokeDasharray="4 4" />

                <rect x="560" y="520" width="230" height="12" fill="#8D5B4C" stroke={ts.woodColor} strokeWidth="1.5" />
                <line x1="560" y1="500" x2="790" y2="500" stroke="#D4A373" strokeWidth="1.5" strokeDasharray="4 4" />
              </g>

              {/* CAMINHÃO EM ABASTECIMENTO (FRONTAL ELEVATION IN AISLE) */}
              <g id="truck-central" transform="translate(615, 610)">
                {/* Truck Cabin Frame */}
                <rect x="0" y="30" width="120" height="140" rx="8" fill="#1E293B" stroke="#4ADE80" strokeWidth="2.5" />
                {/* Windshield */}
                <rect x="15" y="45" width="90" height="40" rx="4" fill="#38BDF8" opacity="0.6" stroke="#4ADE80" strokeWidth="1" />
                {/* Grille & Headlights */}
                <rect x="25" y="105" width="70" height="30" fill="#0F172A" stroke="#4ADE80" strokeWidth="1" />
                {Array.from({ length: 4 }).map((_, l) => (
                  <line key={`grille-l-${l}`} x1="30" y1={112 + l * 6} x2="90" y2={112 + l * 6} stroke="#4ADE80" strokeWidth="1" />
                ))}
                <circle cx="15" cy="115" r="7" fill="#FEF08A" stroke="#4ADE80" strokeWidth="1" />
                <circle cx="105" cy="115" r="7" fill="#FEF08A" stroke="#4ADE80" strokeWidth="1" />
                {/* Wheels */}
                <rect x="-8" y="130" width="14" height="40" rx="3" fill="#0F172A" stroke="#4ADE80" strokeWidth="1" />
                <rect x="114" y="130" width="14" height="40" rx="3" fill="#0F172A" stroke="#4ADE80" strokeWidth="1" />
                <text x="60" y="155" textAnchor="middle" fill="#4ADE80" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  CAMINHÃO
                </text>
              </g>

              {/* Callout: Caminhão em Abastecimento */}
              <g id="callout-caminhao" transform="translate(760, 715)">
                <path d="M 0 0 L 80 0 L 110 -20" fill="none" stroke={ts.woodColor} strokeWidth="1.2" />
                <circle cx="0" cy="0" r="3" fill="#4ADE80" />
                <text x="120" y="-24" fill={ts.textMain} fontSize="11" fontWeight="bold" fontFamily="monospace">
                  CAMINHÃO EM
                </text>
                <text x="120" y="-10" fill={ts.woodColor} fontSize="11" fontWeight="bold" fontFamily="monospace">
                  ABASTECIMENTO
                </text>
              </g>

              {/* Airflow Circulation Blue Arrows (Entrada e Saída Natural de Ar) */}
              <g id="airflow-section-vectors">
                <path d="M 120 300 Q 180 290 240 330" fill="none" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#bb-arrow)" />
                <path d="M 1230 300 Q 1170 290 1110 330" fill="none" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#bb-arrow)" />
              </g>

              {/* Dimensions */}
              {/* Total Central Span: 25.00m */}
              <line x1="540" y1="840" x2="790" y2="840" stroke={ts.woodColor} strokeWidth="1.5" />
              <line x1="540" y1="830" x2="540" y2="850" stroke={ts.woodColor} strokeWidth="1.5" />
              <line x1="790" y1="830" x2="790" y2="850" stroke={ts.woodColor} strokeWidth="1.5" />
              <text x="665" y="865" textAnchor="middle" fill={ts.woodColor} fontSize="14" fontWeight="bold" fontFamily="monospace">
                25.00
              </text>

              {/* Left Wing Dimension: Total Height 18.00m */}
              <line x1="140" y1="285" x2="140" y2="780" stroke={ts.woodColor} strokeWidth="1.5" />
              <line x1="130" y1="285" x2="150" y2="285" stroke={ts.woodColor} strokeWidth="1.5" />
              <line x1="130" y1="780" x2="150" y2="780" stroke={ts.woodColor} strokeWidth="1.5" />
              <text x="120" y="530" textAnchor="middle" transform="rotate(-90, 120, 530)" fill={ts.woodColor} fontSize="13" fontWeight="bold" fontFamily="monospace">
                ALTURA ÚTIL: 16.00m / 18.00m
              </text>

              {/* Title Block */}
              <g id="title-block-corte-bb" transform="translate(180, 900)">
                <text x="0" y="0" fill={ts.textMain} fontSize="18" fontWeight="bold" fontFamily="serif">
                  CORTE TRANSVERSAL B-B'
                </text>
                <text x="0" y="18" fill={ts.textSub} fontSize="12" fontFamily="monospace">
                  (escala: 1:100)
                </text>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
