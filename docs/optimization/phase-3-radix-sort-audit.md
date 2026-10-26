# Phase 3 — GPU Radix Sort audit

## Scope

Implement only the GPU radix sort needed to order Morton key/index pairs. Keep the work on `perf/spatial-optimization`; do not change the gravity calculation, Morton bounds, or merge into `main`.

## Existing implementation: blockers

- The shader import paths in the radix-sort kernels point to `Compute/RadixSortShader.wgsl`, while the shader is located in `Compute/RadixSort/RadixSortShader.wgsl`.
- The implementation still refers to `hilbertTexture` / `sortedHilbertTexture`, whereas phase 2 produces `mortonTexture` / `sortedMortonTexture`.
- `countParticlesBefore()` scans all preceding particles for every element. The scatter is quadratic and cannot scale to millions of particles.
- `c_prefix_sum` uses `workgroupBarrier()` as if it synchronized all workgroups. It does not; invocations in different workgroups cannot use it as a global barrier.
- The histogram is not explicitly initialized to zero before atomic increments.
- Histogram/prefix buffers are allocated on every digit pass rather than reused.
- The current reorder kernel is not part of a coherent stable-sort pipeline and reads particle data through bindings that are not used by the active sort kernels.

## Required pipeline

A stable least-significant-digit radix sort needs the following GPU stages for each digit:

1. Build a histogram per workgroup.
2. Compute global bucket bases and per-workgroup bucket offsets with a correct hierarchical prefix scan.
3. Scatter each key/index pair stably, using a workgroup-local rank rather than a scan over the entire particle array.
4. Swap source and destination textures for the next digit.

The prefix scan must be hierarchical: no shader may assume that a workgroup barrier synchronizes the entire dispatch. Scratch buffers should be allocated once for the sort and reused across digit passes.

## Validation criteria

- Keys are nondecreasing after sorting.
- Each key remains paired with its original particle index.
- No entries are lost or duplicated, including for repeated keys.
- Dispatches guard against indices beyond `particleCount`.
- The implementation is intended to scale to 10 million entries; performance claims require local benchmarking.
- Local build, lint, and simulation checks remain required before the phase can be marked complete.

## Current status

Audit only. The existing implementation is not considered a valid or scalable radix sort. This document does not mark phase 3 complete.
