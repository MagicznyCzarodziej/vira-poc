import { createCard } from "./cards.ts";
import type { DocBag } from "./types.ts";

export function wireSeedFixture(
  bag: DocBag,
  ids: { apiId: string | null; rolloutId: string | null },
): void {
  const { apiId, rolloutId } = ids;
  if (rolloutId) {
    const charge = bag.items[rolloutId]?.steps[2];
    if (charge) {
      charge.answerRevisions = [
        { rev: 1, text: "Smart required; shared lists are a Smart-only perk.", at: "2026-10-12T10:00:00.000Z", tentative: false },
        { rev: 2, text: "Free for 90 days, then Smart required to create new shared lists.", at: "2026-10-12T12:00:00.000Z", tentative: false },
        { rev: 3, text: "Free until general availability; Smart not required to join a shared list during beta.", at: "2026-10-12T14:00:00.000Z", tentative: false },
      ];
      charge.answerRev = 3;
      charge.answer = charge.answerRevisions[2]?.text ?? charge.answer;
      charge.decidedAt = charge.answerRevisions[2]?.at ?? charge.decidedAt;
    }
  }

  if (apiId && rolloutId) {
    const refNum = (id: string) => id.replace(/^item-/i, "");
    const nApi = refNum(apiId);
    const nRollout = refNum(rolloutId);
    createCard(bag, {
      tags: ["allegro", "fixtures"],
      steps: [
        {
          problem: "Fixture: !refs and answer revisions for Allegro shared shopping lists.",
          answer: `Topic [list beta rollout](!${nRollout}). Pinned [90-day Smart trial](!${nRollout}/a3@v2). Latest [no Smart in beta](!${nRollout}/a3@v3). API: [!${nApi}](!${nApi}).`,
          decidedAt: "2026-10-31T00:00:00.000Z",
        },
      ],
    });
  }
}
