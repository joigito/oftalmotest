# Tasks: Admin Médicos CRUD

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~800-1000 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: DB + tests → PR 2: Frontend |
| Delivery strategy | size:exception |
| Chain strategy | single-pr |

Decision resolved: size:exception — single PR approved.
Chain strategy: single-pr

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | DB migration + RLS + SECURITY DEFINER functions | PR 1 | `supabase db push --dry-run` | N/A — SQL-only | `supabase migration repair --revert 20260730000001` |
| 2 | Frontend: MedicoForm + CrearMedicos refactor + styles + guards | PR 2 | `npm test --run` | Manual: login as admin → /medicos → CRUD | `git revert` of frontend commits |

## Phase 1: Database (SQL migration)

- [x] T1.1 Create `supabase/migrations/20260730000001_admin_medicos_crud.sql` with RLS policies (SELECT/UPDATE/DELETE for admin) and SECURITY DEFINER functions `actualizar_medico`, `eliminar_medico`
- [x] T1.2 Apply migration via `supabase db push` and verify with a dry-run check

## Phase 2: Frontend — MedicoForm component

- [x] T2.1 Create `src/components/MedicoForm.tsx` with nombre/email/rol inputs, validation, props following PacienteForm pattern
- [x] T2.2 Create `src/components/MedicoForm.module.css` mirroring PacienteForm.module.css structure

## Phase 3: Frontend — CrearMedicos CRUD refactor

- [x] T3.1 Refactor `src/pages/CrearMedicos.tsx`: add `rol` column to list, integrate MedicoForm modal for create/edit, add delete-confirm overlay, manage loading/guardando/error states
- [x] T3.2 Refactor `src/pages/CrearMedicos.module.css`: table styles matching Pacientes.module.css, modal overlay/box, confirm dialog, edit/delete/create button styles

## Phase 4: Frontend — Role guard patches

- [x] T4.1 Modify `src/pages/Pacientes.tsx` line 131: add `&& rol !== 'secretario'` to the role guard
- [x] T4.2 Modify `src/pages/Dashboard.tsx`: add `'secretario'` to Pacientes card roles array

## Phase 5: Testing

- [x] T5.1 Write Vitest test: MedicoForm renders nombre, email, rol selector and validates required fields
- [x] T5.2 Write Vitest test: CrearMedicos page redirects non-admin roles to Dashboard

## Fix: crear_medico rol parameter

- [x] F1 Migration `20260730000002_fix_crear_medico_rol.sql`: Added `p_rol TEXT DEFAULT 'medico'` parameter to `crear_medico` RPC
- [x] F2 Frontend `CrearMedicos.tsx`: Pass `p_rol: data.rol` to RPC call on create
- [x] F3 Tests: 48 passed, 0 TS errors, spec scenario REQ-02/SC-2 now fully implementable

## Implementation Order

Phase 1 (DB) must come first — frontend depends on RPCs existing. Phase 2 (MedicoForm) before Phase 3 (CrearMedicos refactor) since it's a dependency. Phase 4 (guards) is independent and can be done alongside Phases 2-3. Phase 5 (tests) after all code is in place.
