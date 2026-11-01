import { toggleAccordionCollapsedKey } from "../domain/accordionCollapse.ts";
import type { StateCreator } from "zustand";
import type { DocumentState } from "./documentTypes.ts";
import { schedule } from "./documentPersistence.ts";

type DocumentUiSlice = Pick<
  DocumentState,
  | "setView"
  | "toggleDates"
  | "setListFilter"
  | "setListFilterTag"
  | "clearReveal"
  | "toggleSidebarHidden"
  | "setSidebarHidden"
  | "toggleAccordionCollapsed"
  | "setTagFrameMenuOpen"
  | "setTagFramePlacementTag"
  | "cancelTagFramePlacement"
>;

export const createDocumentUiSlice: StateCreator<DocumentState, [], [], DocumentUiSlice> = (set, get) => ({
  tagFrameMenuOpen: false,
  tagFramePlacementTag: null,
  setTagFrameMenuOpen: (tagFrameMenuOpen) => set({ tagFrameMenuOpen }),
  setTagFramePlacementTag: (tagFramePlacementTag) => {
    set({
      tagFramePlacementTag: tagFramePlacementTag?.trim().toLowerCase() || null,
      tagFrameMenuOpen: false,
      canvasTool: get().canvasTool === "frame" ? "default" : get().canvasTool,
    });
  },
  cancelTagFramePlacement: () => set({ tagFramePlacementTag: null, tagFrameMenuOpen: false }),
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
  setListFilterTag: (listFilterTag) => {
    set({ listFilterTag: listFilterTag?.trim().toLowerCase() || null });
    schedule(get);
  },
  clearReveal: () => set({ revealId: null }),
  toggleSidebarHidden: () => {
    set({ sidebarHidden: !get().sidebarHidden });
    schedule(get);
  },
  setSidebarHidden: (sidebarHidden) => {
    set({ sidebarHidden });
    schedule(get);
  },
  toggleAccordionCollapsed: (key) => {
    set({ accordionCollapsed: toggleAccordionCollapsedKey(get().accordionCollapsed, key) });
    schedule(get);
  },
});
