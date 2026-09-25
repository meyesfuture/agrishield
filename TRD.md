# TRD.md — Technical Requirements Document

## 1. Technical Goal

Build a small, reliable web application that ingests market data and selected external signals, calculates explainable supply anomalies, and presents them through a polished dashboard.

The system is designed for an expo MVP, not production-scale national deployment.

## 2. Architecture

```text
External Data
    |
    +--> Mandi / Market Data
    |
    +--> Satellite / Crop Signal
    |
    +--> News Articles
            |
            v
       Data Processing
            |
            v
      PostgreSQL Database
            |
            v
      Anomaly Engine
            |
            v
       FastAPI Backend
            |
            v
      React Frontend
```

## 3. Recommended Stack

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS
- Recharts or another lightweight chart library
- Leaflet/OpenStreetMap for the geographic view

### Backend
- Python
- FastAPI
- Pandas
- NumPy
- scikit-learn only where useful

### Database
- PostgreSQL
- Supabase can be used for the hosted MVP.

Supabase's current free plan provides a small PostgreSQL database suitable for an expo prototype. Verify current limits before deployment.

### Satellite
Use Copernicus Data Space Ecosystem services for Sentinel data.

Start with Sentinel-2 where optical vegetation/crop-condition information is appropriate.

Do not make truck detection a core dependency.

### News
Use a legally accessible news/feed source available to the team. If a source has no usable API or its terms do not permit the intended collection, use manually collected/licensed article samples for the demo.

### AI/NLP
Use an available LLM only for:
- Article classification
- Structured extraction of commodity/location/event
- Short evidence summaries

The LLM must not invent numerical market or satellite values.

## 4. Data Sources

### Market data

Primary candidate:
- Open Government Data (OGD) Platform India
- Dataset: Current Daily Price of Various Commodities from Various Markets (Mandi)

The dataset page currently identifies daily granularity and fields related to commodity/market pricing. The implementation team must inspect the live schema before writing the ingestion code.

### Satellite data

Primary:
- Copernicus Data Space Ecosystem
- Sentinel-2

Use satellite data to derive a limited crop-condition/vegetation signal.

The implementation must document:
- Area of interest
- Observation date
- Product/collection
- Processing method
- Cloud filtering or quality handling

### News

News is an auxiliary signal, not ground truth.

Store:
- headline
- source
- publication time
- article URL when permitted
- extracted commodity
- extracted location
- event category
- relevance
- model confidence

## 5. API Requirements

### GET /api/overview
Returns:
- monitored locations
- active alerts
- top alerts
- summary statistics

### GET /api/alerts
Parameters:
- commodity
- state
- district
- severity
- date range

### GET /api/alerts/{id}
Returns:
- alert
- score components
- source observations
- supporting news
- timeline

### GET /api/markets
Returns market observations.

### GET /api/markets/{market_id}/history
Returns historical price/arrival observations.

### GET /api/health
Returns service health.

### GET /api/alerts/{id}/report
Returns a concise, presentation-ready summary of one alert (score, signal breakdown, timeline, sources, recommended action) — the data backing PRD F7 and the "MARK / EXPORT" step in flow.md. Same underlying data as `/api/alerts/{id}`, reshaped for display/printing rather than for the interactive dashboard.

## 6. Anomaly Engine

Use transparent statistical baselines.

Possible first implementation:

```text
historical median/mean
        |
current observation
        |
percentage deviation or standardized deviation
        |
normalized 0–100 anomaly signal
```

Do not claim that the first prototype is a scientifically validated detector of hoarding.

### 6.1 Minimum data threshold

A price or arrival baseline must not be computed from fewer than **14 historical observations** for that market/commodity pair. Below this threshold:

- Write the `anomaly_signals` row with `sufficient_data = false` and `normalized_score = null`.
- Exclude that signal from the weighted score (see §6.2).
- The UI shows "Insufficient history" for that signal instead of a number.

This exists because a z-score or percentage deviation computed on a handful of points is noisy enough to be misleading — it must not be presented with the same confidence as a well-supported one.

### 6.2 Handling missing or excluded signals

Not every alert will have all four base signals (price/arrival/satellite/news) available — satellite and news are P1 and may be absent for a given location on a given day, and §6.1 can exclude price or arrival too.

Rule:
1. Take only the signals that are present **and** `sufficient_data = true`.
2. Renormalize their prototype weights to sum to 1.0 (e.g. if only price [35] and arrival [35] are available, each becomes 0.5 instead of 0.35).
3. Compute `risk_score` from the renormalized weights.
4. Set `alerts.partial_signals = true` and populate `missing_signal_types` with whatever was excluded.
5. If **zero** signals are usable, do not create an alert with a score — the location simply shows "no data available for this selection," per flow.md §3. Never emit a risk_score with no underlying signals.

### 6.3 Cross-Signal Consistency (the 5th score bar in design.md)

`consistency` is derived, not observed. Prototype formula:

```text
consistency_score = 100 - (standard_deviation of the normalized_scores actually used) 
```

i.e. signals that broadly agree (all high or all low) produce a high consistency score; signals that disagree (one flags critical, another shows nothing unusual) produce a low one. It is computed only from signals with `sufficient_data = true` and folds in with the same exclusion/renormalization logic as §6.2 — it does not get its own prototype weight in the 35/35/20/10 table, and it must never be described to a judge or user as evidence of wrongdoing by itself. It answers "how much do the signals agree," not "how likely is this hoarding."

## 7. Data Freshness

Every source record must contain an observation/publication timestamp.

The UI must show:
- `Observed`
- `Updated`
- `Calculated`

Do not call cached demo data "live".

## 8. Error Handling

The application must:
- show a clear error when a source is unavailable
- never silently replace missing live data with fake values
- distinguish `missing`, `estimated`, and `demo` values
- log failed ingestion jobs
- retry a failed external call (OGD, Copernicus, news source) with exponential backoff (e.g. up to 3 attempts) before marking that ingestion job failed — a single transient network blip should not surface as a false "source unavailable" state

## 9. Security

- **Authentication**: We use Supabase Auth. The frontend uses the Supabase client *only* to log in and manage the session (obtaining a JWT). The frontend attaches this JWT as a Bearer token to all FastAPI requests. FastAPI verifies the JWT using the Supabase JWT Secret before returning any data.
- Store API keys only in environment variables.
- Never commit secrets.
- Never expose private service keys in the frontend.
- Validate API input.
- Sanitize external text before rendering.
- The frontend never talks to the database data tables directly — all data reads and writes go through FastAPI, per the architecture in §2. The only direct frontend-to-Supabase connection permitted is for Auth/Login.

## 10. Performance

For the expo:
- Precompute expensive satellite features. Specifically: for the one demo region/commodity used in the presentation flow, compute the Sentinel-2 signal ahead of time and store it as a normal `satellite_observations` row (real `source_name`, `product_id`, `observed_at`) — do not depend on a live Copernicus call during judging. Live satellite fetching can remain available for other regions where time allows, but the demo path must not require it.
- Cache historical data.
- Keep the dashboard fast.
- Avoid downloading full satellite archives during a live demo.
- Prefer processed/statistical outputs over raw imagery.

### 10.1 Demo mode

Add a `DEMO_MODE` environment flag. When set, the backend serves cached/fixture responses for OGD, Copernicus, and news calls instead of live ones, through the exact same code path and response shape the live integrations use — so the frontend and anomaly engine behave identically either way. Fixture data still follows the `demo` labeling convention in schema.md §4; it is not presented as live. This is what makes "demo works without internet" (plan.md Phase 10) an actual implementation rather than an aspiration.

## 11. Deployment

Preferred low-cost/free prototype setup:
- Frontend: a free static hosting platform such as Vercel or Cloudflare Pages.
- Backend: a free/low-cost service only if available within current limits; otherwise run the FastAPI backend locally for the expo.
- Database: Supabase free tier or local PostgreSQL/SQLite for a completely local demo.

The application must remain runnable locally even if a third-party free tier changes.

## 12. Technical Non-Goals

- Microservices
- Kubernetes
- Kafka
- Graph Neural Networks
- Custom deep-learning satellite model
- Real-time truck tracking
- Nationwide production infrastructure
- Automated enforcement
