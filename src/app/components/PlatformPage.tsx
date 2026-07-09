import React, { useState, useMemo } from "react"
import { Users, Receipt, Activity, Shield, LogOut, Search, Plus, Trash2, CheckCircle, X, ChevronRight, ArrowUpRight } from "lucide-react"
import { toast } from "sonner"
import { UserAccount, PlatformPayment, PlatformActivityLog, PlatformTicket, PlatformSettings, Btn, FInput, FSelect, Badge, Card, Table, fmt, getRelativeDate } from "./UI"

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
  const addLog = (action: string, level: "info" | "warning" | "danger" | "success" = "info", email = "admin@fleetops.io") => {
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

  const tabs = [
    { id: "overview" as const, label: "Overview", count: null },
    { id: "directory" as const, label: "Customer Directory", count: totalUsers },
    { id: "billing" as const, label: "Billing & Transactions", count: payments.length },
    { id: "logs" as const, label: "System Activity", count: logs.length },
    { id: "support" as const, label: "Support Desk", count: tickets.filter(t => t.status === "Open").length },
    { id: "config" as const, label: "Global Settings", count: null },
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      <TopBarComponent
        title="Platform Control Console"
        subtitle="Manage user directories, billing status, and core platform revenue"
        user={currentUser}
        onLogout={onLogout}
        actions={
          activeTab === "billing" && (
            <Btn onClick={() => setShowPayForm(s => !s)}>
              <Plus className="w-4 h-4" /> Log Billing Entry
            </Btn>
          )
        }
      />

      {/* Admin sub-navigation tabs */}
      <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex gap-4 overflow-x-auto">
        <div className="flex bg-slate-200/50 p-1 rounded-[16px] gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === t.id
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/40"
              }`}
            >
              {t.label}
              {t.count !== null && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === t.id ? "bg-white/20 text-white" : "bg-slate-300 text-slate-700"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <KPI label="Total Subscribers" value={String(totalUsers)} icon={Users} iconCls="bg-violet-50 text-violet-600" />
              <KPI label="Fully Onboarded" value={`${onboardedUsers}/${totalUsers}`} icon={CheckCircle} iconCls="bg-emerald-50 text-emerald-600" />
              <KPI label="Active Billing Tiers" value={String(activeSubs)} icon={Activity} iconCls="bg-blue-50 text-blue-600" />
              <KPI label="Monthly Recurring Revenue" value={fmt(mrr, currencySymbol)} icon={TrendingUp} iconCls="bg-emerald-50 text-emerald-600" />
              <KPI label="Lifetime Invoices Paid" value={fmt(totalPaidTransactions, currencySymbol)} icon={DollarSign} iconCls="bg-yellow-50 text-yellow-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">Monthly Recurring Revenue (MRR) Growth</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthlyRevenueData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mrrG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${currencySymbol}${v}`} />
                    <Tooltip formatter={(v: number) => fmt(v, currencySymbol)} contentStyle={TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="revenue" name="MRR" stroke="#7c3aed" strokeWidth={2.5} fill="url(#mrrG)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">Registered Accounts Growth</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyRevenueData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="subscribers" name="Subscribers" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOMER DIRECTORY */}
        {activeTab === "directory" && (
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">Global Customer Directory</h3>
            <Table
              columns={[
                { key: "company", label: "Company Name" },
                { key: "email", label: "Account Email" },
                { key: "onboarded", label: "Onboarding", render: r => <Badge color={r.onboarded === "Completed" ? "green" : "yellow"}>{String(r.onboarded)}</Badge> },
                {
                  key: "plan", label: "Pricing Plan",
                  render: r => (
                    <select
                      value={String(r.plan)}
                      onChange={e => handleUpdatePlan(String(r.email), e.target.value as "Free" | "Premium" | "Enterprise")}
                      className="text-xs bg-slate-50 border border-slate-100 rounded-lg p-1 text-slate-700 cursor-pointer"
                    >
                      <option>Free</option>
                      <option>Premium</option>
                      <option>Enterprise</option>
                    </select>
                  )
                },
                { key: "status", label: "Status", render: r => <Badge color={r.status === "Active" ? "green" : "red"}>{String(r.status)}</Badge> },
                {
                  key: "actions", label: "",
                  render: r => {
                    const isSelf = String(r.email) === "admin@fleetops.io"
                    return (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleToggleStatus(String(r.email))}
                          disabled={isSelf}
                          title={r.status === "Active" ? "Suspend Account" : "Activate Account"}
                          className={`p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 transition-all ${isSelf ? "opacity-20 cursor-not-allowed" : "hover:text-violet-600"}`}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onImpersonate(String(r.email))}
                          disabled={r.onboarded !== "Completed"}
                          title="Impersonate Dashboard"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-slate-50 transition-all disabled:opacity-30"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  }
                }
              ]}
              rows={userRows}
              searchable={["company", "email", "plan", "status"]}
            />
          </Card>
        )}

        {/* TAB 3: BILLING & TRANSACTIONS */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            {showPayForm && (
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">Log Billing Invoice Entry</h3>
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
                <div className="flex gap-2 mt-4">
                  <Btn onClick={handleCreatePayment}>Create Ledger Record</Btn>
                  <Btn variant="secondary" onClick={() => setShowPayForm(false)}>Cancel</Btn>
                </div>
              </Card>
            )}

            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">Billing History Ledger</h3>
              <Table
                columns={[
                  { key: "id", label: "Transaction ID" },
                  { key: "date", label: "Date" },
                  { key: "company", label: "Company" },
                  { key: "email", label: "Billing Email" },
                  { key: "amount", label: "Amount" },
                  { key: "plan", label: "Plan Tier" },
                  {
                    key: "status", label: "Invoice Status",
                    render: r => (
                      <select
                        value={String(r.status)}
                        onChange={e => handleUpdatePaymentStatus(String(r.id), e.target.value as "Paid" | "Pending" | "Refunded" | "Failed")}
                        className={`text-[10px] rounded-lg p-1 font-semibold ${
                          r.status === "Paid" ? "bg-green-50 text-green-700 border-green-100" :
                          r.status === "Pending" ? "bg-yellow-50 text-yellow-700 border-yellow-100" :
                          "bg-red-50 text-red-700 border-red-100"
                        }`}
                      >
                        <option>Paid</option>
                        <option>Pending</option>
                        <option>Refunded</option>
                        <option>Failed</option>
                      </select>
                    )
                  }
                ]}
                rows={paymentRows}
                searchable={["id", "company", "email", "plan"]}
              />
            </Card>
          </div>
        )}

        {/* TAB 4: SYSTEM ACTIVITY LOGS */}
        {activeTab === "logs" && (
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">System Activity logs</h3>
            <div className="bg-slate-900 rounded-2xl p-4 font-mono text-xs text-slate-300 space-y-2 max-h-[500px] overflow-y-auto border border-slate-850">
              <div className="text-[10px] text-slate-500 mb-3">// LIVE SYSTEM CONTAINER ACTIVITY LOGS</div>
              {logs.map((log) => {
                const badgeColor = {
                  success: "text-emerald-400 bg-emerald-950/40 border border-emerald-900/60",
                  warning: "text-amber-400 bg-amber-950/40 border border-amber-900/60",
                  danger: "text-rose-400 bg-rose-950/40 border border-rose-900/60",
                  info: "text-sky-400 bg-sky-950/40 border border-sky-900/60",
                }[log.level]
                return (
                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-center gap-2 border-b border-slate-800/40 pb-2">
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">{log.date}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap ${badgeColor}`}>
                      {log.level}
                    </span>
                    <span className="text-violet-400 font-semibold whitespace-nowrap">{log.email}</span>
                    <span className="text-slate-200">{log.action}</span>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* TAB 5: SUPPORT TICKETS */}
        {activeTab === "support" && (
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">Customer Support Ticket Manager</h3>
            <Table
              columns={[
                { key: "id", label: "Ticket ID" },
                { key: "date", label: "Received Date" },
                { key: "companyName", label: "Company" },
                { key: "email", label: "User Email" },
                { key: "subject", label: "Subject" },
                { key: "message", label: "Message Inquiry" },
                { key: "status", label: "Status", render: r => <Badge color={r.status === "Open" ? "orange" : "green"}>{String(r.status)}</Badge> },
                {
                  key: "actions", label: "",
                  render: r => {
                    const isOpen = r.status === "Open"
                    return (
                      <Btn
                        variant={isOpen ? "primary" : "secondary"}
                        size="sm"
                        disabled={!isOpen}
                        onClick={() => {
                          setActiveTicketId(String(r.id))
                          setReplyText("")
                        }}
                      >
                        {isOpen ? "Reply" : "Resolved"}
                      </Btn>
                    )
                  }
                }
              ]}
              rows={tickets as unknown as Record<string, unknown>[]}
            />

            {/* Support Ticket Response Dialog Modal overlay */}
            {activeTicketId && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                <Card className="p-6 max-w-md w-full space-y-4">
                  <h3 className="text-sm font-bold text-slate-800">Reply to ticket: {activeTicketId}</h3>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600">
                    <strong>Message:</strong> "{tickets.find(t => t.id === activeTicketId)?.message}"
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Your Response message</label>
                    <textarea
                      rows={4}
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Enter response details to dispatch..."
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/50"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Btn variant="secondary" onClick={() => setActiveTicketId(null)}>Cancel</Btn>
                    <Btn onClick={() => handleSolveTicket(activeTicketId)}>Dispatch Reply & Resolve</Btn>
                  </div>
                </Card>
              </div>
            )}
          </Card>
        )}

        {/* TAB 6: GLOBAL CONFIGURATIONS */}
        {activeTab === "config" && (
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">Global SaaS Pricing & Config Settings</h3>
            <div className="max-w-xl space-y-5">
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

              <div className="border-t border-slate-50 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">System Maintenance Mode</h4>
                    <p className="text-[10px] text-slate-400">Put the platform in read-only maintenance mode</p>
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

                <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Registrations Open</h4>
                    <p className="text-[10px] text-slate-400">Allow new companies to sign up for accounts</p>
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

              <Btn onClick={handleSaveConfig} className="w-full justify-center mt-6">
                Save System Configurations
              </Btn>
            </div>
          </Card>
        )}

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────────
