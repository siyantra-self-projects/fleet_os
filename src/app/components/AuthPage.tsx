import React, { useState } from "react"
import { Mail, Lock, Building, Truck, MapPin, Shield, Zap, BarChart3, ArrowRight, Eye, EyeOff, TrendingUp, Users, Globe } from "lucide-react"
import { toast } from "sonner"
import { UserAccount, getRelativeDate } from "./UI"
import api from "../../lib/api"

export default function AuthPage({ onLoginSuccess }: { onLoginSuccess: (user: UserAccount) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [showCpw, setShowCpw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error("Please fill in all fields"); return }
    if (!email.includes("@")) { toast.error("Please enter a valid email address"); return }

    setLoading(true)

    try {
      if (mode === "login") {
        const response = await api.login(email, password)
        
        if (response.success && response.user) {
          const normalizedUser = { 
            ...response.user, 
            role: response.user.role ?? "user",
            passwordVal: password 
          }
          onLoginSuccess(normalizedUser)
          toast.success(`Welcome back, ${response.user.companyName}!`)
        } else {
          toast.error(response.error || "Invalid email or password.")
        }
      } else {
        if (password.length < 5) { toast.error("Password must be at least 5 characters long"); return }
        if (password !== confirmPassword) { toast.error("Passwords do not match"); return }
        if (!companyName) { toast.error("Please specify your Company Name"); return }
        
        const response = await api.register(email, password, companyName, "GBP (£)")
        
        if (response.success && response.user) {
          const normalizedUser = { 
            ...response.user, 
            role: response.user.role ?? "user",
            passwordVal: password,
            joinedDate: getRelativeDate(0),
            plan: "Free",
            status: "Active"
          }
          onLoginSuccess(normalizedUser)
          toast.success("Account created successfully! Let's complete onboarding.")
        } else {
          toast.error(response.error || "Registration failed. Please try again.")
        }
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full pl-11 pr-4 py-3 text-sm bg-white/70 border border-[#b9c063]/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#cfd676]/60 focus:border-[#b9c063] focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 font-medium backdrop-blur-sm"

  return (
    <div className="min-h-screen flex select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden flex-col justify-between bg-[#F5F5F7] p-10">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />

        {/* Top — Logo + Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#18181A] rounded-2xl flex items-center justify-center shadow-md">
              <Truck className="w-5 h-5 text-[#cfd676]" />
            </div>
            <div>
              <h1 className="text-lg font-black text-[#18181A] tracking-tight">FleetOps</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Command Center</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/80 rounded-full shadow-sm">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-slate-650">Systems Active</span>
          </div>
        </div>

        {/* Center — Truck Image wrapped in a styled mockup card */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 py-6">
          <div className="bg-white rounded-[32px] p-3.5 border border-slate-200/70 shadow-xl shadow-slate-200/50 max-w-[390px] transition-transform hover:scale-[1.01] duration-355">
            <img
              src="/truck_hero.png"
              alt="FleetOps Delivery Truck"
              className="w-full h-auto rounded-[24px]"
            />
          </div>
          <div className="text-center mt-6 space-y-2">
            <h2 className="text-2xl xl:text-3xl font-black text-[#18181A] leading-tight tracking-tight">
              Fleet Intelligence,<br/>
              <span className="text-[#8a8f3e]">Redefined.</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
              Consolidated real-time analytics, automated logs, and enterprise management.
            </p>
          </div>
        </div>

        {/* Bottom — Futuristic Stat Cards */}
        <div className="relative z-10 grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-[#cfd676]/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#8a8f3e]" />
              </div>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">+24%</span>
            </div>
            <p className="text-lg font-black text-[#18181A]">2,847</p>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5">Active Fleets</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-sky-100 rounded-xl flex items-center justify-center">
                <Globe className="w-4 h-4 text-sky-600" />
              </div>
              <span className="text-[9px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-full">LIVE</span>
            </div>
            <p className="text-lg font-black text-[#18181A]">99.9%</p>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5">Uptime</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center">
                <Users className="w-4 h-4 text-violet-600" />
              </div>
              <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full">GLOBAL</span>
            </div>
            <p className="text-lg font-black text-[#18181A]">14K+</p>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5">Operators</p>
          </div>
        </div>
      </div>

      {/* ─── Right Panel — Light Green Background with a clean spacious login card ─── */}
      <div className="w-full lg:w-[50%] flex items-center justify-center relative overflow-hidden px-6 py-10" style={{ background: "linear-gradient(160deg, #e8edb8 0%, #dde3a0 40%, #d4da92 100%)" }}>
        {/* Subtle decorative circles */}
        <div className="absolute w-[400px] h-[400px] bg-white/20 rounded-full blur-[100px] -top-24 right-0" />
        <div className="absolute w-[300px] h-[300px] bg-white/15 rounded-full blur-[80px] bottom-10 -left-10" />

        <div className="w-full max-w-[500px] bg-white/70 backdrop-blur-xl rounded-[32px] p-8 xl:p-10 border border-white shadow-2xl shadow-[#b9c063]/25 z-10 flex flex-col gap-6">
          
          {/* Header */}
          <div className="space-y-1">
            <h2 className="text-2xl xl:text-3xl font-black text-[#18181A] tracking-tight">
              {mode === "login" ? "Welcome back" : "Get started"}
            </h2>
            <p className="text-xs xl:text-sm text-slate-650 font-medium">
              {mode === "login"
                ? "Sign in to access your fleet command center"
                : "Create your enterprise logistics account"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-450" />
                  <input
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-11 pr-5 py-3.5 text-sm bg-white/60 border border-[#b9c063]/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#cfd676]/65 focus:border-[#b9c063] focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 font-medium backdrop-blur-sm"
                  />
                </div>
              </div>

              {mode === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Organization Name</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-450" />
                    <input
                      type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)}
                      placeholder="Your organization name"
                      className="w-full pl-11 pr-5 py-3.5 text-sm bg-white/60 border border-[#b9c063]/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#cfd676]/65 focus:border-[#b9c063] focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 font-medium backdrop-blur-sm"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-450" />
                  <input
                    type={showPw ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3.5 text-sm bg-white/60 border border-[#b9c063]/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#cfd676]/65 focus:border-[#b9c063] focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 font-medium backdrop-blur-sm"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-450" />
                    <input
                      type={showCpw ? "text" : "password"} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-11 py-3.5 text-sm bg-white/60 border border-[#b9c063]/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#cfd676]/65 focus:border-[#b9c063] focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 font-medium backdrop-blur-sm"
                    />
                    <button type="button" onClick={() => setShowCpw(!showCpw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                      {showCpw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full py-4 bg-[#18181A] hover:bg-[#2a2a2d] text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-black/10 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
              {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200/60" />
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-slate-200/60" />
          </div>

          {/* Toggle */}
          <div className="text-center">
            <button
              onClick={() => setMode(m => m === "login" ? "signup" : "login")}
              className="text-xs xl:text-sm text-slate-600 hover:text-[#18181A] font-medium cursor-pointer transition-colors"
            >
              {mode === "login"
                ? <>Don't have an account?{" "}<span className="font-bold text-[#18181A] underline underline-offset-4 decoration-[#b9c063] decoration-2">Sign up free</span></>
                : <>Already registered?{" "}<span className="font-bold text-[#18181A] underline underline-offset-4 decoration-[#b9c063] decoration-2">Sign in</span></>
              }
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 pt-1">
            {[
              { icon: Shield, label: "SOC 2" },
              { icon: Lock, label: "256-bit SSL" },
              { icon: Globe, label: "GDPR" },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-1 text-[9px] font-bold text-slate-550">
                <b.icon className="w-3 h-3" />
                {b.label}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── Onboarding Wizard Page ──────────────────────────────────────────────────
