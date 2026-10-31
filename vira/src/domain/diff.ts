export type DiffOp = { type: "equal" | "insert" | "delete"; text: string };

export function tokenizeDiff(text: string | null | undefined): string[] {
  return String(text ?? "").match(/\S+|\s+/g) || [];
}

export function diffWordsOps(oldText: string, newText: string): DiffOp[] {
  const a = tokenizeDiff(oldText);
  const b = tokenizeDiff(newText);
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const row = dp[i];
      const prev = dp[i - 1];
      if (!row || !prev) continue;
      row[j] = a[i - 1] === b[j - 1]
        ? (prev[j - 1] ?? 0) + 1
        : Math.max(prev[j] ?? 0, row[j - 1] ?? 0);
    }
  }
  const ops: DiffOp[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      ops.unshift({ type: "equal", text: a[i - 1] ?? "" });
      i -= 1;
      j -= 1;
    } else if (j > 0 && (i === 0 || (dp[i]?.[j - 1] ?? 0) >= (dp[i - 1]?.[j] ?? 0))) {
      ops.unshift({ type: "insert", text: b[j - 1] ?? "" });
      j -= 1;
    } else {
      ops.unshift({ type: "delete", text: a[i - 1] ?? "" });
      i -= 1;
    }
  }
  return ops;
}
