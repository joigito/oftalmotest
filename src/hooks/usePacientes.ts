import { supabase } from '../lib/supabaseClient'

// Esta función la vas a usar desde App.tsx o desde donde necesites
export const cargarPacientes = async (consultorioId: string) => {
  const { data, error } = await supabase
    .from('pacientes')
    .select('id, nombre, dni, telefono, fecha_nacimiento')
    .eq('consultorio_id', consultorioId)
    .order('nombre', { ascending: true })
  
  if (error) {
    console.error('Error cargando pacientes:', error)
    return []
  }
  return data || []
}

export const guardarTest = async (pacienteId: string, consultorioId: string, resultados: any) => {
  const { data, error } = await supabase
    .from('pruebas')
    .insert({
      consultorio_id: consultorioId,
      paciente_id: pacienteId,
      fecha: new Date().toISOString(),
      resultados: {
        tipo: 'test_letras',
        aciertos: resultados.aciertos,
        errores: resultados.errores,
        teclas_presionadas: resultados.teclas
      },
      finalizado: true
    })
  
  if (error) {
    console.error('Error guardando test:', error)
    return null
  }
  return data
}