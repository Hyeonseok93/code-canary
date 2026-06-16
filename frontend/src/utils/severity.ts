export interface SeverityTheme {
  text: string;
  border: string;
  bg: string;
  glow: string;
  combinedClass: string;
  gradient: string;
  stroke: string;
}

export const getSeverityTheme = (score: number): SeverityTheme => {
  if (score >= 9.0) {
    return {
      text: 'text-red-500',
      border: 'border-red-500/20',
      bg: 'bg-red-500/5',
      glow: 'shadow-[0_0_30px_rgba(239,68,68,0.15)]',
      combinedClass: 'text-red-500 border-red-500/20 bg-red-500/5 shadow-red-500/10',
      gradient: 'from-red-500 to-rose-600',
      stroke: '#ef4444',
    };
  }
  if (score >= 7.0) {
    return {
      text: 'text-orange-500',
      border: 'border-orange-500/20',
      bg: 'bg-orange-500/5',
      glow: 'shadow-[0_0_30px_rgba(249,115,22,0.15)]',
      combinedClass: 'text-orange-500 border-orange-500/20 bg-orange-500/5 shadow-orange-500/10',
      gradient: 'from-orange-500 to-amber-600',
      stroke: '#f97316',
    };
  }
  if (score >= 4.0) {
    return {
      text: 'text-yellow-500',
      border: 'border-yellow-500/20',
      bg: 'bg-yellow-500/5',
      glow: 'shadow-[0_0_30px_rgba(234,179,8,0.15)]',
      combinedClass: 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5 shadow-yellow-500/10',
      gradient: 'from-yellow-500 to-yellow-600',
      stroke: '#eab308',
    };
  }
  return {
    text: 'text-blue-400',
    border: 'border-blue-400/20',
    bg: 'bg-blue-400/5',
    glow: 'shadow-[0_0_30px_rgba(96,165,250,0.15)]',
    combinedClass: 'text-blue-400 border-blue-400/20 bg-blue-400/5 shadow-blue-400/10',
    gradient: 'from-blue-400 to-sky-500',
    stroke: '#60a5fa',
  };
};
