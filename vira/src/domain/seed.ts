import { createCard, type StepInput } from "./cards.ts";
import { wireSeedFixture } from "./seedFixture.ts";
import type { DocBag, SavedDocument } from "./types.ts";

function emptyBag(): DocBag {
  return { nextId: 1, nextCanvasPlacementId: 1, items: {}, canvasPlacements: {} };
}

export function buildSeedBag(): DocBag {
  const bag = emptyBag();
  const refNum = (id: string) => id.replace(/^item-/i, "");

  const archId = createCard(bag, {
    tags: ["allegro", "architecture"],
    steps: [
      {
        problem: "One shared list per household or separate lists per member on Allegro? @Ania",
        answer: "One household list by default; optional personal lists in settings. @Marek to align with account model.",
        decidedAt: "2026-10-28T14:30:00.000Z",
      },
      {
        problem: "How do list sync and cart checkout stay consistent when we split services? (API link wired after seed.)",
        answer: null,
      },
    ],
  });
  createCard(bag, {
    tags: ["allegro", "product"],
    steps: [{ problem: "Do collaborators see list changes in real time without refreshing?", answer: null }],
  });
  createCard(bag, {
    tags: ["allegro", "ux"],
    steps: [
      {
        problem: "First-time users: empty list or a sample “Weekly groceries” template?",
        answer: "Sample template with 5 generic items they can clear in one tap.",
        decidedAt: "2026-10-25T09:15:00.000Z",
      },
      {
        problem: "Show the collaborative list onboarding coach again after dismiss?",
        answer: "Only from Help → “Shared lists”, not on every app open.",
        decidedAt: "2026-10-26T16:45:00.000Z",
      },
    ],
  });
  createCard(bag, {
    tags: ["allegro", "security"],
    steps: [
      {
        problem: "How do we invite someone to a shared Allegro shopping list?",
        answer: "Deep link + in-app invite; must be logged into Allegro to accept.",
        decidedAt: "2026-10-22T11:00:00.000Z",
      },
      { problem: "Can a list owner remove a member without their consent?", answer: null },
    ],
  });
  const apiId = createCard(bag, {
    tags: ["allegro", "api"],
    steps: [
      {
        problem: "Version the Shopping List API under /v1 or negotiate via Accept-Version header?",
        answer: "Path prefix /v1/lists; breaking changes only in /v2 with 12-month sunset.",
        decidedAt: "2026-10-20T13:20:00.000Z",
      },
    ],
  });
  createCard(bag, {
    tags: ["allegro", "infra"],
    steps: [
      {
        problem: "Store list state in existing Allegro Postgres or a dedicated service DB?",
        answer: "Dedicated list service DB; cart stays on commerce core.",
        decidedAt: "2026-10-18T10:00:00.000Z",
      },
      {
        problem: "RPO / RTO if a shared list is unavailable during peak shopping?",
        answer: "RPO 15m, RTO 1h; read-only cached list on mobile if sync is down.",
        decidedAt: "2026-10-19T15:30:00.000Z",
      },
    ],
  });
  createCard(bag, {
    tags: ["allegro", "design"],
    steps: [{ problem: "Show “checked off” items struck through or move them to a done section?", answer: null }],
  });
  createCard(bag, {
    tags: ["allegro", "mobile"],
    steps: [{ problem: "Ship collaborative lists on iOS and Android in the same sprint?", answer: null }],
  });
  createCard(bag, {
    tags: ["allegro", "legal"],
    steps: [
      {
        problem: "Do shared lists need explicit consent under GDPR when adding a co-shopper?",
        answer: "Yes — invitee accepts visibility of nickname and list activity; privacy policy updated.",
        decidedAt: "2026-10-15T08:00:00.000Z",
      },
    ],
  });
  createCard(bag, {
    tags: ["allegro", "notifications"],
    steps: [
      {
        problem: "Push when someone adds an item to our shared list — beta scope?",
        answer: "Yes; one push per batch (max 1 / 15 min per list) to avoid spam.",
        decidedAt: "2026-10-27T18:00:00.000Z",
      },
      { problem: "Also notify when a list item is linked to a purchased offer?", answer: null },
    ],
  });

  if (archId && apiId) {
    const step = bag.items[archId]?.steps[1];
    if (step) {
      step.problem = `How do list sync and checkout stay consistent when we split? See [List API versioning](!${refNum(apiId)}).`;
      const head = step.problemRevisions.find((entry) => entry.rev === step.problemRev);
      if (head) head.text = step.problem;
    }
  }

  const rolloutId = createCard(bag, {
    tags: ["allegro", "rollout"],
    steps: [
      {
        problem: "Who gets the collaborative shopping list beta on Allegro?",
        answer: "Allegro Smart households in PL only — invite from account settings, no store banner yet.",
        decidedAt: "2026-10-10T09:00:00.000Z",
      },
      {
        problem: "What counts as beta success for shared lists?",
        answer: "10k active shared lists with ≥2 members, weekly add-to-cart from a list item at least once per list.",
        decidedAt: "2026-10-11T11:30:00.000Z",
      },
      {
        problem: "Is Allegro Smart required during the shared-list beta?",
        answer: "Free until general availability; Smart not required to join a shared list during beta.",
        decidedAt: "2026-10-12T14:00:00.000Z",
      },
      { problem: "When do we enable list sharing for all Allegro accounts in PL?", answer: null },
    ] satisfies StepInput[],
  });

  wireSeedFixture(bag, { apiId, rolloutId });

  return bag;
}

export function createDocumentFromSeed(): SavedDocument {
  const bag = buildSeedBag();
  return {
    version: 1,
    nextId: bag.nextId,
    nextActionPointId: 1,
    items: bag.items,
    actionPoints: {},
    actionPointPlacements: {},
    nextFrameId: 1,
    frames: {},
    framePlacements: {},
    viewMode: "list",
    showAllDates: false,
    listFilterNotOnCanvas: false,
    nextCanvasPlacementId: bag.nextCanvasPlacementId,
    canvasPlacements: {},
    canvasViewport: { scrollLeft: 0, scrollTop: 0, zoom: 1 },
    canvasViewportUserSet: false,
  };
}
