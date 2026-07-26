import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import styles from './NuevoPacienteModal.module.css'

interface NuevoPacienteModalProps {
  consultorioId: string
  onPacienteCreado: (paciente: any) => void
  onClose: () => void
}

export function NuevoPacienteModal({ consultorioId, onPacienteCreado, onClose }: NuevoPacienteModalProps) {
  const [nombre, setNombre] = useState('')
  const [dni, setDni] = useState('')
  const [telefono, setTelefono] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    if (dni.trim()) {
      const { data: existente, error: checkError } = await supabase
        .from('pacientes')
        .select('id')
        .eq('dni', dni.trim())
        .eq('consultorio_id', consultorioId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error verificando DNI:', checkError)
        setError('Error al verificar DNI')
        return
      }

      if (existente) {
        setError('Ya existe un paciente con ese DNI en este consultorio')
        return
      }
    }

    setGuardando(true)

    const { data, error } = await supabase
      .from('pacientes')
      .insert({
        nombre: nombre.trim(),
        dni: dni.trim() || null,
        telefono: telefono.trim() || null,
        consultorio_id: consultorioId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creando paciente:', error)
      setError('Error al crear paciente: ' + error.message)
    } else {
      onPacienteCreado(data)
      setNombre('')
      setDni('')
      setTelefono('')
      onClose()
    }
    setGuardando(false)
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>➕ Nuevo Paciente</h2>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={styles.input}
              autoFocus
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>DNI</label>
            <input
              type="text"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              className={styles.input}
              placeholder="Opcional - se validará unicidad"
            />
            {error && <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{error}</p>}
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Teléfono</label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className={styles.input}
              placeholder="Opcional"
            />
          </div>
          
          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnCancel}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className={styles.btnSave}
            >
              {guardando ? 'Guardando...' : 'Guardar Paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}