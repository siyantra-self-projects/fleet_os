import React, { useState, useMemo } from "react"
import { Package, Plus, Edit2, Trash2, CheckCircle, Search, MapPin, ChevronRight } from "lucide-react"
import { Driver, Vehicle, Route, Order, Btn, FInput, Card, SearchableSelect, TopBarComponent, uid, TODAY } from "../components/UI"
import { toast } from "sonner"

export default function OrdersPage({
  drivers,
  vehicles,
  routes,
  orders,
  setOrders,
  onMenu,
}: {
  drivers: Driver[]
  vehicles: Vehicle[]
  routes: Route[]
  orders: Order[]
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>
  onMenu: () => void
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"All" | "Pending" | "Assigned" | "Completed">("All")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ date: TODAY, driverId: "", vehicleId: "", routeId: "" })

  const save = () => {
    if (!form.driverId || !form.vehicleId || !form.routeId) {
      toast.error("Please fill all fields")
      return
    }

    if (editingId) {
      setOrders(prev => prev.map(o => o.id === editingId ? { ...o, ...form } : o))
      toast.success("Order updated successfully")
    } else {
      setOrders(prev => [{ ...form, id: uid(), status: "Assigned" as const }, ...prev])
      toast.success("Order created successfully")
    }

    setForm({ date: TODAY, driverId: "", vehicleId: "", routeId: "" })
    setEditingId(null)
  }

  const edit = (o: Order) => {
    setForm({ date: o.date, driverId: o.driverId, vehicleId: o.vehicleId, routeId: o.routeId })
    setEditingId(o.id)
  }

  const toggleStatus = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id
      ? { ...o, status: o.status === "Assigned" ? "Completed" : o.status === "Completed" ? "Picked up" : "Assigned" }
      : o))
    toast.success("Status updated")
  }

  const del = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id))
    toast.success("Order deleted")
  }

  const driverOptions = useMemo(() => drivers.filter(d => d.status === "Active").map(d => ({ value: d.id, label: d.name })), [drivers])
  const vehicleOptions = useMemo(() => vehicles.filter(v => v.status === "Active").map(v => ({ value: v.id, label: `${v.reg} – ${v.name}` })), [vehicles])
  const routeOptions = useMemo(() => routes.map(r => ({ value: r.id, label: r.name })), [routes])

  const getFlag = (cityStr: string) => {
    const parts = cityStr.split(", ")
    const code = parts.length > 1 ? parts[1] : ""
    if (code === "DE") return "🇩🇪"
    if (code === "NL") return "🇳🇱"
    if (code === "PL") return "🇵🇱"
    if (code === "AT") return "🇦🇹"
    if (code === "CZ") return "🇨🇿"
    if (code === "CH") return "🇨🇭"
    if (code === "ES") return "🇪🇸"
    if (code === "FR") return "🇫🇷"
    if (code === "SE") return "🇸🇪"
    if (code === "FI") return "🇫🇮"
    if (code === "IS") return "🇮🇸"
    if (code === "EE") return "🇪🇪"
    return "📍"
  }

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const driverName = drivers.find(d => d.id === o.driverId)?.name.toLowerCase() ?? ""
      const vehicleReg = vehicles.find(v => v.id === o.vehicleId)?.reg.toLowerCase() ?? ""
      const routeName = routes.find(r => r.id === o.routeId)?.name.toLowerCase() ?? ""
      const matchesSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            driverName.includes(searchTerm.toLowerCase()) ||
                            vehicleReg.includes(searchTerm.toLowerCase()) ||
                            routeName.includes(searchTerm.toLowerCase())

      if (!matchesSearch) return false

      if (activeTab === "All") return true
      if (activeTab === "Pending") return o.status === "Picked up"
      if (activeTab === "Assigned") return o.status === "Assigned"
      if (activeTab === "Completed") return o.status === "Completed"
      return true
    })
  }, [orders, searchTerm, activeTab, drivers, vehicles, routes])

  return (
    <div className="flex-1 overflow-y-auto flex flex-col bg-[#F0F0F0] select-none">
      <TopBarComponent title="Orders Hub" subtitle="Create, edit, and dispatch logistics shipments" />

      <div className="p-4 grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-4 bg-[#18181A] rounded-3xl p-5 border border-zinc-800 shadow-sm space-y-5 text-white">
          <div>
            <h3 className="text-md font-bold text-white font-sans">
              {editingId ? "Edit Shipment" : "Create New Shipment"}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Define order criteria and driver dispatch</p>
          </div>

          <div className="space-y-4">
            <FInput
              label="Order Date"
              type="date"
              dark={true}
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
            <SearchableSelect
              label="Driver"
              dark={true}
              value={form.driverId}
              onChange={val => setForm(f => ({ ...f, driverId: val }))}
              options={driverOptions}
              placeholder="Assign Driver"
            />
            <SearchableSelect
              label="Vehicle"
              dark={true}
              value={form.vehicleId}
              onChange={val => setForm(f => ({ ...f, vehicleId: val }))}
              options={vehicleOptions}
              placeholder="Assign Fleet Vehicle"
            />
            <SearchableSelect
              label="Route"
              dark={true}
              value={form.routeId}
              onChange={val => setForm(f => ({ ...f, routeId: val }))}
              options={routeOptions}
              placeholder="Select Route"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Btn onClick={save} className="flex-1">
              {editingId ? "Save Changes" : "Create Order"}
            </Btn>
            {editingId && (
              <Btn variant="secondary" onClick={() => { setEditingId(null); setForm({ date: TODAY, driverId: "", vehicleId: "", routeId: "" }) }}>
                Cancel
              </Btn>
            )}
          </div>
        </div>

        <div className="xl:col-span-8 bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-md font-bold text-slate-800 font-sans">Orders Ledger</h3>
              <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 rounded-full text-slate-500">{orders.length}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search order..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-40 sm:w-48 pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-all"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              </div>

              <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-xl">
                {["All", "Pending", "Assigned", "Completed"].map(tab => {
                  const active = activeTab === tab
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        active ? "bg-black text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {tab}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto -mx-5 border-t border-slate-100">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider select-none bg-white">
                  <th className="py-3 pl-5">ORDER ID</th>
                  <th className="py-3">DRIVER</th>
                  <th className="py-3">ROUTE</th>
                  <th className="py-3">VEHICLE</th>
                  <th className="py-3">DATE</th>
                  <th className="py-3">STATUS</th>
                  <th className="py-3 pr-5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs font-bold text-slate-400 bg-white">
                      No orders found matching the filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(o => {
                    const driver = drivers.find(d => d.id === o.driverId)
                    const vehicle = vehicles.find(v => v.id === o.vehicleId)
                    const route = routes.find(r => r.id === o.routeId)
                    const routeName = route ? route.name : "Start → Destination"
                    const parts = routeName.split(" → ")
                    const startCity = parts[0]
                    const endCity = parts[1] || "Destination"
                    const startFlag = getFlag(startCity)
                    const endFlag = getFlag(endCity)

                    const rowBg = o.status === "Completed"
                      ? "bg-emerald-50 hover:bg-emerald-100/80"
                      : o.status === "Picked up"
                      ? "bg-slate-50 hover:bg-slate-100/80"
                      : "bg-amber-50 hover:bg-amber-100/80"

                    return (
                      <tr key={o.id} className={`${rowBg} transition-colors group`}>
                        <td className="py-3.5 pl-5">
                          <span className="font-mono text-xs font-extrabold text-slate-900">
                            #{o.id.slice(0, 8)}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-slate-800 text-[10px] font-black border border-slate-200/60">
                              {driver ? driver.name.split(" ").map(n => n[0]).join("") : "—"}
                            </div>
                            <span className="font-bold text-xs text-slate-800">{driver ? driver.name : "—"}</span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center text-xs font-semibold">
                            <div className="w-1.5 h-7 border-l border-t border-b border-slate-300/60 rounded-l mr-2 shrink-0 mt-0.5" />
                            <div className="leading-tight text-slate-700 space-y-0.5">
                              <div className="flex items-center gap-1 font-extrabold">
                                <span>{startFlag}</span>
                                <span>{startCity}</span>
                              </div>
                              <div className="flex items-center gap-1 font-extrabold">
                                <span>{endFlag}</span>
                                <span>{endCity}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <div className="leading-tight">
                            <p className="font-extrabold text-xs text-slate-800">{vehicle ? vehicle.name : "—"}</p>
                            <p className="text-[9px] font-black text-slate-400 mt-0.5">{vehicle ? vehicle.reg : "—"}</p>
                          </div>
                        </td>
                        <td className="py-3.5 font-bold text-xs text-slate-500">
                          {new Date(o.date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                              o.status === "Completed" ? "bg-emerald-500" :
                              o.status === "Picked up" ? "bg-slate-400" : "bg-amber-500"
                            }`} />
                            <span className="font-bold text-xs text-slate-700">
                              {o.status === "Completed" ? "Delivered" :
                               o.status === "Picked up" ? "Picked up" : "In transit"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 pr-5 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => toggleStatus(o.id)}
                              title="Advance Status"
                              className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200/50 rounded-full text-slate-500 transition-all cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => edit(o)}
                              title="Edit Order"
                              className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200/50 rounded-full text-slate-500 transition-all cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => del(o.id)}
                              title="Delete Order"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200/50 rounded-full text-rose-500 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
