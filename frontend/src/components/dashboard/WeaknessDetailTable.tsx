import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import type { WeaknessDetail } from '../../types/analytics';

interface WeaknessDetailTableProps {
  data: WeaknessDetail[];
  selectedPillar: string;
}

const WeaknessDetailTable = ({ data, selectedPillar }: WeaknessDetailTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    return data
      .filter(item => item.pillar === selectedPillar || selectedPillar === 'Total')
      .filter(item => 
        item.cweId.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [data, selectedPillar, searchTerm]);

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
            Showing:
          </span>
          <span className="text-xs font-black text-white uppercase px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            {selectedPillar}
          </span>
        </div>
        
        <div className="relative group max-w-xs w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-white transition-colors" />
          <input 
            type="text"
            placeholder="Search Weakness..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-900/60 cc-panel-border-soft rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-neutral-700 focus:border-white/30 outline-none transition-all"
          />
        </div>
      </div>

      {/* High-Density Table */}
      <div className="flex-grow overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="sticky top-0 bg-[#0d0d0d] z-20">
            <tr className="border-b border-white/[0.10]">
              <th className="pl-2 pr-2 py-2 text-[9px] font-black text-neutral-500 uppercase tracking-widest w-[10%]">CWE ID</th>
              <th className="px-2 py-2 text-[9px] font-black text-neutral-500 uppercase tracking-widest w-[78%]">Name</th>
              <th className="px-0 py-2 text-[9px] font-black text-neutral-500 uppercase tracking-widest text-right w-[12%]">Count</th>
            </tr>
          </thead>
          <tbody className="after:content-[''] after:block after:h-4">
            {filteredData.map((item) => (
              <tr 
                key={item.cweId} 
                className="group hover:bg-white/[0.02] transition-colors border-b border-white/[0.08] last:border-0"
              >
                <td className="pl-2 pr-2 py-0">
                  <div className="flex items-center h-7">
                    <span className="text-[10px] font-black text-blue-500 group-hover:text-blue-400">
                      {item.cweId}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-0">
                  <div className="flex items-center h-7 overflow-hidden">
                    <span className="text-[11px] font-bold text-neutral-300 group-hover:text-white transition-colors truncate whitespace-nowrap block w-full">
                      {item.name}
                    </span>
                  </div>
                </td>
                <td className="px-0 py-0 text-right">
                  <span className="text-[11px] font-black text-white tabular-nums pr-2">
                    {item.count.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={3} className="py-20 text-center">
                  <span className="text-[10px] font-black text-neutral-700 uppercase tracking-widest">
                    No matching weaknesses found
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeaknessDetailTable;
