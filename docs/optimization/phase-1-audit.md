# Phase 1 — Audit, correctness baseline, and benchmark plan

Branch: `perf/spatial-optimization`

## Scope

This phase fixes a confirmed indexing defect in the existing gravity compute shader and records the correctness/performance baseline needed before changing the spatial algorithm. It deliberately does not introduce spatial sorting, change the force model, or add CPU/WASM work.

## Confirmed defect fixed

In `GravityShader.wgsl`, the interaction loop previously started at `workgroup_id.x` rather than `workgroup_id.x * WORKGROUP_SIZE`. As a result, workgroups processed overlapping, incorrectly offset particle ranges. The loop now uses the workgroup's actual start index and clamps its end to `PARTICLE_COUNT`.

This correction does **not** make the simulation a full all-pairs gravity solver: each particle still considers only the range assigned to its workgroup. That limitation is part of the current algorithm and must be addressed deliberately in a later phase rather than hidden by the indexing fix.

## Audit findings to carry forward

- The force helper clamps distance to at least `1.0`, so its later `distance <= EPSILON` check can never be true. Changing this affects close-range physics and is intentionally deferred until the desired softening/collision behavior is agreed.
- The current force calculation only considers particles in one workgroup. Spatially sorting particles alone will not guarantee that all physically relevant interactions are included, especially across workgroup boundaries.
- The current particle representation occupies four `rgba32float` texels per particle (64 bytes per particle, approximately 640 MB for 10 million particles for one such texture, before auxiliary textures and buffers).
- The package scripts currently expose `build` and `lint`, but no dedicated automated test or benchmark command. GPU timings must be captured on the target browser/device; they cannot be reliably inferred from static code inspection.

## Baseline procedure

Capture a baseline on the same browser, GPU, power mode, and simulation settings before later algorithm changes. Record the browser/GPU/device, workgroup size, particle count, gravity constant, and whether the scene is warmed up.

For each supported count (start at 100k, then 1M if stable), record:

| Measurement | How to record |
| --- | --- |
| Startup / pipeline preparation | Time from app start until the simulation is ready |
| Compute frame time | GPU timestamp queries if supported; otherwise use a clearly labelled CPU-side submission/frame proxy |
| Frame rate | Median and low-percentile FPS over a fixed 30–60 second window |
| Stability | Validation errors, device loss, visual anomalies, and browser memory pressure |
| Workgroup size | Repeat with supported values such as 128, 256, 512 and 1024; respect device limits |

Do not compare CPU submission time from one run with GPU execution time from another. Keep the measurement method consistent and note when GPU timestamps are unavailable.

## Acceptance criteria for Phase 1

- The interaction-loop range is indexed from the first particle in each workgroup and does not exceed the particle count.
- The project build and lint checks pass in a local environment with dependencies installed.
- A baseline is captured on the target GPU before the spatial algorithm is changed.
- No claims of performance improvement are made from the indexing fix alone; it is a correctness fix.

## Validation status

- [x] Shader indexing defect corrected.
- [ ] `npm run build` executed locally.
- [ ] `npm run lint` executed locally.
- [ ] Baseline timings captured on target hardware.
