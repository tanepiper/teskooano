# Shader & Lighting Scale Fixes: 1000 → 100 Units per AU

## Summary

The 10x scale reduction required **critical lighting adjustments** due to distance-squared calculations in light attenuation formulas.

## 🚨 Critical Fixes Applied

### **Distance-Based Light Attenuation**

**Problem**: Light falloff calculations use `distanceSquared * FALLOFF_FACTOR`. With 10x smaller distances, `distanceSquared` becomes 100x smaller, dramatically changing lighting behavior.

**Solution**: Increased `FALLOFF_FACTOR` by 100x to compensate.

#### Files Fixed:

1. **`packages/systems/celestial/src/renderers/terrestrial/base-terrestrial.ts`**
   - **Line 268**: `FALLOFF_FACTOR: 0.00000001` → `0.000001` (100x increase)
   - **Impact**: Maintains proper light falloff for planets and moons

2. **`packages/systems/celestial/src/renderers/gas-giants/base/renderer.ts`**
   - **Line 213**: `FALLOFF_FACTOR: 0.00000001` → `0.000001` (100x increase)
   - **Line 272**: `FALLOFF_FACTOR: 0.00000001` → `0.000001` (100x increase)
   - **Impact**: Maintains proper light falloff for gas giants (both high and medium detail)

## ✅ Systems That Auto-Adjust Correctly

### **Shader Distance Calculations**
All shaders use **position-based calculations** that automatically scale:

- **Shadow calculations** in all fragment shaders (terrestrial, gas giants, rings)
- **Atmosphere scattering** calculations 
- **Ring shadow casting** from planets and moons
- **Procedural terrain** noise sampling (uses normalized coordinates)

### **Lighting Manager**
- **Influence calculation**: `intensity / (distanceSq + 1.0)` works correctly as it's relative
- **Light selection** based on distance works automatically

### **Billboard & Point Lights**
- **Star billboards**: Use `distance: 0` (no falloff), unaffected
- **Point light creation**: Auto-scales with scene positions

## 🔍 Verification Checklist

After scale implementation, verify:

- [ ] **Planetary lighting** looks natural at various distances
- [ ] **Gas giant atmosphere** lighting transitions smoothly  
- [ ] **Ring shadows** from moons appear correctly
- [ ] **Light falloff** behavior matches previous visual quality
- [ ] **Atmosphere glow** intensity unchanged
- [ ] **Shadow sharpness** consistent across scale ranges

## 📊 Technical Details

### **Math Behind the Fix**
```
Old Scale: 1000 units/AU
New Scale: 100 units/AU
Distance Reduction: 10x smaller
Distance² Effect: 100x smaller

Attenuation Formula: 1.0 / (1.0 + distance² × FALLOFF_FACTOR)

To maintain same attenuation:
FALLOFF_FACTOR_new = FALLOFF_FACTOR_old × 100
```

### **Shader Architecture Advantage**
The modular shader system with position-based calculations proved robust:
- **No hardcoded distance values** in shader uniforms
- **Automatic scaling** through scene coordinate system
- **Consistent shadow/lighting** behavior across all LOD levels

## 🎯 Expected Results

- **Improved numerical precision** at large distances
- **Stable lighting** behavior across all scales  
- **Consistent visual quality** with previous scale
- **Better performance** with reduced floating-point precision issues
- **Maintained artistic intent** for all lighting scenarios