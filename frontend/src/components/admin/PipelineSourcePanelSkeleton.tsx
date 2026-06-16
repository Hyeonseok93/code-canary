import { SkeletonBlock } from '../common/Skeleton';

interface PipelineSourcePanelSkeletonProps {
  accent?: 'blue' | 'emerald';
}

const accentBorder = {
  blue: 'border-blue-500/45',
  emerald: 'border-emerald-500/45',
} as const;

const PipelineSourcePanelSkeleton = ({
  accent = 'blue',
}: PipelineSourcePanelSkeletonProps) => (
  <section
    className={`rounded-[28px] cc-admin-border bg-neutral-950/50 p-6 sm:p-8 space-y-8 ${accentBorder[accent]}`}
    aria-hidden
  >
    <SkeletonBlock className="h-24 rounded-[22px] cc-admin-border-soft" />

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[0, 1, 2].map((index) => (
        <SkeletonBlock key={index} className="h-[20rem] rounded-[22px] cc-admin-border-soft" />
      ))}
    </div>
  </section>
);

export default PipelineSourcePanelSkeleton;
