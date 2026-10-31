import {
  actionPointDisplayNum,
  actionPointRefPreviewTitle,
} from "../../domain/index.ts";
import { useDocument } from "../../store/index.ts";
import { IconUnlink } from "../Icons.tsx";
import { actionPointRefVisible } from "./richTextPieces.ts";

function ActionPointRefRow({
  id,
  label,
  allowUnlink,
}: {
  id: string;
  label?: string;
  allowUnlink: boolean;
}) {
  const ap = useDocument((state) => state.actionPoints[id]);
  const num = actionPointDisplayNum(id);
  const fullTitle = ap?.title ?? label?.trim() ?? `Action ${num}`;
  const display = actionPointRefPreviewTitle(fullTitle);
  const missing = !ap;
  const chipClass = `action-point-ref${missing ? " action-point-ref--missing" : ""}${allowUnlink ? " action-point-ref--with-unlink" : ""}`;

  if (!allowUnlink) {
    return (
      <button
        type="button"
        className={chipClass}
        data-action="goto-action-point"
        data-action-point-id={id}
        aria-label={`Go to action ${num}`}
        title={fullTitle}
      >
        {display}
      </button>
    );
  }

  return (
    <div className={chipClass}>
      <button
        type="button"
        className="action-point-ref-label"
        data-action="goto-action-point"
        data-action-point-id={id}
        aria-label={`Go to action ${num}`}
        title={fullTitle}
      >
        {display}
      </button>
      <button
        type="button"
        className="action-point-ref-unlink"
        data-action="unlink-action-point"
        data-action-point-id={id}
        aria-label={`Remove link to action ${num}`}
        title="Remove link from this decision"
      >
        <IconUnlink />
      </button>
    </div>
  );
}

export function ActionPointRefStack({
  refIds,
  labels,
  allowUnlink = false,
}: {
  refIds: string[];
  labels?: Record<string, string | undefined>;
  allowUnlink?: boolean;
}) {
  const actionPoints = useDocument((state) => state.actionPoints);
  const open = refIds.filter((id) => actionPointRefVisible(actionPoints, id));
  if (open.length === 0) return null;
  return (
    <div className="action-point-ref-stack">
      {open.map((id) => (
        <ActionPointRefRow key={id} id={id} label={labels?.[id]} allowUnlink={allowUnlink} />
      ))}
    </div>
  );
}
