import { describe, expect, it } from "vitest";
import { allKnownMentions } from "./tags.ts";
import type { Card } from "./types.ts";

describe("allKnownMentions", () => {
  it("includes @names from action point titles", () => {
    const items: Record<string, Card> = {};
    expect(allKnownMentions(items, [], ["Ping @design for review"])).toEqual(["design"]);
  });
});
