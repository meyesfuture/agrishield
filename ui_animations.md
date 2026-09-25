# UI/UX & Animations Plan: The "Supabase" Aesthetic

This document outlines the detailed plan for the AgriShield UI and animations, targeting a premium, developer-centric aesthetic (akin to Supabase, Vercel, or Linear) while avoiding generic "slop" or over-animated templates.

## 1. Core Aesthetic Vision

The UI must feel like a **serious analytical tool**. It should prioritize data density and clarity over decorative fluff.

*   **Color Palette (High Contrast & Monochromatic)**:
    *   **Background**: True black (`#000000`) or very dark gray (`#111111`) for dark mode (preferred for the premium dashboard look), with stark white (`#FFFFFF`) for light mode.
    *   **Surfaces/Cards**: Slightly elevated grays (`#1A1A1A` / `#F5F5F5`) with 1px borders (`#27272A` / `#D9D9D9`).
    *   **Accent**: Electric Blue (`#2457FF`). Used *only* for active states, primary buttons, or critical data points. 
    *   **Glows**: Subtle, localized glows (e.g., `box-shadow: 0 0 20px rgba(36, 87, 255, 0.15)`) on active elements, never overwhelming.
*   **Typography**:
    *   **Font**: *Geist* or *Inter*. Geist provides a more technical, premium feel perfect for data-heavy apps.
    *   **Hierarchy**: Heavy/bold for numbers and KPIs. Monospaced (`Geist Mono` or `JetBrains Mono`) for data values, scores, and timestamps.
*   **Borders & Radii**:
    *   **Border Radius**: Sharp but accessible (`4px` to `8px` maximum). Avoid pill-shaped or heavily rounded cards. 
    *   **Borders**: Hairline borders on all cards and interactive elements. No floating elements without a defined edge.

## 2. Animation Philosophy

Animations should be **physics-based, intentional, and snappy**. Based on the references in `ani.txt`, we will use precise spring physics rather than generic ease-in-out transitions.

*   **Micro-interactions (Hovers, Toggles)**: Fast and responsive (150ms - 200ms).
*   **Structural Changes (Card Expansions, Menus)**: Fluid but decisive (300ms - 400ms).
*   **Easing**: Use spring physics (e.g., `stiffness: 400, damping: 30`) or precise cubic-beziers (e.g., `cubic-bezier(0.16, 1, 0.3, 1)`).
*   **No "Wait" Time**: Animations must never block the user from reading data.

## 3. Component-Specific Animation Plans

Drawing inspiration from `ani.txt`, here is how we will animate specific components:

### A. The Alert Score Dial (Inspired by `CometDial`)
Instead of a static number, the main "Supply Anomaly Score" (e.g., 84/100) on the Alert Detail screen will use a comet-style radial dial.
*   **Visuals**: A thin, subtle track (`thickness={5}`) with an electric blue "comet" sweeping to the target score.
*   **Animation**: `speed={25}`, `momentum={1}`. When the component mounts, the score ticks up rapidly while the comet sweeps around the dial, settling with a slight bounce (`tapBounce={0.2}`).
*   **Monospaced Counter**: The number in the center counts up rapidly in a monospaced font, locking in when the comet stops.

### B. Navigation & Filtering (Inspired by `GlideSelect` & `BranchedMenu`)
*   **Filter Dropdowns (Commodity/Location)**: Dropdowns will use the `GlideSelect` pattern. A subtle highlight glides behind the active option as the user moves their mouse (`glideDuration={220}`). The menu itself pops in quickly (`popDuration={180}`).
*   **Sidebar / Drill-downs**: If we implement a sidebar for different markets, it will use the `BranchedMenu` pattern. Expanding a category will smoothly push down other items (`drawDuration={400}`, `foldDuration={300}`) with a structural line drawing connecting child items to parents.

### C. Data Loading & Analysis States (Inspired by `ThoughtLine`)
Generic spinners look cheap. When fetching market data or generating a new alert summary, we will use a step-by-step indicator.
*   **Visuals**: A terminal-like list of steps (e.g., `Fetching arrivals...`, `Calculating price deviation...`, `Evaluating risk...`).
*   **Animation**: A breathing, glowing glyph (`breathPeriod={1.6}`) next to the active step.
*   **Completion**: When finished, steps collapse smoothly (`collapseOnSettle`) into a "Report Generated" state, revealing the data cards immediately.

### D. The "Flashcard" Alert Card Expansion
As requested in `design.md`, alert cards behave like flashcards that expand to show evidence.
*   **Interaction**: Click/Tap on a summarized Alert Card.
*   **Animation (Framer Motion Layout)**: 
    *   The card acts as a shared layout element.
    *   It scales up slightly (`scale: 1.02` for 100ms) before expanding its height to reveal the evidence sections.
    *   **Evidence Stagger**: The internal evidence cards (Price, Arrivals, Crop, News) do not appear instantly. They fade in with a slight upward translation, staggered by 50ms each, drawing the eye through the data.

### E. Horizontal Signal Bars (Screen 6)
The breakdown of the anomaly score requires a premium presentation.
*   **Visuals**: Thin, segmented horizontal bars (like a GitHub contribution graph or a high-end audio equalizer). 
*   **Animation**: On scroll or reveal, the filled segments light up from left to right, staggered per row. 

## 4. Avoiding the "AI Slop" Look

To ensure this looks like a custom, high-end engineering tool and not a generic template:
1.  **No Glassmorphism**: Avoid heavy backdrop-blurs. Use solid dark/light backgrounds with slight opacity borders instead.
2.  **No Rainbow Gradients**: Stick to the stark Electric Blue accent. If a gradient is needed for a critical alert, it should be a strict Blue-to-Transparent or Red-to-Transparent radial glow, never a linear rainbow.
3.  **Data First**: Animations must draw attention *to* the data, not distract from it. The focus is on the monospaced numbers and the sharp charts.
4.  **Grid Backgrounds**: For the map or main analytical view, a subtle 1px dot grid or line grid (opacity 5-10%) in the background gives a highly technical, blueprint-like feel (classic Supabase aesthetic).
