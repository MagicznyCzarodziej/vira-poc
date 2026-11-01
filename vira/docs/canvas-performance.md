# Canvas performance

Targets (manual + harness):

| Scale | Goal |
| --- | --- |
| 50–100 placements | Smooth drag/pan; no store commit per pointer frame during drag |
| 200+ placements | Acceptable pan/zoom with viewport culling |

## Dev harness

Run placement seed timing in Vitest:

```bash
npm test -- --run src/domain/canvasPerfSeed.test.ts
```

To stress the UI manually: use **Random cards** in the header, drag many list cards onto the canvas, or call `seedCanvasCardPlacements` from a dev console after importing the domain helper.

## Optimizations (implementation)

1. Memoized placed layers + narrow Zustand selectors
2. Precomputed frame border occluders
3. DOM `translate` preview during drag; single store commit on pointer up
4. Viewport scroll synced to store on pan end; marquee selection throttled to rAF
5. Viewport culling / `content-visibility` were removed — they clipped shadows, selection outlines, and reveal animations, and caused flash on zoom when swapping placeholders

Regression: `npm test -- --run` (especially `bindCanvasGestures*.test.ts`).
