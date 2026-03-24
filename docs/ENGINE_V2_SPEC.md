# Edge Model V1 -> V2 Build Spec

## Product Goal

Build a real-time sports intelligence platform (scores, standings, stats, rosters, player/team detail) centered on an always-on, profitability-first prediction engine that:

- updates continuously in EST context,
- learns from outcomes and market quality signals (especially CLV),
- emits actionable picks with stake sizing and rationale,
- remains explainable and auditable.

---

## Current Baseline (V1)

- Single-file SPA (`index.html`) with ESPN-backed score/standings/roster interaction.
- Deterministic/rule-based pick generation from live/scheduled games.
- Budget-aware stake sizing (fractional Kelly variant).
- Daily pick persistence and hourly recycle/sort.
- Core anti-bias language filtering.
- Review/failure/learning logs persisted in local state.

---

## V2 Target Architecture

## 1) Data Plane

### 1.1 Canonical Entities
- `Event`: league, eventId, startTs, status, clock, period, teams, market snapshots.
- `Team`: abbreviation + normalized alias map.
- `Player`: id, teamId, status, recent usage/performance vectors.
- `MarketTick`: timestamped odds/line snapshot per book/market.
- `Outcome`: final result + settlement metadata.

### 1.2 Freshness and Time Authority
- Primary timezone: EST for operational day.
- Freshness score:
  - score feed age,
  - odds feed age,
  - injury/lineup feed age.
- Any stale source lowers confidence and stake.

## 2) Feature Plane

Feature families:
- Team form: rolling win%, scoring margin, pace proxies.
- Availability: injury/lineup deltas and role impact.
- Context: rest/travel/back-to-back/season phase.
- Market: opening -> current -> close movement, consensus divergence.
- Reliability: source freshness and completeness.

## 3) Model Plane

### 3.1 Market-Specific Models
- Separate scorers for ML / spread / total / props.
- Calibrated probabilities per market.

### 3.2 EV + Policy
- EV from calibrated probability vs market price.
- Policy constraints:
  - min edge/EV,
  - anti-bias filter,
  - bankroll/risk caps,
  - correlation-aware parlay rules.

## 4) Learning Plane

### 4.1 Online Learning Loop
- Trigger: finalized outcomes and periodic batch checkpoints.
- Labels:
  - pick result (win/loss/push),
  - CLV sign and magnitude,
  - realized ROI by segment.
- Updates:
  - league/market multipliers,
  - confidence calibration terms,
  - stake-risk penalties.

### 4.2 Promotion Rules
- Only promote rule/weight changes after minimum sample and quality gates:
  - CLV improvement,
  - stable drawdown,
  - no overfit warning.

## 5) Runtime / Autopilot

- Engine cycle every N seconds:
  1. ingest freshest scoreboard/market state,
  2. recompute features and scores,
  3. reseed + rerank picks,
  4. recompute recommended stake,
  5. publish telemetry and explainability notes.

- Must degrade safely under API failures:
  - stale badge,
  - reduced confidence,
  - no aggressive stake escalation.

## 6) Explainability + UX

Every pick should expose:
- market and exact bet expression,
- current line/odds and edge/EV,
- recommended stake and bankroll effect,
- key reasons (top contributing signals),
- confidence + data freshness.

Interactive navigation targets:
- team modal from team names/logos,
- player modal from player names,
- event modal from score cards and picks.

## 7) Metrics / Monitoring

Primary:
- bankroll growth,
- ROI by market/league,
- CLV rate and CLV magnitude.

Risk:
- max drawdown,
- variance buckets,
- concentration/correlation risk.

Health:
- feed freshness SLA,
- cycle latency,
- % picks generated with full data.

---

## Delivery Phases

## Phase A (Stabilize + Instrument)
- Runtime telemetry panel and cycle controls.
- Consistent EST day handling.
- Log/audit resilience.

## Phase B (Structured Learning)
- Persist model telemetry snapshots.
- Automated learning deltas from recent settled reviews.
- Guarded multipliers with promotion thresholds.

## Phase C (Model Upgrade)
- Market-specific scoring modules.
- Better calibration and uncertainty handling.
- Correlation-aware portfolio sizing.

## Phase D (Research Automation)
- Factor candidate queue with acceptance/rejection logic.
- Champion/challenger comparisons.
- Auto-generated daily model report.

---

## Non-Negotiables

- Never claim certainty; recommendations only.
- No fabricated data fields.
- Preserve explainability for every model output.
- Profitability objective must include risk constraints, not ROI alone.
