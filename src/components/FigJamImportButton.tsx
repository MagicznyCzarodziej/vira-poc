import { useRef } from "react";
import { useDocument } from "../store/index.ts";

export function FigJamImportButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const importCsv = useDocument((state) => state.importFigJamStickiesFromCsv);

  return (
    <>
      <button
        type="button"
        className="header-proto-btn"
        data-action="import-figjam-csv"
        onClick={() => inputRef.current?.click()}
      >
        Import FigJam CSV
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        aria-hidden="true"
        tabIndex={-1}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          const text = await file.text();
          const count = importCsv(text);
          if (count === 0) {
            window.alert("No sticky notes found in that CSV. Export stickies from FigJam with Content (and optional Created by) columns.");
            return;
          }
          window.alert(`Imported ${count} decision${count === 1 ? "" : "s"} from FigJam stickies.`);
        }}
      />
    </>
  );
}
