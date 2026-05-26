import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import { Login } from './components/Login'  // ← con llaves { }
import TestOftalmologico from './TestOftalmologico'

function App() {
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
    return <div style={{ textAlign: 'center', padding: '50px' }}>Cargando...</div>
  }

  if (!session) {
    return <Login onLogin={() => {}} />
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white'
      }}>
        <h2 style={{ margin: 0 }}>👁️ Sistema Oftalmológico</h2>
        <div>
          <span style={{ marginRight: '15px' }}>{session.user.email}</span>
          <button
            onClick={handleLogout}
            style={{
              padding: '5px 10px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
      <TestOftalmologico consultorioId="6019ee21-1ce9-4030-b776-b93c67ff358a" />
    </div>
  )
}

export default App