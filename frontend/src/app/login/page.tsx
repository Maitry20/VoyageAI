"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Cpu, ShieldCheck, Plane, FileText } from "lucide-react";

const API_BASE = "http://localhost:8000";

interface Trip {
  id: string;
  passenger_name: string;
  flight_number: string;
  origin: string;
  destination: string;
  status: string;
  loyalty_program: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"passenger" | "inspector">("passenger");
  
  // Passenger states
  const [passengerStep, setPassengerStep] = useState<1 | 2>(1);
  const [passengerName, setPassengerName] = useState("");
  const [passengerEmail, setPassengerEmail] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [boardingPassCode, setBoardingPassCode] = useState("");
  const [passengerError, setPassengerError] = useState("");
  
  // Inspector states
  const [inspectorEmail, setInspectorEmail] = useState("");
  const [inspectorPassword, setInspectorPassword] = useState("");
  const [inspectorError, setInspectorError] = useState("");

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch active trips to validate passenger
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/trips`);
        if (res.ok) {
          const data = await res.json();
          setTrips(data);
        }
      } catch (err) {
        console.error("Failed to load trips database", err);
      }
    };
    fetchTrips();
  }, []);

  const handlePassengerStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setPassengerError("");
    
    if (!passengerName.trim() || !passengerEmail.trim()) {
      setPassengerError("Please enter your name and email.");
      return;
    }

    // Match traveler name in DB (case-insensitive)
    const travelerExists = trips.some(
      (t) => t.passenger_name.toLowerCase().includes(passengerName.toLowerCase())
    );

    if (!travelerExists) {
      setPassengerError("Passenger record not found. Try 'Maitry Patel' or 'John Doe'.");
      return;
    }

    // Proceed to flight details verification step
    setPassengerStep(2);
  };

  const handlePassengerStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setPassengerError("");

    if (!flightNumber.trim() || !boardingPassCode.trim()) {
      setPassengerError("Please enter flight number and boarding pass details.");
      return;
    }

    // Verify trip matching both traveler name and flight number
    const matchedTrip = trips.find(
      (t) =>
        t.passenger_name.toLowerCase().includes(passengerName.toLowerCase()) &&
        t.flight_number.toLowerCase().replace(/[\s-]/g, "") === flightNumber.toLowerCase().replace(/[\s-]/g, "")
    );

    if (!matchedTrip) {
      setPassengerError("Flight details do not match traveler profile.");
      return;
    }

    // Store passenger context and redirect
    localStorage.setItem("traveler_name", matchedTrip.passenger_name);
    localStorage.setItem("traveler_trip_id", matchedTrip.id);
    router.push("/dashboard/passenger");
  };

  const handleInspectorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setInspectorError("");

    if (
      inspectorEmail.toLowerCase() === "admin@voyageai.com" &&
      inspectorPassword === "admin123"
    ) {
      localStorage.setItem("inspector_authenticated", "true");
      router.push("/dashboard/inspector");
    } else {
      setInspectorError("Invalid email or password. Use: admin@voyageai.com / admin123");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-blue-600/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-indigo-600/5 blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="bg-transparent px-6 py-4 flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">VoyageAI Gatekeeper</span>
      </header>

      {/* Main Login Frame */}
      <div className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col gap-6">
          <div className="text-center">
            <h2 className="text-2xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Access VoyageAI Console
            </h2>
            <p className="text-xs text-slate-400 mt-2">
              Select your role below to authorize your session.
            </p>
          </div>

          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
            <button
              onClick={() => setRole("passenger")}
              className={`py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                role === "passenger" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <User className="w-4 h-4" /> Passenger
            </button>
            <button
              onClick={() => setRole("inspector")}
              className={`py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                role === "inspector" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Cpu className="w-4 h-4" /> Inspector
            </button>
          </div>

          {/* Passenger Flow */}
          {role === "passenger" ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-blue-400 mb-1">
                <span>Traveler Companion Access</span>
                <span>Step {passengerStep} of 2</span>
              </div>

              {passengerStep === 1 ? (
                <form onSubmit={handlePassengerStep1} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Maitry Patel"
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. passenger@voyageai.com"
                      value={passengerEmail}
                      onChange={(e) => setPassengerEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {passengerError && (
                    <div className="text-[11px] font-semibold text-red-400 bg-red-950/20 border border-red-900/30 p-2.5 rounded-lg">
                      {passengerError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-550 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                  >
                    Continue to Flight Details
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePassengerStep2} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Flight Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. AA-104"
                        value={flightNumber}
                        onChange={(e) => setFlightNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 pl-9 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                      <Plane className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-3.5" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Boarding Pass Code</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. BP-AA104-JFK"
                        value={boardingPassCode}
                        onChange={(e) => setBoardingPassCode(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 pl-9 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                      <FileText className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  {passengerError && (
                    <div className="text-[11px] font-semibold text-red-400 bg-red-950/20 border border-red-900/30 p-2.5 rounded-lg">
                      {passengerError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPassengerStep(1)}
                      className="px-4 py-3 bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-400 font-bold text-xs rounded-xl"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-550 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                    >
                      Verify flight status
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* Inspector Flow */
            <form onSubmit={handleInspectorLogin} className="space-y-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block mb-1">
                Ops Inspector Credentials
              </span>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Admin Email</label>
                <input
                  type="email"
                  placeholder="e.g. admin@voyageai.com"
                  value={inspectorEmail}
                  onChange={(e) => setInspectorEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={inspectorPassword}
                  onChange={(e) => setInspectorPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              {inspectorError && (
                <div className="text-[11px] font-semibold text-red-400 bg-red-950/20 border border-red-900/30 p-2.5 rounded-lg">
                  {inspectorError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-650 hover:from-indigo-500 hover:to-blue-555 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                Sign In to Console
              </button>
            </form>
          )}

          {/* Quick Demo Helper Box */}
          <div className="mt-2 pt-4 border-t border-slate-800/60 text-[10px] text-slate-400 space-y-2">
            <div className="font-bold text-slate-500 uppercase tracking-wider">Demo Credentials for Judges:</div>
            <div className="flex flex-col gap-1 bg-slate-950 p-2.5 rounded-xl border border-slate-850">
              <div>
                <strong className="text-blue-400">👤 Passenger Login:</strong>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  Name: <span className="text-white font-mono">Maitry Patel</span> (Email: any)<br />
                  Flight: <span className="text-white font-mono">AA-104</span> (Passcode: any)
                </div>
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-slate-900">
                <strong className="text-indigo-400">🛠️ Inspector Login:</strong>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  Email: <span className="text-white font-mono">admin@voyageai.com</span><br />
                  Password: <span className="text-white font-mono">admin123</span>
                </div>
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
