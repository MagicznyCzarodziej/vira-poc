import { describe, expect, it } from "vitest";
import { createDocumentFromSeed } from "./seed.ts";
import {
  importFigJamStickies,
  parseCsvRows,
  parseFigJamStickyBody,
  parseFigJamStickyCsv,
  splitStickyQuestionAnswer,
} from "./figjamStickyCsv.ts";

describe("parseCsvRows", () => {
  it("parses quoted cells with commas and newlines", () => {
    expect(parseCsvRows("a,\"b,c\",\"d\ne\",f")).toEqual([["a", "b,c", "d\ne", "f"]]);
  });
});

describe("parseFigJamStickyCsv", () => {
  it("reads FigJam sticky export columns", () => {
    const csv = `Content,Created by
"Idea one",Jane Doe
"Idea two",
`;
    expect(parseFigJamStickyCsv(csv)).toEqual([
      { content: "Idea one", createdBy: "Jane Doe" },
      { content: "Idea two" },
    ]);
  });

  it("skips empty sticky bodies", () => {
    const csv = `Content,Created by
,Someone
Note three,`;
    expect(parseFigJamStickyCsv(csv)).toEqual([{ content: "Note three" }]);
  });
});

describe("splitStickyQuestionAnswer", () => {
  it("splits on the first empty line", () => {
    expect(splitStickyQuestionAnswer("Should we ship?\n\nYes, this quarter.")).toEqual({
      problem: "Should we ship?",
      answer: "Yes, this quarter.",
    });
  });

  it("keeps single-block stickies as question-only", () => {
    expect(splitStickyQuestionAnswer("Only a question")).toEqual({
      problem: "Only a question",
      answer: null,
    });
  });
});

describe("parseFigJamStickyBody", () => {
  it("parses tag line, question, blank line, and answer", () => {
    const body = "#research #q4\nShould we ship?\n\nYes, this quarter.";
    expect(parseFigJamStickyBody(body)).toEqual({
      tags: ["research", "q4"],
      problem: "Should we ship?",
      answer: "Yes, this quarter.",
    });
  });

  it("supports multiple tag-only lines", () => {
    const body = "#a #b\n#c\nQuestion only";
    expect(parseFigJamStickyBody(body)).toEqual({
      tags: ["a", "b", "c"],
      problem: "Question only",
      answer: null,
    });
  });
});

describe("importFigJamStickies", () => {
  it("creates decision cards from sticky text", () => {
    const bag = createDocumentFromSeed();
    const ids = importFigJamStickies(bag, [{ content: "Ship faster", createdBy: "Alex" }]);
    expect(ids).toHaveLength(1);
    const card = bag.items[ids[0]!];
    expect(card?.steps[0]?.problem).toBe("Ship faster");
    expect(card?.tags).toContain("alex");
  });

  it("maps text above and below the first blank line to question and answer", () => {
    const bag = createDocumentFromSeed();
    importFigJamStickies(bag, [{ content: "#backend\nWhat API?\n\nREST for now" }]);
    const card = Object.values(bag.items).find((item) => item.steps[0]?.problem === "What API?");
    expect(card?.steps[0]?.answer).toBe("REST for now");
    expect(card?.tags).toContain("backend");
  });
});
