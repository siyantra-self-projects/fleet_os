import React, { useState } from "react"
import { Building, SlidersHorizontal, Users, Truck, CheckCircle, MapPin, Calendar, Zap, Globe, Phone, Mail, BriefcaseIcon } from "lucide-react"
import { toast } from "sonner"
import { UserAccount, Driver, Vehicle, Btn, FInput, FSelect, uid } from "./UI"
import api from "../../lib/api"

export default function OnboardingPage({
  currentUser, onOnboardingComplete,
}: {
  currentUser: UserAccount
  onOnboardingComplete: (companyName: string, currency: string, initialAssets: { driver: Driver; vehicle: Vehicle }) => void
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  
  // Step 1: Company Information
  const [companyName, setCompanyName] = useState(currentUser.companyName || "")
  const [companyReg, setCompanyReg] = useState("")
  const [vatNumber, setVatNumber] = useState("")
  const [industry, setIndustry] = useState("Logistics & Transportation")
  
  // Step 2: Contact & Location
  const [contactPerson, setContactPerson] = useState("")
  const [contactEmail, setContactEmail] = useState(currentUser.email || "")
  const [contactPhone, setContactPhone] = useState("")
  const [addressLine1, setAddressLine1] = useState("")
  const [addressLine2, setAddressLine2] = useState("")
  const [city, setCity] = useState("")
  const [postcode, setPostcode] = useState("")
  const [country, setCountry] = useState("United Kingdom")
  
  // Step 3: Operational Preferences
  const [currency, setCurrency] = useState("GBP (£)")
  const [weekStart, setWeekStart] = useState("Monday")
  const [operatingHoursStart, setOperatingHoursStart] = useState("08:00")
  const [operatingHoursEnd, setOperatingHoursEnd] = useState("18:00")
  const [fleetSize, setFleetSize] = useState("1-5")
  const [primaryService, setPrimaryService] = useState("Parcel Delivery")
  const [workingDays, setWorkingDays] = useState("Monday to Friday")

  // Step 4: Initial fleet assets setup
  const [driverName, setDriverName] = useState("")
  const [driverPhone, setDriverPhone] = useState("")
  const [driverLicense, setDriverLicense] = useState("")
  const [driverEmail, setDriverEmail] = useState("")
  const [driverAddress, setDriverAddress] = useState("")

  const [vehicleReg, setVehicleReg] = useState("")
  const [vehicleName, setVehicleName] = useState("")
  const [vehicleType, setVehicleType] = useState("Van")
  const [vehicleYear, setVehicleYear] = useState(new Date().getFullYear().toString())
  const [vehicleCapacity, setVehicleCapacity] = useState("")
  const [vehicleFuelType, setVehicleFuelType] = useState("Diesel")

  const handleNext = () => {
    if (step === 1) {
      if (!companyName.trim()) {
        toast.error("Please enter your company name")
        return
      }
      if (!industry) {
        toast.error("Please select your industry")
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (!contactPerson.trim()) {
        toast.error("Please enter contact person name")
        return
      }
      if (!contactPhone.trim()) {
        toast.error("Please enter contact phone number")
        return
      }
      if (!addressLine1.trim() || !city.trim() || !postcode.trim()) {
        toast.error("Please complete your business address")
        return
      }
      setStep(3)
    } else if (step === 3) {
      setStep(4)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3 | 4)
    }
  }

  const handleComplete = async () => {
    if (!driverName.trim() || !driverLicense.trim()) {
      toast.error("Please complete driver details (Name & License required)")
      return
    }
    
    if (!vehicleReg.trim() || !vehicleName.trim()) {
      toast.error("Please complete vehicle details (Registration & Model required)")
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

    try {
      // Save to API
      const response = await api.completeOnboarding(companyName, currency, driverObj, vehicleObj)
      
      if (response.success) {
        // Store additional onboarding data in localStorage for reference
        const onboardingData = {
          company: {
            name: companyName,
            registration: companyReg,
            vat: vatNumber,
            industry,
          },
          contact: {
            person: contactPerson,
            email: contactEmail,
            phone: contactPhone,
          },
          address: {
            line1: addressLine1,
            line2: addressLine2,
            city,
            postcode,
            country,
          },
          operations: {
            currency,
            weekStart,
            operatingHours: { start: operatingHoursStart, end: operatingHoursEnd },
            fleetSize,
            primaryService,
            workingDays,
          },
          initialAssets: {
            driver: {
              ...driverObj,
              email: driverEmail,
              address: driverAddress,
            },
            vehicle: {
              ...vehicleObj,
              year: vehicleYear,
              capacity: vehicleCapacity,
              fuelType: vehicleFuelType,
            },
          },
          completedAt: new Date().toISOString(),
        }

        localStorage.setItem(`fleet_os_onboarding_${currentUser.email}`, JSON.stringify(onboardingData))

        onOnboardingComplete(companyName, currency, { driver: driverObj, vehicle: vehicleObj })
        toast.success("🎉 Command center initialized successfully!")
      } else {
        toast.error(response.error || "Failed to complete onboarding. Please try again.")
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred. Please try again.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8 relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Background circles */}
      <div className="absolute w-[500px] h-[500px] bg-violet-400/5 rounded-full blur-3xl -top-20 -left-20"></div>
      <div className="absolute w-[400px] h-[400px] bg-blue-400/5 rounded-full blur-3xl -bottom-20 -right-20"></div>

      <div className="w-full max-w-[700px] bg-white border border-slate-100 rounded-3xl shadow-xl p-8 z-10 space-y-6">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600 mb-1">
            <Zap className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Welcome to FleetOps Command Center
          </h2>
          <p className="text-xs text-slate-400">Complete setup to configure your fleet management workspace</p>
        </div>

        {/* Stepper indicator */}
        <div className="flex items-center gap-2">
          <div className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? "bg-violet-600" : "bg-slate-100"}`}></div>
          <div className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? "bg-violet-600" : "bg-slate-100"}`}></div>
          <div className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${step >= 3 ? "bg-violet-600" : "bg-slate-100"}`}></div>
          <div className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${step >= 4 ? "bg-violet-600" : "bg-slate-100"}`}></div>
        </div>

        {/* Step indicator text */}
        <div className="text-center">
          <p className="text-[11px] font-bold text-violet-600 uppercase tracking-wider">
            Step {step} of 4
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building className="w-4 h-4 text-violet-600" />
              <h3 className="text-sm font-bold text-slate-800">Company Information</h3>
            </div>
            
            <FInput
              label="Company Name *"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="e.g. Alpha Freight Ltd"
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FInput
                label="Company Registration Number"
                value={companyReg}
                onChange={e => setCompanyReg(e.target.value)}
                placeholder="e.g. 12345678"
              />
              <FInput
                label="VAT Number"
                value={vatNumber}
                onChange={e => setVatNumber(e.target.value)}
                placeholder="e.g. GB123456789"
              />
            </div>

            <FSelect label="Industry / Sector *" value={industry} onChange={e => setIndustry(e.target.value)}>
              <option>Logistics & Transportation</option>
              <option>Parcel Delivery</option>
              <option>Freight Forwarding</option>
              <option>Last-Mile Delivery</option>
              <option>Cold Chain Logistics</option>
              <option>Construction & Heavy Haulage</option>
              <option>Taxi & Passenger Transport</option>
              <option>Waste Management</option>
              <option>Food & Beverage Distribution</option>
              <option>E-commerce Fulfillment</option>
              <option>Other</option>
            </FSelect>

            <button
              onClick={handleNext}
              className="w-full py-3 mt-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-violet-100 cursor-pointer"
            >
              Continue to Contact Details
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin className="w-4 h-4 text-violet-600" />
              <h3 className="text-sm font-bold text-slate-800">Contact & Business Address</h3>
            </div>

            <div className="space-y-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Primary Contact</p>
              
              <FInput
                label="Contact Person Name *"
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
                placeholder="e.g. John Smith"
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FInput
                  label="Email Address"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="contact@company.com"
                  type="email"
                />
                <FInput
                  label="Phone Number *"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="+44 7700 900000"
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Business Address</p>
              
              <FInput
                label="Address Line 1 *"
                value={addressLine1}
                onChange={e => setAddressLine1(e.target.value)}
                placeholder="Street address"
              />
              
              <FInput
                label="Address Line 2"
                value={addressLine2}
                onChange={e => setAddressLine2(e.target.value)}
                placeholder="Building, floor, suite (optional)"
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FInput
                  label="City *"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="London"
                />
                <FInput
                  label="Postcode *"
                  value={postcode}
                  onChange={e => setPostcode(e.target.value.toUpperCase())}
                  placeholder="SW1A 1AA"
                />
                <FSelect label="Country" value={country} onChange={e => setCountry(e.target.value)}>
                  <option>United Kingdom</option>
                  <option>Germany</option>
                  <option>France</option>
                  <option>Netherlands</option>
                  <option>Belgium</option>
                  <option>Spain</option>
                  <option>Italy</option>
                  <option>Poland</option>
                  <option>Other</option>
                </FSelect>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Btn variant="secondary" onClick={handleBack} className="flex-1 justify-center py-3">Back</Btn>
              <button
                onClick={handleNext}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-violet-100 cursor-pointer"
              >
                Continue to Preferences
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <SlidersHorizontal className="w-4 h-4 text-violet-600" />
              <h3 className="text-sm font-bold text-slate-800">Operational Preferences</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FSelect label="Default Currency" value={currency} onChange={e => setCurrency(e.target.value)}>
                <option>GBP (£)</option>
                <option>EUR (€)</option>
                <option>USD ($)</option>
                <option>INR (₹)</option>
              </FSelect>
              
              <FSelect label="Payroll Week Start" value={weekStart} onChange={e => setWeekStart(e.target.value)}>
                <option>Monday</option>
                <option>Sunday</option>
                <option>Saturday</option>
              </FSelect>
            </div>

            <div className="space-y-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Operating Hours</p>
              <div className="grid grid-cols-2 gap-4">
                <FInput
                  label="Start Time"
                  type="time"
                  value={operatingHoursStart}
                  onChange={e => setOperatingHoursStart(e.target.value)}
                />
                <FInput
                  label="End Time"
                  type="time"
                  value={operatingHoursEnd}
                  onChange={e => setOperatingHoursEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FSelect label="Current Fleet Size" value={fleetSize} onChange={e => setFleetSize(e.target.value)}>
                <option>1-5</option>
                <option>6-10</option>
                <option>11-25</option>
                <option>26-50</option>
                <option>51-100</option>
                <option>100+</option>
              </FSelect>

              <FSelect label="Primary Service Type" value={primaryService} onChange={e => setPrimaryService(e.target.value)}>
                <option>Parcel Delivery</option>
                <option>Freight Transport</option>
                <option>Courier Services</option>
                <option>Last-Mile Delivery</option>
                <option>Long-Haul Trucking</option>
                <option>Passenger Transport</option>
                <option>Construction/Heavy Equipment</option>
                <option>Mixed Services</option>
              </FSelect>
            </div>

            <FSelect label="Working Days" value={workingDays} onChange={e => setWorkingDays(e.target.value)}>
              <option>Monday to Friday</option>
              <option>Monday to Saturday</option>
              <option>7 Days a Week</option>
              <option>Custom Schedule</option>
            </FSelect>

            <div className="flex gap-3 mt-6">
              <Btn variant="secondary" onClick={handleBack} className="flex-1 justify-center py-3">Back</Btn>
              <button
                onClick={handleNext}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-violet-100 cursor-pointer"
              >
                Continue to Fleet Setup
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Truck className="w-4 h-4 text-violet-600" />
              <h3 className="text-sm font-bold text-slate-800">Add Your First Driver & Vehicle</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Driver Information</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FInput 
                  label="Full Name *" 
                  value={driverName} 
                  onChange={e => setDriverName(e.target.value)} 
                  placeholder="James Wilson" 
                />
                <FInput 
                  label="Driving License Number *" 
                  value={driverLicense} 
                  onChange={e => setDriverLicense(e.target.value)} 
                  placeholder="WILSJ123456" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FInput 
                  label="Phone Number" 
                  value={driverPhone} 
                  onChange={e => setDriverPhone(e.target.value)} 
                  placeholder="+44 7700 900000" 
                />
                <FInput 
                  label="Email Address" 
                  value={driverEmail} 
                  onChange={e => setDriverEmail(e.target.value)} 
                  placeholder="driver@email.com"
                  type="email"
                />
              </div>

              <FInput 
                label="Home Address" 
                value={driverAddress} 
                onChange={e => setDriverAddress(e.target.value)} 
                placeholder="Full residential address" 
              />
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-slate-400" />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vehicle Information</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FInput 
                  label="Registration Plate *" 
                  value={vehicleReg} 
                  onChange={e => setVehicleReg(e.target.value.toUpperCase())} 
                  placeholder="MN21 XKT" 
                />
                <div className="sm:col-span-2">
                  <FInput 
                    label="Vehicle Make & Model *" 
                    value={vehicleName} 
                    onChange={e => setVehicleName(e.target.value)} 
                    placeholder="Ford Transit Custom" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FSelect label="Vehicle Type" value={vehicleType} onChange={e => setVehicleType(e.target.value)}>
                  <option>Van</option>
                  <option>Truck</option>
                  <option>Lorry</option>
                  <option>Car</option>
                  <option>Motorcycle</option>
                  <option>Trailer</option>
                </FSelect>

                <FInput 
                  label="Year of Manufacture" 
                  value={vehicleYear} 
                  onChange={e => setVehicleYear(e.target.value)} 
                  placeholder="2021"
                  type="number"
                />

                <FSelect label="Fuel Type" value={vehicleFuelType} onChange={e => setVehicleFuelType(e.target.value)}>
                  <option>Diesel</option>
                  <option>Petrol</option>
                  <option>Electric</option>
                  <option>Hybrid</option>
                  <option>CNG</option>
                  <option>LPG</option>
                </FSelect>
              </div>

              <FInput 
                label="Cargo Capacity (optional)" 
                value={vehicleCapacity} 
                onChange={e => setVehicleCapacity(e.target.value)} 
                placeholder="e.g. 3.5 tonnes, 12 pallets, 15 m³" 
              />
            </div>

            <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 mt-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-violet-900 mb-1">You're almost ready!</p>
                  <p className="text-[11px] text-violet-700 leading-relaxed">
                    Complete this step to initialize your fleet. You can add more drivers, vehicles, and routes from the Settings page after setup.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Btn variant="secondary" onClick={handleBack} className="flex-1 justify-center py-3">Back</Btn>
              <button
                onClick={handleComplete}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-violet-100 cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
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
