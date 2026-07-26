import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import { Login } from './components/Login'
import TestOftalmologico from './TestOftalmologico'
import { Toaster } from 'sonner'
import { ThemeProvider } from './context/ThemeContext'
import { ThemeToggle } from './components/ThemeToggle'
import styles from './App.module.css'

function AppContent() {
  const [session, setSession] = useState<any>(null)
  const [cargando, setCargando] = useState(true)

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
    return <Login onLogin={() => {}} />
  }

  return (
    <div className={styles.app}>
      <Toaster position="top-right" />
      <header className={styles.header}>
        <h1 className={styles.title}>👁️ Sistema Oftalmológico</h1>
        <div className={styles.headerRight}>
          <span className={styles.userEmail}>{session.user.email}</span>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className={styles.logoutBtn}
          >
            Cerrar Sesión
          </button>
        </div>
      </header>
      <main className={styles.main}>
        <TestOftalmologico consultorioId="6019ee21-1ce9-4030-b776-b93c67ff358a" />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}