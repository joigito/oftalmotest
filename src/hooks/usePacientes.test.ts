import { describe, it, expect, vi, beforeEach } from 'vitest'
import { actualizarPaciente, eliminarPaciente } from './usePacientes'
import { supabase } from '../lib/supabaseClient'

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const mockFrom = supabase.from as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('actualizarPaciente', () => {
  const medicoId = 'med-1'
  const pacienteId = 'pac-1'
  const updateData = { nombre: 'Juan Updated', telefono: '123456789' }
  const updatedPaciente = {
    id: pacienteId,
    nombre: 'Juan Updated',
    dni: '12345678',
    telefono: '123456789',
    fecha_nacimiento: '1990-01-01',
  }

  it('calls .update() with correct payload and returns updated Paciente', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: updatedPaciente, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ update: mockUpdate })

    const result = await actualizarPaciente(medicoId, pacienteId, updateData)

    expect(mockFrom).toHaveBeenCalledWith('pacientes')
    expect(mockUpdate).toHaveBeenCalledWith(updateData)
    expect(mockEq).toHaveBeenCalledWith('id', pacienteId)
    expect(mockSelect).toHaveBeenCalledWith('id, nombre, dni, telefono, fecha_nacimiento')
    expect(result).toEqual(updatedPaciente)
  })

  it('throws on supabase error', async () => {
    const dbError = new Error('Database error')
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: dbError })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ update: mockUpdate })

    await expect(actualizarPaciente(medicoId, pacienteId, updateData)).rejects.toThrow('Database error')
  })

  it('surfaces duplicate DNI error (code 23505)', async () => {
    const dbError = { message: 'duplicate key value', code: '23505', details: '', hint: '' }
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: dbError })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ update: mockUpdate })

    try {
      await actualizarPaciente(medicoId, pacienteId, updateData)
      expect.fail('Should have thrown')
    } catch (err: unknown) {
      const e = err as { code: string; message: string }
      expect(e.code).toBe('23505')
      expect(e.message).toBe('duplicate key value')
    }
  })
})

describe('eliminarPaciente', () => {
  const medicoId = 'med-1'
  const pacienteId = 'pac-1'

  it('calls .update({ activo: false }) on medico_paciente with correct medico_id and paciente_id', async () => {
    const mockEqPaciente = vi.fn().mockResolvedValue({ error: null })
    const mockEqMedico = vi.fn().mockReturnValue({ eq: mockEqPaciente })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqMedico })
    mockFrom.mockReturnValue({ update: mockUpdate })

    await eliminarPaciente(medicoId, pacienteId)

    expect(mockFrom).toHaveBeenCalledWith('medico_paciente')
    expect(mockUpdate).toHaveBeenCalledWith({ activo: false })
    expect(mockEqMedico).toHaveBeenCalledWith('medico_id', medicoId)
    expect(mockEqPaciente).toHaveBeenCalledWith('paciente_id', pacienteId)
  })

  it('throws on supabase error', async () => {
    const dbError = new Error('Deactivation failed')
    const mockEqPaciente = vi.fn().mockResolvedValue({ error: dbError })
    const mockEqMedico = vi.fn().mockReturnValue({ eq: mockEqPaciente })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqMedico })
    mockFrom.mockReturnValue({ update: mockUpdate })

    await expect(eliminarPaciente(medicoId, pacienteId)).rejects.toThrow('Deactivation failed')
  })
})
