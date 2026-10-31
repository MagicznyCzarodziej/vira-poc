import { useDocument, type Surface } from "../../store/useDocument.ts";
import { armEditHandoff, AutoTextarea } from "./AutoTextarea.tsx";

export function FollowupField({ itemId, surface, draft }: { itemId: string; surface: Surface; draft: string }) {
  const editing = useDocument((state) => state.editing);
  const editInitial = useDocument((state) => state.editInitial);
  const focusNonce = useDocument((state) => state.focusNonce);
  const active = editing?.id === itemId && editing.field === "followup" && editing.surface === surface;
  if (active) {
    return (
      <AutoTextarea
        key={`f-${focusNonce}`}
        className="followup-input"
        initial={editInitial || draft}
        dataset={{ "followup-input": "true", id: itemId }}
        onTag={(tag) => useDocument.getState().addTag(itemId, tag)}
        onCancel={() => useDocument.getState().cancelEdit()}
        onCommit={(value) => useDocument.getState().commitEdit(value)}
      />
    );
  }
  return (
    <textarea
      className="followup-input"
      data-followup-input
      data-id={itemId}
      placeholder="Follow-up question"
      rows={1}
      value={draft}
      onChange={(event) => useDocument.getState().setFollowupDraft(itemId, event.target.value)}
      onMouseDown={(event) => {
        if (useDocument.getState().editing) {
          event.preventDefault();
          armEditHandoff(true);
          const activeEl = document.activeElement;
          const value = activeEl instanceof HTMLTextAreaElement || activeEl instanceof HTMLInputElement ? activeEl.value : "";
          useDocument.getState().commitEdit(value, { id: itemId, field: "followup", step: 0, surface });
          armEditHandoff(false);
        }
      }}
      onFocus={() => {
        if (!useDocument.getState().editing || useDocument.getState().editing?.field !== "followup") {
          useDocument.getState().beginEdit({ id: itemId, field: "followup", step: 0, surface });
        }
      }}
    />
  );
}
