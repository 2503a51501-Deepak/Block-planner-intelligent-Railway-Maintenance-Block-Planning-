# RailOpt-AI — AI-Powered Automatic Railway Block Planning Prototype

> **Disclaimer**: This application is a **decision-support system prototype developed for Smart India Hackathon using realistic simulated railway data**. It is NOT connected to live Indian Railways operational infrastructure or real-time signaling hardware.

---

## 1. Problem Overview

Railway maintenance on Indian Railways is executed across three major departments:
1. **Engineering (P-Way / Track)**: Track defects, ultrasonic rail testing (USFD) flaws, switch expansion joints (SEJ), ballast screening (BCM), tamping machines (TMS).
2. **Traction Distribution (TRD / Electrical)**: 25 kV AC overhead equipment (OHE) cantilever overhauls, neutral section isolations, contact wire renewal (TDMS).
3. **Signal & Telecommunication (S&T)**: Electronic interlockings, digital axle counters (DAC), point machine overhauls, track circuits (SMMS).

Simultaneously, high-density passenger trains (Vande Bharat Express, Rajdhani, Superfast trains) and freight corridors operate on the same tracks. 

Historically, each department applies for isolated maintenance blocks, leading to fragmented line closures, excessive train delays, and poor window utilization.

### The Objective
**RailOpt-AI** solves this challenge by answering:
> *Which maintenance tasks should be performed, where, and during which time window, while minimizing disruption to train operations and combining multi-department activities into shared corridor blocks?*

---

## 2. Core Features & Capabilities

- **Transparent AI Priority Scoring Engine**: Evaluates defect severity, asset criticality, overdue days, and operational traffic density with configurable weights and human-readable score explainability.
- **Constraint-Based Block Optimizer (OR-Tools / CP-SAT)**: Enforces hard safety constraints (zero express train overlap, exclusive gang allocation) while maximizing asset availability and multi-department task clustering.
- **Multi-Department Grouping**: Coordinates Track ($2\text{h}$), Traction ($1\text{h}$), and Signal ($1\text{h}$) maintenance within the same section into a single $2\text{h}$ window, eliminating redundant corridor closures.
- **Genuine Baseline Comparison (Before vs After)**: Evaluates AI plans against a first-fit heuristic manual baseline using dynamically computed metrics (blocks saved, block hours reduced, train disruption avoided).
- **Interactive What-If Scenario Simulator**: Allows section controllers to adjust passenger traffic density, freight volatility, block duration caps, and inject emergency rail fractures.
- **Corridor Schematic & 24-Hour Timeline Gantt**: Interactive visualization of the South Central Railway demo corridor (`Secunderabad ↔ Kazipet ↔ Warangal ↔ Vijayawada ↔ Guntur`).
- **CSV Data Import & Template Hub**: Import custom maintenance logs, timetables, and block windows with built-in validation and downloadable sample CSV templates.

---

## 3. Technology Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS | Enterprise-grade dark control room dashboard |
| **Icons & Charts** | Lucide React, Recharts | Data visualization, corridor schematics, 24h Gantt |
| **Backend** | Python 3.14, FastAPI, Pydantic v2 | High-performance asynchronous REST API |
| **Database** | SQLite3 (relational schema) | Local zero-config embedded database |
| **AI / Optimization** | OR-Tools CP-SAT, Pandas, NumPy | Multi-objective constraint-based block optimization |

---

## 4. Application Architecture

```text
                        SIMULATED DATA SOURCES
             ┌──────────┐     ┌──────────┐     ┌──────────┐
             │ Track TMS│     │Signal SMMS│    │TRD TDMS  │
             └────┬─────┘     └────┬─────┘     └────┬─────┘
                  │                │                │
                  └────────────────┼────────────────┘
                                   ↓
                         DATABASE SEED / INGEST
                                   ↓
                       AI PRIORITY SCORING ENGINE
                     (Severity + Crit + Overdue + Impact)
                                   ↓
      ┌────────────────────────────┼───────────────────────────┐
      │                            │                           │
   COA TIMETABLE            GOODS FORECASTS            PERMITTED BLOCKS
      │                            │                           │
      └────────────────────────────┼───────────────────────────┘
                                   ↓
                      CONSTRAINT BLOCK OPTIMIZER
                   - Hard Safety (Express Protection)
                   - Gang Exclusivity
                   - Multi-Department Grouping Bonus
                                   ↓
      ┌────────────────────────────┼───────────────────────────┐
      ↓                            ↓                           ↓
  DAILY PLAN                  WEEKLY PLAN                 MONTHLY PLAN
      └────────────────────────────┼───────────────────────────┘
                                   ↓
                 ENTERPRISE OPERATIONS DASHBOARD
```

---

## 5. Mathematical Methodology

### Priority Scoring Formula
$$\text{Priority Score} = w_{\text{sev}} \cdot S + w_{\text{crit}} \cdot C + w_{\text{overdue}} \cdot O + w_{\text{impact}} \cdot I$$
- **Severity ($S$)**: Critical ($100$), High ($75$), Medium ($45$), Low ($20$).
- **Asset Criticality ($C$)**: Critical Trunk Asset ($100$), High ($75$), Medium ($50$), Low ($25$).
- **Overdue Factor ($O$)**: Normalized overdue days penalty ($15 - 100$).
- **Operational Impact ($I$)**: Corridor line traffic density and power block requirements.

### Block Optimization Objective
$$\max \sum_{t \in \text{Scheduled}} (\text{Priority}(t) \cdot \beta_{\text{prio}} + \text{OverdueBonus}(t)) + \sum_{b} \text{MultiDeptBonus}(b) - \sum_{b} (\text{TrainPenalty}(b) + \text{FreightRisk}(b))$$

---

## 6. How to Run Locally

### Option A: Unified Single-Port Mode (Recommended)
FastAPI serves both the REST API and the compiled React SPA:

```bash
cd railopt-ai/backend
python main.py
```
Open your browser at: **`http://localhost:8000`**

### Option B: Decoupled Development Mode

#### Terminal 1 — Backend:
```bash
cd railopt-ai/backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

#### Terminal 2 — Frontend:
```bash
cd railopt-ai/frontend
npm run dev
```
Open your browser at: **`http://localhost:5173`**

---

## 7. Demo Walkthrough (3-Minute Hackathon Flow)

1. **Dashboard**: Inspect division KPIs (29 tasks, 5 critical, 11 overdue, 97.0% asset availability).
2. **Maintenance Tasks**: Filter tasks by Engineering, Traction, and Signal & Telecom. Click **Inspect AI Score** to see exact formula factor weights.
3. **Corridor Network & Timetable**: Inspect the `Secunderabad ↔ Kazipet ↔ Warangal ↔ Vijayawada ↔ Guntur` schematic and 24-hour train timetable.
4. **AI Block Planner**: Click **RUN AI OPTIMIZATION**. Observe recommended multi-department coordinated blocks (e.g. `AI-REC-001` bundling Track, Traction, and Signal into one 2h block in `WL-BZA`).
5. **Before vs After**: View genuine calculated improvements (33% block reduction, 25% train disruption reduction, +4.6% asset availability gain).
6. **Scenario Simulator**: Increase train traffic density to *Congested* and add an emergency rail fracture. Re-run simulation to observe real-time dynamic rescheduling.

---

## 8. Future Roadmap

- **Phase 1**: Simulated data decision-support prototype (Current).
- **Phase 2**: Integration with Indian Railways CRIS / TMS / SMMS database schemas via secure Kafka/REST connectors.
- **Phase 3**: Real-time train tracking (FOIS/COA GPS feeds) with dynamic block rescheduling.
- **Phase 4**: Machine learning predictive maintenance using ultrasonic rail flaw propagation models and OHE thermography.
- **Phase 5**: Zone-wide multi-division corridor network optimization across Indian Railways.