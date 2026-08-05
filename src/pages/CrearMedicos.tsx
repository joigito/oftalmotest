import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useMedico } from '../hooks/useMedico'
import { MedicoForm } from '../components/MedicoForm'
import { toast } from 'sonner'
import styles from './CrearMedicos.module.css'

interface Medico {
  id: string
  nombre: string
  email: string
  rol: string
}

type ModalMode = 'create' | 'edit' | null

export function CrearMedicos() {
  const { rol, cargando: cargandoRol } = useMedico()
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [cargando, setCargando] = useState(true)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [medicoEditando, setMedicoEditando] = useState<Medico | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<Medico | null>(null)

  useEffect(() => {
    cargarMedicos()
  }, [])

  const cargarMedicos = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('medicos')
      .select('id, nombre, email, rol')
      .order('nombre')

    if (error) {
      toast.error('Error al cargar médicos')
    } else {
      setMedicos(data || [])
    }
    setCargando(false)
  }

  const abrirCreate = () => {
    setMedicoEditando(null)
    setError('')
    setModalMode('create')
  }

  const abrirEdit = (medico: Medico) => {
    setMedicoEditando(medico)
    setError('')
    setModalMode('edit')
  }

  const cerrarModal = () => {
    setModalMode(null)
    setMedicoEditando(null)
    setError('')
  }

  const handleCreate = async (data: { nombre: string; email: string; rol: string; password?: string }) => {
    setGuardando(true)
    setError('')
    try {
      const { error: rpcError } = await supabase.rpc('crear_medico', {
        p_nombre: data.nombre,
        p_email: data.email,
        p_password: data.password!,
        p_rol: data.rol,
      })

      if (rpcError) {
        throw new Error(rpcError.message)
      }

      toast.success('Médico creado correctamente')
      cerrarModal()
      cargarMedicos()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError('Error al crear médico: ' + message)
    } finally {
      setGuardando(false)
    }
  }

  const handleUpdate = async (data: { nombre: string; email: string; rol: string }) => {
    if (!medicoEditando) return
    setGuardando(true)
    setError('')
    try {
      const { error: rpcError } = await supabase.rpc('actualizar_medico', {
        p_medico_id: medicoEditando.id,
        p_nombre: data.nombre,
        p_email: data.email,
        p_rol: data.rol,
      })

      if (rpcError) {
        throw new Error(rpcError.message)
      }

      toast.success('Médico actualizado correctamente')
      cerrarModal()
      cargarMedicos()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError('Error al actualizar médico: ' + message)
    } finally {
      setGuardando(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setGuardando(true)
    try {
      const { error: rpcError } = await supabase.rpc('eliminar_medico', {
        p_medico_id: deleteConfirm.id,
      })

      if (rpcError) {
        throw new Error(rpcError.message)
      }

      toast.success('Médico eliminado correctamente')
      setDeleteConfirm(null)
      cargarMedicos()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      toast.error('Error al eliminar médico: ' + message)
    } finally {
      setGuardando(false)
    }
  }

  const rolLabel = (r: string): string => {
    const labels: Record<string, string> = {
      admin: 'Admin',
      medico: 'Médico',
      secretario: 'Secretario',
    }
    return labels[r] || r
  }

  if (cargandoRol) {
    return <div className={styles.loading}>Cargando...</div>
  }

  if (rol !== 'admin') {
    return <Navigate to="/" replace />
  }

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.backLink}>← Volver al panel</Link>

      <div className={styles.header}>
        <h1 className={styles.title}>Médicos</h1>
        <button onClick={abrirCreate} className={styles.createBtn}>
          + Nuevo Médico
        </button>
      </div>

      {cargando ? (
        <p className={styles.loading}>Cargando médicos...</p>
      ) : medicos.length === 0 ? (
        <p className={styles.empty}>No hay médicos registrados todavía.</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {medicos.map((med) => (
                <tr key={med.id}>
                  <td className={styles.nameCell}>{med.nombre}</td>
                  <td>{med.email}</td>
                  <td>
                    <span className={`${styles.rolBadge} ${styles[`rolBadge_${med.rol}` as keyof typeof styles] || ''}`}>
                      {rolLabel(med.rol)}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <button
                      onClick={() => abrirEdit(med)}
                      className={styles.editBtn}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(med)}
                      className={styles.deleteBtn}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalMode && (
        <div className={styles.overlay} onClick={cerrarModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {modalMode === 'create' ? '➕ Nuevo Médico' : '✏️ Editar Médico'}
            </h2>
            <MedicoForm
              key={modalMode === 'edit' ? medicoEditando?.id : 'create'}
              initialData={modalMode === 'edit' ? medicoEditando : null}
              guardando={guardando}
              error={error}
              onSubmit={modalMode === 'create' ? handleCreate : handleUpdate}
              onCancel={cerrarModal}
              submitLabel={modalMode === 'create' ? 'Guardar Médico' : 'Actualizar Médico'}
            />
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteConfirm && (
        <div className={styles.overlay} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>Eliminar médico</h3>
            <p className={styles.confirmText}>
              ¿Seguro de eliminar a <strong>{deleteConfirm.nombre}</strong>?
              {guardando && ' Eliminando...'}
            </p>
            <div className={styles.confirmActions}>
              <button
                onClick={() => setDeleteConfirm(null)}
                className={styles.btnCancel}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className={styles.btnDeleteConfirm}
                disabled={guardando}
              >
                {guardando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
