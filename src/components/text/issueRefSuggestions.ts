import {
  compareItemIds,
  isItemArchived,
  isRefLinkableAnswer,
  isRefLinkableStep,
  liveAnswerText,
  liveItems,
  normalizeIssueId,
  parseIssueRef,
  truncateLabel,
  type Card,
} from "../../domain/index.ts";
import { closeMenu } from "./mentionMenu.ts";

function refButton(idText: string, titleText: string, onPick: () => void) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "mention-menu-item";
  button.setAttribute("role", "option");
  const id = document.createElement("span");
  id.className = "issue-menu-id";
  id.textContent = idText;
  const title = document.createElement("span");
  title.className = "issue-menu-title";
  title.textContent = titleText;
  button.append(id, title);
  button.addEventListener("mousedown", (event) => {
    event.preventDefault();
    onPick();
    closeMenu();
  });
  return button;
}

function stepButtons(
  issueStep: RegExpMatchArray,
  items: Record<string, Card>,
  onPick: (refToken: string) => void,
): HTMLButtonElement[] {
  const itemId = normalizeIssueId(issueStep[1] ?? "") ?? `item-${issueStep[1]}`;
  const item = items[itemId];
  const answerOnly = issueStep[2] === "a";
  const query = issueStep[3] ?? "";
  if (!item || isItemArchived(item)) return [];
  return item.steps.flatMap((step, index) => {
    if (answerOnly ? !isRefLinkableAnswer(step) : !isRefLinkableStep(step)) return [];
    const stepNum = String(index + 1);
    if (query && !stepNum.startsWith(query)) return [];
    const num = item.id.replace("item-", "");
    const refToken = answerOnly ? `${item.id}/a${stepNum}` : `${item.id}/${stepNum}`;
    return [refButton(
      answerOnly ? `!${num}/a${stepNum}` : `!${num}/${stepNum}`,
      truncateLabel(answerOnly ? (liveAnswerText(step) || "(no answer)") : (step.problem || item.id), 56),
      () => onPick(refToken),
    )];
  });
}

function itemButtons(
  issue: RegExpMatchArray,
  items: Record<string, Card>,
  onPick: (refToken: string) => void,
): HTMLButtonElement[] {
  const query = issue[1] ?? "";
  const hits = liveItems(items)
    .filter((item) => {
      const num = item.id.replace(/^item-/i, "");
      const problem = item.steps[0]?.problem || "";
      return num.startsWith(query) || problem.toLowerCase().includes(query.toLowerCase());
    })
    .sort(compareItemIds)
    .slice(0, 8);
  return hits.map((item) => refButton(
    `!${item.id.replace("item-", "")}`,
    truncateLabel(item.steps[0]?.problem || item.id),
    () => onPick(item.id),
  ));
}

export type IssueRefSuggestContext = { field?: "problem" | "answer" };

/** When editing an answer, !12/2 means the decision on step 2 (same as !12/a2). */
export function normalizeRefTokenForField(refToken: string, context?: IssueRefSuggestContext): string {
  if (context?.field !== "answer") return refToken;
  const parsed = parseIssueRef(refToken);
  if (!parsed?.itemId || parsed.focusAnswer || parsed.stepIndex == null) return refToken;
  return `${parsed.itemId}/a${parsed.stepIndex + 1}`;
}

function syntheticStepMatch(cardNum: string, answerOnly: boolean, stepQuery: string): RegExpMatchArray {
  return Object.assign(["", cardNum, answerOnly ? "a" : "", stepQuery], {
    index: 0,
    input: "",
  }) as RegExpMatchArray;
}

export function issueRefButtons(
  before: string,
  items: Record<string, Card>,
  onPick: (refToken: string) => void,
  context?: IssueRefSuggestContext,
): HTMLButtonElement[] | null {
  if (context?.field === "answer") {
    const numericStep = before.match(/!(\d+)\/(\d+)$/);
    if (numericStep) {
      return stepButtons(syntheticStepMatch(numericStep[1] ?? "", true, numericStep[2] ?? ""), items, onPick);
    }
  }
  const issueStep = before.match(/!(\d+)\/(a?)(\d*)$/);
  if (issueStep) {
    if (context?.field === "answer" && issueStep[2] !== "a") {
      return stepButtons(syntheticStepMatch(issueStep[1] ?? "", true, issueStep[3] ?? ""), items, onPick);
    }
    return stepButtons(issueStep, items, onPick);
  }
  const issue = before.match(/!(\d*)$/);
  if (issue) return itemButtons(issue, items, onPick);
  return null;
}
