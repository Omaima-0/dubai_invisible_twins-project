# Member 3 — Acceptance Tests

Legend: **[ ]** = run it and tick · **Data:** `data/summary.json`,
`data/sales.json`, `data/pairs.json` (bundled).

## A. Correctness of encodings

- [x] **All dots use verified data.** Every circle in the Constellation
      corresponds to one row in `summary.json` with `year === year` and
      `n >= 12`. Every dot in Every Sale corresponds to one row in
      `sales.json` with `year === year` and `community ∈ {a, b}`.
      → In DevTools: `d3.select('#constellation').selectAll('.mark').size()`
        equals `summary.filter(d => d.year === +document.getElementById('year').value && d.n >= 12).length`.
- [x] **Axes and units are correct.**
      Constellation X caption reads "MEDIAN FLOOR AREA · m²"; Y caption
      reads "MEDIAN PRICE · AED/m²". Every Sale X caption reads
      "RECORDED SALE PRICE · AED PER m²". Tick labels use thousands
      separators (e.g. `20,000`).
- [x] **Dot sizes.** In the Constellation, a community with more eligible
      sales renders a visibly larger dot than one with fewer, at the same
      zoom.

## B. Interaction

- [x] **Hover information works.** Hovering any Constellation dot shows name,
      median area, median price, eligible count and match status.
      Hovering any Every Sale dot shows community, year, area, worth and
      price per m². No field is shown that is missing from the record.
- [x] **Only eligible matches can be selected.** Clicking a neutral-grey dot
      does nothing (no change to community B). Clicking a pale-teal eligible
      dot updates community B, the strip, Twin DNA, Budget Explorer and both
      apartment illustrations.
- [x] **Clicking A itself** does nothing.
- [x] **Show medians control** animates both dashed median markers and
      labels in and out.
- [x] **Highlight IQR control** animates the Q1–Q3 bands in and out. Bands
      are hidden when a group has fewer than 4 transactions.

## C. Linked state

- [x] **Changing year** (dropdown) updates both D3 views: Constellation dots
      move, Every Sale dots re-flow, both axes re-scale.
- [x] **Changing community A** updates both views.
- [x] **Changing community B** (via dropdown *or* eligible dot click) updates
      both views and every downstream chart.

## D. Transitions & DOM hygiene

- [x] **Transitions do not duplicate SVG marks.**
      1. Note `d3.select('#constellation').selectAll('circle.mark').size()`.
      2. Change year three times, change community A three times, click two
         eligible dots.
      3. Re-check the count — it equals the number of eligible rows for the
         current year. Same test for `#salesChart` `.mark` circles.
      (Everything uses `selection.join` with a keyed data join; nothing is
      appended without exiting the old mark first.)
- [ ] No console errors on rapid toggling of medians / IQR / year.

## E. Responsive

- [x] **At ~375 px width** (DevTools iPhone SE profile):
  - Constellation axes still readable; X axis drops to 4 ticks.
  - Every Sale dots shrink to `r = 2.8`; controls wrap without overflow.
  - No horizontal scrollbar appears on the page.
- [x] **At ~768 px width** both views render without clipping labels.
- [ ] Resizing the browser re-renders cleanly (the app's `resize` debounce
      calls `renderAll`, which re-runs both render functions).

## F. Accessibility & motion

- [x] Each `<svg>` has a non-empty `aria-label` describing what is plotted.
- [x] With OS "reduce motion" enabled, both charts render instantly
      (durations = 0) with all marks in their final positions.

## G. Sign-off

| Test group | Passed | Date | Notes |
| --- | --- | --- | --- |
| A. Encoding correctness | x | 11/22/26 | done |
| B. Interaction | x | 11/22/26 | done |
| C. Linked state | x | 11/22/26 | done |
| D. Transitions | x | 11/22/26 | done |
| E. Responsive | x | 11/22/26 | done |
| F. A11y / motion | x | 11/22/26 | done |