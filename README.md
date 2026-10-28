# 🇮🇳 Billease: Indian Retail Billing & Inventory Management OS

[![Scala 3.5.2](https://img.shields.io/badge/backend-Scala%203.5.2-red.svg)](https://www.scala-lang.org/)
[![SolidJS 1.9](https://img.shields.io/badge/frontend-SolidJS%201.9-2c4f7c.svg)](https://www.solidjs.com/)
[![Tapir + Http4s](https://img.shields.io/badge/api-Tapir%20%2B%20Http4s-blue.svg)](https://tapir.softwaremill.com/)
[![OpenAPI 3.1 & Swagger](https://img.shields.io/badge/docs-OpenAPI%203.1%20%2F%20Swagger%20UI-85ea2d.svg)](http://localhost:3000/docs)
[![OIDC Certified](https://img.shields.io/badge/auth-AuthForest%20OIDC-darkgreen.svg)](https://github.com/fvrvz/authforest)
[![TypeScript Strict](https://img.shields.io/badge/typescript-zero%20'any'-brightgreen.svg)](file:///AGENT.md)

**Billease** is a high-speed, multi-tenant billing, inventory, and customer credit ledger (Khata) platform engineered specifically for Indian retailers, kirana stores, supermarkets, and pharmacies.

Built with a high-performance **Scala 3** backend (Tapir, Http4s, Cats Effect, Circe, Doobie) and an ultra-reactive **SolidJS** frontend (Vite, Tailwind CSS, `oidc-client-ts`).

---

## 🌟 Indian Retail Specifics

### 1. Kirana-Simple GST Engine
- **One Simple Question**: *"Do you have a GST number?"* `[ Yes ]` or `[ No ]`.
- **Zero Jargon**: Small unregistered stores issue clean **Cash Memos / Retail Receipts** with no tax jargon.
- **Automated Intelligence**: Enter a 15-digit GSTIN (e.g. `27AABCU9603R1ZM`), and Billease automatically detects the home state (`27` = Maharashtra) and calculates intra-state splits (**CGST 50% + SGST 50%**) or inter-state (**IGST 100%**) silently.
- **5 One-Touch GST Slabs**: `0%` (exempt staples), `5%`, `12%`, `18%`, `28%`.

### 2. Legal Metrology Act (MRP Compliance)
- Selling above Maximum Retail Price (MRP) is illegal in India.
- Billease enforces: `Selling Price ≤ Batch MRP`. If a cashier enters an invalid price, the system rejects it immediately.

### 3. Expiry & FEFO Picking (Pharmacies & Groceries)
- **First-Expired, First-Out (FEFO)** auto-selection for batch inventory.
- Real-time shelf-life badges:
  - 🟢 **Good**: > 30 days before expiration.
  - 🟡 **Expiring Soon**: < 30 days remaining (prompting discount clearance).
  - 🔴 **Expired**: Blocked from billing to prevent legal liability.

### 4. High-Speed POS Billing Register
- **100% Keyboard-Navigable** for blazing-fast checkout counters:
  - `F2`: Focus barcode scanner / instant product search.
  - `F4`: 💵 One-touch Cash checkout with cash tendered & auto change calculator.
  - `F5`: 📱 Dynamic UPI QR code popup for scan & pay.
  - `F6`: 📒 Udhaar / Customer Khata charge.
- **Discounts, Coupons & Loyalty**:
  - Item-level and bill-level flat or percentage discounts.
  - Promotional coupon engine (`DIWALI50`, `SAVE10`) with minimum order value and discount caps.
  - Customer Loyalty Points: Earn points per ₹100 spent and redeem points at checkout for instant cash deductions.

### 5. Customer Khata (Udhaar Book) & 1-Click WhatsApp Reminders
- Customer credit limit tracking, ledger balance history, and payment recording.
- **1-Click WhatsApp Payment Reminder**: Automatically formats an English / Hindi payment reminder link (`https://wa.me/...`) with store name, customer balance, and direct UPI payment instructions.

### 6. Dynamic NPCI UPI QR Code
- Generates NPCI-compliant UPI payment intent URIs:
  `upi://pay?pa=<vpa>&pn=<name>&am=<total>&cu=INR&tn=<invoice>`
- Displays high-contrast QR code on the checkout screen and prints it directly on receipts for scanning via Google Pay, PhonePe, Paytm, BHIM, or CRED.

### 7. ESC/POS Thermal Receipt Printing
- Native formatting for **80mm (3-inch)** and **58mm (2-inch)** thermal roll printers (TVS, NGX, Everycom, Pegasus, Epson).
- Formats store name, legal entity, address, phone, GSTIN, itemized rates, discounts, tax splits, and UPI QR code.

---

## 🔐 Authentication & Security

### 🌲 AuthForest OIDC Integration
Billease integrates with **[AuthForest](https://github.com/fvrvz/authforest)**, an OAuth2 / OIDC compliant Identity Provider.

- **Standard OIDC Client**: Powered by the certified **`oidc-client-ts`** (v3.5.0) library — no custom token parsing or reinventing the wheel.
- **Session-Based State Store**: Adheres to OAuth2 Security Best Current Practices (BCP) using `WebStorageStateStore({ store: window.sessionStorage })` to ensure token isolation per browser tab.
- **PKCE Authorization Code Flow**: Secure public client flow for browser single-page applications.
- **Direct RS256 JWKS Verification**: Scala backend verifies JWT signatures directly against AuthForest's JWKS endpoint (`/.well-known/jwks.json`).
- **Zero `any` TypeScript**: 100% strict TypeScript types across the entire frontend adhering to [`AGENT.md`](file:///AGENT.md).
- **Fast Role Switching**: Quick demo switcher in the top bar to easily test between `CASHIER`, `STORE_ADMIN`, and `SUPER_ADMIN` roles.

---

## 📖 Swagger & API Documentation

Billease exposes fully typed OpenAPI 3.1.0 specifications and interactive Swagger UI documentation generated by **Tapir**:

| Documentation Service | URL | Description |
| :--- | :--- | :--- |
| **Interactive Swagger UI (via Frontend Proxy)** | [http://localhost:3000/docs/](http://localhost:3000/docs/) | Access directly from your browser or via the **Swagger** button in the top navigation bar. |
| **Direct Backend Swagger UI** | [http://localhost:8081/docs/](http://localhost:8081/docs/) | Directly served by the Scala 3 Http4s Ember engine. |
| **OpenAPI 3.1.0 YAML Specification** | [http://localhost:3000/docs/docs.yaml](http://localhost:3000/docs/docs.yaml) | Raw OpenAPI schema for importing into Postman, Insomnia, or code generators. |

### Summary of REST Endpoints

- **Authentication**: `POST /api/auth/login`, `POST /api/auth/oidc/token`
- **Tenants & Settings**: `GET /api/tenants/current`, `PUT /api/tenants/current`
- **SuperAdmin**: `GET /api/admin/tenants`, `POST /api/admin/tenants`, `PUT /api/admin/tenants/{id}/status`
- **Products & Batches**: `GET /api/products`, `POST /api/products`, `POST /api/products/{id}/batches`, `GET /api/products/alerts`
- **Khata Ledger**: `GET /api/customers`, `POST /api/customers`, `GET /api/customers/{id}/khata`, `POST /api/customers/{id}/khata`
- **Invoices & Billing**: `POST /api/billing/invoices`, `GET /api/billing/invoices/{id}`, `GET /api/billing/invoices/{id}/receipt`
- **Coupons & Loyalty**: `GET /api/coupons`, `POST /api/coupons`, `POST /api/coupons/validate`
- **Notifications**: `POST /api/notifications/whatsapp/khata-reminder`

---

## 🏗️ Architecture & Technology Stack

```
billease/
├── backend/                       # Scala 3 (Tapir + Http4s + Cats Effect + Doobie)
│   ├── src/main/scala/com/billease/
│   │   ├── api/                   # Tapir typed endpoints & Http4s server routes
│   │   ├── auth/                  # Runtime OIDC validator & JWKS cache
│   │   ├── config/                # PureConfig runtime loader
│   │   ├── domain/                # Models, Enums, GstCalculator
│   │   ├── service/               # Billing, Tenant, Product, Khata, Coupon, Notification
│   │   └── Main.scala             # Ember HTTP server + Flyway migration bootstrap
│   └── src/main/resources/
│       ├── application.conf       # Server, Database, OIDC & Notification configs
│       └── db/migration/          # Flyway PostgreSQL V1 schema & seeds
├── frontend/                      # SolidJS 1.9 + Vite 6 + Tailwind CSS v4 + TypeScript
│   ├── src/
│   │   ├── components/            # POSRegister, ProductCatalog, CustomerKhata, StoreSettings, etc.
│   │   ├── context/               # AuthContext (oidc-client-ts, role switcher & tenant state)
│   │   ├── api/                   # REST client with type-safe schemas
│   │   └── App.tsx                # Main workspace & layout
│   └── nginx.conf                 # Multi-stage production Nginx with /api/ and /docs/ reverse proxy
├── docker-compose.yml             # PostgreSQL 16, Scala 3 Backend, SolidJS Frontend
├── AGENT.md                       # AI Agent & Developer coding guidelines (Strict TypeScript rules)
└── README.md
```

---

## 🚀 Quickstart with Docker Compose

Billease runs fully containerized via multi-stage Docker builds.

### 1. Launch Platform

```bash
docker compose up -d
```

### 2. Service Access Points

| Service | Port | Host URL | Description |
| :--- | :--- | :--- | :--- |
| **SolidJS Frontend & POS** | `3000` | [http://localhost:3000](http://localhost:3000) | Main retail portal with POS, Khata, Inventory & Settings |
| **Swagger UI** | `3000` / `8081` | [http://localhost:3000/docs/](http://localhost:3000/docs/) | Interactive API Documentation |
| **Scala 3 Backend** | `8081` | [http://localhost:8081/api](http://localhost:8081/api) | High-concurrency Http4s Ember API |
| **PostgreSQL 16 Database** | `5433` | `localhost:5433` | Database: `billease`, User: `billease` |
| **AuthForest OIDC (External)** | `8080` / `5173` | [http://localhost:8080](http://localhost:8080) | Running AuthForest IdP instance |

---

## 🧪 Demo User Accounts

The database comes pre-seeded with sample retail data for **Ganesh Supermarket, Pune**:

| Role | Username | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Store Owner** | `ganesh_owner` | `store123` | Full store control: products, coupons, Khata limits, store branding & UPI ID |
| **Cashier** | `cashier1` | `cashier123` | High-speed POS billing, barcode scan, thermal printing, returns (cost prices hidden) |
| **Super Admin** | `superadmin` | `admin123` | Platform-wide tenant onboarding, feature package management, global analytics |

> 💡 **Tip:** You can switch roles instantaneously in the top-right role pill or click **AuthForest OIDC** to authenticate against an external OpenID Connect provider.

---

## 🛠️ Verification & Development Commands

### Frontend Typecheck & Build
```bash
cd frontend
npm run check    # Runs `tsc --noEmit` ensuring zero 'any' and zero type warnings
npm run build    # Produces production Vite assets
```

### Backend Test & Assembly
```bash
cd backend
sbt test         # Runs ScalaTest suite
sbt stage        # Prepares native application packaging
```

### Docker Logs
```bash
docker compose logs -f billease-backend
docker compose logs -f billease-frontend
```

---

## 📜 License
Billease is distributed under the MIT License.
