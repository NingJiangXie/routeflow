import { describe, it, expect } from 'vitest';
import { normalizeWorkspace, emptyWorkspace } from '../app/services/workspace.js';

describe('normalizeWorkspace', () => {
  it('returns empty workspace for undefined input', () => {
    const result = normalizeWorkspace();
    expect(result).toEqual(emptyWorkspace);
  });

  it('returns empty workspace for null input', () => {
    const result = normalizeWorkspace(null);
    expect(result).toEqual(emptyWorkspace);
  });

  it('normalizes arrays correctly', () => {
    const input = {
      maps: null,
      runs: 'not-array',
      presets: undefined,
    };
    const result = normalizeWorkspace(input);
    expect(Array.isArray(result.maps)).toBe(true);
    expect(result.maps).toEqual([]);
    expect(Array.isArray(result.runs)).toBe(true);
    expect(Array.isArray(result.presets)).toBe(true);
  });

  it('preserves valid data', () => {
    const input = {
      version: 2,
      maps: [{ id: '1', name: 'test' }],
      runs: [{ id: 'run-1' }],
      presets: [{ name: 'preset1' }],
      updated_at: '2024-01-01T00:00:00.000Z',
    };
    const result = normalizeWorkspace(input);
    expect(result.version).toBe(2);
    expect(result.maps.length).toBe(1);
    expect(result.runs.length).toBe(1);
    expect(result.presets.length).toBe(1);
    expect(result.updated_at).toBe(input.updated_at);
  });

  it('converts version to number', () => {
    const result = normalizeWorkspace({ version: '2' });
    expect(result.version).toBe(2);
  });

  it('defaults version to 1', () => {
    const result = normalizeWorkspace({});
    expect(result.version).toBe(1);
  });
});
