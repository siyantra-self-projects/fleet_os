import React, { useState, useMemo } from "react"
import { Wrench, Plus, Trash2, Search, Download, ArrowUpDown } from "lucide-react"
import { Driver, Vehicle, GarageEntry, Btn, FInput, FSelect, Badge, Card, SearchableSelect, TopBarComponent, fmt, uid, TODAY } from "../components/UI"
import { toast } from "sonner"

type SortField = "date" | "cost" | "type"
type SortDirection = "asc" | "desc"

export default function GaragePage({
  drivers,
  vehicles,
  garage,
  setGarage,
  onMenu,
  currencySymbol,
}: {
  drivers: Driver[]
  vehicles: Vehicle[]
  garage: GarageEntry[]
  setGarage: React.Dispatch<React.SetStateAction<GarageEntry[]>>
  onMenu: () => void
  currencySymbol: string
}) {
  const [search, setSearch] = useState("")
  const [form, setForm] = useState({ date: TODAY, vehicleId: "", driverId: "", issueType: "Service", cost: "" })
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const save = () => {
    if (!form.vehicleId || !form.driverId || !form.cost) {
      toast.error("Please fill all fields")
      return
    }
    const entry: GarageEntry = {
      id: uid(),
      date: form.date,
      vehicleId: form.vehicleId,
      driverId: form.driverId,
      issueType: form.issueType,
      cost: parseFloat(form.cost),
    }
    setGarage(prev => [entry, ...prev])
    toast.success("Garage record saved successfully")
    setForm({ date: TODAY, vehicleId: "", driverId: "", issueType: "Service", cost: "" })
  }

  const del = (id: string) => {
    setGarage(prev => prev.filter(x => x.id !== id))
    toast.success("Garage entry deleted")
  }

  const handleExport = () => {
    try {
      const headers = ["Date", "Vehicle", "Driver", "Issue Type", "Cost"]
      const csvRows = [headers.join(",")]
      
      filtered.forEach(x => {
        const v = vehicles.find(y => y.id === x.vehicleId)
        const d = drivers.find(y => y.id === x.driverId)
        csvRows.push([
          x.date,
          v ? v.name : "N/A",
          d ? d.name : "N/A",
          x.issueType,
          x.cost
        ].join(","))
      })
      
      const csvString = csvRows.join("\n")
      const blob = new Blob([csvString], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `garage_records_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success(`Exported ${filtered.length} garage records`)
    } catch (error) {
      toast.error("Export failed")
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const driverOptions = useMemo(() => drivers.filter(d => d.status === "Active").map(d => ({ value: d.id, label: d.name })), [drivers])
  const vehicleOptions = useMemo(() => vehicles.filter(v => v.status === "Active").map(v => ({ value: v.id, label: `${v.reg} – ${v.name}` })), [vehicles])

  const totals = useMemo(() => {
    let cost = 0
    garage.forEach(x => { cost += x.cost })
    const activeJobs = garage.length
    const avgCost = activeJobs > 0 ? cost / activeJobs : 0
    return { cost, activeJobs, avgCost }
  }, [garage])

  const filtered = useMemo(() => {
    let result = garage.filter(x => {
      const driverName = drivers.find(d => d.id === x.driverId)?.name.toLowerCase() ?? ""
      const vehicleReg = vehicles.find(v => v.id === x.vehicleId)?.reg.toLowerCase() ?? ""
      const issue = x.issueType.toLowerCase()
      return driverName.includes(search.toLowerCase()) ||
             vehicleReg.includes(search.toLowerCase()) ||
             issue.includes(search.toLowerCase())
    })

    // Sort
    result.sort((a, b) => {
      let aVal, bVal
      if (sortField === "date") {
        aVal = new Date(a.date).getTime()
        bVal = new Date(b.date).getTime()
      } else if (sortField === "cost") {
        aVal = a.cost
        bVal = b.cost
      } else if (sortField === "type") {
        aVal = a.issueType
        bVal = b.issueType
      }
      if (typeof aVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal)
      }
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal
    })

    return result
  }, [garage, search, drivers, vehicles, sortField, sortDirection])

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)

  const getBadgeColor = (type: string) => {
    if (type === "Repair") return "red"
    if (type === "Service") return "blue"
    if (type === "Tires") return "orange"
    if (type === "Inspection" || type === "MOT") return "green"
    return "slate"
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col bg-[#F0F0F0] select-none">
      <TopBarComponent title="Garage & Maintenance" subtitle="Track fleet repairs and scheduling costs" />

      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex flex-col justify-between bg-[#cfd676] border-[#b9c063]">
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Total Garage Spend</span>
          <span className="text-xl font-extrabold text-slate-900 mt-1">{fmt(totals.cost, currencySymbol)}</span>
        </Card>
        <Card className="flex flex-col justify-between bg-[#cfd676] border-[#b9c063]">
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Maintenance Visits</span>
          <span className="text-xl font-extrabold text-slate-900 mt-1">{totals.activeJobs} Jobs</span>
        </Card>
        <Card className="flex flex-col justify-between bg-[#cfd676] border-[#b9c063]">
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Avg Cost/Visit</span>
          <span className="text-xl font-extrabold text-slate-900 mt-1">{fmt(totals.avgCost, currencySymbol)}</span>
        </Card>
      </div>

      <div className="px-4 pb-4 grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-4 bg-[#18181A] rounded-3xl p-5 border border-zinc-800 shadow-sm space-y-5 text-white">
          <div>
            <h3 className="text-md font-bold text-white font-sans">Schedule Service / Repair</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Submit maintenance logs</p>
          </div>
          <div className="space-y-4">
            <FInput label="Log Date" type="date" dark={true} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <SearchableSelect label="Vehicle needing service" dark={true} value={form.vehicleId} onChange={v => setForm(f => ({ ...f, vehicleId: v }))} options={vehicleOptions} placeholder="Select Fleet Vehicle" />
            <SearchableSelect label="Assigned Driver" dark={true} value={form.driverId} onChange={v => setForm(f => ({ ...f, driverId: v }))} options={driverOptions} placeholder="Select Driver" />
            <FSelect label="Service Type" dark={true} value={form.issueType} onChange={e => setForm(f => ({ ...f, issueType: e.target.value }))}>
              <option value="Service">Regular Service</option>
              <option value="Repair">Emergency Repair</option>
              <option value="MOT">MOT / Test</option>
              <option value="Inspection">Safety Inspection</option>
              <option value="Tires">Tire Replacement</option>
              <option value="Bodywork">Bodywork repair</option>
            </FSelect>
            <FInput label="Repair Cost" type="number" step="0.01" dark={true} value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
          </div>
          <Btn onClick={save} className="w-full pt-2">Log Service Entry</Btn>
        </div>

        <div className="xl:col-span-8 bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-bold text-slate-800 font-sans">Maintenance Ledger</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-all w-48"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#cfd676] hover:bg-[#b9c063] border border-[#b9c063] rounded-xl text-xs font-bold text-slate-900 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-wider bg-[#18181A] text-white/70">
                  <th className="py-3 pl-5 rounded-tl-xl cursor-pointer hover:bg-zinc-800 transition-colors" onClick={() => handleSort("date")}>
                    <div className="flex items-center gap-1">
                      Date
                      {sortField === "date" && <ArrowUpDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th className="py-3">Vehicle</th>
                  <th className="py-3">Driver</th>
                  <th className="py-3 cursor-pointer hover:bg-zinc-800 transition-colors" onClick={() => handleSort("type")}>
                    <div className="flex items-center gap-1">
                      Issue / Category
                      {sortField === "type" && <ArrowUpDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th className="py-3 cursor-pointer hover:bg-zinc-800 transition-colors" onClick={() => handleSort("cost")}>
                    <div className="flex items-center gap-1">
                      Cost
                      {sortField === "cost" && <ArrowUpDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th className="py-3 pr-5 text-right rounded-tr-xl">Action</th>
                </tr>
              </thead>
              <tbody className="text-xs font-semibold text-slate-700">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs font-bold text-slate-400 bg-white">No maintenance records logged.</td>
                  </tr>
                ) : (
                  paginatedData.map((x, i) => {
                    const v = vehicles.find(y => y.id === x.vehicleId)
                    const d = drivers.find(y => y.id === x.driverId)
                    const rowBg = i % 2 === 0 ? "bg-rose-50/40" : "bg-violet-50/40"
                    const accentColor = x.issueType === "Service" ? "bg-emerald-500" : x.issueType === "Repair" ? "bg-rose-500" : x.issueType === "Tyre" || x.issueType === "Tires" ? "bg-amber-500" : "bg-violet-500"
                    return (
                      <tr key={x.id} className={`${rowBg} hover:bg-[#cfd676]/20 transition-colors group`}>
                        <td className="py-3.5 pl-5">
                          <div className="flex items-center gap-2">
                            <div className={`w-1 h-6 rounded-full ${accentColor}`} />
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
                            <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-[10px] font-black text-violet-700 border border-violet-200/50">
                              {d ? d.name.charAt(0) : "?"}
                            </div>
                            <span className="font-bold text-slate-800">{d ? d.name : "—"}</span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <Badge color={getBadgeColor(x.issueType) as any}>{x.issueType}</Badge>
                        </td>
                        <td className="py-3.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-black border border-rose-100">
                            {fmt(x.cost, currencySymbol)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 font-semibold">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} entries
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold text-slate-700 transition-all"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page
                  if (totalPages <= 5) {
                    page = i + 1
                  } else if (currentPage <= 3) {
                    page = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i
                  } else {
                    page = currentPage - 2 + i
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        currentPage === page
                          ? "bg-[#cfd676] text-slate-900"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold text-slate-700 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
