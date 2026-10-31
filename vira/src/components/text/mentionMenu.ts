let menu: HTMLDivElement | null = null;
let highlight = 0;
let suppressHoverUntil = 0;
const bindings = new WeakMap<HTMLTextAreaElement, () => void>();

function menuItems(root: ParentNode) {
  return [...root.querySelectorAll<HTMLButtonElement>(".mention-menu-item")];
}

export function closeMenu(): void {
  menu?.remove();
  menu = null;
  highlight = 0;
}

export function menuIsOpen(): boolean {
  return !!menu;
}

function setHighlight(index: number) {
  if (!menu) return;
  const buttons = menuItems(menu);
  if (!buttons.length) return;
  highlight = ((index % buttons.length) + buttons.length) % buttons.length;
  buttons.forEach((button, i) => {
    const on = i === highlight;
    button.classList.toggle("active", on);
    button.setAttribute("aria-selected", on ? "true" : "false");
  });
  buttons[highlight]?.scrollIntoView({ block: "nearest" });
}

export function acceptMenuItem(): boolean {
  if (!menu) return false;
  const button = menuItems(menu)[highlight];
  if (!button) return false;
  button.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
  return true;
}

function consume(event: KeyboardEvent) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

export function handleMenuKey(event: KeyboardEvent): boolean {
  if (event.key === "Escape") {
    closeMenu();
    return true;
  }
  if (!menu || !menuItems(menu).length) return false;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    consume(event);
    suppressHoverUntil = Date.now() + 250;
    setHighlight(highlight + (event.key === "ArrowDown" ? 1 : -1));
    return true;
  }
  if ((event.key === "Enter" && !event.shiftKey && !event.isComposing) || (event.key === "Tab" && !event.shiftKey)) {
    consume(event);
    acceptMenuItem();
    return true;
  }
  return false;
}

export function openMenu(ta: HTMLTextAreaElement, buttons: HTMLButtonElement[]): void {
  closeMenu();
  if (!buttons.length) return;
  const el = document.createElement("div");
  el.className = "mention-menu";
  el.setAttribute("role", "listbox");
  for (const button of buttons) el.append(button);
  document.body.append(el);
  const rect = ta.getBoundingClientRect();
  el.style.left = `${rect.left}px`;
  el.style.top = `${rect.bottom + 4}px`;
  el.style.minWidth = `${Math.min(Math.max(rect.width, 200), 320)}px`;
  menu = el;
  el.addEventListener("mouseover", (event) => {
    if (Date.now() < suppressHoverUntil) return;
    const target = event.target instanceof Element ? event.target : (event.target as Node).parentElement;
    const item = target?.closest(".mention-menu-item");
    if (!item) return;
    const index = menuItems(el).indexOf(item as HTMLButtonElement);
    if (index >= 0) setHighlight(index);
  });
  setHighlight(0);
}

export function bindTextarea(
  ta: HTMLTextAreaElement,
  onInput: () => void,
  onKeyDown: (event: KeyboardEvent) => void,
): () => void {
  const existing = bindings.get(ta);
  if (existing) return existing;
  const onBlur = () => window.setTimeout(closeMenu, 120);
  ta.addEventListener("input", onInput);
  ta.addEventListener("keydown", onKeyDown);
  ta.addEventListener("blur", onBlur);
  const cleanup = () => {
    ta.removeEventListener("input", onInput);
    ta.removeEventListener("keydown", onKeyDown);
    ta.removeEventListener("blur", onBlur);
    if (bindings.get(ta) === cleanup) bindings.delete(ta);
    closeMenu();
  };
  bindings.set(ta, cleanup);
  return cleanup;
}
