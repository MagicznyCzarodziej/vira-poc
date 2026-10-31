import { createCard } from "./cards.ts";
import { normalizeTagName } from "./tags.ts";
import type { DocBag } from "./types.ts";

export type FigJamStickyRow = {
  content: string;
  createdBy?: string;
};

const STICKY_HASHTAG = /#([\w][\w.-]*)/g;

function normalizeStickyLines(content: string): string[] {
  return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

/** Line contains only #tag tokens (FigJam sticky header row). */
export function isFigJamStickyTagLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return trimmed.split(/\s+/).every((part) => /^#[\w][\w.-]*$/.test(part));
}

export function parseHashtagsFromStickyLine(line: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const match of line.matchAll(STICKY_HASHTAG)) {
    const name = normalizeTagName(match[1]);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    tags.push(name);
  }
  return tags;
}

/** First blank line after tags splits question (above) from answer (below). */
export function splitStickyQuestionAnswer(content: string): { problem: string; answer: string | null } {
  const lines = normalizeStickyLines(content);
  const blankIndex = lines.findIndex((line) => line.trim() === "");
  if (blankIndex === -1) {
    return { problem: content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim(), answer: null };
  }
  const problem = lines.slice(0, blankIndex).join("\n").trim();
  const answer = lines.slice(blankIndex + 1).join("\n").trim();
  if (!problem) {
    const flat = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    return { problem: answer || flat, answer: null };
  }
  return { problem, answer: answer || null };
}

export function parseFigJamStickyBody(content: string): {
  tags: string[];
  problem: string;
  answer: string | null;
} {
  let lines = normalizeStickyLines(content);
  const tags: string[] = [];
  const seen = new Set<string>();
  while (lines.length > 0 && isFigJamStickyTagLine(lines[0]!)) {
    for (const tag of parseHashtagsFromStickyLine(lines[0]!)) {
      if (seen.has(tag)) continue;
      seen.add(tag);
      tags.push(tag);
    }
    lines.shift();
  }
  while (lines.length > 0 && lines[0]!.trim() === "") lines.shift();
  const { problem, answer } = splitStickyQuestionAnswer(lines.join("\n"));
  return { tags, problem, answer };
}

/** Minimal RFC 4180-style CSV rows (handles quoted commas and newlines). */
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const input = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]!;
    if (inQuotes) {
      if (char === "\"") {
        if (input[i + 1] === "\"") {
          cell += "\"";
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === "\"") {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i += 1;
      row.push(cell);
      cell = "";
      if (row.some((part) => part.length > 0)) rows.push(row);
      row = [];
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((part) => part.length > 0)) rows.push(row);
  return rows;
}

function headerIndex(header: string[], ...names: string[]): number {
  const normalized = header.map((cell) => cell.trim().toLowerCase());
  for (const name of names) {
    const index = normalized.indexOf(name.toLowerCase());
    if (index >= 0) return index;
  }
  return -1;
}

export function parseFigJamStickyCsv(text: string): FigJamStickyRow[] {
  const rows = parseCsvRows(text);
  if (rows.length === 0) return [];
  const header = rows[0]!.map((cell) => cell.trim());
  const contentIndex = headerIndex(header, "content", "text", "sticky", "note");
  const authorIndex = headerIndex(header, "created by", "author", "created_by");
  const hasHeader = contentIndex >= 0;
  const start = hasHeader ? 1 : 0;
  const contentCol = contentIndex >= 0 ? contentIndex : 0;
  const authorCol = authorIndex >= 0 ? authorIndex : -1;
  const stickies: FigJamStickyRow[] = [];
  for (let i = start; i < rows.length; i += 1) {
    const row = rows[i]!;
    const content = row[contentCol] ?? "";
    if (!content.trim()) continue;
    const createdBy = authorCol >= 0 ? (row[authorCol] ?? "").trim() : "";
    stickies.push({ content, createdBy: createdBy || undefined });
  }
  return stickies;
}

export function importFigJamStickies(bag: DocBag, stickies: FigJamStickyRow[]): string[] {
  const ids: string[] = [];
  for (const sticky of stickies) {
    const { tags: bodyTags, problem, answer } = parseFigJamStickyBody(sticky.content);
    const author = sticky.createdBy ? normalizeTagName(sticky.createdBy) : "";
    const tags = [...bodyTags];
    if (author && !tags.includes(author)) tags.push(author);
    const id = createCard(bag, { problem, answer, tags });
    if (id) ids.push(id);
  }
  return ids;
}
