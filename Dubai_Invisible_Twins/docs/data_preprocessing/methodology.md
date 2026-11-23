# Methodology — Dubai's Invisible Twins

## 1. Data sources

| File | Contents | Rows / features |
|---|---|---|
| `transactions.csv` | Dubai Land Department transaction records | 89,212 rows, 21 columns, 89,212 unique `transaction_id`, 0 exact duplicate rows |
| `dubai.geojson` | Community polygons with geometry + 2018/2019 population + area | 226 polygons |

Fields used from the transaction file:
`transaction_id`, `instance_date`, `trans_group_en`, `property_type_en`,
`property_sub_type_en`, `property_usage_en`, `reg_type_en`, `rooms_en`,
`procedure_area`, `actual_worth`, `meter_sale_price`, `comm_num`, `area_name_en`.

Fields used from the geojson file:
`COMM_NUM` (join key), `geometry`, `Population 2018`, `Population 2019`,
`Area Sq Km`, `Latitude`, `Longitude`.

**Fields not used:**

Historical development note (not part of the final five-metric visualization): - `nearest_metro_en` — a station name only. Metro distance is instead
  computed from the course file `2026-27/Part 3/dubai_metro_stations.geojson`
  (station coordinates), measured from each community's centre point in
  `dubai.geojson` to the nearest station (see section 6).
- `nearest_mall_en` — a name, not a distance; no mall coordinates are supplied.
- 2019 population is used only as a historical density attribute in Twin DNA;
  it is not a 2025 population estimate.

## 2. Comparison rules

Every transaction that appears in the analysis passes all of these:

| Rule | Column | Condition | Rows remaining |
|---|---|---|---|
| Years 2023–2025 | `instance_date` | `2023-01-01 ≤ date ≤ 2025-12-31` | 32,846 |
| Sales only | `trans_group_en` | `== 'Sales'` | 26,333 |
| Residential flats | `property_type_en`, `property_sub_type_en`, `property_usage_en` | `== 'Unit'` and `== 'Flat'` and `== 'Residential'` | 19,781 |
| Existing properties | `reg_type_en` | `== 'Existing Properties'` | 6,197 |
| One-bedroom | `rooms_en` | `== '1 B/R'` | 2,513 |
| Floor area 55–100 m² | `procedure_area` | `55 ≤ area ≤ 100` | 2,076 |
| Positive worth and AED/m² | `actual_worth`, `meter_sale_price` | `> 0` | 2,076 |
| Outlier bound | `meter_sale_price` | `1,000 ≤ price ≤ 60,000` | **2,072** |
| Community ID matched to a geojson polygon | `comm_num` → `COMM_NUM` | match on string | **2,072** |

The **fixed outlier bound** (1,000–60,000 AED/m²) is applied as a rule, not
as a data-dependent percentile trim. It removes 3 nominal / partial-share
transfers below 1,000 AED/m² and 1 impossible value above 60,000 AED/m².
The 30 lowest and highest surviving prices are exported for inspection in
`extreme_low_ppsqm.csv` and `extreme_high_ppsqm.csv` (in the parent audit
folder).

## 3. Eligibility

A **community-year** is eligible for pair matching only if it has at least
**12** qualifying sales in that year (after all rules above). This rule
is a minimum-sample guard against presenting medians for very small
samples. Eligible community counts:

- 2023: **13**
- 2024: **19**
- 2025: **21**

## 4. Matching rule

Two eligible community-years are a **candidate pair** when:

1. They are in the **same year**.
2. Their **median apartment areas** differ by **no more than 10%**,
   measured as the symmetric relative difference:
   `|area_a − area_b| / ((area_a + area_b) / 2) ≤ 0.10`

Price is **not** part of the matching rule. Price is only computed *after*
matching and reported as `price_gap_b_vs_a_pct`.

## 5. Metric definitions

| Metric | Definition |
|---|---|
| Price per m² | `actual_worth / procedure_area` per transaction (same as `meter_sale_price` in the source; verified consistent) |
| Median price per m² | Median of `meter_sale_price` across eligible transactions in the community-year |
| Median floor area | Median of `procedure_area` |
| Median sale value | Median of `actual_worth` |
| Price variation (IQR) | `p75(ppsqm) − p25(ppsqm)` |
| Transaction count | `count(transaction_id)` |
| Price gap (AED/m²) | `median_ppsqm_b − median_ppsqm_a` |
| Price gap % | `(median_ppsqm_b / median_ppsqm_a − 1) × 100` |

**On the denominator in the percentage:** every price-gap percentage
presented on the website is computed **relative to the lower median**, so
the sign of the number always indicates direction (positive = the second
community is more expensive). Every label on the website must show the
denominator explicitly, e.g. *"+22% vs Business Bay"*, not just "+22%".

## 6. Twin DNA — what is used

`docs/build_extra_data.py` produces `data/dna_ladder.json`: ten measures per
eligible community-year, and each community's percentile rank among the
communities eligible in that year (0 = lowest, 100 = highest).

| Measure | Source and definition |
|---|---|
| Median sale price, flat area, sale value, IQR, eligible sales | Validated sample (sections 2–5) |
| Off-plan share of 1-bed sales | transactions.csv: all 1-bed residential flat sales in the community-year; share with `reg_type_en = Off-Plan Properties` |
| Mortgage share | transactions.csv: mortgages ÷ all transactions (sales, mortgages, gifts) in the community-year |
| Distance to nearest metro (km) | Haversine distance from the community centre point (`Latitude`, `Longitude` in dubai.geojson) to the nearest of the 56 stations in `dubai_metro_stations.geojson` (course Part 3 file, stations as of c. 2020) |
| Venues per km² | Count of venues per `COMM_NUM` in `dubai_venues.csv` (course Part 3 file, Foursquare c. 2020) ÷ `Area Sq Km`. The file stops at 100 venues per community, so capped communities are lower bounds; they are marked "+" and drawn with dashed ticks |
Historical development note (not part of the final five-metric visualization): | Population density | `Population 2019` ÷ `Area Sq Km` from dubai.geojson |

Historical development note (not part of the final five-metric visualization): Limits: metro distance is from the community centre, not from any sold flat;
venue and population data are c. 2019–2020, older than the 2023–2025 sales.
All Twin DNA measures describe associations, not causes.

## 6b. Non-market transfer flag

After validation, a sale is flagged when its AED/m² is below 25% of its
community-year median (4 of 2,072 sales, e.g. a 62 m² Business Bay flat
recorded at AED 70,268). These are most likely partial-share or nominal
transfers. They are kept, drawn as hollow dots in Every Sale and explained
in the tooltip. Medians and all published figures are unchanged.

## 6c. Uncertainty and context

- **Bootstrap interval (Every Sale):** 1,000 resamples of each community's
  sales; the 2.5th and 97.5th percentiles of the median ratio form the 95%
  interval. A seeded generator makes the interval identical on every load.
  Example, 2025: Marsa Dubai vs Al Barsha South Fourth +51.5% (about 34–72%).
- **Gap distribution (Twin Constellation):** the price gap of every
  size-matched pair in the selected year. Across all 266 pairs (2023–2025),
  73% differ by 30% or more.

## 7. Reproducibility

Every number in `community_year_summary.csv`, `candidate_pairs.csv`, and
any chart built from them is produced by `preprocessing.py` from
`transactions.csv` + `dubai.geojson` with no manual edits. Re-running
`preprocessing.py` regenerates all three CSVs with identical row content.

## 8. Cautions carried into the website

1. The course sample's 10% random-sample claim is **not verified from the
   source CSV alone**. Sample sizes must not be multiplied by 10 to imply
   population coverage.
2. 2019 population is a historical community attribute, not a 2025
   estimate.
3. The budget floor-plan figure is a **theoretical equivalent area at the
   observed median AED/m²**, not an actual purchasable property.
4. Each D3 view has its own deep-link anchor (`#find`, `#evidence`,
   `#dna`, `#budget`, `#guest`) within the single hosted site.