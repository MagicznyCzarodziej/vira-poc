export type DecisionActionPointRefContext = { itemId: string; stepIndex: number };

/** Which decision step owns an inline action ref chip (from answer block DOM). */
export function decisionActionPointRefContext(button: HTMLElement): DecisionActionPointRefContext | null {
  const answerBlock = button.closest<HTMLElement>(".answer-block");
  if (!answerBlock) return null;
  const itemId = answerBlock.dataset.id ?? answerBlock.closest<HTMLElement>(".card")?.dataset.id;
  const stepRaw = answerBlock.dataset.step;
  if (!itemId || stepRaw == null) return null;
  const stepIndex = Number.parseInt(stepRaw, 10);
  if (!Number.isFinite(stepIndex)) return null;
  return { itemId, stepIndex };
}
