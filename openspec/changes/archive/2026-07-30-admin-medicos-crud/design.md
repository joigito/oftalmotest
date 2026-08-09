# Design: Admin Médicos CRUD

## Technical Approach

Refactor `CrearMedicos.tsx` → full CRUD (table + edit modal + delete confirm) reusing the modal-over-form pattern already established in `Pacientes.tsx`/`PacienteForm.tsx`. Fix RLS on `medicos` so admin can SELECT all rows. Add SECURITY DEFINER functions for UPDATE/DELETE bypassing RLS. Open `secretario` access to Pacientes page and Dashboard card.

## Architecture Decisions

### Decision: RLS on `medicos`

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Policy by `auth.uid()` → subquery to `medicos.rol` | Direct, no extra functions | ✅ **Chosen** — admin SELECT/UPDATE/DELETE policies with EXISTS subquery checking `rol = 'admin'` |
| All access via SECURITY DEFINER | Centralized but hides data from direct queries | ❌ — breaks dx tooling, no benefit over policy |
| BYPASS RLS via service_role | Requires backend proxy | ❌ — SPA uses anon key, no backend |

Policies keep self-service for medicos (existing) and layer admin access on top.

### Decision: DELETE strategy

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Hard DELETE via SECURITY DEFINER | Cascades to turnos (loses appts); preserves pruebas via NULL | ✅ **Chosen** — simplest for MVP. Document that deleting a medico removes their future turnos. |
| Soft delete (`activo` column) | Needs frontend filter + disables login user | ❌ — more complexity than MVP needs. User stays in auth.users. |
| Set `activo=false` on medico, keep auth user | Cleanest UX but needs checks on login | ❌ — out of scope. Can add later. |

### Decision: Frontend component structure

Keep `/medicos` route and `CrearMedicos.tsx` filename (rename would touch `App.tsx` and git history). The page content grows from create-only → full CRUD. Extract `MedicoForm.tsx` following `PacienteForm.tsx` pattern.

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Rename to `Medicos.tsx` | Cleaner name but changes route import | ❌ — unnecessary diff noise |
| Keep `CrearMedicos.tsx` | Familiar name, route unmodified | ✅ — route is `/medicos`, component name is internal |

## Data Flow

```
Admin browser                    Supabase
    │                                │
    ├── GET /medicos ──────────────→ supabase.from('medicos').select()
    │                                │── RLS passes (admin policy)
    │←── JSON[ ] ────────────────────┘
    │
    ├── POST crear_medico ─────────→ rpc('crear_medico')
    │←── success ────────────────────┘
    │
    ├── POST actualizar_medico ────→ rpc('actualizar_medico')
    │←── success ────────────────────┘
    │
    ├── POST eliminar_medico ──────→ rpc('eliminar_medico')
    │                                │── UPDATE pruebas SET medico_id=NULL
    │                                │── UPDATE turnos SET creado_por=NULL
    │                                │── DELETE medicos (cascade: turnos, medico_paciente)
    │←── success ────────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/..._admin_medicos_crud.sql` | Create | RLS policies + SECURITY DEFINER functions |
| `src/pages/CrearMedicos.tsx` | Modify | Full CRUD: table, edit modal, delete confirm |
| `src/pages/CrearMedicos.module.css` | Modify | Add table, modal, confirm dialog styles |
| `src/components/MedicoForm.tsx` | Create | Form fields: nombre, email, selector de rol |
| `src/components/MedicoForm.module.css` | Create | Form styles (mirrors PacienteForm.module.css) |
| `src/pages/Pacientes.tsx` | Modify | Add `'secretario'` to role guard |
| `src/pages/Dashboard.tsx` | Modify | Add `'secretario'` to Pacientes card roles |
| `openspec/changes/admin-medicos-crud/design.md` | Create | This file |

## Interfaces / Contracts

### New DB Functions

```sql
CREATE OR REPLACE FUNCTION actualizar_medico(
  p_medico_id UUID,
  p_nombre TEXT,
  p_email TEXT,
  p_rol TEXT
) RETURNS void SECURITY DEFINER AS $$
  UPDATE medicos SET nombre = p_nombre, email = p_email, rol = p_rol
  WHERE id = p_medico_id;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION eliminar_medico(
  p_medico_id UUID
) RETURNS void SECURITY DEFINER AS $$
  UPDATE pruebas SET medico_id = NULL WHERE medico_id = p_medico_id;
  UPDATE turnos SET creado_por = NULL WHERE creado_por = p_medico_id;
  DELETE FROM medicos WHERE id = p_medico_id;  -- cascades to turnos, medico_paciente
$$ LANGUAGE sql;
```

### Frontend Types (CrearMedicos.tsx)

```typescript
interface Medico {
  id: string
  nombre: string
  email: string
  rol: Rol
}
```

### MedicoForm Props

Matches `PacienteForm` pattern:
```typescript
interface MedicoFormProps {
  initialData?: Medico | null
  guardando: boolean
  error: string
  onSubmit: (data: { nombre: string; email: string; rol: string }) => void
  onCancel: () => void
  submitLabel?: string
}
```

## Mock UI — Médicos Page

```
┌──────────────────────────────────────────────┐
│ ← Volver al panel                             │
│                                                │
│ Médicos                       [+ Nuevo Médico] │
│                                                │
│ ┌──────────────────────────────────────────┐   │
│ │ Nombre      │ Email            │ Rol    │   │
│ ├──────────────────────────────────────────┤   │
│ │ Dr. Pérez   │ j@j.com         │ medico  │   │
│ │             │                  │ [Editar]│   │
│ │             │                  │[Eliminar]│  │
│ ├──────────────────────────────────────────┤   │
│ │ Admin       │ a@a.com         │ admin   │   │
│ │             │                  │ [Editar]│   │
│ │             │                  │[Eliminar]│  │
│ └──────────────────────────────────────────┘   │
│                                                │
│ Modal (create/edit):                           │
│ ┌─────────────────────┐                        │
│ │ ✏️ Editar Médico    │                        │
│ │                     │                        │
│ │ Nombre: [    ]      │                        │
│ │ Email:  [    ]      │                        │
│ │ Rol:    [medico ▼]  │                        │
│ │                     │                        │
│ │ [Cancelar] [Guardar]│                        │
│ └─────────────────────┘                        │
│                                                │
│ Confirm (delete):                              │
│ ┌─────────────────────┐                        │
│ │ Eliminar médico     │                        │
│ │ ¿Seguro de eliminar │                        │
│ │ a Dr. Pérez?        │                        │
│ │                     │                        │
│ │ [Cancelar] [Eliminar]│                       │
│ └─────────────────────┘                        │
└──────────────────────────────────────────────┘
```

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Unit | `MedicoForm` renders all fields + rol selector | Vitest + RTL |
| Unit | Role guard: admin sees CRUD, others get Navigate | Mock `useMedico` |
| E2E | Admin: create → table updates, edit → values reflect, delete → row removed | Playwright or manual |
| DB | RLS: admin SELECT returns all, medico SELECT returns self | `supabase_client` integration test |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. The only routing change is adding `'secretario'` to a Dashboard card's role array — no route guards or dynamic imports affected.

## Migration / Rollback

1. Run migration SQL (RLS + functions) — fully additive, no destructive DDL
2. To rollback: `DROP POLICY IF EXISTS ...` on `medicos`, `DROP FUNCTION actualizar_medico`, `DROP FUNCTION eliminar_medico`
3. Frontend changes are pure code — revert via `git revert`

## Open Questions

- [ ] ¿Manejar eliminación de auth.users al eliminar médico? (Actual propuesta: **no** — el auth user queda huérfano. Consensuar.)
- [ ] ¿El rol admin puede editar su propio registro y cambiar su rol? (Riesgo: admin se saca el rol y queda lockeado. Sugiero: prevenir `UPDATE` donde `p_rol != 'admin' AND p_medico_id = admin_actual_id` o validar en frontend.)
- [ ] ¿Paginación o búsqueda en la tabla de médicos? (Propuesta: no para MVP, el listado es pequeño.)
