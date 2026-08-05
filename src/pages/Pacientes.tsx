import { useState, useEffect, useMemo } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useMedico } from '../hooks/useMedico'
import { cargarPacientes, crearPaciente, actualizarPaciente, eliminarPaciente } from '../hooks/usePacientes'
import type { Paciente } from '../hooks/usePacientes'
import { PacienteForm } from '../components/PacienteForm'
import { toast } from 'sonner'
import styles from './Pacientes.module.css'

type ModalMode = 'create' | 'edit' | null

export function Pacientes() {
  const { medicoId, rol, cargando: cargandoRol } = useMedico()
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [cargando, setCargando] = useState(true)
  const [search, setSearch] = useState('')
  const [mostrarInactivos, setMostrarInactivos] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [pacienteEditando, setPacienteEditando] = useState<Paciente | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [deactivateConfirm, setDeactivateConfirm] = useState<Paciente | null>(null)

  useEffect(() => {
    if (medicoId) {
      cargarLista()
    }
  }, [medicoId])

  const cargarLista = async () => {
    if (!medicoId) return
    setCargando(true)
    const data = await cargarPacientes(medicoId)
    setPacientes(data)
    setCargando(false)
  }

  const pacientesFiltrados = useMemo(() => {
    let filtered = pacientes
    if (!mostrarInactivos) {
      // cargarPacientes already returns only active ones, but we keep the toggle for future use
    }
    if (search.trim()) {
      const term = search.toLowerCase()
      filtered = filtered.filter((p) => p.nombre.toLowerCase().includes(term))
    }
    return filtered
  }, [pacientes, search, mostrarInactivos])

  const abrirCreate = () => {
    setPacienteEditando(null)
    setError('')
    setModalMode('create')
  }

  const abrirEdit = (paciente: Paciente) => {
    setPacienteEditando(paciente)
    setError('')
    setModalMode('edit')
  }

  const cerrarModal = () => {
    setModalMode(null)
    setPacienteEditando(null)
    setError('')
  }

  const handleCreate = async (data: { nombre: string; dni?: string; telefono?: string; fecha_nacimiento?: string }) => {
    if (!medicoId) return
    setGuardando(true)
    setError('')
    try {
      await crearPaciente(medicoId, data)
      toast.success('Paciente creado correctamente')
      cerrarModal()
      cargarLista()
    } catch (err: unknown) {
      const code = typeof err === 'object' && err !== null && 'code' in err ? (err as { code: string }).code : null
      const message = err instanceof Error ? err.message : 'Error desconocido'
      if (code === '23505') {
        setError('Ya existe un paciente con ese DNI')
      } else {
        setError('Error al crear paciente: ' + message)
      }
    } finally {
      setGuardando(false)
    }
  }

  const handleUpdate = async (data: { nombre: string; dni?: string; telefono?: string; fecha_nacimiento?: string }) => {
    if (!medicoId || !pacienteEditando) return
    setGuardando(true)
    setError('')
    try {
      await actualizarPaciente(medicoId, pacienteEditando.id, data)
      toast.success('Paciente actualizado correctamente')
      cerrarModal()
      cargarLista()
    } catch (err: unknown) {
      const code = typeof err === 'object' && err !== null && 'code' in err ? (err as { code: string }).code : null
      const message = err instanceof Error ? err.message : 'Error desconocido'
      if (code === '23505') {
        setError('Ya existe un paciente con ese DNI')
      } else {
        setError('Error al actualizar paciente: ' + message)
      }
    } finally {
      setGuardando(false)
    }
  }

  const handleDeactivate = async () => {
    if (!medicoId || !deactivateConfirm) return
    setGuardando(true)
    try {
      await eliminarPaciente(medicoId, deactivateConfirm.id)
      toast.success('Paciente desactivado')
      setDeactivateConfirm(null)
      cargarLista()
    } catch {
      toast.error('Error al desactivar paciente')
    } finally {
      setGuardando(false)
    }
  }

  if (cargandoRol) {
    return <div className={styles.loading}>Cargando...</div>
  }

  if (rol !== 'admin' && rol !== 'medico' && rol !== 'secretario') {
    return <Navigate to="/" replace />
  }

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.backLink}>← Volver al panel</Link>

      <div className={styles.header}>
        <h1 className={styles.title}>Pacientes</h1>
        <button onClick={abrirCreate} className={styles.createBtn}>
          + Nuevo Paciente
        </button>
      </div>

      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={mostrarInactivos}
            onChange={(e) => setMostrarInactivos(e.target.checked)}
            className={styles.toggleCheckbox}
          />
          Mostrar inactivos
        </label>
      </div>

      {cargando ? (
        <p className={styles.loading}>Cargando pacientes...</p>
      ) : pacientesFiltrados.length === 0 ? (
        <p className={styles.empty}>
          {search ? 'No se encontraron pacientes con ese nombre.' : 'No hay pacientes vinculados.'}
        </p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>DNI</th>
                <th>Teléfono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pacientesFiltrados.map((paciente) => (
                <tr key={paciente.id}>
                  <td className={styles.nameCell}>{paciente.nombre}</td>
                  <td>{paciente.dni || '—'}</td>
                  <td>{paciente.telefono || '—'}</td>
                  <td className={styles.actionsCell}>
                    <button
                      onClick={() => abrirEdit(paciente)}
                      className={styles.editBtn}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setDeactivateConfirm(paciente)}
                      className={styles.deleteBtn}
                    >
                      Desactivar
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
              {modalMode === 'create' ? '➕ Nuevo Paciente' : '✏️ Editar Paciente'}
            </h2>
            <PacienteForm
              key={modalMode === 'edit' ? pacienteEditando?.id : 'create'}
              initialData={modalMode === 'edit' ? pacienteEditando : null}
              guardando={guardando}
              error={error}
              onSubmit={modalMode === 'create' ? handleCreate : handleUpdate}
              onCancel={cerrarModal}
              submitLabel={modalMode === 'create' ? 'Guardar Paciente' : 'Actualizar Paciente'}
            />
          </div>
        </div>
      )}

      {/* Deactivate Confirm Dialog */}
      {deactivateConfirm && (
        <div className={styles.overlay} onClick={() => setDeactivateConfirm(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>Desactivar paciente</h3>
            <p className={styles.confirmText}>
              ¿Estás seguro de desactivar a <strong>{deactivateConfirm.nombre}</strong>?
            </p>
            <div className={styles.confirmActions}>
              <button
                onClick={() => setDeactivateConfirm(null)}
                className={styles.btnCancel}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeactivate}
                className={styles.btnDeleteConfirm}
                disabled={guardando}
              >
                {guardando ? 'Desactivando...' : 'Sí, desactivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
