import { useState } from 'react'
import type { Paciente } from '../hooks/usePacientes'
import styles from './PacienteForm.module.css'

interface PacienteFormProps {
  initialData?: Paciente | null
  guardando: boolean
  error: string
  onSubmit: (data: { nombre: string; dni?: string; telefono?: string; fecha_nacimiento?: string }) => void
  onCancel: () => void
  submitLabel?: string
}

export function PacienteForm({
  initialData,
  guardando,
  error,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
}: PacienteFormProps) {
  const [nombre, setNombre] = useState(initialData?.nombre ?? '')
  const [dni, setDni] = useState(initialData?.dni ?? '')
  const [telefono, setTelefono] = useState(initialData?.telefono ?? '')
  const [fechaNacimiento, setFechaNacimiento] = useState(initialData?.fecha_nacimiento ?? '')
  const [validationError, setValidationError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    if (!nombre.trim()) {
      setValidationError('El nombre es obligatorio')
      return
    }

    onSubmit({
      nombre: nombre.trim(),
      dni: dni.trim() || undefined,
      telefono: telefono.trim() || undefined,
      fecha_nacimiento: fechaNacimiento || undefined,
    })
  }

  return (
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
          placeholder="Opcional — se validará unicidad"
        />
        {validationError && <p className={styles.errorText}>{validationError}</p>}
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
        <button type="button" onClick={onCancel} className={styles.btnCancel} disabled={guardando}>
          Cancelar
        </button>
        <button type="submit" disabled={guardando} className={styles.btnSave}>
          {guardando ? 'Guardando...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
