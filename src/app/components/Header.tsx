import React, { useState } from "react"
import { LayoutDashboard, Truck, Fuel, Wrench, Receipt, Bell, Settings, LogOut, ChevronDown, ChevronRight, Package, BarChart3 } from "lucide-react"
import { Page } from "./UI"

export default function Header({
  page,
  setPage,
  companyName,
  userEmail,
  onLogout,
  isAdmin,
  isImpersonating,
  onExitImpersonate,
}: {
  page: Page
  setPage: (p: Page) => void
  companyName: string
  userEmail: string
  onLogout: () => void
  isAdmin: boolean
  isImpersonating: boolean
  onExitImpersonate: () => void
}) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [walletOpen, setWalletOpen] = useState(false)

  return (
    <header className="bg-white border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between z-40 sticky top-0 shadow-xs select-none">
      {/* Left: Logo */}
      <div className="flex items-center gap-2 select-none cursor-pointer" onClick={() => setPage("dashboard")}>
        <div className="w-8 h-8 bg-[#18181A] rounded-lg flex items-center justify-center text-white font-black text-lg font-mono">
          F
        </div>
        <span className="font-extrabold text-lg text-[#18181A] tracking-tight">FleetOps</span>
      </div>

      {/* Middle: Navigation Pills */}
      <div className="flex items-center bg-slate-100 p-1.5 rounded-3xl border border-slate-200/60 shadow-inner gap-1">
        {/* Dashboard button */}
        <button
          onClick={() => setPage("dashboard")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[13px] font-extrabold transition-all duration-205 cursor-pointer ${
            page === "dashboard"
              ? "bg-[#18181A] text-white shadow-md"
              : "text-slate-500 hover:text-[#18181A] hover:bg-white/50"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        {/* Orders button */}
        <button
          onClick={() => setPage("orders")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[13px] font-extrabold transition-all duration-205 cursor-pointer ${
            page === "orders"
              ? "bg-[#18181A] text-white shadow-md"
              : "text-slate-500 hover:text-[#18181A] hover:bg-white/50"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Orders</span>
        </button>

        {/* Tracking button */}
        <button
          onClick={() => setPage("tracking")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[13px] font-extrabold transition-all duration-205 cursor-pointer ${
            page === "tracking"
              ? "bg-[#18181A] text-white shadow-md"
              : "text-slate-500 hover:text-[#18181A] hover:bg-white/50"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Tracking</span>
        </button>

        {/* Fuel Entry button */}
        <button
          onClick={() => setPage("fuel")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[13px] font-extrabold transition-all duration-205 cursor-pointer ${
            page === "fuel"
              ? "bg-[#18181A] text-white shadow-md"
              : "text-slate-500 hover:text-[#18181A] hover:bg-white/50"
          }`}
        >
          <Fuel className="w-4 h-4" />
          <span>Fuel Entry</span>
        </button>

        {/* Garage Expense button */}
        <button
          onClick={() => setPage("garage")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[13px] font-extrabold transition-all duration-205 cursor-pointer ${
            page === "garage"
              ? "bg-[#18181A] text-white shadow-md"
              : "text-slate-500 hover:text-[#18181A] hover:bg-white/50"
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Garage Expense</span>
        </button>

        {/* Wallet Dropdown button */}
        <div className="relative">
          <button
            onClick={() => setWalletOpen(!walletOpen)}
            onBlur={() => setTimeout(() => setWalletOpen(false), 200)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[13px] font-extrabold transition-all duration-205 cursor-pointer ${
              page === "payroll" || page === "settlement"
                ? "bg-[#18181A] text-white shadow-md"
                : "text-slate-500 hover:text-[#18181A] hover:bg-white/50"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Finance & Ledger</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
          {walletOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50">
              <button
                onMouseDown={() => setPage("payroll")}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-bold cursor-pointer"
              >
                Driver Payroll
              </button>
              <button
                onMouseDown={() => setPage("settlement")}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-bold cursor-pointer"
              >
                DPD Settlement
              </button>
            </div>
          )}
        </div>

        {/* Financial Summary button */}
        <button
          onClick={() => setPage("financial")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[13px] font-extrabold transition-all duration-205 cursor-pointer ${
            page === "financial"
              ? "bg-[#18181A] text-white shadow-md"
              : "text-slate-500 hover:text-[#18181A] hover:bg-white/50"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Financial Summary</span>
        </button>
      </div>

      {/* Right: Notifications & Profile */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          onClick={() => setPage("alerts")}
          className={`w-9 h-9 bg-white border rounded-full flex items-center justify-center text-slate-600 hover:text-[#18181A] hover:bg-slate-50 transition-all cursor-pointer relative ${
            page === "alerts" ? "border-slate-400 bg-slate-50" : "border-slate-200/80"
          }`}
          title="Alerts Feed"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
        </button>

        {/* Profile Widget */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            onBlur={() => setTimeout(() => setProfileOpen(false), 200)}
            className="flex items-center gap-2.5 pl-2.5 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-full transition-all cursor-pointer select-none"
          >
            <div className="w-6.5 h-6.5 bg-[#18181A] rounded-full flex items-center justify-center text-white font-extrabold text-[10px]">
              {companyName.slice(0, 1).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[11px] font-black text-slate-800 leading-tight">{companyName}</p>
              <p className="text-[9px] font-bold text-slate-400 mt-0.5">{isAdmin ? "Admin" : "Operator"}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute top-[100%] right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">User Account</p>
                <p className="text-xs font-bold text-slate-700 truncate mt-0.5">{userEmail}</p>
              </div>

              <div className="py-1">
                <button
                  onMouseDown={() => setPage("settings-drivers")}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 cursor-pointer flex items-center gap-2"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings & Setup</span>
                </button>
                {isImpersonating && (
                  <button
                    onMouseDown={onExitImpersonate}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 cursor-pointer flex items-center gap-2"
                  >
                    <span>Exit Auditing</span>
                  </button>
                )}
                <button
                  onMouseDown={onLogout}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer border-t border-slate-100 mt-1 pt-2 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
