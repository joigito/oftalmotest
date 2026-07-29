import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import type { Session } from '@supabase/supabase-js'
import { Login } from './components/Login'
import { CambiarContrasena } from './components/CambiarContrasena'
import { Dashboard } from './pages/Dashboard'
import { TestVisual } from './pages/TestVisual'
import { CrearMedicos } from './pages/CrearMedicos'
import { Pacientes } from './pages/Pacientes'
import { Toaster } from 'sonner'
import { ThemeProvider } from './context/ThemeContext'
import { ThemeToggle } from './components/ThemeToggle'
import styles from './App.module.css'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [cargando, setCargando] = useState(true)
  const [mostrarCambioPass, setMostrarCambioPass] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setCargando(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (cargando) {
    return <div className={styles.loading}>Cargando...</div>
  }

  if (!session) {
    return <Login />
  }

  return (
    <div className={styles.app}>
      <Toaster position="top-right" />
      <header className={styles.header}>
        <h1 className={styles.title}>👁️ Sistema Oftalmológico</h1>
        <div className={styles.headerRight}>
          <span className={styles.userEmail}>{session.user.email}</span>
          <ThemeToggle />
          <button onClick={() => setMostrarCambioPass(true)} className={styles.linkBtn}>
            🔑
          </button>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Cerrar Sesión
          </button>
        </div>
      </header>
      <main className={styles.main}>
        {children}
      </main>
      {mostrarCambioPass && (
        <CambiarContrasena onClose={() => setMostrarCambioPass(false)} />
      )}
    </div>
  )
}

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthGuard>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/test" element={<TestVisual />} />
            <Route path="/medicos" element={<CrearMedicos />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthGuard>
      </BrowserRouter>
    </ThemeProvider>
  )
}
