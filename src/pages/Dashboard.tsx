import { Link } from 'react-router-dom'
import { useMedico } from '../hooks/useMedico'
import type { Rol } from '../hooks/useMedico'
import styles from './Dashboard.module.css'

interface ModuleItem {
  title: string
  description: string
  icon: string
  path: string
  roles: Rol[]
  disabled?: boolean
}

const modules: ModuleItem[] = [
  {
    title: 'Test Visual',
    description: 'Realizar test oftalmológico ETDRS a un paciente',
    icon: '👁️',
    path: '/test',
    roles: ['admin', 'medico'],
  },
  {
    title: 'Crear Médicos',
    description: 'Registrar nuevos médicos en el sistema',
    icon: '👨‍⚕️',
    path: '/medicos',
    roles: ['admin'],
  },
  {
    title: 'Pacientes',
    description: 'Gestionar historiales y datos de pacientes',
    icon: '🧑‍🤝‍🧑',
    path: '',
    roles: ['admin', 'medico'],
    disabled: true,
  },
  {
    title: 'Turnos',
    description: 'Gestionar turnos de atención',
    icon: '📅',
    path: '',
    roles: ['admin', 'medico', 'secretario'],
    disabled: true,
  },
  {
    title: 'Reportes',
    description: 'Estadísticas y reportes de pruebas realizadas',
    icon: '📊',
    path: '',
    roles: ['admin', 'medico'],
    disabled: true,
  },
]

export function Dashboard() {
  const { rol } = useMedico()

  const visibleModules = modules.filter((mod) =>
    rol ? mod.roles.includes(rol) : mod.roles.includes('medico')
  )

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Panel Principal</h1>
      <p className={styles.subtitle}>Seleccioná una opción para comenzar</p>

      <div className={styles.grid}>
        {visibleModules.map((mod) =>
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
