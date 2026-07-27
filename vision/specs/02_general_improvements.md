# 02 General Improvements, Reports, and Archive System

This spec documents the implementation details for the general improvements, reports, dashboard image fix, and the soft-delete/archiving system.

## 1. Weekly and Monthly Reports (Admin Only)
**GIVEN** a user with the 'admin' role
**WHEN** they access the Reports section (`/reports`)
**THEN** they should see options to view Weekly and Monthly reports, and the backend should provide endpoints `/api/v1/reports/weekly` and `/api/v1/reports/monthly` protected by `@require_auth(['admin'])`.

## 2. Dashboard Image Fix
**GIVEN** the Dashboard view
**WHEN** it renders
**THEN** the mascot image should load correctly without broken links. The import path and rendering of `mascota-pose-1.png` (or the equivalent logo/mascot) will be corrected.

## 3. Archiving System (Soft Delete) for Sales and Expenses
**GIVEN** a saturated UI with old sales and expenses
**WHEN** an admin goes to Settings and clicks "Archivar Registros"
**THEN** the system will mark the records as `is_archived = True` in the database, and they will no longer appear in the main UI views for Sales, Dashboard, and Expenses.

## 4. Code Quality and Security
**GIVEN** the deployment configuration
**WHEN** the app is deployed or code is committed
**THEN** `render.yaml` must not use `CORS_ORIGINS: "*"` globally for production, and the codebase must support `ruff` and `black` for formatting.

---
*Status: Approved for implementation.*
