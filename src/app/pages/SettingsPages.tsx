import React, { useState, useMemo } from "react"
import { Settings, Plus, Trash2, Users, Truck, MapPin } from "lucide-react"
import { Driver, Vehicle, Route, Btn, FInput, FSelect, Badge, Card, TopBarComponent, uid } from "../components/UI"
import { toast } from "sonner"

export default function SettingsPages({
  drivers,
  setDrivers,
  vehicles,
  setVehicles,
  routes,
  setRoutes,
}: {
  drivers: Driver[]
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>
  vehicles: Vehicle[]
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>
  routes: Route[]
  setRoutes: React.Dispatch<React.SetStateAction<Route[]>>
}) {
  const [activeTab, setActiveTab] = useState<"drivers" | "vehicles" | "routes">("drivers")

  // Form states
  const [dForm, setDForm] = useState({ name: "", phone: "", license: "", status: "Active" })
  const [vForm, setVForm] = useState({ reg: "", name: "", type: "18-Ton Lorry", status: "Active" })
  const [rForm, setRForm] = useState({ start: "", end: "" })

  // Save Handlers
  const addDriver = () => {
    if (!dForm.name || !dForm.phone || !dForm.license) { toast.error("Please fill all fields"); return }
    const d: Driver = { id: uid(), name: dForm.name, phone: dForm.phone, license: dForm.license, status: dForm.status as any }
    setDrivers(prev => [...prev, d])
    toast.success("Driver added successfully")
    setDForm({ name: "", phone: "", license: "", status: "Active" })
  }

  const addVehicle = () => {
    if (!vForm.reg || !vForm.name) { toast.error("Please fill all fields"); return }
    const v: Vehicle = { id: uid(), reg: vForm.reg, name: vForm.name, type: vForm.type, status: vForm.status as any }
    setVehicles(prev => [...prev, v])
    toast.success("Vehicle registered successfully")
    setVForm({ reg: "", name: "", type: "18-Ton Lorry", status: "Active" })
  }

  const addRoute = () => {
    if (!rForm.start || !rForm.end) { toast.error("Please fill all fields"); return }
    const r: Route = { id: uid(), name: `${rForm.start} → ${rForm.end}` }
    setRoutes(prev => [...prev, r])
    toast.success("Dispatched route registered")
    setRForm({ start: "", end: "" })
  }

  const delDriver = (id: string) => { setDrivers(prev => prev.filter(x => x.id !== id)); toast.success("Driver deleted") }
  const delVehicle = (id: string) => { setVehicles(prev => prev.filter(x => x.id !== id)); toast.success("Vehicle deleted") }
  const delRoute = (id: string) => { setRoutes(prev => prev.filter(x => x.id !== id)); toast.success("Route deleted") }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col bg-[#F0F0F0] select-none">
      <TopBarComponent title="Global Settings" subtitle="Configure operators, vehicles list and dispatch logistics" />

      {/* Tabs */}
      <div className="px-4 py-2 border-b border-slate-200 bg-white flex items-center gap-1.5 shadow-sm">
        {[
          { key: "drivers", label: "Drivers Ledger", icon: Users },
          { key: "vehicles", label: "Fleet Vehicles", icon: Truck },
          { key: "routes", label: "Routes Dispatch", icon: MapPin },
        ].map(x => {
          const active = activeTab === x.key
          const Icon = x.icon
          return (
            <button
              key={x.key}
              onClick={() => setActiveTab(x.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                active ? "bg-black text-white shadow-md" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{x.label}</span>
            </button>
          )
        })}
      </div>

      <div className="p-4 grid grid-cols-1 xl:grid-cols-12 gap-4 items-start flex-1">
        {/* DRIVERS TAB */}
        {activeTab === "drivers" && (
          <>
            <div className="xl:col-span-4 bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm space-y-5">
              <div>
                <h3 className="text-md font-bold text-slate-800 font-sans">Add Driver</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Submit new driver account</p>
              </div>
              <div className="space-y-4">
                <FInput label="Driver Name" value={dForm.name} onChange={e => setDForm(f => ({ ...f, name: e.target.value }))} />
                <FInput label="Phone Contact" value={dForm.phone} onChange={e => setDForm(f => ({ ...f, phone: e.target.value }))} />
                <FInput label="License Number" value={dForm.license} onChange={e => setDForm(f => ({ ...f, license: e.target.value }))} />
                <FSelect label="Status" value={dForm.status} onChange={e => setDForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="Active">Active Duty</option>
                  <option value="Inactive">Suspended / Inactive</option>
                </FSelect>
              </div>
              <Btn onClick={addDriver} className="w-full pt-2">Add Driver</Btn>
            </div>
            <div className="xl:col-span-8 bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm space-y-4">
              <h3 className="text-md font-bold text-slate-800 font-sans">Drivers Directory</h3>
              <div className="overflow-x-auto -mx-5 border-t border-slate-100">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                      <th className="py-2.5 pl-5">Driver Name</th>
                      <th className="py-2.5">Phone</th>
                      <th className="py-2.5">License</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 pr-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {drivers.map(x => (
                      <tr key={x.id} className="hover:bg-slate-50/40 transition-colors group">
                        <td className="py-3 pl-5 font-extrabold text-slate-800">{x.name}</td>
                        <td className="py-3 text-slate-550">{x.phone}</td>
                        <td className="py-3 font-mono text-slate-500">{x.license}</td>
                        <td className="py-3">
                          <Badge color={x.status === "Active" ? "green" : "red"}>{x.status}</Badge>
                        </td>
                        <td className="py-3 pr-5 text-right">
                          <button onClick={() => delDriver(x.id)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* VEHICLES TAB */}
        {activeTab === "vehicles" && (
          <>
            <div className="xl:col-span-4 bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm space-y-5">
              <div>
                <h3 className="text-md font-bold text-slate-800 font-sans">Add Vehicle</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Register new fleet truck</p>
              </div>
              <div className="space-y-4">
                <FInput label="Registration Number" value={vForm.reg} onChange={e => setVForm(f => ({ ...f, reg: e.target.value }))} />
                <FInput label="Vehicle Name" value={vForm.name} onChange={e => setVForm(f => ({ ...f, name: e.target.value }))} />
                <FSelect label="Category" value={vForm.type} onChange={e => setVForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="18-Ton Lorry">18-Ton Lorry</option>
                  <option value="Cargo Truck">Cargo Truck</option>
                  <option value="Flatbed Trailer">Flatbed Trailer</option>
                  <option value="Delivery Van">Delivery Van</option>
                </FSelect>
                <FSelect label="Status" value={vForm.status} onChange={e => setVForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="Active">Active Fleet</option>
                  <option value="Inactive">Out of Service</option>
                </FSelect>
              </div>
              <Btn onClick={addVehicle} className="w-full pt-2">Log Vehicle</Btn>
            </div>
            <div className="xl:col-span-8 bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm space-y-4">
              <h3 className="text-md font-bold text-slate-800 font-sans">Fleet Inventory</h3>
              <div className="overflow-x-auto -mx-5 border-t border-slate-100">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                      <th className="py-2.5 pl-5">Registration</th>
                      <th className="py-2.5">Vehicle Description</th>
                      <th className="py-2.5">Type</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 pr-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {vehicles.map(x => (
                      <tr key={x.id} className="hover:bg-slate-50/40 transition-colors group">
                        <td className="py-3 pl-5 font-mono font-extrabold text-slate-800">{x.reg}</td>
                        <td className="py-3 font-extrabold">{x.name}</td>
                        <td className="py-3 text-slate-500">{x.type}</td>
                        <td className="py-3">
                          <Badge color={x.status === "Active" ? "green" : "red"}>{x.status}</Badge>
                        </td>
                        <td className="py-3 pr-5 text-right">
                          <button onClick={() => delVehicle(x.id)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ROUTES TAB */}
        {activeTab === "routes" && (
          <>
            <div className="xl:col-span-4 bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm space-y-5">
              <div>
                <h3 className="text-md font-bold text-slate-800 font-sans">Log Dispatch Route</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Define new transit corridors</p>
              </div>
              <div className="space-y-4">
                <FInput label="Origin City" placeholder="e.g. London, UK" value={rForm.start} onChange={e => setRForm(f => ({ ...f, start: e.target.value }))} />
                <FInput label="Destination City" placeholder="e.g. Paris, FR" value={rForm.end} onChange={e => setRForm(f => ({ ...f, end: e.target.value }))} />
              </div>
              <Btn onClick={addRoute} className="w-full pt-2">Add Route</Btn>
            </div>
            <div className="xl:col-span-8 bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm space-y-4">
              <h3 className="text-md font-bold text-slate-800 font-sans">Transit Corridors</h3>
              <div className="overflow-x-auto -mx-5 border-t border-slate-100">
                <table className="w-full text-left border-collapse min-w-[400px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                      <th className="py-2.5 pl-5">Route ID</th>
                      <th className="py-2.5">Corridor Description</th>
                      <th className="py-2.5 pr-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {routes.map(x => (
                      <tr key={x.id} className="hover:bg-slate-50/40 transition-colors group">
                        <td className="py-3 pl-5 font-mono text-slate-500">#{x.id.slice(0, 8)}</td>
                        <td className="py-3 font-extrabold text-slate-850">{x.name}</td>
                        <td className="py-3 pr-5 text-right">
                          <button onClick={() => delRoute(x.id)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
