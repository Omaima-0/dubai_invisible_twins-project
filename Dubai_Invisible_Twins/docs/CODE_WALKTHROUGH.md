# Code walkthrough — for the presentation Q&A

Every member should be able to explain this page.

## 1. Load order (index.html)

| File | Owner | What it does |
|---|---|---|
| `js/app.js` | Member 1 / integration | Loads the JSON data, holds the **shared state** (`year`, `a`, `b`, `metric`, `budget`), fills the selectors, defines `renderAll()` |
| `js/twin-constellation.js` | Member 3 | View 1 scatterplot (`window.Constellation.render`) |
| `js/every-sale.js` | Member 3 | View 2 dot plot (`window.EverySale.render`) |
| `js/twin-dna-and-budget.js` | Member 4 | View 3 detail bars (`dna()`), View 4 budget bars (`budgetView()`), apartment illustrations (`building()`) |
| `js/interaction-enhancements.js` | Member 1 | Per-chapter quick selectors, budget atlas cards, method dialogs |
| `js/guest-ratings.js` | Member 1 | View 5 scatterplot; keeps the budget pair independent of the main pair |
| `js/twin-dna-insights.js` | Final version | Gap histogram (View 1), bootstrap interval (View 2), Twin DNA ladder (View 3), guest finding (View 5) |
| `js/interface-refinements.js`, `js/story-navigation.js` | Member 1 | Guided tour (docks after the first scroll), chapter badge, deep links |

## 2. How one click flows through the code

Example: the user clicks a coral-highlighted circle in Twin Constellation.

1. `js/twin-constellation.js` calls `onSelectPartner(id)`, which `js/app.js` passed in.
2. That callback sets the shared variable `b = id` and calls `renderAll()`.
3. `renderAll()` (js/app.js) checks the pair is valid, updates the text strip, then redraws:
   `constellation()` → `everySale()` → `dna()` → `budgetView()` → `building()` for each view → `TwinInsights.render()`.
4. `js/interaction-enhancements.js` and `js/guest-ratings.js` wrap `renderAll` once at start-up, so the same call also syncs every chapter's selectors and redraws the guest scatterplot.

Every view therefore reads the same `year`, `a`, `b`. That is the linking.

## 3. Why updates animate instead of flashing

Each chart keeps its `<svg>` and uses D3's data join with a **key**:

```js
svg.selectAll('.ld-row').data(metrics, d => d.key)   // key = metric name
   .join(enter => ..., update => update, exit => exit.remove())
   .transition().duration(650).attr('transform', ...)
```

Because elements are matched by key, D3 moves existing marks to their new positions; only new marks enter and old ones exit. In Every Sale the key is the transaction id; in the ladder it is the metric name (so rows slide when re-sorted); in the gap histogram it is the bin start.

## 4. The statistics, in one sentence each

- **Median** price per m²: the middle sale. Used because prices are skewed by a few expensive sales.
- **Price gap** = higher median ÷ lower median − 1.
- **Bootstrap interval**: resample each community's sales 1,000 times with replacement, recompute the gap each time, keep the middle 95%. Seeded, so it is identical on every load.
- **Percentile rank** (ladder): position among the eligible communities that year, 0 = lowest, 100 = highest.
- **Spearman rank correlation** (guest view): +1 = higher price always means higher rating, 0 = no relationship.
- **Twin rule**: same year, ≥ 12 sales each, median areas within 10% of their average. Price is not used.

## 5. Rebuilding the data

```
python docs/data_preprocessing/preprocessing.py                       # validated sample, summary, pairs (CSV)
python docs/build_extra_data.py --raw <folder of raw files> # non-market flags + data/dna_ladder.json
python docs/build_guest_ratings.py                          # guest_ratings.json (needs the Kaggle file)
```
