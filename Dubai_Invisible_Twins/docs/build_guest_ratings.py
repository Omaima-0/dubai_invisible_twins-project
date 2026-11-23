#!/usr/bin/env python3
"""Regenerate guest_ratings.json from the team's Kaggle ZIP and CS333 GeoJSON.

Usage:
 python docs/build_guest_ratings.py "archive (2).zip" "dubai.geojson" "data/summary.json" "data/guest_ratings.json"
Requires: pandas, shapely.
"""
import io, json, sys, zipfile
from pathlib import Path
import pandas as pd
from shapely.geometry import Point, shape
from shapely.strtree import STRtree

archive, geo_path, summary_path, output_path = map(Path, sys.argv[1:5])
with zipfile.ZipFile(archive) as z:
    rows = pd.read_csv(io.BytesIO(z.read("listings_monthly.csv")))
geo = json.loads(geo_path.read_text(encoding="utf-8"))
summary = json.loads(summary_path.read_text(encoding="utf-8"))
valid = {(int(x["year"]), int(x["community"])) for x in summary}
names = {int(x["community"]): x["name"] for x in summary}
shapes = [shape(f["geometry"]) for f in geo["features"]]
index = STRtree(shapes)
rows["year"] = pd.to_datetime(rows["month_date"]).dt.year
rows = rows[
    rows["year"].between(2023, 2025)
    & (rows["bedrooms"] == 1)
    & (rows["room_type"] == "entire_home")
    & rows["star_rating"].between(1, 5)
    & (rows["num_reviews"] > 0)
].sort_values("month_date").drop_duplicates(["listing_id", "year"], keep="last").copy()

def locate(row):
    if pd.isna(row["latitude"]) or pd.isna(row["longitude"]):
        return None
    matches = index.query(Point(float(row["longitude"]), float(row["latitude"])), predicate="intersects")
    return int(geo["features"][int(matches[0])]["properties"]["COMM_NUM"]) if len(matches) == 1 else None

rows["community"] = rows.apply(locate, axis=1)
rows = rows[rows.apply(lambda r: (int(r["year"]), r["community"]) in valid, axis=1)]
grouped = rows.groupby(["year", "community"]).agg(
    n=("listing_id", "nunique"),
    rating=("star_rating", "mean"),
    median=("star_rating", "median"),
    reviews=("num_reviews", "sum")
).reset_index()
result = [{
    "year": int(r.year), "community": int(r.community), "name": names[int(r.community)],
    "n": int(r.n), "rating": round(float(r.rating), 3),
    "median": round(float(r.median), 3), "reviews": int(r.reviews)
} for r in grouped.itertuples()]
output_path.write_text(json.dumps(result, separators=(",", ":")), encoding="utf-8")
print(f"{len(rows)} unique listing-years; {len(result)} community-years; "
      f"{sum(x['n'] >= 5 for x in result)} with n >= 5")
