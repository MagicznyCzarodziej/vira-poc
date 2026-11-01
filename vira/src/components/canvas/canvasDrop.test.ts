import { describe, expect, it } from "vitest";
import {
  SPAWN,
  SPAWN_DECISION,
  SPAWN_FRAME,
  SPAWN_NOTE,
  SPAWN_QUESTION,
  isCanvasCardSpawnPayload,
  isCanvasFrameSpawnPayload,
  isCanvasNoteSpawnPayload,
  isCanvasSpawnPayload,
  spawnIntentFromPayload,
  spawnPayloadForFrame,
  spawnPayloadForIntent,
  spawnPayloadForNote,
} from "./canvasSpawnPayload.ts";

describe("canvas spawn payloads", () => {
  it("maps intent to distinct drag payloads", () => {
    expect(spawnPayloadForIntent("decision")).toBe(SPAWN_DECISION);
    expect(spawnPayloadForIntent("question")).toBe(SPAWN_QUESTION);
    expect(SPAWN).toBe(SPAWN_DECISION);
  });

  it("round-trips intent from drop payload", () => {
    expect(spawnIntentFromPayload(SPAWN_DECISION)).toBe("decision");
    expect(spawnIntentFromPayload(SPAWN_QUESTION)).toBe("question");
    expect(spawnIntentFromPayload("item-1")).toBe("decision");
  });

  it("recognizes spawn payloads vs card ids", () => {
    expect(isCanvasSpawnPayload(SPAWN_DECISION)).toBe(true);
    expect(isCanvasSpawnPayload(SPAWN_QUESTION)).toBe(true);
    expect(isCanvasSpawnPayload(SPAWN_FRAME)).toBe(true);
    expect(isCanvasSpawnPayload(SPAWN_NOTE)).toBe(true);
    expect(isCanvasCardSpawnPayload(SPAWN_DECISION)).toBe(true);
    expect(isCanvasCardSpawnPayload(SPAWN_FRAME)).toBe(false);
    expect(isCanvasFrameSpawnPayload(SPAWN_FRAME)).toBe(true);
    expect(isCanvasFrameSpawnPayload(SPAWN_QUESTION)).toBe(false);
    expect(isCanvasSpawnPayload("item-3")).toBe(false);
  });

  it("maps frame spawn to drag payload", () => {
    expect(spawnPayloadForFrame()).toBe(SPAWN_FRAME);
  });

  it("maps note spawn to drag payload", () => {
    expect(spawnPayloadForNote()).toBe(SPAWN_NOTE);
    expect(isCanvasNoteSpawnPayload(SPAWN_NOTE)).toBe(true);
    expect(isCanvasCardSpawnPayload(SPAWN_NOTE)).toBe(false);
  });
});
