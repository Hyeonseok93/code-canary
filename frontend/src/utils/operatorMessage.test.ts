import { describe, expect, it } from 'vitest';
import { sanitizeOperatorMessage } from './operatorMessage';

describe('sanitizeOperatorMessage', () => {
  it('returns null for empty input', () => {
    expect(sanitizeOperatorMessage(null)).toBeNull();
    expect(sanitizeOperatorMessage('   \n\t  ')).toBeNull();
  });

  it('normalizes whitespace', () => {
    expect(sanitizeOperatorMessage('  hello   world  ')).toBe('hello world');
  });

  it('truncates long messages with ellipsis', () => {
    const long = 'a'.repeat(300);
    const result = sanitizeOperatorMessage(long);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(240);
    expect(result!.endsWith('…')).toBe(true);
  });
});
