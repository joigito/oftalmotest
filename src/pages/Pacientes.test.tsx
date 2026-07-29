import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Pacientes } from './Pacientes'

const mockPacientes = [
  { id: '1', nombre: 'Garcia', dni: '11111111', telefono: '1111', fecha_nacimiento: null },
  { id: '2', nombre: 'Gonzalez', dni: '22222222', telefono: '2222', fecha_nacimiento: null },
  { id: '3', nombre: 'Perez', dni: '33333333', telefono: '3333', fecha_nacimiento: null },
]

vi.mock('../hooks/useMedico', () => ({
  useMedico: () => ({ medicoId: 'med-1', rol: 'admin' as const, cargando: false, error: null }),
}))

vi.mock('../hooks/usePacientes', () => ({
  cargarPacientes: vi.fn(),
  crearPaciente: vi.fn(),
  actualizarPaciente: vi.fn(),
  eliminarPaciente: vi.fn(),
}))

import { cargarPacientes } from '../hooks/usePacientes'
const mockCargarPacientes = cargarPacientes as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/pacientes']}>
      <Pacientes />
    </MemoryRouter>
  )
}

describe('Pacientes page', () => {
  it('renders rows from mocked cargarPacientes response', async () => {
    mockCargarPacientes.mockResolvedValue(mockPacientes)

    renderPage()

    expect(await screen.findByText('Garcia')).toBeInTheDocument()
    expect(screen.getByText('Gonzalez')).toBeInTheDocument()
    expect(screen.getByText('Perez')).toBeInTheDocument()
    expect(mockCargarPacientes).toHaveBeenCalledWith('med-1')
  })

  it('search input filters rows client-side without server round-trip', async () => {
    mockCargarPacientes.mockResolvedValue(mockPacientes)

    renderPage()

    // Wait for list to render
    expect(await screen.findByText('Garcia')).toBeInTheDocument()

    // Type in search
    const searchInput = screen.getByPlaceholderText('Buscar por nombre...')
    fireEvent.change(searchInput, { target: { value: 'Gar' } })

    // Only Garcia should remain visible
    expect(screen.getByText('Garcia')).toBeInTheDocument()
    expect(screen.queryByText('Gonzalez')).not.toBeInTheDocument()
    expect(screen.queryByText('Perez')).not.toBeInTheDocument()

    // Verify no extra server call was made
    expect(mockCargarPacientes).toHaveBeenCalledTimes(1)
  })
})
