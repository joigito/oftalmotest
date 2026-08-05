import { useState } from 'react'
import type { Rol } from '../hooks/useMedico'
import styles from './MedicoForm.module.css'

interface MedicoFormProps {
  initialData?: { id: string; nombre: string; email: string; rol: string } | null
  guardando: boolean
  error: string
  onSubmit: (data: { nombre: string; email: string; rol: string; password?: string }) => void
  onCancel: () => void
  submitLabel?: string
}

const ROLES: { value: Rol; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'medico', label: 'Médico' },
  { value: 'secretario', label: 'Secretario' },
]

export function MedicoForm({
  initialData,
  guardando,
  error,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
}: MedicoFormProps) {
  const isEdit = !!initialData
  const [nombre, setNombre] = useState(initialData?.nombre ?? '')
  const [email, setEmail] = useState(initialData?.email ?? '')
  const [rol, setRol] = useState(initialData?.rol ?? 'medico')
  const [password, setPassword] = useState('')
  const [validationError, setValidationError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    if (!nombre.trim()) {
      setValidationError('El nombre es obligatorio')
      return
    }

    if (!email.trim()) {
      setValidationError('El email es obligatorio')
      return
    }

    if (!email.includes('@')) {
      setValidationError('El email no es válido')
      return
    }

    if (!isEdit && !password.trim()) {
      setValidationError('La contraseña es obligatoria')
      return
    }

    if (!isEdit && password.length < 6) {
      setValidationError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    const payload: { nombre: string; email: string; rol: string; password?: string } = {
      nombre: nombre.trim(),
      email: email.trim(),
      rol,
    }

    if (!isEdit) {
      payload.password = password
    }

    onSubmit(payload)
  }

  return (
    <form data-testid="medico-form" onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="medico-nombre" className={styles.label}>Nombre *</label>
        <input
          id="medico-nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className={styles.input}
          placeholder="Dr. Juan Pérez"
          autoFocus
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="medico-email" className={styles.label}>Email *</label>
        <input
          id="medico-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          placeholder="juan@ejemplo.com"
          required
        />
        {validationError && <p className={styles.errorText}>{validationError}</p>}
        {error && <p className={styles.errorText}>{error}</p>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="medico-rol" className={styles.label}>Rol</label>
        <select
          id="medico-rol"
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          className={styles.select}
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {!isEdit && (
        <div className={styles.formGroup}>
          <label htmlFor="medico-password" className={styles.label}>Contraseña *</label>
          <input
            id="medico-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            placeholder="Mínimo 6 caracteres"
            minLength={6}
            required
          />
        </div>
      )}

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
