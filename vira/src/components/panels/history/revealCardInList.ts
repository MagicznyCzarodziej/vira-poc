function revealListElement(card: HTMLElement, scroller: Element | null): void {
  card.scrollIntoView({ block: "center", behavior: "smooth" });
  const pop = () => {
    card.classList.remove("is-list-reveal-pop");
    void card.offsetWidth;
    card.classList.add("is-list-reveal-pop");
    const onEnd = (end: AnimationEvent) => {
      if (end.target !== card) return;
      card.classList.remove("is-list-reveal-pop");
      card.removeEventListener("animationend", onEnd);
    };
    card.addEventListener("animationend", onEnd);
  };
  if (!scroller) {
    pop();
    return;
  }
  let finished = false;
  let idleTimer = 0;
  let sawScroll = false;
  const startTop = scroller.scrollTop;
  const finish = () => {
    if (finished) return;
    finished = true;
    scroller.removeEventListener("scrollend", onScrollEnd);
    scroller.removeEventListener("scroll", onScroll);
    window.clearTimeout(fallbackTimer);
    window.clearTimeout(idleTimer);
    pop();
  };
  const onScrollEnd = () => finish();
  const onScroll = () => {
    sawScroll = true;
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(finish, 90);
  };
  scroller.addEventListener("scrollend", onScrollEnd);
  scroller.addEventListener("scroll", onScroll);
  const fallbackTimer = window.setTimeout(finish, 1200);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!sawScroll && scroller.scrollTop === startTop) idleTimer = window.setTimeout(finish, 48);
    });
  });
}

function revealInList(
  query: () => HTMLElement | null,
  scrollerSelector: string,
): void {
  const revealList = (tries = 0) => {
    const card = query();
    if (!card) {
      if (tries < 40) requestAnimationFrame(() => revealList(tries + 1));
      return;
    }
    const scroller = document.querySelector(scrollerSelector);
    revealListElement(card, scroller);
  };
  revealList();
}

export function revealCardInList(id: string): void {
  revealInList(
    () => document.querySelector<HTMLElement>(`.workspace-list .list-cards .card[data-id="${CSS.escape(id)}"]`),
    ".workspace-list .list-body",
  );
}

export function revealActionPointInList(id: string): void {
  revealInList(
    () => document.querySelector<HTMLElement>(
      `.workspace-list .list-action-points .action-point-card[data-id="${CSS.escape(id)}"]`,
    ),
    ".workspace-list .list-view--actions .list-body",
  );
}
