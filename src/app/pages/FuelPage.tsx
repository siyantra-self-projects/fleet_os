import React, { useState, useMemo } from "react"
import { Fuel, Plus, Trash2, Search } from "lucide-react"
import { Driver, Vehicle, Route, FuelEntry, Btn, FInput, Card, SearchableSelect, TopBarComponent, fmt, uid, TODAY } from "../components/UI"
import { toast } from "sonner"

export default function FuelPage({
  drivers,
  vehicles,
  routes,
  fuel,
  setFuel,
  onMenu,
  currencySymbol,
}: {
  drivers: Driver[]
  vehicles: Vehicle[]
  routes: Route[]
  fuel: FuelEntry[]
  setFuel: React.Dispatch<React.SetStateAction<FuelEntry[]>>
  onMenu: () => void
  currencySymbol: string
}) {
  const [search, setSearch] = useState("")
  const [form, setForm] = useState({ date: TODAY, driverId: "", vehicleId: "", routeId: "", litres: "", miles: "", cost: "" })

  const save = () => {
    if (!form.driverId || !form.vehicleId || !form.routeId || !form.litres || !form.miles || !form.cost) {
      toast.error("Please fill all fields")
      return
    }
    const entry: FuelEntry = {
      id: uid(),
      date: form.date,
      driverId: form.driverId,
      vehicleId: form.vehicleId,
      routeId: form.routeId,
      litres: parseFloat(form.litres),
      miles: parseFloat(form.miles),
      cost: parseFloat(form.cost),
    }
    setFuel(prev => [entry, ...prev])
    toast.success("Fuel record logged successfully")
    setForm({ date: TODAY, driverId: "", vehicleId: "", routeId: "", litres: "", miles: "", cost: "" })
  }

  const del = (id: string) => {
    setFuel(prev => prev.filter(x => x.id !== id))
    toast.success("Fuel record deleted")
  }

  const driverOptions = useMemo(() => drivers.filter(d => d.status === "Active").map(d => ({ value: d.id, label: d.name })), [drivers])
  const vehicleOptions = useMemo(() => vehicles.filter(v => v.status === "Active").map(v => ({ value: v.id, label: `${v.reg} – ${v.name}` })), [vehicles])
  const routeOptions = useMemo(() => routes.map(r => ({ value: r.id, label: r.name })), [routes])

  const totals = useMemo(() => {
    let l = 0, c = 0, m = 0
    fuel.forEach(x => { l += x.litres; c += x.cost; m += x.miles })
    const avgPrice = l > 0 ? c / l : 0
    const avgMpg = l > 0 ? m / (l * 0.22) : 0
    return { litres: l, cost: c, miles: m, avgPrice, avgMpg }
  }, [fuel])

  const filtered = useMemo(() => {
    return fuel.filter(x => {
      const driverName = drivers.find(d => d.id === x.driverId)?.name.toLowerCase() ?? ""
      const vehicleReg = vehicles.find(v => v.id === x.vehicleId)?.reg.toLowerCase() ?? ""
      const routeName = routes.find(r => r.id === x.routeId)?.name.toLowerCase() ?? ""
      return driverName.includes(search.toLowerCase()) ||
             vehicleReg.includes(search.toLowerCase()) ||
             routeName.includes(search.toLowerCase())
    })
  }, [fuel, search, drivers, vehicles, routes])

  return (
    <div className="flex-1 overflow-y-auto flex flex-col bg-[#F0F0F0] select-none">
      <TopBarComponent title="Fuel Management" subtitle="Track refuel entries and mpg efficiencies" />

      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="flex flex-col justify-between bg-[#cfd676] border-[#b9c063]">
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Total Spent</span>
          <span className="text-xl font-extrabold text-slate-900 mt-1">{fmt(totals.cost, currencySymbol)}</span>
        </Card>
        <Card className="flex flex-col justify-between bg-[#cfd676] border-[#b9c063]">
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Litres Filled</span>
          <span className="text-xl font-extrabold text-slate-900 mt-1">{totals.litres.toLocaleString()} L</span>
        </Card>
        <Card className="flex flex-col justify-between bg-[#cfd676] border-[#b9c063]">
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Avg Price/Litre</span>
          <span className="text-xl font-extrabold text-slate-900 mt-1">{fmt(totals.avgPrice, currencySymbol)}</span>
        </Card>
        <Card className="flex flex-col justify-between bg-[#cfd676] border-[#b9c063]">
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Fuel Efficiency</span>
          <span className="text-xl font-extrabold text-slate-900 mt-1">{totals.avgMpg > 0 ? totals.avgMpg.toFixed(1) : "0.0"} MPG</span>
        </Card>
      </div>

      <div className="px-4 pb-4 grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-4 bg-[#18181A] rounded-3xl p-5 border border-zinc-800 shadow-sm space-y-5 text-white">
          <div>
            <h3 className="text-md font-bold text-white font-sans">Log Refuel Entry</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Submit fuel receipt details</p>
          </div>
          <div className="space-y-4">
            <FInput label="Date" type="date" dark={true} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <SearchableSelect label="Driver" dark={true} value={form.driverId} onChange={v => setForm(f => ({ ...f, driverId: v }))} options={driverOptions} placeholder="Select Driver" />
            <SearchableSelect label="Vehicle" dark={true} value={form.vehicleId} onChange={v => setForm(f => ({ ...f, vehicleId: v }))} options={vehicleOptions} placeholder="Select Vehicle" />
            <SearchableSelect label="Route" dark={true} value={form.routeId} onChange={v => setForm(f => ({ ...f, routeId: v }))} options={routeOptions} placeholder="Select Route" />
            <div className="grid grid-cols-3 gap-2">
              <FInput label="Litres" type="number" step="0.01" dark={true} value={form.litres} onChange={e => setForm(f => ({ ...f, litres: e.target.value }))} />
              <FInput label="Miles" type="number" dark={true} value={form.miles} onChange={e => setForm(f => ({ ...f, miles: e.target.value }))} />
              <FInput label="Cost" type="number" step="0.01" dark={true} value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
            </div>
          </div>
          <Btn onClick={save} className="w-full pt-2">Log Receipt</Btn>
        </div>

        <div className="xl:col-span-8 bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-bold text-slate-800 font-sans">Fuel Ledger</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Filter records..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-all w-48"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-wider bg-[#18181A] text-white/70">
                  <th className="py-3 pl-5 rounded-tl-xl">Date</th>
                  <th className="py-3">Vehicle</th>
                  <th className="py-3">Driver</th>
                  <th className="py-3">Litres</th>
                  <th className="py-3">Cost</th>
                  <th className="py-3">MPG</th>
                  <th className="py-3 pr-5 text-right rounded-tr-xl">Action</th>
                </tr>
              </thead>
              <tbody className="text-xs font-semibold text-slate-700">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs font-bold text-slate-400 bg-white">No fuel entries matching the filter.</td>
                  </tr>
                ) : (
                  filtered.map((x, i) => {
                    const v = vehicles.find(y => y.id === x.vehicleId)
                    const d = drivers.find(y => y.id === x.driverId)
                    const efficiency = x.litres > 0 ? x.miles / (x.litres * 0.22) : 0
                    const rowBg = i % 2 === 0 ? "bg-emerald-50/60" : "bg-amber-50/50"
                    return (
                      <tr key={x.id} className={`${rowBg} hover:bg-[#cfd676]/20 transition-colors group`}>
                        <td className="py-3.5 pl-5">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-6 rounded-full bg-[#cfd676]" />
                            <span className="font-bold text-slate-600">{new Date(x.date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short' })}</span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <div className="leading-tight">
                            <p className="font-extrabold text-slate-800">{v ? v.name : "—"}</p>
                            <p className="text-[9px] font-black text-slate-400 mt-0.5">{v ? v.reg : "—"}</p>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#cfd676]/40 flex items-center justify-center text-[10px] font-black text-slate-700 border border-[#cfd676]/50">
                              {d ? d.name.charAt(0) : "?"}
                            </div>
                            <span className="font-bold text-slate-800">{d ? d.name : "—"}</span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-[10px] font-black">{x.litres} L</span>
                        </td>
                        <td className="py-3.5 font-mono font-extrabold text-slate-900">{fmt(x.cost, currencySymbol)}</td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black ${efficiency >= 14 ? "bg-emerald-100 text-emerald-700" : efficiency >= 12 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                            {efficiency > 0 ? efficiency.toFixed(1) : "—"}
                          </span>
                        </td>
                        <td className="py-3.5 pr-5 text-right">
                          <button onClick={() => del(x.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full border border-transparent hover:border-rose-200 transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
