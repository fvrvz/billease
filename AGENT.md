# 🤖 AI Agent Engineering Guidelines & Strict Constraints for Billease

This document defines the strict engineering guidelines, constraints, and non-negotiable rules for any AI agent interacting with, extending, or maintaining the **Billease** codebase.

---

## 🚫 1. Non-Negotiable Type Safety: ZERO `any` Policy
- **NEVER use the `any` datatype in TypeScript under any circumstance.**
- If a type is uncertain or external, use:
  - Strongly typed domain interfaces (`ProductCreateInput`, `CustomerCreateInput`, `DecodedOidcClaims`, etc.).
  - `unknown` accompanied by explicit type narrowing or type guards (e.g., `if (err instanceof Error)`).
  - Generics with proper bounds.
  - Discriminated unions for multi-state data models.
- Any pull request or modification introducing `: any` or `as any` is strictly prohibited.
- Always run `npx vite build` in `frontend/` before completing any change to ensure zero TypeScript compiler warnings or errors.

---

## 🇮🇳 2. Indian Retail Compliance & Domain Laws
Every AI agent must honor the legal and financial rules governing Indian retail:

1. **MRP Legal Cap (Legal Metrology Act)**:
   - Selling price can NEVER exceed MRP: `selling_price <= mrp`.
   - Violation of this in India is an offense. The billing engine and database must enforce this constraint.
2. **Simplified GST & Zero-Confusion UX**:
   - Small shops without GST must see a simple interface with zero tax arithmetic. Their bills must read **"Retail Cash Memo"** or **"Bill of Supply"**, and NO tax may be levied.
   - Registered stores must have their home state auto-detected from the first 2 digits of their 15-digit GSTIN (e.g. `27` = Maharashtra, `09` = Uttar Pradesh, `33` = Tamil Nadu).
   - Intra-state sales automatically split 50-50 into **CGST** and **SGST**. Inter-state sales apply **IGST**.
   - Retail prices in India are almost always MRP-inclusive (tax-inclusive). Use backward extraction:
     $$\text{Taxable Amount} = \frac{\text{Gross Total}}{1 + \frac{\text{GST Rate}}{100}}$$
3. **FEFO Inventory Picking**:
   - Always deduct stock using **FEFO (First-Expiry-First-Out)** to prevent expired FMCG/pharma goods from sitting on shelves.
4. **Dynamic NPCI UPI QR Codes**:
   - Standard format: `upi://pay?pa=<vpa>&pn=<name>&am=<amount>&cu=INR&tn=<invoice>`.

---

## 🔐 3. Authentication & IDP (AuthForest Integration)
- **Do NOT reinvent authentication.**
- The platform uses **AuthForest** (`fvrvz/authforest`) as its external OpenID Connect (OIDC) and OAuth 2.0 Identity Provider.
- Follow standard OIDC specifications implemented by AuthForest:
  - Discovery: `GET /.well-known/openid-configuration`
  - Public Keys: `GET /.well-known/jwks.json`
  - Authorization: `GET /oauth2/authorize` (with PKCE `S256` for SPA clients)
  - Token Exchange: `POST /oauth2/token`
  - User Info: `GET /oauth2/userinfo`
- Backend verifies RS256 signatures dynamically via `Nimbus` / `RemoteJWKSet`.
- Never disable or bypass access controls, permission checks, or tenant isolation checks.

---

## 🏢 4. Multi-Tenant Role Isolation (RBAC)
- Every database query for tenant data MUST be scoped by `tenant_id`:
  ```sql
  WHERE tenant_id = $tenantId AND ...
  ```
- **Role Hierarchy**:
  1. `SUPER_ADMIN`: Platform owner. Manages tenants, feature flags, global audit logs.
  2. `STORE_ADMIN`: Store owner/vendor. Configures branding, catalog, staff, coupons, and profit margins.
  3. `MANAGER`: Can inward inventory, view purchase costs, and approve discounts.
  4. `CASHIER`: Counter billing only. **Purchase costs, supplier payables, and profit margins MUST be hidden from Cashiers.**

---

## ⚡ 5. Scala 3 Backend Architecture
- **Language**: Scala 3.5+ with functional effect system (**Cats Effect 3**).
- **APIs**: **Tapir** for strictly typed endpoint contracts; auto-generated OpenAPI documentation.
- **Serialization**: Pure compile-time derivation via **Circe**.
- **Database**: Functional SQL via **Doobie** with Hikari connection pool and **Flyway** schema migrations.
- **Error Handling**: Never use untyped exceptions in business services. Use `IO.raiseError` or `Either[String, A]`.

---

## 🖥️ 6. SolidJS Frontend Performance
- Take advantage of SolidJS fine-grained reactivity (`createSignal`, `createMemo`, `For`, `Show`).
- Do not introduce heavy runtime UI dependencies; preserve the fast, lightweight sub-150kB bundle size for instantaneous POS counter response.
- Maintain full keyboard accessibility (`F2` search, `F4` cash, `F5` UPI, `F6` Khata).

---

## 🌿 7. Git Workflow, Branch Protection & Conventional Commits
All contributors and AI agents must strictly comply with the repository branching and PR policies enforced via GitHub branch protection, rulesets, and CI guards:

1. **Branch Protection**:
   - `main`: Production release branch.
     - **Direct pushes and force pushes are strictly disabled.**
     - **PRs can only originate from `develop` or `hotfix/*` branches.**
   - `develop`: Integration branch.
     - **Direct pushes and force pushes are strictly disabled.**
     - **All PRs must originate from conventional branches**: `feature/*`, `bugfix/*`, `hotfix/*`, `docs/*`, `refactor/*`, `chore/*`, `test/*`.
2. **Conventional Commits**:
   - All commit messages and PR titles must strictly follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
     ```
     <type>(<scope>): <short description>
     ```
   - **Allowed Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
   - Examples:
     - `feat(pos): add dynamic upi qr modal`
     - `fix(khata): prevent negative credit limit`
     - `docs(api): update swagger instructions`
3. **Automated CI Policy Enforcement**:
   - The status check `validate-pr-policy` runs on all PRs targeting `main` and `develop` and must pass before merging.


