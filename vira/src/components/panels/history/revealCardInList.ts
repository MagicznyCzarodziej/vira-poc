export function revealCardInList(id: string): void {
  const revealList = (tries = 0) => {
    const card = document.querySelector<HTMLElement>(`.workspace-list .list-cards .card[data-id="${CSS.escape(id)}"]`);
    if (!card) {
      if (tries < 40) requestAnimationFrame(() => revealList(tries + 1));
      return;
    }
    card.scrollIntoView({ block: "center", behavior: "smooth" });
    const scroller = document.querySelector(".workspace-list .list-body");
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
  };
  revealList();
}
