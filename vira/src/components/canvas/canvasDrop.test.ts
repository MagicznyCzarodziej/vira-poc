import { describe, expect, it } from "vitest";
import {
  SPAWN,
  SPAWN_DECISION,
  SPAWN_QUESTION,
  isCanvasSpawnPayload,
  spawnIntentFromPayload,
  spawnPayloadForIntent,
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
    expect(isCanvasSpawnPayload("item-3")).toBe(false);
  });
});
