import { useState, useMemo, useEffect } from "react"
import {
  LayoutDashboard, Truck, Fuel, Wrench, Users, Receipt,
  Bell, MapPin, Settings, ChevronRight, ChevronDown, Menu, X,
  Plus, Search, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, Edit2, Trash2, ArrowUpRight, ArrowDownRight,
  DollarSign, Activity, Package, BarChart3, Zap, Navigation,
  Shield, Clock, LogOut, Lock, Mail, Building, Eye, RefreshCw,
  ChevronsUpDown,
} from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import { toast, Toaster } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

type Page =
  | "dashboard" | "orders" | "fuel" | "garage" | "payroll"
  | "settlement" | "financial" | "alerts" | "tracking"
  | "settings-drivers" | "settings-vehicles" | "settings-routes" | "settings-weekly"
  | "platform"

interface Driver { id: string; name: string; phone: string; license: string; status: "Active" | "Inactive" }
interface Vehicle { id: string; reg: string; name: string; type: string; status: "Active" | "Inactive" }
interface Route { id: string; name: string }
interface Order { id: string; date: string; driverId: string; vehicleId: string; routeId: string; status: "Assigned" | "Completed" }
interface FuelEntry { id: string; date: string; driverId: string; vehicleId: string; routeId: string; litres: number; miles: number; cost: number }
interface GarageEntry { id: string; date: string; vehicleId: string; driverId: string; issueType: string; cost: number }
interface PayrollEntry { id: string; week: string; date: string; driverId: string; salary: number; bonus: number; advance: number; totalPaid: number }
interface Settlement { id: string; date: string; vehicleId: string; driverId: string; routeId: string; amount: number }

interface AppConfig {
  weekStart: string
  fuelUnit: string
  currency: string
  fuelThreshold: string
  garageThreshold: string
  revenueTarget: string
}

interface UserAccount {
  email: string
  passwordVal: string
  companyName: string
  onboarded: boolean
  currency: string
  plan?: "Free" | "Premium" | "Enterprise"
  status?: "Active" | "Suspended"
  joinedDate?: string
}

interface PlatformPayment {
  id: string
  date: string
  companyName: string
  email: string
  amount: number
  plan: "Free" | "Premium" | "Enterprise"
  status: "Paid" | "Pending" | "Refunded" | "Failed"
}

interface PlatformActivityLog {
  id: string
  date: string
  email: string
  action: string
  level: "info" | "warning" | "danger" | "success"
}

interface PlatformTicket {
  id: string
  email: string
  companyName: string
  subject: string
  message: string
  status: "Open" | "Resolved"
  date: string
}

interface PlatformSettings {
  premiumPrice: number
  enterprisePrice: number
  maintenanceMode: boolean
  registrationOpen: boolean
}

// ─── Currency Helpers ────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = {
  "GBP (£)": "£",
  "EUR (€)": "€",
  "USD ($)": "$",
  "INR (₹)": "₹",
}

const TOOLTIP_STYLE = { borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }

function fmt(n: number, symbol = "£") {
  return symbol + n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function uid() { return Math.random().toString(36).slice(2, 9) }

// ─── Dynamic Seed Data relative to TODAY ─────────────────────────────────────

const TODAY = new Date().toISOString().split("T")[0]

function getRelativeDate(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() - offsetDays)
  return d.toISOString().split("T")[0]
}

const DRIVERS_SEED: Driver[] = [
  { id: "d1", name: "James Wilson", phone: "07700 900123", license: "WILSJ123456JW9AB", status: "Active" },
  { id: "d2", name: "Mohammed Ahmed", phone: "07700 900456", license: "AHMEDM234567MA8C", status: "Active" },
  { id: "d3", name: "Sarah Clarke", phone: "07700 900789", license: "CLARS123456SC7EF", status: "Active" },
  { id: "d4", name: "Kevin Patel", phone: "07700 900321", license: "PATEL345678KP2GH", status: "Inactive" },
]

const VEHICLES_SEED: Vehicle[] = [
  { id: "v1", reg: "MN21 XKT", name: "Ford Transit", type: "Van", status: "Active" },
  { id: "v2", reg: "LN70 RPJ", name: "Mercedes Sprinter", type: "Van", status: "Active" },
  { id: "v3", reg: "BD19 LKY", name: "Renault Master", type: "Van", status: "Active" },
  { id: "v4", reg: "YH68 TML", name: "Vauxhall Movano", type: "Van", status: "Inactive" },
]

const ROUTES_SEED: Route[] = [
  { id: "r1", name: "Manchester → Birmingham" },
  { id: "r2", name: "London → Leeds" },
  { id: "r3", name: "Liverpool → Glasgow" },
  { id: "r4", name: "Birmingham → Bristol" },
  { id: "r5", name: "Leeds → Newcastle" },
]

const ORDERS_SEED: Order[] = [
  { id: "o1", date: getRelativeDate(0), driverId: "d1", vehicleId: "v1", routeId: "r1", status: "Assigned" },
  { id: "o2", date: getRelativeDate(0), driverId: "d2", vehicleId: "v2", routeId: "r2", status: "Completed" },
  { id: "o3", date: getRelativeDate(1), driverId: "d3", vehicleId: "v3", routeId: "r3", status: "Assigned" },
  { id: "o4", date: getRelativeDate(2), driverId: "d1", vehicleId: "v1", routeId: "r4", status: "Completed" },
  { id: "o5", date: getRelativeDate(3), driverId: "d2", vehicleId: "v2", routeId: "r5", status: "Completed" },
]

const FUEL_SEED: FuelEntry[] = [
  { id: "f1", date: getRelativeDate(0), driverId: "d1", vehicleId: "v1", routeId: "r1", litres: 62, miles: 187, cost: 108.50 },
  { id: "f2", date: getRelativeDate(0), driverId: "d2", vehicleId: "v2", routeId: "r2", litres: 74, miles: 211, cost: 129.50 },
  { id: "f3", date: getRelativeDate(1), driverId: "d3", vehicleId: "v3", routeId: "r3", litres: 58, miles: 169, cost: 101.50 },
  { id: "f4", date: getRelativeDate(2), driverId: "d1", vehicleId: "v1", routeId: "r5", litres: 66, miles: 195, cost: 115.50 },
  { id: "f5", date: getRelativeDate(3), driverId: "d2", vehicleId: "v2", routeId: "r4", litres: 70, miles: 203, cost: 122.50 },
]

const GARAGE_SEED: GarageEntry[] = [
  { id: "g1", date: getRelativeDate(1), vehicleId: "v2", driverId: "d2", issueType: "Tyre", cost: 240 },
  { id: "g2", date: getRelativeDate(3), vehicleId: "v1", driverId: "d1", issueType: "Oil Change", cost: 85 },
  { id: "g3", date: getRelativeDate(4), vehicleId: "v3", driverId: "d3", issueType: "Service", cost: 320 },
  { id: "g4", date: getRelativeDate(12), vehicleId: "v2", driverId: "d2", issueType: "Brake", cost: 180 },
]

const PAYROLL_SEED: PayrollEntry[] = [
  { id: "p1", week: "W27 2025", date: getRelativeDate(2), driverId: "d1", salary: 650, bonus: 50, advance: 0, totalPaid: 700 },
  { id: "p2", week: "W27 2025", date: getRelativeDate(4), driverId: "d2", salary: 650, bonus: 75, advance: 100, totalPaid: 625 },
  { id: "p3", week: "W27 2025", date: getRelativeDate(6), driverId: "d3", salary: 600, bonus: 0, advance: 0, totalPaid: 600 },
]

const SETTLEMENTS_SEED: Settlement[] = [
  { id: "s1", date: getRelativeDate(0), vehicleId: "v1", driverId: "d1", routeId: "r1", amount: 3200 },
  { id: "s2", date: getRelativeDate(0), vehicleId: "v2", driverId: "d2", routeId: "r2", amount: 2950 },
  { id: "s3", date: getRelativeDate(1), vehicleId: "v3", driverId: "d3", routeId: "r3", amount: 2800 },
  { id: "s4", date: getRelativeDate(2), vehicleId: "v1", driverId: "d1", routeId: "r4", amount: 3100 },
]

const DEFAULT_PAYMENTS: PlatformPayment[] = [
  { id: "tx-901", date: getRelativeDate(2), companyName: "Alpha Logistics", email: "alpha@logistics.com", amount: 99, plan: "Premium", status: "Paid" },
  { id: "tx-902", date: getRelativeDate(5), companyName: "Speedy Delivery Co", email: "speedy@delivery.io", amount: 99, plan: "Premium", status: "Paid" },
  { id: "tx-903", date: getRelativeDate(10), companyName: "FleetOps Corporate", email: "admin@fleetops.io", amount: 499, plan: "Enterprise", status: "Paid" },
  { id: "tx-904", date: getRelativeDate(14), companyName: "Local Cabs & Transport", email: "local_cabs@transport.com", amount: 0, plan: "Free", status: "Pending" },
]

const DEFAULT_USERS: UserAccount[] = [
  { email: "admin@fleetops.io", passwordVal: "admin123", companyName: "FleetOps Corporate", onboarded: true, currency: "GBP (£)", plan: "Enterprise", status: "Active", joinedDate: getRelativeDate(30) },
  { email: "alpha@logistics.com", passwordVal: "alpha123", companyName: "Alpha Logistics", onboarded: true, currency: "USD ($)", plan: "Premium", status: "Active", joinedDate: getRelativeDate(15) },
  { email: "speedy@delivery.io", passwordVal: "speedy123", companyName: "Speedy Delivery Co", onboarded: true, currency: "EUR (€)", plan: "Premium", status: "Active", joinedDate: getRelativeDate(12) },
  { email: "local_cabs@transport.com", passwordVal: "local123", companyName: "Local Cabs & Transport", onboarded: true, currency: "GBP (£)", plan: "Free", status: "Suspended", joinedDate: getRelativeDate(25) },
  { email: "new_biz@startup.com", passwordVal: "new123", companyName: "New Biz Fleet", onboarded: false, currency: "USD ($)", plan: "Free", status: "Active", joinedDate: getRelativeDate(1) },
]

const DEFAULT_TICKETS: PlatformTicket[] = [
  { id: "tkt-101", email: "alpha@logistics.com", companyName: "Alpha Logistics", subject: "Route planner integration issue", message: "We are trying to connect the Manchester -> Birmingham route telemetry but GPS logs are failing. Can you assist?", status: "Open", date: getRelativeDate(1) },
  { id: "tkt-102", email: "speedy@delivery.io", companyName: "Speedy Delivery Co", subject: "Invoice mismatch", message: "Our last Premium billing statement recorded $99 but our invoice ledger displays £99. Standard currency is Euros.", status: "Resolved", date: getRelativeDate(4) },
  { id: "tkt-103", email: "local_cabs@transport.com", companyName: "Local Cabs & Transport", subject: "Suspension review request", message: "We settled our pending invoice via bank draft. Please restore our active account status.", status: "Open", date: getRelativeDate(2) },
]

const DEFAULT_LOGS: PlatformActivityLog[] = [
  { id: "log-1", date: getRelativeDate(15), email: "alpha@logistics.com", action: "Tenant registered & initiated free trial", level: "success" },
  { id: "log-2", date: getRelativeDate(15), email: "alpha@logistics.com", action: "Tenant completed onboarding wizard setup", level: "info" },
  { id: "log-3", date: getRelativeDate(14), email: "admin@fleetops.io", action: "Suspended local_cabs@transport.com for unpaid billing status", level: "warning" },
  { id: "log-4", date: getRelativeDate(10), email: "admin@fleetops.io", action: "Recorded payment of £499 for FleetOps Corporate invoice", level: "success" },
  { id: "log-5", date: getRelativeDate(5), email: "speedy@delivery.io", action: "Completed payment of €99 subscription plan fee", level: "success" },
  { id: "log-6", date: getRelativeDate(2), email: "alpha@logistics.com", action: "Upgraded subscription tier to Premium", level: "info" },
]

const DEFAULT_PLATFORM_CONFIG: PlatformSettings = {
  premiumPrice: 99,
  enterprisePrice: 499,
  maintenanceMode: false,
  registrationOpen: true,
}

// ─── Primitive UI Components ─────────────────────────────────────────────────

type BadgeColor = "green" | "yellow" | "orange" | "red" | "violet" | "blue" | "gray"

function Badge({ children, color }: { children: React.ReactNode; color: BadgeColor }) {
  const cls: Record<BadgeColor, string> = {
    green: "bg-green-50 text-green-700 ring-green-200",
    yellow: "bg-yellow-50 text-yellow-700 ring-yellow-200",
    orange: "bg-orange-50 text-orange-700 ring-orange-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    violet: "bg-violet-50 text-violet-700 ring-violet-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    gray: "bg-slate-100 text-slate-600 ring-slate-200",
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${cls[color]}`}>
      {children}
    </span>
  )
}

function Btn({
  children, onClick, variant = "primary", size = "md", className = "", type = "button", disabled = false,
}: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md"; className?: string; type?: "button" | "submit"; disabled?: boolean
}) {
  const v = {
    primary: "bg-violet-600 text-white hover:bg-violet-700 shadow-sm shadow-violet-200/80",
    secondary: "bg-white text-slate-700 hover:bg-slate-50 ring-1 ring-slate-200",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "bg-red-50 text-red-700 hover:bg-red-100 ring-1 ring-red-200",
  }[variant]
  const s = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-medium rounded-xl transition-all disabled:opacity-50 cursor-pointer ${v} ${s} ${className}`}>
      {children}
    </button>
  )
}

function FInput({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <input {...props}
        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/50 transition-all placeholder:text-slate-400" />
    </div>
  )
}

function FSelect({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <select {...props}
        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/50 transition-all text-slate-700 cursor-pointer">
        {children}
      </select>
    </div>
  )
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-[24px] border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.035)] ${className}`}>{children}</div>
}

// ─── Searchable Dropdown Component ───────────────────────────────────────────

interface SelectOption {
  value: string
  label: string
}

function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select option...",
}: {
  label: string
  value: string
  onChange: (val: string) => void
  options: SelectOption[]
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search) return options
    return options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
  }, [options, search])

  const selectedLabel = options.find(o => o.value === value)?.label ?? ""

  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest(`.select-container-${label.replace(/\s+/g, "")}`)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [isOpen, label])

  return (
    <div className={`flex flex-col gap-1 relative select-container-${label.replace(/\s+/g, "")}`}>
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/50 transition-all text-left text-slate-700 flex justify-between items-center cursor-pointer min-h-[38px]"
      >
        <span className={selectedLabel ? "text-slate-800" : "text-slate-400"}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>
      {isOpen && (
        <div className="absolute top-[100%] left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-2 space-y-1 max-h-60 overflow-y-auto">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400/50"
              autoFocus
            />
          </div>
          <div className="space-y-0.5">
            {filtered.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-2">No options found</div>
            ) : (
              filtered.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value)
                    setIsOpen(false)
                    setSearch("")
                  }}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-all ${
                    value === o.value
                      ? "bg-violet-50 text-violet-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPI({ label, value, icon: Icon, iconCls, trend }: {
  label: string; value: string; icon: React.ElementType; iconCls: string
  trend?: { val: string; up: boolean }
}) {
  return (
    <Card className="p-5 hover:-translate-y-1 hover:border-violet-100 hover:shadow-[0_12px_40px_rgba(124,58,237,0.04)] transition-all duration-300">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900 tracking-tight leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</p>
          {trend && (
            <p className={`text-xs mt-1.5 flex items-center gap-0.5 ${trend.up ? "text-emerald-600" : "text-red-500"}`}>
              {trend.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trend.val}
            </p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:scale-105 ${iconCls} ring-4 ring-offset-0 ring-opacity-20`}>
          <Icon className="w-5.5 h-5.5" />
        </div>
      </div>
    </Card>
  )
}

// ─── Data Table ───────────────────────────────────────────────────────────────

function Table({
  columns, rows, searchable,
}: {
  columns: { key: string; label: string; render?: (r: Record<string, unknown>) => React.ReactNode }[]
  rows: Record<string, unknown>[]
  searchable?: string[]
}) {
  const [q, setQ] = useState("")
  const [pg, setPg] = useState(1)
  const PER = 8

  const filtered = useMemo(() => {
    if (!q || !searchable) return rows
    const lq = q.toLowerCase()
    return rows.filter(r => searchable.some(k => String(r[k] ?? "").toLowerCase().includes(lq)))
  }, [rows, q, searchable])

  const pages = Math.max(1, Math.ceil(filtered.length / PER))
  const slice = filtered.slice((pg - 1) * PER, pg * PER)

  return (
    <div>
      {searchable && (
        <div className="relative mb-4 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={q} onChange={e => { setQ(e.target.value); setPg(1) }} placeholder="Search…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/50" />
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80">
            <tr>
              {columns.map(c => (
                <th key={c.key} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 bg-white">
            {slice.length === 0
              ? <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-slate-400">No records found</td></tr>
              : slice.map((r, i) => (
                <tr key={i} className="hover:bg-violet-50/20 transition-colors">
                  {columns.map(c => (
                    <td key={c.key} className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {c.render ? c.render(r) : String(r[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-slate-500">{filtered.length} records · Page {pg}/{pages}</p>
          <div className="flex gap-1">
            <button onClick={() => setPg(p => Math.max(1, p - 1))} disabled={pg === 1}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-all">← Prev</button>
            <button onClick={() => setPg(p => Math.min(pages, p + 1))} disabled={pg === pages}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-all">Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: Package },
  { id: "fuel", label: "Fuel", icon: Fuel },
  { id: "garage", label: "Garage", icon: Wrench },
  { id: "payroll", label: "Driver Payroll", icon: Users },
  { id: "settlement", label: "DPD Settlement", icon: Receipt },
  { id: "financial", label: "Financial Summary", icon: BarChart3 },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "tracking", label: "Tracking", icon: MapPin },
  {
    id: "settings", label: "Settings", icon: Settings,
    children: [
      { id: "settings-drivers", label: "Drivers" },
      { id: "settings-vehicles", label: "Vehicles" },
      { id: "settings-routes", label: "Routes" },
      { id: "settings-weekly", label: "Weekly Settings" },
    ],
  },
] as const

function Sidebar({ page, setPage, open, setOpen, companyName, userEmail, onLogout, isAdmin, isImpersonating, onExitImpersonate }: {
  page: Page; setPage: (p: Page) => void; open: boolean; setOpen: (v: boolean) => void;
  companyName: string; userEmail: string; onLogout: () => void; isAdmin: boolean; isImpersonating: boolean; onExitImpersonate: () => void
}) {
  const [settX, setSettX] = useState(page.startsWith("settings"))
  const [profileOpen, setProfileOpen] = useState(false)

  const isActive = (id: string) => page === id || (id === "settings" && page.startsWith("settings"))

  // Hierarchical categories for standard SaaS navigation layout
  const SECTIONS = [
    {
      title: "Workspace",
      items: ["dashboard", "orders", "tracking"]
    },
    {
      title: "Fleet Operations",
      items: ["fuel", "garage"]
    },
    {
      title: "Finance & Ledger",
      items: ["payroll", "settlement", "financial"]
    },
    {
      title: "Administration",
      items: ["alerts", "settings"]
    }
  ] as const

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/25 z-20 lg:hidden backdrop-blur-xs" onClick={() => setOpen(false)} />}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-60
        flex flex-col bg-black border-r border-neutral-900
        h-full overflow-hidden
        transition-transform duration-300 lg:translate-x-0
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Advanced Organization / Tenant Switcher */}
        <div className="flex items-center justify-between px-3 py-4 border-b border-neutral-900">
          <div className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-neutral-900 cursor-pointer transition-all border border-neutral-850 flex-1 mr-1 select-none">
            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
              <Truck className="w-4 h-4 text-black" />
            </div>
            <div className="flex-1 min-w-0 leading-none">
              <p className="font-bold text-[13px] text-white tracking-tight truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {companyName || "FleetOps Workspace"}
              </p>
              <p className="text-[9px] text-neutral-500 font-semibold uppercase mt-0.5 tracking-wider">Free Account</p>
            </div>
            <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-neutral-900 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Search Shortcut bar */}
        <div className="px-3 pt-3">
          <div className="flex items-center justify-between px-3 py-2 bg-neutral-900/60 rounded-xl border border-neutral-850 hover:border-neutral-800 transition-all cursor-pointer select-none">
            <div className="flex items-center gap-2 text-neutral-400">
              <Search className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">Search options...</span>
            </div>
            <span className="text-[9px] px-1 py-0.5 rounded bg-neutral-800 text-neutral-400 font-bold border border-neutral-750">⌘K</span>
          </div>
        </div>

        {/* Categorized Navigation Container */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {/* Platform Console ONLY for Super Admin */}
          {isAdmin && !isImpersonating && (
            <button
              onClick={() => { setPage("platform"); setOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 mb-2 rounded-xl text-xs font-semibold transition-all border ${
                page === "platform"
                  ? "bg-white text-black border-white shadow-[0_4px_12px_rgba(255,255,255,0.15)]"
                  : "bg-neutral-900 text-neutral-300 border-neutral-850 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <Shield className="w-4 h-4 flex-shrink-0" />
              <span>Platform Console</span>
            </button>
          )}

          {isImpersonating && (
            <button
              onClick={onExitImpersonate}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 mb-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition-all animate-pulse"
            >
              <Eye className="w-3.5 h-3.5" />
              Exit Impersonation
            </button>
          )}

          {(!isAdmin || isImpersonating) && SECTIONS.map(sec => {
            const secItems = NAV.filter(item => sec.items.includes(item.id))
            return (
              <div key={sec.title} className="space-y-1">
                <p className="px-3 text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 select-none">{sec.title}</p>
                {secItems.map(item => {
                  const active = isActive(item.id)
                  if ("children" in item) {
                    return (
                      <div key={item.id} className="space-y-0.5">
                        <button onClick={() => setSettX(s => !s)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            active ? "bg-neutral-900 text-white" : "text-neutral-400 hover:bg-neutral-900/40 hover:text-white"
                          }`}
                        >
                          <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="flex-1 text-left">{item.label}</span>
                          {settX ? <ChevronDown className="w-3 h-3 text-neutral-500" /> : <ChevronRight className="w-3 h-3 text-neutral-500" />}
                        </button>
                        {settX && (
                          <div className="ml-4 pl-3.5 mt-0.5 space-y-0.5 border-l border-neutral-850">
                            {item.children.map(child => {
                              const childActive = page === child.id
                              return (
                                <button key={child.id} onClick={() => { setPage(child.id as Page); setOpen(false) }}
                                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                                    childActive ? "text-white font-bold bg-neutral-800" : "text-neutral-400 hover:text-white hover:bg-neutral-900/30"
                                  }`}
                                >
                                  {child.label}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  }
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setPage(item.id as Page); setOpen(false) }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
                        active
                          ? "bg-neutral-900 text-white"
                          : "text-neutral-400 hover:bg-neutral-900/40 hover:text-white"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-white rounded-r-md" />
                      )}
                      <item.icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? "text-white" : "text-neutral-400"}`} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.id === "tracking" && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-900 text-emerald-400 font-bold border border-neutral-800">Sim</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* User Account / Profile block */}
        <div className="p-2.5 border-t border-neutral-900 relative">
          {profileOpen && (
            <div className="absolute bottom-full left-2.5 right-2.5 mb-2 bg-black border border-neutral-900 rounded-xl shadow-2xl p-2.5 z-50 space-y-2">
              <div className="text-[11px] text-slate-500 truncate px-2 leading-tight">Logged in as:<br /><span className="font-semibold text-slate-300">{userEmail}</span></div>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-red-400 hover:bg-red-950/20 rounded-lg transition-all font-semibold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
          <div
            onClick={() => setProfileOpen(!profileOpen)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-900 cursor-pointer transition-all border border-transparent ${profileOpen ? "bg-neutral-900 border-neutral-800" : ""}`}
          >
            <div className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white text-xs font-bold">
              {companyName ? companyName.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 leading-tight truncate">{companyName || "Administrator"}</p>
              <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </div>
        </div>
      </aside>
    </>
  )
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────

function TopBarComponent({ title, subtitle, actions, onMenu, user, onLogout }: {
  title: string; subtitle?: string; actions?: React.ReactNode; onMenu?: () => void; user?: UserAccount | null; onLogout?: () => void
}) {
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/95 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {onMenu && (
          <button onClick={onMenu} className="lg:hidden text-slate-500 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-all cursor-pointer">
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {actions && <div className="flex items-center gap-2">{actions}</div>}
        {user && (
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 border border-violet-200/50 flex items-center justify-center text-xs font-bold">
                {user.companyName ? user.companyName.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="hidden sm:block text-left leading-none">
                <p className="text-xs font-semibold text-slate-800">{user.companyName || "Admin"}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{user.email}</p>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50">
                <div className="text-[10px] text-slate-400 px-2 py-1 leading-tight">Logged in as:<br /><span className="font-semibold text-slate-700">{user.email}</span></div>
                <hr className="my-1.5 border-slate-100" />
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-all font-semibold cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Login & Signup Page ──────────────────────────────────────────────────────

function AuthPage({ onLoginSuccess }: { onLoginSuccess: (user: UserAccount) => void }) {
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

function OnboardingPage({
  currentUser, onOnboardingComplete,
}: {
  currentUser: UserAccount
  onOnboardingComplete: (companyName: string, currency: string, initialAssets: { driver: Driver; vehicle: Vehicle }) => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [companyName, setCompanyName] = useState(currentUser.companyName || "")
  const [currency, setCurrency] = useState("GBP (£)")
  const [weekStart, setWeekStart] = useState("Monday")

  // Initial fleet assets setup
  const [driverName, setDriverName] = useState("")
  const [driverPhone, setDriverPhone] = useState("")
  const [driverLicense, setDriverLicense] = useState("")

  const [vehicleReg, setVehicleReg] = useState("")
  const [vehicleName, setVehicleName] = useState("")
  const [vehicleType, setVehicleType] = useState("Van")

  const handleNext = () => {
    if (!companyName) { toast.error("Please specify your company name"); return }
    setStep(2)
  }

  const handleComplete = () => {
    if (!driverName || !driverLicense || !vehicleReg || !vehicleName) {
      toast.error("Please complete your driver and vehicle setup to start your fleet")
      return
    }

    const driverObj: Driver = {
      id: uid(),
      name: driverName,
      phone: driverPhone,
      license: driverLicense.toUpperCase(),
      status: "Active",
    }

    const vehicleObj: Vehicle = {
      id: uid(),
      reg: vehicleReg.toUpperCase(),
      name: vehicleName,
      type: vehicleType,
      status: "Active",
    }

    onOnboardingComplete(companyName, currency, { driver: driverObj, vehicle: vehicleObj })
    toast.success("Command center initialized successfully!")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Background circles */}
      <div className="absolute w-[500px] h-[500px] bg-violet-400/5 rounded-full blur-3xl -top-20 -left-20"></div>

      <div className="w-full max-w-[500px] bg-white border border-slate-100 rounded-3xl shadow-xl p-8 z-10 space-y-6">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600 mb-1">
            <Zap className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Welcome to FleetOps!
          </h2>
          <p className="text-xs text-slate-400">Let's configure your isolated fleet database workspace</p>
        </div>

        {/* Stepper indicator */}
        <div className="flex items-center gap-2">
          <div className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? "bg-violet-600" : "bg-slate-100"}`}></div>
          <div className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? "bg-violet-600" : "bg-slate-100"}`}></div>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">Step 1: Organization Preferences</h3>
            <FInput
              label="Company Name"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="e.g. Alpha Freight Ltd"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FSelect label="Default Currency" value={currency} onChange={e => setCurrency(e.target.value)}>
                <option>GBP (£)</option>
                <option>EUR (€)</option>
                <option>USD ($)</option>
                <option>INR (₹)</option>
              </FSelect>
              <FSelect label="Payroll Starting Day" value={weekStart} onChange={e => setWeekStart(e.target.value)}>
                <option>Monday</option>
                <option>Sunday</option>
              </FSelect>
            </div>
            <button
              onClick={handleNext}
              className="w-full py-3 mt-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-violet-100 cursor-pointer"
            >
              Continue to Fleet Setup
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">Step 2: Add First Vehicle & Driver</h3>

            <div className="space-y-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Driver Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FInput label="Driver Name" value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="James Wilson" />
                <FInput label="Driver License" value={driverLicense} onChange={e => setDriverLicense(e.target.value)} placeholder="WILSJ123456" />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vehicle Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <FInput label="Reg Plate" value={vehicleReg} onChange={e => setVehicleReg(e.target.value.toUpperCase())} placeholder="MN21 XKT" />
                </div>
                <div className="sm:col-span-2">
                  <FInput label="Vehicle Model Name" value={vehicleName} onChange={e => setVehicleName(e.target.value)} placeholder="Ford Transit" />
                </div>
              </div>
              <FSelect label="Vehicle Type" value={vehicleType} onChange={e => setVehicleType(e.target.value)}>
                <option>Van</option>
                <option>Lorry</option>
                <option>Car</option>
              </FSelect>
            </div>

            <div className="flex gap-3 mt-6">
              <Btn variant="secondary" onClick={() => setStep(1)} className="flex-1 justify-center py-3">Back</Btn>
              <button
                onClick={handleComplete}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-violet-100 cursor-pointer"
              >
                Complete Setup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

function DashboardPage({
  drivers, vehicles, routes, orders, fuel, garage, payroll, settlements, setPage, onMenu, currencySymbol,
}: {
  drivers: Driver[]; vehicles: Vehicle[]; routes: Route[]
  orders: Order[]; fuel: FuelEntry[]; garage: GarageEntry[]
  payroll: PayrollEntry[]; settlements: Settlement[]
  setPage: (p: Page) => void; onMenu: () => void; currencySymbol: string
}) {
  const [timeScope, setTimeScope] = useState<"today" | "week" | "all">("today")

  const isWithinScope = (dateStr: string) => {
    if (timeScope === "today") return dateStr === TODAY
    if (timeScope === "week") {
      const entryDate = new Date(dateStr)
      const diffTime = new Date().getTime() - entryDate.getTime()
      const diffDays = diffTime / (1000 * 60 * 60 * 24)
      return diffDays >= 0 && diffDays <= 7
    }
    return true
  }

  const filteredOrders = useMemo(() => orders.filter(o => isWithinScope(o.date)), [orders, timeScope])
  const filteredRevenue = useMemo(() => settlements.filter(s => isWithinScope(s.date)).reduce((a, s) => a + s.amount, 0), [settlements, timeScope])
  const filteredFuel = useMemo(() => fuel.filter(f => isWithinScope(f.date)).reduce((a, f) => a + f.cost, 0), [fuel, timeScope])
  const filteredGarage = useMemo(() => garage.filter(g => isWithinScope(g.date)).reduce((a, g) => a + g.cost, 0), [garage, timeScope])
  const filteredPayroll = useMemo(() => payroll.filter(p => isWithinScope(p.date)).reduce((a, p) => a + p.totalPaid, 0), [payroll, timeScope])
  const filteredExpenses = filteredFuel + filteredGarage + filteredPayroll
  const netProfit = filteredRevenue - filteredExpenses
  const activeVehicles = vehicles.filter(v => v.status === "Active").length
  const activeDrivers = drivers.filter(d => d.status === "Active").length

  const kpis = [
    { label: `${timeScope === "today" ? "Today's" : timeScope === "week" ? "Weekly" : "Total"} Orders`, value: String(filteredOrders.length), icon: Package, iconCls: "bg-blue-50 text-blue-600" },
    { label: `${timeScope === "today" ? "Today's" : timeScope === "week" ? "Weekly" : "Total"} Revenue`, value: fmt(filteredRevenue, currencySymbol), icon: TrendingUp, iconCls: "bg-emerald-50 text-emerald-600" },
    { label: "Fuel Expenses", value: fmt(filteredFuel, currencySymbol), icon: Fuel, iconCls: "bg-yellow-50 text-yellow-600" },
    { label: "Garage Expenses", value: fmt(filteredGarage, currencySymbol), icon: Wrench, iconCls: "bg-orange-50 text-orange-600" },
    { label: "Driver Payroll", value: fmt(filteredPayroll, currencySymbol), icon: Users, iconCls: "bg-violet-50 text-violet-600" },
    { label: "Total Expenses", value: fmt(filteredExpenses, currencySymbol), icon: DollarSign, iconCls: "bg-red-50 text-red-600" },
    { label: "Net Profit", value: fmt(netProfit, currencySymbol), icon: BarChart3, iconCls: netProfit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600" },
    { label: "Active Vehicles", value: String(activeVehicles), icon: Truck, iconCls: "bg-slate-100 text-slate-600" },
    { label: "Active Drivers", value: String(activeDrivers), icon: Users, iconCls: "bg-violet-50 text-violet-600" },
  ]

  const dynamicWeeklyChart = useMemo(() => {
    const chartData = []
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    for (let i = 6; i >= 0; i--) {
      const dateStr = getRelativeDate(i)
      const dateObj = new Date(dateStr)
      const dayName = days[dateObj.getDay()]

      const rev = settlements.filter(s => s.date === dateStr).reduce((a, s) => a + s.amount, 0)
      const fuelExp = fuel.filter(f => f.date === dateStr).reduce((a, f) => a + f.cost, 0)
      const garageExp = garage.filter(g => g.date === dateStr).reduce((a, g) => a + g.cost, 0)
      const payrollExp = payroll.filter(p => p.date === dateStr).reduce((a, p) => a + p.totalPaid, 0)
      const exp = fuelExp + garageExp + payrollExp

      chartData.push({
        day: dayName,
        revenue: rev,
        expenses: exp,
        profit: rev - exp,
      })
    }
    return chartData
  }, [settlements, fuel, garage, payroll])

  const recentRows = orders.slice(0, 5).map(o => ({
    date: o.date,
    driver: drivers.find(d => d.id === o.driverId)?.name ?? "—",
    vehicle: vehicles.find(v => v.id === o.vehicleId)?.reg ?? "—",
    route: routes.find(r => r.id === o.routeId)?.name ?? "—",
    status: o.status,
  })) as Record<string, unknown>[]

  return (
    <div className="flex-1 overflow-y-auto">
      <TopBarComponent
        title="Dashboard"
        subtitle="Operational and financial health snapshot"
        onMenu={onMenu}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Period:</span>
            <select
              value={timeScope}
              onChange={e => setTimeScope(e.target.value as "today" | "week" | "all")}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-violet-400"
            >
              <option value="today">Today Only</option>
              <option value="week">Last 7 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {kpis.map((k, i) => <KPI key={i} label={k.label} value={k.value} icon={k.icon} iconCls={k.iconCls} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Weekly Revenue vs Expenses</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dynamicWeeklyChart} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${currencySymbol}${v}`} />
                <Tooltip formatter={(v: number) => fmt(v, currencySymbol)} contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#7c3aed" strokeWidth={2} fill="url(#gRev)" />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f97316" strokeWidth={2} fill="url(#gExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Net Profit Trend (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dynamicWeeklyChart} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${currencySymbol}${v}`} />
                <Tooltip formatter={(v: number) => fmt(v, currencySymbol)} contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" strokeWidth={2.5} fill="url(#gProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "New Order", icon: Package, page: "orders" as Page, cls: "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100" },
              { label: "Add Fuel Entry", icon: Fuel, page: "fuel" as Page, cls: "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-100" },
              { label: "Add Garage Expense", icon: Wrench, page: "garage" as Page, cls: "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-100" },
              { label: "Add DPD Settlement", icon: Receipt, page: "settlement" as Page, cls: "bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-100" },
            ].map(a => (
              <button key={a.label} onClick={() => setPage(a.page)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all text-sm font-medium cursor-pointer ${a.cls}`}>
                <a.icon className="w-5 h-5" />
                {a.label}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Recent Orders</h3>
            <button onClick={() => setPage("orders")} className="text-xs text-violet-600 hover:text-violet-700 font-medium transition-colors">
              View all →
            </button>
          </div>
          <Table
            columns={[
              { key: "date", label: "Date" },
              { key: "driver", label: "Driver" },
              { key: "vehicle", label: "Vehicle" },
              { key: "route", label: "Route" },
              {
                key: "status", label: "Status",
                render: r => <Badge color={r.status === "Completed" ? "green" : "blue"}>{String(r.status)}</Badge>,
              },
            ]}
            rows={recentRows}
          />
        </Card>
      </div>
    </div>
  )
}

// ─── Orders Page ─────────────────────────────────────────────────────────────

function OrdersPage({ drivers, vehicles, routes, orders, setOrders, onMenu }: {
  drivers: Driver[]; vehicles: Vehicle[]; routes: Route[]
  orders: Order[]; setOrders: React.Dispatch<React.SetStateAction<Order[]>>; onMenu: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ date: TODAY, driverId: "", vehicleId: "", routeId: "" })

  const save = () => {
    if (!form.driverId || !form.vehicleId || !form.routeId) { toast.error("Please fill all fields"); return }

    if (editingId) {
      setOrders(prev => prev.map(o => o.id === editingId ? { ...o, ...form } : o))
      toast.success("Order updated successfully")
    } else {
      setOrders(prev => [{ ...form, id: uid(), status: "Assigned" as const }, ...prev])
      toast.success("Order created successfully")
    }

    setForm({ date: TODAY, driverId: "", vehicleId: "", routeId: "" })
    setEditingId(null)
    setShowForm(false)
  }

  const edit = (o: Order) => {
    setForm({ date: o.date, driverId: o.driverId, vehicleId: o.vehicleId, routeId: o.routeId })
    setEditingId(o.id)
    setShowForm(true)
  }

  const toggleStatus = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id
      ? { ...o, status: o.status === "Assigned" ? "Completed" : "Assigned" }
      : o))
    toast.success("Status updated")
  }

  const del = (id: string) => { setOrders(prev => prev.filter(o => o.id !== id)); toast.success("Order deleted") }

  const driverOptions = useMemo(() => drivers.filter(d => d.status === "Active").map(d => ({ value: d.id, label: d.name })), [drivers])
  const vehicleOptions = useMemo(() => vehicles.filter(v => v.status === "Active").map(v => ({ value: v.id, label: `${v.reg} – ${v.name}` })), [vehicles])
  const routeOptions = useMemo(() => routes.map(r => ({ value: r.id, label: r.name })), [routes])

  const rows = orders.map(o => ({
    id: o.id,
    date: o.date,
    driver: drivers.find(d => d.id === o.driverId)?.name ?? "—",
    vehicle: vehicles.find(v => v.id === o.vehicleId)?.reg ?? "—",
    route: routes.find(r => r.id === o.routeId)?.name ?? "—",
    status: o.status,
  })) as Record<string, unknown>[]

  return (
    <div className="flex-1 overflow-y-auto">
      <TopBarComponent title="Orders" subtitle="Assign daily work to drivers" onMenu={onMenu}
        actions={<Btn onClick={() => { setEditingId(null); setForm({ date: TODAY, driverId: "", vehicleId: "", routeId: "" }); setShowForm(s => !s) }}><Plus className="w-4 h-4" /> New Order</Btn>} />
      <div className="p-6 space-y-5">
        {showForm && (
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">{editingId ? "Edit Order" : "Create Order"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <FInput label="Order Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />

              <SearchableSelect label="Driver" value={form.driverId} onChange={val => setForm(f => ({ ...f, driverId: val }))} options={driverOptions} />
              <SearchableSelect label="Vehicle" value={form.vehicleId} onChange={val => setForm(f => ({ ...f, vehicleId: val }))} options={vehicleOptions} />
              <SearchableSelect label="Route" value={form.routeId} onChange={val => setForm(f => ({ ...f, routeId: val }))} options={routeOptions} />
            </div>
            <div className="flex gap-2 mt-4">
              <Btn onClick={save}>{editingId ? "Save Changes" : "Create Order"}</Btn>
              <Btn variant="secondary" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</Btn>
            </div>
          </Card>
        )}
        <Card className="p-5">
          <Table
            columns={[
              { key: "date", label: "Date" },
              { key: "driver", label: "Driver" },
              { key: "vehicle", label: "Vehicle" },
              { key: "route", label: "Route" },
              { key: "status", label: "Status", render: r => <Badge color={r.status === "Completed" ? "green" : "blue"}>{String(r.status)}</Badge> },
              {
                key: "actions", label: "",
                render: r => (
                  <div className="flex gap-1">
                    <button onClick={() => toggleStatus(String(r.id))} title="Toggle status"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => edit(orders.find(o => o.id === r.id)!)} title="Edit"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => del(String(r.id))} title="Delete"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            rows={rows}
            searchable={["driver", "vehicle", "route", "status"]}
          />
        </Card>
      </div>
    </div>
  )
}

// ─── Fuel Page ───────────────────────────────────────────────────────────────

function FuelPage({ drivers, vehicles, routes, fuel, setFuel, onMenu, currencySymbol }: {
  drivers: Driver[]; vehicles: Vehicle[]; routes: Route[]
  fuel: FuelEntry[]; setFuel: React.Dispatch<React.SetStateAction<FuelEntry[]>>; onMenu: () => void; currencySymbol: string
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ date: TODAY, driverId: "", vehicleId: "", routeId: "", litres: "", miles: "", cost: "" })

  const save = () => {
    if (!form.driverId || !form.vehicleId || !form.litres || !form.cost) { toast.error("Please fill required fields"); return }
    if (+form.litres <= 0 || +form.cost <= 0 || (form.miles !== "" && +form.miles < 0)) {
      toast.error("Please enter positive values for litres, cost, and miles")
      return
    }

    const payload = {
      date: form.date,
      driverId: form.driverId,
      vehicleId: form.vehicleId,
      routeId: form.routeId,
      litres: +form.litres,
      miles: +form.miles || 0,
      cost: +form.cost,
    }

    if (editingId) {
      setFuel(prev => prev.map(f => f.id === editingId ? { ...f, ...payload } : f))
      toast.success("Fuel entry updated")
    } else {
      setFuel(prev => [{ ...payload, id: uid() }, ...prev])
      toast.success("Fuel entry saved")
    }

    setForm({ date: TODAY, driverId: "", vehicleId: "", routeId: "", litres: "", miles: "", cost: "" })
    setEditingId(null)
    setShowForm(false)
  }

  const edit = (f: FuelEntry) => {
    setForm({
      date: f.date,
      driverId: f.driverId,
      vehicleId: f.vehicleId,
      routeId: f.routeId,
      litres: String(f.litres),
      miles: String(f.miles),
      cost: String(f.cost),
    })
    setEditingId(f.id)
    setShowForm(true)
  }

  const del = (id: string) => {
    setFuel(prev => prev.filter(f => f.id !== id))
    toast.success("Fuel entry deleted")
  }

  const totalCost = fuel.reduce((a, f) => a + f.cost, 0)
  const totalLitres = fuel.reduce((a, f) => a + f.litres, 0)
  const totalMiles = fuel.reduce((a, f) => a + f.miles, 0)
  const avgMpg = totalLitres > 0 ? (totalMiles / totalLitres * 4.546).toFixed(1) : "—"

  const driverOptions = useMemo(() => drivers.filter(d => d.status === "Active").map(d => ({ value: d.id, label: d.name })), [drivers])
  const vehicleOptions = useMemo(() => vehicles.filter(v => v.status === "Active").map(v => ({ value: v.id, label: v.reg })), [vehicles])
  const routeOptions = useMemo(() => routes.map(r => ({ value: r.id, label: r.name })), [routes])

  const rows = fuel.map(f => ({
    id: f.id,
    date: f.date,
    driver: drivers.find(d => d.id === f.driverId)?.name ?? "—",
    vehicle: vehicles.find(v => v.id === f.vehicleId)?.reg ?? "—",
    route: routes.find(r => r.id === f.routeId)?.name ?? "—",
    litres: f.litres + " L",
    miles: f.miles + " mi",
    cost: fmt(f.cost, currencySymbol),
  })) as Record<string, unknown>[]

  return (
    <div className="flex-1 overflow-y-auto">
      <TopBarComponent title="Fuel Management" subtitle="Track every refill" onMenu={onMenu}
        actions={<Btn onClick={() => { setEditingId(null); setForm({ date: TODAY, driverId: "", vehicleId: "", routeId: "", litres: "", miles: "", cost: "" }); setShowForm(s => !s) }}><Plus className="w-4 h-4" /> Add Fuel Entry</Btn>} />
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KPI label="Total Fuel Cost" value={fmt(totalCost, currencySymbol)} icon={DollarSign} iconCls="bg-yellow-50 text-yellow-600" />
          <KPI label="Total Litres" value={totalLitres + " L"} icon={Fuel} iconCls="bg-blue-50 text-blue-600" />
          <KPI label="Total Miles" value={totalMiles.toLocaleString()} icon={Activity} iconCls="bg-violet-50 text-violet-600" />
          <KPI label="Avg MPG" value={String(avgMpg)} icon={Zap} iconCls="bg-emerald-50 text-emerald-600" />
        </div>
        {showForm && (
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">{editingId ? "Edit Fuel Entry" : "Add Fuel Entry"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <FInput label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              <SearchableSelect label="Driver" value={form.driverId} onChange={val => setForm(f => ({ ...f, driverId: val }))} options={driverOptions} />
              <SearchableSelect label="Vehicle" value={form.vehicleId} onChange={val => setForm(f => ({ ...f, vehicleId: val }))} options={vehicleOptions} />
              <SearchableSelect label="Route" value={form.routeId} onChange={val => setForm(f => ({ ...f, routeId: val }))} options={routeOptions} />
              <FInput label="Fuel Used (Litres)" type="number" placeholder="0" value={form.litres} onChange={e => setForm(f => ({ ...f, litres: e.target.value }))} />
              <FInput label="Miles Travelled" type="number" placeholder="0" value={form.miles} onChange={e => setForm(f => ({ ...f, miles: e.target.value }))} />
              <FInput label="Fuel Cost" type="number" step="0.01" placeholder="0.00" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
            </div>
            <div className="flex gap-2 mt-4">
              <Btn onClick={save}>{editingId ? "Save Changes" : "Save Fuel Entry"}</Btn>
              <Btn variant="secondary" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</Btn>
            </div>
          </Card>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="p-5 lg:col-span-2">
            <Table
              columns={[
                { key: "date", label: "Date" },
                { key: "driver", label: "Driver" },
                { key: "vehicle", label: "Vehicle" },
                { key: "route", label: "Route" },
                { key: "litres", label: "Fuel Used" },
                { key: "miles", label: "Miles" },
                { key: "cost", label: "Cost" },
                {
                  key: "actions", label: "",
                  render: r => (
                    <div className="flex gap-1">
                      <button onClick={() => edit(fuel.find(f => f.id === r.id)!)} title="Edit"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => del(String(r.id))} title="Delete"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ),
                },
              ]}
              rows={rows}
              searchable={["driver", "vehicle", "route"]}
            />
          </Card>
          <div className="space-y-5">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Fuel Cost per Vehicle</h3>
              <div className="space-y-2">
                {vehicles.map(v => {
                  const entries = fuel.filter(f => f.vehicleId === v.id)
                  const totalVehicleCost = entries.reduce((sum, r) => sum + r.cost, 0)
                  const totalVehicleLitres = entries.reduce((sum, r) => sum + r.litres, 0)
                  if (entries.length === 0) return null
                  return (
                    <div key={v.id} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-50 last:border-0">
                      <div>
                        <span className="font-semibold text-slate-700">{v.reg}</span>
                        <span className="text-slate-400 ml-1">({v.name})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 mr-2">{totalVehicleLitres} L</span>
                        <span className="font-semibold text-violet-600">{fmt(totalVehicleCost, currencySymbol)}</span>
                      </div>
                    </div>
                  )
                })}
                {fuel.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No entries recorded</p>}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Garage Page ─────────────────────────────────────────────────────────────

function GaragePage({ drivers, vehicles, garage, setGarage, onMenu, currencySymbol }: {
  drivers: Driver[]; vehicles: Vehicle[]
  garage: GarageEntry[]; setGarage: React.Dispatch<React.SetStateAction<GarageEntry[]>>; onMenu: () => void; currencySymbol: string
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ date: TODAY, vehicleId: "", driverId: "", issueType: "Service", cost: "" })

  const save = () => {
    if (!form.vehicleId || !form.cost) { toast.error("Please fill required fields"); return }
    if (+form.cost <= 0) { toast.error("Please enter a positive garage cost"); return }

    const payload = {
      date: form.date,
      vehicleId: form.vehicleId,
      driverId: form.driverId,
      issueType: form.issueType,
      cost: +form.cost,
    }

    if (editingId) {
      setGarage(prev => prev.map(g => g.id === editingId ? { ...g, ...payload } : g))
      toast.success("Garage entry updated")
    } else {
      setGarage(prev => [{ ...payload, id: uid() }, ...prev])
      toast.success("Garage entry saved")
    }

    setForm({ date: TODAY, vehicleId: "", driverId: "", issueType: "Service", cost: "" })
    setEditingId(null)
    setShowForm(false)
  }

  const edit = (g: GarageEntry) => {
    setForm({
      date: g.date,
      vehicleId: g.vehicleId,
      driverId: g.driverId,
      issueType: g.issueType,
      cost: String(g.cost),
    })
    setEditingId(g.id)
    setShowForm(true)
  }

  const del = (id: string) => {
    setGarage(prev => prev.filter(g => g.id !== id))
    toast.success("Garage entry deleted")
  }

  const totalCost = garage.reduce((a, g) => a + g.cost, 0)
  const repairsPerVehicle = vehicles.map(v => ({
    name: v.reg,
    repairs: garage.filter(g => g.vehicleId === v.id).length,
  })).filter(x => x.repairs > 0)

  const driverOptions = useMemo(() => drivers.map(d => ({ value: d.id, label: d.name })), [drivers])
  const vehicleOptions = useMemo(() => vehicles.map(v => ({ value: v.id, label: `${v.reg} - ${v.name}` })), [vehicles])

  const rows = garage.map(g => ({
    id: g.id,
    date: g.date,
    vehicle: vehicles.find(v => v.id === g.vehicleId)?.reg ?? "—",
    driver: drivers.find(d => d.id === g.driverId)?.name ?? "—",
    issue: g.issueType,
    cost: fmt(g.cost, currencySymbol),
  })) as Record<string, unknown>[]

  return (
    <div className="flex-1 overflow-y-auto">
      <TopBarComponent title="Garage Management" subtitle="Track repairs & maintenance" onMenu={onMenu}
        actions={<Btn onClick={() => { setEditingId(null); setForm({ date: TODAY, vehicleId: "", driverId: "", issueType: "Service", cost: "" }); setShowForm(s => !s) }}><Plus className="w-4 h-4" /> Add Entry</Btn>} />
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <KPI label="Total Garage Cost" value={fmt(totalCost, currencySymbol)} icon={Wrench} iconCls="bg-orange-50 text-orange-600" />
          <KPI label="Total Repairs" value={String(garage.length)} icon={Activity} iconCls="bg-blue-50 text-blue-600" />
          <KPI label="Vehicles Serviced" value={String(repairsPerVehicle.length)} icon={Truck} iconCls="bg-violet-50 text-violet-600" />
        </div>
        {showForm && (
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">{editingId ? "Edit Garage Entry" : "Add Garage Entry"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <FInput label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              <SearchableSelect label="Vehicle" value={form.vehicleId} onChange={val => setForm(f => ({ ...f, vehicleId: val }))} options={vehicleOptions} />
              <SearchableSelect label="Driver" value={form.driverId} onChange={val => setForm(f => ({ ...f, driverId: val }))} options={driverOptions} />
              <FSelect label="Issue Type" value={form.issueType} onChange={e => setForm(f => ({ ...f, issueType: e.target.value }))}>
                {ISSUE_TYPES.map(t => <option key={t}>{t}</option>)}
              </FSelect>
              <FInput label="Garage Charge" type="number" step="0.01" placeholder="0.00" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
            </div>
            <div className="flex gap-2 mt-4">
              <Btn onClick={save}>{editingId ? "Save Changes" : "Save Garage Entry"}</Btn>
              <Btn variant="secondary" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</Btn>
            </div>
          </Card>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="p-5 lg:col-span-2">
            <Table
              columns={[
                { key: "date", label: "Date" },
                { key: "vehicle", label: "Vehicle" },
                { key: "driver", label: "Driver" },
                { key: "issue", label: "Issue Type", render: r => <Badge color={ISSUE_COLOR[String(r.issue)] ?? "gray"}>{String(r.issue)}</Badge> },
                { key: "cost", label: "Cost" },
                {
                  key: "actions", label: "",
                  render: r => (
                    <div className="flex gap-1">
                      <button onClick={() => edit(garage.find(g => g.id === r.id)!)} title="Edit"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => del(String(r.id))} title="Delete"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ),
                },
              ]}
              rows={rows}
              searchable={["vehicle", "driver", "issue"]}
            />
          </Card>
          <div className="space-y-5">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Repairs per Vehicle</h3>
              <div className="space-y-2">
                {vehicles.map(v => {
                  const repairs = garage.filter(g => g.vehicleId === v.id)
                  const totalVehicleCost = repairs.reduce((sum, r) => sum + r.cost, 0)
                  if (repairs.length === 0) return null
                  return (
                    <div key={v.id} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-50 last:border-0">
                      <div>
                        <span className="font-semibold text-slate-700">{v.reg}</span>
                        <span className="text-slate-400 ml-1">({v.name})</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-slate-700">{repairs.length} repair{repairs.length > 1 ? "s" : ""}</span>
                        <span className="font-bold text-orange-600 ml-2">{fmt(totalVehicleCost, currencySymbol)}</span>
                      </div>
                    </div>
                  )
                })}
                {garage.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No entries recorded</p>}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Payroll Page ────────────────────────────────────────────────────────────

function PayrollPage({ drivers, payroll, setPayroll, onMenu, currencySymbol }: {
  drivers: Driver[]; payroll: PayrollEntry[]
  setPayroll: React.Dispatch<React.SetStateAction<PayrollEntry[]>>; onMenu: () => void; currencySymbol: string
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ week: "W28 2025", date: TODAY, driverId: "", salary: "", bonus: "", advance: "" })

  const save = () => {
    if (!form.driverId || !form.salary) { toast.error("Please fill required fields"); return }
    if (+form.salary <= 0 || (form.bonus !== "" && +form.bonus < 0) || (form.advance !== "" && +form.advance < 0)) {
      toast.error("Salaries, bonuses, and advances must be positive numbers")
      return
    }

    const salary = +form.salary, bonus = +(form.bonus || 0), advance = +(form.advance || 0)
    const payload = {
      week: form.week,
      date: form.date,
      driverId: form.driverId,
      salary,
      bonus,
      advance,
      totalPaid: salary + bonus - advance,
    }

    if (editingId) {
      setPayroll(prev => prev.map(p => p.id === editingId ? { ...p, ...payload } : p))
      toast.success("Payroll entry updated")
    } else {
      setPayroll(prev => [{ ...payload, id: uid() }, ...prev])
      toast.success("Payroll entry saved")
    }

    setForm({ week: "W28 2025", date: TODAY, driverId: "", salary: "", bonus: "", advance: "" })
    setEditingId(null)
    setShowForm(false)
  }

  const edit = (p: PayrollEntry) => {
    setForm({
      week: p.week,
      date: p.date,
      driverId: p.driverId,
      salary: String(p.salary),
      bonus: String(p.bonus),
      advance: String(p.advance),
    })
    setEditingId(p.id)
    setShowForm(true)
  }

  const del = (id: string) => {
    setPayroll(prev => prev.filter(p => p.id !== id))
    toast.success("Payroll entry deleted")
  }

  const totalPaid = payroll.reduce((a, p) => a + p.totalPaid, 0)
  const driverOptions = useMemo(() => drivers.filter(d => d.status === "Active").map(d => ({ value: d.id, label: d.name })), [drivers])

  const rows = payroll.map(p => ({
    id: p.id,
    week: p.week,
    date: p.date,
    driver: drivers.find(d => d.id === p.driverId)?.name ?? "—",
    salary: fmt(p.salary, currencySymbol),
    bonus: fmt(p.bonus, currencySymbol),
    advance: fmt(p.advance, currencySymbol),
    total: fmt(p.totalPaid, currencySymbol),
  })) as Record<string, unknown>[]

  return (
    <div className="flex-1 overflow-y-auto">
      <TopBarComponent title="Driver Payroll" subtitle="Weekly payment management" onMenu={onMenu}
        actions={<Btn onClick={() => { setEditingId(null); setForm({ week: "W28 2025", date: TODAY, driverId: "", salary: "", bonus: "", advance: "" }); setShowForm(s => !s) }}><Plus className="w-4 h-4" /> Add Payroll</Btn>} />
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <KPI label="Total Paid Out" value={fmt(totalPaid, currencySymbol)} icon={DollarSign} iconCls="bg-violet-50 text-violet-600" />
          <KPI label="Payroll Records" value={String(payroll.length)} icon={Users} iconCls="bg-blue-50 text-blue-600" />
          <KPI label="Drivers Paid" value={String(new Set(payroll.map(p => p.driverId)).size)} icon={CheckCircle} iconCls="bg-emerald-50 text-emerald-600" />
        </div>
        {showForm && (
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">{editingId ? "Edit Payroll Entry" : "Add Payroll Entry"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
              <FInput label="Week" placeholder="W28 2025" value={form.week} onChange={e => setForm(f => ({ ...f, week: e.target.value }))} />
              <FInput label="Payout Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              <SearchableSelect label="Driver" value={form.driverId} onChange={val => setForm(f => ({ ...f, driverId: val }))} options={driverOptions} />
              <FInput label="Salary" type="number" step="0.01" placeholder="0.00" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} />
              <FInput label="Bonus" type="number" step="0.01" placeholder="0.00" value={form.bonus} onChange={e => setForm(f => ({ ...f, bonus: e.target.value }))} />
              <FInput label="Advance" type="number" step="0.01" placeholder="0.00" value={form.advance} onChange={e => setForm(f => ({ ...f, advance: e.target.value }))} />
            </div>
            <div className="flex gap-2 mt-4">
              <Btn onClick={save}>{editingId ? "Save Changes" : "Save Payroll"}</Btn>
              <Btn variant="secondary" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</Btn>
            </div>
          </Card>
        )}
        <Card className="p-5">
          <Table
            columns={[
              { key: "week", label: "Week" },
              { key: "date", label: "Payout Date" },
              { key: "driver", label: "Driver" },
              { key: "salary", label: "Salary" },
              { key: "bonus", label: "Bonus" },
              { key: "advance", label: "Advance" },
              { key: "total", label: "Total Paid" },
              {
                key: "actions", label: "",
                render: r => (
                  <div className="flex gap-1">
                    <button onClick={() => edit(payroll.find(p => p.id === r.id)!)} title="Edit"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => del(String(r.id))} title="Delete"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ),
              },
            ]}
            rows={rows}
            searchable={["driver", "week"]}
          />
        </Card>
      </div>
    </div>
  )
}

// ─── Settlement Page ─────────────────────────────────────────────────────────

function SettlementPage({ drivers, vehicles, routes, settlements, setSettlements, onMenu, currencySymbol }: {
  drivers: Driver[]; vehicles: Vehicle[]; routes: Route[]
  settlements: Settlement[]; setSettlements: React.Dispatch<React.SetStateAction<Settlement[]>>; onMenu: () => void; currencySymbol: string
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ date: TODAY, vehicleId: "", driverId: "", routeId: "", amount: "" })

  const save = () => {
    if (!form.vehicleId || !form.driverId || !form.amount) { toast.error("Please fill required fields"); return }
    if (+form.amount <= 0) { toast.error("Please enter a positive settlement amount"); return }

    const payload = {
      date: form.date,
      vehicleId: form.vehicleId,
      driverId: form.driverId,
      routeId: form.routeId,
      amount: +form.amount,
    }

    if (editingId) {
      setSettlements(prev => prev.map(s => s.id === editingId ? { ...s, ...payload } : s))
      toast.success("Settlement updated")
    } else {
      setSettlements(prev => [{ ...payload, id: uid() }, ...prev])
      toast.success("Settlement saved")
    }

    setForm({ date: TODAY, vehicleId: "", driverId: "", routeId: "", amount: "" })
    setEditingId(null)
    setShowForm(false)
  }

  const edit = (s: Settlement) => {
    setForm({
      date: s.date,
      vehicleId: s.vehicleId,
      driverId: s.driverId,
      routeId: s.routeId,
      amount: String(s.amount),
    })
    setEditingId(s.id)
    setShowForm(true)
  }

  const del = (id: string) => {
    setSettlements(prev => prev.filter(s => s.id !== id))
    toast.success("Settlement deleted")
  }

  const totalIncome = settlements.reduce((a, s) => a + s.amount, 0)

  const driverOptions = useMemo(() => drivers.filter(d => d.status === "Active").map(d => ({ value: d.id, label: d.name })), [drivers])
  const vehicleOptions = useMemo(() => vehicles.filter(v => v.status === "Active").map(v => ({ value: v.id, label: v.reg })), [vehicles])
  const routeOptions = useMemo(() => routes.map(r => ({ value: r.id, label: r.name })), [routes])

  const rows = settlements.map(s => ({
    id: s.id,
    date: s.date,
    vehicle: vehicles.find(v => v.id === s.vehicleId)?.reg ?? "—",
    driver: drivers.find(d => d.id === s.driverId)?.name ?? "—",
    route: routes.find(r => r.id === s.routeId)?.name ?? "—",
    income: fmt(s.amount, currencySymbol),
  })) as Record<string, unknown>[]

  return (
    <div className="flex-1 overflow-y-auto">
      <TopBarComponent title="DPD Settlement" subtitle="Record business income" onMenu={onMenu}
        actions={<Btn onClick={() => { setEditingId(null); setForm({ date: TODAY, vehicleId: "", driverId: "", routeId: "", amount: "" }); setShowForm(s => !s) }}><Plus className="w-4 h-4" /> Add Settlement</Btn>} />
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <KPI label="Total Income" value={fmt(totalIncome, currencySymbol)} icon={TrendingUp} iconCls="bg-emerald-50 text-emerald-600" />
          <KPI label="Settlements" value={String(settlements.length)} icon={Receipt} iconCls="bg-blue-50 text-blue-600" />
          <KPI label="Avg per Settlement" value={settlements.length ? fmt(totalIncome / settlements.length, currencySymbol) : "£0.00"} icon={BarChart3} iconCls="bg-violet-50 text-violet-600" />
        </div>
        {showForm && (
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">{editingId ? "Edit Settlement" : "Add DPD Settlement"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <FInput label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              <SearchableSelect label="Vehicle" value={form.vehicleId} onChange={val => setForm(f => ({ ...f, vehicleId: val }))} options={vehicleOptions} />
              <SearchableSelect label="Driver" value={form.driverId} onChange={val => setForm(f => ({ ...f, driverId: val }))} options={driverOptions} />
              <SearchableSelect label="Route" value={form.routeId} onChange={val => setForm(f => ({ ...f, routeId: val }))} options={routeOptions} />
              <FInput label="Settlement Amount" type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="flex gap-2 mt-4">
              <Btn onClick={save}>{editingId ? "Save Changes" : "Save Settlement"}</Btn>
              <Btn variant="secondary" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</Btn>
            </div>
          </Card>
        )}
        <Card className="p-5">
          <Table
            columns={[
              { key: "date", label: "Date" },
              { key: "vehicle", label: "Vehicle" },
              { key: "driver", label: "Driver" },
              { key: "route", label: "Route" },
              { key: "income", label: "Income" },
              {
                key: "actions", label: "",
                render: r => (
                  <div className="flex gap-1">
                    <button onClick={() => edit(settlements.find(s => s.id === r.id)!)} title="Edit"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => del(String(r.id))} title="Delete"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ),
              },
            ]}
            rows={rows}
            searchable={["vehicle", "driver", "route"]}
          />
          <div className="flex items-center justify-end mt-4 pt-4 border-t border-slate-100 gap-3">
            <p className="text-sm text-slate-500">Total Income</p>
            <p className="text-xl font-bold text-emerald-600">{fmt(totalIncome, currencySymbol)}</p>
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── Financial Page ──────────────────────────────────────────────────────────

function FinancialPage({ fuel, garage, payroll, settlements, onMenu, currencySymbol }: {
  fuel: FuelEntry[]; garage: GarageEntry[]; payroll: PayrollEntry[]
  settlements: Settlement[]; onMenu: () => void; currencySymbol: string
}) {
  const totalIncome = settlements.reduce((a, s) => a + s.amount, 0)
  const totalFuel = fuel.reduce((a, f) => a + f.cost, 0)
  const totalGarage = garage.reduce((a, g) => a + g.cost, 0)
  const totalPayroll = payroll.reduce((a, p) => a + p.totalPaid, 0)
  const totalExpenses = totalFuel + totalGarage + totalPayroll
  const netProfit = totalIncome - totalExpenses
  const margin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : "0.0"

  const barData = [
    { name: "Fuel", value: totalFuel, fill: "#fbbf24" },
    { name: "Garage", value: totalGarage, fill: "#f97316" },
    { name: "Payroll", value: totalPayroll, fill: "#8b5cf6" },
  ]

  const pl = [
    { label: "DPD Settlements (Income)", value: totalIncome, type: "income" },
    { label: "Fuel Expense", value: totalFuel, type: "expense" },
    { label: "Garage Expense", value: totalGarage, type: "expense" },
    { label: "Driver Payroll", value: totalPayroll, type: "expense" },
    { label: "Total Expenses", value: totalExpenses, type: "total" },
    { label: "Net Profit", value: netProfit, type: "profit" },
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      <TopBarComponent title="Financial Summary" subtitle="Auto-generated profit & loss report" onMenu={onMenu} />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KPI label="Total Income" value={fmt(totalIncome, currencySymbol)} icon={TrendingUp} iconCls="bg-emerald-50 text-emerald-600" />
          <KPI label="Total Expenses" value={fmt(totalExpenses, currencySymbol)} icon={TrendingDown} iconCls="bg-red-50 text-red-600" />
          <KPI label="Net Profit" value={fmt(netProfit, currencySymbol)} icon={BarChart3} iconCls={netProfit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"} />
          <KPI label="Profit Margin" value={margin + "%"} icon={Activity} iconCls="bg-violet-50 text-violet-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Profit & Loss Statement</h3>
            <div className="space-y-2">
              {pl.map((row, i) => (
                <div key={i} className={`flex items-center justify-between py-2.5 px-4 rounded-xl ${
                  row.type === "income" ? "bg-emerald-50" :
                  row.type === "profit" ? (netProfit >= 0 ? "bg-emerald-50" : "bg-red-50") :
                  row.type === "total" ? "bg-red-50" : "bg-slate-50"
                }`}>
                  <span className={`text-sm ${
                    row.type === "income" ? "text-emerald-700 font-medium" :
                    row.type === "profit" ? (netProfit >= 0 ? "text-emerald-800 font-bold" : "text-red-800 font-bold") :
                    row.type === "total" ? "text-red-700 font-medium" : "text-slate-600"
                  }`}>{row.label}</span>
                  <span className={`text-sm font-bold tabular-nums ${
                    row.type === "income" ? "text-emerald-700" :
                    row.type === "profit" ? (netProfit >= 0 ? "text-emerald-700" : "text-red-600") :
                    row.type === "total" ? "text-red-600" : "text-slate-700"
                  }`}>{fmt(row.value, currencySymbol)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Expense Breakdown</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${currencySymbol}${v}`} />
                <Tooltip formatter={(v: number) => fmt(v, currencySymbol)} contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ─── Alerts Page ─────────────────────────────────────────────────────────────

function AlertsPage({ drivers, vehicles, fuel, garage, orders, onMenu, currencySymbol, cfg }: {
  drivers: Driver[]; vehicles: Vehicle[]; fuel: FuelEntry[]
  garage: GarageEntry[]; orders: Order[]; onMenu: () => void; currencySymbol: string; cfg: AppConfig
}) {
  const fuelThresholdNum = parseFloat(cfg.fuelThreshold) || 500
  const garageThresholdNum = parseFloat(cfg.garageThreshold) || 300

  const alerts = useMemo(() => {
    type AlertType = "warning" | "info" | "danger" | "success"
    const list: { id: string; type: AlertType; title: string; body: string; icon: React.ElementType }[] = []

    const vehicleCosts = vehicles
      .map(v => ({ v, cost: garage.filter(g => g.vehicleId === v.id).reduce((a, g) => a + g.cost, 0) }))
      .filter(x => x.cost > 0).sort((a, b) => b.cost - a.cost)
    if (vehicleCosts[0] && vehicleCosts[0].cost > garageThresholdNum) {
      list.push({ id: "a1", type: "warning", title: `${vehicleCosts[0].v.reg} — High Garage Spend`, body: `This vehicle has accumulated ${fmt(vehicleCosts[0].cost, currencySymbol)} in garage costs (Threshold: ${fmt(garageThresholdNum, currencySymbol)}). Consider scheduling a full mechanical review.`, icon: AlertTriangle })
    }

    const multiRepair = vehicles
      .map(v => ({ v, visits: garage.filter(g => g.vehicleId === v.id).length }))
      .filter(x => x.visits >= 2).sort((a, b) => b.visits - a.visits)
    if (multiRepair[0]) {
      list.push({ id: "a2", type: "danger", title: `${multiRepair[0].v.reg} — Frequent Garage Visits`, body: `${multiRepair[0].v.reg} has entered the garage ${multiRepair[0].visits} times recently. Investigate recurring mechanical issues.`, icon: Wrench })
    }

    const todayDriverIds = new Set(orders.filter(o => o.date === TODAY).map(o => o.driverId))
    drivers.filter(d => d.status === "Active" && !todayDriverIds.has(d.id)).forEach((d, i) => {
      list.push({ id: `a3-${i}`, type: "info", title: `${d.name} — No Order Assigned Today`, body: `Active driver has no assigned route today. Assign an order to maximize utilization.`, icon: Users })
    })

    const totalFuelRecent = fuel.filter(f => {
      const diff = new Date().getTime() - new Date(f.date).getTime()
      return diff / (1000 * 60 * 60 * 24) <= 7
    }).reduce((a, f) => a + f.cost, 0)

    if (totalFuelRecent > fuelThresholdNum) {
      list.push({ id: "a4", type: "warning", title: "Fuel Spend Above Threshold", body: `Fuel spend for the last 7 days is ${fmt(totalFuelRecent, currencySymbol)}, exceeding your config threshold of ${fmt(fuelThresholdNum, currencySymbol)}.`, icon: Fuel })
    }

    list.push({ id: "a5", type: "success", title: "Fleet Operations Healthy", body: "Week-to-date settlements are tracking normally. Active driver list fully authenticated.", icon: TrendingUp })

    return list
  }, [drivers, vehicles, fuel, garage, orders, fuelThresholdNum, garageThresholdNum, currencySymbol])

  const styles = {
    warning: { wrap: "border-amber-200 bg-amber-50", icon: "bg-amber-100 text-amber-600", title: "text-amber-900", body: "text-amber-700" },
    info: { wrap: "border-blue-200 bg-blue-50", icon: "bg-blue-100 text-blue-600", title: "text-blue-900", body: "text-blue-700" },
    danger: { wrap: "border-red-200 bg-red-50", icon: "bg-red-100 text-red-600", title: "text-red-900", body: "text-red-700" },
    success: { wrap: "border-emerald-200 bg-emerald-50", icon: "bg-emerald-100 text-emerald-600", title: "text-emerald-900", body: "text-emerald-700" },
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <TopBarComponent title="Alerts" subtitle="System-generated fleet insights based on settings thresholds" onMenu={onMenu} />
      <div className="p-6 space-y-4">
        {alerts.map(a => {
          const s = styles[a.type]
          return (
            <div key={a.id} className={`flex gap-4 p-4 rounded-2xl border ${s.wrap} transition-all`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.icon}`}>
                <a.icon className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-sm font-semibold ${s.title}`}>{a.title}</p>
                <p className={`text-sm mt-0.5 leading-relaxed ${s.body}`}>{a.body}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tracking Page (Simulated GPS Map) ───────────────────────────────────────

const CITIES = {
  London: { x: 220, y: 320 },
  Birmingham: { x: 160, y: 220 },
  Bristol: { x: 120, y: 280 },
  Manchester: { x: 150, y: 150 },
  Liverpool: { x: 110, y: 140 },
  Leeds: { x: 190, y: 120 },
  Glasgow: { x: 90, y: 40 },
}

function TrackingPage({ onMenu }: { onMenu: () => void }) {
  const [ticks, setTicks] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setTicks(t => t + 1)
    }, 100)
    return () => clearInterval(timer)
  }, [])

  const getPoint = (from: { x: number; y: number }, to: { x: number; y: number }, t: number) => {
    return {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    }
  }

  const t1 = (ticks % 100) / 100 // Manchester to Birmingham
  const t2 = ((ticks + 33) % 100) / 100 // London to Leeds
  const t3 = ((ticks + 66) % 100) / 100 // Liverpool to Glasgow

  const v1Pos = getPoint(CITIES.Manchester, CITIES.Birmingham, t1)
  const v2Pos = getPoint(CITIES.London, CITIES.Leeds, t2)
  const v3Pos = getPoint(CITIES.Liverpool, CITIES.Glasgow, t3)

  const activeVehicles = [
    { reg: "MN21 XKT", name: "Ford Transit", from: "Manchester", to: "Birmingham", progress: Math.round(t1 * 100), speed: "62 mph", eta: "12 min", pos: v1Pos },
    { reg: "LN70 RPJ", name: "Mercedes Sprinter", from: "London", to: "Leeds", progress: Math.round(t2 * 100), speed: "58 mph", eta: "35 min", pos: v2Pos },
    { reg: "BD19 LKY", name: "Renault Master", from: "Liverpool", to: "Glasgow", progress: Math.round(t3 * 100), speed: "64 mph", eta: "54 min", pos: v3Pos },
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      <TopBarComponent title="Live GPS Fleet Tracking" subtitle="Real-time vehicle simulation" onMenu={onMenu} />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5 flex flex-col items-center justify-center bg-slate-900 border-0 h-[450px] relative overflow-hidden rounded-2xl">
          <svg className="w-full h-full max-w-[400px] max-h-[400px]" viewBox="0 0 350 380">
            {/* Draw Roadmap Lines */}
            <line x1={CITIES.London.x} y1={CITIES.London.y} x2={CITIES.Birmingham.x} y2={CITIES.Birmingham.y} stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
            <line x1={CITIES.Birmingham.x} y1={CITIES.Birmingham.y} x2={CITIES.Manchester.x} y2={CITIES.Manchester.y} stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
            <line x1={CITIES.Manchester.x} y1={CITIES.Manchester.y} x2={CITIES.Liverpool.x} y2={CITIES.Liverpool.y} stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
            <line x1={CITIES.London.x} y1={CITIES.London.y} x2={CITIES.Leeds.x} y2={CITIES.Leeds.y} stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
            <line x1={CITIES.Liverpool.x} y1={CITIES.Liverpool.y} x2={CITIES.Glasgow.x} y2={CITIES.Glasgow.y} stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
            <line x1={CITIES.Birmingham.x} y1={CITIES.Birmingham.y} x2={CITIES.Bristol.x} y2={CITIES.Bristol.y} stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />

            {/* City Nodes */}
            {Object.entries(CITIES).map(([name, pos]) => (
              <g key={name}>
                <circle cx={pos.x} cy={pos.y} r="5" fill="#475569" />
                <text x={pos.x + 8} y={pos.y + 4} fill="#94a3b8" fontSize="9" fontFamily="Inter" fontWeight="semibold">{name}</text>
              </g>
            ))}

            {/* Moving Vehicles */}
            <circle cx={v1Pos.x} cy={v1Pos.y} r="7" fill="#8b5cf6" className="animate-pulse" />
            <circle cx={v2Pos.x} cy={v2Pos.y} r="7" fill="#3b82f6" className="animate-pulse" />
            <circle cx={v3Pos.x} cy={v3Pos.y} r="7" fill="#10b981" className="animate-pulse" />
          </svg>

          <div className="absolute top-4 left-4 flex gap-2">
            <span className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/80 px-2 py-1 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block"></span> Transit
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/80 px-2 py-1 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Sprinter
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/80 px-2 py-1 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Master
            </span>
          </div>
        </Card>

        <div className="space-y-4">
          {activeVehicles.map(v => (
            <Card key={v.reg} className="p-4 border border-slate-100 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">{v.reg}</span>
                  <h4 className="text-sm font-bold text-slate-800 mt-1">{v.name}</h4>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">ETA</p>
                  <p className="text-xs font-semibold text-slate-700">{v.eta}</p>
                </div>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{v.from}</span>
                <span>{v.to}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-violet-600 h-full rounded-full transition-all duration-300" style={{ width: `${v.progress}%` }}></div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">{v.progress}% route completed</span>
                <span className="font-semibold text-slate-700">{v.speed}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Settings: Drivers ───────────────────────────────────────────────────────

function DriversSettings({ drivers, setDrivers, onMenu }: {
  drivers: Driver[]; setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>; onMenu: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Driver | null>(null)
  const [form, setForm] = useState({ name: "", phone: "", license: "", status: "Active" as "Active" | "Inactive" })

  const openNew = () => { setEditing(null); setForm({ name: "", phone: "", license: "", status: "Active" }); setShowForm(true) }
  const openEdit = (d: Driver) => { setEditing(d); setForm({ name: d.name, phone: d.phone, license: d.license, status: d.status }); setShowForm(true) }

  const save = () => {
    if (!form.name || !form.license) { toast.error("Name and License are required"); return }

    const isDuplicate = drivers.some(d => d.license.toLowerCase() === form.license.toLowerCase() && (!editing || d.id !== editing.id))
    if (isDuplicate) {
      toast.error("A driver with this license number already exists")
      return
    }

    if (editing) {
      setDrivers(prev => prev.map(d => d.id === editing.id ? { ...d, ...form } : d))
      toast.success("Driver updated")
    } else {
      setDrivers(prev => [...prev, { id: uid(), ...form }])
      toast.success("Driver added")
    }
    setShowForm(false)
  }

  const del = (id: string) => { setDrivers(prev => prev.filter(d => d.id !== id)); toast.success("Driver deleted") }

  const rows = drivers as unknown as Record<string, unknown>[]

  return (
    <div className="flex-1 overflow-y-auto">
      <TopBarComponent title="Drivers" subtitle="Manage your driver roster" onMenu={onMenu}
        actions={<Btn onClick={openNew}><Plus className="w-4 h-4" /> Add Driver</Btn>} />
      <div className="p-6 space-y-5">
        {showForm && (
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">{editing ? "Edit Driver" : "Add Driver"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <FInput label="Full Name" placeholder="James Wilson" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <FInput label="Phone Number" placeholder="07700 900000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              <FInput label="License Number" placeholder="XXXXX000000XX0AA" value={form.license} onChange={e => setForm(f => ({ ...f, license: e.target.value }))} />
              <FSelect label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as "Active" | "Inactive" }))}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </FSelect>
            </div>
            <div className="flex gap-2 mt-4">
              <Btn onClick={save}>{editing ? "Update Driver" : "Add Driver"}</Btn>
              <Btn variant="secondary" onClick={() => setShowForm(false)}>Cancel</Btn>
            </div>
          </Card>
        )}
        <Card className="p-5">
          <Table
            columns={[
              { key: "name", label: "Name" },
              { key: "phone", label: "Phone" },
              { key: "license", label: "License" },
              { key: "status", label: "Status", render: r => <Badge color={r.status === "Active" ? "green" : "gray"}>{String(r.status)}</Badge> },
              {
                key: "id", label: "", render: r => (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(drivers.find(d => d.id === r.id)!)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => del(String(r.id))}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ),
              },
            ]}
            rows={rows}
            searchable={["name", "phone", "license"]}
          />
        </Card>
      </div>
    </div>
  )
}

// ─── Settings: Vehicles ─────────────────────────────────────────────────────

function VehiclesSettings({ vehicles, setVehicles, onMenu }: {
  vehicles: Vehicle[]; setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>; onMenu: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [form, setForm] = useState({ reg: "", name: "", type: "Van", status: "Active" as "Active" | "Inactive" })

  const openNew = () => { setEditing(null); setForm({ reg: "", name: "", type: "Van", status: "Active" }); setShowForm(true) }
  const openEdit = (v: Vehicle) => { setEditing(v); setForm({ reg: v.reg, name: v.name, type: v.type, status: v.status }); setShowForm(true) }

  const save = () => {
    if (!form.reg || !form.name) { toast.error("Please fill required fields"); return }

    const isDuplicate = vehicles.some(v => v.reg.toUpperCase() === form.reg.toUpperCase() && (!editing || v.id !== editing.id))
    if (isDuplicate) {
      toast.error("A vehicle with this registration plate already exists")
      return
    }

    if (editing) {
      setVehicles(prev => prev.map(v => v.id === editing.id ? { ...v, ...form } : v))
      toast.success("Vehicle updated")
    } else {
      setVehicles(prev => [...prev, { id: uid(), ...form }])
      toast.success("Vehicle added")
    }
    setShowForm(false)
  }

  const del = (id: string) => { setVehicles(prev => prev.filter(v => v.id !== id)); toast.success("Vehicle deleted") }

  const rows = vehicles as unknown as Record<string, unknown>[]

  return (
    <div className="flex-1 overflow-y-auto">
      <TopBarComponent title="Vehicles" subtitle="Manage your fleet" onMenu={onMenu}
        actions={<Btn onClick={openNew}><Plus className="w-4 h-4" /> Add Vehicle</Btn>} />
      <div className="p-6 space-y-5">
        {showForm && (
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">{editing ? "Edit Vehicle" : "Add Vehicle"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <FInput label="Registration" placeholder="AB12 XYZ" value={form.reg} onChange={e => setForm(f => ({ ...f, reg: e.target.value.toUpperCase() }))} />
              <FInput label="Vehicle Name" placeholder="Ford Transit" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <FSelect label="Vehicle Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option>Van</option>
                <option>Lorry</option>
                <option>Minibus</option>
                <option>Car</option>
              </FSelect>
              <FSelect label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as "Active" | "Inactive" }))}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </FSelect>
            </div>
            <div className="flex gap-2 mt-4">
              <Btn onClick={save}>{editing ? "Update Vehicle" : "Add Vehicle"}</Btn>
              <Btn variant="secondary" onClick={() => setShowForm(false)}>Cancel</Btn>
            </div>
          </Card>
        )}
        <Card className="p-5">
          <Table
            columns={[
              { key: "reg", label: "Registration" },
              { key: "name", label: "Vehicle Name" },
              { key: "type", label: "Type" },
              { key: "status", label: "Status", render: r => <Badge color={r.status === "Active" ? "green" : "gray"}>{String(r.status)}</Badge> },
              {
                key: "id", label: "", render: r => (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(vehicles.find(v => v.id === r.id)!)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => del(String(r.id))}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ),
              },
            ]}
            rows={rows}
            searchable={["reg", "name", "type"]}
          />
        </Card>
      </div>
    </div>
  )
}

// ─── Settings: Routes ────────────────────────────────────────────────────────

function RoutesSettings({ routes, setRoutes, onMenu }: {
  routes: Route[]; setRoutes: React.Dispatch<React.SetStateAction<Route[]>>; onMenu: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Route | null>(null)
  const [form, setForm] = useState({ name: "" })

  const openNew = () => { setEditing(null); setForm({ name: "" }); setShowForm(true) }
  const openEdit = (r: Route) => { setEditing(r); setForm({ name: r.name }); setShowForm(true) }

  const save = () => {
    if (!form.name) { toast.error("Route name required"); return }
    if (editing) {
      setRoutes(prev => prev.map(r => r.id === editing.id ? { ...r, ...form } : r))
      toast.success("Route updated")
    } else {
      setRoutes(prev => [...prev, { id: uid(), ...form }])
      toast.success("Route added")
    }
    setShowForm(false)
  }

  const del = (id: string) => { setRoutes(prev => prev.filter(r => r.id !== id)); toast.success("Route deleted") }

  const rows = routes as unknown as Record<string, unknown>[]

  return (
    <div className="flex-1 overflow-y-auto">
      <TopBarComponent title="Routes" subtitle="Manage delivery routes" onMenu={onMenu}
        actions={<Btn onClick={openNew}><Plus className="w-4 h-4" /> Add Route</Btn>} />
      <div className="p-6 space-y-5">
        {showForm && (
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">{editing ? "Edit Route" : "Add Route"}</h3>
            <div className="max-w-sm">
              <FInput label="Route Name" placeholder="Manchester → Birmingham" value={form.name} onChange={e => setForm({ name: e.target.value })} />
            </div>
            <div className="flex gap-2 mt-4">
              <Btn onClick={save}>{editing ? "Update Route" : "Add Route"}</Btn>
              <Btn variant="secondary" onClick={() => setShowForm(false)}>Cancel</Btn>
            </div>
          </Card>
        )}
        <Card className="p-5">
          <Table
            columns={[
              { key: "name", label: "Route Name" },
              {
                key: "id", label: "", render: r => (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(routes.find(x => x.id === r.id)!)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => del(String(r.id))}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ),
              },
            ]}
            rows={rows}
            searchable={["name"]}
          />
        </Card>
      </div>
    </div>
  )
}

// ─── Settings: Weekly ────────────────────────────────────────────────────────

function WeeklySettings({ onMenu, cfg, setCfg }: {
  onMenu: () => void
  cfg: AppConfig
  setCfg: React.Dispatch<React.SetStateAction<AppConfig>>
}) {
  const save = () => toast.success("Settings saved successfully")

  return (
    <div className="flex-1 overflow-y-auto">
      <TopBarComponent title="Weekly Settings" subtitle="Configure platform defaults" onMenu={onMenu} />
      <div className="p-6">
        <div className="max-w-2xl space-y-5">
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">General Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FSelect label="Payroll Week Start Day" value={cfg.weekStart} onChange={e => setCfg(c => ({ ...c, weekStart: e.target.value }))}>
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(d => <option key={d}>{d}</option>)}
              </FSelect>
              <FSelect label="Default Fuel Unit" value={cfg.fuelUnit} onChange={e => setCfg(c => ({ ...c, fuelUnit: e.target.value }))}>
                <option>Litres</option>
                <option>Gallons</option>
              </FSelect>
              <FSelect label="Currency" value={cfg.currency} onChange={e => setCfg(c => ({ ...c, currency: e.target.value }))}>
                <option>GBP (£)</option>
                <option>EUR (€)</option>
                <option>USD ($)</option>
                <option>INR (₹)</option>
              </FSelect>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">Weekly Alert Thresholds</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FInput label="Fuel Alert Threshold" type="number" value={cfg.fuelThreshold} onChange={e => setCfg(c => ({ ...c, fuelThreshold: e.target.value }))} />
              <FInput label="Garage Alert Threshold" type="number" value={cfg.garageThreshold} onChange={e => setCfg(c => ({ ...c, garageThreshold: e.target.value }))} />
              <FInput label="Weekly Revenue Target" type="number" value={cfg.revenueTarget} onChange={e => setCfg(c => ({ ...c, revenueTarget: e.target.value }))} />
            </div>
          </Card>

          <Btn onClick={save} className="w-full justify-center py-3">
            Save Settings
          </Btn>
        </div>
      </div>
    </div>
  )
}

// ─── Platform Console (Super Admin Dashboard) ──────────────────────────────

function PlatformPage({
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

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const session = localStorage.getItem("fleet_os_session")
    return session ? JSON.parse(session) : null
  })

  // Impersonation state for Super Admin Auditing Mode
  const [impersonatingEmail, setImpersonatingEmail] = useState<string | null>(null)

  const [page, setPage] = useState<Page>(() => {
    const session = localStorage.getItem("fleet_os_session")
    if (session) {
      try {
        const u = JSON.parse(session)
        if (u.email === "admin@fleetops.io") return "platform"
      } catch (e) {}
    }
    return "dashboard"
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Tenant states
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [fuel, setFuel] = useState<FuelEntry[]>([])
  const [garage, setGarage] = useState<GarageEntry[]>([])
  const [payroll, setPayroll] = useState<PayrollEntry[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [cfg, setCfg] = useState<AppConfig>({
    weekStart: "Monday",
    fuelUnit: "Litres",
    currency: "GBP (£)",
    fuelThreshold: "500",
    garageThreshold: "300",
    revenueTarget: "15000",
  })

  const currencySymbol = useMemo(() => CURRENCY_SYMBOLS[cfg.currency] || "£", [cfg.currency])

  // Platform users directory & billing states (Super Admin Console)
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const raw = localStorage.getItem("fleet_os_users")
    return raw ? JSON.parse(raw) : []
  })

  const [payments, setPayments] = useState<PlatformPayment[]>(() => {
    const raw = localStorage.getItem("fleet_os_payments")
    return raw ? JSON.parse(raw) : []
  })

  const [platformLogs, setPlatformLogs] = useState<PlatformActivityLog[]>(() => {
    const raw = localStorage.getItem("fleet_os_platform_logs")
    return raw ? JSON.parse(raw) : []
  })

  const [platformTickets, setPlatformTickets] = useState<PlatformTicket[]>(() => {
    const raw = localStorage.getItem("fleet_os_platform_tickets")
    return raw ? JSON.parse(raw) : []
  })

  const [platformConfig, setPlatformConfig] = useState<PlatformSettings>(() => {
    const raw = localStorage.getItem("fleet_os_platform_config")
    return raw ? JSON.parse(raw) : DEFAULT_PLATFORM_CONFIG
  })

  // Seed Mock Data in Local Storage for Platforms and Tenants
  useEffect(() => {
    const existingUsers = localStorage.getItem("fleet_os_users")
    if (!existingUsers) {
      localStorage.setItem("fleet_os_users", JSON.stringify(DEFAULT_USERS))
      setUsers(DEFAULT_USERS)
    }

    const existingPayments = localStorage.getItem("fleet_os_payments")
    if (!existingPayments) {
      localStorage.setItem("fleet_os_payments", JSON.stringify(DEFAULT_PAYMENTS))
      setPayments(DEFAULT_PAYMENTS)
    }

    // Seed Alpha isolated data
    const alphaEmail = "alpha@logistics.com"
    if (!localStorage.getItem(`fleet_os_data_${alphaEmail}`)) {
      const alphaData = {
        drivers: [
          { id: "d101", name: "David Miller", phone: "07911 222333", license: "MILLD998877", status: "Active" },
          { id: "d102", name: "Robert Taylor", phone: "07911 444555", license: "TAYLR554433", status: "Active" },
        ],
        vehicles: [
          { id: "v101", reg: "CP69 LND", name: "Renault Master Van", type: "Van", status: "Active" },
          { id: "v102", reg: "FX70 YYY", name: "DAF 18-Ton Lorry", type: "Lorry", status: "Active" },
        ],
        routes: ROUTES_SEED,
        orders: [
          { id: "o101", date: getRelativeDate(0), driverId: "d101", vehicleId: "v101", routeId: "r1", status: "Assigned" },
          { id: "o102", date: getRelativeDate(1), driverId: "d102", vehicleId: "v102", routeId: "r2", status: "Completed" },
        ],
        fuel: [
          { id: "f101", date: getRelativeDate(0), driverId: "d101", vehicleId: "v101", routeId: "r1", litres: 55, miles: 160, cost: 95.00 },
        ],
        garage: [
          { id: "g101", date: getRelativeDate(2), vehicleId: "v102", driverId: "d102", issueType: "Service", cost: 180 },
        ],
        payroll: [
          { id: "p101", week: "W27 2025", date: getRelativeDate(3), driverId: "d101", salary: 700, bonus: 50, advance: 0, totalPaid: 750 },
        ],
        settlements: [
          { id: "s101", date: getRelativeDate(0), vehicleId: "v101", driverId: "d101", routeId: "r1", amount: 1420 },
          { id: "s102", date: getRelativeDate(1), vehicleId: "v102", driverId: "d102", routeId: "r2", amount: 2850 },
        ],
        cfg: {
          weekStart: "Monday",
          fuelUnit: "Litres",
          currency: "USD ($)",
          fuelThreshold: "400",
          garageThreshold: "200",
          revenueTarget: "12000",
        }
      }
      localStorage.setItem(`fleet_os_data_${alphaEmail}`, JSON.stringify(alphaData))
    }

    // Seed Speedy isolated data
    const speedyEmail = "speedy@delivery.io"
    if (!localStorage.getItem(`fleet_os_data_${speedyEmail}`)) {
      const speedyData = {
        drivers: [
          { id: "d201", name: "Helena Rostova", phone: "07911 777888", license: "ROSTH112233", status: "Active" },
        ],
        vehicles: [
          { id: "v201", reg: "SP33 DDD", name: "Mercedes Sprinter", type: "Van", status: "Active" },
        ],
        routes: ROUTES_SEED,
        orders: [
          { id: "o201", date: getRelativeDate(0), driverId: "d201", vehicleId: "v201", routeId: "r1", status: "Completed" },
        ],
        fuel: [
          { id: "f201", date: getRelativeDate(0), driverId: "d201", vehicleId: "v201", routeId: "r1", litres: 65, miles: 200, cost: 110.00 },
        ],
        garage: [],
        payroll: [],
        settlements: [
          { id: "s201", date: getRelativeDate(0), vehicleId: "v201", driverId: "d201", routeId: "r1", amount: 1950 },
        ],
        cfg: {
          weekStart: "Monday",
          fuelUnit: "Litres",
          currency: "EUR (€)",
          fuelThreshold: "600",
          garageThreshold: "400",
          revenueTarget: "10000",
        }
      }
      localStorage.setItem(`fleet_os_data_${speedyEmail}`, JSON.stringify(speedyData))
    }
    const existingLogs = localStorage.getItem("fleet_os_platform_logs")
    if (!existingLogs) {
      localStorage.setItem("fleet_os_platform_logs", JSON.stringify(DEFAULT_LOGS))
      setPlatformLogs(DEFAULT_LOGS)
    }

    const existingTickets = localStorage.getItem("fleet_os_platform_tickets")
    if (!existingTickets) {
      localStorage.setItem("fleet_os_platform_tickets", JSON.stringify(DEFAULT_TICKETS))
      setPlatformTickets(DEFAULT_TICKETS)
    }

    const existingConfig = localStorage.getItem("fleet_os_platform_config")
    if (!existingConfig) {
      localStorage.setItem("fleet_os_platform_config", JSON.stringify(DEFAULT_PLATFORM_CONFIG))
      setPlatformConfig(DEFAULT_PLATFORM_CONFIG)
    }
  }, [])

  // Synchronize platform users directory
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem("fleet_os_users", JSON.stringify(users))
    }
  }, [users])

  // Synchronize billing ledgers
  useEffect(() => {
    if (payments.length > 0) {
      localStorage.setItem("fleet_os_payments", JSON.stringify(payments))
    }
  }, [payments])

  // Synchronize platform activity logs
  useEffect(() => {
    if (platformLogs.length > 0) {
      localStorage.setItem("fleet_os_platform_logs", JSON.stringify(platformLogs))
    }
  }, [platformLogs])

  // Synchronize platform support tickets
  useEffect(() => {
    if (platformTickets.length > 0) {
      localStorage.setItem("fleet_os_platform_tickets", JSON.stringify(platformTickets))
    }
  }, [platformTickets])

  // Synchronize platform configuration settings
  useEffect(() => {
    localStorage.setItem("fleet_os_platform_config", JSON.stringify(platformConfig))
  }, [platformConfig])

  // Resolve target email for state data retrieval
  const activeStateEmail = impersonatingEmail || currentUser?.email

  // Synchronize dynamic loaded state on user login, change, or impersonation trigger
  useEffect(() => {
    if (activeStateEmail) {
      const raw = localStorage.getItem(`fleet_os_data_${activeStateEmail}`)
      let dataObj = null
      if (raw) {
        try {
          dataObj = JSON.parse(raw)
        } catch (e) {
          console.error(e)
        }
      }

      // Default seed for demo admin
      if (!dataObj && activeStateEmail === "admin@fleetops.io") {
        dataObj = {
          drivers: DRIVERS_SEED,
          vehicles: VEHICLES_SEED,
          routes: ROUTES_SEED,
          orders: ORDERS_SEED,
          fuel: FUEL_SEED,
          garage: GARAGE_SEED,
          payroll: PAYROLL_SEED,
          settlements: SETTLEMENTS_SEED,
          cfg: {
            weekStart: "Monday",
            fuelUnit: "Litres",
            currency: "GBP (£)",
            fuelThreshold: "500",
            garageThreshold: "300",
            revenueTarget: "15000",
          },
        }
      }

      if (dataObj) {
        setDrivers(dataObj.drivers || [])
        setVehicles(dataObj.vehicles || [])
        setRoutes(dataObj.routes || [])
        setOrders(dataObj.orders || [])
        setFuel(dataObj.fuel || [])
        setGarage(dataObj.garage || [])
        setPayroll(dataObj.payroll || [])
        setSettlements(dataObj.settlements || [])
        setCfg(dataObj.cfg || {
          weekStart: "Monday",
          fuelUnit: "Litres",
          currency: "GBP (£)",
          fuelThreshold: "500",
          garageThreshold: "300",
          revenueTarget: "15000",
        })
      } else {
        // Clean workspace for new user
        setDrivers([])
        setVehicles([])
        setRoutes(ROUTES_SEED)
        setOrders([])
        setFuel([])
        setGarage([])
        setPayroll([])
        setSettlements([])
        setCfg({
          weekStart: "Monday",
          fuelUnit: "Litres",
          currency: "GBP (£)",
          fuelThreshold: "500",
          garageThreshold: "300",
          revenueTarget: "15000",
        })
      }
    }
  }, [activeStateEmail])

  // Reactive state persistence (disabled during impersonation read-only audits)
  useEffect(() => {
    if (currentUser && !impersonatingEmail) {
      const data = { drivers, vehicles, routes, orders, fuel, garage, payroll, settlements, cfg }
      localStorage.setItem(`fleet_os_data_${currentUser.email}`, JSON.stringify(data))
    }
  }, [currentUser, impersonatingEmail, drivers, vehicles, routes, orders, fuel, garage, payroll, settlements, cfg])

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user)
    localStorage.setItem("fleet_os_session", JSON.stringify(user))
    if (user.email === "admin@fleetops.io") {
      setPage("platform")
    } else {
      setPage("dashboard")
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setImpersonatingEmail(null)
    localStorage.removeItem("fleet_os_session")
    setPage("dashboard")
    toast.info("Logged out successfully")
  }

  const handleOnboardingComplete = (
    company: string,
    curr: string,
    initialAssets: { driver: Driver; vehicle: Vehicle }
  ) => {
    if (!currentUser) return

    // Update active user preferences
    const updatedUser = { ...currentUser, companyName: company, currency: curr, onboarded: true }
    setCurrentUser(updatedUser)
    localStorage.setItem("fleet_os_session", JSON.stringify(updatedUser))

    // Update users catalog
    const usersRaw = localStorage.getItem("fleet_os_users")
    const users: UserAccount[] = usersRaw ? JSON.parse(usersRaw) : []
    const updatedUsers = users.map(u => u.email === currentUser.email ? updatedUser : u)
    localStorage.setItem("fleet_os_users", JSON.stringify(updatedUsers))

    // Seed newly created driver & vehicle into their workspace
    setDrivers([initialAssets.driver])
    setVehicles([initialAssets.vehicle])
    setRoutes(ROUTES_SEED)
    setCfg(c => ({ ...c, currency: curr }))
  }

  // Auth routing guard
  if (!currentUser) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      </>
    )
  }

  // Onboarding routing guard
  if (!currentUser.onboarded) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <OnboardingPage currentUser={currentUser} onOnboardingComplete={handleOnboardingComplete} />
      </>
    )
  }

  const onMenu = () => setSidebarOpen(true)
  const shared = { drivers, vehicles, routes, onMenu }
  const isSuperAdmin = currentUser.email === "admin@fleetops.io"
  const isImpersonating = impersonatingEmail !== null

  const handleImpersonate = (email: string) => {
    const match = users.find(u => u.email === email)
    if (match) {
      setImpersonatingEmail(email)
      setPage("dashboard")
      toast.success(`Entering Impersonation: Auditing dashboard of ${match.companyName}`)
    }
  }

  const handleExitImpersonate = () => {
    setImpersonatingEmail(null)
    setPage("platform")
    toast.success("Exited impersonation mode")
  }

  // Resolve active sidebar display company name
  const activeCompanyName = isImpersonating
    ? users.find(u => u.email === impersonatingEmail)?.companyName ?? "Auditing..."
    : currentUser.companyName

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Toaster position="top-right" richColors />
      {(!isSuperAdmin || isImpersonating) && (
        <Sidebar
          page={page}
          setPage={setPage}
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          companyName={activeCompanyName}
          userEmail={isImpersonating ? impersonatingEmail : currentUser.email}
          onLogout={handleLogout}
          isAdmin={isSuperAdmin}
          isImpersonating={isImpersonating}
          onExitImpersonate={handleExitImpersonate}
        />
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Impersonation top audit banner */}
        {isImpersonating && (
          <div className="bg-amber-500 text-white text-xs font-semibold py-2 px-6 flex items-center justify-between shadow-sm z-30">
            <span>
              🔍 <strong>Read-Only Auditing Mode:</strong> Inspecting database for user: <strong>{impersonatingEmail}</strong> ({activeCompanyName}).
            </span>
            <button
              onClick={handleExitImpersonate}
              className="bg-white/20 hover:bg-white/30 text-white font-bold py-1 px-3 rounded-lg transition-all"
            >
              Exit Audit
            </button>
          </div>
        )}

        {page === "platform" && isSuperAdmin && !isImpersonating && (
          <PlatformPage
            users={users}
            setUsers={setUsers}
            payments={payments}
            setPayments={setPayments}
            onMenu={onMenu}
            onImpersonate={handleImpersonate}
            currencySymbol={currencySymbol}
            logs={platformLogs}
            setLogs={setPlatformLogs}
            tickets={platformTickets}
            setTickets={setPlatformTickets}
            platformConfig={platformConfig}
            setPlatformConfig={setPlatformConfig}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        )}

        {page === "dashboard" && (
          <DashboardPage {...shared} orders={orders} fuel={fuel} garage={garage} payroll={payroll} settlements={settlements} setPage={setPage} currencySymbol={currencySymbol} />
        )}
        {page === "orders" && (
          <OrdersPage {...shared} orders={orders} setOrders={setOrders} />
        )}
        {page === "fuel" && (
          <FuelPage {...shared} fuel={fuel} setFuel={setFuel} currencySymbol={currencySymbol} />
        )}
        {page === "garage" && (
          <GaragePage drivers={drivers} vehicles={vehicles} garage={garage} setGarage={setGarage} onMenu={onMenu} currencySymbol={currencySymbol} />
        )}
        {page === "payroll" && (
          <PayrollPage drivers={drivers} payroll={payroll} setPayroll={setPayroll} onMenu={onMenu} currencySymbol={currencySymbol} />
        )}
        {page === "settlement" && (
          <SettlementPage {...shared} settlements={settlements} setSettlements={setSettlements} currencySymbol={currencySymbol} />
        )}
        {page === "financial" && (
          <FinancialPage fuel={fuel} garage={garage} payroll={payroll} settlements={settlements} onMenu={onMenu} currencySymbol={currencySymbol} />
        )}
        {page === "alerts" && (
          <AlertsPage drivers={drivers} vehicles={vehicles} fuel={fuel} garage={garage} orders={orders} onMenu={onMenu} currencySymbol={currencySymbol} cfg={cfg} />
        )}
        {page === "tracking" && <TrackingPage onMenu={onMenu} />}
        {page === "settings-drivers" && <DriversSettings drivers={drivers} setDrivers={setDrivers} onMenu={onMenu} />}
        {page === "settings-vehicles" && <VehiclesSettings vehicles={vehicles} setVehicles={setVehicles} onMenu={onMenu} />}
        {page === "settings-routes" && <RoutesSettings routes={routes} setRoutes={setRoutes} onMenu={onMenu} />}
        {page === "settings-weekly" && <WeeklySettings onMenu={onMenu} cfg={cfg} setCfg={setCfg} />}
      </div>
    </div>
  )
}
