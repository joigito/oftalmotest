import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useMedico() {
  const [medicoId, setMedicoId] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cargarMedico = async () => {
      setCargando(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Usuario no autenticado')
        setCargando(false)
        return
      }

      const { data, error } = await supabase
        .from('medicos')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setError('No hay médico vinculado a tu usuario. Contacte al administrador.')
        } else {
          setError('Error al cargar médico: ' + error.message)
        }
      } else if (data) {
        setMedicoId(data.id)
      } else {
        setError('Médico no encontrado')
      }
      setCargando(false)
    }

    cargarMedico()
  }, [])

  return { medicoId, cargando, error }
}