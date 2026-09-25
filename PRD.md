# PRD.md — Product Requirements Document

## 1. Product

**Working name:** AgriShield  
**Product type:** Agricultural commodity supply-anomaly early-warning dashboard  
**Primary purpose:** Help users identify districts/mandis where price, arrivals, crop-condition signals, and local reporting show an unusual supply pattern that deserves verification.

## 2. Problem

Commodity price spikes can be difficult to investigate early because relevant signals are distributed across market data, agricultural observations, and news.

The product will combine these signals into a single, explainable **Supply Anomaly Risk Score** and an investigation-oriented dashboard.

### Critical wording rule

The system **does not prove hoarding** and does not identify a person or warehouse as guilty.

It detects unusual patterns and recommends **field verification / further investigation**.

## 3. Target Users

### Primary
- Government/regulatory users monitoring agricultural commodity markets.
- Analysts who need a quick way to identify unusual district/mandi conditions.

### Secondary
- Researchers and students demonstrating agricultural-market analytics.
- Other users interested in commodity supply conditions.

## 4. MVP Scope

The expo MVP will focus on:

- 1–2 commodities, preferably onion and tomato.
- A limited set of Indian states/districts/mandis.
- Historical market price and arrival data.
- A statistical anomaly engine.
- A satellite-derived crop-condition signal where technically available.
- News classification for relevant supply events.
- A dashboard showing alerts, evidence, trends, and explanations.
- Basic Authentication (via Supabase) to secure the dashboard.

## 5. Core User Story

> As a market-monitoring user, I want to see which commodity/region has an unusual supply pattern, understand why it was flagged, and decide whether it deserves verification.

## 6. Core Features

### F1 — Overview Dashboard
Show:
- Total monitored locations
- Active alerts
- Highest-risk commodity/location
- Price and arrival trends
- Alert distribution by severity

### F2 — Region/Commodity Monitoring
User can select:
- State
- District/market
- Commodity
- Date range

### F3 — Anomaly Detection
Calculate separate signals for:
- Price deviation
- Arrival deviation
- Crop-condition deviation/signal
- Relevant news/supply-event signal

Combine them into a transparent risk score. If a signal is unavailable or has too little history to be reliable, it is excluded and the remaining weights are renormalized — the alert is then visibly marked as based on partial signals rather than presenting a full-looking score. A score is never shown with zero underlying signals.

### F4 — Explainable Alert
Every alert must show:
- Risk score
- Individual signal contributions
- Historical comparison
- Current observations
- Data timestamp
- Explanation
- Suggested next action

### F5 — Investigation Detail
A user can open an alert and see:
- Price chart
- Arrival chart
- Crop/satellite signal
- Relevant news cards
- Timeline
- Reason for alert

### F6 — Data Provenance
Every displayed metric must identify:
- Source
- Observation date/time
- Whether it is raw, calculated, or model-generated

### F7 — Demo-Friendly Reports
Allow the user to view a concise alert summary suitable for presentation or internal review.

## 7. Risk Score

The MVP should use a transparent weighted model rather than a black-box GNN.

Initial configuration:

| Signal | Weight |
|---|---:|
| Price anomaly | 35% |
| Arrival anomaly | 35% |
| Crop/satellite signal | 20% |
| News/supply-event signal | 10% |

**Important:** These are initial prototype weights, not scientifically validated national weights.

The UI must label the score as a prototype indicator.

## 8. Severity

Suggested display bands:

- 0–29: Normal
- 30–59: Watch
- 60–79: Elevated
- 80–100: Critical

These bands are UX categories for the prototype and should not be presented as official government thresholds.

## 9. Non-Goals

Do NOT build in the MVP:

- Nationwide real-time surveillance.
- Individual warehouse identification.
- Individual/person-level accusations.
- Automatic enforcement actions.
- Automatic government alerts.
- Truck-by-truck detection.
- Graph Neural Networks.
- A custom foundation model.
- Complex multi-agent architecture.
- Automatic price forecasting for every commodity.
- A mobile app.
- A public social platform.

## 10. Success Criteria

The expo MVP is successful if a judge can:

1. Select a commodity and location.
2. See real or clearly labelled demo data.
3. See an anomaly being detected.
4. Understand why it was detected.
5. Inspect the supporting signals.
6. Understand that the result is an investigation lead, not proof of wrongdoing.
7. Complete the flow without technical assistance.
8. See at least one example of the anomaly engine backtested against a real historical price-spike event, showing it would have flagged it.

## 11. Product Principles

1. **Evidence before claims.**
2. **Explain every score.**
3. **Never fabricate data.**
4. **Prefer simple validated methods over impressive unnecessary technology.**
5. **Keep the product usable by a non-technical decision maker.**
6. **Separate observed facts from model interpretation.**
