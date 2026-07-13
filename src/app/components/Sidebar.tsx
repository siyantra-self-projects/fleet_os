import React from "react"
import { X, LayoutDashboard, Package, Truck, Fuel, Wrench, Users, Receipt, BarChart3, Bell, Settings, LogOut } from "lucide-react"
import { Page } from "./UI"

export default function Sidebar({ page, setPage, open, setOpen, companyName, userEmail, onLogout, isAdmin, isImpersonating, onExitImpersonate }: {
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
          {/* Platform Console ONLY for platform administrators */}
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
