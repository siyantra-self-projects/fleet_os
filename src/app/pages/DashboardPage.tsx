import React, { useState, useMemo } from "react"
import { LayoutDashboard, Truck, Fuel, Wrench, Users, Receipt, Bell, Settings, ChevronRight, ChevronDown, Menu, X, Plus, Search, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Edit2, Trash2, ArrowUpRight, ArrowDownRight, DollarSign, Activity, Package, BarChart3, Zap, Navigation, Shield, Clock, LogOut, Lock, Mail, Building, Eye, RefreshCw, ChevronsUpDown, Calendar, Share, SlidersHorizontal, ArrowUpDown, Target } from "lucide-react"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts"
import { Page, Driver, Vehicle, Route, Order, FuelEntry, GarageEntry, PayrollEntry, Settlement, AppConfig, UserAccount, Btn, FInput, FSelect, Card, SearchableSelect, TopBarComponent, fmt, uid, TODAY } from "../components/UI"
import truckImg from "../delivery_truck_illustration.png"
import { toast } from "sonner"

export default function DashboardPage({
  drivers, vehicles, routes, orders, setOrders, fuel, garage, payroll, settlements, setPage, currencySymbol,
}: {
  drivers: Driver[]; vehicles: Vehicle[]; routes: Route[]
  orders: Order[]; setOrders: React.Dispatch<React.SetStateAction<Order[]>>
  fuel: FuelEntry[]; garage: GarageEntry[]
  payroll: PayrollEntry[]; settlements: Settlement[]
  setPage: (p: Page) => void; currencySymbol: string
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"Pending" | "Responded" | "Assigned" | "Completed">("Assigned")
  const [showAddForm, setShowAddForm] = useState(false)
  const [newOrder, setNewOrder] = useState({ date: TODAY, vehicleId: "", driverId: "", routeId: "" })
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [showSalesFilter, setShowSalesFilter] = useState(false)
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])

  const vehiclesNeedingService = garage.length
  const incidentSummary = "Monitor Alerts for incident details"

  // 1. KPI Calculations
  const activeVehicles = vehicles.filter(v => v.status === "Active").length
  const utilizationRate = vehicles.length > 0 ? Math.round((activeVehicles / vehicles.length) * 100) : 0

  const avgFuelEfficiency = useMemo(() => {
    if (fuel.length === 0) return 0
    const totalMiles = fuel.reduce((a, f) => a + f.miles, 0)
    const totalLitres = fuel.reduce((a, f) => a + f.litres, 0)
    if (totalLitres === 0) return 0
    const mpg = (totalMiles / totalLitres) * 4.546
    return +mpg.toFixed(1)
  }, [fuel])

  // Calculate on-time delivery rate from completed orders
  const onTimeRate = useMemo(() => {
    const completedOrders = orders.filter(o => o.status === "Completed")
    if (completedOrders.length === 0) return 0
    // Assume orders completed on or before their date are on-time
    const onTimeOrders = completedOrders.filter(o => new Date(o.date) <= new Date())
    return Math.round((onTimeOrders.length / completedOrders.length) * 100)
  }, [orders])

  // Calculate average idle time from vehicle data (placeholder - would need actual tracking data)
  const avgIdleTime = useMemo(() => {
    // This would require actual vehicle tracking data
    // For now, return empty if no data
    return vehicles.length > 0 ? "N/A" : "N/A"
  }, [vehicles])

  // 2. Fulfillment Performance Data - Calculate from actual orders
  const fulfillmentData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    // Get last 10 months of data
    const data = []
    for (let i = 9; i >= 0; i--) {
      const targetMonth = currentMonth - i
      const targetYear = currentYear + Math.floor(targetMonth / 12)
      const normalizedMonth = ((targetMonth % 12) + 12) % 12
      
      const monthOrders = orders.filter(o => {
        const orderDate = new Date(o.date)
        return orderDate.getMonth() === normalizedMonth && orderDate.getFullYear() === targetYear
      })
      
      const completedInMonth = monthOrders.filter(o => o.status === "Completed").length
      const totalInMonth = monthOrders.length
      const completionRate = totalInMonth > 0 ? Math.round((completedInMonth / totalInMonth) * 100) : 0
      
      data.push({
        name: monthNames[normalizedMonth],
        value: completionRate,
        active: i === 0 // Current month is active
      })
    }
    
    // Apply sorting
    if (sortOrder === "asc") {
      return [...data].sort((a, b) => a.value - b.value)
    } else {
      return [...data].sort((a, b) => b.value - a.value)
    }
  }, [orders, sortOrder])

  // 3. Sales Overview Data - Calculate from actual settlements
  const totalRevenue = useMemo(() => {
    return settlements.reduce((a, s) => a + s.amount, 0)
  }, [settlements])

  const allSalesData = useMemo(() => {
    // Group settlements by route to get regional data
    const regionMap = new Map<string, number>()
    
    settlements.forEach(s => {
      const route = routes.find(r => r.id === s.routeId)
      if (route) {
        // Extract destination country/region from route name
        const parts = route.name.split("→")
        const destination = parts[1]?.trim() || "Other"
        const country = destination.split(",")[1]?.trim() || "Other"
        
        const current = regionMap.get(country) || 0
        regionMap.set(country, current + s.amount)
      }
    })
    
    // Convert to percentages
    const total = Array.from(regionMap.values()).reduce((a, b) => a + b, 0)
    const colors = ["#10B981", "#D2D88F", "#FFFFFF", "#3B82F6", "#94A3B8", "#F59E0B", "#EC4899"]
    
    return Array.from(regionMap.entries())
      .map(([name, amount], index) => ({
        name,
        value: total > 0 ? Math.round((amount / total) * 100) : 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value)
  }, [settlements, routes])

  // Initialize selected regions with all regions on mount
  React.useEffect(() => {
    if (selectedRegions.length === 0 && allSalesData.length > 0) {
      setSelectedRegions(allSalesData.map(item => item.name))
    }
  }, [allSalesData, selectedRegions.length])
  
  const salesData = useMemo(() => {
    if (selectedRegions.length === 0) return allSalesData
    return allSalesData.filter(item => selectedRegions.includes(item.name))
  }, [allSalesData, selectedRegions])

  // 4. Order Rows Filtering & Rendering
  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(o => {
      // Search filter
      const driverName = drivers.find(d => d.id === o.driverId)?.name.toLowerCase() ?? ""
      const vehicleReg = vehicles.find(v => v.id === o.vehicleId)?.reg.toLowerCase() ?? ""
      const routeName = routes.find(r => r.id === o.routeId)?.name.toLowerCase() ?? ""
      const matchesSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            driverName.includes(searchTerm.toLowerCase()) ||
                            vehicleReg.includes(searchTerm.toLowerCase()) ||
                            routeName.includes(searchTerm.toLowerCase())

      // Date range filter
      let matchesDate = true
      if (dateRange.start || dateRange.end) {
        const orderDate = new Date(o.date)
        if (dateRange.start && orderDate < new Date(dateRange.start)) matchesDate = false
        if (dateRange.end && orderDate > new Date(dateRange.end)) matchesDate = false
      }

      // Tab filter
      let matchesTab = true
      if (activeTab === "Pending") {
        matchesTab = o.status === "Picked up"
      } else if (activeTab === "Responded") {
        matchesTab = o.status === "Completed"
      } else if (activeTab === "Assigned") {
        matchesTab = o.status === "Assigned"
      } else if (activeTab === "Completed") {
        matchesTab = o.status === "Completed"
      }

      return matchesSearch && matchesDate && matchesTab
    })

    return filtered
  }, [orders, drivers, vehicles, routes, searchTerm, activeTab, dateRange])

  const handleSaveOrder = () => {
    if (!newOrder.vehicleId || !newOrder.driverId || !newOrder.routeId) {
      toast.error("Please fill all fields")
      return
    }
    setOrders(prev => [{
      id: uid(),
      date: newOrder.date,
      vehicleId: newOrder.vehicleId,
      driverId: newOrder.driverId,
      routeId: newOrder.routeId,
      status: "Assigned"
    }, ...prev])
    toast.success("Shipment added successfully!")
    setShowAddForm(false)
    setNewOrder({ date: TODAY, vehicleId: "", driverId: "", routeId: "" })
  }

  const handleExportOrders = () => {
    try {
      // Create CSV content
      const headers = ["Order ID", "Date", "Driver", "Vehicle", "Route", "Status"]
      const csvRows = [headers.join(",")]
      
      filteredOrders.forEach(o => {
        const driver = drivers.find(d => d.id === o.driverId)?.name || "Unassigned"
        const vehicle = vehicles.find(v => v.id === o.vehicleId)?.reg || "N/A"
        const route = routes.find(r => r.id === o.routeId)?.name || "N/A"
        csvRows.push([o.id, o.date, driver, vehicle, route.replace(/,/g, ";"), o.status].join(","))
      })
      
      // Create download
      const csvString = csvRows.join("\n")
      const blob = new Blob([csvString], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `orders_export_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success(`Exported ${filteredOrders.length} orders to CSV`)
    } catch (error) {
      toast.error("Export failed. Please try again.")
    }
  }

  const toggleRegion = (region: string) => {
    setSelectedRegions(prev => 
      prev.includes(region) 
        ? prev.filter(r => r !== region)
        : [...prev, region]
    )
  }

  const topDriverName = drivers.length > 0 ? drivers[0]?.name : "No drivers"
  const topDriverInitial = topDriverName.charAt(0)

  return (
    <div className="flex-1 overflow-y-auto bg-[#F0F0F0] min-h-0">
      <div className="w-full px-4 py-4 grid grid-cols-1 xl:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: Performance Overview & Promo */}
        <div className="xl:col-span-4 space-y-4">
          
          {/* Performance Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm space-y-4">
            <h2 className="text-md font-bold text-slate-800 tracking-tight font-sans">
              Fleet performance overview
            </h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#cfd676]/15 border border-[#cfd676]/45 p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-extrabold text-[#7c8332] uppercase tracking-wider">Utilization</span>
                <span className="text-xl font-extrabold text-slate-900 mt-1">{utilizationRate}%</span>
              </div>
              <div className="bg-[#cfd676]/15 border border-[#cfd676]/45 p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-extrabold text-[#7c8332] uppercase tracking-wider">Fuel Efficiency</span>
                <span className="text-xl font-extrabold text-slate-900 mt-1">{avgFuelEfficiency} mpg</span>
              </div>
              <div className="bg-[#cfd676]/15 border border-[#cfd676]/45 p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-extrabold text-[#7c8332] uppercase tracking-wider">On-time Rate</span>
                <span className="text-xl font-extrabold text-slate-900 mt-1">{onTimeRate}%</span>
              </div>
              <div className="bg-[#cfd676]/15 border border-[#cfd676]/45 p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-extrabold text-[#7c8332] uppercase tracking-wider">Idle Time</span>
                <span className="text-xl font-extrabold text-slate-900 mt-1">{avgIdleTime}</span>
              </div>
            </div>

            {/* Top Driver Row */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  {topDriverInitial}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-bold text-slate-800">{topDriverName}</p>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                    {drivers.length > 0 ? "Top driver" : "Add a driver"}
                  </p>
                </div>
              </div>
              {drivers.length > 0 && (
                <span className="bg-slate-100 text-slate-800 text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-slate-200">
                  {drivers.length} active driver{drivers.length === 1 ? "" : "s"}
                </span>
              )}
            </div>

            {/* Navigation rows */}
            <div className="space-y-2">
              <div
                onClick={() => setPage("garage")}
                className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-100 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3 text-slate-700">
                  <Wrench className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold">
                    {vehiclesNeedingService > 0 ? `${vehiclesNeedingService} service records` : "No service records"}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => setPage("alerts")}
                className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-100 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3 text-slate-700">
                  <AlertTriangle className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold">{incidentSummary}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>

          </div>

          {/* Lime Green Tracking Promo Card */}
          <div className="bg-[#cfd676] rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between h-[360px] border border-[#b9c063] shadow-xs">
            <div className="flex justify-center -mt-5 -mx-5 bg-[#cfd676] overflow-hidden">
              <img src={truckImg} className="w-full h-52 object-contain" alt="White delivery truck" />
            </div>
            <div className="space-y-3.5">
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">Vehicle on the road</h3>
                <p className="text-xs text-slate-855 font-semibold mt-1">Expedite cargo fleet with real-time tracking</p>
              </div>
              <button
                onClick={() => setPage("tracking")}
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-black hover:bg-zinc-900 text-white rounded-2xl font-bold text-xs transition-all shadow-md shadow-black/10 cursor-pointer"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Track vehicle</span>
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Performance Charts & Orders Table */}
        <div className="xl:col-span-8 space-y-4">

          {/* Dark Charcoal Charts Card */}
          <div className="bg-[#18181A] rounded-3xl p-5 text-white shadow-xl space-y-4 border border-zinc-800">
            
            {/* Dark Top Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
              <div className="relative flex-1 max-w-md w-full">
                <input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search order..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleExportOrders}
                  className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 border border-zinc-800 hover:bg-zinc-900 rounded-2xl text-xs font-bold transition-all text-zinc-350 cursor-pointer"
                >
                  <Share className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-white hover:bg-zinc-100 text-black rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add new shipment</span>
                </button>
              </div>
            </div>

            {/* Chart Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
              
              {/* Fulfillment Performance Bar Chart */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Fulfillment Performance</h3>
                  <div className="flex gap-1.5 relative">
                    <button 
                      onClick={() => setShowDateFilter(!showDateFilter)}
                      className="p-1.5 bg-zinc-900 hover:bg-zinc-850 rounded-lg border border-zinc-800 text-zinc-400 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                    </button>
                    {showDateFilter && (
                      <div className="absolute top-10 right-0 bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-xl z-20 w-64 space-y-2">
                        <p className="text-[9px] font-bold text-zinc-400 uppercase">Filter by Date Range</p>
                        <input
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-[10px] text-white"
                          placeholder="Start date"
                        />
                        <input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-[10px] text-white"
                          placeholder="End date"
                        />
                        <button
                          onClick={() => setDateRange({ start: "", end: "" })}
                          className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg px-2 py-1.5 text-[10px] text-white font-bold"
                        >
                          Clear Filter
                        </button>
                      </div>
                    )}
                    <button 
                      onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                      className="p-1.5 bg-zinc-900 hover:bg-zinc-850 rounded-lg border border-zinc-800 text-zinc-400 cursor-pointer"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-bold border-b border-zinc-850 pb-2">
                  {["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"].map(m => (
                    <span key={m} className={m === "May" ? "text-white bg-zinc-850 px-2 py-0.5 rounded-md" : ""}>{m}</span>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={fulfillmentData} margin={{ top: 25, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#71717A" }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-zinc-800 border border-zinc-700 px-2 py-1 rounded text-[10px] text-white font-bold">
                            {payload[0].value}%
                          </div>
                        )
                      }
                      return null
                    }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={8} label={({ x, y, width, value, index }) => {
                      if (fulfillmentData[index]?.active) {
                        return (
                          <g>
                            <rect x={x + width/2 - 14} y={y - 20} width={28} height={14} rx={7} fill="#FFFFFF" />
                            <text x={x + width/2} y={y - 10} fill="#000000" fontSize="8" fontWeight="bold" textAnchor="middle">
                              {value}%
                            </text>
                            <line x1={x + width/2} y1={y - 6} x2={x + width/2} y2={y} stroke="#FFFFFF" strokeWidth={1} />
                          </g>
                        )
                      }
                      return null
                    }}>
                      {fulfillmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.active ? "#FFFFFF" : "#3F3F46"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Sales Overview Donut */}
              <div className="lg:col-span-5 space-y-3 bg-zinc-900/50 p-4.5 rounded-2xl border border-zinc-850 relative">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Sales Overview</h3>
                  <button 
                    onClick={() => setShowSalesFilter(!showSalesFilter)}
                    className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                {showSalesFilter && (
                  <div className="absolute top-12 right-4 bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-xl z-20 w-48 space-y-2">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase mb-2">Filter Regions</p>
                    {allSalesData.map(item => (
                      <label key={item.name} className="flex items-center gap-2 cursor-pointer hover:bg-zinc-850 p-1.5 rounded">
                        <input
                          type="checkbox"
                          checked={selectedRegions.includes(item.name)}
                          onChange={() => toggleRegion(item.name)}
                          className="w-3 h-3 rounded"
                        />
                        <span className="text-[10px] text-white font-semibold">{item.name}</span>
                        <span className="w-2 h-2 rounded-full ml-auto" style={{ backgroundColor: item.color }} />
                      </label>
                    ))}
                  </div>
                )}
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-white tracking-tight">{fmt(totalRevenue, currencySymbol)}</span>
                  {settlements.length > 0 && (
                    <span className="text-[10px] text-emerald-400 font-extrabold bg-zinc-850 px-2 py-0.5 rounded-md border border-zinc-800 flex items-center">
                      {/* Calculate growth from data if available */}
                      Revenue
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center -my-3">
                  <ResponsiveContainer width="100%" height={105}>
                    <PieChart>
                      <Pie
                        data={salesData}
                        cx="50%"
                        cy="100%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={42}
                        outerRadius={55}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {salesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Country Legend */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 border-t border-zinc-850/60 pt-2">
                  {salesData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-bold text-zinc-200">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Orders Table Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm space-y-4">
            
            {/* Header + Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h3 className="text-md font-bold text-slate-800 font-sans">Orders</h3>
                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-0.5 rounded-lg border border-slate-200/40">
                  {orders.length}
                </span>
              </div>

              {/* Status Tabs capsules */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/50 shadow-inner">
                {([
                  { label: "Pending", count: orders.filter(o => o.status === "Picked up").length },
                  { label: "Responded", count: orders.filter(o => o.status === "Completed").length },
                  { label: "Assigned", count: orders.filter(o => o.status === "Assigned").length },
                  { label: "Completed", count: orders.filter(o => o.status === "Completed").length }
                ] as const).map(tab => {
                  const active = activeTab === tab.label
                  return (
                    <button
                      key={tab.label}
                      onClick={() => setActiveTab(tab.label)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        active ? "bg-black text-white shadow-md" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${active ? "bg-zinc-800 text-white" : "bg-slate-200/60 text-slate-500"}`}>
                        {tab.count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom High-Fidelity Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2.5">
                    <th className="pb-3 pr-2">Order ID</th>
                    <th className="pb-3 pr-2">Order assigned to</th>
                    <th className="pb-3 pr-2">Route</th>
                    <th className="pb-3 pr-2">Vehicle</th>
                    <th className="pb-3 pr-2">Est. delivery</th>
                    <th className="pb-3 pr-2">Status</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-xs text-slate-400 font-semibold">No orders found matching the filter.</td>
                    </tr>
                  ) : filteredOrders.map(o => {
                    const driver = drivers.find(d => d.id === o.driverId)
                    const vehicle = vehicles.find(v => v.id === o.vehicleId)
                    const route = routes.find(r => r.id === o.routeId)

                    // Format cities
                    const startCity = route ? route.name.split(" → ")[0] : "Start"
                    const endCity = route ? route.name.split(" → ")[1] : "End"

                    const getFlag = (cityStr: string) => {
                      const parts = cityStr.split(", ")
                      const code = parts.length > 1 ? parts[1] : ""
                      const FLAG_MAP: Record<string, string> = {
                        DE: "🇩🇪",
                        NL: "🇳🇱",
                        PL: "🇵🇱",
                        AT: "🇦🇹",
                        CZ: "🇨🇿",
                        CH: "🇨🇭",
                        ES: "🇪🇸",
                        FR: "🇫🇷",
                        UK: "🇬🇧",
                        GB: "🇬🇧",
                      }
                      return FLAG_MAP[code] || "📍"
                    }
                    const startFlag = getFlag(startCity)
                    const endFlag = getFlag(endCity)
                    const rowBg = o.status === "Completed"
                      ? "bg-emerald-50 hover:bg-emerald-100/80"
                      : o.status === "Picked up"
                      ? "bg-slate-50 hover:bg-slate-100/80"
                      : "bg-amber-50 hover:bg-amber-100/80"

                    return (
                      <tr key={o.id} className={`text-xs ${rowBg} transition-colors`}>
                        <td className="py-3.5 pr-2 font-bold text-slate-900">#{o.id.slice(0, 8)}</td>
                        <td className="py-3.5 pr-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-white text-[10px] font-bold text-slate-700 flex items-center justify-center border border-slate-200/60">
                              {driver ? driver.name.charAt(0) : "?"}
                            </div>
                            <span className="font-semibold text-slate-700">{driver ? driver.name : "Unassigned"}</span>
                          </div>
                        </td>
                        <td className="py-3.5 pr-2 font-semibold text-slate-800">
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
                        <td className="py-3.5 pr-2">
                          <div className="leading-tight">
                            <p className="font-bold text-slate-800">{vehicle ? vehicle.name : "—"}</p>
                            <p className="text-[9px] font-semibold text-slate-400 mt-0.5">{vehicle ? vehicle.reg : "—"}</p>
                          </div>
                        </td>
                        <td className="py-3.5 pr-2 font-semibold text-slate-500">
                          {new Date(o.date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3.5 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                              o.status === "Completed" ? "bg-emerald-500" :
                              o.status === "Picked up" ? "bg-slate-400" : "bg-amber-500"
                            }`} />
                            <span className="font-bold text-slate-700">
                              {o.status === "Completed" ? "Delivered" :
                               o.status === "Picked up" ? "Picked up" : "In transit"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => { setPage("orders"); toast.info(`Viewing details of Order #${o.id.slice(0, 8)}`) }}
                            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/60 rounded-xl text-[10px] font-bold text-slate-700 transition-all cursor-pointer"
                          >
                            See more
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 font-sans">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "New Order", icon: Package, page: "orders" as Page, cls: "bg-blue-50/70 text-blue-700 hover:bg-blue-100/80 border border-blue-100/60", iconCls: "text-blue-500" },
                { label: "Add Fuel Entry", icon: Fuel, page: "fuel" as Page, cls: "bg-amber-50/70 text-amber-700 hover:bg-amber-100/80 border border-amber-100/60", iconCls: "text-amber-500" },
                { label: "Add Garage Expense", icon: Wrench, page: "garage" as Page, cls: "bg-orange-50/70 text-orange-700 hover:bg-orange-100/80 border border-orange-100/60", iconCls: "text-orange-500" },
                { label: "Add DPD Settlement", icon: Receipt, page: "settlement" as Page, cls: "bg-violet-50/70 text-violet-700 hover:bg-violet-100/80 border border-violet-100/60", iconCls: "text-violet-500" },
              ].map(a => (
                <button key={a.label} onClick={() => setPage(a.page)}
                  className={`flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl transition-all text-[11px] font-extrabold cursor-pointer border ${a.cls}`}>
                  <a.icon className={`w-5 h-5 ${a.iconCls}`} />
                  <span>{a.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Modern Add Shipment Overlay Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-800 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-md font-bold text-slate-900 font-sans">Create New Shipment</h3>
              <button onClick={() => setShowAddForm(false)} className="text-slate-455 hover:text-slate-750 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold text-[#7c8332] uppercase tracking-wider">Date</label>
                <input
                  type="date"
                  value={newOrder.date}
                  onChange={e => setNewOrder(o => ({ ...o, date: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs mt-1.5 focus:outline-none focus:border-slate-400 font-semibold"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-[#7c8332] uppercase tracking-wider">Vehicle</label>
                <select
                  value={newOrder.vehicleId}
                  onChange={e => setNewOrder(o => ({ ...o, vehicleId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs mt-1.5 focus:outline-none focus:border-slate-400 font-semibold"
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.filter(v => v.status === "Active").map(v => (
                    <option key={v.id} value={v.id}>{v.reg} - {v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-[#7c8332] uppercase tracking-wider">Driver</label>
                <select
                  value={newOrder.driverId}
                  onChange={e => setNewOrder(o => ({ ...o, driverId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs mt-1.5 focus:outline-none focus:border-slate-400 font-semibold"
                >
                  <option value="">Select Driver</option>
                  {drivers.filter(d => d.status === "Active").map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-[#7c8332] uppercase tracking-wider">Route</label>
                <select
                  value={newOrder.routeId}
                  onChange={e => setNewOrder(o => ({ ...o, routeId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs mt-1.5 focus:outline-none focus:border-slate-400 font-semibold"
                >
                  <option value="">Select Route</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2.5 pt-4">
              <button
                onClick={handleSaveOrder}
                className="flex-1 py-3 bg-black hover:bg-zinc-955 text-white text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer"
              >
                Save Shipment
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-2xl transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
// ─── Orders Page ─────────────────────────────────────────────────────────────
