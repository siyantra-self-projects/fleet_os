import React, { useState } from "react"
import { Mail, Lock, Building, SlidersHorizontal } from "lucide-react"
import { toast } from "sonner"
import { UserAccount, Btn, FInput, getRelativeDate } from "./UI"

export default function AuthPage({ onLoginSuccess }: { onLoginSuccess: (user: UserAccount) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [companyName, setCompanyName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error("Please fill in all fields"); return }
    if (!email.includes("@")) { toast.error("Please enter a valid email address"); return }

    // Fetch local user base
    const usersRaw = localStorage.getItem("fleet_os_users")
    const users: UserAccount[] = usersRaw ? JSON.parse(usersRaw) : []

    if (mode === "login") {
      const match = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.passwordVal === password)
      // Enable fallback to default admin credentials
      if (!match && email === "admin@fleetops.io" && password === "admin123") {
        const defaultAdmin: UserAccount = {
          email: "admin@fleetops.io",
          passwordVal: "admin123",
          companyName: "FleetOps Corporate",
          onboarded: true,
          currency: "GBP (£)",
          plan: "Enterprise",
          status: "Active",
          joinedDate: getRelativeDate(30),
        }
        // Save to users list
        localStorage.setItem("fleet_os_users", JSON.stringify([...users, defaultAdmin]))
        onLoginSuccess(defaultAdmin)
        toast.success("Welcome back, Administrator!")
        return
      }

      if (match) {
        if (match.status === "Suspended") {
          toast.error("Your organization account has been suspended. Please contact platform support.")
          return
        }
        onLoginSuccess(match)
        toast.success(`Welcome back, ${match.companyName}!`)
      } else {
        toast.error("Invalid email or password. Hint: admin@fleetops.io / admin123")
      }
    } else {
      if (password.length < 5) { toast.error("Password must be at least 5 characters long"); return }
      if (password !== confirmPassword) { toast.error("Passwords do not match"); return }
      if (!companyName) { toast.error("Please specify your Company Name"); return }

      const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase())
      if (exists) { toast.error("An account with this email already exists"); return }

      const newUser: UserAccount = {
        email: email.toLowerCase(),
        passwordVal: password,
        companyName,
        onboarded: false,
        currency: "GBP (£)",
        plan: "Free",
        status: "Active",
        joinedDate: getRelativeDate(0),
      }

      localStorage.setItem("fleet_os_users", JSON.stringify([...users, newUser]))
      onLoginSuccess(newUser)
      toast.success("Account created successfully! Let's complete onboarding.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Decorative Gradients */}
      <div className="absolute w-[400px] h-[400px] bg-violet-400/10 rounded-full blur-3xl -top-40 -left-40"></div>
      <div className="absolute w-[400px] h-[400px] bg-emerald-400/10 rounded-full blur-3xl -bottom-40 -right-40"></div>

      <div className="w-full max-w-[420px] bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-100/50 p-8 z-10 space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200 mb-2">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {mode === "login" ? "Sign in to FleetOps" : "Create your Command Center"}
          </h2>
          <p className="text-xs text-slate-400">
            {mode === "login" ? "Enter your fleet credentials below" : "Set up your independent enterprise dashboard"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:bg-white transition-all text-slate-800"
              />
            </div>
          </div>

          {mode === "signup" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Company / Organization Name</label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Alpha Logistics Ltd"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:bg-white transition-all text-slate-800"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:bg-white transition-all text-slate-800"
              />
            </div>
          </div>

          {mode === "signup" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:bg-white transition-all text-slate-800"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 mt-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-violet-100 cursor-pointer"
          >
            {mode === "login" ? "Sign In" : "Register and Onboard"}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-50">
          <button
            onClick={() => setMode(m => m === "login" ? "signup" : "login")}
            className="text-xs text-violet-600 hover:text-violet-700 font-semibold cursor-pointer transition-colors"
          >
            {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Onboarding Wizard Page ──────────────────────────────────────────────────
