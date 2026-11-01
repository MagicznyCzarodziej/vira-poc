import { create } from "zustand";
import type { FieldName } from "../domain/index.ts";

export type PickerSession = {
  label: string;
  start: number;
  end: number;
  textSnapshot: string;
  mode: "inline" | "composer" | "followup" | "note";
  itemId?: string;
  noteId?: string;
  field?: FieldName;
  stepIndex?: number;
  canvas?: boolean;
};

type PanelState = {
  drawerRefId: string | null;
  picker: PickerSession | null;
  openDrawer: (refId: string) => void;
  closeDrawer: () => void;
  openPicker: (picker: PickerSession) => void;
  closePicker: () => void;
};

export const usePanels = create<PanelState>((set) => ({
  drawerRefId: null,
  picker: null,
  openDrawer: (drawerRefId) => set({ drawerRefId, picker: null }),
  closeDrawer: () => set({ drawerRefId: null }),
  openPicker: (picker) => set({ picker, drawerRefId: null }),
  closePicker: () => set({ picker: null }),
}));

export function drawerOpen(state: { drawerRefId: string | null }): boolean {
  return state.drawerRefId != null;
}

export function pickerOpen(state: { picker: PickerSession | null }): boolean {
  return state.picker != null;
}
