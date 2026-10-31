# UI color notes (PoC)

Sources used to simplify the decision board palette:

- [WCAG 2.2 — Use of Color (1.4.1)](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color): do not rely on color alone; pair hue with text, icons, or shape.
- [MDN — Use of color](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Perceivable/Use_of_color): avoid pure red/green as the only “bad/good” pair; prefer reddish-orange vs bluish-green; add non-color cues.
- [USWDS — Using color](https://designsystem.digital.gov/design-tokens/color/overview/): start neutral (black/white hierarchy), then add color for function (status), not full-surface fills.
- [WFP Design System — Colours](https://designsystem.wfp.org/docs/foundations/colours): `background` + `foreground` + semantic tokens (`destructive`, `primary`); ~4.5:1+ for text.
- [Turas — Status palette (RAG)](https://www.turasdesignsystem.nhs.scot/design/data-visualisation/status-palette/): always show status **labels** beside data; RAG is supplementary.
- [Chrome — Color (Modern Web Guidance)](https://developer.chrome.com/docs/modern-web-guidance/guides/visual-design/color): errors/success need text or icons, not color only; 4.5:1 text, 3:1 UI boundaries.

## PoC rules

1. **Cards stay white** — status = small label + left accent bar, not tinted card bodies.
2. **Three statuses** — Open (rose), In progress (amber), Resolved (teal-green), with visible text labels.
3. **Q&A** — question = default text; answer = light neutral panel + teal left rule (not full green fill).
4. **Contrast** — body `#18181b` on `#ffffff`; muted `#52525b`; semantic text at `-700` shades on white.
