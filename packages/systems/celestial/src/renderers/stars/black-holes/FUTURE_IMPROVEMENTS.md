Below is a complete migration plan that brings your current Three-JS black-hole renderers up to the quality of Eric Bruneton’s 2020 technique.
I have split the answer into four sections so you can move forward incrementally:
Problems with the current implementation
Target architecture (what the finished system will look like)
Concrete implementation roadmap with milestones and file-level changes
Immediate next step (small, self-contained PR you can start coding right now)
All design decisions respect the Teskooano rules (monorepo, strict TS, no frameworks, < 400 LOC per file, etc.).

1. What is wrong today
   A. Accretion disc & horizon
   Shader is stylised: simple RingGeometry + FBM; no relativistic beaming, no correct temperature profile, no Doppler shift, no time-of-flight delay.
   B. Gravitational lensing
   Done with a “fish-eye” sphere sampling the already-rendered scene.
   Purely heuristic distortion; ignores impact parameter, photon sphere, multiple images & Einstein rings; cannot reproduce forward-scattered starlight.
   C. Performance / scalability
   Because the lensing is a second render pass per frame, complexity grows with screen pixels.
   Putting millions of stars in the background is impractical (your helper only works for a low-res star-field).
   Result: visually nice for demos, but fails for scientific or cinematic usage.
2. Target architecture (high-level design)
   The Bruneton method keeps everything entirely in a SINGLE full-screen fragment shader fed by three small LUTs computed once at start-up (or baked offline):
   ┌─────────────┬───────────────────┐
   │ LUT D(e,u) │ 512 × 512 RG32F │ # ray deflection (escape angle Δ)
   ├─────────────┼───────────────────┤
   │ LUT U(e,φ) │ 64 × 32 RG32F │ # disc intersection + retarded time
   ├─────────────┼───────────────────┤
   │ LUT C(xy,D) │ 64 × 32 × 64 RGB │ # Doppler+beaming chroma shift
   └─────────────┴───────────────────┘
   Everything else (accretion disc model, star catalogue, bloom) is evaluated directly in that shader.
   Therefore the new renderer becomes a post-processing pass attached to the global EffectComposer instead of geometry sitting inside the 3-D scene graph.
   Directory sketch in the monorepo:
   Apply to index.ts
   glsl
3. Roadmap & file-level work
   Milestone 0 (compile-time only, ≤ 1 day)
   Add new package scaffold, build config, typings, moon tasks.
   Milestone 1 (LUT generation, 1–2 days)
   Port the C++ PRECOMPUTE routine (Algorithm 1 in the paper) to TypeScript – see boxed pseudocode in the pdf.
   Keep it deterministic; use double precision (number is enough).
   Produce the three LUTs as Float32Arrays and feed them into THREE.DataTexture.
   Hide LUT creation behind an RxJS observable so the main thread stays reactive:
   Apply to index.ts
   ;
   Milestone 2 (Full-screen shader pass, 2–3 days)
   Create BlackHoleFullScreenPass that implements THREE.Pass:
   Vertex shader: passthrough.
   Fragment shader: literal port of functions.glsl from Bruneton’s repo.
   Uniforms: the three LUTs + star cubemap + disc params + camera 4-velocity.
   Hook into existing render pipeline: after the skybox & stars are drawn, run this pass, then tone-map & bloom (reuse your bloom pass).
   Milestone 3 (Accretion disc & star catalogue, 1–2 days)
   Replace RingGeometry with procedural disc model in fragment shader (Section 3.3.3 of the paper).
   Load Gaia/Tycho2 cubemaps (you can start with a 1024² HDR placeholder).
   Implement mip-map level star filtering as described in Fig. 3.
   Milestone 4 (UX, perf, cleanup, 1–2 days)
   Realtime controls (mass, inclination) via RxJS store.
   Dispose paths, resize listeners.
   Unit tests:
   BrunetonPrecompute.spec.ts (lookup values ±1e-3 vs reference).
   BlackHoleFullScreenPass.spec.ts (init & uniform plumbing).
   Milestone 5 (drop-in replacement)
   Delete old SchwarzschildBlackHoleRenderer and GravitationalLensingHelper.
   Provide compatibility wrapper so existing scene code only needs:
   Apply to index.ts
   ;
4. Immediate next step (small PR)
   Start with Milestone 0 + the LUT generator skeleton. It is 100 % self-contained and won’t break runtime until the full pass is ready.
   Create packages/systems/celestial/src/renderers/black-hole/BrunetonPrecompute.ts with the following high-level API:
   Apply to index.ts
   ;
   This file will:
   Allocate two Float32Array buffers.
   Run the Euler loop from Algorithm 1 (use the pseudo-code, port directly, no shortcuts).
   Fill RG32F texels: [deflect, time] for D; [u, time] for U.
   Wrap in THREE.DataTexture, set needsUpdate = true.
   Return them.
   That gives you a binary deliverable you can test today without touching the old renderer.
