# 🛡️ LoadFlow Backend Service API Gateway

The LoadFlow backend is built on the NestJS framework, using Prisma ORM with SQLite for persistent local database storage. It acts as the B2B SaaS central API engine, enforcing security scoping, RBAC permissions, and shipment status machine state validations.

---

## 🛠️ Tech Stack & Key Abstractions
- **Framework:** NestJS (V10+) - modular architecture with controllers, services, and dependency injection.
- **ORM:** Prisma Client - type-safe schema definitions and migration mapping.
- **Database:** SQLite (`prisma/dev.db`) - localized development storage.
- **Authentication:** Passport JWT strategy for organization and session scoping.
- **Validation:** class-validator & class-transformer Pipes for incoming DTOs.

---

## 🚀 API Endpoint Reference

All endpoints expect JSON payloads. Authenticated requests require a Bearer JWT Token in the `Authorization` header.

### 🔑 Authentication
- `POST /api/auth/register` - Register a new organization and default admin user.
- `POST /api/auth/login` - Authenticate user credentials and return a JWT access token.
- `GET /api/auth/me` - Fetch profile metadata for the authenticated user session.

### 🚚 Shipment Load Board (`/api/loads`)
- `GET /api/loads` - Fetch and paginate loads scoped to the current user's organization type (Broker, Carrier, or Shipper).
- `GET /api/loads/:id` - Fetch details for a specific shipment load.
- `POST /api/loads` - Create a new shipment (Broker / Shipper).
- `PATCH /api/loads/:id` - Update shipment attributes, assign carriers, or update statuses.
- `DELETE /api/loads/:id` - Soft-delete a load record.
- `POST /api/loads/ai-parse` - Parse raw textual dispatch details using parsing heuristics.

### 💼 Carrier Management (`/api/carriers`)
- `GET /api/carriers` - Retrieve carrier profiles and DOT compliance statuses.
- `POST /api/carriers` - Add a new carrier.
- `PATCH /api/carriers/:id` - Update carrier DOT/MC credentials or suspend active status.
- `DELETE /api/carriers/:id` - Remove a carrier profile.

### 🏢 Shipper Management (`/api/shippers`)
- `GET /api/shippers` - List shipper accounts and client profiles.
- `POST /api/shippers` - Add a new shipper organization.
- `PATCH /api/shippers/:id` - Update billing details or contacts.
- `DELETE /api/shippers/:id` - Remove a shipper account.

### 📝 Rate Confirmation Versioning (`/api/rate-confirmations`)
- `POST /api/rate-confirmations/create` - Create a rate confirmation draft.
- `PATCH /api/rate-confirmations/:id` - Modify pendings or add rate versions.
- `POST /api/rate-confirmations/:id/approve` - Approve and sign a version (Required to transition to `rate-confirmed`).
- `DELETE /api/rate-confirmations/:id` - Delete pending rate confirmation version.

### 📎 Proof of Delivery (`/api/pod`)
- `POST /api/pod/upload/:loadId` - Upload delivery receipt files (PDF/images) to `/uploads`.
- `POST /api/pod/approve/:id` - Broker compliance approval (Required to transition load to `pod-verified`).

### 📊 Team & RBAC Operations
- `GET /api/staff` - List team members.
- `POST /api/staff/invite` - Send pending team email invitations.
- `PATCH /api/staff/:id/status` - Suspend/reactivate accounts or toggle MFA.
- `GET /api/roles` - Retrieve all available security roles.
- `POST /api/roles` - Add custom security roles.
- `PATCH /api/roles/:id/permissions` - Edit custom role permission metrics.
- `DELETE /api/roles/:id` - Remove a custom role.

### 📈 Reports & Logs
- `GET /api/reports` - Query monthly revenue trends and carrier rankings.
- `GET /api/audit` - List organization audit log history.
- `GET /api/notifications` - Retrieve alerts and update notifications.

---

## 💾 Database Migration & Seed Procedures

### View Current Schema
The Prisma schema model is defined in [backend/prisma/schema.prisma](file:///c:/PROJECTS/LoadFlow%20B2B%20SaaS%20Design/backend/prisma/schema.prisma).

### Generate Prisma Client & Run Migrations
Run the following inside the `backend/` directory:
```bash
npx prisma generate
npx prisma migrate dev
```

### Seed Database
Populate user accounts, custom roles, permissions, carriers, shippers, and sample shipments:
```bash
npm run seed
```

### Open Prisma Studio
Explore database tables and row entries in an interactive browser GUI:
```bash
npx prisma studio
```

---

## 🚦 Strict State Validation
Status changes are evaluated in the `validateStatusTransition` function in [backend/src/loads/loads.service.ts](file:///c:/PROJECTS/LoadFlow%20B2B%20SaaS%20Design/backend/src/loads/loads.service.ts). An HTTP 400 Bad Request error is returned if a transition violates state rules or fails business validations:
*   Transitioning to `rate-confirmed` requires an approved `Rate Confirmation` document.
*   Transitioning to `pod-verified` requires a Broker-approved `Proof of Delivery` upload.
