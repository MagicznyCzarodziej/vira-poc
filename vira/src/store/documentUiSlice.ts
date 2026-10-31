import type { StateCreator } from "zustand";
import type { DocumentState } from "./documentTypes.ts";
import { schedule } from "./documentPersistence.ts";

type DocumentUiSlice = Pick<
  DocumentState,
  "setView" | "toggleDates" | "setListFilter" | "clearReveal"
>;

export const createDocumentUiSlice: StateCreator<DocumentState, [], [], DocumentUiSlice> = (set, get) => ({
  setView: (viewMode) => {
    set({ viewMode });
    schedule(get);
  },
  toggleDates: () => {
    set({ showAllDates: !get().showAllDates });
    schedule(get);
  },
  setListFilter: (listFilterNotOnCanvas) => {
    set({ listFilterNotOnCanvas });
    schedule(get);
  },
  clearReveal: () => set({ revealId: null }),
});
