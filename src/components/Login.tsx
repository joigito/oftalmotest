"use client"

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import styles from './Login.module.css'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        const errorMsg = error.message || JSON.stringify(error)
        setError(errorMsg)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión')
    }
    setCargando(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          👁️ Sistema Oftalmológico
        </h1>
        
        <form onSubmit={handleLogin}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="tu@email.com"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="••••••••"
              required
            />
          </div>
          
          {error && (
            <div className={styles.errorBox}>
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={cargando}
            className={styles.submitBtn}
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
