import type { ReactNode } from "react";
import { ActionPointRefStack } from "./ActionPointRefStack.tsx";
import {
  actionPointIdFromNum,
  cardNumber,
  formatIssueRefDisplay,
  formatIssueRefToken,
  issueRefExists,
  issueRefPartsToToken,
  issueRefStaleReason,
  parseIssueRef,
  stripActionPointRefsFromText,
  type Card,
  type IssueRef,
  type StaleReason,
} from "../../domain/index.ts";
import { useDocument } from "../../store/index.ts";
import { collapseActionPointRuns, type RichTextActionPointPiece } from "./richTextPieces.ts";

type Piece =
  | { kind: "text"; text: string }
  | { kind: "ref"; token: string; label?: string; raw: string }
  | { kind: "mention"; name: string }
  | { kind: "actionPoint"; id: string; label?: string; raw: string };

const ISSUE_TOKEN =
  /\[([^\]]+)\]\(!(\d+)(?:\/(\d+)|\/a(\d+))?(?:@v(\d+))?\)|!(\d+)(?:\/(\d+)|\/a(\d+))?(?:@v(\d+))?|@(?!v\d+)([\w.-]+)/g;

const ACTION_POINT_TOKEN = /\[([^\]]+)\]\(!ap(\d+)\)|!ap(\d+)/g;

function issueRefPieces(text: string): Piece[] {
  const out: Piece[] = [];
  let cursor = 0;
  for (const match of text.matchAll(ISSUE_TOKEN)) {
    const index = match.index ?? 0;
    if (index > cursor) out.push({ kind: "text", text: text.slice(cursor, index) });
    if (match[10]) out.push({ kind: "mention", name: match[10] });
    else if (match[1] != null && match[2]) {
      out.push({
        kind: "ref",
        token: issueRefPartsToToken(match[2], match[3], match[4], match[5]),
        label: match[1],
        raw: match[0],
      });
    } else if (match[6]) {
      out.push({
        kind: "ref",
        token: issueRefPartsToToken(match[6], match[7], match[8], match[9]),
        raw: match[0],
      });
    }
    cursor = index + match[0].length;
  }
  if (cursor < text.length) out.push({ kind: "text", text: text.slice(cursor) });
  return out;
}

function pieces(text: string): Piece[] {
  const out: Piece[] = [];
  let cursor = 0;
  for (const match of text.matchAll(ACTION_POINT_TOKEN)) {
    const index = match.index ?? 0;
    if (index > cursor) out.push(...issueRefPieces(text.slice(cursor, index)));
    const num = match[2] ?? match[3];
    if (num) {
      out.push({
        kind: "actionPoint",
        id: actionPointIdFromNum(Number.parseInt(num, 10)),
        label: match[1],
        raw: match[0],
      });
    }
    cursor = index + match[0].length;
  }
  if (cursor < text.length) out.push(...issueRefPieces(text.slice(cursor)));
  return out;
}

function refButton(items: Record<string, Card>, parsed: IssueRef, label: string | undefined, key: number) {
  const exists = issueRefExists(items, parsed);
  const reason: StaleReason | null = issueRefStaleReason(items, parsed);
  const stale = reason != null;
  const hasLabel = label != null && label !== "";
  const num = cardNumber(parsed.itemId);
  const stepHint = parsed.stepIndex != null
    ? (parsed.focusAnswer ? `, answer ${parsed.stepIndex + 1}` : `, step ${parsed.stepIndex + 1}`)
    : "";
  const staleHint = !stale ? "" : reason === "revision" ? ", outdated revision" : ", archived";
  const title = !stale
    ? undefined
    : reason === "revision"
      ? "Outdated link — click to open panel, or Shift+click to update"
      : "Archived — click to view full history in panel";
  const className = `${hasLabel ? "issue-ref issue-ref-link" : "issue-ref"}${exists ? "" : " issue-ref-missing"}${stale ? " issue-ref-stale" : ""}`;
  return (
    <button
      key={key}
      type="button"
      className={className}
      data-action="goto-issue"
      data-issue-ref={formatIssueRefToken(parsed)}
      aria-label={`Go to decision !${num}${stepHint}${staleHint}`}
      title={title}
    >
      {hasLabel ? label : formatIssueRefDisplay(parsed)}
    </button>
  );
}

function actionPointRunStack(
  items: RichTextActionPointPiece[],
  key: number,
  allowUnlink: boolean,
) {
  const labels = Object.fromEntries(items.map((item) => [item.id, item.label]));
  return (
    <ActionPointRefStack
      key={`ap-run-${key}`}
      refIds={items.map((item) => item.id)}
      labels={labels}
      allowUnlink={allowUnlink}
    />
  );
}

function piecesWithActionPointRefs(prose: string, actionPointRefIds: string[]): Piece[] {
  const base = pieces(prose);
  if (!actionPointRefIds.length) return base;
  const apPieces: Piece[] = actionPointRefIds.map((id) => ({
    kind: "actionPoint",
    id,
    raw: "",
  }));
  return [...base, ...apPieces];
}

export function RichText({
  text,
  actionPointRefIds = [],
  allowActionPointUnlink = false,
}: {
  text: string;
  actionPointRefIds?: string[];
  allowActionPointUnlink?: boolean;
}) {
  const items = useDocument((state) => state.items);
  const prose = stripActionPointRefsFromText(text);
  if (!prose && actionPointRefIds.length === 0) return null;
  const nodes: ReactNode[] = [];
  collapseActionPointRuns(piecesWithActionPointRefs(prose, actionPointRefIds)).forEach((piece, index) => {
    if (piece.kind === "text") {
      nodes.push(piece.text);
      return;
    }
    if (piece.kind === "mention") {
      nodes.push(
        <span className="mention" key={index}>
          @{piece.name}
        </span>,
      );
      return;
    }
    if (piece.kind === "actionPointRun") {
      nodes.push(actionPointRunStack(piece.items, index, allowActionPointUnlink));
      return;
    }
    const parsed = parseIssueRef(piece.token);
    if (!parsed) {
      nodes.push(piece.raw);
      return;
    }
    nodes.push(refButton(items, parsed, piece.label, index));
  });
  return <>{nodes}</>;
}
