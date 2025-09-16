// test/inferFocusedWeapons.test.ts
import { describe, it, expect } from 'vitest';
import { inferFocusedWeapons } from '@domain/inferFocusedWeapons';

describe('inferFocusedWeapons', () => {
  it('daily_grind_guaranteed を抽出できる', () => {
    const input = [
      { uiStyle: 'daily_grind_guaranteed', hash: 111 },
      { uiStyle: 'other', hash: 222 }
    ];
    const result = inferFocusedWeapons(input);
    expect(result).toEqual([111]);
  });
});
