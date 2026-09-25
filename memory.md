# memory.md — Dynamic Context Tracker

## Purpose

This file is the persistent context for AI coding sessions.

Any AI coding assistant must read this file before changing the architecture.

Update it after meaningful implementation decisions.

---

# Current Project

**Name:** AgriShield  
**Purpose:** Early-warning system for agricultural commodity supply anomalies.

## Current MVP

- 1–2 commodities
- Limited Indian regions/markets
- Market price + arrivals
- Statistical anomaly detection
- One satellite/crop-condition signal
- News/context signal
- Explainable dashboard

---

# Non-Negotiable Rules

## Rule 1 — No Fabricated Data

Never invent:
- market prices
- arrivals
- satellite values
- article counts
- source names
- API responses
- model accuracy
- government statistics

If data is unavailable, say so.

## Rule 2 — No False Claims

The system detects anomalies.

It does NOT:
- prove hoarding
- prove manipulation
- accuse people
- identify guilty warehouses
- guarantee future prices
- replace regulatory investigation

## Rule 3 — Evidence First

Every important number must have:
- source
- timestamp
- calculation method when derived

## Rule 4 — Keep It Simple

Do not introduce a new framework, service, model, or dependency unless it solves a real current problem.

## Rule 5 — Preserve Architecture

Before changing:
- database structure
- API contracts
- score calculation
- frontend navigation

check existing files first.

## Rule 6a — Partial Signals Are Normal, Never Hidden

Not every alert will have all four base signals. When one is missing or has fewer than 14 historical observations:
- exclude it and renormalize the remaining weights (TRD §6.2)
- mark `alerts.partial_signals = true` and list what's missing
- show "No data" on that evidence card, never a fabricated or zero value
- never emit a risk_score with zero usable signals — show "no data available" instead

## Rule 6b — One Path to the Database

The frontend only ever reads/writes through FastAPI. No direct Supabase-client-from-frontend path, even for convenience — it would bypass the anomaly engine and provenance logic.

## Rule 6c — Demo Must Not Depend on Live External Calls

The demo region's satellite signal is precomputed and stored like any other real observation before the expo, not fetched live. A `DEMO_MODE` flag serves cached fixture responses for OGD/Copernicus/news through the same code path as live data, clearly labeled `demo`.

## Rule 6 — No Silent Breaking Changes

If a schema/API change is necessary:
1. explain why
2. update schema.md
3. update TRD.md if architecture changes
4. update flow.md if user flow changes
5. update this file

---

# Current Architecture

```text
Data Sources
    ↓
Processing
    ↓
PostgreSQL
    ↓
Anomaly Engine
    ↓
FastAPI
    ↓
React
```

---

# Current Score

Prototype weights:

```text
Price anomaly      35%
Arrival anomaly    35%
Satellite signal   20%
News signal        10%
```

These are prototype values, not validated official weights.

---

# Frontend Direction

Use the supplied visual references:

- white/black
- electric blue accent
- bold editorial typography
- thin borders
- generous whitespace
- analytical cards
- progress bars
- expandable evidence/alert cards
- minimal animation

The interface should feel like a serious analytical product.

---

# Current Screens

1. Overview
2. Alert Detail
3. Evidence Timeline
4. Market Detail
5. Methodology

---

# Data Status

## Market Data
Status: **To be connected**

Primary candidate:
OGD Platform India mandi dataset.

## Satellite Data
Status: **To be implemented**

Primary candidate:
Copernicus Data Space Ecosystem / Sentinel-2.

## News
Status: **To be implemented**

Use only an accessible and permitted source.

## Demo Data
Allowed during development.

Must be explicitly labelled as synthetic/demo data.

---

# Decisions Log

## 2026-09-25
- Chose an anomaly-detection product rather than a direct "hoarding detector."
- Removed GNN from MVP.
- Removed truck detection from MVP.
- Chose explainability and evidence trail as core differentiators.
- Chose a polished card-based analytical UI.
- Chose a small regional/commodity scope for the expo.
- Chose deterministic/statistical anomaly detection before advanced ML.

## 2026-09-25 (review pass)
- Defined behavior for missing/insufficient signals: exclude + renormalize weights, flag `partial_signals`, never fabricate a value (see Rule 6a; schema.md `alerts.partial_signals`/`missing_signal_types`, `anomaly_signals.sufficient_data`).
- Set minimum-history threshold for a valid baseline at 14 observations (TRD §6.1).
- Defined the "Cross-Signal Consistency" score bar, previously only in design.md's mockup with no formula (TRD §6.3).
- Resolved a DB-access inconsistency: frontend goes through FastAPI only, no direct Supabase path (Rule 6b).
- Decided the demo-day satellite signal is precomputed, not fetched live; added a `DEMO_MODE` fixture-fallback flag (Rule 6c; TRD §10.1).
- Added `GET /api/alerts/{id}/report` to close the gap between flow.md's export step and PRD F7.
- Added a dedup uniqueness constraint and an explicit INR/quintal unit assumption to schema.md.
- Added retry/backoff to external-call error handling.
- Planned a retrospective validation task: backtest the anomaly engine against a known historical price-spike event (added to plan.md Phase 4/8).
- **Update**: Decided to use Supabase for database hosting and Authentication (Free Tier). React will use Supabase Auth for login, and FastAPI will verify the Supabase JWT.

## 2026-09-25 (Project Skeleton & Phase 1 UI)
- Created the application skeleton (Phase 0).
- Created a FastAPI app at `backend/main.py`.
- Initialized SQLite DB connection for demo mode at `backend/app/database.py`.
- Created React frontend with Vite + Tailwind CSS.
- Implemented Phase 1 UI (Overview, Alert Detail with Recharts, Methodology) using labelled `mockData.ts`.
- Configured React Router to navigate between Dashboard, Alert Detail, and Methodology pages.

---

# Known Risks

1. Market dataset fields may differ from assumptions.
2. Satellite processing can become time-consuming.
3. News collection may have API/licensing restrictions.
4. Free hosting/database limits can change.
5. A correlation between signals does not prove causation.
6. The anomaly score requires validation before real-world deployment.

---

# AI Coding Instructions

When asked to implement a feature:

1. Read PRD.md
2. Read TRD.md
3. Read schema.md
4. Read design.md
5. Read flow.md
6. Read plan.md
7. Read this file
8. Inspect the existing code
9. Implement the smallest correct change
10. Test it
11. Update relevant documentation
12. Update this file if a meaningful decision changed

Never rebuild unrelated parts of the project just because a cleaner architecture is possible.

---

# Session Handoff

At the end of each coding session, update:

- What was completed
- What remains
- Files changed
- New dependencies
- API/schema changes
- Known bugs
- Next recommended task

## Current Session

**Status:** Phases 4, 5, and 8 complete.

**What was completed:**
- Created `backend/scripts/ingest_ogd.py` to fetch real market data from the Open Government Data (OGD) platform.
- Implemented `DEMO_MODE` fallback using a new fixture file `backend/fixtures/ogd_sample.json` as specified in TRD Section 10.1.
- Updated `engine.py` to safely handle incomplete incoming live data (e.g. missing `arrival_quantity` from OGD records).
- Previously completed Phases 4, 5, and 8.

**What remains:**
- Expand the frontend to visualize the newly generated signal types and validations.
- Phase 9 (Expo Polish) to make the UI look slick for the presentation.

**Files changed:**
- `backend/seed.py`
- `backend/test_validation.py`
- `memory.md` (session handoff updated)

**New dependencies:**
- `pytest` for validation tests.

**API/schema changes:**
- None.

**Known bugs:**
- None.

**Next recommended task:**
Review overall MVP functionality and UI components for demo readiness.
