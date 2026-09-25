# design.md — UI/UX Design Brief

## 1. Visual Direction

The interface should follow the supplied reference style:

- Editorial / analytical
- High contrast
- White and near-black surfaces
- Electric blue as the primary accent
- Large bold headings
- Strong typography hierarchy
- Thin borders
- Generous whitespace
- Minimal decoration
- Data cards with clear numbers
- Horizontal signal bars
- Card-based information architecture
- Subtle motion only where useful

The product should feel like a serious analytical tool, not a generic AI dashboard.

## 2. Design Tokens

### Colors

```text
Background: #FFFFFF
Primary text: #111111
Secondary text: #6B6B6B
Primary blue: #2457FF
Light blue: #EEF3FF
Border: #D9D9D9
Muted surface: #F5F5F5
Critical accent: use sparingly and only for status
```

Do not fill the entire interface with blue.

### Typography

Preferred:
- Inter
- Geist
- IBM Plex Sans

Use:
- Heavy/bold display headings
- Medium labels
- Regular body text
- Monospaced numbers only where useful

## 3. Layout

Desktop-first for the expo.

Recommended structure:

```text
┌──────────────────────────────────────────────┐
│ Logo / Product              Date / Status    │
├──────────────────────────────────────────────┤
│                                              │
│ LARGE PAGE HEADING                           │
│ Short explanatory sentence                  │
│                                              │
├──────────────────────────────────────────────┤
│ KPI CARD │ KPI CARD │ KPI CARD │ KPI CARD   │
├──────────────────────────────────────────────┤
│                                              │
│ MAP / MAIN ANALYTICAL VIEW                   │
│                                              │
├──────────────────────┬───────────────────────┤
│ ALERT CARD           │ SIGNAL SUMMARY        │
│                      │                       │
└──────────────────────┴───────────────────────┘
```

## 4. Screens

### Screen 1 — Overview

Hero:
> Agricultural Supply Intelligence

Subtitle:
> Detect unusual market conditions before they become larger supply problems.

Cards:
- Active Alerts
- Markets Monitored
- Commodities
- Highest Risk

Main:
- India/regional map
- Alert list

### Screen 2 — Alert Detail

Header:
> Onion — Nashik

Large score:

> 84 / 100

Label:

> CRITICAL — INVESTIGATION SIGNAL

Then four evidence cards:

```text
PRICE
+18.4%

ARRIVALS
-27.8%

CROP SIGNAL
NORMAL

NEWS SIGNAL
HIGH
```

If a signal is unavailable or has insufficient history (schema.md `sufficient_data = false`), its card shows `No data` / `Insufficient history` in the secondary-text color — never a fabricated or zeroed-out value, and never silently omitted. When any card is in this state, the score header must also show the "Computed from N of 4 signals" note from schema.md's `alerts.partial_signals`.

Then a horizontal contribution view.

### Screen 3 — Evidence Timeline

Display:

```text
DATE        EVENT
Sep 18      Arrival decline detected
Sep 19      Price deviation increased
Sep 20      News supply signal detected
Sep 21      Combined anomaly crossed threshold
```

### Screen 4 — Market Detail

Use:
- price line chart
- arrivals line/bar chart
- historical baseline
- current observation marker

### Screen 5 — Methodology

Explain:
- Data sources
- Signal generation
- Risk score
- Limitations

This screen is important for judges.

## 5. Card / Flashcard Style

Use compact cards that behave visually like flashcards:

### Front
- Commodity
- Location
- Risk score
- One-line reason

### Expanded state
Reveal:
- Supporting metrics
- Signal contributions
- Timeline
- Sources
- Recommended action

Interaction:

```text
Click / tap card
      ↓
Card expands
      ↓
Evidence becomes visible
```

Do not hide critical safety/provenance information permanently behind animation.

## 6. Score Component

Inspired by the reference:

```text
SUPPLY ANOMALY SCORE

Price Anomaly              78%
██████████████████████░░

Arrival Anomaly            91%
████████████████████████░

Crop Signal                 32%
████████░░░░░░░░░░░░░░░░

News Signal                 68%
█████████████████░░░░░░░░

Cross-Signal Consistency    84%
█████████████████████░░░
```

The last line must be clearly defined as a consistency/aggregation metric, not as proof of wrongdoing. It is derived from how much the other (available) signals agree with each other — see TRD §6.3 for the formula — and is computed only from signals that aren't already showing `No data`. Label it in the UI with a short inline explainer (e.g. "How closely the available signals agree — not a measure of certainty") so a judge doesn't read it as a 5th independent piece of evidence.

## 7. Interaction Rules

- Hover states should be subtle.
- Cards may expand.
- Charts should show exact values on hover.
- Every chart needs a source label.
- Every alert needs a timestamp.
- Never use fake live animations.
- Avoid excessive gradients.
- Avoid glassmorphism.
- Avoid excessive rounded cards.

## 8. Responsive Design

Desktop:
- Full dashboard
- Map + alert panels

Tablet:
- Stack analytical panels

Mobile:
- Cards stack vertically
- Map becomes secondary
- Evidence remains readable

## 9. Accessibility

- High text contrast
- Do not communicate severity using color alone
- Use labels such as `Critical`, `Elevated`, `Watch`
- Keyboard accessible cards
- Charts need text summaries

## 10. Design Rule

If a visual element does not help the user understand:
**what happened, why it matters, or what to inspect next, remove it.**
