import type { Card } from "./types.ts";
import { liveItems } from "./stepStatus.ts";
import { normalizeTagName } from "./tags.ts";

export function cardHasTag(card: Card, tag: string): boolean {
  const key = normalizeTagName(tag);
  if (!key) return false;
  return card.tags.some((entry) => normalizeTagName(entry) === key);
}

export function liveItemIdsWithTag(items: Record<string, Card>, tag: string): string[] {
  const key = normalizeTagName(tag);
  if (!key) return [];
  return liveItems(items)
    .filter((item) => cardHasTag(item, key))
    .map((item) => item.id);
}

export function itemMatchesListTagFilter(item: Card, listFilterTag: string | null): boolean {
  if (!listFilterTag) return true;
  return cardHasTag(item, listFilterTag);
}
