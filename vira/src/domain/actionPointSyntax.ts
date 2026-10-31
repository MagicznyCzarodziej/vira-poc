/** Inline tokens: legacy `[label](!ap3)` or bare `!ap3` (preferred). */

const AP_MARKDOWN = /\[([^\]]+)\]\(!ap(\d+)\)/g;
const AP_BARE = /!ap(\d+)/g;
export const ACTION_POINT_TOKEN = /\[([^\]]+)\]\(!ap(\d+)\)|!ap(\d+)/g;

export function actionPointIdFromNum(num: number): string {
  return `ap-${num}`;
}

export function actionPointDisplayNum(id: string): string {
  return id.replace(/^ap-/i, "");
}

export function formatActionPointRef(id: string): string {
  return `!ap${actionPointDisplayNum(id)}`;
}

/** Inserts a bare AP token (label is not stored in decision text). */
export function formatActionPointMarkdown(id: string, _label = "Action"): string {
  return formatActionPointRef(id);
}

/** Normalized AP title for inline refs; width clipping is handled in CSS. */
export function actionPointRefPreviewTitle(title: string): string {
  const trimmed = title.trim();
  return trimmed || "Action";
}

export function parseActionPointIdsInTextOrdered(text: string): string[] {
  const ids: string[] = [];
  for (const match of text.matchAll(ACTION_POINT_TOKEN)) {
    const num = match[2] ?? match[3];
    if (num) ids.push(actionPointIdFromNum(Number.parseInt(num, 10)));
  }
  return ids;
}

export function parseActionPointIdsInText(text: string): string[] {
  return [...new Set(parseActionPointIdsInTextOrdered(text))];
}

export function stripActionPointRefsFromText(text: string): string {
  return text
    .replace(AP_MARKDOWN, "")
    .replace(AP_BARE, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function canonicalizeActionPointRefsInText(text: string): string {
  const withBare = text.replace(AP_MARKDOWN, (_, _label, num) => `!ap${num}`);
  return withBare.replace(/\s+/g, " ").trim();
}

/** Re-attach AP tokens after editing prose without showing refs in the textarea. */
export function mergeActionPointRefsAfterEdit(edited: string, sourceWithRefs: string): string {
  const ids = parseActionPointIdsInTextOrdered(sourceWithRefs);
  const body = stripActionPointRefsFromText(edited);
  if (ids.length === 0) return body;
  const tail = ids.map((id) => formatActionPointRef(id)).join(" ");
  return body ? `${body} ${tail}` : tail;
}
