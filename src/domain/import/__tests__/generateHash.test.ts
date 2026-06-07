import { describe, it, expect } from 'vitest';
import { generateHash } from '../generateHash';

describe('generateHash', () => {
  it('produces deterministic hash for same input', async () => {
    const a = await generateHash('2026-06-01', -1500, 'Test', 'acct1', 'tbank');
    const b = await generateHash('2026-06-01', -1500, 'Test', 'acct1', 'tbank');
    expect(a).toBe(b);
  });

  it('produces different hash for different input', async () => {
    const a = await generateHash('2026-06-01', -1500, 'Test', 'acct1', 'tbank');
    const b = await generateHash('2026-06-02', -1500, 'Test', 'acct1', 'tbank');
    expect(a).not.toBe(b);
  });

  it('returns a string', async () => {
    const hash = await generateHash('2026-06-01', -1500, 'Test', 'acct1', 'tbank');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });
});
