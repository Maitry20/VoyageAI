# VoyageAI — Autonomous Travel Disruption Concierge

VoyageAI is an autonomous corporate travel concierge that monitors flights, instantly detects delays or cancellations, and orchestrates a multi-agent resolution graph (built with **LangGraph**) to rebook travel, arrange hotels, coordinate ground transit, and notify travelers — all while conforming to corporate travel policies and traveler preferences.

This repository is built as a submission for the **Amex Hackathon 2026**.

---

## Technical Architecture

### 1. LangGraph Multi-Agent Flow
The backend uses a hierarchical state graph with a **Supervisor** and **9 specialized agent nodes**:
- **Supervisor**: Central orchestrator. Reviews execution logs and routes control dynamically based on current state.
- **Flight Monitoring**: Tracks itinerary flight states.
- **Disruption Detection**: Assesses severe delays and cancellations to determine required compensation packages (e.g. overnight lodging requirements).
- **Preference**: Integrates personal preferences (aisle/window seat, hotel brand choice, dietary requirements) and loyalty tier information.
- **Flight Rebooking**: Invokes mock search adapters, scoring alternative flight connections based on delays, costs, and passenger affinity.
- **Hotel Management**: Searches for 4-star lodging options near airport hubs when overnight stays are required.
- **Transportation**: Coordinates ground transfers (Uber vouchers, hotel shuttle buses).
- **Travel Policy**: Enforces corporate travel policy spending caps and flags violations.
- **Notification**: Packages and dispatches real-time SMS alerts to travelers.
- **Audit**: Log-seals the concierge transaction and writes full session details to the SQLite database.

```
       [Disruption Event]
              │
              ▼
    ┌───────────────────┐
    │    Supervisor     │ ◄───┐
    └─────────┬─────────┘     │
              │ (Routes)      │ (Returns State)
              ▼               │
    ┌───────────────────┐     │
    │  Flight Rebooking │ ────┤
    │  Hotel Management │ ────┤
    │   Travel Policy   │ ────┤
    │   Preferences     │ ────┤
    │  [Other Nodes...] │ ────┘
              │
              ▼
       [Resolution Audited]
```

### 2. Frontend Scroll Animation
The landing page includes a high-fidelity scroll-driven hero flight path animation:
- Built with **GSAP + ScrollTrigger + MotionPathPlugin**.
- Lock-pinned for the duration of the flight. The plane's movement along the curved dashed SVG path is driven entirely by scroll position (`scrub: true`).
- Rotation automatically aligns with the path's tangent angle.
- Cloud/card checkpoints fade in as the plane passes them.
- Detects OS `prefers-reduced-motion` to automatically fall back to a static view, disabling performance-heavy animations.

---

## Setup & Running Locally

Ensure you have Python 3.14+ and Node.js v25+ installed.

### 1. Backend Setup (FastAPI & LangGraph)
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. The virtual environment and dependencies have already been installed. Activate and run the server using `uvicorn`:
   ```bash
   ./venv/bin/uvicorn app.main:app --reload --port 8000
   ```
   The backend API will run locally at `http://localhost:8000`.

### 2. Frontend Setup (Next.js 15)
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   The application will run locally at `http://localhost:3000`.

---

## Testing the Demo Disruption Simulator
1. Open `http://localhost:3000/dashboard`.
2. Select one of the default loaded passengers (e.g. *Maitry Patel*).
3. In the **Disruption Simulator** panel on the left:
   - Select **Cancel Flight** (forces overnight stay + hotel + Uber transit booking).
   - Select **Delay Flight** and configure the delay hours (shorter delays only trigger flight rebooking, longer delays trigger lodging).
4. Click **Run Agent Concierge**.
5. Watch the **LangGraph Agent Map** highlight running nodes in real-time, the **Live Agent Monitor Logs** terminal print logs live, the **SMS Alert Dispatch** output message text, and the **Decision Metrics** charts plot scoring calculations dynamically.
