import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { Card } from "../../domain/index.ts";

type Tip = { refId: string; anchor: HTMLElement };

export type UseIssueTipResult = {
  tip: Tip | null;
  tipRef: RefObject<HTMLDivElement | null>;
  onEnter: () => void;
  onLeave: () => void;
};

export function useIssueTip(items: Record<string, Card>): UseIssueTipResult {
  const [tip, setTip] = useState<Tip | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const placement = useRef<"above" | "below" | null>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  const scrolledFor = useRef<HTMLElement | null>(null);
  const hideTimer = useRef<number | null>(null);
  const showTimer = useRef<number | null>(null);

  const clearHide = () => {
    if (hideTimer.current != null) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };
  const clearShow = () => {
    if (showTimer.current != null) {
      window.clearTimeout(showTimer.current);
      showTimer.current = null;
    }
  };

  const position = () => {
    const el = tipRef.current;
    const anchor = anchorRef.current;
    if (!el || !anchor?.isConnected) return;
    const gap = 6;
    const margin = 8;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const rect = anchor.getBoundingClientRect();
    el.style.left = "0px";
    el.style.top = "0px";
    const pop = el.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - pop.width / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - pop.width - margin));
    const spaceBelow = window.innerHeight - margin - (rect.bottom + gap);
    const spaceAbove = rect.top - gap - margin;
    if (!placement.current) {
      placement.current = spaceBelow >= pop.height || spaceBelow >= spaceAbove ? "below" : "above";
    }
    const docTop = placement.current === "above"
      ? scrollY + rect.top - gap - pop.height
      : scrollY + rect.bottom + gap;
    el.style.left = `${scrollX + left}px`;
    el.style.top = `${Math.max(scrollY + margin, docTop)}px`;
  };

  const scheduleHide = () => {
    clearHide();
    hideTimer.current = window.setTimeout(() => {
      hideTimer.current = null;
      anchorRef.current = null;
      placement.current = null;
      setTip(null);
    }, 120);
  };

  useEffect(() => {
    const onOver = (event: MouseEvent) => {
      const ref = (event.target as Element | null)?.closest?.<HTMLElement>("[data-action='goto-issue']");
      if (!ref || ref.closest(".card-readonly") || ref.closest(".issue-ref-panel-body .card-readonly")) return;
      const from = event.relatedTarget;
      if (from instanceof Node && ref.contains(from)) return;
      clearHide();
      if (anchorRef.current === ref && tipRef.current) {
        position();
        return;
      }
      clearShow();
      showTimer.current = window.setTimeout(() => {
        showTimer.current = null;
        placement.current = null;
        anchorRef.current = ref;
        setTip({ refId: ref.dataset.issueRef ?? "", anchor: ref });
      }, 220);
    };
    const onOut = (event: MouseEvent) => {
      const ref = (event.target as Element | null)?.closest?.("[data-action='goto-issue']");
      if (!ref || ref.closest(".card-readonly")) return;
      const to = event.relatedTarget;
      if (to instanceof Node && (ref.contains(to) || tipRef.current?.contains(to))) return;
      clearShow();
      scheduleHide();
    };
    const onScroll = () => {
      if (anchorRef.current && tipRef.current) position();
    };
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("scroll", onScroll, true);
      clearShow();
      clearHide();
    };
  }, []);

  useLayoutEffect(() => {
    if (!tip) return;
    position();
    if (scrolledFor.current !== tip.anchor) {
      scrolledFor.current = tip.anchor;
      tipRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [tip, items]);

  return {
    tip,
    tipRef,
    onEnter: () => clearHide(),
    onLeave: () => scheduleHide(),
  };
}
