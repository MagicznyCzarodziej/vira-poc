import { closeMenu } from "./mentionMenu.ts";

let suppressRefPickUntilInput = false;

export function isRefPickSuppressed(): boolean {
  return suppressRefPickUntilInput;
}

export function suppressRefPickAfterInsert(): void {
  suppressRefPickUntilInput = true;
  closeMenu();
  syncRefPickBodyClass(false);
}

export function clearRefPickSuppressOnInput(): void {
  if (!suppressRefPickUntilInput) return;
  suppressRefPickUntilInput = false;
}

export function syncRefPickBodyClass(active: boolean): void {
  document.body.classList.toggle("ref-pick-active", active);
}

export function resetRefPickSessionForTests(): void {
  suppressRefPickUntilInput = false;
}
