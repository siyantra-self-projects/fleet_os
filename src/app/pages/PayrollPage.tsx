import React, { useState, useMemo } from "react"
import { Users, Plus, Trash2, Search } from "lucide-react"
import { Driver, PayrollEntry, Btn, FInput, Card, SearchableSelect, TopBarComponent, fmt, uid, TODAY } from "../components/UI"
import { toast } from "sonner"

export default function PayrollPage({
  drivers,
  payroll,
  setPayroll,
  onMenu,
  currencySymbol,
}: {
  drivers: Driver[]
  payroll: PayrollEntry[]
  setPayroll: React.Dispatch<React.SetStateAction<PayrollEntry[]>>
  onMenu: () => void
  currencySymbol: string
}) {
  const [search, setSearch] = useState("")
  const [form, setForm] = useState({ week: "W40", date: TODAY, driverId: "", salary: "", bonus: "", advance: "" })

  const save = () => {
    if (!form.driverId || !form.salary) {
      toast.error("Please fill all fields")
      return
    }
    const sal = parseFloat(form.salary)
    const bon = parseFloat(form.bonus || "0")
    const adv = parseFloat(form.advance || "0")
    const entry: PayrollEntry = {
      id: uid(),
      week: form.week,
      date: form.date,
      driverId: form.driverId,
      salary: sal,
      bonus: bon,
      advance: adv,
      totalPaid: sal + bon - adv,
    }
    setPayroll(prev => [entry, ...prev])
    toast.success("Payroll disbursed logged")
    setForm({ week: "W40", date: TODAY, driverId: "", salary: "", bonus: "", advance: "" })
  }

  const del = (id: string) => {
    setPayroll(prev => prev.filter(x => x.id !== id))
    toast.success("Payroll entry deleted")
  }

  const driverOptions = useMemo(() => drivers.filter(d => d.status === "Active").map(d => ({ value: d.id, label: d.name })), [drivers])

  const totals = useMemo(() => {
    let disbursed = 0
    payroll.forEach(x => { disbursed += x.totalPaid })
    return { disbursed }
  }, [payroll])

  const filtered = useMemo(() => {
    return payroll.filter(x => {
      const driverName = drivers.find(d => d.id === x.driverId)?.name.toLowerCase() ?? ""
      return driverName.includes(search.toLowerCase()) || x.week.toLowerCase().includes(search.toLowerCase())
    })
  }, [payroll, search, drivers])

  return (
    <div className="flex-1 overflow-y-auto flex flex-col bg-[#F0F0F0] select-none">
      <TopBarComponent title="Driver Payroll" subtitle="Track wages, bonuses, and driver statements" />

      <div className="p-4 grid grid-cols-1 gap-4">
        <Card className="flex flex-col justify-between max-w-sm bg-[#cfd676] border-[#b9c063]">
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Total Disbursed Wages</span>
          <span className="text-xl font-extrabold text-slate-900 mt-1">{fmt(totals.disbursed, currencySymbol)}</span>
        </Card>
      </div>

      <div className="px-4 pb-4 grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-4 bg-[#18181A] rounded-3xl p-5 border border-zinc-800 shadow-sm space-y-5 text-white">
          <div>
            <h3 className="text-md font-bold text-white font-sans">Disburse Driver Wage</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Submit payroll details</p>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <FInput label="Payroll Week" placeholder="W40" dark={true} value={form.week} onChange={e => setForm(f => ({ ...f, week: e.target.value }))} />
              <FInput label="Payment Date" type="date" dark={true} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <SearchableSelect label="Select Driver" dark={true} value={form.driverId} onChange={v => setForm(f => ({ ...f, driverId: v }))} options={driverOptions} placeholder="Select Driver" />
            <FInput label="Base Salary" type="number" step="0.01" dark={true} value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <FInput label="Bonus" type="number" step="0.01" dark={true} value={form.bonus} onChange={e => setForm(f => ({ ...f, bonus: e.target.value }))} />
              <FInput label="Advance / Deduction" type="number" step="0.01" dark={true} value={form.advance} onChange={e => setForm(f => ({ ...f, advance: e.target.value }))} />
            </div>
          </div>
          <Btn onClick={save} className="w-full pt-2">Disburse Wage</Btn>
        </div>

        <div className="xl:col-span-8 bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-bold text-slate-800 font-sans">Payroll Ledger</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Filter payroll..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-all w-48"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-wider bg-[#18181A] text-white/70">
                  <th className="py-3 pl-5 rounded-tl-xl">Week</th>
                  <th className="py-3">Driver</th>
                  <th className="py-3">Base Salary</th>
                  <th className="py-3">Bonus</th>
                  <th className="py-3">Advance</th>
                  <th className="py-3">Net Disbursed</th>
                  <th className="py-3 pr-5 text-right rounded-tr-xl">Action</th>
                </tr>
              </thead>
              <tbody className="text-xs font-semibold text-slate-700">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs font-bold text-slate-400 bg-white">No payroll records logged.</td>
                  </tr>
                ) : (
                  filtered.map((x, i) => {
                    const d = drivers.find(y => y.id === x.driverId)
                    const rowBg = i % 2 === 0 ? "bg-sky-50/50" : "bg-[#cfd676]/10"
                    return (
                      <tr key={x.id} className={`${rowBg} hover:bg-[#cfd676]/20 transition-colors group`}>
                        <td className="py-3.5 pl-5">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-6 rounded-full bg-sky-400" />
                            <span className="font-bold text-slate-600">{x.week}</span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center text-[10px] font-black text-sky-700 border border-sky-200/50">
                              {d ? d.name.charAt(0) : "?"}
                            </div>
                            <span className="font-bold text-slate-850">{d ? d.name : "—"}</span>
                          </div>
                        </td>
                        <td className="py-3.5 font-mono font-bold text-slate-700">{fmt(x.salary, currencySymbol)}</td>
                        <td className="py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">+{fmt(x.bonus, currencySymbol)}</span>
                        </td>
                        <td className="py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black">-{fmt(x.advance, currencySymbol)}</span>
                        </td>
                        <td className="py-3.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#cfd676]/30 text-slate-900 text-[11px] font-black border border-[#cfd676]/40">
                            {fmt(x.totalPaid, currencySymbol)}
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
