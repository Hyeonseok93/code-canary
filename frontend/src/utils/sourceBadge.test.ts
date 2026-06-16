import { describe, expect, it } from 'vitest';
import { formatSourceBadgeLabel, SOURCE_BADGE_SUFFIX } from './sourceBadge';

describe('formatSourceBadgeLabel', () => {
  it('appends suffix in non-compact mode', () => {
    expect(SOURCE_BADGE_SUFFIX).toBe('INTELLIGENCE');
    expect(formatSourceBadgeLabel('NVD', false)).toBe('NVD INTELLIGENCE');
  });

  it('returns source only in compact mode', () => {
    expect(formatSourceBadgeLabel('OSV', true)).toBe('OSV');
  });
});
