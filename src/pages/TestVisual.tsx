import { Link } from 'react-router-dom'
import TestOftalmologico from '../TestOftalmologico'
import { useMedico } from '../hooks/useMedico'
import styles from './TestVisual.module.css'

export function TestVisual() {
  const { medicoId, cargando, error } = useMedico()

  if (cargando) {
    return <div className={styles.loading}>Cargando...</div>
  }

  if (error || !medicoId) {
    return (
      <div className={styles.container}>
        <Link to="/" className={styles.backLink}>← Volver al panel</Link>
        <div className={styles.errorBox}>
          <h2>⚠️ Configuración requerida</h2>
          <p>{error || 'No se encontró médico asociado a tu cuenta.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.backLink}>← Volver al panel</Link>
      <TestOftalmologico medicoId={medicoId} />
    </div>
  )
}
