// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  resetRefPickSessionForTests,
  suppressRefPickAfterInsert,
} from "./refPickSession.ts";

describe("suppressRefPickAfterInsert", () => {
  beforeEach(() => {
    resetRefPickSessionForTests();
    document.body.classList.remove("ref-pick-active");
  });

  it("removes ref-pick-active from body (menu pick uses onValue and skips input sync)", () => {
    document.body.classList.add("ref-pick-active");
    suppressRefPickAfterInsert();
    expect(document.body.classList.contains("ref-pick-active")).toBe(false);
  });
});
