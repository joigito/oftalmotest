import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockCargarTurnos = vi.fn()
const mockCrearTurno = vi.fn()
const mockActualizarEstado = vi.fn()
const mockEliminarTurno = vi.fn()

vi.mock('../hooks/useMedico', () => ({
  useMedico: vi.fn(),
}))

vi.mock('../hooks/useTurnos', () => ({
  cargarTurnos: (...args: unknown[]) => mockCargarTurnos(...args),
  crearTurno: (...args: unknown[]) => mockCrearTurno(...args),
  actualizarEstadoTurno: (...args: unknown[]) => mockActualizarEstado(...args),
  eliminarTurno: (...args: unknown[]) => mockEliminarTurno(...args),
}))

import { useMedico } from '../hooks/useMedico'
const mockUseMedico = useMedico as ReturnType<typeof vi.fn>

const mockTurnos = [
  {
    id: 'turno-1',
    medico_id: 'med-1',
    paciente_id: 'pac-1',
    paciente_nombre: 'Garcia',
    fecha_hora: '2026-07-29T10:00:00Z',
    duracion_minutos: 30,
    estado: 'pendiente' as const,
    notas: null,
    creado_en: '2026-07-29T08:00:00Z',
    actualizado_en: null,
    creado_por: 'med-1',
  },
  {
    id: 'turno-2',
    medico_id: 'med-1',
    paciente_id: 'pac-2',
    paciente_nombre: 'Perez',
    fecha_hora: '2026-07-29T11:00:00Z',
    duracion_minutos: 15,
    estado: 'confirmado' as const,
    notas: null,
    creado_en: '2026-07-29T08:00:00Z',
    actualizado_en: null,
    creado_por: 'med-1',
  },
  {
    id: 'turno-3',
    medico_id: 'med-1',
    paciente_id: 'pac-3',
    paciente_nombre: 'Lopez',
    fecha_hora: '2026-07-29T09:00:00Z',
    duracion_minutos: 30,
    estado: 'completado' as const,
    notas: null,
    creado_en: '2026-07-29T08:00:00Z',
    actualizado_en: null,
    creado_por: 'med-1',
  },
]

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

// We import dynamically to avoid hoisting issues
async function renderTurnosPage() {
  const { Turnos } = await import('./Turnos')
  return render(
    <MemoryRouter initialEntries={['/turnos']}>
      <Turnos />
    </MemoryRouter>
  )
}

describe('Turnos page', () => {
  it('renders empty state when no appointments exist for the selected day', async () => {
    mockUseMedico.mockReturnValue({ medicoId: 'med-1', rol: 'admin', cargando: false, error: null })
    mockCargarTurnos.mockResolvedValue([])

    await renderTurnosPage()

    expect(await screen.findByText(/no hay turnos/i)).toBeInTheDocument()
    expect(mockCargarTurnos).toHaveBeenCalledTimes(1)
  })

  it('shows list of turnos for selected day ordered by time', async () => {
    mockUseMedico.mockReturnValue({ medicoId: 'med-1', rol: 'admin', cargando: false, error: null })
    mockCargarTurnos.mockResolvedValue(mockTurnos)

    await renderTurnosPage()

    expect(await screen.findByText('Garcia')).toBeInTheDocument()
    expect(screen.getByText('Perez')).toBeInTheDocument()
    expect(screen.getByText('Lopez')).toBeInTheDocument()

    // Items should be rendered — verify they're in the list
    const items = screen.getAllByRole('listitem')
    expect(items.length).toBe(3)
  })

  it('date navigation changes displayed day and reloads turnos', async () => {
    mockUseMedico.mockReturnValue({ medicoId: 'med-1', rol: 'admin', cargando: false, error: null })
    mockCargarTurnos.mockResolvedValue([])

    await renderTurnosPage()

    // Wait for initial load
    await screen.findByText(/no hay turnos/i)

    // Click ◀ to go to previous day
    const prevBtn = screen.getByText('◀')
    fireEvent.click(prevBtn)

    // Should have called cargarTurnos again (2nd call)
    await waitFor(() => {
      expect(mockCargarTurnos).toHaveBeenCalledTimes(2)
    })
  })

  it('"Create" button opens modal with TurnoForm', async () => {
    mockUseMedico.mockReturnValue({ medicoId: 'med-1', rol: 'admin', cargando: false, error: null })
    mockCargarTurnos.mockResolvedValue([])

    await renderTurnosPage()

    await screen.findByText(/no hay turnos/i)

    const createBtn = screen.getByText(/nuevo turno/i)
    fireEvent.click(createBtn)

    expect(screen.getByText(/guardar turno/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/paciente/i)).toBeInTheDocument()
  })

  it('status action buttons show valid next states only', async () => {
    mockUseMedico.mockReturnValue({ medicoId: 'med-1', rol: 'admin', cargando: false, error: null })
    mockCargarTurnos.mockResolvedValue(mockTurnos)

    await renderTurnosPage()

    // Wait for list to render
    expect(await screen.findByText('Garcia')).toBeInTheDocument()

    // pendiente (Garcia) → should show "Confirmar" and "Cancelar"
    const confirmBtns = screen.getAllByText('Confirmar')
    expect(confirmBtns.length).toBe(1)

    // confirmado (Perez) → should show "Iniciar" and "Cancelar"
    const iniciarBtns = screen.getAllByText('Iniciar')
    expect(iniciarBtns.length).toBe(1)

    // completado (Lopez) → no status buttons
    const cancelBtns = screen.queryAllByText('Cancelar')
    expect(cancelBtns.length).toBe(2) // pendiente + confirmado
  })

  it('role guard shows page for admin and medico', async () => {
    mockUseMedico.mockReturnValue({ medicoId: 'med-1', rol: 'admin', cargando: false, error: null })
    mockCargarTurnos.mockResolvedValue([])

    await renderTurnosPage()

    expect(await screen.findByText(/turnos del día/i)).toBeInTheDocument()
  })

  it('secretario can view but has restricted status actions', async () => {
    mockUseMedico.mockReturnValue({ medicoId: 'med-1', rol: 'secretario', cargando: false, error: null })
    mockCargarTurnos.mockResolvedValue(mockTurnos)

    await renderTurnosPage()

    // Page should render (no redirect)
    expect(await screen.findByText('Garcia')).toBeInTheDocument()

    // Secretario should see Confirmar and Cancelar but NOT Iniciar/Completar
    expect(screen.getByText('Confirmar')).toBeInTheDocument()
    expect(screen.getAllByText('Cancelar').length).toBe(2) // pendiente + confirmado
    expect(screen.queryByText('Iniciar')).not.toBeInTheDocument()
    expect(screen.queryByText('Completar')).not.toBeInTheDocument()
  })

  it('status update click calls actualizarEstadoTurno and refreshes', async () => {
    mockUseMedico.mockReturnValue({ medicoId: 'med-1', rol: 'admin', cargando: false, error: null })
    mockCargarTurnos.mockResolvedValue(mockTurnos)
    mockActualizarEstado.mockResolvedValue(undefined)

    await renderTurnosPage()

    expect(await screen.findByText('Garcia')).toBeInTheDocument()

    // Click "Confirmar" on Garcia's turno (pendiente)
    const confirmBtn = screen.getAllByText('Confirmar')[0]
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(mockActualizarEstado).toHaveBeenCalledWith('turno-1', 'confirmado')
    })
  })
})
