# Member 3 — Twin Constellation & Every Sale

Two linked D3.js visualizations for *Dubai's Invisible Twins*. Both accept a
shared state object (`year`, community `a`, community `b`, processed data)
and update together whenever that state changes.

## Visualization 1 — Twin Constellation

**File:** `js/twin-constellation.js` · **Exposed:** `window.Constellation.render(ctx)`

**Purpose.** Help users discover comparable communities and see that
"comparable on size" does not mean "the same price". The chart makes size
matching visible *before* the user looks at price.

**Encoding**

| Channel | Field | Technique |
| --- | --- | --- |
| X position | median apartment floor area (m²) | `d3.scaleLinear()` |
| Y position | median recorded price (AED/m²) | `d3.scaleLinear()` |
| Radius | eligible transaction count | `d3.scaleSqrt()` |
| Fill — turquoise `#008e99` | selected community A | static color |
| Fill — coral `#ed805e` | selected comparison B | static color |
| Fill — pale teal `#9fc9c3` | eligible size-match candidate | static color |
| Fill — neutral grey | other eligible community | static color |

**Axes.** Bottom axis = median floor area (m²), left axis = median price
(AED/m²) formatted with thousands separators. Axis ticks reduce on narrow
screens (`width < 500` uses 4 ticks). Both axes are rebuilt through
`selection.transition()` so changing the year re-scales smoothly.

**Interaction**
- **Hover:** tooltip shows community name, median area, median price per m²,
  eligible transaction count and match status (`Selected` / `Eligible` /
  `Not eligible`). Hover works on every dot, eligible or not.
- **Click on an eligible dot (not A itself):** invokes `onSelectPartner(id)`,
  which updates community B and re-renders *all* linked views (Twin DNA,
  Budget Explorer, both apartment illustrations, the current-comparison strip).
- **Click on an ineligible dot:** ignored — no invalid comparison can be created.
- Candidate dots are connected to A with low-opacity teal lines, so the
  matched set is visually legible.

**Transitions.** Circles are keyed by `community` id, so re-renders reuse the
same DOM nodes: entering dots grow from `r = 0`, updating dots transition to
their new position and radius with a small stagger. `prefers-reduced-motion`
sets all durations to 0.

**Never invents data.** Only fields present on each `summary` row are shown.

## Visualization 2 — Every Sale

**File:** `js/every-sale.js` · **Exposed:** `window.EverySale.render(ctx)`

**Purpose.** Reveal what the median hides: the full spread of individual
recorded transactions in each community, and how much the two distributions
overlap.

**Encoding**

| Channel | Field | Technique |
| --- | --- | --- |
| X position | price per m² of that individual sale | `d3.scaleLinear()` |
| Row / color — turquoise | community A transactions | |
| Row / color — coral | community B transactions | |
| Vertical dashed line | median price of each group | |
| Optional band | interquartile range | toggle |
| One dot | one eligible transaction | `selection.join()` |

**Anti-overlap layout.** Dots are grouped into columns by price and then
stacked vertically around each row center. This deterministic layout means
each dot remains individually hoverable and no transaction is hidden behind
another. Layout is recomputed on each render so switching communities or years
re-flows cleanly.

**Controls.** Two in-frame toggles are created once per container and
persisted via a `WeakMap`:
- **Show medians** — animates the dashed vertical median markers and their
  numeric labels in / out.
- **Highlight IQR** — animates a translucent band between Q1 and Q3 for each
  community. If a group has fewer than 4 transactions the band is omitted.

**Hover.** Tooltip reports only fields present in the record:
community, transaction year, floor area, recorded sale value, price per m².

**Shared axis.** Both communities sit on one AED/m² axis, so their spreads
and overlap can be compared fairly.

## Linked interaction summary

| User action | Constellation | Every Sale | Twin DNA | Budget | Buildings |
| --- | --- | --- | --- | --- | --- |
| Change year | re-scales + re-joins | re-bins groups | yes | yes | yes |
| Change community A | re-highlights | re-groups | yes | yes | yes |
| Click eligible dot | sets B | re-groups | yes | yes | yes |
| Toggle medians / IQR | — | animates | — | — | — |

## Techniques used (required list)

`d3.scaleLinear` ✓ · `d3.scaleSqrt` ✓ · `d3.axisBottom` ✓ ·
`d3.axisLeft` ✓ · `selection.join` ✓ · `selection.on` ✓ ·
`selection.transition` ✓