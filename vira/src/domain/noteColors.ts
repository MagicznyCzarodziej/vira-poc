/** Sticky-note background palette (id → hex). */
export const NOTE_COLOR_MAP = {
  lemon: "#fef08a",
  peach: "#fed7aa",
  coral: "#fca5a5",
  pink: "#fbcfe8",
  lavender: "#e9d5ff",
  blue: "#93c5fd",
  sky: "#7dd3fc",
  mint: "#6ee7b7",
  green: "#86efac",
  lime: "#bef264",
  stone: "#e7e5e4",
  white: "#ffffff",
  ivory: "#fafaf9",
  "dark-gray": "#525252",
  black: "#171717",
} as const;

export type NoteColor = keyof typeof NOTE_COLOR_MAP;

const DARK_NOTE_COLORS: ReadonlySet<NoteColor> = new Set(["dark-gray", "black"]);

/** Menu / picker order: hue sweep, then light neutrals, then darks. */
export const NOTE_COLORS: readonly NoteColor[] = [
  "lemon",
  "lime",
  "green",
  "mint",
  "sky",
  "blue",
  "lavender",
  "pink",
  "coral",
  "peach",
  "white",
  "ivory",
  "stone",
  "dark-gray",
  "black",
];

export const DEFAULT_NOTE_COLOR: NoteColor = "white";

const DEPRECATED_NOTE_COLORS: Record<string, NoteColor> = {
  yellow: "lemon",
  purple: "lavender",
  gray: "stone",
  butter: "lemon",
  amber: "peach",
  apricot: "peach",
  rose: "coral",
  blush: "pink",
  fuchsia: "lavender",
  orchid: "lavender",
  violet: "lavender",
  periwinkle: "lavender",
  indigo: "blue",
  aqua: "sky",
  cyan: "mint",
  chartreuse: "lime",
  olive: "lime",
  sand: "lemon",
  wheat: "lemon",
  cream: "ivory",
  slate: "stone",
  fog: "stone",
};

export function noteColorHex(color: NoteColor): string {
  return NOTE_COLOR_MAP[color];
}

export function noteColorIsDark(color: NoteColor): boolean {
  return DARK_NOTE_COLORS.has(color);
}

export function normalizeNoteColor(value: unknown): NoteColor {
  if (typeof value === "string") {
    if (value in NOTE_COLOR_MAP) return value as NoteColor;
    const mapped = DEPRECATED_NOTE_COLORS[value];
    if (mapped) return mapped;
  }
  return DEFAULT_NOTE_COLOR;
}

export function noteColorLabel(color: NoteColor): string {
  return color.replace(/-/g, " ");
}
