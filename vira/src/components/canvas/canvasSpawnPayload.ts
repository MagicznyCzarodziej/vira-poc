import type { ComposerIntent } from "../../store/documentTypes.ts";

export const SPAWN_DECISION = "__canvas_new_card__";
export const SPAWN_QUESTION = "__canvas_new_card_question__";
export const SPAWN_FRAME = "__canvas_new_frame__";
export const SPAWN_NOTE = "__canvas_new_note__";
/** @deprecated use spawnPayloadForIntent */
export const SPAWN = SPAWN_DECISION;

export function spawnPayloadForIntent(intent: ComposerIntent): string {
  return intent === "question" ? SPAWN_QUESTION : SPAWN_DECISION;
}

export function spawnPayloadForFrame(): string {
  return SPAWN_FRAME;
}

export function spawnPayloadForNote(): string {
  return SPAWN_NOTE;
}

export function spawnIntentFromPayload(payload: string): ComposerIntent {
  return payload === SPAWN_QUESTION ? "question" : "decision";
}

export function isCanvasCardSpawnPayload(payload: string): boolean {
  return payload === SPAWN_DECISION || payload === SPAWN_QUESTION;
}

export function isCanvasFrameSpawnPayload(payload: string): boolean {
  return payload === SPAWN_FRAME;
}

export function isCanvasNoteSpawnPayload(payload: string): boolean {
  return payload === SPAWN_NOTE;
}

export function isCanvasSpawnPayload(payload: string): boolean {
  return isCanvasCardSpawnPayload(payload) || isCanvasFrameSpawnPayload(payload) || isCanvasNoteSpawnPayload(payload);
}
