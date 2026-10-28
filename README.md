# 🇮🇳 Billease: Indian Retail Billing & Inventory Management OS

Billease is a high-speed, multi-tenant billing, inventory, and customer ledger (Khata) platform engineered specifically for Indian retailers, kirana stores, supermarkets, and pharmacies.

Built with **Scala 3** (Tapir, Http4s, Cats Effect, Circe, Doobie) for a rock-solid, concurrent backend and **SolidJS** (Vite, Tailwind CSS) for zero-latency, reactive POS operations.

---

## 🌟 Key Features Tailored for Indian Retail

### 1. Kirana-Simple GST Engine
- **1-Question GST Setup**: *"Do you have a GST number?"* `[ Yes ]` or `[ No ]`.
- **Zero Jargon**: Small unregistered stores print clean **Cash Memos / Retail Receipts** with no tax confusion.
- **Auto-Intelligence for Registered Stores**: Enter 15-digit GSTIN; Billease auto-detects the home state code (e.g. `27` for Maharashtra, `09` for UP) and silently calculates intra-state (CGST 50% + SGST 50%) or inter-state (IGST) in the background.
- **5 One-Touch GST Chips**: `[ 0% ]`, `[ 5% ]`, `[ 12% ]`, `[ 18% ]`, `[ 28% ]`.

### 2. High-Speed POS Billing Register
- **100% Keyboard-Navigable**:
  - `F2`: Focus barcode scanner / product search input.
  - `F4`: 💵 One-touch Cash checkout with cash tendered & change calculator.
  - `F5`: 📱 Dynamic UPI QR code popup for scan & pay.
  - `F6`: 📒 Udhaar / Customer Khata charge.
- **Discounts, Coupons & Loyalty**:
  - Item-level percentage discount.
  - Bill-level flat or percentage discount.
  - Promo coupons (e.g., `DIWALI50`, `SAVE10`) with minimum order value and discount caps.
  - Customer Loyalty Points: Earn points per ₹100 spent and redeem points at checkout for instant cash discounts.

### 3. Customer Khata (Udhaar Book)
- Track customer credit limits, outstanding balances, and payment history.
- **1-Click WhatsApp Payment Reminder**: Generates a polite, pre-formatted Hindi/English message link (`https://wa.me/...`) for instant customer notification with outstanding balance.
- **Receive Payment Modal**: Record cash or UPI payments and auto-update the ledger.

### 4. Dynamic NPCI UPI QR Code
- Automatically generates UPI payment URI (`upi://pay?pa=<vpa>&pn=<name>&am=<total>&cu=INR&tn=<invoice>`).
- Displays a high-contrast QR code on the checkout screen and embeds it on printed receipts for instant customer scan-and-pay via PhonePe, Google Pay, Paytm, or BHIM.

### 5. ESC/POS Thermal Receipt Printing
- Supports standard **80mm (3-inch)** and **58mm (2-inch)** thermal roll printers (TVS, NGX, Everycom, Pegasus).
- Formats store name, legal entity, address, phone, GSTIN, itemized rates, discounts, tax splits, and UPI QR code.

### 6. Multi-Tenancy & Role-Based Access Control (RBAC)
- **Super Admin**: Provisions retailers/vendors, configures feature packages (WhatsApp alerts, loyalty, thermal print), and inspects platform metrics.
- **Store Owner (Vendor)**: Manages store branding (logo, banner, invoice footer, UPI ID), catalog, employees, and reports.
- **Cashier**: Fast POS checkout, returns, and customer lookups. Cost prices and profit margins are hidden.

### 7. Runtime OIDC External Authentication
- Configurable via runtime environment variables (`OIDC_ENABLED`, `OIDC_ISSUER_URL`, `OIDC_JWKS_URL`, `OIDC_CLIENT_ID`).
- Supports **Keycloak**, **Auth0**, **Zitadel**, or **Google Workspace** without code recompilation.
- Built-in local mock mode for offline testing.

---

## 🏗️ Architecture & Technology Stack

```
billease/
├── backend/                  # Scala 3 (Tapir + Http4s + Cats Effect + Doobie)
│   ├── src/main/scala/com/billease/
│   │   ├── api/              # Tapir typed endpoints & Http4s server routes
│   │   ├── auth/             # Runtime OIDC validator & JWKS cache
│   │   ├── config/           # PureConfig runtime loader
│   │   ├── domain/           # Models, Enums, GstCalculator
│   │   ├── service/          # Billing, Tenant, Product, Khata, Coupon, Notification
│   │   └── Main.scala        # Ember HTTP server + Flyway migration bootstrap
│   └── src/main/resources/
│       ├── application.conf  # Server, Database, OIDC & Notification configs
│       └── db/migration/     # Flyway PostgreSQL V1 schema & seeds
├── frontend/                 # SolidJS 1.9 + Vite 6 + Tailwind CSS v4
│   ├── src/
│   │   ├── components/       # POSRegister, ProductCatalog, CustomerKhata, StoreSettings, etc.
│   │   ├── context/          # AuthContext (Role switching & tenant state)
│   │   ├── api/              # REST client with offline fallback
│   │   └── App.tsx           # Main workspace & layout
├── docker-compose.yml        # PostgreSQL, Scala 3 Backend, SolidJS Frontend
└── README.md
```

---

## 🚀 Quickstart with Docker

### 1. Launch Platform
```bash
docker compose up -d
```

### 2. Access the Applications
- **SolidJS POS & Store Portal**: [http://localhost:3000](http://localhost:3000)
- **Scala 3 REST API & Swagger UI**: [http://localhost:8080/docs](http://localhost:8080/docs)
- **PostgreSQL Database**: `localhost:5432` (`billease` / `billease_secret`)

---

## 🧪 Demo User Logins (Switch via Top-Right Pill in UI)
1. **Store Owner**: `ganesh_owner` / `store123` (Full store branding, products, coupons, and reports)
2. **Cashier**: `cashier1` / `cashier123` (Fast POS billing and receipt printing)
3. **Super Admin**: `superadmin` / `admin123` (Platform-wide tenant onboarding and feature configuration)
