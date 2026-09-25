# flow.md — Application Flow Map

## 1. Main Flow

```text
LANDING / OVERVIEW
        |
        v
SELECT COMMODITY + REGION
        |
        v
MARKET OVERVIEW
        |
        v
ALERT LIST
        |
        v
SELECT ALERT
        |
        v
ALERT DETAIL
        |
        +-------------------+
        |                   |
        v                   v
EVIDENCE                TIMELINE
        |                   |
        +---------+---------+
                  |
                  v
             RECOMMENDED
                ACTION
                  |
                  v
           MARK / EXPORT
```

`EXPORT` calls `GET /api/alerts/{id}/report` (TRD §5) and renders the concise, presentation-ready summary from PRD F7 — same evidence, reshaped for handing to a reviewer rather than for the interactive dashboard. `MARK` updates `alerts.status` (active/resolved/acknowledged).

## 2. Overview State

User enters the application.

Show:
- system status
- monitored commodities
- active alerts
- map
- recent alerts

CTA:
> View alerts

## 3. Filtering State

User selects:
- commodity
- state
- district
- market
- date range

The application updates the visible dataset.

If no data exists:
> No observations available for the selected filters.

Do not fabricate a result.

## 4. Alert State

Alert card contains:

```text
Commodity
Location
Risk score
Severity
Primary reason
Observation time
```

User can open the card.

## 5. Alert Detail State

Show:

1. Risk score
2. Why it was flagged
3. Signal breakdown
4. Price history
5. Arrival history
6. Crop/satellite signal
7. Relevant news
8. Timeline
9. Recommended next action
10. Data sources

## 6. Evidence State

Each evidence card must answer:

> What was observed?

> Compared with what baseline?

> When?

> From which source?

### 6.1 Partial Signal State

If one or more of the four base signals is unavailable or below the minimum-data threshold (TRD §6.1), that card shows `No data` / `Insufficient history` instead of a value, and the alert's risk score header shows "Computed from N of 4 signals" (schema.md `partial_signals`). This is a normal, expected state — not an error — and must never be hidden or filled in with a placeholder number.

## 7. Recommended Action

The system should use cautious wording:

Examples:
- `Monitor closely`
- `Review recent mandi arrivals`
- `Consider field verification`
- `Review storage/supply reports`

Never:
- `Hoarding confirmed`
- `Warehouse X is guilty`
- `Take enforcement action`

## 8. Loading States

Use skeleton cards and charts.

Never show fabricated numbers while loading.

## 9. Error States

Example:

> Market data unavailable  
> Last successful update: 10:30 IST  
> Try again or view the last verified observation.

## 10. Empty States

Example:

> No anomaly detected for this selection.

This means:
- enough data was available
- current signals did not cross the prototype threshold

It does NOT mean:
- hoarding cannot be occurring

## 11. Demo Flow

Recommended expo flow:

```text
1. Open Overview
2. Show active alerts
3. Select Onion
4. Select Nashik
5. Open highest-risk alert
6. Show 84/100 score
7. Reveal four signals
8. Open price/arrival charts
9. Show satellite/crop signal
10. Show relevant news
11. Explain: "This is an investigation lead, not proof."
12. Show recommended action
```

Target demo duration:
**2–4 minutes.**
