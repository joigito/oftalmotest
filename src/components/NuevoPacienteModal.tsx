import { useState } from 'react'
import { crearPaciente } from '../hooks/usePacientes'
import type { Paciente } from '../hooks/usePacientes'
import styles from './NuevoPacienteModal.module.css'

interface NuevoPacienteModalProps {
  medicoId: string
  onPacienteCreado: (paciente: Paciente) => void
  onClose: () => void
}

export function NuevoPacienteModal({ medicoId, onPacienteCreado, onClose }: NuevoPacienteModalProps) {
  const [nombre, setNombre] = useState('')
  const [dni, setDni] = useState('')
  const [telefono, setTelefono] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    setGuardando(true)

    try {
      const paciente = await crearPaciente(medicoId, {
        nombre: nombre.trim(),
        dni: dni.trim() || undefined,
        telefono: telefono.trim() || undefined,
        fecha_nacimiento: fechaNacimiento || undefined
      })
      
      onPacienteCreado(paciente)
      setNombre('')
      setDni('')
      setTelefono('')
      setFechaNacimiento('')
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      const code = typeof err === 'object' && err !== null && 'code' in err ? (err as { code: string }).code : null
      if (code === '23505') {
        setError('Ya existe un paciente con ese DNI')
      } else {
        setError('Error al crear paciente: ' + message)
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
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
            {error && <p className={styles.errorText}>{error}</p>}
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
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Fecha de nacimiento</label>
            <input
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              className={styles.input}
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