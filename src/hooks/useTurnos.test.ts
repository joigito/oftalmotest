import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cargarTurnos, crearTurno, actualizarEstadoTurno, eliminarTurno } from './useTurnos'
import { supabase } from '../lib/supabaseClient'

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const mockFrom = supabase.from as ReturnType<typeof vi.fn>

const mockTurno = {
  id: 'turno-1',
  medico_id: 'med-1',
  paciente_id: 'pac-1',
  pacientes: { nombre: 'Garcia' },
  fecha_hora: '2026-07-29T10:00:00Z',
  duracion_minutos: 30,
  estado: 'pendiente',
  notas: 'Control de rutina',
  creado_en: '2026-07-29T08:00:00Z',
  actualizado_en: null,
  creado_por: 'med-1',
}

const mockTurno2 = {
  id: 'turno-2',
  medico_id: 'med-1',
  paciente_id: 'pac-2',
  pacientes: { nombre: 'Perez' },
  fecha_hora: '2026-07-29T11:00:00Z',
  duracion_minutos: 15,
  estado: 'confirmado',
  notas: null,
  creado_en: '2026-07-29T08:00:00Z',
  actualizado_en: null,
  creado_por: 'med-1',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('cargarTurnos', () => {
  const medicoId = 'med-1'
  const fecha = '2026-07-29'

  it('selects from turnos with medico_id filter and paciente join ordered by fecha_hora ASC', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: [mockTurno, mockTurno2], error: null })
    const mockLt = vi.fn().mockReturnValue({ order: mockOrder })
    const mockGte = vi.fn().mockReturnValue({ lt: mockLt })
    const mockEq = vi.fn().mockReturnValue({ gte: mockGte })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const result = await cargarTurnos(medicoId, fecha)

    expect(mockFrom).toHaveBeenCalledWith('turnos')
    expect(mockEq).toHaveBeenCalledWith('medico_id', medicoId)
    expect(mockGte).toHaveBeenCalledWith('fecha_hora', '2026-07-29T00:00:00.000Z')
    expect(mockLt).toHaveBeenCalledWith('fecha_hora', '2026-07-30T00:00:00.000Z')
    expect(mockOrder).toHaveBeenCalledWith('fecha_hora', { ascending: true })
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('turno-1')
    expect(result[0].paciente_nombre).toBe('Garcia')
    expect(result[1].id).toBe('turno-2')
    expect(result[1].paciente_nombre).toBe('Perez')
  })

  it('filters by fecha range using ISO day boundaries', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: [mockTurno], error: null })
    const mockLt = vi.fn().mockReturnValue({ order: mockOrder })
    const mockGte = vi.fn().mockReturnValue({ lt: mockLt })
    const mockEq = vi.fn().mockReturnValue({ gte: mockGte })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const result = await cargarTurnos(medicoId, '2026-07-30')

    expect(mockGte).toHaveBeenCalledWith('fecha_hora', '2026-07-30T00:00:00.000Z')
    expect(mockLt).toHaveBeenCalledWith('fecha_hora', '2026-07-31T00:00:00.000Z')
    expect(result).toHaveLength(1)
  })

  it('throws on supabase error', async () => {
    const dbError = new Error('Database error')
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: dbError })
    const mockLt = vi.fn().mockReturnValue({ order: mockOrder })
    const mockGte = vi.fn().mockReturnValue({ lt: mockLt })
    const mockEq = vi.fn().mockReturnValue({ gte: mockGte })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    await expect(cargarTurnos(medicoId, fecha)).rejects.toThrow('Database error')
  })
})

describe('crearTurno', () => {
  const medicoId = 'med-1'
  const turnoData = {
    paciente_id: 'pac-1',
    fecha_hora: '2026-07-29T10:00:00Z',
    duracion_minutos: 30,
    notas: 'Control de rutina',
  }

  it('inserts into turnos with correct payload after overlap check passes', async () => {
    // Overlap check: from('turnos').select('id').eq(...).gte(...).lt(...).not(...).order(...).limit(1) → []
    const mockOverlapLimit = vi.fn().mockResolvedValue({ data: [], error: null })
    const mockOverlapOrder = vi.fn().mockReturnValue({ limit: mockOverlapLimit })
    const mockOverlapNot = vi.fn().mockReturnValue({ order: mockOverlapOrder })
    const mockOverlapLt = vi.fn().mockReturnValue({ not: mockOverlapNot })
    const mockOverlapGte = vi.fn().mockReturnValue({ lt: mockOverlapLt })
    const mockOverlapEq = vi.fn().mockReturnValue({ gte: mockOverlapGte })
    const mockOverlapSelect = vi.fn().mockReturnValue({ eq: mockOverlapEq })

    // Insert path: from('turnos').insert({...}).select(`...`).single()
    const mockInsertSingle = vi.fn().mockResolvedValue({ data: mockTurno, error: null })
    const mockInsertSelect = vi.fn().mockReturnValue({ single: mockInsertSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockInsertSelect })

    mockFrom
      .mockReturnValueOnce({ select: mockOverlapSelect })  // overlap check
      .mockReturnValueOnce({ insert: mockInsert })          // insert

    const result = await crearTurno(medicoId, turnoData)

    // Verify overlap check
    expect(mockFrom).toHaveBeenNthCalledWith(1, 'turnos')

    // Verify insert
    expect(mockFrom).toHaveBeenNthCalledWith(2, 'turnos')
    expect(mockInsert).toHaveBeenCalledWith({
      medico_id: medicoId,
      paciente_id: turnoData.paciente_id,
      fecha_hora: turnoData.fecha_hora,
      duracion_minutos: turnoData.duracion_minutos,
      notas: turnoData.notas,
      estado: 'pendiente',
      creado_por: medicoId,
    })
    expect(result.id).toBe('turno-1')
    expect(result.estado).toBe('pendiente')
  })

  it('checks for overlapping turnos before insert (conflict detection)', async () => {
    // Overlap check returns existing turno → should throw
    const mockOverlapLimit = vi.fn().mockResolvedValue({ data: [mockTurno], error: null })
    const mockOverlapOrder = vi.fn().mockReturnValue({ limit: mockOverlapLimit })
    const mockOverlapNot = vi.fn().mockReturnValue({ order: mockOverlapOrder })
    const mockOverlapLt = vi.fn().mockReturnValue({ not: mockOverlapNot })
    const mockOverlapGte = vi.fn().mockReturnValue({ lt: mockOverlapLt })
    const mockOverlapEq = vi.fn().mockReturnValue({ gte: mockOverlapGte })
    const mockOverlapSelect = vi.fn().mockReturnValue({ eq: mockOverlapEq })
    mockFrom.mockReturnValue({ select: mockOverlapSelect })

    await expect(crearTurno(medicoId, turnoData)).rejects.toThrow('superpone')
    // Insert should NOT have been called — only the overlap check happened
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })

  it('throws when overlap detected with existing turno', async () => {
    const mockOverlapLimit = vi.fn().mockResolvedValue({ data: [mockTurno], error: null })
    const mockOverlapOrder = vi.fn().mockReturnValue({ limit: mockOverlapLimit })
    const mockOverlapNot = vi.fn().mockReturnValue({ order: mockOverlapOrder })
    const mockOverlapLt = vi.fn().mockReturnValue({ not: mockOverlapNot })
    const mockOverlapGte = vi.fn().mockReturnValue({ lt: mockOverlapLt })
    const mockOverlapEq = vi.fn().mockReturnValue({ gte: mockOverlapGte })
    const mockOverlapSelect = vi.fn().mockReturnValue({ eq: mockOverlapEq })
    mockFrom.mockReturnValue({ select: mockOverlapSelect })

    await expect(crearTurno(medicoId, turnoData)).rejects.toThrow('superpone')
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })
})

describe('actualizarEstadoTurno', () => {
  const turnoId = 'turno-1'

  it('updates estado and actualizado_en on the correct turno', async () => {
    const mockEq = vi.fn().mockResolvedValue({ data: null, error: null })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ update: mockUpdate })

    await actualizarEstadoTurno(turnoId, 'confirmado')

    expect(mockFrom).toHaveBeenCalledWith('turnos')
    expect(mockUpdate).toHaveBeenCalledWith({
      estado: 'confirmado',
      actualizado_en: expect.any(String),
    })
    expect(mockEq).toHaveBeenCalledWith('id', turnoId)
  })

  it('throws on supabase error', async () => {
    const dbError = new Error('Update failed')
    const mockEq = vi.fn().mockResolvedValue({ data: null, error: dbError })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ update: mockUpdate })

    await expect(actualizarEstadoTurno(turnoId, 'confirmado')).rejects.toThrow('Update failed')
  })
})

describe('eliminarTurno', () => {
  it('deletes the turno by id', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ delete: mockDelete })

    await eliminarTurno('turno-1')

    expect(mockFrom).toHaveBeenCalledWith('turnos')
    expect(mockDelete).toHaveBeenCalledWith()
    expect(mockEq).toHaveBeenCalledWith('id', 'turno-1')
  })

  it('throws on supabase error', async () => {
    const dbError = new Error('Delete failed')
    const mockEq = vi.fn().mockResolvedValue({ error: dbError })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ delete: mockDelete })

    await expect(eliminarTurno('turno-1')).rejects.toThrow('Delete failed')
  })
})
