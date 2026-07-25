"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plane,
  AlertTriangle,
  Hotel,
  Car,
  CheckCircle2,
  ArrowLeft,
  Cpu,
  User,
  Activity,
  ShieldCheck
} from "lucide-react";

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

export default function PassengerDashboard() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>("trip-001");
  const [status, setStatus] = useState<SimulationStatus | null>(null);
  const [polling, setPolling] = useState<boolean>(false);

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

  // Confirm Trip Rebooking
  const handleConfirmRebooking = async () => {
    if (!selectedTripId) return;
    try {
      const res = await fetch(`${API_BASE}/api/trips/${selectedTripId}/confirm`, {
        method: "POST"
      });
      if (res.ok) {
        fetchStatus(selectedTripId);
        fetchTrips();
      }
    } catch (err) {
      console.error("Failed to confirm rebooking", err);
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

  const activeTrip = trips.find((t) => t.id === selectedTripId) || status?.trip;

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
            <User className="w-5 h-5 text-blue-500 animate-pulse" />
            <h1 className="text-lg font-extrabold tracking-tight">VoyageAI Passenger Companion</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/inspector"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-750 hover:text-white transition-all shadow-sm"
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Switch to Ops Inspector
          </Link>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-7xl w-full mx-auto">
        
        {/* Sidebar (Trips selection) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-400" /> Active Trips ({trips.length})
            </h2>
            <div className="flex flex-col gap-2 max-h-[450px] overflow-y-auto pr-1">
              {trips.map((trip) => {
                const isSelected = trip.id === selectedTripId;
                return (
                  <button
                    key={trip.id}
                    onClick={() => setSelectedTripId(trip.id)}
                    className={`text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
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
        </div>

        {/* Passenger Companion Portal View */}
        <div className="lg:col-span-9 flex flex-col gap-6 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl min-h-[700px] font-sans">
          {/* Passenger Portal Header */}
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-1">
                VoyageAI Traveler Companion Portal
              </span>
              <h2 className="text-xl font-extrabold text-white">
                Welcome back, {activeTrip?.passenger_name}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Status</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded border leading-none ${getStatusColor(activeTrip?.status || "ON_TIME")}`}>
                {activeTrip?.status === "ON_TIME" ? "ON TIME" : activeTrip?.status}
              </span>
            </div>
          </div>

          {/* Rebooking Agent Status Banner */}
          {activeTrip?.status === "RESOLVED" ? (
            <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-400">Rebooking Package Confirmed & Secured</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Your new flight ticket and vouchers have been finalized. Digital boarding pass is active.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                RESOLVED
              </span>
            </div>
          ) : polling ? (
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
                <div>
                  <h4 className="text-xs font-bold text-blue-400">VoyageAI Autonomous Rebooking In Progress</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Specialist agent <strong className="text-white">{status?.current_agent || "Supervisor"}</strong> is coordinating alternatives...
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Auto-Remediation active</span>
            </div>
          ) : null}

          {/* Live Flight Radar & Route Animation Panel */}
          <div className="bg-slate-950/80 border border-slate-850 rounded-2xl p-5 flex flex-col md:flex-row gap-6 items-center justify-between shadow-inner relative overflow-hidden select-none">
            {/* Left section: Boarding Countdown info */}
            <div className="z-10 flex-1 w-full">
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeTrip?.status === "ON_TIME" ? "bg-emerald-400" : "bg-yellow-400"}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${activeTrip?.status === "ON_TIME" ? "bg-emerald-500" : "bg-yellow-500"}`}></span>
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Live Radar & Countdown
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-white leading-tight">
                {activeTrip?.status === "ON_TIME" 
                  ? "Flight is On Schedule" 
                  : activeTrip?.status === "RESOLVED"
                  ? "Rebooking Secured & Confirmed"
                  : "Flight Disruption Warning"
                }
              </h3>
              <p className="text-xs text-slate-455 mt-1 leading-relaxed">
                {activeTrip?.status === "ON_TIME" 
                  ? "Onboarding closes in 45 minutes. Proceed to gate B-22." 
                  : activeTrip?.status === "RESOLVED"
                  ? "Your rebooked Delta flight DL-131 boarding closes in 2 hours."
                  : "Original flight AA-104 Canceled. VoyageAI agents are auto-rebooking..."
                }
              </p>
            </div>

            {/* Middle section: Animated SVG flight path */}
            <div className="w-full md:w-[280px] h-[70px] bg-slate-900/50 border border-slate-850/50 rounded-xl flex items-center justify-center p-3 relative z-10">
              <svg className="w-full h-full" viewBox="0 0 200 40">
                {/* Dotted path */}
                <path
                  d="M 20,20 Q 100,5 180,20"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                />
                {/* Airplane traveling */}
                <g className="animate-flying-radar-plane">
                  <path
                    d="M-5,-5 L5,0 L-5,5 L-2,0 Z"
                    fill={activeTrip?.status === "ON_TIME" ? "#10b981" : "#f59e0b"}
                    className="filter drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]"
                  />
                </g>
                {/* City nodes */}
                <circle cx="20" cy="20" r="4" fill="#3b82f6" />
                <circle cx="180" cy="20" r="4" fill="#6366f1" />
                
                {/* Labels */}
                <text x="20" y="35" fontSize="7" fill="#64748b" textAnchor="middle" fontWeight="bold">
                  {activeTrip?.origin || "JFK"}
                </text>
                <text x="180" y="35" fontSize="7" fill="#64748b" textAnchor="middle" fontWeight="bold">
                  {activeTrip?.destination || "LHR"}
                </text>
              </svg>
            </div>

            {/* Custom CSS keyframes specifically for the SVG flight radar */}
            <style>{`
              @keyframes moveRadarPlane {
                0% {
                  transform: translate(20px, 20px) rotate(-15deg) scale(0.9);
                }
                50% {
                  transform: translate(100px, 7px) rotate(0deg) scale(0.9);
                }
                100% {
                  transform: translate(180px, 20px) rotate(15deg) scale(0.9);
                }
              }
              .animate-flying-radar-plane {
                animation: moveRadarPlane 12s linear infinite;
              }
            `}</style>
          </div>

          {/* Disruption Alert Card */}
          {activeTrip?.status !== "ON_TIME" && (
            <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-4 flex gap-4 items-start shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-red-400">Flight Status Alert: Schedule Disrupted</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Your original flight <strong className="text-white">{activeTrip?.flight_number}</strong> was canceled due to <span className="text-white font-semibold">severe thunder storms and wind shear</span>. VoyageAI has automatically initiated rebooking parameters matching your travel profile.
                </p>
              </div>
            </div>
          )}

          {/* Dedicated Rescheduling Comparison Card */}
          {activeTrip?.status === "RESOLVED" && status?.flights && status.flights.length > 0 && (
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 shadow-inner">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Rescheduled Flight Routing Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
                {/* Cancelled Flight */}
                <div className="md:col-span-5 bg-slate-900/60 border border-red-950/40 p-4 rounded-xl flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider bg-red-500/10 px-2 py-0.5 rounded">Cancelled</span>
                    <span className="text-xs font-mono font-bold text-slate-500">{activeTrip?.flight_number}</span>
                  </div>
                  <div className="text-xl font-black text-slate-400">{activeTrip?.origin} ✈ {activeTrip?.destination}</div>
                  <div className="text-[10px] text-slate-500">Reason: Weather disruption</div>
                </div>

                {/* Arrow */}
                <div className="md:col-span-1 flex justify-center text-slate-500 text-lg">
                  ➔
                </div>

                {/* New Rescheduled Flight */}
                <div className="md:col-span-5 bg-slate-900 border border-emerald-950/40 p-4 rounded-xl flex flex-col gap-2 shadow">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded">Rescheduled</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">{status.flights[0].flight_number || "AA-131"}</span>
                  </div>
                  <div className="text-xl font-black text-white">{activeTrip?.origin} ✈ {activeTrip?.destination}</div>
                  <div className="text-[10px] text-slate-400 leading-relaxed">
                    Airline: <strong className="text-white">{status.flights[0].airline}</strong><br />
                    Departure: <strong className="text-white">{new Date(status.flights[0].departure_time).toLocaleString()}</strong><br />
                    Boarding Gate: <strong className="text-blue-400 font-bold">Gate B-22</strong> (Boarding closes 45m before departure)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Traveler Portal Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            
            {/* Left Column: Itinerary Details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Your Itinerary</h3>
                {activeTrip?.status === "ON_TIME" ? (
                  <div className="bg-slate-950 border border-slate-850 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Scheduled</span>
                      <span className="text-xs font-bold text-slate-500">{activeTrip.flight_number}</span>
                    </div>
                    <div className="flex justify-between items-center text-center">
                      <div className="text-left">
                        <div className="text-2xl font-black text-white">{activeTrip.origin}</div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Origin</span>
                      </div>
                      <Plane className="w-5 h-5 text-slate-700 rotate-90" />
                      <div className="text-right">
                        <div className="text-2xl font-black text-white">{activeTrip.destination}</div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Destination</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                      No disruptions detected. VoyageAI is monitoring this flight in the background.
                    </p>
                  </div>
                ) : (
                  status?.flights && status.flights.length > 0 ? (
                    /* Large Horizontal Boarding Pass */
                    <>
                      <div className="bg-gradient-to-r from-blue-950 to-indigo-950 border border-blue-900/30 rounded-xl overflow-hidden shadow-lg">
                        <div className="bg-blue-600/10 px-4 py-2.5 border-b border-blue-900/20 flex justify-between items-center text-[10px] font-bold text-blue-400">
                          <span>REBOOKED BOARDING PASS</span>
                          <span>CONFIRMED</span>
                        </div>
                        <div className="p-4 space-y-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-3xl font-black text-white leading-none">{activeTrip?.origin}</div>
                              <div className="text-[10px] text-slate-400 font-semibold uppercase mt-1">Origin</div>
                            </div>
                            <div className="flex flex-col items-center">
                              <Plane className="w-5 h-5 text-blue-400 rotate-90" />
                              <div className="w-20 h-0.5 bg-blue-900/30 my-1.5" />
                              <span className="text-[10px] font-extrabold text-blue-300">{status.flights[0].flight_number}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-black text-white leading-none">{activeTrip?.destination}</div>
                              <div className="text-[10px] text-slate-400 font-semibold uppercase mt-1">Destination</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-900 text-xs text-slate-400">
                            <div>
                              <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Carrier</div>
                              <div className="font-extrabold text-white mt-0.5">{status.flights[0].airline}</div>
                            </div>
                            <div>
                              <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Departure Time</div>
                              <div className="font-extrabold text-white mt-0.5">
                                {new Date(status.flights[0].departure_time).toLocaleDateString([], { month: "short", day: "numeric" })} at {new Date(status.flights[0].departure_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                            <div>
                              <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Seat assigned</div>
                              <div className="font-extrabold text-white mt-0.5">{activeTrip?.seat_preference || "Window (Assigned)"}</div>
                            </div>
                            <div>
                              <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Compliance</div>
                              <div className="font-extrabold text-emerald-400 mt-0.5">Policy Compliant</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-4 border-t border-slate-900">
                            <div className="text-[9px] text-slate-500 font-semibold leading-relaxed">
                              Scan this QR code at the gate.<br />
                              Fare amount: ${status.flights[0].price} USD
                            </div>
                            <div className="bg-white p-1 rounded shadow">
                              <div className="grid grid-cols-5 gap-0.5 w-10 h-10">
                                {[...Array(25)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`rounded-2xs ${
                                      (i * 7 + 13) % 5 === 0 || i % 6 === 0 || i < 5 || i > 20 ? "bg-slate-950" : "bg-slate-200"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {activeTrip?.status !== "RESOLVED" && (
                        /* Approval Panel */
                        <div className="mt-4 bg-slate-950 border border-blue-900/30 rounded-xl p-3 flex flex-col gap-2">
                          <div className="text-[10px] font-bold text-blue-300">Action Required: Approve Rebooking Option</div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleConfirmRebooking}
                              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow transition-colors"
                            >
                              Approve & Confirm New Flight
                            </button>
                            <button
                              onClick={() => alert("Alternative options are being routed by the concierge.")}
                              className="px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 font-bold text-xs rounded-lg transition-colors"
                            >
                              Propose Alternate
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 text-center text-xs text-slate-500 py-8">
                      Itinerary status updates will show up here.
                    </div>
                  )
                )}
              </div>
            </div>
            
            {/* Right Column: Hotel & Ground Transit */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Lodging & Ground Transit</h3>
                {activeTrip?.status === "ON_TIME" ? (
                  <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 text-center text-xs text-slate-500 py-8">
                    No lodging required for on-time trips.
                  </div>
                ) : (
                  status?.hotels && status.hotels.length > 0 ? (
                    <div className="space-y-4">
                      {/* Hotel voucher */}
                      <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                          <Hotel className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-sm font-bold text-white truncate">{status.hotels[0].name}</h4>
                              <p className="text-xs text-slate-400 mt-0.5">Complimentary Overnight Stay</p>
                            </div>
                            <span className="text-xs font-bold text-indigo-400">
                              ★ {status.hotels[0].rating}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-900 text-xs text-slate-400 font-semibold">
                            <span>Check-in: Tonight</span>
                            <span>Rate: ${status.hotels[0].price_per_night}/night</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Transit voucher */}
                      <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                          <Car className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-sm font-bold text-white">Airport Ride Voucher</h4>
                              <p className="text-xs text-slate-400 mt-0.5">Complimentary airport shuttle ticket</p>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded leading-none">
                              PAID
                            </span>
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-900 text-xs text-slate-400 font-semibold">
                            Provider Shuttle: <strong className="text-white">Marriott Airport Shuttle</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 text-center text-xs text-slate-500 py-8">
                      Checking if overnight lodging is required...
                    </div>
                  )
                )}
              </div>
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
