# FleetOps Command Center

A modern, clean, B2B Fleet Management and Operations platform built with a high-fidelity SaaS dashboard interface. Designed for transport business owners to run everyday operations, process payroll, monitor fuel efficiency, assign orders, and audit financial health.

## 🚀 Key Modules

### 1. Operations Workspace
* **Dashboard Overview**: Tracks real-time KPIs (Today's Orders, Today's Revenue, Fuel/Garage Expenses, Driver Payroll, and Net Profits) alongside dynamic Recharts weekly revenue-vs-expense graphs.
* **Orders Dispatcher**: Simple scheduler to assign daily routes, drivers, and vehicles with color-coded status states (Assigned, Completed).
* **Fuel Analytics**: Records fuel refills, mileage log metrics, and automatically computes average mileage and fuel costs per vehicle.
* **Garage Tracker**: Monitors vehicle repairs and charges categorized by issue types (Service, Tyre, Engine, Oil Change, Brake, Accident).
* **Alert Desk**: System-generated alerts displaying operational insights (e.g. highest spending vehicles, multiple garage entries, unassigned drivers).
* **GPS Tracking Simulator**: A placeholder section featuring high-fidelity visuals demonstrating upcoming live tracking features.

### 2. Financial Management
* **DPD Settlements**: Records client income ledger entries linked to specific drivers, vehicles, and routes.
* **Driver Payroll**: Manages weekly payments, including salary rates, bonuses, advance deductions, and total paid outputs.
* **Financial Summary**: Generates automated summaries of total income against expenses (Fuel + Garage + Payroll) to display net profit margins.

### 3. SaaS Admin Console (Super Admin)
* **Overview Analytics**: Interactive area charts showing Monthly Recurring Revenue (MRR) trends and registered subscriber growth.
* **Customer Directory**: Active tenant viewer supporting plan upgrades, account suspensions, and live auditing (impersonation mode).
* **Ledger Invoices**: Manual billing record logger to create, inspect, and adjust invoice payment states.
* **Activity Audit Logs**: Scrollable terminal containing live server container messages tracking registrations, settings updates, and logins.
* **Support Desk**: Direct resolver to view customer inquiries, write automated replies, and update ticket statuses.
* **Global Configs**: Control center to modify Premium/Enterprise plan pricing rates, toggle Maintenance Mode, and lock/unlock registrations.

---

## 🛠️ Technology Stack
* **Vite** & **React** (TypeScript)
* **Tailwind CSS** (Premium theme values & layout tokens)
* **Recharts** (Interactive financial charts)
* **Lucide React** (Fine-line consistent iconography)
* **Sonner** (Rich toast notifications)

---

## 📦 Getting Started

### 1. Installation
Clone the repository, navigate into the project directory, and install dependencies:
```bash
npm install
```

### 2. Run Local Development Server
Launch the local Vite server:
```bash
npm run dev
```
Open [http://localhost:5174/](http://localhost:5174/) in your browser.

### 3. Production Build
Compile and minify code for hosting:
```bash
npm run build
```

---

## 🔑 Credentials for Testing

### A. Super Admin Dashboard (SaaS Platform)
* **Email:** `admin@fleetops.io`
* **Password:** `admin123`

### B. Standard Client Workspaces (Tenant Fleet OS)
* **Alpha Logistics** (Active - Premium Plan)
  * **Email:** `alpha@logistics.com`
  * **Password:** `alpha123`
* **Speedy Delivery Co** (Active - Premium Plan)
  * **Email:** `speedy@delivery.io`
  * **Password:** `speedy123`
* **Local Cabs & Transport** (Suspended Account)
  * **Email:** `local_cabs@transport.com`
  * **Password:** `local123`
* **New Biz Fleet** (Pending Onboarding wizard)
  * **Email:** `new_biz@startup.com`
  * **Password:** `new123`
