import { supabase } from '../lib/supabaseClient'

export interface Paciente {
  id: string
  nombre: string
  dni: string | null
  telefono: string | null
  fecha_nacimiento: string | null
}

interface MedicoPacienteRow {
  paciente_id: string
  pacientes: {
    id: string
    nombre: string
    dni: string | null
    telefono: string | null
    fecha_nacimiento: string | null
  }
}

// Cargar pacientes vinculados al médico actual (tabla pivote medico_paciente)
export const cargarPacientes = async (medicoId: string): Promise<Paciente[]> => {
  const { data, error } = await supabase
    .from('medico_paciente')
    .select(`
      paciente_id,
      pacientes!inner (
        id,
        nombre,
        dni,
        telefono,
        fecha_nacimiento
      )
    `)
    .eq('medico_id', medicoId)
    .eq('activo', true)
    .order('pacientes.nombre', { ascending: true })

  if (error) {
    return []
  }

  // Mapear a formato plano
  return ((data || []) as unknown as MedicoPacienteRow[]).map((item) => ({
    id: item.pacientes.id,
    nombre: item.pacientes.nombre,
    dni: item.pacientes.dni,
    telefono: item.pacientes.telefono,
    fecha_nacimiento: item.pacientes.fecha_nacimiento
  }))
}

// Crear paciente y vincular automáticamente al médico
export const crearPaciente = async (
  medicoId: string,
  paciente: { nombre: string; dni?: string; telefono?: string; fecha_nacimiento?: string }
) => {
  // 1. Crear paciente (o buscar si ya existe por DNI)
  let pacienteId: string

  if (paciente.dni) {
    const { data: existente } = await supabase
      .from('pacientes')
      .select('id')
      .eq('dni', paciente.dni)
      .single()

    if (existente) {
      pacienteId = existente.id
    }
  }

  if (!pacienteId!) {
    const { data: nuevo, error } = await supabase
      .from('pacientes')
      .insert({
        nombre: paciente.nombre,
        dni: paciente.dni ?? null,
        telefono: paciente.telefono || null,
        fecha_nacimiento: paciente.fecha_nacimiento || null
      })
      .select('id')
      .single()

    if (error) throw error
    pacienteId = nuevo.id
  }

  // 2. Vincular a médico (upsert en tabla pivote)
  const { error: linkError } = await supabase
    .from('medico_paciente')
    .upsert({
      medico_id: medicoId,
      paciente_id: pacienteId,
      activo: true
    }, {
      onConflict: 'medico_id,paciente_id'
    })

  if (linkError) throw linkError

  // 3. Devolver paciente completo
  const { data, error: fetchError } = await supabase
    .from('pacientes')
    .select('id, nombre, dni, telefono, fecha_nacimiento')
    .eq('id', pacienteId)
    .single()

  if (fetchError) throw fetchError
  return data
}

// Actualizar paciente
export const actualizarPaciente = async (
  _medicoId: string,
  pacienteId: string,
  data: { nombre?: string; dni?: string; telefono?: string; fecha_nacimiento?: string }
): Promise<Paciente> => {
  const { data: updated, error } = await supabase
    .from('pacientes')
    .update(data)
    .eq('id', pacienteId)
    .select('id, nombre, dni, telefono, fecha_nacimiento')
    .single()

  if (error) throw error
  return updated
}

// Eliminar (desactivar) vinculación de paciente
export const eliminarPaciente = async (
  medicoId: string,
  pacienteId: string
): Promise<void> => {
  const { error } = await supabase
    .from('medico_paciente')
    .update({ activo: false })
    .eq('medico_id', medicoId)
    .eq('paciente_id', pacienteId)

  if (error) throw error
}

// Guardar test
export interface TestResultados {
  ojo: 'derecho' | 'izquierdo'
  resultados_parciales: Array<{
    rowIndex: number
    letterIndex: number
    letter: string
    correct: boolean
    eye: 'derecho' | 'izquierdo'
    time: string
  }>
  agudeza_derecho: { snellenFt: string; decimal: number } | null
  agudeza_izquierdo: { snellenFt: string; decimal: number } | null
  filas_usadas: Array<{
    logMAR: number
    snellenFt: string
    snellenM: string
    sizePx: number
  }>
}

export const guardarTest = async (
  medicoId: string,
  pacienteId: string,
  resultados: TestResultados
) => {
  const { data, error } = await supabase
    .from('pruebas')
    .insert({
      medico_id: medicoId,
      paciente_id: pacienteId,
      fecha: new Date().toISOString(),
      resultados,
      finalizado: true
    })

  if (error) {
    return null
  }
  return data
}