// Simple test script to verify rotation calculation fix
import { RenderableObjectFactory } from './packages/renderer/threejs-objects/src/factory/RenderableObjectFactory.js';

// Mock celestial object
const celestialObject = {
  id: "test-planet",
  type: "PLANET",
  name: "Test Planet",
  realRadius_m: 6371000,
  realMass_kg: 5.972e24,
  orbit: {
    siderealRotationPeriod_s: 86400, // 1 day
    axialTilt: 0.409, // ~23.4 degrees
  },
  properties: {},
  parentId: "test-star",
};

const factory = new RenderableObjectFactory();
const objects = { [celestialObject.id]: celestialObject };

// Test rotation at different times
const time1 = 0;
const time2 = 43200; // 12 hours later
const time3 = 86400; // 24 hours later

console.log('Testing rotation calculation fix...');

const renderable1 = factory.createRenderableObjects(objects, time1);
const renderable2 = factory.createRenderableObjects(objects, time2);
const renderable3 = factory.createRenderableObjects(objects, time3);

const rotation1 = renderable1[celestialObject.id]?.rotation;
const rotation2 = renderable2[celestialObject.id]?.rotation;
const rotation3 = renderable3[celestialObject.id]?.rotation;

console.log('Rotation at time 0:', rotation1);
console.log('Rotation at time 43200 (12h):', rotation2);
console.log('Rotation at time 86400 (24h):', rotation3);

// Check if rotations are different
const rotationsDifferent = 
  rotation1?.x !== rotation2?.x ||
  rotation1?.y !== rotation2?.y ||
  rotation1?.z !== rotation2?.z ||
  rotation1?.w !== rotation2?.w;

console.log('Rotations are different at different times:', rotationsDifferent);

// Check if rotation returns to approximately the same position after 24 hours
const rotationsSimilar = 
  Math.abs(rotation1?.x - rotation3?.x) < 0.01 &&
  Math.abs(rotation1?.y - rotation3?.y) < 0.01 &&
  Math.abs(rotation1?.z - rotation3?.z) < 0.01 &&
  Math.abs(rotation1?.w - rotation3?.w) < 0.01;

console.log('Rotation returns to similar position after 24 hours:', rotationsSimilar);

if (rotationsDifferent && rotationsSimilar) {
  console.log('✅ Rotation fix is working correctly!');
} else {
  console.log('❌ Rotation fix may not be working correctly.');
}