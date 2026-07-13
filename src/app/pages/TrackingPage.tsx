import React, { useState, useEffect } from "react"
import { Truck, MapPin, Navigation, Clock, Shield, Activity, Search } from "lucide-react"
import { Card, TopBarComponent, Badge } from "../components/UI"

interface ActiveTrip {
  id: string
  driverName: string
  vehicleName: string
  reg: string
  from: string
  to: string
  fromCoords: { x: number; y: number }
  toCoords: { x: number; y: number }
  progress: number // 0 to 100
  status: "In Transit" | "Delayed" | "At Customs" | "Loading"
  speed: number
  fuel: number
  temp: number
}

export default function TrackingPage({ onMenu }: { onMenu: () => void }) {
  const [trips, setTrips] = useState<ActiveTrip[]>([])
  const [selectedTripId, setSelectedTripId] = useState<string>("")
  const [search, setSearch] = useState("")

  const selectedTrip = trips.find(t => t.id === selectedTripId) || trips[0]

  const filteredTrips = trips.filter(
    t =>
      t.driverName.toLowerCase().includes(search.toLowerCase()) ||
      t.reg.toLowerCase().includes(search.toLowerCase()) ||
      t.from.toLowerCase().includes(search.toLowerCase()) ||
      t.to.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 overflow-y-auto flex flex-col bg-[#F0F0F0] select-none relative">
      <TopBarComponent title="Command Center" subtitle="Real-time vehicle telemetry and visual asset dispatch" />
      
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="max-w-md text-center space-y-4 p-8">
          <div className="w-20 h-20 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-10 h-10 text-violet-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Feature Coming Soon
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Real-time GPS tracking and visual asset dispatch is currently under development. 
            This powerful feature will allow you to monitor your fleet in real-time with live telemetry data.
          </p>
          <div className="flex items-center justify-center gap-3 text-xs text-slate-500 pt-4">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              <span>Live Tracking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Navigation className="w-4 h-4" />
              <span>Route Optimization</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              <span>Geofencing</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch flex-1">
        <div className="xl:col-span-4 bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-bold text-slate-800 font-sans">Active Shipments</h3>
              <Badge color="blue">{trips.filter(t => t.status === "In Transit").length} Moving</Badge>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Filter trips..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200/70 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {filteredTrips.map(t => {
                const active = t.id === selectedTripId
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTripId(t.id)}
                    className={`p-4.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                      active
                        ? "bg-[#18181A] border-[#18181A] text-white shadow-lg"
                        : "bg-slate-50/50 hover:bg-slate-50 border-slate-200/50 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider">{t.driverName}</h4>
                        <p className={`text-[10px] font-bold mt-0.5 ${active ? "text-zinc-400" : "text-slate-400"}`}>
                          {t.vehicleName} • {t.reg}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                          t.status === "In Transit"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : t.status === "Delayed"
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold truncate">
                      <span>{t.from.split(",")[0]}</span>
                      <span className={active ? "text-zinc-500" : "text-slate-300"}>→</span>
                      <span>{t.to.split(",")[0]}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] font-black">
                        <span className={active ? "text-zinc-400" : "text-slate-400"}>PROGRESS</span>
                        <span>{Math.floor(t.progress)}%</span>
                      </div>
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${active ? "bg-zinc-800" : "bg-slate-200"}`}>
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${active ? "bg-white" : "bg-[#18181A]"}`}
                          style={{ width: `${t.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {selectedTrip && (
            <div className="bg-[#18181A] text-white p-4.5 rounded-2xl border border-zinc-800 shadow-md space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Telemetry Feed</h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-zinc-900/60 p-2 rounded-xl border border-zinc-850">
                  <p className="text-[9px] font-black text-zinc-500 uppercase">SPEED</p>
                  <p className="text-xs font-black text-white mt-0.5">{selectedTrip.speed} mph</p>
                </div>
                <div className="bg-zinc-900/60 p-2 rounded-xl border border-zinc-850">
                  <p className="text-[9px] font-black text-zinc-500 uppercase">FUEL</p>
                  <p className="text-xs font-black text-white mt-0.5">{selectedTrip.fuel}%</p>
                </div>
                <div className="bg-zinc-900/60 p-2 rounded-xl border border-zinc-850">
                  <p className="text-[9px] font-black text-zinc-500 uppercase">TEMP</p>
                  <p className="text-xs font-black text-white mt-0.5">{selectedTrip.temp}°C</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-8 bg-[#18181A] text-white rounded-3xl border border-zinc-800 shadow-xl overflow-hidden p-5 flex flex-col justify-between h-[600px] relative">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-3 z-10 shrink-0">
            <div>
              <h3 className="text-md font-bold text-white font-sans">Visual Asset Tracker</h3>
              <p className="text-xs text-zinc-500 font-semibold mt-0.5">Live fleet visuals are available once telemetry data is connected.</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase text-zinc-400">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" /> Active Node</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-zinc-700 border-t border-dashed" /> Dispatch Route</span>
            </div>
          </div>

          <div className="flex-1 w-full h-full relative overflow-hidden bg-zinc-950/20 rounded-2xl border border-zinc-850/60 my-4 flex items-center justify-center">
            {trips.length === 0 ? (
              <div className="text-center px-6">
                <p className="text-sm text-zinc-400">Tracking visualization is unavailable until live fleet data is connected.</p>
              </div>
            ) : (
              <svg className="w-full h-full max-h-[450px]" viewBox="0 0 650 550" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#27272a" strokeWidth="0.5" strokeOpacity="0.3" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {trips.map(t => {
                  const isSel = t.id === selectedTripId
                  return (
                    <g key={`route-${t.id}`}>
                      <line
                        x1={t.fromCoords.x}
                        y1={t.fromCoords.y}
                        x2={t.toCoords.x}
                        y2={t.toCoords.y}
                        stroke={isSel ? "#FFFFFF" : "#3f3f46"}
                        strokeWidth={isSel ? 2 : 1.2}
                        strokeDasharray={isSel ? "6,4" : "4,4"}
                      />
                    </g>
                  )
                })}

                {selectedTrip && (
                  <g>
                    <circle cx={selectedTrip.fromCoords.x} cy={selectedTrip.fromCoords.y} r="7" fill="#cfd676" className="animate-ping opacity-60" />
                    <circle cx={selectedTrip.fromCoords.x} cy={selectedTrip.fromCoords.y} r="5" fill="#cfd676" />
                    <circle cx={selectedTrip.toCoords.x} cy={selectedTrip.toCoords.y} r="7" fill="#FFFFFF" className="animate-ping opacity-40" />
                    <circle cx={selectedTrip.toCoords.x} cy={selectedTrip.toCoords.y} r="5" fill="#FFFFFF" />
                  </g>
                )}

                {trips.map(t => {
                  const dx = t.toCoords.x - t.fromCoords.x
                  const dy = t.toCoords.y - t.fromCoords.y
                  const x = t.fromCoords.x + (dx * t.progress) / 100
                  const y = t.fromCoords.y + (dy * t.progress) / 100
                  const isSel = t.id === selectedTripId

                  return (
                    <g key={`marker-${t.id}`} onClick={() => setSelectedTripId(t.id)} className="cursor-pointer">
                      <circle cx={x} cy={y} r={isSel ? 10 : 8} fill={isSel ? "#cfd676" : "#ffffff"} stroke="#000000" strokeWidth="2" />
                      {isSel && <circle cx={x} cy={y} r="18" fill="none" stroke="#cfd676" strokeWidth="1" className="animate-pulse" />}
                    </g>
                  )
                })}
              </svg>
            )}
          </div>

          {selectedTrip && (
            <div className="bg-zinc-900/40 rounded-2xl border border-zinc-850 p-3.5 space-y-2 z-10 shrink-0">
              <div className="flex items-center justify-between text-[10px] font-extrabold text-zinc-400">
                <span>ORIGIN:</span>
                <span className="text-white">{selectedTrip.from.split(",")[0]}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-extrabold text-zinc-400">
                <span>DESTINATION:</span>
                <span className="text-white">{selectedTrip.to.split(",")[0]}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
