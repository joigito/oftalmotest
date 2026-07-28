import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { toast } from 'sonner'
import styles from './CrearMedicos.module.css'

interface Medico {
  id: string
  nombre: string
  email: string
}

export default function CrearMedicos() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarMedicos()
  }, [])

  const cargarMedicos = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('medicos')
      .select('id, nombre, email')
      .order('nombre')

    if (error) {
      toast.error('Error al cargar médicos')
    } else {
      setMedicos(data || [])
    }
    setCargando(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nombre.trim() || !email.trim()) {
      toast.error('Completá nombre y email')
      return
    }

    setGuardando(true)

    const { error } = await supabase.from('medicos').insert({
      nombre: nombre.trim(),
      email: email.trim(),
    })

    if (error) {
      toast.error('Error al crear médico: ' + error.message)
    } else {
      toast.success('Médico creado correctamente')
      setNombre('')
      setEmail('')
      cargarMedicos()
    }

    setGuardando(false)
  }

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.backLink}>← Volver al panel</Link>

      <h1 className={styles.title}>Crear Médicos</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="nombre" className={styles.label}>Nombre</label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={styles.input}
            placeholder="Dr. Juan Pérez"
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}>Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            placeholder="juan@ejemplo.com"
            required
          />
        </div>

        <button type="submit" disabled={guardando} className={styles.submitBtn}>
          {guardando ? 'Guardando...' : 'Crear Médico'}
        </button>
      </form>

      <h2 className={styles.listTitle}>Médicos registrados</h2>

      {cargando ? (
        <p className={styles.loading}>Cargando...</p>
      ) : medicos.length === 0 ? (
        <p className={styles.empty}>No hay médicos registrados todavía.</p>
      ) : (
        <ul className={styles.list}>
          {medicos.map((med) => (
            <li key={med.id} className={styles.listItem}>
              <span className={styles.medName}>{med.nombre}</span>
              <span className={styles.medEmail}>{med.email}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
