import { SOURCE_META, type SourceCode } from '../constants/sourceMeta';

export const SOURCE_BADGE_SUFFIX = 'INTELLIGENCE';

export function getSourceBadgeClasses(source: string): string {
  const meta = SOURCE_META[source as SourceCode];
  return meta?.badgeClasses ?? 'bg-white/5 text-neutral-400 border-white/10';
}

export function formatSourceBadgeLabel(source: string, compact: boolean): string {
  return compact ? source : `${source} ${SOURCE_BADGE_SUFFIX}`;
}
