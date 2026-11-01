/** True when the pointer is on an embedded decision reference control (not plain text). */
export function isIssueRefHoverTarget(target: Element | null): boolean {
  return !!target?.closest("[data-action='goto-issue']");
}

/** Whether hovering `target` should highlight the answer block edit affordance. */
export function shouldHighlightAnswerBlockOnHover(target: Element | null): boolean {
  if (!target?.closest(".answer-text.editable")) return false;
  if (isIssueRefHoverTarget(target)) return false;
  return true;
}

/** Whether hovering `target` should highlight the problem row edit affordance. */
export function shouldHighlightProblemOnHover(target: Element | null): boolean {
  if (!target?.closest(".problem.editable")) return false;
  if (isIssueRefHoverTarget(target)) return false;
  return true;
}
