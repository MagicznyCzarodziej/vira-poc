import type { FrameRect } from "../../domain/index.ts";

const BORDER_FADE_UNDER_OCCLUDER = 0.86;

function frameShadowFilterId(frameId: string, emphasis: boolean): string {
  return emphasis ? `frame-shadow-emphasis-${frameId}` : `frame-shadow-${frameId}`;
}

export function CanvasFrameBorder({
  frameId,
  width,
  height,
  zoom,
  occludersLocal,
  emphasis = false,
}: {
  frameId: string;
  width: number;
  height: number;
  zoom: number;
  occludersLocal: readonly FrameRect[];
  emphasis?: boolean;
}) {
  const z = Math.max(zoom, 0.05);
  const stroke = 2 / z;
  const radius = 6 / z;
  const maskId = `frame-border-mask-${frameId}`;
  const shadowFilterId = frameShadowFilterId(frameId, emphasis);
  const inset = stroke / 2;
  const innerW = Math.max(0, width - stroke);
  const innerH = Math.max(0, height - stroke);
  const maskRef = occludersLocal.length > 0 ? `url(#${maskId})` : undefined;
  const shadowDy1 = (emphasis ? 6 : 4) / z;
  const shadowBlur1 = (emphasis ? 18 : 14) / z;
  const shadowOp1 = emphasis ? 0.1 : 0.07;
  const shadowDy2 = (emphasis ? 2 : 1) / z;
  const shadowBlur2 = (emphasis ? 6 : 3) / z;
  const shadowOp2 = emphasis ? 0.06 : 0.05;

  return (
    <svg
      className="canvas-frame-border-svg"
      aria-hidden="true"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        {occludersLocal.length > 0 && (
          <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={height}>
            <rect x={0} y={0} width={width} height={height} fill="white" />
            {occludersLocal.map((o, i) => (
              <rect
                key={i}
                x={o.x}
                y={o.y}
                width={o.width}
                height={o.height}
                fill="black"
                fillOpacity={BORDER_FADE_UNDER_OCCLUDER}
              />
            ))}
          </mask>
        )}
        <filter
          id={shadowFilterId}
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
          colorInterpolationFilters="sRGB"
        >
          <feDropShadow
            in="SourceAlpha"
            dx={0}
            dy={shadowDy1}
            stdDeviation={shadowBlur1 / 2}
            floodOpacity={shadowOp1}
            result="frameShadow1"
          />
          <feDropShadow
            in="SourceAlpha"
            dx={0}
            dy={shadowDy2}
            stdDeviation={shadowBlur2 / 2}
            floodOpacity={shadowOp2}
            result="frameShadow2"
          />
          <feMerge result="frameShadowMerge">
            <feMergeNode in="frameShadow1" />
            <feMergeNode in="frameShadow2" />
          </feMerge>
        </filter>
      </defs>
      <g mask={maskRef}>
        <rect
          x={inset}
          y={inset}
          width={innerW}
          height={innerH}
          rx={radius}
          ry={radius}
          fill="#000"
          fillOpacity={0.004}
          filter={`url(#${shadowFilterId})`}
        />
      </g>
      <rect
        x={inset}
        y={inset}
        width={innerW}
        height={innerH}
        rx={radius}
        ry={radius}
        fill="none"
        className="canvas-frame-border-stroke"
        strokeWidth={stroke}
        vectorEffect="non-scaling-stroke"
        mask={maskRef}
      />
    </svg>
  );
}
