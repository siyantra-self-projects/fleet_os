import React, { useState, useEffect, useMemo } from "react"
import { Toaster, toast } from "sonner"

import {
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
} from "./components/UI"

import Header from "./components/Header"
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

const DEFAULT_PLATFORM_CONFIG: PlatformSettings = {
  premiumPrice: 99,
  enterprisePrice: 499,
  maintenanceMode: false,
  registrationOpen: true,
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const session = localStorage.getItem("fleet_os_session")
    if (!session) return null
    try {
      const parsed = JSON.parse(session)
      return {
        ...parsed,
        role: parsed.role ?? "user",
      }
    } catch {
      return null
    }
  })

  const [impersonatingEmail, setImpersonatingEmail] = useState<string | null>(null)

  const [page, setPage] = useState<Page>(() => {
    const session = localStorage.getItem("fleet_os_session")
    if (session) {
      try {
        const u = JSON.parse(session)
        if (u.role === "platform") return "platform"
      } catch (e) {}
    }
    return "dashboard"
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [fuel, setFuel] = useState<FuelEntry[]>([])
  const [garage, setGarage] = useState<GarageEntry[]>([])
  const [payroll, setPayroll] = useState<PayrollEntry[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
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
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw) as UserAccount[]
      return parsed.map(user => ({ ...user, role: user.role ?? "user" }))
    } catch {
      return []
    }
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


  const handleLoginSuccess = (user: UserAccount) => {
    const normalizedUser = { ...user, role: user.role ?? "user" }
    setCurrentUser(normalizedUser)
    localStorage.setItem("fleet_os_session", JSON.stringify(normalizedUser))
    setPage(normalizedUser.role === "platform" ? "platform" : "dashboard")
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
    setRoutes([])
    setCfg(c => ({ ...c, currency: curr }))
  }


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
  const isPlatformAdmin = currentUser.role === "platform"
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
      {(!isPlatformAdmin || isImpersonating) && (
        <Header
          page={page}
          setPage={setPage}
          companyName={activeCompanyName}
          userEmail={isImpersonating ? impersonatingEmail : currentUser.email}
          onLogout={handleLogout}
          isAdmin={isPlatformAdmin}
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

        {page === "platform" && isPlatformAdmin && !isImpersonating && (
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
          <AlertsPage drivers={drivers} vehicles={vehicles} fuel={fuel} garage={garage} orders={orders} onMenu={onMenu} currencySymbol={currencySymbol} cfg={cfg} setCfg={setCfg} />
        )}
        {page === "tracking" && <TrackingPage onMenu={onMenu} />}
        {(page === "settings-drivers" || page === "settings-vehicles" || page === "settings-routes" || page === "settings-weekly") && (
          <SettingsPages drivers={drivers} setDrivers={setDrivers} vehicles={vehicles} setVehicles={setVehicles} routes={routes} setRoutes={setRoutes} />
        )}
      </div>
    </div>
  )
}
