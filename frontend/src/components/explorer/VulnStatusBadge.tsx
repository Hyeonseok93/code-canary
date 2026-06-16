interface VulnStatusBadgeProps {
  status: string;
}

const VulnStatusBadge = ({ status }: VulnStatusBadgeProps) => {
  const normalized = status.toLowerCase();
  const className =
    normalized === 'rejected'
      ? 'bg-red-500/10 text-red-400 border-red-500/30'
      : normalized === 'withdrawn'
        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        : normalized === 'active'
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          : 'bg-white/5 text-neutral-400 border-white/10';

  return (
    <span className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border ${className}`}>
      {status}
    </span>
  );
};

export default VulnStatusBadge;
