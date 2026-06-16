interface SkeletonBlockProps {
  className?: string;
}

export const SkeletonBlock = ({ className = '' }: SkeletonBlockProps) => (
  <div className={`bg-white/5 animate-skeleton ${className}`} />
);

export const DetailPageSkeleton = () => (
  <div className="space-y-6 py-12">
    <SkeletonBlock className="h-10 rounded-2xl w-3/4" />
    <SkeletonBlock className="h-32 rounded-3xl" />
    <SkeletonBlock className="h-40 rounded-3xl" />
  </div>
);
