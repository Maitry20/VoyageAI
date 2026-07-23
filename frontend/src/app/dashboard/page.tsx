"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane,
  AlertTriangle,
  ShieldCheck,
  Compass,
  Hotel,
  Car,
  CheckCircle2,
  ArrowLeft,
  Play,
  RotateCcw,
  Bell,
  Cpu,
  User,
  MapPin,
  Calendar,
  DollarSign,
  Activity,
  Terminal,
  ChevronDown,
  ChevronUp,
  FileText
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

const API_BASE = "http://localhost:8000";

interface Trip {
  id: string;
  passenger_name: string;
  flight_number: string;
  origin: string;
  destination: string;
  departure_time: string;
  status: string;
  loyalty_program: string;
  hotel_preference: string;
  seat_preference: string;
  food_preference: string;
  max_budget: number;
}

interface TimelineEvent {
  title: string;
  timestamp: string;
  status: string;
  description: string;
  agent: string | null;
  metadata: any | null;
}

interface AgentLog {
  id: number;
  trip_id: string;
  agent_name: string;
  status: string;
  action_taken: string;
  output_data: string;
  timestamp: string;
}

interface FlightOption {
  id: string;
  flight_number: string;
  origin: string;
  destination: string;
  departure_time: string;
  price: number;
  airline: string;
  score: number;
}

interface HotelOption {
  id: string;
  name: string;
  price_per_night: number;
  rating: number;
  distance_from_airport: number;
  score: number;
}

interface SimulationStatus {
  trip: Trip;
  is_running: boolean;
  current_agent: string | null;
  timeline: TimelineEvent[];
  logs: AgentLog[];
  flights: FlightOption[];
  hotels: HotelOption[];
}

export default function Dashboard() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>("trip-001");
  const [status, setStatus] = useState<SimulationStatus | null>(null);
  const [polling, setPolling] = useState<boolean>(false);
  const [disruptionType, setDisruptionType] = useState<"CANCELLATION" | "DELAY">("CANCELLATION");
  const [disruptionReason, setDisruptionReason] = useState<string>("severe thunder storms and wind shear");
  const [delayHours, setDelayHours] = useState<number>(8);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"timeline" | "charts">("timeline");
  
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial list of trips
  const fetchTrips = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/trips`);
      if (res.ok) {
        const data = await res.json();
        setTrips(data);
      }
    } catch (err) {
      console.error("Failed to fetch trips", err);
    }
  };

  // Fetch current selected trip simulation status
  const fetchStatus = async (tripId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/simulation/status/${tripId}`);
      if (res.ok) {
        const data: SimulationStatus = await res.json();
        setStatus(data);
        // If simulation is running, keep polling active
        setPolling(data.is_running);
      }
    } catch (err) {
      console.error("Failed to fetch simulation status", err);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    if (selectedTripId) {
      fetchStatus(selectedTripId);
    }
  }, [selectedTripId]);

  // Polling loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (polling && selectedTripId) {
      timer = setInterval(() => {
        fetchStatus(selectedTripId);
      }, 900);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [polling, selectedTripId]);

  // Auto scroll terminal logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [status?.logs]);

  // Trigger disruption simulation
  const handleTriggerSimulation = async () => {
    if (!selectedTripId) return;
    try {
      const res = await fetch(`${API_BASE}/api/simulation/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trip_id: selectedTripId,
          event_type: disruptionType,
          reason: disruptionReason,
          delay_hours: disruptionType === "DELAY" ? delayHours : 0
        })
      });
      if (res.ok) {
        setPolling(true);
        fetchStatus(selectedTripId);
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to start simulation");
      }
    } catch (err) {
      console.error("Failed to start simulation", err);
    }
  };

  // Reset Trip status
  const handleResetTrip = async () => {
    if (!selectedTripId) return;
    try {
      const res = await fetch(`${API_BASE}/api/trips/${selectedTripId}/reset`, {
        method: "POST"
      });
      if (res.ok) {
        setPolling(false);
        fetchStatus(selectedTripId);
        fetchTrips();
      }
    } catch (err) {
      console.error("Failed to reset trip", err);
    }
  };

  const getStatusColor = (statusName: string) => {
    switch (statusName) {
      case "ON_TIME":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "DELAYED":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "CANCELED":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getLogStatusClass = (logStatus: string) => {
    switch (logStatus) {
      case "SUCCESS":
        return "text-emerald-400 border-emerald-950 bg-emerald-950/20";
      case "WARNING":
        return "text-yellow-400 border-yellow-950 bg-yellow-950/20";
      case "FAILURE":
        return "text-red-400 border-red-950 bg-red-950/20";
      default:
        return "text-blue-400 border-blue-950 bg-blue-950/20";
    }
  };

  // Chart data formatting
  const flightChartData = status?.flights.map((f) => ({
    name: f.flight_number,
    score: f.score,
    price: f.price,
    airline: f.airline
  })) || [];

  const hotelChartData = status?.hotels.map((h) => ({
    name: h.name.replace(" Airport", "").replace(" Downtown", ""),
    score: h.score,
    price: h.price_per_night,
    rating: h.rating
  })) || [];

  const activeTrip = trips.find((t) => t.id === selectedTripId) || status?.trip;

  // Agent node listing for LangGraph visual panel
  const agentNodes = [
    { name: "Flight Monitoring", label: "Monitor" },
    { name: "Disruption Detection", label: "Detect" },
    { name: "Preference", label: "Preferences" },
    { name: "Flight Rebooking", label: "Rebook" },
    { name: "Hotel Management", label: "Lodging" },
    { name: "Transportation", label: "Transit" },
    { name: "Travel Policy", label: "Policy Check" },
    { name: "Notification", label: "Notify" },
    { name: "Audit", label: "Audit Log" }
  ];

  // SMS messages generated by notification node
  const smsAlerts = status?.logs
    .filter((log) => log.agent_name === "Notification")
    .map((log) => {
      try {
        const metadata = JSON.parse(log.output_data);
        return {
          id: log.id,
          body: metadata.message_body || log.action_taken,
          timestamp: log.timestamp
        };
      } catch {
        return {
          id: log.id,
          body: log.action_taken,
          timestamp: log.timestamp
        };
      }
    }) || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navbar Dashboard */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-500 animate-pulse" />
            <h1 className="text-lg font-extrabold tracking-tight">VoyageAI Concierge Console</h1>
          </div>
        </div>

        {/* Polling/Running State Indicator */}
        <div className="flex items-center gap-3">
          {polling ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/25 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              LangGraph Agent Working...
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              Concierge Idle
            </div>
          )}
          <span className="hidden sm:inline-flex px-2.5 py-1 rounded bg-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-700/50">
            v1.0.0 (Local SQLite)
          </span>
        </div>
      </header>

      {/* Main Grid View */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        {/* LEFT COLUMN: ACTIVE TRIPS & DISRUPTION CONTROL (Col span: 3) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Active Trips Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" /> Active Trips ({trips.length})
            </h2>
            <div className="flex flex-col gap-2">
              {trips.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTripId(t.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                    selectedTripId === t.id
                      ? "bg-blue-600/15 border-blue-500/50 shadow-md shadow-blue-500/5"
                      : "bg-slate-950 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white leading-none">{t.passenger_name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border leading-none ${getStatusColor(t.status)}`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>
                      {t.origin} → {t.destination} ({t.flight_number})
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Trigger Disruption Simulator Control Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex-1 flex flex-col">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" /> Disruption Simulator
            </h2>
            
            <div className="space-y-4 flex-1">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Disruption Type
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => {
                      setDisruptionType("CANCELLATION");
                      setDisruptionReason("heavy snowstorm at LHR Heathrow");
                    }}
                    className={`text-xs py-1.5 rounded font-semibold transition-all ${
                      disruptionType === "CANCELLATION"
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Cancel Flight
                  </button>
                  <button
                    onClick={() => {
                      setDisruptionType("DELAY");
                      setDisruptionReason("air traffic control congestion");
                    }}
                    className={`text-xs py-1.5 rounded font-semibold transition-all ${
                      disruptionType === "DELAY"
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Delay Flight
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Reason Description
                </label>
                <textarea
                  value={disruptionReason}
                  onChange={(e) => setDisruptionReason(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {disruptionType === "DELAY" && (
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Delay Length (Hours): {delayHours}h
                  </label>
                  <input
                    type="range"
                    min={2}
                    max={12}
                    value={delayHours}
                    onChange={(e) => setDelayHours(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                    <span>2h (No lodging)</span>
                    <span>6h (Overnight)</span>
                    <span>12h</span>
                  </div>
                </div>
              )}

              {/* Passenger Profile Data Readout */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] space-y-2">
                <div className="font-bold text-slate-400 border-b border-slate-900 pb-1.5">
                  Traveler Policy & Profile
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Program:</span>
                  <span className="text-slate-300 font-semibold">{activeTrip?.loyalty_program || "Centurion"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Seat/Hotel Pref:</span>
                  <span className="text-slate-300 font-semibold">{activeTrip?.seat_preference}/{activeTrip?.hotel_preference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Budget Limit:</span>
                  <span className="text-slate-300 font-semibold">${activeTrip?.max_budget || 0} USD</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={handleTriggerSimulation}
                disabled={polling || !selectedTripId}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Run Agent Concierge
              </button>
              <button
                onClick={handleResetTrip}
                disabled={polling || !selectedTripId}
                className="w-full py-2 border border-slate-800 hover:bg-slate-950 disabled:opacity-50 disabled:cursor-not-allowed text-slate-400 hover:text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset status
              </button>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: TIMELINE, VISUAL GRAPH & LOGS (Col span: 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Visual Supervisor Agent Map */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" /> Active Agent Node Highlight
            </h2>
            
            {/* LangGraph Node Diagram Grid */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 relative">
              {/* Supervisor element in center */}
              <div className="col-span-3 flex justify-center mb-3">
                <div
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all ${
                    status?.current_agent === "Supervisor"
                      ? "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20 scale-105"
                      : "bg-slate-900 border-slate-800 text-slate-400"
                  }`}
                >
                  <Cpu className={`w-3.5 h-3.5 ${status?.current_agent === "Supervisor" ? "animate-spin-slow" : ""}`} /> Supervisor
                </div>
              </div>
              
              {/* Specialized nodes */}
              {agentNodes.map((node) => (
                <div
                  key={node.name}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    status?.current_agent === node.name
                      ? "bg-blue-600/25 border-blue-400 text-blue-300 scale-105 shadow-md shadow-blue-500/10 font-bold"
                      : status?.logs.some((l) => l.agent_name === node.name)
                      ? "bg-slate-900/60 border-slate-800/80 text-slate-400"
                      : "bg-slate-950 border-slate-900 text-slate-600"
                  }`}
                >
                  <div className="text-[10px] truncate">{node.label}</div>
                  <div className="text-[7px] tracking-widest uppercase mt-0.5 opacity-55">
                    {status?.current_agent === node.name ? "Running" : status?.logs.some((l) => l.agent_name === node.name) ? "Audited" : "Idle"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline and Scored proposals tabs */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex-1 flex flex-col min-h-[350px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab("timeline")}
                  className={`text-xs font-bold uppercase tracking-wider pb-1.5 border-b-2 transition-colors ${
                    activeTab === "timeline" ? "text-blue-400 border-blue-500" : "text-slate-400 border-transparent hover:text-white"
                  }`}
                >
                  Mitigation Timeline
                </button>
                <button
                  onClick={() => setActiveTab("charts")}
                  className={`text-xs font-bold uppercase tracking-wider pb-1.5 border-b-2 transition-colors ${
                    activeTab === "charts" ? "text-blue-400 border-blue-500" : "text-slate-400 border-transparent hover:text-white"
                  }`}
                >
                  Decision Metrics
                </button>
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                {status?.timeline.length || 0} Events
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 select-none">
              {activeTab === "timeline" ? (
                /* Timeline Content */
                status?.timeline && status.timeline.length > 0 ? (
                  <div className="space-y-4 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                    {status.timeline.map((evt, idx) => (
                      <div key={idx} className="flex gap-3 items-start relative group">
                        {/* Status timeline marker icon */}
                        <div
                          className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 z-10 ${
                            evt.status === "FAILURE"
                              ? "bg-red-950 text-red-400 border-red-500/30"
                              : evt.status === "WARNING"
                              ? "bg-yellow-950 text-yellow-400 border-yellow-500/30"
                              : evt.status === "SUCCESS"
                              ? "bg-emerald-950 text-emerald-400 border-emerald-500/30"
                              : "bg-slate-900 text-blue-400 border-slate-800"
                          }`}
                        >
                          {evt.agent === "Hotel Management" ? (
                            <Hotel className="w-4 h-4" />
                          ) : evt.agent === "Transportation" ? (
                            <Car className="w-4 h-4" />
                          ) : evt.agent === "Notification" ? (
                            <Bell className="w-4 h-4" />
                          ) : (
                            <Plane className="w-4 h-4" />
                          )}
                        </div>

                        {/* Event Details Card */}
                        <div className="flex-1 bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="text-xs font-bold text-white leading-none">{evt.title}</h4>
                            <span className="text-[9px] text-slate-500 leading-none">
                              {new Date(evt.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-normal mb-2">{evt.description}</p>

                          {/* Expanded metadata collapse button */}
                          {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                            <details className="text-[10px]">
                              <summary className="text-blue-500 hover:underline cursor-pointer select-none font-medium mb-1">
                                View Agent Decision Output
                              </summary>
                              <pre className="bg-slate-900 border border-slate-800/80 rounded p-2 text-slate-300 font-mono text-[9px] max-h-40 overflow-y-auto whitespace-pre-wrap">
                                {JSON.stringify(evt.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-12">
                    <AlertTriangle className="w-8 h-8 text-slate-600 mb-2" />
                    <span>No simulation active. Use the controller to run the agent flow.</span>
                  </div>
                )
              ) : (
                /* Charts Tab Content (Decision matrix scoring) */
                <div className="space-y-6">
                  {/* Alternative Flight Options Scoring */}
                  {flightChartData.length > 0 ? (
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                        Flight Alternative Scoring Comparison
                      </h4>
                      <div className="h-44 bg-slate-950 rounded-xl p-2 border border-slate-800">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={flightChartData}>
                            <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                            <YAxis domain={[0, 15]} stroke="#64748b" fontSize={9} />
                            <Tooltip
                              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", fontSize: "10px" }}
                            />
                            <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                              {flightChartData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={index === 0 ? "#10b981" : "#3b82f6"} // Best score matches green
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 mt-2 px-1">
                        <span>Best Choice Highlighted (Green)</span>
                        <span>Scores evaluate cost, preference matching, and delays.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-xs text-slate-500 py-6">
                      Flight alternative scores will appear after the Flight Rebooking agent node finishes.
                    </div>
                  )}

                  {/* Lodging Scoring (radar/bar chart) */}
                  {hotelChartData.length > 0 && (
                    <div className="border-t border-slate-800 pt-4">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                        Hotel Accommodations Scoring (Marriott preference)
                      </h4>
                      <div className="h-44 bg-slate-950 rounded-xl p-2 border border-slate-800">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={hotelChartData}>
                            <XAxis dataKey="name" stroke="#64748b" fontSize={8} />
                            <YAxis domain={[0, 15]} stroke="#64748b" fontSize={9} />
                            <Tooltip
                              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", fontSize: "10px" }}
                            />
                            <Bar dataKey="score" fill="#818cf8" radius={[4, 4, 0, 0]}>
                              {hotelChartData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={index === 0 ? "#10b981" : "#818cf8"} // Best score is green
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TERMINAL MONITOR & SMS PANEL (Col span: 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Live Agent Terminal / Audit log */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex-[2] flex flex-col min-h-[300px]">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" /> Live Agent Monitor Logs
            </h2>

            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[10px] overflow-y-auto max-h-[400px] flex flex-col gap-2.5">
              {status?.logs && status.logs.length > 0 ? (
                status.logs.map((log) => (
                  <div key={log.id} className="border-l-2 border-slate-800 pl-2 leading-relaxed">
                    <div className="flex justify-between text-[9px] mb-1">
                      <span className="font-extrabold text-blue-400">[{log.agent_name}]</span>
                      <span className="text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>
                    <div className={`inline-flex px-1 rounded border text-[8px] font-bold mb-1 leading-none ${getLogStatusClass(log.status)}`}>
                      {log.status}
                    </div>
                    <p className="text-slate-300">{log.action_taken}</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs py-12">
                  <span>Terminal inactive. Waiting for agent initiation...</span>
                </div>
              )}
              {/* Terminal autoscroller target */}
              <div ref={terminalEndRef} />
            </div>
          </div>

          {/* Passenger SMS Alerts Preview Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex-1 flex flex-col">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-yellow-400" /> Traveler SMS Dispatch Preview
            </h2>

            <div className="flex-1 flex flex-col items-center justify-center">
              {smsAlerts.length > 0 ? (
                smsAlerts.map((sms) => (
                  <div key={sms.id} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-inner max-w-[280px]">
                    <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-900">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[9px]">
                        AI
                      </div>
                      <div className="leading-none">
                        <div className="text-[10px] font-bold text-white">VoyageAI Concierge</div>
                        <div className="text-[7px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">Automated SMS</div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-relaxed font-sans">{sms.body}</p>
                    <div className="text-[8px] text-slate-500 text-right mt-2 font-mono">
                      {new Date(sms.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-600 text-xs py-6 flex flex-col items-center">
                  <Bell className="w-6 h-6 text-slate-700 mb-1" />
                  <span>No traveler alerts sent yet.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Dashboard Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-4 px-6 text-center text-[10px] text-slate-600">
        <p>VoyageAI Autonomous Travel Concierge Console • Amex Hackathon 2026</p>
      </footer>
    </div>
  );
}
