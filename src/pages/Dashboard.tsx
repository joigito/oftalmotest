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
}

const modules: ModuleItem[] = [
  {
    title: 'Turnos',
    description: 'Gestionar turnos de atención',
    icon: '📅',
    path: '/turnos',
    roles: ['admin', 'medico', 'secretario'],
  },
  {
    title: 'Pacientes',
    description: 'Gestionar historiales y datos de pacientes',
    icon: '🧑‍🤝‍🧑',
    path: '/pacientes',
    roles: ['admin', 'medico'],
  },
  {
    title: 'Test Visual',
    description: 'Realizar test oftalmológico ETDRS a un paciente',
    icon: '👁️',
    path: '/test',
    roles: ['admin', 'medico'],
  },
  {
    title: 'Reportes',
    description: 'Estadísticas y reportes de pruebas realizadas',
    icon: '📊',
    path: '/reportes',
    roles: ['admin', 'medico'],
  },
  {
    title: 'Crear Médicos',
    description: 'Registrar nuevos médicos en el sistema',
    icon: '👨‍⚕️',
    path: '/medicos',
    roles: ['admin'],
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
        {visibleModules.map((mod) => (
          <Link key={mod.title} to={mod.path} className={styles.card}>
            <span className={styles.icon}>{mod.icon}</span>
            <h2 className={styles.cardTitle}>{mod.title}</h2>
            <p className={styles.cardDescription}>{mod.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
