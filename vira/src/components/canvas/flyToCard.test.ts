import { describe, expect, it } from "vitest";
import {
  FLY_FULL_ZOOM_OUT_DISTANCE,
  FLY_PAN_ONLY_DISTANCE,
  flyFitZoomForSpan,
  flyMidZoomForDistance,
} from "./flyToCard.ts";

describe("flyMidZoomForDistance", () => {
  const desired = 1;

  it("keeps zoom when the target is nearby", () => {
    expect(flyMidZoomForDistance(FLY_PAN_ONLY_DISTANCE, desired, 0.4)).toBe(desired);
    expect(flyMidZoomForDistance(200, desired, 0.4)).toBe(desired);
  });

  it("keeps zoom when both points already fit at the current level", () => {
    expect(flyMidZoomForDistance(3000, desired, 1.1)).toBe(desired);
    expect(flyMidZoomForDistance(8000, desired, desired)).toBe(desired);
  });

  it("scales zoom-out with distance between pan-only and full fly distance", () => {
    const fit = 0.5;
    const mid = flyMidZoomForDistance(2000, desired, fit);
    expect(mid).toBeLessThan(desired);
    expect(mid).toBeGreaterThan(fit);
    const t = (2000 - FLY_PAN_ONLY_DISTANCE) / (FLY_FULL_ZOOM_OUT_DISTANCE - FLY_PAN_ONLY_DISTANCE);
    expect(mid).toBeCloseTo(desired + (fit - desired) * t, 5);
  });

  it("reaches fit zoom at and beyond the full fly distance", () => {
    const fit = 0.45;
    expect(flyMidZoomForDistance(FLY_FULL_ZOOM_OUT_DISTANCE, desired, fit)).toBeCloseTo(fit, 5);
    expect(flyMidZoomForDistance(FLY_FULL_ZOOM_OUT_DISTANCE + 2000, desired, fit)).toBeCloseTo(fit, 5);
  });
});

describe("flyFitZoomForSpan", () => {
  it("never exceeds the current zoom cap", () => {
    expect(flyFitZoomForSpan(200, 200, 800, 600, 1)).toBeLessThanOrEqual(1);
  });
});
