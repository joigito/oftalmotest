import { supabase } from '../lib/supabaseClient'

export interface Turno {
  id: string
  medico_id: string
  paciente_id: string
  paciente_nombre: string
  fecha_hora: string
  duracion_minutos: number
  estado: 'pendiente' | 'confirmado' | 'en_curso' | 'completado' | 'cancelado'
  notas: string | null
  creado_en: string
  actualizado_en: string | null
  creado_por: string
}

interface TurnoRow {
  id: string
  medico_id: string
  paciente_id: string
  pacientes: { nombre: string } | { nombre: string }[]
  fecha_hora: string
  duracion_minutos: number
  estado: string
  notas: string | null
  creado_en: string
  actualizado_en: string | null
  creado_por: string
}

function parseTurnoRow(row: TurnoRow): Turno {
  const pacienteNombre = Array.isArray(row.pacientes)
    ? row.pacientes[0]?.nombre ?? ''
    : (row.pacientes as { nombre: string })?.nombre ?? ''

  return {
    id: row.id,
    medico_id: row.medico_id,
    paciente_id: row.paciente_id,
    paciente_nombre: pacienteNombre,
    fecha_hora: row.fecha_hora,
    duracion_minutos: row.duracion_minutos,
    estado: row.estado as Turno['estado'],
    notas: row.notas,
    creado_en: row.creado_en,
    actualizado_en: row.actualizado_en,
    creado_por: row.creado_por,
  }
}

export const cargarTurnos = async (medicoId: string, fecha: string): Promise<Turno[]> => {
  const startOfDay = new Date(fecha + 'T00:00:00.000Z')
  const endOfDay = new Date(startOfDay)
  endOfDay.setDate(endOfDay.getDate() + 1)

  const { data, error } = await supabase
    .from('turnos')
    .select(`
      id,
      medico_id,
      paciente_id,
      pacientes!inner ( nombre ),
      fecha_hora,
      duracion_minutos,
      estado,
      notas,
      creado_en,
      actualizado_en,
      creado_por
    `)
    .eq('medico_id', medicoId)
    .gte('fecha_hora', startOfDay.toISOString())
    .lt('fecha_hora', endOfDay.toISOString())
    .order('fecha_hora', { ascending: true })

  if (error) throw error

  return ((data || []) as unknown as TurnoRow[]).map(parseTurnoRow)
}

export const verificarSuperposicion = async (
  medicoId: string,
  fechaHora: string,
  duracionMinutos: number
): Promise<boolean> => {
  const start = new Date(fechaHora)
  const end = new Date(start.getTime() + duracionMinutos * 60 * 1000)

  const { data, error } = await supabase
    .from('turnos')
    .select('id')
    .eq('medico_id', medicoId)
    .gte('fecha_hora', start.toISOString())
    .lt('fecha_hora', end.toISOString())
    .not('estado', 'eq', 'cancelado')
    .order('fecha_hora', { ascending: true })
    .limit(1)

  if (error) throw error
  return (data ?? []).length > 0
}

export const crearTurno = async (
  medicoId: string,
  data: {
    paciente_id: string
    fecha_hora: string
    duracion_minutos?: number
    notas?: string
  }
): Promise<Turno> => {
  if (!data.paciente_id) {
    throw new Error('El paciente es obligatorio')
  }
  if (!data.fecha_hora) {
    throw new Error('La fecha y hora son obligatorias')
  }

  const overlap = await verificarSuperposicion(
    medicoId,
    data.fecha_hora,
    data.duracion_minutos ?? 30
  )
  if (overlap) {
    throw new Error('El horario solicitado se superpone con un turno existente')
  }

  const { data: nuevo, error } = await supabase
    .from('turnos')
    .insert({
      medico_id: medicoId,
      paciente_id: data.paciente_id,
      fecha_hora: data.fecha_hora,
      duracion_minutos: data.duracion_minutos ?? 30,
      notas: data.notas ?? null,
      estado: 'pendiente',
      creado_por: medicoId,
    })
    .select(`
      id,
      medico_id,
      paciente_id,
      pacientes!inner ( nombre ),
      fecha_hora,
      duracion_minutos,
      estado,
      notas,
      creado_en,
      actualizado_en,
      creado_por
    `)
    .single()

  if (error) throw error
  return parseTurnoRow(nuevo as unknown as TurnoRow)
}

export const actualizarEstadoTurno = async (
  turnoId: string,
  nuevoEstado: Turno['estado']
): Promise<void> => {
  const { error } = await supabase
    .from('turnos')
    .update({
      estado: nuevoEstado,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', turnoId)

  if (error) throw error
}

export const eliminarTurno = async (turnoId: string): Promise<void> => {
  const { error } = await supabase
    .from('turnos')
    .delete()
    .eq('id', turnoId)

  if (error) throw error
}
