import { describe, expect, it } from 'vitest';
import { increment } from '../../src/domain/counter';

describe('Counter domain', () => {
  it('increments a valid score', () => expect(increment(2)).toBe(3));
  it('rejects invalid scores', () => expect(() => increment(-1)).toThrow(RangeError));
});
