import { useState } from 'react'
import styles from './TurnoForm.module.css'

export interface TurnoFormData {
  paciente_id: string
  fecha_hora: string
  duracion_minutos: number
  notas: string
}

interface TurnoFormProps {
  pacientes: Array<{ id: string; nombre: string }>
  onSubmit: (data: TurnoFormData) => void
  onCancel: () => void
  guardando?: boolean
  error?: string
  initialData?: TurnoFormData | null
  submitLabel?: string
}

const DURACIONES = [15, 30, 45, 60]

export function TurnoForm({
  pacientes,
  onSubmit,
  onCancel,
  guardando = false,
  error = '',
  initialData,
  submitLabel = 'Guardar Turno',
}: TurnoFormProps) {
  const [pacienteId, setPacienteId] = useState(initialData?.paciente_id ?? '')
  const [fechaHora, setFechaHora] = useState(initialData?.fecha_hora ?? '')
  const [duracion, setDuracion] = useState(initialData?.duracion_minutos ?? 30)
  const [notas, setNotas] = useState(initialData?.notas ?? '')
  const [validationError, setValidationError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    if (!pacienteId) {
      setValidationError('Debe seleccionar un paciente')
      return
    }
    if (!fechaHora) {
      setValidationError('Debe seleccionar fecha y hora')
      return
    }

    onSubmit({
      paciente_id: pacienteId,
      fecha_hora: fechaHora,
      duracion_minutos: duracion,
      notas: notas.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="turno-paciente">Paciente *</label>
        <select
          id="turno-paciente"
          value={pacienteId}
          onChange={(e) => setPacienteId(e.target.value)}
          className={styles.select}
        >
          <option value="">Seleccionar paciente...</option>
          {pacientes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="turno-fecha">Fecha y Hora *</label>
        <input
          id="turno-fecha"
          type="datetime-local"
          value={fechaHora}
          onChange={(e) => setFechaHora(e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Duración</label>
        <div className={styles.durationGroup}>
          {DURACIONES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuracion(d)}
              className={`${styles.durationBtn} ${duracion === d ? styles.durationActive : ''}`}
            >
              {d} min
            </button>
          ))}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="turno-notas">Notas</label>
        <textarea
          id="turno-notas"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          className={styles.textarea}
          rows={3}
          placeholder="Opcional — observaciones..."
        />
      </div>

      {validationError && <p className={styles.errorText}>{validationError}</p>}
      {error && <p className={styles.errorText}>{error}</p>}

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
