import React, { useState, useMemo, useEffect } from "react"
import { Users, Receipt, Activity, Shield, LogOut, Search, Plus, Trash2, CheckCircle, X, ChevronRight, ArrowUpRight, DollarSign, TrendingUp, RefreshCw, Eye, Terminal, Settings, AlertCircle, HelpCircle, Rocket, Bell, ChevronDown, Check, Truck } from "lucide-react"
import { toast } from "sonner"
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts"

const TOOLTIP_STYLE = {
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
}
import { UserAccount, PlatformPayment, PlatformActivityLog, PlatformTicket, PlatformSettings, Btn, FInput, FSelect, Badge, Card, Table, fmt, getRelativeDate, TODAY } from "./UI"

export default function PlatformPage({
  users, setUsers, payments, setPayments, onMenu, onImpersonate, currencySymbol,
  logs, setLogs, tickets, setTickets, platformConfig, setPlatformConfig,
  currentUser, onLogout
}: {
  users: UserAccount[]
  setUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>
  payments: PlatformPayment[]
  setPayments: React.Dispatch<React.SetStateAction<PlatformPayment[]>>
  onMenu: () => void
  onImpersonate: (email: string) => void
  currencySymbol: string
  logs: PlatformActivityLog[]
  setLogs: React.Dispatch<React.SetStateAction<PlatformActivityLog[]>>
  tickets: PlatformTicket[]
  setTickets: React.Dispatch<React.SetStateAction<PlatformTicket[]>>
  platformConfig: PlatformSettings
  setPlatformConfig: React.Dispatch<React.SetStateAction<PlatformSettings>>
  currentUser: UserAccount | null
  onLogout: () => void
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "directory" | "billing" | "logs" | "support" | "config">("overview")
  const [showPayForm, setShowPayForm] = useState(false)
  const [payForm, setPayForm] = useState({ email: "", amount: "", plan: "Premium" as const, status: "Paid" as const })

  // Support ticket response text area
  const [replyText, setReplyText] = useState("")
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null)

  // Config settings form state
  const [confForm, setConfForm] = useState<PlatformSettings>(platformConfig)

  // Sync config state if modified outside
  useEffect(() => {
    setConfForm(platformConfig)
  }, [platformConfig])

  // Calculate Platform statistics
  const totalUsers = users.length
  const onboardedUsers = users.filter(u => u.onboarded).length
  const activeSubs = users.filter(u => u.status === "Active" && u.plan !== "Free").length
  
  // Calculate MRR based on prices configured in settings
  const mrr = users.reduce((sum, u) => {
    if (u.status !== "Active") return sum
    if (u.plan === "Premium") return sum + platformConfig.premiumPrice
    if (u.plan === "Enterprise") return sum + platformConfig.enterprisePrice
    return sum
  }, 0)

  const totalPaidTransactions = payments
    .filter(p => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0)

  // Log new activities helper
  const addLog = (action: string, level: "info" | "warning" | "danger" | "success" = "info", email = currentUser?.email || "system") => {
    const newLog: PlatformActivityLog = {
      id: "log-" + Math.floor(1000 + Math.random() * 9000),
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
      email,
      action,
      level,
    }
    setLogs(prev => [newLog, ...prev])
  }

  const handleCreatePayment = () => {
    if (!payForm.email || !payForm.amount) { toast.error("Please enter email and invoice amount"); return }
    const match = users.find(u => u.email.toLowerCase() === payForm.email.toLowerCase())
    const company = match ? match.companyName : "External Company"
    const amountVal = parseFloat(payForm.amount) || 0

    const newPay: PlatformPayment = {
      id: "tx-" + Math.floor(100 + Math.random() * 900),
      date: TODAY,
      companyName: company,
      email: payForm.email.toLowerCase(),
      amount: amountVal,
      plan: payForm.plan,
      status: payForm.status,
    }

    setPayments(prev => [newPay, ...prev])
    setShowPayForm(false)
    setPayForm({ email: "", amount: "", plan: "Premium", status: "Paid" })
    addLog(`Recorded manual invoice payment of ${fmt(amountVal, currencySymbol)} for ${payForm.email}`, "success")
    toast.success("Payment transaction logged successfully")
  }

  const handleUpdatePlan = (email: string, plan: "Free" | "Premium" | "Enterprise") => {
    setUsers(prev => prev.map(u => u.email === email ? { ...u, plan } : u))
    addLog(`Updated subscription pricing tier of ${email} to ${plan}`, "info")
    toast.success(`Plan updated to ${plan} for ${email}`)
  }

  const handleToggleStatus = (email: string) => {
    setUsers(prev => prev.map(u => {
      if (u.email === email) {
        const nextStatus = u.status === "Active" ? "Suspended" : "Active"
        addLog(`${nextStatus === "Suspended" ? "Suspended" : "Activated"} company access permission for ${email}`, nextStatus === "Suspended" ? "danger" : "success")
        toast.success(`User account status set to ${nextStatus}`)
        return { ...u, status: nextStatus }
      }
      return u
    }))
  }

  const handleUpdatePaymentStatus = (id: string, status: "Paid" | "Pending" | "Refunded" | "Failed") => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status } : p))
    addLog(`Updated invoice transaction status of ${id} to ${status}`, status === "Paid" ? "success" : "warning")
    toast.success(`Transaction ${id} marked as ${status}`)
  }

  const handleSolveTicket = (id: string) => {
    if (!replyText) { toast.error("Please enter a reply message first"); return }
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: "Resolved" } : t))
    addLog(`Resolved support ticket ${id} with automated reply`, "success")
    toast.success(`Ticket ${id} marked as Resolved and reply sent!`)
    setReplyText("")
    setActiveTicketId(null)
  }

  const handleSaveConfig = () => {
    setPlatformConfig(confForm)
    addLog("Modified global platform billing rules and configuration settings", "warning")
    toast.success("Global system settings updated successfully")
  }

  // Analytics graph generation
  const monthlyRevenueData = [
    { month: "Feb", revenue: 198, subscribers: 2 },
    { month: "Mar", revenue: 297, subscribers: 3 },
    { month: "Apr", revenue: 396, subscribers: 4 },
    { month: "May", revenue: 594, subscribers: 5 },
    { month: "Jun", revenue: 594, subscribers: 5 },
    { month: "Jul", revenue: mrr, subscribers: totalUsers },
  ]

  const userRows = users.map(u => ({
    email: u.email,
    company: u.companyName || "—",
    plan: u.plan || "Free",
    status: u.status || "Active",
    joined: u.joinedDate || TODAY,
    onboarded: u.onboarded ? "Completed" : "Pending",
  })) as Record<string, unknown>[]

  const paymentRows = payments.map(p => ({
    id: p.id,
    date: p.date,
    company: p.companyName,
    email: p.email,
    amount: fmt(p.amount, currencySymbol),
    plan: p.plan,
    status: p.status,
  })) as Record<string, unknown>[]

  const userOptions = useMemo(() => users.map(u => ({ value: u.email, label: `${u.email} (${u.companyName || "No Company"})` })), [users])

  const sidebarItems = [
    { id: "overview" as const, label: "Overview", icon: Users },
    { id: "directory" as const, label: "Customer Directory", icon: Shield },
    { id: "billing" as const, label: "Billing & Ledger", icon: Receipt },
    { id: "logs" as const, label: "System Activity Logs", icon: Terminal },
    { id: "support" as const, label: "Customer Support Desk", icon: HelpCircle },
    { id: "config" as const, label: "Global Settings", icon: Settings },
  ]

  return (
    <div className="flex h-screen w-full bg-[#f4f5f8] text-slate-800 overflow-hidden font-sans">
      
      {/* ─── Premium Sidebar ─── */}
      <div className="w-[272px] bg-[#e4e9a8] flex flex-col shrink-0 relative z-20 border-r border-[#cfd676]/50">
        
        {/* Top: Logo + Brand */}
        <div className="px-6 pt-7 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm border border-white/60">
              <Truck className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h1 className="text-[15px] font-black text-slate-800 tracking-tight leading-none">FleetOps</h1>
              <p className="text-[9px] font-bold text-slate-600/70 uppercase tracking-[0.2em] mt-0.5">Platform Console</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-white/40" />

        {/* Navigation */}
        <div className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
          <p className="text-[9px] font-black text-slate-600/50 uppercase tracking-[0.2em] px-3 mb-3">Navigation</p>
          {sidebarItems.map(item => {
            const active = activeTab === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[12px] font-semibold transition-all duration-200 cursor-pointer relative group ${
                  active
                    ? "bg-white text-slate-800 shadow-md font-bold"
                    : "text-slate-600 hover:text-slate-800 hover:bg-white/40"
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-slate-700 rounded-r-full" />
                )}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  active
                    ? "bg-[#cfd676] text-slate-700"
                    : "bg-white/30 text-slate-500 group-hover:bg-white/50 group-hover:text-slate-700"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-white/40" />

        {/* Bottom: Truck Hero Image Card + Logout */}
        <div className="p-4 space-y-3">
          <div className="relative rounded-2xl overflow-hidden h-36 border border-white/40 shadow-sm">
            <img
              src="/truck_hero.png"
              alt="Fleet Operations"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-[10px] font-black text-white uppercase tracking-wider">Fleet Command</p>
              <p className="text-[9px] text-white/60 font-medium mt-0.5">Multi-region dispatch & analytics</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[12px] font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50/60 transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/30 flex items-center justify-center group-hover:bg-red-50 transition-colors">
              <LogOut className="w-4 h-4" />
            </div>
            Sign Out
          </button>
        </div>
      </div>

      {/* ─── Main Content Pane ─── */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        
        {/* Top Header Bar */}
        <div className="h-16 border-b border-slate-100 bg-white/80 backdrop-blur-sm flex items-center justify-between px-8 shrink-0">
          {/* Search bar mockup */}
          <div className="relative w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              type="text"
              placeholder="Search subscribers, database, logs..."
              className="w-full bg-slate-50/80 border border-slate-200/40 pl-10 pr-4 py-2.5 text-xs rounded-xl focus:outline-none focus:border-[#cfd676] font-medium text-slate-600 placeholder:text-slate-400"
            />
          </div>

          {/* User profile / Actions */}
          <div className="flex items-center gap-4">
            {activeTab === "billing" && (
              <button
                onClick={() => setShowPayForm(s => !s)}
                className="px-4 py-2 bg-[#cfd676] hover:bg-[#c5cc6a] text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Log Billing Entry
              </button>
            )}

            {/* Notification Mock */}
            <div className="relative p-2 hover:bg-slate-50 rounded-xl cursor-pointer">
              <Bell className="w-4 h-4 text-slate-600" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white" />
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200/60">
              <div className="w-8 h-8 rounded-full bg-[#e4e9a8] flex items-center justify-center text-xs font-black text-slate-700">
                {currentUser?.email.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-700 leading-tight">Lucas Bennett</p>
                <p className="text-[10px] text-slate-400 font-medium">{currentUser?.email || "system"}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Tab Scroll Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">

          {/* ─── TAB 1: OVERVIEW ─── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              
              {/* 4 Pastel Top KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* Lavender Subscribers */}
                <div className="bg-[#ECEEFB] rounded-3xl p-5 border border-violet-100 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">Total Subscribers</span>
                    <div className="w-9 h-9 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-500">
                      <Users className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-slate-800">{totalUsers}</h3>
                  <p className="text-[10px] font-semibold text-violet-500 mt-2.5">↑ 12% vs last month</p>
                </div>

                {/* Pale Green Onboarded */}
                <div className="bg-[#DCEEDE] rounded-3xl p-5 border border-emerald-100 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Fully Onboarded</span>
                    <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                      <CheckCircle className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-slate-800">{onboardedUsers}/{totalUsers}</h3>
                  <p className="text-[10px] font-semibold text-emerald-600 mt-2.5">↑ 4% vs last month</p>
                </div>

                {/* Soft Peach Billing Tiers */}
                <div className="bg-[#FDE8DE] rounded-3xl p-5 border border-orange-100 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Active Billing Tiers</span>
                    <div className="w-9 h-9 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                      <Activity className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-slate-800">{activeSubs}</h3>
                  <p className="text-[10px] font-semibold text-orange-500 mt-2.5">0% vs last month</p>
                </div>

                {/* Soft Yellow Monthly Cost/MRR */}
                <div className="bg-[#F8F5E0] rounded-3xl p-5 border border-yellow-100 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-wider">Monthly Revenue (MRR)</span>
                    <div className="w-9 h-9 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-600">
                      <DollarSign className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-slate-800">{fmt(mrr, currencySymbol)}</h3>
                  <p className="text-[10px] font-semibold text-yellow-600 mt-2.5">↓ 5% vs last month</p>
                </div>
              </div>

              {/* Main Content Grid (AXIUS chart and alerts style) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Custom Area Chart for MRR */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[13px] font-bold text-slate-700">Platform Revenue Growth (MRR)</h3>
                    <select className="text-[10px] font-semibold border border-slate-200 rounded-lg px-2 py-1.5 text-slate-500 bg-slate-50">
                      <option>Monthly</option>
                      <option>Weekly</option>
                    </select>
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b9a2b" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#8b9a2b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${currencySymbol}${v}`} />
                      <Tooltip formatter={(v: number) => fmt(v, currencySymbol)} contentStyle={TOOLTIP_STYLE} />
                      <Area type="monotone" dataKey="revenue" name="MRR" stroke="#8b9a2b" strokeWidth={2.5} fill="url(#revenueG)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* System Alerts list card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-[13px] font-bold text-slate-700">System Alerts</h3>
                  <div className="space-y-3">
                    
                    {/* Alert 1 */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-55/60 border border-slate-100 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">High API latency d...</p>
                          <p className="text-[9px] font-medium text-slate-400 mt-0.5">30 mins ago</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-500 text-white rounded-full">Critical</span>
                    </div>

                    {/* Alert 2 */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-55/60 border border-slate-100 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">Storage limit appr...</p>
                          <p className="text-[9px] font-medium text-slate-400 mt-0.5">1 hour ago</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Warning</span>
                    </div>

                    {/* Alert 3 */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-55/60 border border-slate-100 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">New user added t...</p>
                          <p className="text-[9px] font-medium text-slate-400 mt-0.5">2 hours ago</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">Info</span>
                    </div>

                    {/* Alert 4 */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-55/60 border border-slate-100 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">Unusual login atte...</p>
                          <p className="text-[9px] font-medium text-slate-400 mt-0.5">3 hours ago</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-500 text-white rounded-full">Critical</span>
                    </div>

                  </div>
                </div>
              </div>

              {/* Row of 4 Smaller Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1 */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-violet-500 font-bold text-[10px] uppercase tracking-wider">
                    <div className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
                    Average Latency
                  </div>
                  <h4 className="text-xl font-black text-slate-800">98ms</h4>
                  <p className="text-[9px] text-slate-400 font-medium mt-1">Response time</p>
                </div>
                {/* 2 */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-emerald-500 font-bold text-[10px] uppercase tracking-wider">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    Accuracy Score
                  </div>
                  <h4 className="text-xl font-black text-slate-800">96.8%</h4>
                  <p className="text-[9px] text-slate-400 font-medium mt-1">Benchmark tests</p>
                </div>
                {/* 3 */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-orange-500 font-bold text-[10px] uppercase tracking-wider">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    Error Rate
                  </div>
                  <h4 className="text-xl font-black text-slate-800">0.5%</h4>
                  <p className="text-[9px] text-slate-400 font-medium mt-1">API failures</p>
                </div>
                {/* 4 */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-yellow-600 font-bold text-[10px] uppercase tracking-wider">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                    Throughput
                  </div>
                  <h4 className="text-xl font-black text-slate-800">1.8K req/s</h4>
                  <p className="text-[9px] text-slate-400 font-medium mt-1">Requests handled</p>
                </div>
              </div>

              {/* Bottom Row - Recent Experiments Table & Registered Growth */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Table: Recent Users */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Registered Accounts</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-black uppercase tracking-wider text-slate-450 border-b border-slate-100">
                          <th className="py-2.5">Company Name</th>
                          <th className="py-2.5">Email</th>
                          <th className="py-2.5">Plan</th>
                          <th className="py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs font-semibold text-slate-700">
                        {users.slice(0, 3).map((r) => (
                          <tr key={r.email} className="border-b border-slate-100/50 hover:bg-slate-50/40 transition-colors">
                            <td className="py-3 font-extrabold text-slate-900">{r.companyName || "—"}</td>
                            <td className="py-3 font-mono text-slate-400">{r.email}</td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">
                                {r.plan}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                r.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${r.status === "Active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Subscriptions Chart */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Subscribers Growth</h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={monthlyRevenueData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="subscribers" name="Subscribers" fill="#4e4bf2" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 2: CUSTOMER DIRECTORY ─── */}
          {activeTab === "directory" && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Global Customer Directory</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Verify registered operator details and Impersonate dashboards</p>
                </div>
              </div>
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100">
                      <th className="py-3 pl-6">Company Name</th>
                      <th className="py-3">Account Email</th>
                      <th className="py-3">Onboarding</th>
                      <th className="py-3">Pricing Plan</th>
                      <th className="py-3">Status</th>
                      <th className="py-3 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-semibold text-slate-700 divide-y divide-slate-100">
                    {userRows.map((r, i) => {
                      const isSelf = String(r.email) === currentUser?.email
                      return (
                        <tr key={String(r.email)} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="py-3.5 pl-6">
                            <span className="font-extrabold text-slate-900">{String(r.company)}</span>
                          </td>
                          <td className="py-3.5 text-slate-400 font-mono">{String(r.email)}</td>
                          <td className="py-3.5">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${
                              r.onboarded === "Completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                            }`}>
                              {String(r.onboarded)}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <select
                              value={String(r.plan)}
                              onChange={e => handleUpdatePlan(String(r.email), e.target.value as "Free" | "Premium" | "Enterprise")}
                              className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-700 cursor-pointer focus:outline-none focus:border-slate-350"
                            >
                              <option>Free</option>
                              <option>Premium</option>
                              <option>Enterprise</option>
                            </select>
                          </td>
                          <td className="py-3.5">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${
                              r.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                            }`}>
                              {String(r.status)}
                            </span>
                          </td>
                          <td className="py-3.5 pr-6 text-right">
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={() => handleToggleStatus(String(r.email))}
                                disabled={isSelf}
                                title={r.status === "Active" ? "Suspend Account" : "Activate Account"}
                                className={`p-1.5 rounded-xl border border-slate-200/60 bg-white text-slate-450 hover:bg-slate-50 transition-all ${
                                  isSelf ? "opacity-20 cursor-not-allowed" : "hover:text-red-650 cursor-pointer shadow-sm"
                                }`}
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onImpersonate(String(r.email))}
                                disabled={r.onboarded !== "Completed"}
                                title="Impersonate Dashboard"
                                className="p-1.5 rounded-xl border border-slate-200/60 bg-white text-slate-450 hover:text-violet-600 hover:bg-slate-50 hover:border-violet-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── TAB 3: BILLING & TRANSACTIONS ─── */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              {showPayForm && (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Log Billing Invoice Entry</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                    <SearchableSelect
                      label="Account Email"
                      value={payForm.email}
                      onChange={val => setPayForm(f => ({ ...f, email: val }))}
                      options={userOptions}
                    />
                    <FInput label="Billing Amount" type="number" placeholder="0.00" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
                    <FSelect label="Pricing Plan" value={payForm.plan} onChange={e => setPayForm(f => ({ ...f, plan: e.target.value as "Premium" | "Enterprise" | "Free" }))}>
                      <option>Premium</option>
                      <option>Enterprise</option>
                      <option>Free</option>
                    </FSelect>
                    <FSelect label="Invoice Status" value={payForm.status} onChange={e => setPayForm(f => ({ ...f, status: e.target.value as "Paid" | "Pending" | "Refunded" | "Failed" }))}>
                      <option>Paid</option>
                      <option>Pending</option>
                      <option>Refunded</option>
                      <option>Failed</option>
                    </FSelect>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      onClick={() => setShowPayForm(false)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreatePayment}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-755 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Create Ledger Record
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Billing History Ledger</h3>
                <div className="overflow-x-auto -mx-6">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100">
                        <th className="py-3 pl-6">Transaction ID</th>
                        <th className="py-3">Date</th>
                        <th className="py-3">Company</th>
                        <th className="py-3">Billing Email</th>
                        <th className="py-3">Amount</th>
                        <th className="py-3">Plan Tier</th>
                        <th className="py-3 pr-6 text-right">Invoice Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-semibold text-slate-700 divide-y divide-slate-100">
                      {paymentRows.map((r, i) => (
                        <tr key={String(r.id)} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 pl-6 font-mono text-slate-400">{String(r.id)}</td>
                          <td className="py-3.5 text-slate-500">{String(r.date)}</td>
                          <td className="py-3.5 font-bold text-slate-800">{String(r.company)}</td>
                          <td className="py-3.5 text-slate-500 font-mono">{String(r.email)}</td>
                          <td className="py-3.5 font-mono font-black text-slate-900">{String(r.amount)}</td>
                          <td className="py-3.5">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-650">
                              {String(r.plan)}
                            </span>
                          </td>
                          <td className="py-3.5 pr-6 text-right">
                            <select
                              value={String(r.status)}
                              onChange={e => handleUpdatePaymentStatus(String(r.id), e.target.value as "Paid" | "Pending" | "Refunded" | "Failed")}
                              className={`text-[10px] font-black rounded-lg p-1.5 border cursor-pointer focus:outline-none ${
                                r.status === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                r.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-100" :
                                "bg-rose-50 text-rose-700 border-rose-100"
                              }`}
                            >
                              <option>Paid</option>
                              <option>Pending</option>
                              <option>Refunded</option>
                              <option>Failed</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 4: SYSTEM ACTIVITY LOGS ─── */}
          {activeTab === "logs" && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">System Activity Logs</h3>
              <div className="bg-slate-900 rounded-2xl p-5 font-mono text-xs text-slate-350 space-y-2.5 max-h-[460px] overflow-y-auto border border-slate-800">
                <div className="text-[10px] text-slate-500 mb-3 select-none flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>// FLEETOPS MAIN CORE DOCKER CONSOLE</span>
                </div>
                {logs.map((log) => {
                  const badgeColor = {
                    success: "text-emerald-450 bg-emerald-950/40 border border-emerald-900/60",
                    warning: "text-amber-455 bg-amber-955/40 border border-amber-900/60",
                    danger: "text-rose-455 bg-rose-955/40 border border-rose-900/60",
                    info: "text-sky-455 bg-sky-955/40 border border-sky-900/60",
                  }[log.level]
                  return (
                    <div key={log.id} className="flex flex-col sm:flex-row sm:items-center gap-2 border-b border-slate-800/40 pb-2">
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">{log.date}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase whitespace-nowrap ${badgeColor}`}>
                        {log.level}
                      </span>
                      <span className="text-violet-400 font-bold whitespace-nowrap">{log.email}</span>
                      <span className="text-slate-200">{log.action}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ─── TAB 5: SUPPORT TICKETS ─── */}
          {activeTab === "support" && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Customer Support Ticket Manager</h3>
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100">
                      <th className="py-3 pl-6">Ticket ID</th>
                      <th className="py-3">Received Date</th>
                      <th className="py-3">Company</th>
                      <th className="py-3">User Email</th>
                      <th className="py-3">Subject</th>
                      <th className="py-3">Message Inquiry</th>
                      <th className="py-3">Status</th>
                      <th className="py-3 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-semibold text-slate-700 divide-y divide-slate-100">
                    {tickets.map((r, i) => {
                      const isOpen = r.status === "Open"
                      return (
                        <tr key={String(r.id)} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 pl-6 font-mono text-slate-400">{String(r.id)}</td>
                          <td className="py-3.5 text-slate-500">{String(r.date)}</td>
                          <td className="py-3.5 font-bold text-slate-900">{String(r.companyName)}</td>
                          <td className="py-3.5 text-slate-450 font-mono">{String(r.email)}</td>
                          <td className="py-3.5 text-slate-900 truncate max-w-[150px]">{String(r.subject)}</td>
                          <td className="py-3.5 text-slate-450 truncate max-w-[200px]" title={String(r.message)}>{String(r.message)}</td>
                          <td className="py-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              isOpen ? "bg-orange-50 text-orange-700 border border-orange-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            }`}>
                              {String(r.status)}
                            </span>
                          </td>
                          <td className="py-3.5 pr-6 text-right">
                            <button
                              disabled={!isOpen}
                              onClick={() => {
                                setActiveTicketId(String(r.id))
                                setReplyText("")
                              }}
                              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                                isOpen
                                  ? "bg-violet-600 text-white hover:bg-violet-755 cursor-pointer shadow-sm"
                                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
                              }`}
                            >
                              {isOpen ? "Reply" : "Resolved"}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Response Modal */}
              {activeTicketId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                  <div className="bg-white border border-slate-200/80 rounded-[32px] p-6 max-w-md w-full space-y-4 shadow-2xl">
                    <h3 className="text-sm font-bold text-slate-900">Reply to ticket: {activeTicketId}</h3>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-655">
                      <strong>Message Inquiry:</strong> <p className="mt-1">"{tickets.find(t => t.id === activeTicketId)?.message}"</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-450 uppercase tracking-wider">Response Message</label>
                      <textarea
                        rows={4}
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Enter response details to dispatch to user..."
                        className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-400/40 text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        onClick={() => setActiveTicketId(null)}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSolveTicket(activeTicketId)}
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-755 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Dispatch Reply & Resolve
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB 6: GLOBAL CONFIGURATIONS ─── */}
          {activeTab === "config" && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Global Platform Configuration Settings</h3>
              <div className="max-w-xl space-y-6 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FInput
                    label="Premium Plan Price / Month"
                    type="number"
                    value={confForm.premiumPrice}
                    onChange={e => setConfForm(c => ({ ...c, premiumPrice: parseInt(e.target.value) || 0 }))}
                  />
                  <FInput
                    label="Enterprise Plan Price / Month"
                    type="number"
                    value={confForm.enterprisePrice}
                    onChange={e => setConfForm(c => ({ ...c, enterprisePrice: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div className="border-t border-slate-100 pt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">System Maintenance Mode</h4>
                      <p className="text-[11px] text-slate-450">Put the platform in read-only maintenance mode</p>
                    </div>
                    <button
                      onClick={() => setConfForm(c => ({ ...c, maintenanceMode: !c.maintenanceMode }))}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        confForm.maintenanceMode ? "bg-red-500" : "bg-slate-200"
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        confForm.maintenanceMode ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Registrations Open</h4>
                      <p className="text-[11px] text-slate-450">Allow new companies to sign up for accounts</p>
                    </div>
                    <button
                      onClick={() => setConfForm(c => ({ ...c, registrationOpen: !c.registrationOpen }))}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        confForm.registrationOpen ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        confForm.registrationOpen ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSaveConfig}
                  className="w-full py-4 mt-4 bg-violet-600 hover:bg-violet-755 text-white rounded-2xl text-sm font-bold transition-all shadow-md shadow-violet-100 cursor-pointer"
                >
                  Save System Configurations
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
