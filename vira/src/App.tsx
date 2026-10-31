import { useDocument } from "./store/index.ts";
import { Header } from "./components/Header.tsx";
import { BoardView } from "./components/BoardView.tsx";
import { ListView } from "./components/ListView.tsx";
import { HistoryDrawer } from "./components/panels/HistoryDrawer.tsx";
import { IssuePreview } from "./components/panels/IssuePreview.tsx";
import { RefLinkPicker } from "./components/panels/RefLinkPicker.tsx";
import { SelectionRefToolbar } from "./components/text/SelectionRefToolbar.tsx";
import { useAppShellEffects } from "./components/app/useAppShellEffects.ts";

export default function App() {
  const viewMode = useDocument((state) => state.viewMode);
  useAppShellEffects();

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
