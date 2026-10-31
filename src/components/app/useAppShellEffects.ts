import { useEffect } from "react";
import { bindListDragBlocked } from "../canvas/bindListDragBlocked.ts";
import { bindListCardHtmlDrag } from "../canvas/bindListCardHtmlDrag.ts";
import {
  bindListCardPointerDrag,
  createListCardPointerDragDeps,
} from "../canvas/listCardPointerDrag.ts";
import { bindRefPickFromCard, refPickModeActive } from "../text/bindRefPickFromCard.ts";
import { useDocument, usePanels } from "../../store/index.ts";

/** Document-level body classes and ref-pick listeners for the app shell. */
export function useAppShellEffects() {
  const showAllDates = useDocument((state) => state.showAllDates);
  const panelOpen = usePanels((state) => state.drawerRefId != null || state.picker != null);
  const picker = usePanels((state) => state.picker);

  useEffect(() => {
    document.body.classList.toggle("show-dates", showAllDates);
    document.body.classList.toggle("issue-ref-panel-open", panelOpen);
  }, [showAllDates, panelOpen]);

  useEffect(() => bindRefPickFromCard(), []);

  useEffect(() => {
    const root = document.getElementById("app");
    if (!root) return;
    const unbindBlocked = bindListDragBlocked(root);
    const unbindListDrag = bindListCardPointerDrag(document.body, createListCardPointerDragDeps());
    const unbindHtmlDrag = bindListCardHtmlDrag(document.body);
    return () => {
      unbindBlocked();
      unbindListDrag();
      unbindHtmlDrag();
    };
  }, []);

  useEffect(() => {
    const sync = () => document.body.classList.toggle("ref-pick-active", refPickModeActive());
    sync();
    document.addEventListener("focusin", sync);
    document.addEventListener("input", sync, true);
    return () => {
      document.removeEventListener("focusin", sync);
      document.removeEventListener("input", sync, true);
      document.body.classList.remove("ref-pick-active");
    };
  }, [picker]);
}
