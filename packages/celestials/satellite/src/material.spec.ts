import { describe, it, expect, beforeEach } from "vitest";
import * as THREE from "three";
import { SatelliteMaterial } from "./material";

describe("SatelliteMaterial", () => {
  let material: SatelliteMaterial;

  beforeEach(() => {
    material = new SatelliteMaterial({
      color: new THREE.Color(0xdddddd),
      metalness: 0.7,
      roughness: 0.3,
      maxEmissiveIntensity: 0.8,
    });
  });

  it("should create a shader material with correct uniforms", () => {
    expect(material).toBeInstanceOf(THREE.ShaderMaterial);
    expect(material.uniforms.baseColor).toBeDefined();
    expect(material.uniforms.metalness).toBeDefined();
    expect(material.uniforms.roughness).toBeDefined();
    expect(material.uniforms.uLights).toBeDefined();
    expect(material.uniforms.uNumLights).toBeDefined();
    expect(material.uniforms.uShadowFactor).toBeDefined();
    expect(material.uniforms.uEmissiveIntensity).toBeDefined();
    expect(material.uniforms.uEmissiveColor).toBeDefined();
    expect(material.uniforms.uDynamicAmbientIntensity).toBeDefined();
  });

  it("should have vertex and fragment shaders", () => {
    expect(material.vertexShader).toBeDefined();
    expect(material.fragmentShader).toBeDefined();
    expect(material.vertexShader.length).toBeGreaterThan(0);
    expect(material.fragmentShader.length).toBeGreaterThan(0);
  });

  it("should update lighting data correctly", () => {
    const lightSources = new Map();
    lightSources.set("star1", {
      position: new THREE.Vector3(1000, 0, 0),
      color: new THREE.Color(1, 1, 1),
      intensity: 1.0,
    });

    const satellitePosition = new THREE.Vector3(0, 0, 0);

    expect(() => {
      material.update(satellitePosition, lightSources);
    }).not.toThrow();

    expect(material.uniforms.uNumLights.value).toBe(1);
    expect(material.uniforms.uLights.value[0].position.x).toBe(1000);
  });

  it("should update shadow casters correctly", () => {
    const shadowCasters = [
      { position: new THREE.Vector3(500, 0, 0), radius: 100 },
      { position: new THREE.Vector3(-500, 0, 0), radius: 50 },
    ];

    const lightSources = new Map();
    lightSources.set("star1", {
      position: new THREE.Vector3(1000, 0, 0),
      color: new THREE.Color(1, 1, 1),
      intensity: 1.0,
    });

    const satellitePosition = new THREE.Vector3(0, 0, 0);

    expect(() => {
      material.update(satellitePosition, lightSources, shadowCasters);
    }).not.toThrow();

    // Should calculate shadow factor based on shadow casters
    expect(material.uniforms.uShadowFactor.value).toBeLessThan(1.0);
  });

  it("should handle multiple light sources", () => {
    const lightSources = new Map();
    lightSources.set("star1", {
      position: new THREE.Vector3(1000, 0, 0),
      color: new THREE.Color(1, 1, 1),
      intensity: 1.0,
    });
    lightSources.set("star2", {
      position: new THREE.Vector3(-1000, 0, 0),
      color: new THREE.Color(1, 0.8, 0.6),
      intensity: 0.8,
    });

    const satellitePosition = new THREE.Vector3(0, 0, 0);
    material.update(satellitePosition, lightSources);

    expect(material.uniforms.uNumLights.value).toBe(2);
    expect(material.uniforms.uLights.value[1].color.r).toBe(1);
    expect(material.uniforms.uLights.value[1].color.g).toBe(0.8);
  });

  it("should calculate emissive intensity based on shadow conditions", () => {
    const lightSources = new Map();
    lightSources.set("star1", {
      position: new THREE.Vector3(1000, 0, 0),
      color: new THREE.Color(1, 1, 1),
      intensity: 1.0,
    });

    const satellitePosition = new THREE.Vector3(0, 0, 0);

    // Test in shadow (should have higher emissive)
    const shadowCasters = [
      { position: new THREE.Vector3(500, 0, 0), radius: 100 },
    ];

    material.update(satellitePosition, lightSources, shadowCasters);

    // Should have higher emissive intensity when in shadow
    expect(material.uniforms.uEmissiveIntensity.value).toBeGreaterThan(0.0);
  });
});
