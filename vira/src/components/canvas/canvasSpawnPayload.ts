import type { ComposerIntent } from "../../store/documentTypes.ts";

export const SPAWN_DECISION = "__canvas_new_card__";
export const SPAWN_QUESTION = "__canvas_new_card_question__";
/** @deprecated use spawnPayloadForIntent */
export const SPAWN = SPAWN_DECISION;

export function spawnPayloadForIntent(intent: ComposerIntent): string {
  return intent === "question" ? SPAWN_QUESTION : SPAWN_DECISION;
}

export function spawnIntentFromPayload(payload: string): ComposerIntent {
  return payload === SPAWN_QUESTION ? "question" : "decision";
}

export function isCanvasSpawnPayload(payload: string): boolean {
  return payload === SPAWN_DECISION || payload === SPAWN_QUESTION;
}
