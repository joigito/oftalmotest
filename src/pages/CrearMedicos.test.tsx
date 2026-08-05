import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../hooks/useMedico', () => ({
  useMedico: vi.fn(),
}))

import { useMedico } from '../hooks/useMedico'
const mockUseMedico = useMedico as ReturnType<typeof vi.fn>

vi.mock('../lib/supabaseClient', () => {
  const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null })
  const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
  return {
    supabase: {
      from: (...args: unknown[]) => mockFrom(...args),
    },
  }
})

import { CrearMedicos } from './CrearMedicos'

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/medicos']}>
      <CrearMedicos />
    </MemoryRouter>
  )
}

describe('CrearMedicos page', () => {
  it('redirects non-admin roles to Dashboard', () => {
    mockUseMedico.mockReturnValue({ medicoId: 'med-1', rol: 'medico', cargando: false, error: null })

    renderPage()

    expect(screen.queryByText('Médicos')).not.toBeInTheDocument()
    expect(screen.queryByText('+ Nuevo Médico')).not.toBeInTheDocument()
  })

  it('redirects secretario role to Dashboard', () => {
    mockUseMedico.mockReturnValue({ medicoId: 'med-1', rol: 'secretario', cargando: false, error: null })

    renderPage()

    expect(screen.queryByText('Médicos')).not.toBeInTheDocument()
  })

  it('renders content for admin role', async () => {
    mockUseMedico.mockReturnValue({ medicoId: 'med-1', rol: 'admin', cargando: false, error: null })

    renderPage()

    expect(await screen.findByText('Médicos')).toBeInTheDocument()
  })

  it('shows loading state while role is loading', () => {
    mockUseMedico.mockReturnValue({ medicoId: null, rol: null, cargando: true, error: null })

    renderPage()

    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })
})
