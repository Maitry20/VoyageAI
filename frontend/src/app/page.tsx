"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { motion } from "framer-motion";
import {
  Plane,
  AlertTriangle,
  ShieldCheck,
  Compass,
  Hotel,
  Car,
  CheckCircle2,
  ArrowRight,
  Cpu,
  Bell,
  Activity,
  Layers,
  Sparkles
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
}

export default function LandingPage() {
  const heroContainerRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Detect OS prefers-reduced-motion setting
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleMotionChange);
    return () => {
      mediaQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const heroCtx = gsap.context(() => {
      // Create a single timeline for the plane and the card reveals
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroContainerRef.current,
          start: "top 65%",
          end: "bottom 75%",
          scrub: 1,
        }
      });

      // 1. Plane path animation over the timeline
      tl.to("#plane-element", {
        motionPath: {
          path: "#flight-path",
          autoRotate: true,
        },
        ease: "none",
        duration: 4,
      }, 0);

      // 2. Timeline Checkpoints reveals aligned with plane position
      tl.fromTo(
        "#checkpoint-1",
        { opacity: 0, x: -60, scale: 0.9 },
        { opacity: 1, x: 0, scale: 1, duration: 0.8, ease: "power1.out" },
        0.4
      );

      tl.fromTo(
        "#checkpoint-2",
        { opacity: 0, x: 60, scale: 0.9 },
        { opacity: 1, x: 0, scale: 1, duration: 0.8, ease: "power1.out" },
        1.4
      );

      tl.fromTo(
        "#checkpoint-3",
        { opacity: 0, x: -60, scale: 0.9 },
        { opacity: 1, x: 0, scale: 1, duration: 0.8, ease: "power1.out" },
        2.4
      );

      tl.fromTo(
        "#checkpoint-4",
        { opacity: 0, x: 60, scale: 0.9 },
        { opacity: 1, x: 0, scale: 1, duration: 0.8, ease: "power1.out" },
        3.2
      );

      // 3. Problem/Solution Reveal on Scroll
      gsap.utils.toArray(".reveal-on-scroll").forEach((elem: any) => {
        gsap.fromTo(
          elem,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            scrollTrigger: {
              trigger: elem,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    }, heroContainerRef);

    return () => {
      heroCtx.revert();
    };
  }, [prefersReducedMotion]);




  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-clip">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-500 p-2 rounded-lg text-white font-bold tracking-wider shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            V
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            VoyageAI
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#problem" className="hover:text-blue-400 transition-colors">Problem</a>
          <a href="#solution" className="hover:text-blue-400 transition-colors">Autonomous Agent Orchestration</a>
          <a href="#architecture" className="hover:text-blue-400 transition-colors">Agent Flow</a>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Amex Hackathon 2026
          </span>
          <Link
            href="/login"
            className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300"
          >
            Dashboard Demo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 w-full overflow-hidden flex flex-col items-center bg-slate-950">
        <div className="max-w-4xl mx-auto px-6 text-center z-20">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-full px-3 py-1 text-xs font-medium text-blue-400 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" /> Autonomous Travel Concierge
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent leading-tight md:leading-tight"
          >
            Automating Travel Disruption <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              At Global Enterprise Scale
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="mt-6 text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            When cancellations hit, VoyageAI acts. LangGraph agents coordinate
            flight rebooking, hotel arrangements, and ground transit — instantly
            delivering policy-compliant resolutions.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 flex items-center justify-center gap-4"
          >
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              Launch Live Agent Monitor <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#resolution-flow"
              className="border border-slate-800 hover:bg-slate-900 font-semibold px-6 py-3 rounded-lg transition-all"
            >
              See How It Works
            </a>
          </motion.div>
        </div>
      </section>

      {/* Interactive Travel Path Timeline */}
      <section id="resolution-flow" ref={heroContainerRef} className="relative py-24 bg-slate-950 overflow-hidden">
        {/* SVG Curved Flight Path in the background */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none hidden md:block">
          <svg
            className="w-full h-full"
            viewBox="0 0 1440 1000"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="flight-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#eab308" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <path
              id="flight-path"
              d="M 720,50 C 300,280 1140,680 720,950"
              fill="none"
              stroke="url(#flight-grad)"
              strokeWidth="4"
              strokeDasharray="10,12"
            />
            {!prefersReducedMotion && (
              <g id="plane-element">
                <g transform="translate(-20, -20) rotate(90) scale(2.5)">
                  <path
                    d="M6.428 1.151C6.708.591 7.213 0 8 0s1.292.592 1.572 1.151C9.861 1.73 10 2.431 10 3v3.691l5.17 2.585a1.5 1.5 0 0 1 .83 1.342V12a.5.5 0 0 1-.582.493l-5.507-.918-.375 2.253 1.318 1.318A.5.5 0 0 1 10.5 16h-5a.5.5 0 0 1-.354-.854l1.319-1.318-.376-2.253-5.507.918A.5.5 0 0 1 0 12v-1.382a1.5 1.5 0 0 1 .83-1.342L6 6.691V3c0-.568.14-1.271.428-1.849z"
                    className="fill-yellow-400 stroke-yellow-500 stroke-[0.3]"
                    style={{ filter: "drop-shadow(0 0 6px rgba(234, 179, 8, 0.8))" }}
                  />
                </g>
              </g>
            )}
          </svg>
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-xs font-bold text-blue-500 uppercase tracking-widest">
              Live Resolution Flow
            </h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-white mt-2">
              The 4-Stage Remediation Lifecycle
            </h3>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto text-sm">
              Watch how our autonomous agents orchestrate responses from the moment a disruption is detected to full compliance audit and notification.
            </p>
          </div>

          <div className="relative space-y-12 md:space-y-20">
            {/* Stage 1 */}
            <div className="flex flex-col md:flex-row items-center justify-between md:gap-12 relative">
              <div className="w-full md:w-[calc(50%-2rem)] flex justify-end">
                <div
                  id="checkpoint-1"
                  className="bg-slate-900/60 backdrop-blur border border-red-500/20 rounded-2xl p-6 shadow-2xl max-w-md w-full transition-all hover:border-red-500/40"
                  style={{ opacity: prefersReducedMotion ? 1 : 0 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="p-2 rounded bg-red-500/10 text-red-400">
                      <AlertTriangle className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Stage 1
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Disruption Detected</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Flight canceled at LHR due to airline crew strikes. Concierge activates.
                  </p>
                </div>
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-red-950 border border-red-500/50 text-red-400 flex items-center justify-center font-bold text-sm hidden md:flex z-10 shadow-lg shadow-red-500/20">
                1
              </div>
              <div className="hidden md:block w-full md:w-[calc(50%-2rem)]" />
            </div>

            {/* Stage 2 */}
            <div className="flex flex-col md:flex-row items-center justify-between md:gap-12 relative">
              <div className="hidden md:block w-full md:w-[calc(50%-2rem)]" />
              <div className="absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-yellow-950 border border-yellow-500/50 text-yellow-400 flex items-center justify-center font-bold text-sm hidden md:flex z-10 shadow-lg shadow-yellow-500/20">
                2
              </div>
              <div className="w-full md:w-[calc(50%-2rem)] flex justify-start">
                <div
                  id="checkpoint-2"
                  className="bg-slate-900/60 backdrop-blur border border-yellow-500/20 rounded-2xl p-6 shadow-2xl max-w-md w-full transition-all hover:border-yellow-500/40"
                  style={{ opacity: prefersReducedMotion ? 1 : 0 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="p-2 rounded bg-yellow-500/10 text-yellow-400">
                      <Compass className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Stage 2
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Preferences Loaded</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Traveler profiles mapped: seat selections, loyalty programs, and dietary preferences verified.
                  </p>
                </div>
              </div>
            </div>

            {/* Stage 3 */}
            <div className="flex flex-col md:flex-row items-center justify-between md:gap-12 relative">
              <div className="w-full md:w-[calc(50%-2rem)] flex justify-end">
                <div
                  id="checkpoint-3"
                  className="bg-slate-900/60 backdrop-blur border border-indigo-500/20 rounded-2xl p-6 shadow-2xl max-w-md w-full transition-all hover:border-indigo-500/40"
                  style={{ opacity: prefersReducedMotion ? 1 : 0 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="p-2 rounded bg-indigo-500/10 text-indigo-400">
                      <Hotel className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Stage 3
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Optimal Sourcing</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Alternative flights rebooked, overnight 4-star lodging and shuttle transit arranged.
                  </p>
                </div>
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-indigo-950 border border-indigo-500/50 text-indigo-400 flex items-center justify-center font-bold text-sm hidden md:flex z-10 shadow-lg shadow-indigo-500/20">
                3
              </div>
              <div className="hidden md:block w-full md:w-[calc(50%-2rem)]" />
            </div>

            {/* Stage 4 */}
            <div className="flex flex-col md:flex-row items-center justify-between md:gap-12 relative">
              <div className="hidden md:block w-full md:w-[calc(50%-2rem)]" />
              <div className="absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-400 flex items-center justify-center font-bold text-sm hidden md:flex z-10 shadow-lg shadow-emerald-500/20">
                4
              </div>
              <div className="w-full md:w-[calc(50%-2rem)] flex justify-start">
                <div
                  id="checkpoint-4"
                  className="bg-slate-900/60 backdrop-blur border border-emerald-500/20 rounded-2xl p-6 shadow-2xl max-w-md w-full transition-all hover:border-emerald-500/40"
                  style={{ opacity: prefersReducedMotion ? 1 : 0 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="p-2 rounded bg-emerald-500/10 text-emerald-400">
                      <ShieldCheck className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Stage 4
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Resolution Audited</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Corporate policy compliance approved, logs signed, and SMS alert dispatched.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Problem / Solution Section */}
      <section id="problem" className="py-24 border-t border-slate-900 bg-slate-950 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold text-blue-500 uppercase tracking-widest">
              The Reality of Corporate Travel
            </h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-white mt-2">
              Unresolved disruptions destroy business productivity
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Problem card */}
            <div className="reveal-on-scroll bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-900 rounded-2xl p-8 shadow-2xl">
              <h4 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5" /> The $60B Disruption Trap
              </h4>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>
                    <strong>Hours of manual delays:</strong> Travelers spend average 4 hours waiting on customer service phone queues to rebook.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>
                    <strong>Corporate policy leakage:</strong> Out of panic, employees book non-compliant luxury hotels and expensive flights, costing enterprises billions.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>
                    <strong>Transit disconnectedness:</strong> Finding lodging, flight seats, and airport-to-hotel shuttles remains completely disjointed.
                  </span>
                </li>
              </ul>
            </div>

            {/* Solution card */}
            <div className="reveal-on-scroll bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-900 rounded-2xl p-8 shadow-2xl">
              <h4 className="text-lg font-bold text-emerald-400 flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5" /> The VoyageAI Remediation
              </h4>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span>
                    <strong>Zero Waiting Time:</strong> Workflow completes under 10 seconds of detecting flight status changes.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span>
                    <strong>100% Policy Compliant:</strong> Built-in travel policy agent validates options against company guidelines automatically.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span>
                    <strong>Bundled Concierge Packages:</strong> Solves flights, hotels, and ground transfers all in one orchestrated flow.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Agent Architecture Section */}
      <section id="solution" className="py-24 border-t border-slate-900 bg-slate-900/30 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold text-blue-500 uppercase tracking-widest">
              Multi-Agent Graph
            </h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-white mt-2">
              LangGraph Orchestrated Concierge State
            </h3>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto text-sm">
              Our backend runs a hierarchical graph. The Supervisor directs execution flow across 9 specialized autonomous agents to build a complete resolution.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Cpu,
                title: "Supervisor Router",
                desc: "Acts as the central orchestrator, evaluating state after each node execution to route to the correct specialist or terminate."
              },
              {
                icon: Activity,
                title: "Flight Monitoring",
                desc: "Continuously checks active itineraries for delay or cancel triggers, initiating the resolution flow."
              },
              {
                icon: AlertTriangle,
                title: "Disruption Detection",
                desc: "Assesses severity and computes whether delays require overnight lodging and transfer logistics."
              },
              {
                icon: Compass,
                title: "Passenger Preferences",
                desc: "Fetches employee seat selections, airline alliances, hotel loyalty cards, and dietary needs."
              },
              {
                icon: Plane,
                title: "Flight Rebooking",
                desc: "Invokes mock search adapters to rank alternative connections based on airline loyalty, cost, and time."
              },
              {
                icon: Hotel,
                title: "Hotel Management",
                desc: "Searches 4-star lodging accommodations near airports for overnight cancellations."
              },
              {
                icon: Car,
                title: "Transportation",
                desc: "Coordinates ground transfer (Uber vouchers, local yellow cabs, or airport shuttles)."
              },
              {
                icon: ShieldCheck,
                title: "Corporate Policy",
                desc: "Enforces max budget caps and corporate overrides, reporting audit compliance flags."
              },
              {
                icon: Bell,
                title: "Notification",
                desc: "Packages final resolution details and dispatches real-time SMS alerts to travelers."
              }
            ].map((node, i) => (
              <div
                key={i}
                className="reveal-on-scroll bg-slate-900/60 border border-slate-900 rounded-xl p-6 hover:border-slate-800 transition-all group"
              >
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg w-fit mb-4 group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <node.icon className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white mb-2">{node.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{node.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Diagram Section */}
      <section id="architecture" className="py-24 border-t border-slate-900 bg-slate-950 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold text-blue-500 uppercase tracking-widest">
              System Architecture
            </h2>
            <h3 className="text-3xl font-extrabold text-white mt-2">
              Inside VoyageAI Orchestration
            </h3>
          </div>

          <div className="bg-slate-900 border border-slate-900 rounded-2xl p-8 relative overflow-hidden">
            {/* Visual Grid representing graph */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />

            <div className="relative z-10 flex flex-col items-center gap-8">
              <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 px-6 py-3 rounded-xl font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 animate-pulse text-red-500" /> Disruption Event Trigger
              </div>
              
              <div className="w-0.5 h-8 bg-gradient-to-b from-blue-500 to-indigo-500" />

              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl shadow-xl font-extrabold flex items-center gap-2 border border-blue-400/30">
                <Cpu className="w-6 h-6 animate-spin-slow" /> Supervisor Orchestrator Node
              </div>

              {/* Connecting lines */}
              <div className="grid grid-cols-3 gap-12 w-full max-w-lg text-center mt-4">
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-8 bg-slate-800" />
                  <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-lg text-xs font-semibold text-slate-300">
                    Flight Search
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-8 bg-slate-800" />
                  <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-lg text-xs font-semibold text-slate-300">
                    Compliance check
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-8 bg-slate-800" />
                  <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-lg text-xs font-semibold text-slate-300">
                    Hotel & Transit
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-t from-slate-950 via-slate-900 to-slate-950 border-t border-slate-900 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            See the Autonomous Concierge <br />
            <span className="text-blue-500">Solve Live Disruptions</span>
          </h2>
          <p className="text-slate-400 mt-6 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Run the interactive demo. Trigger custom flight delay and cancellation events and watch the multi-agent graph run step-by-step on the agent activity monitor.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base px-8 py-4 rounded-xl shadow-xl shadow-blue-500/20 hover:scale-105 transition-all"
            >
              Launch Demo Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-12 px-6 bg-slate-950 text-center text-xs text-slate-600">
        <p>© 2026 VoyageAI. Built for Amex Hackathon 2026. All rights reserved.</p>
      </footer>
    </div>
  );
}
