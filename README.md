# 🛫 VoyageAI — Autonomous Travel Disruption Concierge

[![Python](https://img.shields.io/badge/Python-3.14+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-FF6F00?style=for-the-badge)](https://langchain-ai.github.io/langgraph/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)

**VoyageAI** is an autonomous corporate travel concierge that monitors flights, instantly detects delays or cancellations, and orchestrates a multi-agent resolution graph (built with **LangGraph**) to rebook travel, arrange hotels, coordinate ground transit, and notify travelers — all while conforming to corporate travel policies and traveler preferences.

> 🏆 Built as a submission for the **Amex Hackathon 2026**.

---

## 🌟 Key Features

* 🧠 **LangGraph Multi-Agent Architecture**: 9 specialized agent nodes orchestrated by a central Supervisor Agent routing flow dynamically based on state evaluation.
* ⚡ **Real-Time Disruption Simulator**: Trigger mock cancellations or custom flight delay durations for instant multi-agent execution testing.
* 🏨 **Autonomous End-to-End Resolution**:
  * Rebooks optimal alternative flights based on delay time, seat tier, price, and traveler affinity score.
  * Reserves 4-star hotel accommodations near airport hubs for overnight delays.
  * Generates ground transit vouchers (Uber / Hotel shuttle).
  * Validates spending caps against corporate travel policies.
* 📱 **Passenger Alerts & Audit Trail**: Dispatches instant SMS alerts detailing updated itineraries and seals tamper-proof transaction logs into SQLite.
* 🎨 **Interactive UI & Visualizations**: Next.js 15 dashboard featuring real-time node highlighting, terminal logs, Recharts decision metrics, and GSAP scroll-driven animations.

---

## 🏗️ Technical Architecture

### 1. LangGraph Multi-Agent Workflow

```
                        [Disruption Event Trigger]
                                   │
                                   ▼
                         ┌───────────────────┐
                         │    Supervisor     │ ◄───┐
                         └─────────┬─────────┘     │
                                   │ (Routes)      │ (Returns State)
                                   ▼               │
     ┌───────────────────────────────────────────┐ │
     │ • Flight Monitoring   • Hotel Management  │ │
     │ • Disruption Detect   • Transportation    │ │
     │ • Preferences         • Travel Policy     │ ──┘
     │ • Flight Rebooking    • Notification      │
     └─────────────────────┬─────────────────────┘
                           │
                           ▼
                    [Resolution Audited]
```

### 2. Specialized Agents Breakdown

| Agent | Responsibility |
| :--- | :--- |
| **Supervisor** | Central orchestrator reviewing state logs and dynamically routing control between agents |
| **Flight Monitoring** | Tracks live itinerary flight status and schedule changes |
| **Disruption Detection** | Evaluates delay severity and determines lodging and compensation needs |
| **Preferences** | Incorporates seat choices (aisle/window), dietary requirements, and loyalty tiers |
| **Flight Rebooking** | Searches alternative connections and scores options based on cost, delta, and affinity |
| **Hotel Management** | Searches and books 4-star lodging near airport hubs for overnight delays |
| **Transportation** | Coordinates ground transfers (Uber vouchers and hotel shuttle buses) |
| **Travel Policy** | Enforces corporate spending limits and flags non-compliant bookings |
| **Notification** | Formats and dispatches real-time SMS alerts to travelers |
| **Audit** | Seals complete resolution logs into the database for corporate auditing |

---

## 💻 Tech Stack

* **Backend**: Python 3.14+, FastAPI, LangGraph, SQLModel (SQLite), Pydantic v2
* **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, GSAP (ScrollTrigger & MotionPath), Recharts, Lucide Icons

---

## 📂 Repository Structure

```
VoyageAI/
├── backend/
│   ├── app/
│   │   ├── adapters/      # Flight & Hotel mock search adapters
│   │   ├── agents/        # LangGraph workflow (graph.py, nodes.py, state.py)
│   │   ├── services/      # Simulation orchestration engine
│   │   ├── database.py    # SQLModel database configuration
│   │   ├── main.py        # FastAPI API routes & lifespan setup
│   │   ├── models.py      # Database models (Trip, FlightOption, HotelOption, AuditLog)
│   │   └── schemas.py     # Pydantic request/response schemas
│   └── requirements.txt   # Python backend dependencies
└── frontend/
    ├── src/
    │   └── app/
    │       ├── dashboard/ # Interactive Concierge Simulator & Agent Monitor
    │       └── page.tsx   # GSAP scroll-animated landing page
    └── package.json       # Node.js dependencies & scripts
```

---

## 🚀 Setup & Running Locally

Ensure you have **Python 3.14+** and **Node.js v22+** installed.

### 1. Backend Setup (FastAPI & LangGraph)

```bash
cd backend

# Activate your virtual environment
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies if needed
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
*API server will run at:* `http://localhost:8000`

### 2. Frontend Setup (Next.js 15)

```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
*Web app will run at:* `http://localhost:3000`

---

## 🧪 Testing the Disruption Simulator

1. Open `http://localhost:3000/dashboard`.
2. Select a pre-loaded passenger profile (e.g., *Maitry Patel*).
3. In the **Disruption Simulator** panel on the left:
   * Select **Cancel Flight** (triggers overnight lodging + hotel + Uber transit booking).
   * Select **Delay Flight** and adjust delay hours (short delay = flight rebook only; long delay = flight + hotel).
4. Click **Run Agent Concierge**.
5. Watch the **LangGraph Agent Map** highlight nodes live, view real-time **Terminal Logs**, check simulated **SMS Alerts**, and analyze **Decision Metrics** charts.
