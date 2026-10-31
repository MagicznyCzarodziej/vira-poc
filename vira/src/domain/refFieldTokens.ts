import { parseIssueRef } from "./refSyntax.ts";

export type IssueRefSuggestContext = { field?: "problem" | "answer" };

/** When editing an answer, !12/2 means the decision on step 2 (same as !12/a2). */
export function normalizeRefTokenForField(refToken: string, context?: IssueRefSuggestContext): string {
  if (context?.field !== "answer") return refToken;
  const parsed = parseIssueRef(refToken);
  if (!parsed?.itemId || parsed.focusAnswer || parsed.stepIndex == null) return refToken;
  return `${parsed.itemId}/a${parsed.stepIndex + 1}`;
}
