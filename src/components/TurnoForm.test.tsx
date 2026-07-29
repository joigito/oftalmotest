import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { TurnoForm } from './TurnoForm'

const mockPacientes = [
  { id: 'pac-1', nombre: 'Garcia', dni: '11111111' },
  { id: 'pac-2', nombre: 'Perez', dni: '22222222' },
]

const defaultProps = {
  pacientes: mockPacientes,
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
  guardando: false,
  error: '',
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('TurnoForm', () => {
  it('renders all fields: paciente select, datetime, duration presets, and notes', () => {
    render(<TurnoForm {...defaultProps} />)

    expect(screen.getByLabelText(/paciente/i)).toBeInTheDocument()
    expect(screen.getByText('Garcia')).toBeInTheDocument()
    expect(screen.getByText('Perez')).toBeInTheDocument()
    expect(screen.getByLabelText(/fecha y hora/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/notas/i)).toBeInTheDocument()

    // Duration presets
    expect(screen.getByText('15 min')).toBeInTheDocument()
    expect(screen.getByText('30 min')).toBeInTheDocument()
    expect(screen.getByText('45 min')).toBeInTheDocument()
    expect(screen.getByText('60 min')).toBeInTheDocument()
  })

  it('calls onSubmit with correct form data when required fields are filled', () => {
    render(<TurnoForm {...defaultProps} />)

    // Select a paciente
    const pacienteSelect = screen.getByLabelText(/paciente/i)
    fireEvent.change(pacienteSelect, { target: { value: 'pac-1' } })

    // Set fecha_hora
    const datetimeInput = screen.getByLabelText(/fecha y hora/i)
    fireEvent.change(datetimeInput, { target: { value: '2026-07-29T10:00' } })

    // Click a duration preset (30 min is default)
    const btn30 = screen.getByText('30 min')
    fireEvent.click(btn30)

    // Add notes
    const notasTextarea = screen.getByLabelText(/notas/i)
    fireEvent.change(notasTextarea, { target: { value: 'Control de rutina' } })

    // Submit
    const submitBtn = screen.getByText('Guardar Turno')
    fireEvent.click(submitBtn)

    expect(defaultProps.onSubmit).toHaveBeenCalledWith({
      paciente_id: 'pac-1',
      fecha_hora: '2026-07-29T10:00',
      duracion_minutos: 30,
      notas: 'Control de rutina',
    })
  })

  it('shows validation error when paciente is not selected', async () => {
    render(<TurnoForm {...defaultProps} />)

    // Set fecha_hora but no paciente
    const datetimeInput = screen.getByLabelText(/fecha y hora/i)
    fireEvent.change(datetimeInput, { target: { value: '2026-07-29T10:00' } })

    const submitBtn = screen.getByText('Guardar Turno')
    fireEvent.click(submitBtn)

    expect(await screen.findByText(/seleccionar un paciente/i)).toBeInTheDocument()
    expect(defaultProps.onSubmit).not.toHaveBeenCalled()
  })

  it('shows validation error when fecha_hora is missing', async () => {
    render(<TurnoForm {...defaultProps} />)

    // Select paciente but no fecha_hora
    const pacienteSelect = screen.getByLabelText(/paciente/i)
    fireEvent.change(pacienteSelect, { target: { value: 'pac-1' } })

    const submitBtn = screen.getByText('Guardar Turno')
    fireEvent.click(submitBtn)

    expect(await screen.findByText(/seleccionar fecha y hora/i)).toBeInTheDocument()
    expect(defaultProps.onSubmit).not.toHaveBeenCalled()
  })

  it('disables submit button while guardando is true', () => {
    render(<TurnoForm {...defaultProps} guardando={true} />)

    const submitBtn = screen.getByText('Guardando...')
    expect(submitBtn).toBeDisabled()
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(<TurnoForm {...defaultProps} />)

    const cancelBtn = screen.getByText('Cancelar')
    fireEvent.click(cancelBtn)

    expect(defaultProps.onCancel).toHaveBeenCalled()
  })
})
