# Dubai's Invisible Twins — final version

An interactive D3 data story for CS333 Part 3. Five linked D3 views compare Dubai communities whose one-bedroom flats are the same size but sell at very different prices.

## Run it
1. Open this folder in VS Code.
2. Right-click `index.html` → **Open with Live Server** (a `file://` URL cannot load the JSON data).
3. Internet access is needed for D3 v7, MapLibre, fonts and the basemap tiles.

To publish: push this folder to a GitHub repository and enable GitHub Pages. Direct links: `#find`, `#evidence`, `#dna`, `#budget`, `#guest`.

## The five D3 views
| # | View | Anchor | Key addition in the final version |
|---|---|---|---|
| 1 | Twin Constellation | `#find` | Histogram of the gap for every size-matched pair ("is your gap unusual?") |
| 2 | Every Sale | `#evidence` | 95% bootstrap interval for the median gap; hollow dots for probable non-market transfers |
| 3 | Twin DNA | `#dna` | Five-measure ranked ladder based on validated sales |
| 4 | Same Budget, Different Home | `#budget` | Band showing the 55–100 m² data range; extrapolated areas labelled |
| 5 | Price vs Guest Experience | `#guest` | Plain-language finding with rank correlation; thin years flagged |

## Headline findings
- Across all 266 size-matched pairs (2023–2025), **73% differ by 30% or more** in median price per m².
- 2025 example: Marsa Dubai AED 20,495/m² vs Al Barsha South Fourth AED 13,528/m², **+51.5%** (95% interval about 34–72%), median areas 74.8 vs 72.3 m².
- Guest ratings barely vary (about 4.4–4.9 stars) and show no stable link to sale price.

## Documentation
- `docs/DELIVERABLES.md` — URL, encoding, interaction, value added for each view (submission format)
- `docs/data_preprocessing/methodology.md` — filters with row counts, matching rule, Twin DNA sources, non-market flag, bootstrap
- `docs/CODE_WALKTHROUGH.md` — how a click flows through the code (for the Q&A)
- `docs/GUEST_RATINGS_METHOD.md` — Kaggle data processing and spatial join

## Final verified Twin DNA ladder
Five metrics only: median sale price per m², median flat area, median transaction value, price IQR and eligible sale count. All are calculated from validated 2023–2025 property transactions. Unsupported metro, venue, population, off-plan and mortgage ladder attributes have been removed. The ranking and interactions remain.
