import { describe, expect, it } from "vitest";
import {
  applyIssueRefRevisionUpgrade,
  findIssueRefTextHost,
  issueRefUpgradeHeadRev,
} from "./issueRefHost.ts";
import { parseIssueRef } from "./refs.ts";
import { normalizeStep } from "./steps.ts";
import type { Card, Note } from "./types.ts";

describe("issueRefHost", () => {
  it("finds a stale ref inside a note body", () => {
    const parsed = parseIssueRef("!1/a1@v1")!;
    const items: Record<string, Card> = {
      "item-1": {
        id: "item-1",
        tags: [],
        archivedAt: null,
        steps: [
          normalizeStep({
            problem: "Q",
            answer: "current",
            answerRev: 2,
            answerRevisions: [{ rev: 2, text: "current", at: "2026-01-01T00:00:00.000Z" }],
          }),
        ],
      },
    };
    const notes: Record<string, Note> = {
      "note-1": { id: "note-1", body: "See !1/a1@v1 here", color: "white", createdAt: "" },
    };
    const host = findIssueRefTextHost(items, notes, {}, parsed);
    expect(host).toEqual({ kind: "note", noteId: "note-1" });
  });

  it("upgrades pinned revision text in a note", () => {
    const parsed = parseIssueRef("!1/a1@v1")!;
    const items: Record<string, Card> = {
      "item-1": {
        id: "item-1",
        tags: [],
        archivedAt: null,
        steps: [
          normalizeStep({
            problem: "Q",
            answer: "current",
            answerRev: 2,
            answerRevisions: [{ rev: 2, text: "current", at: "2026-01-01T00:00:00.000Z" }],
          }),
        ],
      },
    };
    const notes: Record<string, Note> = {
      "note-1": { id: "note-1", body: "See !1/a1@v1", color: "white", createdAt: "" },
    };
    const host = { kind: "note" as const, noteId: "note-1" };
    const head = issueRefUpgradeHeadRev(items, parsed);
    expect(head).toBe(2);
    const applied = applyIssueRefRevisionUpgrade(host, items, notes, {}, parsed, head!);
    expect(applied?.text).toContain("@v2");
    expect(applied?.text).not.toContain("@v1");
  });
});
