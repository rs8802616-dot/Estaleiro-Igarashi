import React from 'react';
import { ViewMode, StructuralMetrics } from '../types';
import { 
  DraftingCompass, 
  Map, 
  Columns, 
  Building2,
  Calculator, 
  Wind, 
  FileText,
  Warehouse,
  Truck,
  Compass,
  Box,
  Image as ImageIcon
} from 'lucide-react';

interface HeaderProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  metrics: StructuralMetrics;
  onOpenPhotosModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onSelectView, metrics, onOpenPhotosModal }) => {
  const navItems = [
    {
      id: 'modelo-3d' as ViewMode,
      label: 'Modelo 3D Interativo',
      sublabel: 'WebGL • Órbita • Explodido',
      icon: Box,
      badge: '3D REAL',
    },
    {
      id: 'corte-aa' as ViewMode,
      label: "Corte A-A' (Longitudinal)",
      sublabel: 'Estrutura & Níveis',
      icon: DraftingCompass,
      badge: '2D CAD',
    },
    {
      id: 'isometrica' as ViewMode,
      label: 'Planta Isométrica 45°',
      sublabel: 'Visão Espacial & Níveis',
      icon: Compass,
      badge: 'Axonométrica',
    },
    {
      id: 'planta-baixa' as ViewMode,
      label: 'Visão de Cima (Planta)',
      sublabel: 'Planta Baixa Nível 0.00',
      icon: Map,
      badge: '1:300',
    },
    {
      id: 'elevacao-lateral' as ViewMode,
      label: 'Visão Lateral (Estaleiros)',
      sublabel: 'Sistema de Penduração',
      icon: Building2,
      badge: '1:200',
    },
    {
      id: 'corte-bb' as ViewMode,
      label: "Corte B-B' (Transversal)",
      sublabel: 'Caminhão & Passarelas',
      icon: Truck,
    },
    {
      id: 'calculos' as ViewMode,
      label: 'Cálculos Estruturais',
      sublabel: '530.000 kg Carga',
      icon: Calculator,
    },
    {
      id: 'termodinamica' as ViewMode,
      label: 'Termodinâmica & Ar',
      sublabel: 'Efeito Chaminé',
      icon: Wind,
    },
    {
      id: 'prd-completo' as ViewMode,
      label: 'Memorial PRD',
      sublabel: 'Documento Técnico',
      icon: FileText,
    },
  ];

  return (
    <header className="bg-[#0F0F0F] text-[#E5E7EB] border-b border-[#2D2D2D] shrink-0 select-none">
      {/* Top Branding Line */}
      <div className="max-w-7xl mx-auto px-3 py-2 sm:px-4 sm:py-3 flex flex-wrap items-center justify-between gap-2 sm:gap-3 border-b border-[#1F1F1F]">
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded bg-[#1A1A1A] border border-[#D4A373]/40 flex items-center justify-center text-[#D4A373] shadow-md shrink-0">
            <Warehouse className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4A373]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-lg font-serif tracking-tight text-[#D4A373] leading-tight">
                Estaleiro Industrial de Madeira
              </h1>
              <span className="inline-flex px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded bg-[#1A1A1A] text-[#D4A373] font-mono text-[10px] sm:text-[11px] font-bold border border-[#D4A373]/30">
                530t
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#9CA3AF] tracking-wide uppercase truncate max-w-[280px] sm:max-w-none">
              Cura Natural de Alho em Rama — 2D & PRD
            </p>
          </div>
        </div>

        {/* Quick Specs Pill Box & Real Photos Button */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
          {onOpenPhotosModal && (
            <button
              onClick={onOpenPhotosModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded bg-[#26201a] hover:bg-[#382b20] text-[#D4A373] border border-[#D4A373]/60 text-xs font-semibold shadow-xs transition-colors"
              title="Ver Fotos Reais do Estaleiro"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#EAB308]" />
              <span className="hidden sm:inline">Fotos Reais de Campo</span>
              <span className="sm:hidden">Fotos</span>
            </button>
          )}
          <div className="hidden md:block px-3 py-1.5 rounded bg-[#1A1A1A] border border-[#2D2D2D]">
            <span className="text-[#6B7280]">Planta:</span> <span className="text-white font-medium ml-1">120m x 38m</span>
          </div>
          <div className="hidden md:block px-3 py-1.5 rounded bg-[#1A1A1A] border border-[#2D2D2D]">
            <span className="text-[#6B7280]">Pé-Direito:</span> <span className="text-white font-medium ml-1">15,5m / 18,0m</span>
          </div>
          <div className="hidden sm:flex px-3 py-1.5 rounded bg-[#1A1A1A] border border-[#2D2D2D] items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D4A373]"></span>
            <span className="text-[#D4A373] font-bold">{metrics.levelsCount} Níveis</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => onSelectView(item.id)}
                className={`flex items-center gap-2 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded text-xs transition-all border ${
                  isActive
                    ? 'bg-[#1A1A1A] text-[#D4A373] border-[#D4A373] font-semibold shadow-xs'
                    : 'text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#1A1A1A]/70 border-[#2D2D2D]/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-[#D4A373]' : 'text-[#6B7280]'}`} />
                <div className="text-left">
                  <div className="leading-tight flex items-center gap-1.5">
                    <span className={isActive ? 'text-[#D4A373]' : 'text-[#E5E7EB]'}>{item.label}</span>
                    {item.badge && (
                      <span className="text-[8px] sm:text-[9px] px-1 py-0.2 rounded bg-[#D4A373] text-[#0F0F0F] font-black tracking-wider">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className={`text-[9px] sm:text-[10px] leading-tight font-mono ${isActive ? 'text-[#D4A373]/80' : 'text-[#6B7280]'}`}>
                    {item.sublabel}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
