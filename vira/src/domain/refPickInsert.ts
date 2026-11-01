/** When linking selected text, also drop a leftover `!` trigger immediately after the selection. */
export function expandRefPickEnd(snapshot: string, start: number, end: number): number {
  const tail = snapshot.slice(end);
  const extra = tail.match(/^\s!/)?.[0];
  return extra ? end + extra.length : end;
}
