# plan.md — Implementation Plan

## Guiding Rule

Build the smallest working version first.

Do not start with satellite APIs, news AI, or complex ML.

---

# Phase 0 — Project Setup

### Goal
Create the application skeleton.

Tasks:
- Create repository
- Create React frontend
- Create FastAPI backend
- Create database connection
- Add environment variables
- Add basic linting/formatting
- Add README

**Exit condition:** App runs locally.

---

# Phase 1 — UI With Demo Data

### Goal
Make the complete frontend flow work.

Build:
- Overview
- Alert cards
- Filters
- Alert detail
- Charts
- Evidence cards
- Methodology screen

Use clearly labelled synthetic/demo data.

**Exit condition:** A judge can complete the demo without a backend.

---

# Phase 2 — Database & Authentication

### Goal
Create the real data model and secure the application via Supabase.

Build:
- Supabase Project setup
- User Login screen (Frontend)
- JWT verification middleware (FastAPI)
- commodities
- locations
- markets
- market_observations
- satellite_observations
- news_items
- anomaly_signals
- alerts

Add seed data.

**Exit condition:** Frontend reads data from the database.

---

# Phase 3 — Real Market Data

### Goal
Connect the market dataset.

Tasks:
- Inspect live OGD schema
- Download/query a small sample
- Map fields into `market_observations`
- Validate units
- Validate dates
- Store source references
- Remove duplicate records (unique key: market_id + commodity_id + observed_at + source_name — see schema.md §5)
- Confirm/record unit assumption (INR per quintal)

**Exit condition:** At least one monitored commodity has verified market observations.

---

# Phase 4 — Anomaly Engine

### Goal
Generate explainable anomaly signals.

Implement:
- historical price baseline
- historical arrival baseline
- normalized deviations
- minimum-data threshold (14 observations) below which a signal is `sufficient_data = false` instead of scored
- weight renormalization when a signal is missing or excluded (TRD §6.2)
- weighted score
- severity bands
- explanation generator

Start with deterministic Python calculations.

Once real historical price data is connected (Phase 3), backtest the engine against at least one known historical onion/tomato price-spike event and record whether/when it would have flagged it — this becomes evidence for the Methodology screen, not just an internal check.

**Exit condition:** Given the same input, the system produces the same score, and the backtest result is documented.

---

# Phase 5 — Satellite Signal

### Goal
Add one useful satellite-derived signal.

Tasks:
- Define one test region
- Access Sentinel-2 data
- Select appropriate observations
- Handle clouds/quality
- Calculate a simple vegetation/crop-condition metric
- Store processed result

Do NOT:
- detect trucks
- identify warehouses
- build a custom deep-learning model

For the region/commodity used in the actual expo demo, compute this signal ahead of time and store it as a real observation — do not depend on a live Copernicus call during judging (see TRD §10).

**Exit condition:** One region has a reproducible satellite-derived signal.

---

# Phase 6 — News Signal

### Goal
Add supporting contextual evidence.

Tasks:
- Select an allowed source
- Collect a small set of articles
- Extract commodity/location
- Classify event type
- Calculate relevance
- Store article metadata
- Link relevant articles to alerts

**Exit condition:** An alert can display supporting news evidence.

---

# Phase 7 — Integration

### Goal
Connect all signals.

Pipeline:

```text
Market
  +
Satellite
  +
News
  ↓
Signal generation
  ↓
Weighted score
  ↓
Alert
  ↓
Explanation
```

**Exit condition:** A real/demo case produces a complete evidence trail.

---

# Phase 8 — Validation

### Goal
Prevent misleading output.

Test:
- missing market data
- missing satellite data
- no news
- abnormal price only
- abnormal arrivals only
- fewer than 14 historical observations (`sufficient_data = false` path)
- zero usable signals (must show "no data available," never a score)
- conflicting signals (check the consistency score reflects this)
- duplicate records
- invalid values
- stale data

Verify that the application never turns missing data into a zero-risk claim, and that every `partial_signals` alert visibly says so.

**Exit condition:** All known failure cases behave correctly.

---

# Phase 9 — Expo Polish

### Goal
Make the product presentation-ready.

Tasks:
- typography
- spacing
- animations
- responsive layout
- map
- alert cards
- loading states
- error states
- source labels
- methodology page
- demo dataset fallback (`DEMO_MODE` flag, TRD §10.1)
- export/report view (`GET /api/alerts/{id}/report`)

**Exit condition:** 2–4 minute demo works reliably.

---

# Phase 10 — Final Verification

Before presenting:

- No fake source names
- No fabricated statistics
- No fake "live" labels
- No API keys in code
- No unsupported claims
- No "hoarding proven" wording
- Every score traceable to inputs
- Every demo-only value marked
- Demo works without internet if possible

## Priority Order

```text
P0: Working dashboard
P0: Verified market data
P0: Explainable anomaly score
P0: Reliable demo

P1: Satellite signal
P1: News signal

P2: Advanced forecasting
P2: More commodities
P2: More regions

Never required for MVP:
GNN
Truck detection
Nationwide deployment
Autonomous enforcement
```
