# 01 Baseline Architecture

This spec serves as the foundational documentation for the Guaw & Miaw V3 project architecture, adhering to the mandatory Spec-Driven methodology. It reflects the initial state derived from `PROJECT_ARCHITECTURE.md`.

## Architecture Topology
- **Frontend (PWA):** React 19, Vite, TailwindCSS, Zustand. Hosted on Vercel.
- **Backend:** Python 3.11, Flask, SQLAlchemy, JWT, Gunicorn. Hosted on Render.
- **Database:** Supabase (PostgreSQL) using Connection Pooler (port 6543) in Transaction mode.

## Design System: "Midnight Rose"
- **Primary:** `#FFB7C5`
- **Background:** `#FDF2F4`
- **Text:** `#1A1A1A`

## Logic & Security
- **Bulk Items:** `is_bulk` flag with `bulto_stock` and `bulto_weight`.
- **Cash Register:** Enforced Shift (Corte de Caja) flow.
- **Role-Based Auth:** React `RoleGuard` + Flask `@require_auth` with JWT.

## Automated Testing
- Tests are located in the `tests/` directory and executed using `pytest`.

*Note: All future architectural modifications must be documented in a new spec file in this directory prior to implementation.*
