import { useTheme } from '../context/ThemeContext'
import styles from './ThemeToggle.module.css'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={styles.toggle}
      aria-label={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
      title={`Modo actual: ${theme === 'light' ? '☀️ Claro' : '🌙 Oscuro'} — Click para cambiar`}
    >
      <span className={styles.icon} aria-hidden="true">
        {theme === 'light' ? '🌙' : '☀️'}
      </span>
      <span className={styles.text}>
        {theme === 'light' ? 'Oscuro' : 'Claro'}
      </span>
    </button>
  )
}