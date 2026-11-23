"""
preprocessing.py — Dubai's Invisible Twins
Data validation and methodology

Produces:
  validated_sales.csv              — cleaned, filtered per-transaction sample
  community_year_summary.csv       — per community-year medians
  candidate_pairs.csv              — size-matched community pairs (price not used)

Run from this folder:
    python preprocessing.py
"""
from pathlib import Path
import json
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent

# Inputs live one level up, in the project root
IN_DIR = BASE_DIR.parent
df  = pd.read_csv(IN_DIR / 'transactions.csv',  low_memory=False)
geo = json.loads((IN_DIR / 'dubai.geojson').read_text(encoding='utf-8'))

out = BASE_DIR
out.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# 1) Coerce numeric columns once, up front.
# ---------------------------------------------------------------------------
df['actual_worth']     = pd.to_numeric(df['actual_worth'],     errors='coerce')
df['meter_sale_price'] = pd.to_numeric(df['meter_sale_price'], errors='coerce')
df['procedure_area']   = pd.to_numeric(df['procedure_area'],   errors='coerce')
df['comm_num']         = df['comm_num'].astype(str)

counts = []
x = df.copy()
x['date'] = pd.to_datetime(x.instance_date, errors='coerce')
x = x[x.date.dt.year.between(2023, 2025)]
counts.append(('Years 2023–2025', len(x)))

# ---------------------------------------------------------------------------
# 2) Comparison rules (Task B in the brief)
# ---------------------------------------------------------------------------
for label, mask in [
    ('Sales only',               x.trans_group_en.eq('Sales')),
    ('Residential flats',        x.property_type_en.eq('Unit') &
                                 x.property_sub_type_en.eq('Flat') &
                                 x.property_usage_en.eq('Residential')),
    ('Existing properties',      x.reg_type_en.eq('Existing Properties')),
    ('One-bedroom',              x.rooms_en.eq('1 B/R')),
    ('Floor area 55–100 m²',     x.procedure_area.between(55, 100)),
    ('Valid positive worth and AED/m²',
                                 x.actual_worth.gt(0) & x.meter_sale_price.gt(0)),
]:
    x = x.loc[mask.loc[x.index]]
    counts.append((label, len(x)))

# ---------------------------------------------------------------------------
# 3) Documented outlier bound (fixed rule, not a percentile trim).
# ---------------------------------------------------------------------------
PPSQM_MIN, PPSQM_MAX = 1000, 60000
n_low  = int((x.meter_sale_price < PPSQM_MIN).sum())
n_high = int((x.meter_sale_price > PPSQM_MAX).sum())
x = x[x.meter_sale_price.between(PPSQM_MIN, PPSQM_MAX)].copy()
counts.append((f'Removed {n_low} rows < {PPSQM_MIN:,} AED/m² (nominal / partial-share transfers)', n_low))
counts.append((f'Removed {n_high} rows > {PPSQM_MAX:,} AED/m² (impossible / mis-coded values)',    n_high))
counts.append(('Remaining after AED/m² bounds', len(x)))

x['year'] = x.date.dt.year

# ---------------------------------------------------------------------------
# 4) Match community IDs to geojson polygons
# ---------------------------------------------------------------------------
geoids = {str(f['properties']['COMM_NUM']) for f in geo['features']}
match  = x.comm_num.isin(geoids)
counts.append(('Community ID matches polygon', int(match.sum())))
x = x[match].copy()

# ← NEW: export the validated per-transaction sample
x.to_csv(out / 'validated_sales.csv', index=False, encoding='utf-8')

# ---------------------------------------------------------------------------
# 5) Per community-year summary
# ---------------------------------------------------------------------------
s = (x.groupby(['year', 'comm_num', 'area_name_en'], dropna=False)
       .agg(n=('transaction_id', 'size'),
            median_area=('procedure_area', 'median'),
            median_ppsqm=('meter_sale_price', 'median'),
            median_worth=('actual_worth', 'median'),
            p25_ppsqm=('meter_sale_price', lambda z: z.quantile(.25)),
            p75_ppsqm=('meter_sale_price', lambda z: z.quantile(.75)))
       .reset_index())
s['iqr_ppsqm'] = s.p75_ppsqm - s.p25_ppsqm
s.to_csv(out / 'community_year_summary.csv', index=False, encoding='utf-8')

# ---------------------------------------------------------------------------
# 6) Size-only candidate pairs (price is NOT used in matching)
# ---------------------------------------------------------------------------
records = []
for year, grp in s[s.n >= 12].groupby('year'):
    for i, a in grp.iterrows():
        for j, b in grp.iterrows():
            if int(a.comm_num) >= int(b.comm_num):
                continue
            size_diff = abs(a.median_area - b.median_area) / ((a.median_area + b.median_area) / 2)
            if size_diff <= .10:
                records.append({
                    'year': year,
                    'community_a': a.area_name_en,
                    'community_b': b.area_name_en,
                    'comm_a': int(a.comm_num),
                    'comm_b': int(b.comm_num),
                    'n_a': int(a.n),
                    'n_b': int(b.n),
                    'median_area_a': a.median_area,
                    'median_area_b': b.median_area,
                    'size_difference_pct': 100 * size_diff,
                    'median_ppsqm_a': a.median_ppsqm,
                    'median_ppsqm_b': b.median_ppsqm,
                    'price_gap_b_vs_a_pct': 100 * (b.median_ppsqm / a.median_ppsqm - 1),
                })

pairs = pd.DataFrame(records)
pairs.to_csv(out / 'candidate_pairs.csv', index=False, encoding='utf-8')

# ---------------------------------------------------------------------------
# 7) Console diagnostics
# ---------------------------------------------------------------------------
for yr in [2023, 2024, 2025]:
    sub = s[(s.year == yr) & (s.n >= 12)]
    n_pairs = len(pairs[pairs.year == yr]) if not pairs.empty else 0
    print(yr, 'eligible communities', len(sub), 'candidate pairs', n_pairs)

print('counts', counts)
print('geo', len(geo['features']), 'matched unique', x.comm_num.nunique())
print('price consistency deviation',
      ((x.actual_worth / x.procedure_area - x.meter_sale_price).abs() > 5).sum(),
      'of', len(x))
print('range', x.meter_sale_price.min(), x.meter_sale_price.max())
print('wrote', out)