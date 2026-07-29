import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useMedico } from '../hooks/useMedico'
import { cargarTurnos, crearTurno, actualizarEstadoTurno } from '../hooks/useTurnos'
import { cargarPacientes } from '../hooks/usePacientes'
import type { Turno } from '../hooks/useTurnos'
import type { TurnoFormData } from '../components/TurnoForm'
import { TurnoForm } from '../components/TurnoForm'
import { toast } from 'sonner'
import styles from './Turnos.module.css'

type ModalMode = 'create' | null

type Rol = 'admin' | 'medico' | 'secretario'

const TRANSICIONES_PERMITIDAS: Record<string, Array<{ label: string; estado: Turno['estado']; secretario?: boolean }>> = {
  pendiente: [
    { label: 'Confirmar', estado: 'confirmado' },
    { label: 'Cancelar', estado: 'cancelado' },
  ],
  confirmado: [
    { label: 'Iniciar', estado: 'en_curso', secretario: false },
    { label: 'Cancelar', estado: 'cancelado' },
  ],
  en_curso: [
    { label: 'Completar', estado: 'completado', secretario: false },
    { label: 'Cancelar', estado: 'cancelado' },
  ],
  completado: [],
  cancelado: [],
}

const COLORES_ESTADO: Record<string, string> = {
  pendiente: styles.estadoPendiente,
  confirmado: styles.estadoConfirmado,
  en_curso: styles.estadoEnCurso,
  completado: styles.estadoCompletado,
  cancelado: styles.estadoCancelado,
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function toISODateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatHora(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function getTransiciones(estado: string, rol: Rol): Array<{ label: string; estado: Turno['estado'] }> {
  const transiciones = TRANSICIONES_PERMITIDAS[estado] || []
  if (rol === 'secretario') {
    return transiciones.filter((t) => t.secretario !== false)
  }
  return transiciones
}

export function Turnos() {
  const { medicoId, rol, cargando: cargandoRol } = useMedico()
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [cargando, setCargando] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [cancelConfirm, setCancelConfirm] = useState<Turno | null>(null)
  const [pacientes, setPacientes] = useState<Array<{ id: string; nombre: string }>>([])

  const cargarLista = useCallback(async () => {
    if (!medicoId) return
    setCargando(true)
    try {
      const data = await cargarTurnos(medicoId, toISODateString(selectedDate))
      setTurnos(data)
    } catch {
      toast.error('Error al cargar turnos')
    } finally {
      setCargando(false)
    }
  }, [medicoId, selectedDate])

  useEffect(() => {
    if (medicoId) {
      cargarLista()
    }
  }, [medicoId, cargarLista])

  const navigateDay = (direction: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + direction)
    setSelectedDate(newDate)
  }

  const resetToday = () => {
    setSelectedDate(new Date())
  }

  const abrirCreate = async () => {
    setError('')
    setModalMode('create')
    if (medicoId && pacientes.length === 0) {
      const data = await cargarPacientes(medicoId)
      setPacientes(data)
    }
  }

  const cerrarModal = () => {
    setModalMode(null)
    setError('')
  }

  const handleCreate = async (data: TurnoFormData) => {
    if (!medicoId) return
    setGuardando(true)
    setError('')
    try {
      await crearTurno(medicoId, {
        paciente_id: data.paciente_id,
        fecha_hora: data.fecha_hora,
        duracion_minutos: data.duracion_minutos,
        notas: data.notas,
      })
      toast.success('Turno creado correctamente')
      cerrarModal()
      cargarLista()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
    } finally {
      setGuardando(false)
    }
  }

  const handleStatusAction = async (turno: Turno, nuevoEstado: Turno['estado']) => {
    if (nuevoEstado === 'cancelado') {
      setCancelConfirm(turno)
      return
    }

    setGuardando(true)
    try {
      await actualizarEstadoTurno(turno.id, nuevoEstado)
      toast.success(`Turno ${nuevoEstado}`)
      cargarLista()
    } catch {
      toast.error('Error al actualizar turno')
    } finally {
      setGuardando(false)
    }
  }

  const handleCancelConfirm = async () => {
    if (!cancelConfirm) return
    setGuardando(true)
    try {
      await actualizarEstadoTurno(cancelConfirm.id, 'cancelado')
      toast.success('Turno cancelado')
      setCancelConfirm(null)
      cargarLista()
    } catch {
      toast.error('Error al cancelar turno')
    } finally {
      setGuardando(false)
    }
  }

  if (cargandoRol) {
    return <div className={styles.loading}>Cargando...</div>
  }

  if (rol !== 'admin' && rol !== 'medico' && rol !== 'secretario') {
    return null
  }

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.backLink}>← Volver al panel</Link>

      <div className={styles.header}>
        <h1 className={styles.title}>Turnos del Día</h1>
        <button onClick={abrirCreate} className={styles.createBtn}>
          + Nuevo Turno
        </button>
      </div>

      {/* Date Navigation */}
      <div className={styles.dateNav}>
        <button onClick={() => navigateDay(-1)} className={styles.navBtn}>◀</button>
        <div className={styles.dateInfo}>
          <span className={styles.dateText}>{formatDate(selectedDate)}</span>
          <button onClick={resetToday} className={styles.todayBtn}>Hoy</button>
        </div>
        <button onClick={() => navigateDay(1)} className={styles.navBtn}>▶</button>
      </div>

      {/* Agenda List */}
      {cargando ? (
        <p className={styles.loading}>Cargando turnos...</p>
      ) : turnos.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No hay turnos para esta fecha.</p>
          <button onClick={abrirCreate} className={styles.emptyCreateBtn}>
            + Crear primer turno
          </button>
        </div>
      ) : (
        <ul className={styles.agendaList}>
          {turnos.map((turno) => (
            <li key={turno.id} className={styles.agendaItem}>
              <div className={styles.timeCol}>
                <span className={styles.timeText}>{formatHora(turno.fecha_hora)}</span>
                <span className={styles.durationText}>{turno.duracion_minutos} min</span>
              </div>
              <div className={styles.infoCol}>
                <span className={styles.pacienteName}>{turno.paciente_nombre}</span>
                {turno.notas && <span className={styles.notasText}>{turno.notas}</span>}
              </div>
              <div className={styles.statusCol}>
                <span className={`${styles.statusBadge} ${COLORES_ESTADO[turno.estado] || ''}`}>
                  {turno.estado.replace('_', ' ')}
                </span>
              </div>
              <div className={styles.actionsCol}>
                {getTransiciones(turno.estado, rol as Rol).map((accion) => (
                  <button
                    key={accion.estado}
                    onClick={() => handleStatusAction(turno, accion.estado)}
                    className={accion.estado === 'cancelado' ? styles.cancelBtn : styles.actionBtn}
                    disabled={guardando}
                  >
                    {accion.label}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Create Modal */}
      {modalMode === 'create' && (
        <div className={styles.overlay} onClick={cerrarModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Nuevo Turno</h2>
            <TurnoForm
              pacientes={pacientes}
              guardando={guardando}
              error={error}
              onSubmit={handleCreate}
              onCancel={cerrarModal}
              submitLabel="Guardar Turno"
            />
          </div>
        </div>
      )}

      {/* Cancel Confirm Dialog */}
      {cancelConfirm && (
        <div className={styles.overlay} onClick={() => setCancelConfirm(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>Cancelar turno</h3>
            <p className={styles.confirmText}>
              ¿Estás seguro de cancelar el turno de <strong>{cancelConfirm.paciente_nombre}</strong> a las{' '}
              {formatHora(cancelConfirm.fecha_hora)}?
            </p>
            <div className={styles.confirmActions}>
              <button
                onClick={() => setCancelConfirm(null)}
                className={styles.btnCancel}
                disabled={guardando}
              >
                No, mantener
              </button>
              <button
                onClick={handleCancelConfirm}
                className={styles.btnDeleteConfirm}
                disabled={guardando}
              >
                {guardando ? 'Cancelando...' : 'Sí, cancelar turno'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
