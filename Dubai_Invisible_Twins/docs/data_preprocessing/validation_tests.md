# Validation tests — Dubai's Invisible Twins

## 1. Input integrity

| Test | Result |
|---|---|
| Row count of `transactions.csv` | 89,212 |
| Unique `transaction_id` | 89,212 |
| Exact duplicate rows | 0 |
| Community polygons in `dubai.geojson` | 226 |
| Community IDs in cleaned sample matched to a polygon | 2,072 / 2,072 (100%) |

## 2. Filter chain — row counts after each rule

| Rule | Rows |
|---|---|
| Years 2023–2025 | 32,846 |
| Sales only | 26,333 |
| Residential flats | 19,781 |
| Existing properties | 6,197 |
| One-bedroom | 2,513 |
| Floor area 55–100 m² | 2,076 |
| Positive worth and AED/m² | 2,076 |
| Outlier bound 1,000–60,000 AED/m² | 2,072 |
| Community ID matches polygon | 2,072 |

The outlier bound removed **3** nominal / partial-share transfers and **1**
impossible high value. Rows removed are listed in `extreme_low_ppsqm.csv`
and `extreme_high_ppsqm.csv` in the parent audit folder.

## 3. Field consistency

| Test | Result |
|---|---|
| `abs(actual_worth / procedure_area − meter_sale_price) > 5 AED` | **0** of 2,072 transactions |
| Price range after bounds | 3,000 – 58,000 AED/m² |

The zero-deviation result on worth ÷ area vs. `meter_sale_price` means the
source `meter_sale_price` is internally consistent with the two primary
fields; no recomputation is needed for the price-per-m² metric.

## 4. Independent statistic spot-checks

The following were recalculated independently (outside `preprocessing.py`)
using only `validated_sales.csv`:

| Community | Year | Reported median area | Recomputed median area | Reported median AED/m² | Recomputed median AED/m² |
|---|---|---|---|---|---|
| Burj Khalifa (345) | 2023 | 77.35 | 77.35 | 20,595.59 | 20,595.59 |
| Business Bay (346) | 2023 | 77.005 | 77.005 | 15,508.985 | 15,508.985 |
| Marsa Dubai (392) | 2023 | 73.99 | 73.99 | 15,890.56 | 15,890.56 |
| Al Barsha South Fourth (681) | 2024 | 74.02 | 74.02 | 11,192.27 | 11,192.27 |
| Palm Jumeirah (381) | 2025 | 96.18 | 96.18 | 40,816.33 | 40,816.33 |

All five match. Median sale value, IQR, and transaction count were checked
the same way and matched.

## 5. Matching-logic tests (Task D)

At least five pairs across the required categories were inspected:

| Test case | Pair | Verification |
|---|---|---|
| Two communities with similar prices | 2024 Business Bay ↔ Al Merkadh | gap −1.75%; area diff 7.57% — passes |
| Two communities with substantially different prices | 2023 Burj Khalifa ↔ Nadd Hessa | gap −72.3%; area diff 2.40% — passes |
| Community with several eligible matches | 2025 Burj Khalifa (13 pairs) | all listed pairs computed correctly |
| Community with few eligible matches | 2023 Business Bay ↔ Marsa Dubai (only 2 pairs for Marsa Dubai 2024) | computed correctly |
| One year but not another | Burj Khalifa ↔ Marsa Dubai: present 2023, 2024, 2025; Burj Khalifa ↔ Al Thanyah Third present 2023 & 2024 but **not** 2025 (median area drift to >10%) | correctly absent in 2025 |
| Community with no eligible comparisons | Any community with `n < 12` in a given year (e.g. Rega Al Buteen 2023, n=1) | correctly excluded — the website must show "not enough transactions" for such selections |

**Price is never used in matching.** Confirmed by inspecting
`preprocessing.py`: the `size_diff` test uses only `median_area`; the
`price_gap_b_vs_a_pct` column is computed *after* the pair is accepted.

## 6. Percentage-label verification

Every percentage reported by the analysis is `(higher / lower − 1) × 100`
with the **lower** value in the denominator. Verified by manual
recomputation of 20 rows of `candidate_pairs.csv`: all match. The website
must label each gap with its denominator (e.g. *"+22% vs Business Bay"*),
not a bare percentage.

## 7. Twin DNA metric verification (Task E)

| Metric in use | Derived from | Verified |
|---|---|---|
| Median floor area | `procedure_area` | ✅ |
| Median price/m² | `meter_sale_price` | ✅ |
| Median sale value | `actual_worth` | ✅ |
| IQR of price/m² | `p75 − p25` of `meter_sale_price` | ✅ |
| Transaction count | `count(transaction_id)` | ✅ |
| Percentage price gap | median ratio | ✅ |

**Metrics not used:** metro distance (no station coordinates in source),
venue density (no venue CSV), population-related explanations (2019
population only, historical attribute). These may be added only after the
relevant files are verified.

## 8. Reproducibility test

`preprocessing.py` was run twice from a clean working directory. Row
counts, column names, and rounded values in all three CSVs are identical
between runs. A third run with a different working directory (script
called from project root instead of `Member2_Data/`) produces identical
output.

## 9. Known limitations carried into the website

1. Course sample's "10% sample ×10" claim is not verified from the source
   CSV; per-community counts are sample counts only.
2. 2019 population is historical; not a 2025 estimate.
3. No metro or venue metrics until the source files are added and tested.
4. The budget floor-plan view shows a **theoretical equivalent area** at
   the observed median AED/m², not a real purchasable property.
5. Deep-link anchors per view (`#find`, `#evidence`, `#dna`, `#budget`)
   live within one hosted site.