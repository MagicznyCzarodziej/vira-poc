import {
  cardNumber,
  compareItemIds,
  getProblemText,
  isRefLinkableAnswer,
  isRefLinkableStep,
  liveAnswerText,
  liveItems,
  type Card,
} from "../../domain/index.ts";

export type RefLinkKind = "all" | "answer" | "question" | "card";

export type RefLinkRow = {
  token: string;
  kind: "card" | "question" | "answer";
  idLabel: string;
  question: string;
  answer: string | null;
};

export type RefLinkGroup = {
  id: string;
  num: string;
  editing: boolean;
  tags: string[];
  rows: RefLinkRow[];
};

function matchesQuery(haystack: string, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const hay = haystack.toLowerCase();
  return terms.every((term) => hay.includes(term));
}

export function refLinkRows(
  items: Record<string, Card>,
  query: string,
  kind: RefLinkKind,
  tags: string[],
  editingId?: string,
): RefLinkGroup[] {
  const q = query.trim();
  const sorted = liveItems(items).slice().sort((a, b) => {
    if (editingId) {
      if (a.id === editingId && b.id !== editingId) return -1;
      if (b.id === editingId && a.id !== editingId) return 1;
    }
    return compareItemIds(a, b);
  });
  const groups: RefLinkGroup[] = [];
  for (const item of sorted) {
    if (tags.length && !tags.every((tag) => item.tags.includes(tag))) continue;
    const num = cardNumber(item.id);
    const rows: RefLinkRow[] = [];
    const first = item.steps[0] ? getProblemText(item.steps[0]) : "";
    if ((kind === "all" || kind === "card") && matchesQuery(`!${num} ${item.tags.join(" ")} ${first}`, q)) {
      rows.push({
        token: item.id,
        kind: "card",
        idLabel: `!${num}`,
        question: first,
        answer: item.steps.length === 1 && item.steps[0] ? liveAnswerText(item.steps[0]) : null,
      });
    }
    item.steps.forEach((step, index) => {
      if (!isRefLinkableStep(step)) return;
      const stepNum = index + 1;
      const problem = getProblemText(step);
      const answer = liveAnswerText(step);
      const hay = `!${num} ${item.tags.join(" ")} ${problem} ${answer || ""}`;
      if ((kind === "all" || kind === "question") && matchesQuery(hay, q)) {
        rows.push({
          token: `${item.id}/${stepNum}`,
          kind: "question",
          idLabel: `!${num}/${stepNum}`,
          question: problem,
          answer: null,
        });
      }
      if (isRefLinkableAnswer(step) && (kind === "all" || kind === "answer") && matchesQuery(`!${num}/a${stepNum} ${answer} ${problem}`, q)) {
        rows.push({
          token: `${item.id}/a${stepNum}`,
          kind: "answer",
          idLabel: `!${num}/a${stepNum}`,
          question: problem,
          answer,
        });
      }
    });
    if (rows.length) {
      groups.push({ id: item.id, num, editing: item.id === editingId, tags: item.tags, rows });
    }
  }
  return groups;
}
