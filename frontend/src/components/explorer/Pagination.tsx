import { useState, type FormEvent } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const JumpInput = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const [jumpValue, setJumpValue] = useState('');

  const handleJump = (e: FormEvent) => {
    e.preventDefault();
    const page = parseInt(jumpValue);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
    setJumpValue('');
  };

  return (
    <form onSubmit={handleJump} className="flex items-center gap-3">
      <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">Jump to</span>
      <div className="relative group">
        <input
          type="text"
          value={jumpValue}
          onChange={(e) => setJumpValue(e.target.value)}
          placeholder={`${currentPage} / ${totalPages}`}
          className="w-24 bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-[13px] font-black text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-neutral-700"
        />
      </div>
    </form>
  );
};

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  // Sliding window logic for 5 pages
  let start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);

  if (end - start < 4) {
    start = Math.max(1, end - 4);
  }

  const pageNumbers = [];
  for (let i = start; i <= end; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex flex-col items-center justify-center gap-8 mt-12 mb-20 animate-reveal">
      {/* Navigation Buttons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-xl cc-panel-border-soft bg-white/5 text-neutral-500 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-white/5 transition-all"
        >
          <ChevronsLeft size={18} />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-xl cc-panel-border-soft bg-white/5 text-neutral-500 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-all mr-2"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-1.5">
          {pageNumbers.map((num) => (
            <button
              key={num}
              onClick={() => onPageChange(num)}
              className={`w-10 h-10 rounded-xl border font-black text-[13px] transition-all duration-300 ${
                currentPage === num
                  ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                  : 'bg-white/5 text-neutral-500 border-white/[0.12] hover:border-white/30 hover:text-neutral-300'
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl cc-panel-border-soft bg-white/5 text-neutral-500 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-all ml-2"
        >
          <ChevronRight size={18} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl cc-panel-border-soft bg-white/5 text-neutral-500 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-all"
        >
          <ChevronsRight size={18} />
        </button>
      </div>

      {/* Fast Jump Input - Moved below navigation */}
      <JumpInput 
        key={currentPage} 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={onPageChange} 
      />
    </div>
  );
};

export default Pagination;
