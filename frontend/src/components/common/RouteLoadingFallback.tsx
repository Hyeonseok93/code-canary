const RouteLoadingFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center bg-[#0a0a0a]">
    <div className="flex flex-col items-center gap-3 animate-reveal">
      <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600">Loading</span>
    </div>
  </div>
);

export default RouteLoadingFallback;
