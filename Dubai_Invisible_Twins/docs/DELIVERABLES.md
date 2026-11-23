# CS333 Part 3 — Visualization deliverables

**Booked presentation slot:** [insert actual booked slot]

**Base published website URL:** [insert actual GitHub Pages URL]

**Project:** Dubai's Invisible Twins — one interactive D3 story with five linked views. All views share one selection state (year, Community A, Community B), so a selection in any view or selector updates every view.

**Data:** CS333 Dubai property transactions (`transactions.csv`, filtered to 2,072 eligible 2023–2025 existing one-bedroom flat sales), supplied Dubai community GeoJSON (`dubai.geojson`) and a separate Kaggle short-term rental monthly listings dataset (`listings_monthly.csv`) used for guest ratings. **Kaggle original page URL, author and license: to be supplied by the team.** No metro, Foursquare or population datasets are used. Preprocessing: `docs/data_preprocessing/methodology.md`.

## Visualization 1 — Twin Constellation
**URL:** `[published URL]#find`

**Encoding:** A scatterplot with one circle per eligible community-year (≥ 12 sales). x = median flat area (m²); y = median sale price per m² (AED); circle area = number of sales; turquoise = Community A, coral = Community B, pale = other communities. Lines connect Community A to every community whose median area is within 10% (its "twins"). Below it, a histogram shows the price gap of **every** size-matched pair in the selected year (x = gap vs the lower median, bar height = number of pairs). A dashed line marks 30% and a coral line marks the selected pair.

**Interaction:** Choose a year and Community A. Hover a circle for its statistics. Click a connected circle to make it Community B. All other views, and the histogram marker, update with animated transitions.

**Value added:** Finds comparable markets without using price to define the match, then shows how far apart their prices are. The histogram answers "is this gap unusual?": in 2025, 71% of the 119 size-matched pairs differ by 30% or more.

## Visualization 2 — Every Sale
**URL:** `[published URL]#evidence`

**Encoding:** Two rows of dots, one dot per recorded sale. x = AED per m²; row and colour = community. Dashed lines mark the medians; optional bands show the interquartile range. Hollow dots are sales below 25% of their community median (unusually low-priced transactions; their cause is unknown). Below it, an interval strip shows the median gap as a point and its 95% bootstrap interval as a bar, with a "no difference" reference line at 0%.

**Interaction:** Hover a dot for its area, value and price per m². Toggle medians and IQR. Change the pair or year anywhere; dots leave and enter with transitions and the interval recalculates.

**Value added:** Shows the distribution, overlap and outliers behind the two medians, and the sampling uncertainty estimated by bootstrap resampling. Example, 2025: Marsa Dubai +51.5% vs Al Barsha South Fourth (95% interval about 34–72%). None of Al Barsha South Fourth's sales were priced above Marsa Dubai's median.

## Visualization 3 — Twin DNA
**URL:** `[published URL]#dna`

**Encoding:** A ranked ladder shows five transaction-derived measures: median sale price per m², median floor area, median sale value, interquartile price spread and eligible sale count. Each row is one measure; two coloured marks show the selected communities’ ranks among eligible communities for the selected year. Connecting segments show their rank separation. A detail chart displays actual values and units for the selected metric.

**Interaction:** Hover a row for real values, ranks and caveats. Click a row to make it the detail measure (switches the metric tab below). Changing the pair re-sorts the rows with an animation.

**Value added:** Compares the selected communities beyond median price by revealing differences in size, transaction value, price variability and evidence volume. Rankings use a separate scale for each metric and do not imply causes.

## Visualization 4 — Same Budget, Different Home
**URL:** `[published URL]#budget`

**Encoding:** Two bars; length = theoretical floor area = budget ÷ the community's median AED/m². A shaded band marks the 55–100 m² flats that exist in the data. A ranked card atlas lists every community with at least one recorded sale within the budget; each card's bar = number of such sales. Theoretical areas above 100 m² are labelled as beyond the data.

**Interaction:** Drag the budget slider (AED 0.5–4 M). Pick any two communities from the atlas or the selectors, independently of the main pair. Animated bars and illustrations.

**Value added:** Turns a price per m² into what the same money buys, and shows where sales within a budget actually happened (historical sales, not listings).

## Visualization 5 — Price vs Guest Experience
**URL:** `[published URL]#guest`

**Encoding:** A scatterplot with one circle per community-year that has at least five uniquely rated short-term rental listings. x = median residential sale price (AED/m²); y = mean guest rating (1–5 stars); circle area = number of rated listings. Turquoise and coral identify the selected pair. A sentence below gives the rank correlation for the year.

**Interaction:** Hover or keyboard-focus a circle for its rating, listing count and reviews. Click an eligible circle to change Community B in every view. The year selector is shared.

**Value added:** Links a separate dataset by spatial join (listing coordinates inside community polygons) and shows that, in 2025, guest ratings range only from about 4.4 to 4.9 stars with no clear link to sale price (rank correlation −0.02, 11 communities). The 2024 pattern differs (0.66, 13 communities), so the relationship is not stable.

## Course-descriptor submission checklist

- [x] D3.js implementation, with at least two linked subviews (five principal views plus inset analyses).
- [x] Preprocessing/filtering documented.
- [x] Explanation of marks, channels, interactions and why useful for each view.
- [x] Findings described for each view; verify every example against the running chart.
- [x] Presentation deck included with data-derived chart figures.
- [ ] Insert PUBLIC URL for each visualization in the presentation and this document.
- [ ] Add actual running-site screenshots if the figures in the deck do not represent the final live appearance.
- [ ] Confirm that the figures are not similar to those required in Parts 1 and 2 (the descriptor alone does not show those earlier figures).
- [ ] Add team names, Kaggle original URL/author/license, book Blackboard slot and upload presentation.
- [ ] Complete a 15-minute-or-shorter in-class presentation; attendance is mandatory.
- [ ] Verify the actual 2026–27 Blackboard deadline; the provided descriptor has an inconsistent 2025 date.

## Final verified Twin DNA ladder
Five metrics only: median sale price per m², median flat area, median transaction value, price IQR and eligible sale count. All are calculated from validated 2023–2025 property transactions. Unsupported metro, venue, population, off-plan and mortgage ladder attributes have been removed. The ranking and interactions remain.

## Tools and reproducibility
- D3.js v7: data-driven SVG, scales, axes, joins, transitions and linked interactive views. https://d3js.org/
- MapLibre GL JS: interactive basemap and geographic navigation. https://maplibre.org/maplibre-gl-js/docs/
- Python: transaction and guest-listing preprocessing; see `docs/data_preprocessing/preprocessing.py` and `docs/build_guest_ratings.py`.
- Original dataset URLs and licenses must be checked against the course-provided files and the team’s Kaggle download before submission.
