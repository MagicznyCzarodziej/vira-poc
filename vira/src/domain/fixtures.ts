import { createCard, placeNewCardAtWorld } from "./cards.ts";
import { WORLD_H, WORLD_W } from "./constants.ts";
import type { DocBag } from "./types.ts";

export function addRandomCards(bag: DocBag): void {
  const refNum = (id: string) => id.replace(/^item-/i, "");
  const cx = Math.round(WORLD_W / 2);
  const cy = Math.round(WORLD_H / 2);

  const apiId = createCard(bag, {
    tags: ["fixtures", "api"],
    steps: [{
      problem: "Version the shared List API under /v1 or negotiate via Accept-Version?",
      answer: "Path prefix /v1/lists; breaking changes only in /v2 with a 12-month sunset.",
      decidedAt: new Date().toISOString(),
    }],
  });
  const privacyId = createCard(bag, {
    tags: ["fixtures", "privacy"],
    steps: [{
      problem: "Do shared lists need explicit GDPR consent when adding a co-shopper?",
      answer: "Yes — invitee accepts visibility of nickname and list activity before joining.",
      decidedAt: new Date().toISOString(),
    }],
  });
  const notifId = createCard(bag, {
    tags: ["fixtures", "notifications"],
    steps: [
      {
        problem: "Push when someone adds an item to a shared list — include in beta?",
        answer: "Yes; batch pushes to at most one notification per list every 15 minutes.",
        decidedAt: new Date().toISOString(),
      },
      { problem: "Also notify when a list item is linked to a purchased offer?", answer: null },
    ],
  });
  const mobileId = createCard(bag, {
    tags: ["fixtures", "mobile"],
    steps: [{ problem: "Ship collaborative lists on iOS and Android in the same sprint?", answer: null }],
  });
  createCard(bag, {
    tags: ["fixtures", "ux"],
    steps: [{ problem: "Show checked-off items struck through or move them to a done section?", answer: null }],
  });
  const syncId = createCard(bag, {
    tags: ["fixtures", "api"],
    steps: [
      {
        problem: "Do collaborators see list changes in real time without refreshing?",
        answer: "Websocket fan-out with offline queue; polling fallback after 30s disconnect.",
        decidedAt: new Date().toISOString(),
      },
      { problem: "How do list sync and checkout stay consistent when services split?", answer: null },
    ],
  });
  const rolloutId = createCard(bag, {
    tags: ["fixtures", "rollout"],
    steps: [
      {
        problem: "Who gets the collaborative shopping list beta first?",
        answer: "Smart households in PL — invite from account settings only.",
        decidedAt: new Date().toISOString(),
      },
      {
        problem: "What counts as beta success for shared lists?",
        answer: "10k active shared lists with ≥2 members and weekly add-to-cart from a list item.",
        decidedAt: new Date().toISOString(),
      },
      {
        problem: "Is Smart required during the shared-list beta?",
        answer: "Free until GA; Smart not required to join during beta.",
        decidedAt: new Date().toISOString(),
      },
      { problem: "When do we enable list sharing for all accounts in PL?", answer: null },
    ],
  });

  if (!apiId || !privacyId || !notifId || !mobileId || !syncId || !rolloutId) return;
  const nApi = refNum(apiId);
  const nPrivacy = refNum(privacyId);
  const nNotif = refNum(notifId);
  const nRollout = refNum(rolloutId);
  const nSync = refNum(syncId);

  const syncStep = bag.items[syncId]?.steps[1];
  if (syncStep) {
    syncStep.problem = `How do list sync and checkout stay consistent when we split services? See [List API versioning](!${nApi}).`;
    const head = syncStep.problemRevisions.find((entry) => entry.rev === syncStep.problemRev);
    if (head) head.text = syncStep.problem;
  }
  const mobileStep = bag.items[mobileId]?.steps[0];
  if (mobileStep) {
    mobileStep.problem = `Ship collaborative lists on iOS and Android in the same sprint? Invite flow must follow !${nPrivacy}.`;
    const head = mobileStep.problemRevisions.find((entry) => entry.rev === mobileStep.problemRev);
    if (head) head.text = mobileStep.problem;
  }
  const notifStep = bag.items[notifId]?.steps[1];
  if (notifStep) {
    notifStep.problem = `Notify when a list item links to a purchased offer? Depends on rollout scope in !${nRollout}/2.`;
    const head = notifStep.problemRevisions.find((entry) => entry.rev === notifStep.problemRev);
    if (head) head.text = notifStep.problem;
  }
  const rolloutStep = bag.items[rolloutId]?.steps[3];
  if (rolloutStep) {
    rolloutStep.problem = `When do we enable list sharing for all accounts in PL? Blocked until !${nSync}/2 and push policy !${nNotif} are settled.`;
    const head = rolloutStep.problemRevisions.find((entry) => entry.rev === rolloutStep.problemRev);
    if (head) head.text = rolloutStep.problem;
  }

  const hubId = createCard(bag, {
    tags: ["fixtures", "graph"],
    steps: [{
      problem: "Fixture hub: cross-links for canvas ref-line testing.",
      answer: `Rollout: [beta scope](!${nRollout}). API: [!${nApi}](!${nApi}). Sync: !${nSync}/2. Notifications: !${nNotif}/a1. Privacy: !${nPrivacy}.`,
      decidedAt: new Date().toISOString(),
    }],
  });

  if (apiId) placeNewCardAtWorld(bag, apiId, cx - 540, cy - 40);
  if (syncId) placeNewCardAtWorld(bag, syncId, cx + 160, cy - 60);
  if (rolloutId) placeNewCardAtWorld(bag, rolloutId, cx - 220, cy - 340);
  if (notifId) placeNewCardAtWorld(bag, notifId, cx + 200, cy + 220);
  if (hubId) placeNewCardAtWorld(bag, hubId, cx - 240, cy + 300);
  if (mobileId) placeNewCardAtWorld(bag, mobileId, cx + 480, cy + 40);
}
