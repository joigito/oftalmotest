import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MedicoForm } from './MedicoForm'

const defaultProps = {
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

describe('MedicoForm', () => {
  it('renders all fields: nombre, email, rol selector, and password for create mode', () => {
    render(<MedicoForm {...defaultProps} />)

    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/rol/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
  })

  it('renders edit mode without password field when initialData is provided', () => {
    const initialData = { id: '1', nombre: 'Dr. Test', email: 'test@test.com', rol: 'medico' }
    render(<MedicoForm {...defaultProps} initialData={initialData} />)

    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/rol/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Dr. Test')).toBeInTheDocument()
    expect(screen.getByDisplayValue('test@test.com')).toBeInTheDocument()
    expect(screen.queryByLabelText(/contraseña/i)).not.toBeInTheDocument()
  })

  it('shows validation error when nombre is empty on submit', () => {
    render(<MedicoForm {...defaultProps} />)

    fireEvent.submit(screen.getByTestId('medico-form'))

    expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument()
    expect(defaultProps.onSubmit).not.toHaveBeenCalled()
  })

  it('shows validation error when email is empty on submit', () => {
    render(<MedicoForm {...defaultProps} />)

    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Dr. Test' } })
    fireEvent.submit(screen.getByTestId('medico-form'))

    expect(screen.getByText('El email es obligatorio')).toBeInTheDocument()
    expect(defaultProps.onSubmit).not.toHaveBeenCalled()
  })

  it('shows validation error when email is invalid', () => {
    render(<MedicoForm {...defaultProps} />)

    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Dr. Test' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'not-an-email' } })
    fireEvent.submit(screen.getByTestId('medico-form'))

    expect(screen.getByText('El email no es válido')).toBeInTheDocument()
    expect(defaultProps.onSubmit).not.toHaveBeenCalled()
  })

  it('shows validation error when password is empty in create mode', () => {
    render(<MedicoForm {...defaultProps} />)

    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Dr. Test' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
    fireEvent.submit(screen.getByTestId('medico-form'))

    expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument()
    expect(defaultProps.onSubmit).not.toHaveBeenCalled()
  })

  it('shows validation error when password is too short in create mode', () => {
    render(<MedicoForm {...defaultProps} />)

    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Dr. Test' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: '123' } })
    fireEvent.submit(screen.getByTestId('medico-form'))

    expect(screen.getByText('La contraseña debe tener al menos 6 caracteres')).toBeInTheDocument()
    expect(defaultProps.onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with correct data when all fields are valid in create mode', () => {
    render(<MedicoForm {...defaultProps} />)

    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Dr. Test' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: '123456' } })
    fireEvent.submit(screen.getByTestId('medico-form'))

    expect(defaultProps.onSubmit).toHaveBeenCalledWith({
      nombre: 'Dr. Test',
      email: 'test@test.com',
      rol: 'medico',
      password: '123456',
    })
  })

  it('calls onSubmit with correct data in edit mode', () => {
    const initialData = { id: '1', nombre: 'Dr. Old', email: 'old@test.com', rol: 'admin' }
    const onSubmit = vi.fn()
    render(
      <MedicoForm
        {...defaultProps}
        initialData={initialData}
        onSubmit={onSubmit}
        submitLabel="Actualizar Médico"
      />
    )

    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Dr. Updated' } })
    fireEvent.submit(screen.getByTestId('medico-form'))

    expect(onSubmit).toHaveBeenCalledWith({
      nombre: 'Dr. Updated',
      email: 'old@test.com',
      rol: 'admin',
    })
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(<MedicoForm {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
  })

  it('disables buttons while guardando is true', () => {
    render(<MedicoForm {...defaultProps} guardando={true} />)

    expect(screen.getByRole('button', { name: /guardando/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled()
  })

  it('displays error text when error prop is provided', () => {
    render(<MedicoForm {...defaultProps} error="Error de prueba" />)

    expect(screen.getByText('Error de prueba')).toBeInTheDocument()
  })

  it('renders rol selector with all three options', () => {
    render(<MedicoForm {...defaultProps} />)

    const select = screen.getByLabelText(/rol/i)
    expect(select).toBeInTheDocument()

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(3)
    expect(options[0]).toHaveTextContent('Admin')
    expect(options[1]).toHaveTextContent('Médico')
    expect(options[2]).toHaveTextContent('Secretario')
  })
})
