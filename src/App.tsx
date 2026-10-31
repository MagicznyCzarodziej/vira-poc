import { useEffect } from "react";
import { useDocument } from "./store/useDocument.ts";
import { usePanels } from "./store/usePanels.ts";
import { Header } from "./components/Header.tsx";
import { BoardView } from "./components/BoardView.tsx";
import { ListView } from "./components/ListView.tsx";
import { HistoryDrawer } from "./components/panels/HistoryDrawer.tsx";
import { IssuePreview } from "./components/panels/IssuePreview.tsx";
import { RefLinkPicker } from "./components/panels/RefLinkPicker.tsx";
import { bindRefPickFromCard, refPickModeActive } from "./components/text/bindRefPickFromCard.ts";
import { SelectionRefToolbar } from "./components/text/SelectionRefToolbar.tsx";

export default function App() {
  const viewMode = useDocument((state) => state.viewMode);
  const showAllDates = useDocument((state) => state.showAllDates);
  const panelOpen = usePanels((state) => state.drawerRefId != null || state.picker != null);
  const picker = usePanels((state) => state.picker);

  useEffect(() => {
    document.body.classList.toggle("show-dates", showAllDates);
    document.body.classList.toggle("issue-ref-panel-open", panelOpen);
  }, [showAllDates, panelOpen]);

  useEffect(() => bindRefPickFromCard(), []);

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

  return (
    <div className="app-shell">
      <Header />
      <div className="app-body" id="app-body">
        <main>
          <div className="main-layout">
            <div id="app" className={viewMode}>
              {viewMode === "board" ? <BoardView /> : <ListView />}
            </div>
          </div>
        </main>
        <HistoryDrawer />
        <RefLinkPicker />
      </div>
      <IssuePreview />
      <SelectionRefToolbar />
    </div>
  );
}
