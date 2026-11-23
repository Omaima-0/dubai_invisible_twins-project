# Guest ratings — supplementary evidence

## Provenance
Input: the second Kaggle ZIP provided by the team (`archive (2).zip`), file `listings_monthly.csv`. The Kaggle dataset's exact page URL, author, version and reuse license were **not included in the upload** and must be documented by the team. Do not assert that the ratings represent verified residents.

## Unit of analysis
One listing in one calendar year, taking the latest available monthly snapshot for that listing and year. A listing can appear in multiple years, but not multiple times in a single year's average.

## Inclusion
- `year` from 2023 to 2025
- `bedrooms == 1`
- `room_type == entire_home`
- `star_rating` from 1 to 5 inclusive
- `num_reviews > 0`
- Coordinate falls within exactly one supplied Dubai community polygon
- Community-year appears in the validated CS333 sale summary

## Aggregation
`mean_rating` is the arithmetic mean of the most recent recorded rating for each unique listing in that year. `n` is the number of uniquely rated listings. `reviews` is the sum of their reported cumulative review counts; this is NOT the number of reviews posted that year. Plot a community only if `n >= 5`. No rating is inferred for missing values.

## Matching
A point-in-polygon spatial join connects each rental listing to a CS333 Dubai community polygon using coordinates. This is more defensible than mapping 'Downtown Dubai' or other marketing neighborhood names to administrative boundaries by guesswork.

## Limitations
These are short-term rental guest ratings, not resident or owner satisfaction. The rated listings are not the properties recorded in the sales CSV. The monthly snapshots can reflect cumulative ratings from reviews posted before the chosen year. Small samples, listing selection and missing ratings can bias averages. No causal relationship between sale prices and ratings is established.

## Results of processing
610 rated listing-year observations matched to sale-summary community-years, aggregated into 82 community-year summaries; 28 community-year summaries have at least five rated listings. These counts describe the supplementary dataset, not the 2,072 sale records.
