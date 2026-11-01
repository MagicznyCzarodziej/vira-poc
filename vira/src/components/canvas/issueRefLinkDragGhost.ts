import { formatIssueRefDisplay, parseIssueRef } from "../../domain/index.ts";
import { linkDragGhostTransform } from "./actionPointLinkDragGhost.ts";

let host: HTMLDivElement | null = null;

export function syncIssueRefLinkDragGhost(refToken: string, clientX: number, clientY: number): void {
  const parsed = parseIssueRef(refToken);
  const label = parsed ? formatIssueRefDisplay(parsed) : refToken;

  if (!host) {
    host = document.createElement("div");
    host.className = "issue-ref-link-drag-ghost";
    host.setAttribute("aria-hidden", "true");
    const chip = document.createElement("span");
    chip.className = "issue-ref-link-drag-chip";
    chip.textContent = label;
    host.append(chip);
    document.body.append(host);
  } else {
    const chip = host.querySelector(".issue-ref-link-drag-chip");
    if (chip) chip.textContent = label;
  }

  const { x, y } = linkDragGhostTransform(clientX, clientY);
  host.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
}

export function clearIssueRefLinkDragGhost(): void {
  host?.remove();
  host = null;
}
