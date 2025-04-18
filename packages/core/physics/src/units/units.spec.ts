import { describe, expect, it } from 'vitest';
import {
  auDayToMetersPerSecond,
  auToMeters,
  CONVERSION,
  convert,
  convertVector,
  metersPerSecondToAUDay,
  metersToAU
} from './units';

describe('Unit Conversion', () => {
  describe('convert', () => {
    it('converts between units correctly', () => {
      // Test meters to AU conversion
      expect(convert(149597870700, CONVERSION.M_TO_AU, 1)).toBeCloseTo(1);
      
      // Test days to seconds conversion
      expect(convert(1, CONVERSION.DAYS_TO_S, 1)).toBeCloseTo(86400);
      
      // Test km/s to m/s conversion
      expect(convert(1, CONVERSION.KM_S_TO_M_S, 1)).toBeCloseTo(1000);
    });

    it('handles zero values', () => {
      expect(convert(0, CONVERSION.M_TO_AU, 1)).toBe(0);
      expect(convert(0, CONVERSION.DAYS_TO_S, 1)).toBe(0);
      expect(convert(0, CONVERSION.KM_S_TO_M_S, 1)).toBe(0);
    });
  });

  describe('convertVector', () => {
    it('converts vector components correctly', () => {
      const vector = { x: 149597870700, y: 0, z: 0 };
      const converted = convertVector(vector, CONVERSION.M_TO_AU, 1);
      
      expect(converted.x).toBeCloseTo(1);
      expect(converted.y).toBe(0);
      expect(converted.z).toBe(0);
    });

    it('handles zero vectors', () => {
      const vector = { x: 0, y: 0, z: 0 };
      const converted = convertVector(vector, CONVERSION.M_TO_AU, 1);
      
      expect(converted.x).toBe(0);
      expect(converted.y).toBe(0);
      expect(converted.z).toBe(0);
    });
  });

  describe('metersToAU', () => {
    it('converts meters to AU correctly', () => {
      expect(metersToAU(149597870700)).toBeCloseTo(1);
      expect(metersToAU(299195741400)).toBeCloseTo(2);
      expect(metersToAU(0)).toBe(0);
    });
  });

  describe('auToMeters', () => {
    it('converts AU to meters correctly', () => {
      expect(auToMeters(1)).toBeCloseTo(149597870700);
      expect(auToMeters(2)).toBeCloseTo(299195741400);
      expect(auToMeters(0)).toBe(0);
    });
  });

  describe('metersPerSecondToAUDay', () => {
    it('converts m/s to AU/day correctly', () => {
      // 1 AU/day ≈ 1731.5 m/s
      expect(metersPerSecondToAUDay(1731.5)).toBeCloseTo(1);
      expect(metersPerSecondToAUDay(0)).toBe(0);
    });
  });

  describe('auDayToMetersPerSecond', () => {
    it('converts AU/day to m/s correctly', () => {
      // 1 AU/day ≈ 1731.5 m/s
      expect(auDayToMetersPerSecond(1)).toBeCloseTo(1731.5);
      expect(auDayToMetersPerSecond(0)).toBe(0);
    });
  });

  describe('Round-trip conversions', () => {
    it('meters ↔ AU', () => {
      const originalMeters = 149597870700;
      const au = metersToAU(originalMeters);
      const finalMeters = auToMeters(au);
      expect(finalMeters).toBeCloseTo(originalMeters);
    });

    it('m/s ↔ AU/day', () => {
      const originalMps = 1731.5;
      const auDay = metersPerSecondToAUDay(originalMps);
      const finalMps = auDayToMetersPerSecond(auDay);
      expect(finalMps).toBeCloseTo(originalMps);
    });
  });
}); 