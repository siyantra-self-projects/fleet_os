import React, { useState, useEffect, useMemo } from "react"
import { Toaster, toast } from "sonner"

import {
  TODAY,
  CURRENCY_SYMBOLS,
  Page,
  Driver,
  Vehicle,
  Route,
  Order,
  FuelEntry,
  GarageEntry,
  PayrollEntry,
  Settlement,
  AppConfig,
  UserAccount,
  PlatformPayment,
  PlatformActivityLog,
  PlatformTicket,
  PlatformSettings,
  getRelativeDate,
} from "./components/UI"

import Header from "./components/Header"
import Sidebar from "./components/Sidebar"
import AuthPage from "./components/AuthPage"
import OnboardingPage from "./components/OnboardingPage"
import PlatformPage from "./components/PlatformPage"

import DashboardPage from "./pages/DashboardPage"
import OrdersPage from "./pages/OrdersPage"
import TrackingPage from "./pages/TrackingPage"
import FuelPage from "./pages/FuelPage"
import GaragePage from "./pages/GaragePage"
import PayrollPage from "./pages/PayrollPage"
import SettlementPage from "./pages/SettlementPage"
import FinancialPage from "./pages/FinancialPage"
import AlertsPage from "./pages/AlertsPage"
import SettingsPages from "./pages/SettingsPages"

const DRIVERS_SEED: Driver[] = [
  { id: "d1", name: "Clara Jensen", phone: "07700 900077", license: "JENSEN90123CJ4KL", status: "Active" },
  { id: "d2", name: "Michael Torres", phone: "07700 900543", license: "TORRES45678MT9OP", status: "Active" },
  { id: "d3", name: "Sofia Ricci", phone: "07700 900789", license: "RICCS123456SR7EF", status: "Active" },
  { id: "d4", name: "Olivia Novak", phone: "07700 900321", license: "NOVAK345678ON2GH", status: "Active" },
]

const VEHICLES_SEED: Vehicle[] = [
  { id: "v1", reg: "MN21 XKT", name: "Volvo FH16", type: "Truck", status: "Active" },
  { id: "v2", reg: "LN70 RPJ", name: "Mercedes Actros", type: "Truck", status: "Active" },
  { id: "v3", reg: "BD19 LKY", name: "MAN TGX", type: "Truck", status: "Active" },
  { id: "v4", reg: "YH68 TML", name: "Scania R500", type: "Truck", status: "Active" },
]

const ROUTES_SEED: Route[] = [
  { id: "r1", name: "Munich, DE → Rotterdam, NL" },
  { id: "r2", name: "Warsaw, PL → Vienna, AT" },
  { id: "r3", name: "Prague, CZ → Zurich, CH" },
  { id: "r4", name: "Madrid, ES → Lyon, FR" },
]

const ORDERS_SEED: Order[] = [
  { id: "875412903", date: "2025-10-05", driverId: "d1", vehicleId: "v1", routeId: "r1", status: "Assigned" },
  { id: "458729654", date: "2025-10-05", driverId: "d2", vehicleId: "v2", routeId: "r2", status: "Completed" },
  { id: "913562478", date: "2025-10-05", driverId: "d3", vehicleId: "v3", routeId: "r3", status: "Picked up" },
  { id: "324561327", date: "2025-09-15", driverId: "d4", vehicleId: "v4", routeId: "r4", status: "Assigned" },
]

const FUEL_SEED: FuelEntry[] = [
  { id: "f1", date: getRelativeDate(0), driverId: "d1", vehicleId: "v1", routeId: "r1", litres: 62, miles: 187, cost: 108.50 },
  { id: "f2", date: getRelativeDate(0), driverId: "d2", vehicleId: "v2", routeId: "r2", litres: 74, miles: 211, cost: 129.50 },
  { id: "f3", date: getRelativeDate(1), driverId: "d3", vehicleId: "v3", routeId: "r3", litres: 58, miles: 169, cost: 101.50 },
  { id: "f4", date: getRelativeDate(2), driverId: "d1", vehicleId: "v1", routeId: "r5", litres: 66, miles: 195, cost: 115.50 },
  { id: "f5", date: getRelativeDate(3), driverId: "d2", vehicleId: "v2", routeId: "r4", litres: 70, miles: 203, cost: 122.50 },
]

const GARAGE_SEED: GarageEntry[] = [
  { id: "g1", date: getRelativeDate(1), vehicleId: "v2", driverId: "d2", issueType: "Tyre", cost: 240 },
  { id: "g2", date: getRelativeDate(3), vehicleId: "v1", driverId: "d1", issueType: "Oil Change", cost: 85 },
  { id: "g3", date: getRelativeDate(4), vehicleId: "v3", driverId: "d3", issueType: "Service", cost: 320 },
  { id: "g4", date: getRelativeDate(12), vehicleId: "v2", driverId: "d2", issueType: "Brake", cost: 180 },
]

const PAYROLL_SEED: PayrollEntry[] = [
  { id: "p1", week: "W27 2025", date: getRelativeDate(2), driverId: "d1", salary: 650, bonus: 50, advance: 0, totalPaid: 700 },
  { id: "p2", week: "W27 2025", date: getRelativeDate(4), driverId: "d2", salary: 650, bonus: 75, advance: 100, totalPaid: 625 },
  { id: "p3", week: "W27 2025", date: getRelativeDate(6), driverId: "d3", salary: 600, bonus: 0, advance: 0, totalPaid: 600 },
]

const SETTLEMENTS_SEED: Settlement[] = [
  { id: "s1", date: getRelativeDate(0), vehicleId: "v1", driverId: "d1", routeId: "r1", amount: 3200 },
  { id: "s2", date: getRelativeDate(0), vehicleId: "v2", driverId: "d2", routeId: "r2", amount: 2950 },
  { id: "s3", date: getRelativeDate(1), vehicleId: "v3", driverId: "d3", routeId: "r3", amount: 2800 },
  { id: "s4", date: getRelativeDate(2), vehicleId: "v1", driverId: "d1", routeId: "r4", amount: 3100 },
]

const DEFAULT_PAYMENTS: PlatformPayment[] = [
  { id: "tx-901", date: getRelativeDate(2), companyName: "Alpha Logistics", email: "alpha@logistics.com", amount: 99, plan: "Premium", status: "Paid" },
  { id: "tx-902", date: getRelativeDate(5), companyName: "Speedy Delivery Co", email: "speedy@delivery.io", amount: 99, plan: "Premium", status: "Paid" },
  { id: "tx-903", date: getRelativeDate(10), companyName: "FleetOps Corporate", email: "admin@fleetops.io", amount: 499, plan: "Enterprise", status: "Paid" },
  { id: "tx-904", date: getRelativeDate(14), companyName: "Local Cabs & Transport", email: "local_cabs@transport.com", amount: 0, plan: "Free", status: "Pending" },
]

const DEFAULT_USERS: UserAccount[] = [
  { email: "admin@fleetops.io", passwordVal: "admin123", companyName: "FleetOps Corporate", onboarded: true, currency: "GBP (£)", plan: "Enterprise", status: "Active", joinedDate: getRelativeDate(30) },
  { email: "alpha@logistics.com", passwordVal: "alpha123", companyName: "Alpha Logistics", onboarded: true, currency: "USD ($)", plan: "Premium", status: "Active", joinedDate: getRelativeDate(15) },
  { email: "speedy@delivery.io", passwordVal: "speedy123", companyName: "Speedy Delivery Co", onboarded: true, currency: "EUR (€)", plan: "Premium", status: "Active", joinedDate: getRelativeDate(12) },
  { email: "local_cabs@transport.com", passwordVal: "local123", companyName: "Local Cabs & Transport", onboarded: true, currency: "GBP (£)", plan: "Free", status: "Suspended", joinedDate: getRelativeDate(25) },
  { email: "new_biz@startup.com", passwordVal: "new123", companyName: "New Biz Fleet", onboarded: false, currency: "USD ($)", plan: "Free", status: "Active", joinedDate: getRelativeDate(1) },
]

const DEFAULT_TICKETS: PlatformTicket[] = [
  { id: "tkt-101", email: "alpha@logistics.com", companyName: "Alpha Logistics", subject: "Route planner integration issue", message: "We are trying to connect the Manchester -> Birmingham route telemetry but GPS logs are failing. Can you assist?", status: "Open", date: getRelativeDate(1) },
  { id: "tkt-102", email: "speedy@delivery.io", companyName: "Speedy Delivery Co", subject: "Invoice mismatch", message: "Our last Premium billing statement recorded $99 but our invoice ledger displays £99. Standard currency is Euros.", status: "Resolved", date: getRelativeDate(4) },
  { id: "tkt-103", email: "local_cabs@transport.com", companyName: "Local Cabs & Transport", subject: "Suspension review request", message: "We settled our pending invoice via bank draft. Please restore our active account status.", status: "Open", date: getRelativeDate(2) },
]

const DEFAULT_LOGS: PlatformActivityLog[] = [
  { id: "log-1", date: getRelativeDate(15), email: "alpha@logistics.com", action: "Tenant registered & initiated free trial", level: "success" },
  { id: "log-2", date: getRelativeDate(15), email: "alpha@logistics.com", action: "Tenant completed onboarding wizard setup", level: "info" },
  { id: "log-3", date: getRelativeDate(14), email: "admin@fleetops.io", action: "Suspended local_cabs@transport.com for unpaid billing status", level: "warning" },
  { id: "log-4", date: getRelativeDate(10), email: "admin@fleetops.io", action: "Recorded payment of £499 for FleetOps Corporate invoice", level: "success" },
  { id: "log-5", date: getRelativeDate(5), email: "speedy@delivery.io", action: "Completed payment of €99 subscription plan fee", level: "success" },
  { id: "log-6", date: getRelativeDate(2), email: "alpha@logistics.com", action: "Upgraded subscription tier to Premium", level: "info" },
]

const DEFAULT_PLATFORM_CONFIG: PlatformSettings = {
  premiumPrice: 99,
  enterprisePrice: 499,
  maintenanceMode: false,
  registrationOpen: true,
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const session = localStorage.getItem("fleet_os_session")
    return session ? JSON.parse(session) : null
  })

  const [impersonatingEmail, setImpersonatingEmail] = useState<string | null>(null)

  const [page, setPage] = useState<Page>(() => {
    const session = localStorage.getItem("fleet_os_session")
    if (session) {
      try {
        const u = JSON.parse(session)
        if (u.email === "admin@fleetops.io") return "platform"
      } catch (e) {}
    }
    return "dashboard"
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const activeEmailForInit = (() => {
    const session = localStorage.getItem("fleet_os_session")
    if (session) {
      try {
        return JSON.parse(session).email
      } catch (e) {}
    }
    return null
  })()

  const getInitialData = (key: string, fallback: any) => {
    if (activeEmailForInit) {
      const raw = localStorage.getItem(`fleet_os_data_${activeEmailForInit}`)
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          if (parsed && parsed[key] && parsed[key].length > 0) {
            return parsed[key]
          }
        } catch (e) {}
      }
      return fallback
    }
    return []
  }

  const [drivers, setDrivers] = useState<Driver[]>(() => getInitialData("drivers", DRIVERS_SEED))
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => getInitialData("vehicles", VEHICLES_SEED))
  const [routes, setRoutes] = useState<Route[]>(() => getInitialData("routes", ROUTES_SEED))
  const [orders, setOrders] = useState<Order[]>(() => getInitialData("orders", ORDERS_SEED))
  const [fuel, setFuel] = useState<FuelEntry[]>(() => getInitialData("fuel", FUEL_SEED))
  const [garage, setGarage] = useState<GarageEntry[]>(() => getInitialData("garage", GARAGE_SEED))
  const [payroll, setPayroll] = useState<PayrollEntry[]>(() => getInitialData("payroll", PAYROLL_SEED))
  const [settlements, setSettlements] = useState<Settlement[]>(() => getInitialData("settlements", SETTLEMENTS_SEED))
  const [cfg, setCfg] = useState<AppConfig>({
    weekStart: "Monday",
    fuelUnit: "Litres",
    currency: "GBP (£)",
    fuelThreshold: "500",
    garageThreshold: "300",
    revenueTarget: "15000",
  })

  const currencySymbol = useMemo(() => CURRENCY_SYMBOLS[cfg.currency] || "£", [cfg.currency])

  const [users, setUsers] = useState<UserAccount[]>(() => {
    const raw = localStorage.getItem("fleet_os_users")
    return raw ? JSON.parse(raw) : []
  })

  const [payments, setPayments] = useState<PlatformPayment[]>(() => {
    const raw = localStorage.getItem("fleet_os_payments")
    return raw ? JSON.parse(raw) : []
  })

  const [platformLogs, setPlatformLogs] = useState<PlatformActivityLog[]>(() => {
    const raw = localStorage.getItem("fleet_os_platform_logs")
    return raw ? JSON.parse(raw) : []
  })

  const [platformTickets, setPlatformTickets] = useState<PlatformTicket[]>(() => {
    const raw = localStorage.getItem("fleet_os_platform_tickets")
    return raw ? JSON.parse(raw) : []
  })

  const [platformConfig, setPlatformConfig] = useState<PlatformSettings>(() => {
    const raw = localStorage.getItem("fleet_os_platform_config")
    return raw ? JSON.parse(raw) : DEFAULT_PLATFORM_CONFIG
  })

  useEffect(() => {
    const existingUsers = localStorage.getItem("fleet_os_users")
    if (!existingUsers) {
      localStorage.setItem("fleet_os_users", JSON.stringify(DEFAULT_USERS))
      setUsers(DEFAULT_USERS)
    }

    const existingPayments = localStorage.getItem("fleet_os_payments")
    if (!existingPayments) {
      localStorage.setItem("fleet_os_payments", JSON.stringify(DEFAULT_PAYMENTS))
      setPayments(DEFAULT_PAYMENTS)
    }

    const existingLogs = localStorage.getItem("fleet_os_platform_logs")
    if (!existingLogs) {
      localStorage.setItem("fleet_os_platform_logs", JSON.stringify(DEFAULT_LOGS))
      setPlatformLogs(DEFAULT_LOGS)
    }

    const existingTickets = localStorage.getItem("fleet_os_platform_tickets")
    if (!existingTickets) {
      localStorage.setItem("fleet_os_platform_tickets", JSON.stringify(DEFAULT_TICKETS))
      setPlatformTickets(DEFAULT_TICKETS)
    }

    const existingPlatformConfig = localStorage.getItem("fleet_os_platform_config")
    if (!existingPlatformConfig) {
      localStorage.setItem("fleet_os_platform_config", JSON.stringify(DEFAULT_PLATFORM_CONFIG))
      setPlatformConfig(DEFAULT_PLATFORM_CONFIG)
    }
  }, [])

  useEffect(() => {
    if (currentUser && !impersonatingEmail) {
      const data = { drivers, vehicles, routes, orders, fuel, garage, payroll, settlements, cfg }
      localStorage.setItem(`fleet_os_data_${currentUser.email}`, JSON.stringify(data))
    }
  }, [currentUser, impersonatingEmail, drivers, vehicles, routes, orders, fuel, garage, payroll, settlements, cfg])

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user)
    localStorage.setItem("fleet_os_session", JSON.stringify(user))
    if (user.email === "admin@fleetops.io") {
      setPage("platform")
    } else {
      setPage("dashboard")
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setImpersonatingEmail(null)
    localStorage.removeItem("fleet_os_session")
    setPage("dashboard")
    toast.info("Logged out successfully")
  }

  const handleOnboardingComplete = (
    company: string,
    curr: string,
    initialAssets: { driver: Driver; vehicle: Vehicle }
  ) => {
    if (!currentUser) return

    const updatedUser = { ...currentUser, companyName: company, currency: curr, onboarded: true }
    setCurrentUser(updatedUser)
    localStorage.setItem("fleet_os_session", JSON.stringify(updatedUser))

    const usersRaw = localStorage.getItem("fleet_os_users")
    const usersList: UserAccount[] = usersRaw ? JSON.parse(usersRaw) : []
    const updatedUsers = usersList.map(u => u.email === currentUser.email ? updatedUser : u)
    localStorage.setItem("fleet_os_users", JSON.stringify(updatedUsers))

    setDrivers([initialAssets.driver])
    setVehicles([initialAssets.vehicle])
    setRoutes(ROUTES_SEED)
    setCfg(c => ({ ...c, currency: curr }))
  }

  useEffect(() => {
    const cleared = localStorage.getItem("fleet_os_seeds_sync_v10")
    if (!cleared) {
      localStorage.removeItem("fleet_os_data_alpha@logistics.com")
      localStorage.removeItem("fleet_os_data_admin@fleetops.io")
      localStorage.removeItem("fleet_os_data_speedy@delivery.io")
      localStorage.setItem("fleet_os_seeds_sync_v10", "true")
      window.location.reload()
    }
  }, [])

  if (!currentUser) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      </>
    )
  }

  if (!currentUser.onboarded) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <OnboardingPage currentUser={currentUser} onOnboardingComplete={handleOnboardingComplete} />
      </>
    )
  }

  const onMenu = () => setSidebarOpen(true)
  const shared = { drivers, vehicles, routes, onMenu }
  const isSuperAdmin = currentUser.email === "admin@fleetops.io"
  const isImpersonating = impersonatingEmail !== null

  const handleImpersonate = (email: string) => {
    const match = users.find(u => u.email === email)
    if (match) {
      setImpersonatingEmail(email)
      setPage("dashboard")
      toast.success(`Entering Impersonation: Auditing dashboard of ${match.companyName}`)
    }
  }

  const handleExitImpersonate = () => {
    setImpersonatingEmail(null)
    setPage("platform")
    toast.success("Exited impersonation mode")
  }

  const activeCompanyName = isImpersonating
    ? users.find(u => u.email === impersonatingEmail)?.companyName ?? "Auditing..."
    : currentUser.companyName

  return (
    <div className="flex flex-col h-screen bg-[#F0F0F0] overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Toaster position="top-right" richColors />
      {(!isSuperAdmin || isImpersonating) && (
        <Header
          page={page}
          setPage={setPage}
          companyName={activeCompanyName}
          userEmail={isImpersonating ? impersonatingEmail : currentUser.email}
          onLogout={handleLogout}
          isAdmin={isSuperAdmin}
          isImpersonating={isImpersonating}
          onExitImpersonate={handleExitImpersonate}
        />
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {isImpersonating && (
          <div className="bg-amber-500 text-white text-xs font-semibold py-2 px-6 flex items-center justify-between shadow-sm z-30">
            <span>
              🔍 <strong>Read-Only Auditing Mode:</strong> Inspecting database for user: <strong>{impersonatingEmail}</strong> ({activeCompanyName}).
            </span>
            <button
              onClick={handleExitImpersonate}
              className="bg-white/20 hover:bg-white/30 text-white font-bold py-1 px-3 rounded-lg transition-all"
            >
              Exit Audit
            </button>
          </div>
        )}

        {page === "platform" && isSuperAdmin && !isImpersonating && (
          <PlatformPage
            users={users}
            setUsers={setUsers}
            payments={payments}
            setPayments={setPayments}
            onMenu={onMenu}
            onImpersonate={handleImpersonate}
            currencySymbol={currencySymbol}
            logs={platformLogs}
            setLogs={setPlatformLogs}
            tickets={platformTickets}
            setTickets={setPlatformTickets}
            platformConfig={platformConfig}
            setPlatformConfig={setPlatformConfig}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        )}

        {page === "dashboard" && (
          <DashboardPage {...shared} orders={orders} setOrders={setOrders} fuel={fuel} garage={garage} payroll={payroll} settlements={settlements} setPage={setPage} currencySymbol={currencySymbol} />
        )}
        {page === "orders" && (
          <OrdersPage {...shared} orders={orders} setOrders={setOrders} />
        )}
        {page === "fuel" && (
          <FuelPage {...shared} fuel={fuel} setFuel={setFuel} currencySymbol={currencySymbol} />
        )}
        {page === "garage" && (
          <GaragePage drivers={drivers} vehicles={vehicles} garage={garage} setGarage={setGarage} onMenu={onMenu} currencySymbol={currencySymbol} />
        )}
        {page === "payroll" && (
          <PayrollPage drivers={drivers} payroll={payroll} setPayroll={setPayroll} onMenu={onMenu} currencySymbol={currencySymbol} />
        )}
        {page === "settlement" && (
          <SettlementPage {...shared} settlements={settlements} setSettlements={setSettlements} currencySymbol={currencySymbol} />
        )}
        {page === "financial" && (
          <FinancialPage fuel={fuel} garage={garage} payroll={payroll} settlements={settlements} onMenu={onMenu} currencySymbol={currencySymbol} />
        )}
        {page === "alerts" && (
          <AlertsPage drivers={drivers} vehicles={vehicles} fuel={fuel} garage={garage} orders={orders} onMenu={onMenu} currencySymbol={currencySymbol} cfg={cfg} />
        )}
        {page === "tracking" && <TrackingPage onMenu={onMenu} />}
        {(page === "settings-drivers" || page === "settings-vehicles" || page === "settings-routes" || page === "settings-weekly") && (
          <SettingsPages drivers={drivers} setDrivers={setDrivers} vehicles={vehicles} setVehicles={setVehicles} routes={routes} setRoutes={setRoutes} />
        )}
      </div>
    </div>
  )
}
