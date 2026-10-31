import { TAG_PALETTE } from "./constants.ts";
import type { Card } from "./types.ts";

export function normalizeTagName(name: string | null | undefined): string {
  return String(name ?? "").trim().toLowerCase();
}

export function parseTags(raw: string | null | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of String(raw ?? "").split(",")) {
    const name = normalizeTagName(part);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

export function normalizeTagsList(tags: unknown): string[] {
  if (!Array.isArray(tags)) return parseTags(String(tags ?? ""));
  return parseTags(tags.join(","));
}

export function tagColorIndex(name: string): number {
  let hash = 0;
  const key = name.toLowerCase();
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % TAG_PALETTE.length;
}

export function tagStyle(name: string): { background: string; color: string } {
  const color = TAG_PALETTE[tagColorIndex(name)] ?? TAG_PALETTE[0];
  return { background: color.bg, color: color.text };
}

export function allKnownTags(items: Record<string, Card>): string[] {
  const set = new Set<string>();
  for (const item of Object.values(items)) {
    for (const tag of item.tags) set.add(tag);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

const MENTION_NAME_PATTERN = /@(?!v\d+)([\w.-]+)/g;

export function mentionNamesInText(text: string | null | undefined): string[] {
  if (!text) return [];
  const names: string[] = [];
  const re = new RegExp(MENTION_NAME_PATTERN.source, "g");
  let match = re.exec(text);
  while (match) {
    const name = match[1]?.trim();
    if (name) names.push(name);
    match = re.exec(text);
  }
  return names;
}

export function allKnownMentions(items: Record<string, Card>, drafts: string[] = []): string[] {
  const set = new Set<string>();
  const addText = (text: string | null | undefined) => {
    for (const name of mentionNamesInText(text)) set.add(name);
  };
  for (const item of Object.values(items)) {
    for (const step of item.steps) {
      addText(step.problem);
      addText(step.answer);
      for (const entry of step.problemRevisions) addText(entry.text);
      for (const entry of step.answerRevisions) addText(entry.text);
    }
  }
  for (const draft of drafts) addText(draft);
  return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}
