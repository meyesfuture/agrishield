# schema.md — Backend Schema

## 1. Database Goal

Store source observations separately from calculated signals and alerts.

This makes the system auditable and prevents the frontend from mixing raw facts with model outputs.

## 2. Tables

### commodities

| Column | Type | Notes |
|---|---|---|
| id | uuid/int | Primary key |
| name | text | e.g. Onion |
| unit | text | e.g. quintal |
| active | boolean | Whether monitored |

### locations

| Column | Type | Notes |
|---|---|---|
| id | uuid/int | Primary key |
| state | text | State name |
| district | text | District name |
| latitude | numeric | Optional map position |
| longitude | numeric | Optional map position |

### markets

| Column | Type | Notes |
|---|---|---|
| id | uuid/int | Primary key |
| name | text | Mandi/market name |
| location_id | FK | References locations |

### market_observations

Stores source market data.

| Column | Type | Notes |
|---|---|---|
| id | uuid/int | Primary key |
| market_id | FK | Market |
| commodity_id | FK | Commodity |
| observed_at | timestamp | Source date/time |
| min_price | numeric | Source value |
| max_price | numeric | Source value |
| modal_price | numeric | Source value |
| arrival_quantity | numeric | If supplied |
| arrival_unit | text | If supplied |
| source_name | text | Data source |
| source_url | text | Source page/API |
| raw_reference | text | Optional source record ID |
| created_at | timestamp | Ingestion time |

### satellite_observations

| Column | Type | Notes |
|---|---|---|
| id | uuid/int | Primary key |
| location_id | FK | Location |
| commodity_id | FK nullable | Commodity if known |
| observed_at | timestamp | Satellite observation |
| metric_name | text | e.g. NDVI-derived signal |
| metric_value | numeric | Calculated value |
| source_name | text | Copernicus |
| product_id | text | Satellite product/reference |
| processing_version | text | Calculation version |
| created_at | timestamp | Ingestion time |

### news_items

| Column | Type | Notes |
|---|---|---|
| id | uuid/int | Primary key |
| title | text | Headline |
| source_name | text | Publisher |
| source_url | text | Article URL if permitted |
| published_at | timestamp | Article time |
| commodity_id | FK nullable | Extracted/linked commodity |
| location_id | FK nullable | Extracted/linked location |
| event_type | text | Supply/weather/storage/etc. |
| relevance_score | numeric | 0–1 |
| model_confidence | numeric | 0–1 |
| summary | text | Short evidence summary |
| created_at | timestamp | Ingestion time |

### anomaly_signals

One row per signal used in an alert.

| Column | Type | Notes |
|---|---|---|
| id | uuid/int | Primary key |
| location_id | FK | Location |
| commodity_id | FK | Commodity |
| observed_at | timestamp | Evaluation time |
| signal_type | text | price/arrival/satellite/news/consistency |
| raw_value | numeric nullable | Original metric |
| baseline_value | numeric nullable | Historical reference |
| deviation | numeric nullable | Calculated deviation |
| normalized_score | numeric | 0–100 |
| weight | numeric | Current prototype weight (as applied after any renormalization — see TRD §6) |
| sufficient_data | boolean | False if fewer than the minimum historical observations were available to compute a reliable baseline (see TRD §6). When false, normalized_score must not be treated as a real deviation measurement. |
| source_reference | text | Source record/version |
| created_at | timestamp | Calculation time |

`consistency` is a fifth, derived signal type: it is computed from the other four normalized scores (not from an external source) and measures how much they agree with each other. See TRD §6 for the formula. It is never treated as evidence of wrongdoing on its own — only as a note on how corroborated the other signals are.

### alerts

| Column | Type | Notes |
|---|---|---|
| id | uuid/int | Primary key |
| location_id | FK | Location |
| commodity_id | FK | Commodity |
| evaluated_at | timestamp | Evaluation time |
| risk_score | numeric | 0–100 |
| severity | text | normal/watch/elevated/critical |
| explanation | text | Human-readable explanation |
| recommended_action | text | Usually field verification/monitoring |
| status | text | active/resolved/acknowledged |
| model_version | text | Score version |
| partial_signals | boolean | True if risk_score was computed with one or more signal types missing or marked `sufficient_data = false` |
| missing_signal_types | text | Comma-separated list of signal_type values excluded from this score (empty if none) |
| created_at | timestamp | Creation time |

When `partial_signals` is true, the UI must say so visibly next to the score (e.g. "Computed from 2 of 4 signals") — never render a full-looking score with no indication that part of the evidence was unavailable.

### alert_signals

Join table.

| Column | Type | Notes |
|---|---|---|
| alert_id | FK | Alert |
| signal_id | FK | Anomaly signal |

## 3. Relationships

```text
locations
   |
   +--- markets
   |      |
   |      +--- market_observations --- commodities
   |
   +--- satellite_observations --- commodities
   |
   +--- news_items --- commodities
   |
   +--- anomaly_signals --- commodities
              |
              v
            alerts
              |
              v
        alert_signals
```

## 4. Seed Data

For development only, seed:
- 2 commodities: Onion, Tomato
- 3–5 demo locations
- 30–90 days of clearly labelled synthetic observations if real historical data is not yet connected

Synthetic data must be marked `demo` and must never be presented as official observations.

Once real data is connected, keep real and synthetic datasets distinguishable.

## 5. Data Integrity Rules

- No negative prices.
- No negative arrival quantities.
- Scores must be between 0 and 100.
- Weights must sum to 1.0 for each score version, across whichever signals were actually used (see TRD §6 renormalization rule when a signal is missing).
- Every alert must reference its underlying signals.
- Every source observation must have provenance.
- Never overwrite raw source values with normalized values.
- All prices are stored in INR per quintal unless `market_observations` explicitly records a different unit; do not mix units silently.
- `market_observations` has a uniqueness constraint on `(market_id, commodity_id, observed_at, source_name)` — this is the dedup key referenced in plan.md Phase 3. An incoming record matching an existing key is treated as a duplicate and skipped, not overwritten.
- An `anomaly_signals` row must not be computed from fewer than the minimum historical observations defined in TRD §6; below that threshold, write the row with `sufficient_data = false` and a null `normalized_score` rather than a numerically unstable one.
