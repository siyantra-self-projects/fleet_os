import React, { useState } from "react"
import { Building, SlidersHorizontal, Users, Truck, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { UserAccount, Driver, Vehicle, Btn, FInput, FSelect, ROUTES_SEED } from "./UI"

export default function OnboardingPage({
  currentUser, onOnboardingComplete,
}: {
  currentUser: UserAccount
  onOnboardingComplete: (companyName: string, currency: string, initialAssets: { driver: Driver; vehicle: Vehicle }) => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [companyName, setCompanyName] = useState(currentUser.companyName || "")
  const [currency, setCurrency] = useState("GBP (£)")
  const [weekStart, setWeekStart] = useState("Monday")

  // Initial fleet assets setup
  const [driverName, setDriverName] = useState("")
  const [driverPhone, setDriverPhone] = useState("")
  const [driverLicense, setDriverLicense] = useState("")

  const [vehicleReg, setVehicleReg] = useState("")
  const [vehicleName, setVehicleName] = useState("")
  const [vehicleType, setVehicleType] = useState("Van")

  const handleNext = () => {
    if (!companyName) { toast.error("Please specify your company name"); return }
    setStep(2)
  }

  const handleComplete = () => {
    if (!driverName || !driverLicense || !vehicleReg || !vehicleName) {
      toast.error("Please complete your driver and vehicle setup to start your fleet")
      return
    }

    const driverObj: Driver = {
      id: uid(),
      name: driverName,
      phone: driverPhone,
      license: driverLicense.toUpperCase(),
      status: "Active",
    }

    const vehicleObj: Vehicle = {
      id: uid(),
      reg: vehicleReg.toUpperCase(),
      name: vehicleName,
      type: vehicleType,
      status: "Active",
    }

    onOnboardingComplete(companyName, currency, { driver: driverObj, vehicle: vehicleObj })
    toast.success("Command center initialized successfully!")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Background circles */}
      <div className="absolute w-[500px] h-[500px] bg-violet-400/5 rounded-full blur-3xl -top-20 -left-20"></div>

      <div className="w-full max-w-[500px] bg-white border border-slate-100 rounded-3xl shadow-xl p-8 z-10 space-y-6">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600 mb-1">
            <Zap className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Welcome to FleetOps!
          </h2>
          <p className="text-xs text-slate-400">Let's configure your isolated fleet database workspace</p>
        </div>

        {/* Stepper indicator */}
        <div className="flex items-center gap-2">
          <div className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? "bg-violet-600" : "bg-slate-100"}`}></div>
          <div className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? "bg-violet-600" : "bg-slate-100"}`}></div>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">Step 1: Organization Preferences</h3>
            <FInput
              label="Company Name"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="e.g. Alpha Freight Ltd"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FSelect label="Default Currency" value={currency} onChange={e => setCurrency(e.target.value)}>
                <option>GBP (£)</option>
                <option>EUR (€)</option>
                <option>USD ($)</option>
                <option>INR (₹)</option>
              </FSelect>
              <FSelect label="Payroll Starting Day" value={weekStart} onChange={e => setWeekStart(e.target.value)}>
                <option>Monday</option>
                <option>Sunday</option>
              </FSelect>
            </div>
            <button
              onClick={handleNext}
              className="w-full py-3 mt-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-violet-100 cursor-pointer"
            >
              Continue to Fleet Setup
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">Step 2: Add First Vehicle & Driver</h3>

            <div className="space-y-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Driver Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FInput label="Driver Name" value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="James Wilson" />
                <FInput label="Driver License" value={driverLicense} onChange={e => setDriverLicense(e.target.value)} placeholder="WILSJ123456" />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vehicle Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <FInput label="Reg Plate" value={vehicleReg} onChange={e => setVehicleReg(e.target.value.toUpperCase())} placeholder="MN21 XKT" />
                </div>
                <div className="sm:col-span-2">
                  <FInput label="Vehicle Model Name" value={vehicleName} onChange={e => setVehicleName(e.target.value)} placeholder="Ford Transit" />
                </div>
              </div>
              <FSelect label="Vehicle Type" value={vehicleType} onChange={e => setVehicleType(e.target.value)}>
                <option>Van</option>
                <option>Lorry</option>
                <option>Car</option>
              </FSelect>
            </div>

            <div className="flex gap-3 mt-6">
              <Btn variant="secondary" onClick={() => setStep(1)} className="flex-1 justify-center py-3">Back</Btn>
              <button
                onClick={handleComplete}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-violet-100 cursor-pointer"
              >
                Complete Setup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD (Redesigned)
// ─────────────────────────────────────────────────────────────────────────────
