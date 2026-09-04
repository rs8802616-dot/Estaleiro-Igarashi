import React from 'react';
import { PRD_SECTIONS, TIMBER_SPECIES } from '../data/prdData';
import { FileText, Printer, CheckCircle2, Download, Building, Wind, Trees, Layers } from 'lucide-react';
import { StructuralMetrics } from '../types';

interface PRDDocumentViewProps {
  metrics: StructuralMetrics;
}

export const PRDDocumentView: React.FC<PRDDocumentViewProps> = ({ metrics }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-[#0F0F0F] overflow-y-auto p-4 sm:p-8 text-[#E5E7EB]">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-[#1A1A1A] p-5 rounded border border-[#2D2D2D] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-[#0F0F0F] text-[#D4A373] font-mono text-xs font-bold border border-[#2D2D2D]">
              PRD OFICIAL
            </span>
            <span className="text-xs text-[#6B7280] font-mono">VERSÃO 2.4 - ENGENHARIA CIVIL & AGRONOMIA</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#D4A373] mt-1">
            {PRD_SECTIONS.title}
          </h1>
          <p className="text-sm font-semibold text-[#E5E7EB]/80">
            {PRD_SECTIONS.project} — {PRD_SECTIONS.capacity}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#D4A373] hover:bg-[#c39262] text-[#0F0F0F] rounded font-semibold text-xs transition-colors shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir PRD Completo</span>
          </button>
        </div>
      </div>

      {/* Formal Document Sheet */}
      <div className="bg-[#141414] rounded border border-[#2D2D2D] shadow-md p-6 sm:p-10 max-w-5xl mx-auto w-full space-y-8 print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Document Header */}
        <div className="border-b-2 border-[#D4A373] pb-4 flex flex-wrap justify-between items-start gap-4 print:border-black">
          <div>
            <div className="text-xs uppercase tracking-widest text-[#9CA3AF] font-mono print:text-gray-600">
              Memorial Descritivo e Requisitos Técnicos
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#D4A373] mt-1 print:text-black">
              ESTALEIRO INDUSTRIAL DE MADEIRA PARA CURA DE ALHO EM RAMA
            </h2>
            <div className="text-sm text-[#E5E7EB] font-medium mt-1 print:text-gray-800">
              Capacidade de Carga Nominal: <strong className="text-white print:text-black">530.000 kg (530 toneladas)</strong>
            </div>
          </div>
          <div className="text-right text-xs font-mono text-[#9CA3AF] bg-[#0F0F0F] p-2.5 rounded border border-[#2D2D2D] print:bg-gray-100 print:text-black print:border-gray-300">
            <div><strong>Data de Emissão:</strong> 2026-08-27</div>
            <div><strong>Normas Aplicáveis:</strong> NBR 7190 / NBR 6123</div>
            <div><strong>Dimensão em Planta:</strong> 120,00m x 38,00m</div>
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h3 className="text-lg font-serif font-bold text-[#D4A373] border-l-4 border-[#D4A373] pl-3 print:text-black print:border-black">
            {PRD_SECTIONS.sections[0].title}
          </h3>
          <p className="text-sm text-[#D1D5DB] leading-relaxed text-justify print:text-gray-900">
            {PRD_SECTIONS.sections[0].content}
          </p>
        </section>

        {/* Section 2: Technical Table */}
        <section className="space-y-4">
          <h3 className="text-lg font-serif font-bold text-[#D4A373] border-l-4 border-[#D4A373] pl-3 print:text-black print:border-black">
            {PRD_SECTIONS.sections[1].title}
          </h3>
          <div className="overflow-x-auto border border-[#2D2D2D] rounded print:border-gray-300">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1A1A1A] border-b border-[#2D2D2D] text-[#D4A373] font-bold print:bg-gray-200 print:text-black print:border-gray-400">
                  <th className="p-3 w-1/3">Parâmetro de Engenharia</th>
                  <th className="p-3">Especificação Técnica</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D2D2D] print:divide-gray-300">
                {PRD_SECTIONS.sections[1].table?.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-[#141414] print:bg-white' : 'bg-[#181818] print:bg-gray-50'}>
                    <td className="p-3 font-semibold text-white print:text-black align-top">{row.parameter}</td>
                    <td className="p-3 text-[#9CA3AF] print:text-gray-800 leading-relaxed">{row.spec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Natural Ventilation & Stack Effect */}
        <section className="space-y-4">
          <h3 className="text-lg font-serif font-bold text-[#D4A373] border-l-4 border-[#D4A373] pl-3 print:text-black print:border-black">
            {PRD_SECTIONS.sections[2].title}
          </h3>
          <p className="text-sm font-semibold text-[#E5E7EB] print:text-black">
            {PRD_SECTIONS.sections[2].subtitle}
          </p>
          <p className="text-sm text-[#D1D5DB] leading-relaxed print:text-gray-900">
            {PRD_SECTIONS.sections[2].description}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {PRD_SECTIONS.sections[2].points?.map((pt, idx) => (
              <div key={idx} className="p-4 rounded bg-[#0F0F0F] border border-[#2D2D2D] print:bg-gray-50 print:border-gray-300">
                <div className="text-xs font-bold text-[#D4A373] mb-1.5 flex items-center gap-1.5 print:text-amber-800">
                  <Wind className="w-3.5 h-3.5 text-[#38bdf8]" />
                  {pt.name}
                </div>
                <p className="text-xs text-[#9CA3AF] leading-relaxed print:text-gray-700">{pt.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Workflow Stages */}
        <section className="space-y-4">
          <h3 className="text-lg font-serif font-bold text-[#D4A373] border-l-4 border-[#D4A373] pl-3 print:text-black print:border-black">
            {PRD_SECTIONS.sections[3].title}
          </h3>
          <div className="space-y-3">
            {PRD_SECTIONS.sections[3].steps?.map((step, idx) => (
              <div key={idx} className="flex gap-4 items-start p-3.5 bg-[#0F0F0F] rounded border border-[#2D2D2D] print:bg-gray-50 print:border-gray-300">
                <div className="w-7 h-7 rounded bg-[#D4A373] text-[#0F0F0F] font-bold flex items-center justify-center shrink-0 text-xs font-mono">
                  {idx + 1}
                </div>
                <div>
                  <div className="text-sm font-bold text-white print:text-black">{step.step}</div>
                  <div className="text-xs text-[#9CA3AF] mt-0.5 leading-relaxed print:text-gray-700">{step.details}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Next Steps */}
        <section className="space-y-3">
          <h3 className="text-lg font-serif font-bold text-[#D4A373] border-l-4 border-[#D4A373] pl-3 print:text-black print:border-black">
            {PRD_SECTIONS.sections[4].title}
          </h3>
          <div className="space-y-2 text-xs text-[#D1D5DB] print:text-gray-800">
            {PRD_SECTIONS.sections[4].items?.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#4ade80] shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Recommended Timber Species Summary */}
        <section className="space-y-3 pt-4 border-t border-[#2D2D2D] print:border-gray-300">
          <h3 className="text-base font-serif font-bold text-[#D4A373] flex items-center gap-2 print:text-black">
            <Trees className="w-4 h-4 text-[#4ade80]" />
            Madeiras de Reflorestamento Recomendadas para o Estaleiro
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {TIMBER_SPECIES.map((timber) => (
              <div key={timber.id} className="p-3 rounded border border-[#2D2D2D] bg-[#0F0F0F] print:bg-gray-50 print:border-gray-300">
                <div className="font-bold text-white print:text-black">{timber.name}</div>
                <div className="text-[#9CA3AF] text-[11px] mt-0.5 print:text-gray-600">{timber.recommendedUse}</div>
                <div className="text-[#D4A373] font-mono mt-1 text-[11px] print:text-amber-800">
                  Resistência: {timber.resistanceClass} | Durabilidade: {timber.durabilityGrade}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
