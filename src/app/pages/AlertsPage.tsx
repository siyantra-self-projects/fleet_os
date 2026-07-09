import React, { useState, useMemo } from "react"
import { Bell, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { Driver, Vehicle, FuelEntry, GarageEntry, Order, AppConfig, Card, TopBarComponent, Badge, Btn, FInput } from "../components/UI"
import { toast } from "sonner"

export default function AlertsPage({
  drivers,
  vehicles,
  fuel,
  garage,
  orders,
  currencySymbol,
  cfg,
}: {
  drivers: Driver[]
  vehicles: Vehicle[]
  fuel: FuelEntry[]
  garage: GarageEntry[]
  orders: Order[]
  onMenu: () => void
  currencySymbol: string
  cfg: AppConfig
}) {
  const fmt = (val: number, symbol: string) => {
    return symbol + val.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }

  const [resolvedIds, setResolvedIds] = useState<string[]>([])
  const [thresholds, setThresholds] = useState({
    fuel: cfg.fuelThreshold || "100",
    garage: cfg.garageThreshold || "500",
  })

  const saveThresholds = () => {
    toast.success("Alert thresholds updated successfully")
  }

  // Compute active system warnings
  const systemAlerts = useMemo(() => {
    const arr: { id: string; type: "critical" | "warning" | "info"; msg: string; date: string }[] = []

    // 1. Garage Cost warning
    garage.forEach(x => {
      const v = vehicles.find(y => y.id === x.vehicleId)
      const limit = parseFloat(thresholds.garage)
      if (x.cost > limit) {
        arr.push({
          id: `g-${x.id}`,
          type: "critical",
          msg: `High repair spend on ${v ? v.name : "Vehicle"} (${v ? v.reg : ""}): ${x.issueType} cost was ${fmt(x.cost, currencySymbol)} (threshold: ${fmt(limit, currencySymbol)})`,
          date: x.date,
        })
      }
    })

    // 2. Fuel Capacity warnings
    fuel.forEach(x => {
      const v = vehicles.find(y => y.id === x.vehicleId)
      const limit = parseFloat(thresholds.fuel)
      if (x.litres > limit) {
        arr.push({
          id: `f-${x.id}`,
          type: "warning",
          msg: `Large refuel logged on ${v ? v.name : "Vehicle"} : ${x.litres} Litres (threshold: ${limit}L)`,
          date: x.date,
        })
      }
    })

    // 3. Unassigned Orders info
    const unassignedCount = orders.filter(o => !o.driverId).length
    if (unassignedCount > 0) {
      arr.push({
        id: "orders-unassigned",
        type: "info",
        msg: `You have ${unassignedCount} logistics orders awaiting driver and vehicle dispatch assignment.`,
        date: new Date().toISOString().split("T")[0],
      })
    }

    return arr.filter(x => !resolvedIds.includes(x.id))
  }, [fuel, garage, orders, vehicles, thresholds, currencySymbol, resolvedIds])

  const resolve = (id: string) => {
    setResolvedIds(prev => [...prev, id])
    toast.success("Notification dismissed")
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col bg-[#F0F0F0] select-none">
      <TopBarComponent title="Notifications & Alerts" subtitle="Track critical thresholds and dispatch notifications" />

      <div className="p-4 grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* Left: Threshold configurations */}
        <div className="xl:col-span-4 bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm space-y-5">
          <div>
            <h3 className="text-md font-bold text-slate-800 font-sans">Alert Configurator</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Customize threshold limits</p>
          </div>
          <div className="space-y-4">
            <FInput label="Fuel Volume Limit (L)" type="number" value={thresholds.fuel} onChange={e => setForm(f => ({ ...f, fuel: e.target.value }) as any || thresholds) || setThresholds(t => ({ ...t, fuel: e.target.value }))} />
            <FInput label="Garage Spend Limit (£)" type="number" value={thresholds.garage} onChange={e => setThresholds(t => ({ ...t, garage: e.target.value }))} />
          </div>
          <Btn onClick={saveThresholds} className="w-full pt-2">Save Parameters</Btn>
        </div>

        {/* Right: Notifications Feed */}
        <div className="xl:col-span-8 bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-bold text-slate-800 font-sans">Active Notifications</h3>
            <Badge color="slate">{systemAlerts.length} Messages</Badge>
          </div>

          <div className="space-y-3 pt-2">
            {systemAlerts.length === 0 ? (
              <div className="py-16 text-center text-xs font-bold text-slate-400 bg-white">
                🎉 No active system alerts or threshold warnings.
              </div>
            ) : (
              systemAlerts.map(x => (
                <div key={x.id} className="p-4 rounded-2xl border border-slate-100 flex items-start justify-between gap-4 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                  <div className="flex gap-3">
                    <span className="mt-0.5">
                      {x.type === "critical" && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                      {x.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                      {x.type === "info" && <Info className="w-4 h-4 text-blue-500" />}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-700 leading-relaxed">{x.msg}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1.5">
                        Logged: {new Date(x.date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => resolve(x.id)} className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-black uppercase text-slate-600 transition-all cursor-pointer">
                    Dismiss
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
