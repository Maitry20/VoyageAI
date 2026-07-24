"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Plane,
  AlertTriangle,
  Hotel,
  Car,
  CheckCircle2,
  ArrowLeft,
  Play,
  RotateCcw,
  Cpu,
  User,
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

export default function InspectorDashboard() {
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

  // Fetch current selected trip status
  const fetchStatus = async (tripId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/simulation/status/${tripId}`);
      if (res.ok) {
        const data: SimulationStatus = await res.json();
        setStatus(data);
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

  // Trigger manual simulation
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

  // Trigger Webhook Disruption
  const handleTriggerWebhook = async () => {
    if (!activeTrip) return;
    try {
      const res = await fetch(`${API_BASE}/api/webhook/flight-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flight_number: activeTrip.flight_number,
          event_type: disruptionType,
          reason: disruptionReason,
          delay_hours: disruptionType === "DELAY" ? delayHours : 0
        })
      });
      if (res.ok) {
        setPolling(true);
        fetchStatus(selectedTripId);
        fetchTrips();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to trigger Webhook");
      }
    } catch (err) {
      console.error("Failed to trigger Webhook", err);
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
      case "RESOLVED":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
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

  const activeTrip = trips.find((t) => t.id === selectedTripId) || status?.trip;

  // Chart formatting
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

  // Agent nodes
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h1 className="text-lg font-extrabold tracking-tight">VoyageAI Operations Inspector</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/passenger"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 border border-slate-700 text-slate-350 hover:bg-slate-750 hover:text-white transition-all shadow-sm"
          >
            <User className="w-3.5 h-3.5 text-blue-400" /> Switch to Passenger View
          </Link>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 w-full max-w-[1600px] mx-auto">
        
        {/* Left Column: Side Controls & Simulator (Col span: 3) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Active Trips list */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-400" /> Active Trips ({trips.length})
            </h2>
            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
              {trips.map((trip) => {
                const isSelected = trip.id === selectedTripId;
                return (
                  <button
                    key={trip.id}
                    onClick={() => setSelectedTripId(trip.id)}
                    className={`text-left p-3 rounded-xl border transition-all flex flex-col gap-1 ${
                      isSelected
                        ? "bg-slate-800/80 border-blue-500 shadow-md shadow-blue-500/5"
                        : "bg-slate-950/40 border-slate-850 hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-extrabold text-white truncate max-w-[120px]">
                        {trip.passenger_name}
                      </span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded leading-none border uppercase ${getStatusColor(trip.status)}`}>
                        {trip.status === "ON_TIME" ? "ON TIME" : trip.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Plane className="w-3 h-3 text-slate-500 rotate-90" />
                      <span>
                        {trip.origin} → {trip.destination} ({trip.flight_number})
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Disruption Simulator form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              🚨 Disruption Simulator
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Disruption Type
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-850">
                  <button
                    onClick={() => setDisruptionType("CANCELLATION")}
                    className={`py-1.5 text-[10px] font-bold rounded-md transition-all ${
                      disruptionType === "CANCELLATION" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Cancel Flight
                  </button>
                  <button
                    onClick={() => setDisruptionType("DELAY")}
                    className={`py-1.5 text-[10px] font-bold rounded-md transition-all ${
                      disruptionType === "DELAY" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Delay Flight
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Reason Description
                </label>
                <textarea
                  value={disruptionReason}
                  onChange={(e) => setDisruptionReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  rows={2}
                />
              </div>

              {disruptionType === "DELAY" && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Delay Duration (Hours)
                  </label>
                  <input
                    type="number"
                    value={delayHours}
                    onChange={(e) => setDelayHours(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Traveler Policy & Profile
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Program:</span>
                  <span className="text-slate-350 font-semibold">{activeTrip?.loyalty_program || "Centurion"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Seat/Hotel Pref:</span>
                  <span className="text-slate-350 font-semibold">{activeTrip?.seat_preference}/{activeTrip?.hotel_preference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Budget Limit:</span>
                  <span className="text-slate-350 font-semibold">${activeTrip?.max_budget || 0} USD</span>
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
                  onClick={handleTriggerWebhook}
                  disabled={polling || !selectedTripId}
                  className="w-full py-2 bg-slate-950 border border-blue-500/20 hover:border-blue-500/50 text-blue-400 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
                >
                  ⚡ Simulate Webhook Trigger
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
        </div>

        {/* Center Column: Node Diagram & Logs (Col span: 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Node Diagram highlight */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" /> Active Agent Node Highlight
            </h2>
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 relative">
              <div className="col-span-3 flex justify-center mb-3">
                <div
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all ${
                    status?.current_agent === "Supervisor"
                      ? "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20 scale-105"
                      : "bg-slate-900 border-slate-800 text-slate-450"
                  }`}
                >
                  Supervisor
                </div>
              </div>

              {agentNodes.map((node) => {
                const isActive = status?.current_agent === node.name;
                return (
                  <div
                    key={node.name}
                    className={`p-3 rounded-lg border text-center font-bold text-[10px] transition-all flex flex-col items-center justify-center gap-1 ${
                      isActive
                        ? "bg-blue-600/90 border-blue-400 text-white shadow-md shadow-blue-500/25 scale-105"
                        : "bg-slate-900 border-slate-800 text-slate-400"
                    }`}
                  >
                    <span>{node.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Code / Agent logs */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl flex-1 flex flex-col min-h-[400px] overflow-hidden shadow-xl">
            <div className="bg-slate-850 px-4 py-3 border-b border-slate-800 flex justify-between items-center select-none">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h3 className="text-xs font-bold text-white font-mono">Agent Concierge Logs</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Live output feed</span>
            </div>

            <div className="flex-1 bg-slate-950 p-4 font-mono text-[11px] overflow-y-auto space-y-3">
              {status?.logs && status.logs.length > 0 ? (
                status.logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <div
                      key={log.id}
                      className={`border rounded-lg p-2.5 transition-all ${
                        isExpanded ? "border-slate-700 bg-slate-900/60" : "border-slate-850 hover:border-slate-800 bg-slate-950"
                      }`}
                    >
                      <div
                        className="flex justify-between items-center cursor-pointer select-none"
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded leading-none border uppercase ${getLogStatusClass(log.status)}`}>
                            {log.status}
                          </span>
                          <span className="text-white font-extrabold text-xs">{log.agent_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                        </div>
                      </div>
                      
                      <div className="text-slate-350 text-[10px] mt-1.5 leading-relaxed">{log.action_taken}</div>
                      
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-800 text-[10.5px] text-slate-400 space-y-2 bg-slate-950 p-2 rounded">
                          <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Output JSON</div>
                          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[10px] text-emerald-400 bg-black/30 p-2 rounded max-h-[200px]">
                            {JSON.stringify(JSON.parse(log.output_data), null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-slate-550 flex items-center justify-center h-full text-xs">
                  Agent log stream will output here.
                </div>
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>

        {/* Right Column: Decisions Comparison & Metrics (Col span: 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex-1 flex flex-col min-h-[300px]">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" /> Rebooked Flight Options Sourced
            </h2>

            <div className="flex-1 flex flex-col justify-center">
              {flightChartData.length > 0 ? (
                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={flightChartData}>
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                      <YAxis stroke="#94a3b8" fontSize={9} label={{ value: 'Score / Price', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: 10 } }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: 10 }} />
                      <Bar dataKey="score" fill="#3b82f6" name="Rebooking Utility Score" radius={[4, 4, 0, 0]}>
                        {flightChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? "#10b981" : "#3b82f6"} />
                        ))}
                      </Bar>
                      <Bar dataKey="price" fill="#6366f1" name="Price ($ USD)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-[9px] text-slate-400 mt-2 text-center">
                    Higher score represents better utility alignment (policy & preferences). Green highlights chosen flight.
                  </p>
                </div>
              ) : (
                <div className="text-slate-500 text-center text-xs py-8">
                  Flight options comparison chart will load once sourced.
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex-1 flex flex-col min-h-[300px]">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Hotel className="w-3.5 h-3.5 text-indigo-400" /> Hotel Booking Score Matrix
            </h2>

            <div className="flex-1 flex flex-col justify-center">
              {hotelChartData.length > 0 ? (
                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" radius="70%" data={hotelChartData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="name" stroke="#94a3b8" fontSize={8} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="#475569" fontSize={8} />
                      <Radar name="Agent Score" dataKey="score" stroke="#818cf8" fill="#818cf8" fillOpacity={0.4} />
                      <Radar name="Review Rating" dataKey="rating" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                    </RadarChart>
                  </ResponsiveContainer>
                  <p className="text-[9px] text-slate-400 mt-2 text-center">
                    Radar showing Hotel Recommendation Score (0-10) aligned with Review Ratings.
                  </p>
                </div>
              ) : (
                <div className="text-slate-550 text-center text-xs py-8">
                  Hotel recommendation matrix will display once sourced.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Background flying airplane */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        <svg
          className="absolute w-12 h-12 text-blue-500/10 fill-current animate-flying-plane"
          viewBox="0 0 24 24"
        >
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16z" />
        </svg>
      </div>

      <style>{`
        @keyframes flyPath {
          0% {
            transform: translate(-100px, 85vh) rotate(35deg) scale(0.7);
            opacity: 0;
          }
          10% {
            opacity: 0.15;
          }
          90% {
            opacity: 0.15;
          }
          100% {
            transform: translate(105vw, 10vh) rotate(25deg) scale(0.7);
            opacity: 0;
          }
        }
        .animate-flying-plane {
          animation: flyPath 32s linear infinite;
        }
      `}</style>
    </div>
  );
}
