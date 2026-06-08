import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Wrench, Shield, Zap, Check, CheckCircle, MessageCircle, Play,
  ArrowRight, ChevronRight, Star, HelpCircle, Menu, X, Smartphone,
  Laptop, Activity, FileText, Users, Lock, TrendingUp, BarChart3,
  DollarSign, Store, Clock, ArrowUpRight, ChevronDown, Sparkles
} from "lucide-react";
import { supabase } from "@/services/supabase";

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"jobs" | "pos" | "inventory" | "staff">("jobs");
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  // Workflow steps details
  const workflowSteps = [
    {
      title: "New Ticket Created",
      description: "Quick ticket creation with IMEI, fault category, and estimated delivery date.",
      action: "System automatically assigns ticket number and registers in queue."
    },
    {
      title: "Device Received",
      description: "Physical inspection completed and digital receipt generated with current status.",
      action: "SMS/WhatsApp notification sent to customer confirming safe receipt."
    },
    {
      title: "AI & Tech Diagnosis",
      description: "AI-assisted diagnostics help identify internal hardware/software faults.",
      action: "Customer approves estimated cost online via interactive portal."
    },
    {
      title: "Waiting Parts",
      description: "Required spare parts reserved from local stock or ordered via wholesale marketplace.",
      action: "Status changes dynamically and customer is kept informed."
    },
    {
      title: "Repairing",
      description: "Certified technician performs the hardware repair/micro-soldering.",
      action: "Timer tracks internal technician turnaround time (TAT)."
    },
    {
      title: "Quality Check",
      description: "Device goes through multi-point diagnostic check before being closed.",
      action: "QA engineer approves the device for delivery."
    },
    {
      title: "Ready & Delivered",
      description: "Automated invoice is generated, payment is settled online/cash, and device delivered.",
      action: "WhatsApp billing details sent along with dynamic 6-month warranty card."
    }
  ];

  // Auto-advance workflow step animation every 3.5 seconds if user isn't clicking
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveWorkflowStep(prev => (prev + 1) % workflowSteps.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  const getPrice = (monthlyPrice: number) => {
    return billingCycle === "yearly" ? Math.round(monthlyPrice * 0.8) : monthlyPrice;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* ── BACKGROUND GLOW EFFECT ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[600px] bg-gradient-to-b from-indigo-950/20 via-transparent to-transparent blur-3xl pointer-events-none -z-10" />

      {/* ── PREMIUM NAV ── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/70 border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-all duration-300">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                REPAIRXPERT
              </span>
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold -mt-1">
                CRM & POS Ecosystem
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">How It Works</a>
            <a href="#comparison" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Why RepairXpert</a>
            <a href="#pricing" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">FAQ</a>
            <Link to="/marketplace" className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
              🛒 Spare Parts Shop <ArrowUpRight className="h-3 w-3" />
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/auth" className="text-sm font-semibold hover:text-white transition-colors text-slate-400">
              Sign In
            </Link>
            <Link to="/auth?mode=signup">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-5 py-5 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-0.5 transition-all">
                Start Free Trial
              </Button>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden p-2 text-slate-400 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/5 bg-slate-950 px-4 py-6 flex flex-col gap-4 animate-in slide-in-from-top-4">
          <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-slate-400 hover:text-white">Features</a>
          <a href="#workflow" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-slate-400 hover:text-white">How It Works</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-slate-400 hover:text-white">Pricing</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-slate-400 hover:text-white">FAQ</a>
          <Link to="/marketplace" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-indigo-400 flex items-center gap-1">
            🛒 Spare Parts Shop
          </Link>
          <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
            <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="text-center py-2.5 font-bold text-slate-400 hover:text-white">
              Sign In
            </Link>
            <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full bg-indigo-600 text-white font-bold py-6 rounded-xl">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── 1. HERO SECTION ── */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6 animate-pulse">
            <Sparkles className="h-3.5 w-3.5" /> Empowering 10,000+ Technicians Across India
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] max-w-4xl mx-auto bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent">
            Manage Your Repair & Retail Business in One Place
          </h1>
          
          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-medium">
            RepairXpert helps repair shops, retailers, and service businesses manage customers, repairs, inventory, billing, and online orders with ease.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth?mode=signup">
              <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-base rounded-xl px-8 py-7 shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/35 hover:-translate-y-0.5 transition-all">
                Start Free Trial <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <a href="#workflow" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto border-white/10 hover:bg-white/5 text-white font-bold rounded-xl px-8 py-7">
                <Play className="h-4 w-4 mr-2 text-indigo-400 fill-indigo-400" /> Watch Workflow
              </Button>
            </a>
          </div>

          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500 font-semibold">
            <span>✓ 7-Day Free Trial</span>
            <span>•</span>
            <span>✓ No Credit Card Required</span>
            <span>•</span>
            <span>✓ GST Ready</span>
          </div>
        </div>
      </section>

      {/* ── 2. DYNAMIC DASHBOARD PREVIEW ── */}
      <section className="relative pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border border-white/5 rounded-3xl bg-slate-900/40 backdrop-blur-3xl overflow-hidden p-6 md:p-8 shadow-2xl relative">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
          
          {/* Mock Window Controls */}
          <div className="flex items-center justify-between pb-6 border-b border-white/5">
            <div className="flex gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <div className="h-3 w-3 rounded-full bg-green-500/80" />
            </div>
            <div className="bg-slate-950/80 border border-white/5 px-4 py-1.5 rounded-full text-xs font-mono text-slate-400 select-none">
              app.servixo.com/dashboard
            </div>
            <div className="w-12" />
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex overflow-x-auto gap-2 py-4 border-b border-white/5 scrollbar-none">
            {[
              { id: "jobs", label: "🔧 Jobs Tracker", desc: "Live job tickets list" },
              { id: "pos", label: "🧾 POS Invoicing", desc: "GST Invoice builder" },
              { id: "inventory", label: "📦 Parts Inventory", desc: "Track stock & warranties" },
              { id: "staff", label: "👥 Staff & Performance", desc: "Technician task metrics" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-col items-start px-5 py-3 rounded-xl border text-left shrink-0 transition-all ${
                  activeTab === tab.id
                    ? "bg-indigo-600/10 border-indigo-500/40 text-white shadow-inner"
                    : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="text-sm font-bold">{tab.label}</span>
                <span className="text-[10px] text-slate-500 mt-0.5">{tab.desc}</span>
              </button>
            ))}
          </div>

          {/* Simulated Tab Content */}
          <div className="py-6 min-h-[360px] animate-fade-in">
            {activeTab === "jobs" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-950/40 border border-white/5 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                    <div>
                      <h4 className="font-bold text-sm">Job ID #JS921K8</h4>
                      <p className="text-xs text-slate-500">Samsung Galaxy S23 Ultra • Charging Port Replacement</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">DIAGNOSING</span>
                    <span className="text-xs font-semibold text-indigo-400">Assigned: Tech Rahul</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between bg-slate-950/40 border border-white/5 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    <div>
                      <h4 className="font-bold text-sm">Job ID #JS920M2</h4>
                      <p className="text-xs text-slate-500">iPhone 14 Pro Max • Shattered OLED Screen</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">REPAIRING</span>
                    <span className="text-xs font-semibold text-indigo-400">Assigned: Tech Sanjay</span>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-950/40 border border-white/5 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <div>
                      <h4 className="font-bold text-sm">Job ID #JS919T4</h4>
                      <p className="text-xs text-slate-500">MacBook Pro 16" • Liquid Damage Recovery</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">COMPLETED</span>
                    <span className="text-xs font-semibold text-slate-500">Ready for Delivery</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "pos" && (
              <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div>
                    <h4 className="text-sm font-black">TAX INVOICE</h4>
                    <p className="text-[10px] text-slate-500">INV-2026-0042 • GSTIN: 07AAAAA1111A1Z1</p>
                  </div>
                  <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/25 rounded-full text-xs font-bold">PAID (ONLINE)</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>iPhone 13 Screen Replacement (Original Grade)</span>
                    <span className="font-semibold text-white">₹4,500.00</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Labor & Diagnostics Fee</span>
                    <span className="font-semibold text-white">₹500.00</span>
                  </div>
                  <div className="flex justify-between text-slate-400 border-t border-white/5 pt-2">
                    <span>CGST (9%)</span>
                    <span>₹450.00</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>SGST (9%)</span>
                    <span>₹450.00</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-white border-t border-white/10 pt-3">
                    <span>Total Amount Due</span>
                    <span className="text-indigo-400">₹5,900.00</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "inventory" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { name: "iPhone 11 Battery (Premium)", code: "BAT-IP11", qty: 14, min: 5, status: "In Stock" },
                  { name: "S22 Ultra Premium OLED Screen", code: "SCR-S22U", qty: 2, min: 4, status: "Low Stock" },
                  { name: "Universal Type-C Fast Charger", code: "CHG-UNIV", qty: 45, min: 10, status: "In Stock" }
                ].map(item => (
                  <div key={item.code} className="bg-slate-950/40 border border-white/5 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono text-slate-500">{item.code}</span>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                        item.status === "Low Stock" ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
                      }`}>{item.status}</span>
                    </div>
                    <h5 className="font-bold text-xs truncate">{item.name}</h5>
                    <div className="flex justify-between text-xs pt-1 border-t border-white/5 text-slate-400">
                      <span>Stock Quantity:</span>
                      <span className="font-bold text-white">{item.qty} units</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "staff" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/40 border border-white/5 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs">
                      SK
                    </div>
                    <div>
                      <h5 className="font-bold text-sm">Sanjay Kumar</h5>
                      <p className="text-[10px] text-indigo-400 font-semibold">Lead Micro-soldering Tech</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs pt-3 border-t border-white/5 text-slate-400">
                    <span>Repairs Finished: <strong className="text-white">42</strong></span>
                    <span>Avg Time to Repair: <strong className="text-white">1.8 hrs</strong></span>
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-white/5 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xs">
                      RS
                    </div>
                    <div>
                      <h5 className="font-bold text-sm">Rahul Singh</h5>
                      <p className="text-[10px] text-purple-400 font-semibold">Screen Replacement Specialist</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs pt-3 border-t border-white/5 text-slate-400">
                    <span>Repairs Finished: <strong className="text-white">89</strong></span>
                    <span>Avg Time to Repair: <strong className="text-white">32 mins</strong></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 3. INTERACTIVE REPAIR WORKFLOW ANIMATION ── */}
      <section id="workflow" className="py-20 relative bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Real-Time Repair Workflow Stepper
            </h2>
            <p className="text-slate-400 text-sm mt-3 max-w-xl mx-auto">
              Follow every device stage dynamically. Automated customer alerts, technician queue logs, and warranties are triggered on every transition.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-center">
            {/* Step Selection List */}
            <div className="lg:col-span-1 space-y-2">
              {workflowSteps.map((step, idx) => (
                <button
                  key={step.title}
                  onClick={() => setActiveWorkflowStep(idx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                    activeWorkflowStep === idx
                      ? "bg-indigo-600/10 border-indigo-500/40 text-white"
                      : "border-white/5 hover:border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                    activeWorkflowStep === idx ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-500"
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-tight">{step.title}</h4>
                  </div>
                  <ChevronRight className={`ml-auto h-4 w-4 transition-transform ${activeWorkflowStep === idx ? "translate-x-1" : ""}`} />
                </button>
              ))}
            </div>

            {/* Simulated Stepper Details Panel */}
            <div className="lg:col-span-2 border border-white/5 rounded-3xl p-8 bg-slate-950/60 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
              <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-6 relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-600/10 px-2.5 py-1 rounded-md">
                  Step {activeWorkflowStep + 1} details
                </span>
                
                <h3 className="text-2xl font-black text-white">
                  {workflowSteps[activeWorkflowStep].title}
                </h3>
                
                <p className="text-slate-400 text-base leading-relaxed">
                  {workflowSteps[activeWorkflowStep].description}
                </p>
              </div>

              <div className="mt-8 p-4 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-indigo-300 font-medium flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                <span><strong>Automation Action:</strong> {workflowSteps[activeWorkflowStep].action}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. FEATURE GRID ── */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Built Exclusively for Repair & Service Centers
          </h2>
          <p className="text-slate-400 text-sm mt-3 max-w-xl mx-auto">
            All the high-priority tools necessary to scale your repair operations, streamline billing, and automate communications.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: MessageCircle,
              title: "WhatsApp Alerts",
              desc: "Send instant updates when job status changes. Send digital receipts and warranty reminders."
            },
            {
              icon: FileText,
              title: "GST Invoicing",
              desc: "Generate professional GST tax invoices. Customize headers, tax rates, terms, and terms of service."
            },
            {
              icon: Smartphone,
              title: "IMEI & Serial Logs",
              desc: "Keep detailed logs of device brands, models, IMEI numbers, lock patterns, and battery conditions."
            },
            {
              icon: Zap,
              title: "Quick Barcode Scanners",
              desc: "Scan parts directly into tickets or sales. Keep accurate stock records and search parts instantly."
            },
            {
              icon: Store,
              title: "Multi-branch & Tenant Support",
              desc: "Connect multiple store locations. View aggregated sales, inventory levels, and transfer stock easily."
            },
            {
              icon: Users,
              title: "Customer Booking Portal",
              desc: "Give customers a clean portal to track repair status, book new requests, or browse shop listings."
            }
          ].map((f, i) => (
            <div key={i} className="border border-white/5 hover:border-indigo-500/20 p-8 rounded-3xl bg-slate-900/35 backdrop-blur-md group hover:-translate-y-1 transition-all duration-300 relative">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all rounded-3xl" />
              <div className="h-12 w-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                <f.icon className="h-5 w-5 text-indigo-400" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. COMPARISON TABLE ── */}
      <section id="comparison" className="py-20 bg-slate-900/20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Compare and Choose Wisely
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              How RepairXpert stacks up against generic tools and spreadsheets.
            </p>
          </div>

          <div className="border border-white/5 rounded-3xl bg-slate-950 overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-900/40">
                  <th className="p-5 font-black text-slate-200">Feature Focus</th>
                  <th className="p-5 font-black text-slate-400">Excel / Paper Logs</th>
                  <th className="p-5 font-black text-slate-400">Generic Retail CRM</th>
                  <th className="p-5 font-black text-indigo-400 bg-indigo-600/5">RepairXpert CRM</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Automated WhatsApp Status Updates", manual: "❌ None", generic: "⚠️ Add-on required", servixo: "✅ Free built-in" },
                  { name: "IMEI, Fault Patterns, Diagnostic Logs", manual: "❌ Difficult", generic: "❌ Custom work needed", servixo: "✅ Native fields" },
                  { name: "Repair Stepper (Received ➔ Delivered)", manual: "❌ Manual entries", generic: "⚠️ Pipeline only", servixo: "✅ Step-by-step logic" },
                  { name: "Technician Target & Earning Tracking", manual: "❌ Calculations", generic: "❌ No support", servixo: "✅ Auto commission splitting" },
                  { name: "Wholesale Spare Parts Procurement", manual: "❌ Separated", generic: "❌ No support", servixo: "✅ Marketplace integration" }
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-5 font-semibold text-white">{row.name}</td>
                    <td className="p-5 text-slate-500">{row.manual}</td>
                    <td className="p-5 text-slate-500">{row.generic}</td>
                    <td className="p-5 font-bold text-indigo-300 bg-indigo-600/5">{row.servixo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 6. CUSTOMER REVIEWS ── */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Loved by Owners & Technicians
          </h2>
          <p className="text-slate-400 text-sm mt-3">
            Real stories from mobile and laptop repair shops using our suite.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              quote: "RepairXpert's automated WhatsApp feature saved us hours of customer support calls. Once the repair is complete, they immediately get a pickup reminder with payment link.",
              name: "Suraj Patra",
              role: "Owner of Mobile Tech Lab, Kolkata",
              rating: 5
            },
            {
              quote: "We connected our 3 different store branches to track inventory. Now we easily transfer spare screens and batteries between stores without losing track.",
              name: "Anand Sharma",
              role: "Operations Manager at Laptop Care, Delhi",
              rating: 5
            },
            {
              quote: "Best billing software. Custom GST templates, professional invoices, and built-in parts barcode scanner makes invoicing extremely fast.",
              name: "Vikas Patil",
              role: "Founder of QuickFix Electronics, Pune",
              rating: 5
            }
          ].map((r, i) => (
            <div key={i} className="border border-white/5 p-8 rounded-3xl bg-slate-900/35 relative">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: r.rating }).map((_, idx) => (
                  <Star key={idx} className="h-4 w-4 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <p className="text-slate-300 text-sm italic mb-6 leading-relaxed">
                "{r.quote}"
              </p>
              <div className="pt-4 border-t border-white/5">
                <h5 className="font-bold text-sm text-white">{r.name}</h5>
                <p className="text-xs text-indigo-400 mt-0.5">{r.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. PRICING SECTION ── */}
      <section id="pricing" className="py-24 relative bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Simple, Transparent Pricing Plans
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              Scale your repair business at a price that fits. Start free, upgrade as you grow.
            </p>

            {/* Toggle Billing Cycle */}
            <div className="mt-8 inline-flex items-center gap-3 bg-slate-950 border border-white/5 p-1 rounded-full">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 text-xs font-bold rounded-full transition-all ${
                  billingCycle === "monthly" ? "bg-indigo-600 text-white" : "text-slate-400"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-4 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${
                  billingCycle === "yearly" ? "bg-indigo-600 text-white" : "text-slate-400"
                }`}
              >
                Yearly <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {/* Free Plan */}
            <div className="border border-white/5 rounded-3xl p-8 bg-slate-950 flex flex-col justify-between relative">
              <div className="space-y-6">
                <div>
                  <h3 className="font-black text-lg text-white">Starter (Free)</h3>
                  <p className="text-xs text-slate-500 mt-1">Perfect to test features</p>
                </div>
                <div className="flex items-baseline">
                  <span className="text-4xl font-black text-white">₹0</span>
                  <span className="text-slate-500 text-sm">/ forever</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-400">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Manage up to 50 active repair tickets</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Simple invoice generation</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Local database inventory</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Basic diagnostic notes</li>
                </ul>
              </div>
              <Link to="/auth?mode=signup" className="mt-8">
                <Button variant="outline" className="w-full border-white/10 text-white font-bold rounded-xl py-6">
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="border-2 border-indigo-600 rounded-3xl p-8 bg-slate-950 flex flex-col justify-between relative shadow-2xl shadow-indigo-600/10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full">
                Most Popular
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="font-black text-lg text-white">Pro CRM & POS</h3>
                  <p className="text-xs text-indigo-400 mt-1 font-semibold">Perfect for active repair centers</p>
                </div>
                <div className="flex items-baseline">
                  <span className="text-4xl font-black text-white">₹{getPrice(249)}</span>
                  <span className="text-slate-500 text-sm">/ month</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-400">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Unlimited active repair tickets</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Professional GST/Standard Invoices</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Automated WhatsApp Status integration</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Multi-technician splits & analytics</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Barcode & IMEI tracking features</li>
                </ul>
              </div>
              <Link to="/auth?mode=signup" className="mt-8">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl py-6 shadow-lg shadow-indigo-600/25">
                  Start Free Trial
                </Button>
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="border border-white/5 rounded-3xl p-8 bg-slate-950 flex flex-col justify-between relative">
              <div className="space-y-6">
                <div>
                  <h3 className="font-black text-lg text-white">Enterprise Network</h3>
                  <p className="text-xs text-slate-500 mt-1">For multi-branch chains</p>
                </div>
                <div className="flex items-baseline">
                  <span className="text-4xl font-black text-white">₹{getPrice(999)}</span>
                  <span className="text-slate-500 text-sm">/ month</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-400">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Everything in Pro CRM Plan</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Connect up to 10 retail branches</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Centralized stock & branch transfers</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Custom branding and PWA app icon</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Dedicated API & CRM support</li>
                </ul>
              </div>
              <Link to="/auth?mode=signup" className="mt-8">
                <Button variant="outline" className="w-full border-white/10 text-white font-bold rounded-xl py-6">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. FAQ SECTION ── */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-400 text-sm mt-3">
            Find answers to commonly asked questions about RepairXpert CRM.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "Can I use RepairXpert on multiple mobile and tablet screens?",
              a: "Yes! RepairXpert is fully responsive and optimized for mobile screens. You can add it to your home screen as a PWA, enabling quick access and offline status logging."
            },
            {
              q: "How does the WhatsApp notification system work?",
              a: "We integrate directly with your WhatsApp API to send pre-defined updates like 'Device Received', 'Diagnosed', or 'Ready for Pickup'. It drastically reduces time spent calling clients."
            },
            {
              q: "Is there support for GST and simple invoices?",
              a: "Absolutely. In your dashboard settings, you can toggle between standard retail invoices and tax-ready GST invoices with custom tax slabs (5%, 12%, 18%, or 28%)."
            },
            {
              q: "Can we assign jobs to specific staff members?",
              a: "Yes. In the Pro plan, you can add multiple staff profiles (Technician, QA, Front desk). You can assign jobs to specific technicians and track average repair times (TAT)."
            }
          ].map((item, idx) => (
            <div key={idx} className="border border-white/5 rounded-2xl bg-slate-900/35 overflow-hidden">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between p-5 text-left font-bold text-sm text-white hover:bg-white/5 transition-colors"
              >
                <span>{item.q}</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${faqOpen === idx ? "rotate-180" : ""}`} />
              </button>
              {faqOpen === idx && (
                <div className="p-5 border-t border-white/5 text-xs text-slate-400 leading-relaxed bg-slate-950/20">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 9. FOOTER ── */}
      <footer className="bg-slate-950 border-t border-white/5 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <h4 className="font-bold text-white mb-4">RepairXpert Platform</h4>
            <div className="flex flex-col gap-2.5">
              <a href="#features" className="hover:text-white transition-colors">Key Features</a>
              <a href="#workflow" className="hover:text-white transition-colors">System Steppers</a>
              <Link to="/marketplace" className="hover:text-white transition-colors">Wholesale Marketplace</Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">For Shopkeepers</h4>
            <div className="flex flex-col gap-2.5">
              <Link to="/auth?mode=signup" className="hover:text-white transition-colors">Register Shop</Link>
              <Link to="/auth" className="hover:text-white transition-colors">Merchant Sign In</Link>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing Plans</a>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Customer Portal</h4>
            <div className="flex flex-col gap-2.5">
              <Link to="/track" className="hover:text-white transition-colors">Track Repair Job</Link>
              <Link to="/marketplace" className="hover:text-white transition-colors">Book Local Repairs</Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Support & Privacy</h4>
            <div className="flex flex-col gap-2.5">
              <a href="mailto:support@servixo.com" className="hover:text-white transition-colors">Contact Support</a>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 py-6 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} RepairXpert • Built for next-gen repair ecosystems • All rights reserved.
        </div>
      </footer>
    </div>
  );
}
