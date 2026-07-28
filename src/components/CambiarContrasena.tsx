import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toast } from 'sonner'
import styles from './CambiarContrasena.module.css'

interface CambiarContrasenaProps {
  onClose: () => void
}

export function CambiarContrasena({ onClose }: CambiarContrasenaProps) {
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [guardando, setGuardando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (nueva.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (nueva !== confirmar) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setGuardando(true)

    const { error } = await supabase.auth.updateUser({ password: nueva })

    if (error) {
      toast.error('Error al cambiar contraseña: ' + error.message)
    } else {
      toast.success('Contraseña actualizada correctamente')
      onClose()
    }

    setGuardando(false)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>🔑 Cambiar Contraseña</h2>

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="nueva" className={styles.label}>Nueva contraseña</label>
            <input
              id="nueva"
              type="password"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              className={styles.input}
              minLength={6}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmar" className={styles.label}>Confirmar contraseña</label>
            <input
              id="confirmar"
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className={styles.input}
              minLength={6}
              required
            />
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.btnCancel}>
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className={styles.btnSave}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
