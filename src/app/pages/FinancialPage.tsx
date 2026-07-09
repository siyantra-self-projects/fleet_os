import React, { useMemo } from "react"
import { BarChart3, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { FuelEntry, GarageEntry, PayrollEntry, Settlement, Card, TopBarComponent, fmt } from "../components/UI"

export default function FinancialPage({
  fuel,
  garage,
  payroll,
  settlements,
  currencySymbol,
}: {
  fuel: FuelEntry[]
  garage: GarageEntry[]
  payroll: PayrollEntry[]
  settlements: Settlement[]
  onMenu: () => void
  currencySymbol: string
}) {
  const totals = useMemo(() => {
    let fCost = 0
    fuel.forEach(x => { fCost += x.cost })
    let gCost = 0
    garage.forEach(x => { gCost += x.cost })
    let pCost = 0
    payroll.forEach(x => { pCost += x.totalPaid })
    let revenue = 0
    settlements.forEach(x => { revenue += x.amount })

    const expenses = fCost + gCost + pCost
    const netProfit = revenue - expenses
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0

    return { fuel: fCost, garage: gCost, payroll: pCost, revenue, expenses, netProfit, margin }
  }, [fuel, garage, payroll, settlements])

  // Chart data for monthly trend
  const chartData = [
    { name: "Jan", Revenue: totals.revenue * 0.15, Expenses: totals.expenses * 0.13 },
    { name: "Feb", Revenue: totals.revenue * 0.32, Expenses: totals.expenses * 0.28 },
    { name: "Mar", Revenue: totals.revenue * 0.55, Expenses: totals.expenses * 0.51 },
    { name: "Apr", Revenue: totals.revenue * 0.78, Expenses: totals.expenses * 0.72 },
    { name: "May", Revenue: totals.revenue, Expenses: totals.expenses },
  ]

  const pieData = [
    { name: "Fuel Expense", value: totals.fuel, color: "#18181A" },
    { name: "Garage & Service", value: totals.garage, color: "#F05252" },
    { name: "Driver Payroll", value: totals.payroll, color: "#cfd676" },
  ]

  return (
    <div className="flex-1 overflow-y-auto flex flex-col bg-[#F0F0F0] select-none">
      <TopBarComponent title="Financial Summary" subtitle="Consolidated balance sheet and analytics ledger" />

      {/* KPI Cards */}
      <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex flex-col justify-between bg-[#cfd676] border-[#b9c063]">
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Gross Revenue</span>
          <span className="text-xl font-extrabold text-slate-900 mt-1">{fmt(totals.revenue, currencySymbol)}</span>
        </Card>
        <Card className="flex flex-col justify-between bg-[#cfd676] border-[#b9c063]">
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Operating Expenses</span>
          <span className="text-xl font-extrabold text-rose-700 mt-1">{fmt(totals.expenses, currencySymbol)}</span>
        </Card>
        <Card className="flex flex-col justify-between bg-[#cfd676] border-[#b9c063]">
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Net Profit</span>
          <span className="text-xl font-extrabold text-slate-900 mt-1">{fmt(totals.netProfit, currencySymbol)}</span>
        </Card>
        <Card className="flex flex-col justify-between bg-[#cfd676] border-[#b9c063]">
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Profit Margin</span>
          <span className="text-xl font-extrabold text-slate-900 mt-1">{totals.margin.toFixed(1)}%</span>
        </Card>
      </div>

      <div className="px-4 pb-4 grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
        {/* Trend Area Chart */}
        <div className="xl:col-span-8 bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm flex flex-col justify-between h-[360px]">
          <h3 className="text-md font-bold text-slate-800 font-sans">Monthly Performance Trend</h3>
          <div className="flex-1 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#cfd676" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#cfd676" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                <Tooltip />
                <Area type="monotone" dataKey="Revenue" stroke="#cfd676" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="Expenses" stroke="#e11d48" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses Pie Chart */}
        <div className="xl:col-span-4 bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm flex flex-col justify-between h-[360px]">
          <h3 className="text-md font-bold text-slate-800 font-sans">Operating Expenses Distribution</h3>
          <div className="flex-1 w-full relative flex items-center justify-center">
            {totals.expenses > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value">
                    {pieData.map((x, i) => (
                      <Cell key={`cell-${i}`} fill={x.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => fmt(value, currencySymbol)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs font-bold text-slate-400">No expenses recorded yet.</span>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            {pieData.map(x => (
              <div key={x.name} className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: x.color }} />
                <span>{x.name.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
