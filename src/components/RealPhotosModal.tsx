import React from 'react';
import { X, CheckCircle, Info, Layers, Wind, ShieldAlert, Sparkles, Tag, Check, Award } from 'lucide-react';

interface RealPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RealPhotosModal: React.FC<RealPhotosModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const photoDetails = [
    {
      title: '1. Fachada Frontal Real (Estaleiro de Alho 03)',
      subtitle: 'Pórtico Frontal com 7 Postes de Eucalipto, 7 Níveis de Travamento Horizontal e Van Rurais',
      badge: 'Fachada Frontal • Estaleiro 03',
      color: '#EAB308',
      points: [
        '7 Postes mestres roliços de eucalipto na frente dividindo o galpão em 6 galerias simétricas (3 à esquerda, 1 central e 3 à direita).',
        'Vigamento horizontal contínuo (tábuas de madeira) conectando todos os 7 pilares em cada um dos 7 níveis verticais.',
        'Placa técnica oficial "ESTALEIRO DE ALHO 03 - IGARASHI" afixada diretamente no poste central roliço no 4º nível.',
        'Carga 100% cheia: feixes densos de alho em rama com palha e raízes pendurados do piso até a cumeeira (527.904 kg).',
        'Extintores de incêndio vermelhos de segurança afixados nos postes externos (esquerdo e direito).',
        'Pátio frontal em terra batida/saibro com furgão agrícola "RURAIS - 993" estacionado à esquerda.',
      ],
    },
    {
      title: '2. Placa Técnica Oficial de Identificação (Igarashi)',
      subtitle: 'Capacidade Máxima: 18,80 ha / 527.904,00 Kg • Ocupação Atual: 100%',
      badge: 'Placa Oficial • Igarashi',
      color: '#10B981',
      points: [
        'Identificação: "ESTALEIRO DE ALHO 03" com ícone esquemático do galpão de 7 pilares e cumeeira.',
        'Capacidade Máxima: 18,80 hectares de produção agrícola.',
        'Capacidade em Massa: 527.904,00 Kg (527,9 toneladas de alho em rama).',
        'Status Atual de Safra: 100% de ocupação (18,80 ha / 527.904,00 Kg).',
        'Fixação com amarração de ráfia e pregos de aço no pilar central de eucalipto cercado de ramas secas.',
        'Logo institucional do Grupo Igarashi com selo de qualidade agrícola.',
      ],
    },
    {
      title: '3. Detalhes Construtivos dos Postes e Varais Internos',
      subtitle: 'Postes Roliços Ø35cm, Calços Pregados e Varais Horizontais para Rama',
      badge: 'Interior & Encaixes',
      color: '#D4A373',
      points: [
        'Postes de Eucalipto Citriodora tratado sob vácuo-pressão com CCA (Classe C60).',
        'Calços de madeira (tacos) pregados e parafusados nas laterais dos postes em 7 níveis de altura.',
        'Varas roliças horizontais de Ø8-10cm apoiadas nos calços para sustentação dos feixes de alho amarrados pela palha.',
        'Corredores longitudinais de 72m que garantem fluxo laminar de ar para cura homogênea sem bolsões de umidade.',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#121212] border border-[#D4A373]/50 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden text-[#E5E7EB]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2D2D2D] bg-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#D4A373]/20 border border-[#D4A373] flex items-center justify-center text-[#D4A373]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-[#D4A373]">
                Fotos Reais de Campo • Estaleiro de Alho 03 (Igarashi)
              </h3>
              <p className="text-xs text-[#9CA3AF]">
                Correspondência exata da fachada frontal, placa técnica de 527.904 kg e estrutura roliça
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#9CA3AF] hover:text-white hover:bg-[#262626] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Plaque Spotlight Banner */}
          <div className="bg-gradient-to-r from-[#1C1814] via-[#241F18] to-[#1C1814] border-2 border-[#D4A373] p-4 sm:p-5 rounded-xl shadow-xl flex flex-col md:flex-row items-center gap-5">
            {/* Visual Plaque Rendering */}
            <div className="w-full md:w-80 bg-[#F8F9FA] text-[#1E293B] rounded-lg border-4 border-[#1E293B] p-3.5 shadow-2xl shrink-0">
              <div className="bg-[#1E293B] text-[#FACC15] py-1.5 px-3 rounded font-bold text-center text-xs tracking-wider">
                ESTALEIRO DE ALHO
              </div>
              <div className="flex items-center justify-between my-2">
                <div className="text-center px-2">
                  <div className="text-4xl font-black text-[#1E293B] leading-none">03</div>
                  <div className="w-12 h-6 bg-[#334155] rounded-t-sm mx-auto mt-1 flex items-center justify-center text-[7px] text-white font-mono">
                    7 PILARES
                  </div>
                </div>
                <div className="space-y-0.5 text-[10px] border-l-2 border-[#E2E8F0] pl-2 font-mono">
                  <div className="text-[#475569]">CAPACIDADE MÁXIMA:</div>
                  <div className="font-bold text-[#0F172A]">18,80 ha • 527.904,00 Kg</div>
                  <div className="font-black text-[#059669] pt-1">CAPACIDADE ATUAL: 100%</div>
                  <div className="font-bold text-[#0F172A]">527.904,00 Kg</div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-[#E2E8F0]">
                <div className="w-4 h-4 rounded-full bg-[#059669] flex items-center justify-center text-[8px] text-white font-bold">
                  IG
                </div>
                <span className="font-black text-xs text-[#059669] tracking-wider">IGARASHI</span>
              </div>
            </div>

            {/* Plaque Specs description */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#D4A373]/20 text-[#D4A373] font-mono font-bold text-[10px] border border-[#D4A373]/40">
                  DADOS OFICIAIS DE CAMPO
                </span>
                <span className="text-[#9CA3AF]">• Estaleiro 03 em Plena Operação</span>
              </div>
              <h4 className="text-sm sm:text-base font-serif font-bold text-white">
                Fidelidade Total às Fotos Reais do Estaleiro
              </h4>
              <p className="text-[#D1D5DB] leading-relaxed">
                As fotos de campo mostram o <strong className="text-[#FBBF24]">Estaleiro de Alho 03</strong> carregado com 100% de sua capacidade (527.904 kg de alho em rama cultivados em 18,80 hectares). O modelo 3D reproduz fielmente os 7 pilares frontais, as tábuas horizontais de madeira em 7 níveis, a placa oficial no poste central e os extintores de segurança.
              </p>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {photoDetails.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#181818] border border-[#2D2D2D] rounded-xl overflow-hidden flex flex-col hover:border-[#D4A373]/60 transition-all shadow-lg"
              >
                {/* Header Tag */}
                <div className="p-3 border-b border-[#262626] bg-[#1F1F1F] flex items-center justify-between">
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
                    style={{ backgroundColor: `${item.color}20`, color: item.color, border: `1px solid ${item.color}50` }}
                  >
                    {item.badge}
                  </span>
                  <span className="text-[10px] text-[#9CA3AF] font-mono">Foto Real #{idx + 1}</span>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#F3F4F6]">{item.title}</h4>
                    <p className="text-[11px] text-[#D4A373] font-mono mt-0.5">{item.subtitle}</p>
                  </div>

                  <ul className="space-y-2 text-xs text-[#9CA3AF]">
                    {item.points.map((pt, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-[#EAB308] shrink-0 mt-0.5" />
                        <span className="leading-snug text-[#D1D5DB]">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Constructive Synthesis Banner */}
          <div className="bg-[#1C1814] border border-[#D4A373]/30 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold text-[#D4A373]">
                <Info className="w-4 h-4 text-[#D4A373]" />
                Visualização 3D Calibrada com as Fotos Reais
              </div>
              <p className="text-xs text-[#9CA3AF] max-w-3xl">
                Você pode alternar entre a visão da estrutura vazia (foco na engenharia dos postes roliços e calços) e a carga cheia 100% de alho em rama (527.904 kg), além de inspecionar a placa técnica no poste central.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#D4A373] text-[#0A0A0A] hover:bg-[#c49262] font-semibold text-xs rounded-md shadow transition-colors shrink-0"
            >
              Ver Fachada no Modelo 3D
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

