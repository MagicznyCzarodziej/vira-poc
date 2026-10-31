export type RichTextActionPointPiece = {
  kind: "actionPoint";
  id: string;
  label?: string;
  raw: string;
};

export type RichTextActionPointRun = {
  kind: "actionPointRun";
  items: RichTextActionPointPiece[];
};

export function isRichTextWhitespace(piece: { kind: string; text?: string }): boolean {
  return piece.kind === "text" && /^\s*$/.test(piece.text ?? "");
}

/** Groups adjacent AP tokens (ignoring whitespace between) for tight stacked layout. */
export function collapseActionPointRuns<T extends { kind: string }>(
  src: readonly T[],
): Array<T | RichTextActionPointRun> {
  const out: Array<T | RichTextActionPointRun> = [];
  let i = 0;
  while (i < src.length) {
    const piece = src[i]!;
    if (piece.kind !== "actionPoint") {
      out.push(piece);
      i += 1;
      continue;
    }
    const items: RichTextActionPointPiece[] = [];
    while (i < src.length) {
      const current = src[i]!;
      if (current.kind === "actionPoint") {
        items.push(current as RichTextActionPointPiece);
        i += 1;
        continue;
      }
      if (isRichTextWhitespace(current)) {
        i += 1;
        continue;
      }
      break;
    }
    out.push({ kind: "actionPointRun", items });
  }
  return out;
}

export function actionPointRefVisible(
  actionPoints: Record<string, { done: boolean } | undefined>,
  id: string,
): boolean {
  const ap = actionPoints[id];
  return !ap?.done;
}
