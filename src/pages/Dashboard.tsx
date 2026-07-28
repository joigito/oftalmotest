import { Link } from 'react-router-dom'
import styles from './Dashboard.module.css'

interface ModuleItem {
  title: string
  description: string
  icon: string
  path: string
  disabled?: boolean
}

const modules: ModuleItem[] = [
  {
    title: 'Test Visual',
    description: 'Realizar test oftalmológico ETDRS a un paciente',
    icon: '👁️',
    path: '/test',
  },
  {
    title: 'Crear Médicos',
    description: 'Registrar nuevos médicos en el sistema',
    icon: '👨‍⚕️',
    path: '/medicos',
  },
  {
    title: 'Pacientes',
    description: 'Gestionar historiales y datos de pacientes',
    icon: '🧑‍🤝‍🧑',
    path: '',
    disabled: true,
  },
  {
    title: 'Reportes',
    description: 'Estadísticas y reportes de pruebas realizadas',
    icon: '📊',
    path: '',
    disabled: true,
  },
]

export default function Dashboard() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Panel Principal</h1>
      <p className={styles.subtitle}>Seleccioná una opción para comenzar</p>

      <div className={styles.grid}>
        {modules.map((mod) =>
          mod.disabled ? (
            <div key={mod.title} className={`${styles.card} ${styles.disabled}`}>
              <span className={styles.icon}>{mod.icon}</span>
              <h2 className={styles.cardTitle}>{mod.title}</h2>
              <p className={styles.cardDescription}>{mod.description}</p>
              <span className={styles.comingSoon}>Próximamente</span>
            </div>
          ) : (
            <Link key={mod.title} to={mod.path} className={styles.card}>
              <span className={styles.icon}>{mod.icon}</span>
              <h2 className={styles.cardTitle}>{mod.title}</h2>
              <p className={styles.cardDescription}>{mod.description}</p>
            </Link>
          )
        )}
      </div>
    </div>
  )
}
