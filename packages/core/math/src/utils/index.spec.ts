import { describe, expect, it, vi } from 'vitest';
import * as mathUtils from './index';

describe('Math Utilities', () => {
  describe('clamp', () => {
    it('should clamp a value between min and max', () => {
      expect(mathUtils.clamp(5, 0, 10)).toBe(5);
      expect(mathUtils.clamp(-5, 0, 10)).toBe(0);
      expect(mathUtils.clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('lerp', () => {
    it('should linearly interpolate between two values', () => {
      expect(mathUtils.lerp(0, 10, 0)).toBe(0);
      expect(mathUtils.lerp(0, 10, 1)).toBe(10);
      expect(mathUtils.lerp(0, 10, 0.5)).toBe(5);
    });
  });

  describe('degToRad and radToDeg', () => {
    it('should convert degrees to radians', () => {
      expect(mathUtils.degToRad(0)).toBe(0);
      expect(mathUtils.degToRad(180)).toBeCloseTo(Math.PI);
      expect(mathUtils.degToRad(360)).toBeCloseTo(2 * Math.PI);
    });

    it('should convert radians to degrees', () => {
      expect(mathUtils.radToDeg(0)).toBe(0);
      expect(mathUtils.radToDeg(Math.PI)).toBeCloseTo(180);
      expect(mathUtils.radToDeg(2 * Math.PI)).toBeCloseTo(360);
    });
  });

  describe('equals', () => {
    it('should check if two numbers are approximately equal', () => {
      expect(mathUtils.equals(0, 0)).toBe(true);
      expect(mathUtils.equals(0, 0.0000001)).toBe(true);
      expect(mathUtils.equals(0, 0.001)).toBe(false);
    });
  });

  describe('power of two functions', () => {
    it('should check if a number is a power of two', () => {
      expect(mathUtils.isPowerOfTwo(1)).toBe(true);
      expect(mathUtils.isPowerOfTwo(2)).toBe(true);
      expect(mathUtils.isPowerOfTwo(4)).toBe(true);
      expect(mathUtils.isPowerOfTwo(3)).toBe(false);
    });

    it('should ceil to the next power of two', () => {
      expect(mathUtils.ceilPowerOfTwo(3)).toBe(4);
      expect(mathUtils.ceilPowerOfTwo(5)).toBe(8);
    });

    it('should floor to the previous power of two', () => {
      expect(mathUtils.floorPowerOfTwo(3)).toBe(2);
      expect(mathUtils.floorPowerOfTwo(5)).toBe(4);
    });

    it('should round to the nearest power of two', () => {
      expect(mathUtils.nearestPowerOfTwo(3)).toBe(4);
      expect(mathUtils.nearestPowerOfTwo(6)).toBe(8);
      expect(mathUtils.nearestPowerOfTwo(5)).toBe(4);
    });
  });

  describe('generateUUID', () => {
    it('should generate a valid UUID', () => {
      const uuid = mathUtils.generateUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', () => {
      vi.useFakeTimers();
      const func = vi.fn();
      const debouncedFunc = mathUtils.debounce(func, 1000);

      debouncedFunc();
      debouncedFunc();
      debouncedFunc();

      expect(func).not.toBeCalled();

      vi.advanceTimersByTime(1000);
      expect(func).toBeCalledTimes(1);
      
      vi.useRealTimers();
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', () => {
      vi.useFakeTimers();
      const func = vi.fn();
      const throttledFunc = mathUtils.throttle(func, 1000);

      throttledFunc();
      expect(func).toBeCalledTimes(1);

      throttledFunc();
      throttledFunc();
      expect(func).toBeCalledTimes(1);

      vi.advanceTimersByTime(1000);
      throttledFunc();
      expect(func).toBeCalledTimes(2);
      
      vi.useRealTimers();
    });
  });

  describe('memoize', () => {
    it('should memoize function results', () => {
      const func = vi.fn((a: number, b: number) => a + b);
      const memoizedFunc = mathUtils.memoize(func);

      expect(memoizedFunc(1, 2)).toBe(3);
      expect(func).toBeCalledTimes(1);

      expect(memoizedFunc(1, 2)).toBe(3);
      expect(func).toBeCalledTimes(1);

      expect(memoizedFunc(2, 3)).toBe(5);
      expect(func).toBeCalledTimes(2);
    });
  });
}); 