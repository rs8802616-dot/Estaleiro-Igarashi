import React from 'react';
import { DEFAULT_METRICS } from './data/prdData';
import { Warehouse3DView } from './components/Warehouse3DView';

export default function App() {
  return (
    <div className="h-full w-full bg-[#0E0E0E] text-[#E5E7EB] font-sans overflow-hidden flex flex-col">
      <Warehouse3DView metrics={DEFAULT_METRICS} />
    </div>
  );
}
