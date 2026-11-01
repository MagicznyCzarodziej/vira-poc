import type { ReactNode } from "react";

export function IconTrash() {
  return (
    <span className="icon-trash" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    </span>
  );
}

/** Lucide `unlink` (ISC) — https://lucide.dev/icons/unlink */
export function IconUnlink() {
  return (
    <span className="icon-unlink" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-7.07-.12l-1.71 1.71" />
        <path d="m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 7.07.12l1.71-1.71" />
        <line x1="8" x2="8" y1="2" y2="5" />
        <line x1="2" x2="5" y1="8" y2="8" />
        <line x1="16" x2="16" y1="19" y2="22" />
        <line x1="19" x2="22" y1="16" y2="16" />
      </svg>
    </span>
  );
}

/** Dismiss from canvas (not delete). */
export function IconDismiss() {
  return (
    <span className="icon-dismiss" aria-hidden="true">
      ×
    </span>
  );
}

/** Lucide `square-dashed-x-corner` (ISC) — remove frame from canvas. */
export function IconSquareDashedXCorner() {
  return (
    <span className="icon-square-dashed-x-corner" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3h1" />
        <path d="m16 16 5 5" />
        <path d="M19 3a2 2 0 0 1 2 2" />
        <path d="m21 16-5 5" />
        <path d="M21 9v1" />
        <path d="M3 14v1" />
        <path d="M3 9v1" />
        <path d="M5 21a2 2 0 0 1-2-2" />
        <path d="M5 3a2 2 0 0 0-2 2" />
        <path d="M9 21h1" />
        <path d="M9 3h1" />
      </svg>
    </span>
  );
}

function IconCardFrame({ children }: { children?: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="4" width="14" height="16" rx="2" />
      {children}
    </svg>
  );
}

/** Question-first blank card (lines suggest copy). */
export function IconCard() {
  return (
    <span className="icon-card" aria-hidden="true">
      <IconCardFrame>
        <line x1="9" y1="9" x2="15" y2="9" />
        <line x1="9" y1="13" x2="13" y2="13" />
      </IconCardFrame>
    </span>
  );
}

/** Lucide `undo-2` (ISC). */
export function IconUndo() {
  return (
    <span className="icon-undo" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 14 4 9 9 4" />
        <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
      </svg>
    </span>
  );
}

/** Lucide `circle-check` (ISC). */
export function IconCircleCheck() {
  return (
    <span className="icon-circle-check" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    </span>
  );
}

/** Lucide `construction` (ISC) — add linked action from decision row. */
export function IconActionPoint() {
  return (
    <span className="icon-action-point" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="8" rx="1" />
        <path d="M17 14v7" />
        <path d="M7 14v7" />
        <path d="M17 3v3" />
        <path d="M7 3v3" />
        <path d="M10 14 2.3 6.3" />
        <path d="m14 6 7.7 7.7" />
        <path d="m8 6 8 8" />
      </svg>
    </span>
  );
}

/** Lucide `square-dashed` (https://lucide.dev/icons/square-dashed). */
function IconSquareDashedPaths() {
  return (
    <>
      <path d="M5 3a2 2 0 0 0-2 2" />
      <path d="M19 3a2 2 0 0 1 2 2" />
      <path d="M21 19a2 2 0 0 1-2 2" />
      <path d="M5 21a2 2 0 0 1-2-2" />
      <path d="M9 3h1" />
      <path d="M9 21h1" />
      <path d="M14 3h1" />
      <path d="M14 21h1" />
      <path d="M3 9v1" />
      <path d="M21 9v1" />
      <path d="M3 14v1" />
      <path d="M21 14v1" />
    </>
  );
}

/** Canvas frame — dashed square. */
export function IconFrame() {
  return (
    <span className="icon-frame" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <IconSquareDashedPaths />
      </svg>
    </span>
  );
}

/** Lucide `tag` (https://lucide.dev/icons/tag). */
export function IconTag() {
  return (
    <span className="icon-tag" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
        <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}

/** Lucide square-dashed with Lucide tag centered inside. */
export function IconFrameWithTag() {
  return (
    <span className="icon-frame-with-tag" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <IconSquareDashedPaths />
        <g transform="translate(12 12) scale(0.36) translate(-12 -12)" strokeWidth={2 / 0.36}>
          <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
          <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" stroke="none" />
        </g>
      </svg>
    </span>
  );
}

export function IconChevronDown() {
  return (
    <span className="icon-chevron-down" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}

/** Lucide `panel-left-close` — hide sidebar. */
export function IconPanelLeftClose() {
  return (
    <span className="icon-panel-left-close" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M9 3v18" />
        <path d="m16 15-3-3 3-3" />
      </svg>
    </span>
  );
}

/** Lucide `panel-left-open` — show sidebar. */
export function IconPanelLeftOpen() {
  return (
    <span className="icon-panel-left-open" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M9 3v18" />
        <path d="m14 9 3 3-3 3" />
      </svg>
    </span>
  );
}

/** Lucide `sticky-note` (ISC). */
export function IconStickyNote() {
  return (
    <span className="icon-sticky-note" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" />
        <path d="M15 3v4a2 2 0 0 0 2 2h4" />
      </svg>
    </span>
  );
}

/** Decision — lightbulb. */
export function IconLightbulb() {
  return (
    <span className="icon-lightbulb" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M12 2a7 7 0 0 0-4 12.5V17h8v-2.5A7 7 0 0 0 12 2z" />
      </svg>
    </span>
  );
}
