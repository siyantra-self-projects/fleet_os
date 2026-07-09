import React, { useState, useMemo } from "react"
import { Receipt, Plus, Trash2, Search } from "lucide-react"
import { Driver, Vehicle, Route, Settlement, Btn, FInput, Card, SearchableSelect, TopBarComponent, fmt, uid, TODAY } from "../components/UI"
import { toast } from "sonner"

export default function SettlementPage({
  drivers,
  vehicles,
  routes,
  settlements,
  setSettlements,
  onMenu,
  currencySymbol,
}: {
  drivers: Driver[]
  vehicles: Vehicle[]
  routes: Route[]
  settlements: Settlement[]
  setSettlements: React.Dispatch<React.SetStateAction<Settlement[]>>
  onMenu: () => void
  currencySymbol: string
}) {
  const [search, setSearch] = useState("")
  const [form, setForm] = useState({ date: TODAY, vehicleId: "", driverId: "", routeId: "", amount: "" })

  const save = () => {
    if (!form.vehicleId || !form.driverId || !form.routeId || !form.amount) {
      toast.error("Please fill all fields")
      return
    }
    const entry: Settlement = {
      id: uid(),
      date: form.date,
      vehicleId: form.vehicleId,
      driverId: form.driverId,
      routeId: form.routeId,
      amount: parseFloat(form.amount),
    }
    setSettlements(prev => [entry, ...prev])
    toast.success("DPD settlement record created")
    setForm({ date: TODAY, vehicleId: "", driverId: "", routeId: "", amount: "" })
  }

  const del = (id: string) => {
    setSettlements(prev => prev.filter(x => x.id !== id))
    toast.success("Settlement record deleted")
  }

  const driverOptions = useMemo(() => drivers.filter(d => d.status === "Active").map(d => ({ value: d.id, label: d.name })), [drivers])
  const vehicleOptions = useMemo(() => vehicles.filter(v => v.status === "Active").map(v => ({ value: v.id, label: `${v.reg} – ${v.name}` })), [vehicles])
  const routeOptions = useMemo(() => routes.map(r => ({ value: r.id, label: r.name })), [routes])

  const totals = useMemo(() => {
    let amt = 0
    settlements.forEach(x => { amt += x.amount })
    return { amount: amt }
  }, [settlements])

  const filtered = useMemo(() => {
    return settlements.filter(x => {
      const driverName = drivers.find(d => d.id === x.driverId)?.name.toLowerCase() ?? ""
      const vehicleReg = vehicles.find(v => v.id === x.vehicleId)?.reg.toLowerCase() ?? ""
      const routeName = routes.find(r => r.id === x.routeId)?.name.toLowerCase() ?? ""
      return driverName.includes(search.toLowerCase()) ||
             vehicleReg.includes(search.toLowerCase()) ||
             routeName.includes(search.toLowerCase())
    })
  }, [settlements, search, drivers, vehicles, routes])

  return (
    <div className="flex-1 overflow-y-auto flex flex-col bg-[#F0F0F0] select-none">
      <TopBarComponent title="DPD Settlements" subtitle="Reconcile dispatch payments and settlements invoices" />

      <div className="p-4 grid grid-cols-1 gap-4">
        <Card className="flex flex-col justify-between max-w-sm bg-[#cfd676] border-[#b9c063]">
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Total Settlements</span>
          <span className="text-xl font-extrabold text-slate-900 mt-1">{fmt(totals.amount, currencySymbol)}</span>
        </Card>
      </div>

      <div className="px-4 pb-4 grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-4 bg-[#18181A] rounded-3xl p-5 border border-zinc-800 shadow-sm space-y-5 text-white">
          <div>
            <h3 className="text-md font-bold text-white font-sans">Record DPD Settlement</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Submit dispatch invoice details</p>
          </div>
          <div className="space-y-4">
            <FInput label="Invoice Date" type="date" dark={true} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <SearchableSelect label="Fleet Vehicle" dark={true} value={form.vehicleId} onChange={v => setForm(f => ({ ...f, vehicleId: v }))} options={vehicleOptions} placeholder="Select Vehicle" />
            <SearchableSelect label="Assigned Driver" dark={true} value={form.driverId} onChange={v => setForm(f => ({ ...f, driverId: v }))} options={driverOptions} placeholder="Select Driver" />
            <SearchableSelect label="Dispatched Route" dark={true} value={form.routeId} onChange={v => setForm(f => ({ ...f, routeId: v }))} options={routeOptions} placeholder="Select Route" />
            <FInput label="Settlement Gross Amount" type="number" step="0.01" dark={true} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <Btn onClick={save} className="w-full pt-2">Log Settlement Invoice</Btn>
        </div>

        <div className="xl:col-span-8 bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-bold text-slate-800 font-sans">Invoices Ledger</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Filter settlements..."
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
                  <th className="py-3">Route</th>
                  <th className="py-3">Gross Amount</th>
                  <th className="py-3 pr-5 text-right rounded-tr-xl">Action</th>
                </tr>
              </thead>
              <tbody className="text-xs font-semibold text-slate-700">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs font-bold text-slate-400 bg-white">No settlement invoices logged.</td>
                  </tr>
                ) : (
                  filtered.map((x, i) => {
                    const v = vehicles.find(y => y.id === x.vehicleId)
                    const d = drivers.find(y => y.id === x.driverId)
                    const r = routes.find(y => y.id === x.routeId)
                    const rowBg = i % 2 === 0 ? "bg-[#cfd676]/10" : "bg-teal-50/40"
                    return (
                      <tr key={x.id} className={`${rowBg} hover:bg-[#cfd676]/20 transition-colors group`}>
                        <td className="py-3.5 pl-5">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-6 rounded-full bg-teal-500" />
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
                            <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-[10px] font-black text-teal-700 border border-teal-200/50">
                              {d ? d.name.charAt(0) : "?"}
                            </div>
                            <span className="font-bold text-slate-850">{d ? d.name : "—"}</span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100 truncate max-w-[170px]" title={r ? r.name : "—"}>
                            {r ? r.name : "—"}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#cfd676]/30 text-slate-900 text-[11px] font-black border border-[#cfd676]/40">
                            {fmt(x.amount, currencySymbol)}
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
