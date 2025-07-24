import { DeviceTier, PerformanceOptimization } from "@teskooano/data-types";
import * as THREE from "three";

/**
 * Determines optimal performance settings based on WebGL capabilities and user profile
 */
export function getPerformanceOptimization(
  capabilities: THREE.WebGLCapabilities,
  userProfile: DeviceTier,
): PerformanceOptimization {
  // Base optimization based on hardware capabilities
  const isHighEndGPU =
    capabilities.maxTextures >= 16 &&
    capabilities.maxTextureSize >= 8192 &&
    capabilities.maxFragmentUniforms >= 1024;

  const isMidRangeGPU =
    capabilities.maxTextures >= 8 &&
    capabilities.maxTextureSize >= 4096 &&
    capabilities.maxFragmentUniforms >= 512;

  const isLowEndGPU = !isHighEndGPU && !isMidRangeGPU;

  // User profile multipliers (0.5 = more aggressive optimization, 2.0 = less optimization)
  const profileMultipliers = {
    low: 0.5,
    medium: 0.8,
    high: 1.2,
    cosmic: 2.0,
  };

  const multiplier = profileMultipliers[userProfile];

  // Determine antialiasing based on capabilities and profile
  const antialias = isHighEndGPU || (isMidRangeGPU && userProfile !== "low");

  // Determine shadows based on capabilities
  const shadows = isHighEndGPU || (isMidRangeGPU && userProfile !== "low");
  const shadowMapType = isHighEndGPU
    ? THREE.PCFSoftShadowMap
    : THREE.BasicShadowMap;

  // Determine HDR based on capabilities
  const hdr =
    isHighEndGPU ||
    (isMidRangeGPU && userProfile === "high") ||
    userProfile === "cosmic";

  // Pixel ratio optimization
  const basePixelRatio = isHighEndGPU ? 2.0 : isMidRangeGPU ? 1.5 : 1.0;
  const pixelRatio = Math.min(
    window.devicePixelRatio,
    basePixelRatio * multiplier,
  );

  // Light and shadow limits based on uniform capacity
  const maxLights = Math.min(
    Math.floor(capabilities.maxFragmentUniforms / 20), // Estimate uniforms per light
    isHighEndGPU ? 16 : isMidRangeGPU ? 8 : 4,
  );

  const maxShadowCasters = Math.min(
    Math.floor(capabilities.maxFragmentUniforms / 15), // Estimate uniforms per shadow caster
    isHighEndGPU ? 12 : isMidRangeGPU ? 6 : 3,
  );

  // LOD distance multiplier (higher = switch to lower detail sooner)
  const lodDistanceMultiplier = isLowEndGPU ? 1.5 : isMidRangeGPU ? 1.2 : 1.0;

  // Trail quality based on capabilities
  const trailQuality = isHighEndGPU ? "high" : isMidRangeGPU ? "medium" : "low";

  // Particle count multiplier
  const particleCountMultiplier = isHighEndGPU
    ? 1.0
    : isMidRangeGPU
      ? 0.7
      : 0.4;

  return {
    antialias,
    shadows,
    hdr,
    pixelRatio,
    shadowMapType,
    maxLights,
    maxShadowCasters,
    lodDistanceMultiplier,
    trailQuality,
    particleCountMultiplier,
  };
}
