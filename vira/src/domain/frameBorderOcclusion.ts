import type { FrameRect } from "./frameCanvas.ts";

export function frameRectsIntersect(a: FrameRect, b: FrameRect): boolean {
  return (
    a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y
  );
}

/** Frame bounds above `host` in z-order, expressed in host-local coordinates for border masking. */
export function localOccluderRectsForFrame(
  host: FrameRect,
  occludersWorld: readonly FrameRect[],
): FrameRect[] {
  const out: FrameRect[] = [];
  for (const o of occludersWorld) {
    if (!frameRectsIntersect(host, o)) continue;
    out.push({
      x: o.x - host.x,
      y: o.y - host.y,
      width: o.width,
      height: o.height,
    });
  }
  return out;
}
