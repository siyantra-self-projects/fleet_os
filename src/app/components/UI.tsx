import React, { useState, useMemo, useEffect, useRef } from "react"
import { Search, ChevronDown, CheckCircle, ArrowUpRight, ArrowDownRight } from "lucide-react"

export const TODAY = new Date().toISOString().split("T")[0]

export function fmt(n: number, symbol = "£") {
  return symbol + n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export function getRelativeDate(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() - offsetDays)
  return d.toISOString().split("T")[0]
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  "GBP (£)": "£",
  "EUR (€)": "€",
  "USD ($)": "$",
}

export type Page =
  | "dashboard" | "orders" | "fuel" | "garage" | "payroll"
  | "settlement" | "financial" | "alerts" | "tracking"
  | "settings-drivers" | "settings-vehicles" | "settings-routes" | "settings-weekly"
  | "platform"

export interface Driver { id: string; name: string; phone: string; license: string; status: "Active" | "Inactive" }
export interface Vehicle { id: string; reg: string; name: string; type: string; status: "Active" | "Inactive" }
export interface Route { id: string; name: string }
export interface Order { id: string; date: string; driverId: string; vehicleId: string; routeId: string; status: "Assigned" | "Completed" | "Picked up" }
export interface FuelEntry { id: string; date: string; driverId: string; vehicleId: string; routeId: string; litres: number; miles: number; cost: number }
export interface GarageEntry { id: string; date: string; vehicleId: string; driverId: string; issueType: string; cost: number }
export interface PayrollEntry { id: string; week: string; date: string; driverId: string; salary: number; bonus: number; advance: number; totalPaid: number }
export interface Settlement { id: string; date: string; vehicleId: string; driverId: string; routeId: string; amount: number }

export interface AppConfig {
  weekStart: string
  fuelUnit: string
  currency: string
  fuelThreshold: string
  garageThreshold: string
  revenueTarget: string
}

export interface UserAccount {
  email: string
  passwordVal: string
  companyName: string
  onboarded: boolean
  currency: string
  role?: "user" | "platform"
  plan?: "Free" | "Premium" | "Enterprise"
  joinedDate?: string
  status?: "Active" | "Suspended"
}

export interface PlatformPayment {
  id: string
  date: string
  companyName: string
  email: string
  amount: number
  plan: "Free" | "Premium" | "Enterprise"
  status: "Paid" | "Pending" | "Refunded" | "Failed"
}

export interface PlatformActivityLog {
  id: string
  date: string
  email: string
  action: string
  level: "info" | "warning" | "danger" | "success"
}

export interface PlatformTicket {
  id: string
  email: string
  companyName: string
  subject: string
  message: string
  status: "Open" | "Resolved"
  date: string
}

export interface PlatformSettings {
  premiumPrice: number
  enterprisePrice: number
  maintenanceMode: boolean
  registrationOpen: boolean
}

type BadgeColor = "green" | "blue" | "red" | "orange" | "slate"

export function Badge({ children, color }: { children: React.ReactNode; color: BadgeColor }) {
  const styles: Record<BadgeColor, string> = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    red: "bg-rose-50 text-rose-700 border-rose-100",
    orange: "bg-amber-50 text-amber-700 border-amber-100",
    slate: "bg-slate-50 text-slate-700 border-slate-200/60",
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${styles[color]}`}>
      {children}
    </span>
  )
}

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger"
  children: React.ReactNode
}

export function Btn({ variant = "primary", children, className = "", ...props }: BtnProps) {
  const base = "px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
  const styles = {
    primary: "bg-[#18181A] hover:bg-zinc-800 text-white shadow-zinc-950/10",
    secondary: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-slate-100/10",
    danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-950/10",
  }
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function FInput({ label, className = "", ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">{label}</label>
      <input
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200/70 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-all focus:bg-white"
        {...props}
      />
    </div>
  )
}

export function FSelect({ label, children, className = "", ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <select
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200/70 rounded-2xl text-sm font-semibold text-slate-850 appearance-none focus:outline-none focus:border-slate-400 focus:bg-white transition-all cursor-pointer"
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  )
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const hasBg = className.includes("bg-")
  return (
    <div className={`${hasBg ? "" : "bg-white"} rounded-3xl p-5 border border-slate-200/60 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select option...",
  disabled = false,
}: {
  label: string
  value: string
  onChange: (val: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  disabled?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedLabel = options.find(o => o.value === value)?.label || ""

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filtered = useMemo(() => {
    return options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
  }, [options, search])

  return (
    <div className="space-y-1.5 relative w-full" ref={containerRef}>
      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) { setIsOpen(!isOpen); setSearch("") } }}
        className={`w-full px-4 py-3 bg-slate-50 border border-slate-200/70 rounded-2xl text-sm font-semibold text-left flex items-center justify-between cursor-pointer focus:outline-none transition-all ${
          isOpen ? "border-slate-400 bg-white" : ""
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className={selectedLabel ? "text-slate-800" : "text-slate-400"}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-185" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-[100%] left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-xl z-50 mt-1.5 overflow-hidden">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-sm font-semibold text-slate-800 focus:outline-none bg-transparent"
            />
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-2.5 text-xs font-semibold text-slate-400 text-center">
                No options found
              </div>
            ) : (
              filtered.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange(o.value); setIsOpen(false) }}
                  className={`w-full text-left px-4 py-2 text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    o.value === value ? "bg-slate-50 text-[#18181A]" : "text-slate-600 hover:bg-slate-50/50 hover:text-slate-800"
                  }`}
                >
                  <span>{o.label}</span>
                  {o.value === value && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function TopBarComponent({ title, subtitle, actions }: {
  title: string
  subtitle: string
  actions?: React.ReactNode
}) {
  return (
    <div className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between z-30 select-none">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">{title}</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function KPI({ label, value, icon: Icon, iconCls, trend }: {
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

export function Table({
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
