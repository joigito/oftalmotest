import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'

function App() {
  const [tamaño, setTamaño] = useState(80)
  const [letra, setLetra] = useState('E')
  const [resultados, setResultados] = useState<any[]>([])
  const [ojo, setOjo] = useState('derecho')
  const [pacienteId, setPacienteId] = useState<string | null>(null)
  const [consultorioId, setConsultorioId] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [listaPacientes, setListaPacientes] = useState<any[]>([])
  const [cargandoPacientes, setCargandoPacientes] = useState(true)

  const letras = ['E', 'F', 'P', 'T', 'O', 'Z', 'L', 'D', 'C', 'H']
  const tamaños = [80, 70, 60, 50, 40, 30, 25, 20, 15, 10]

  // Cargar pacientes
  useEffect(() => {
    const cargarDatos = async () => {
      const CONSULTORIO_FIJO = '6019ee21-1ce9-4030-b776-b93c67ff358a'
      setConsultorioId(CONSULTORIO_FIJO)
      
      setCargandoPacientes(true)
      
      const { data, error } = await supabase
        .from('pacientes')  // ← CAMBIADO: sin oftalmologia.
        .select('id, nombre, dni')
        .eq('consultorio_id', CONSULTORIO_FIJO)
        .order('nombre')
      
      if (error) {
        console.error('Error cargando pacientes:', error)
      } else if (data && data.length > 0) {
        setListaPacientes(data)
        setPacienteId(data[0].id)
        console.log('Pacientes cargados:', data.length)
      } else {
        console.log('No hay pacientes. Creá uno en Supabase')
      }
      setCargandoPacientes(false)
    }
    
    cargarDatos()
  }, [])

  // Guardar prueba
  const guardarPruebaEnSupabase = async () => {
    if (!pacienteId || !consultorioId) {
      alert('Falta paciente o consultorio. No se puede guardar.')
      return
    }
    
    if (resultados.length === 0) {
      alert('No hay resultados para guardar.')
      return
    }
    
    setGuardando(true)
    
    const { data, error } = await supabase
      .from('pruebas')  // ← CAMBIADO: sin oftalmologia.
      .insert({
        consultorio_id: consultorioId,
        paciente_id: pacienteId,
        fecha: new Date().toISOString(),
        resultados: {
          ojo: ojo,
          resultados_parciales: resultados,
          tamanios_usados: tamaños,
          letras_usadas: letras
        },
        finalizado: true
      })
    
    if (error) {
      console.error('Error guardando:', error)
      alert('Error al guardar en Supabase: ' + error.message)
    } else {
      console.log('Guardado exitoso:', data)
      const pacienteNombre = listaPacientes.find(p => p.id === pacienteId)?.nombre || 'Desconocido'
      alert(`✅ Prueba guardada correctamente para: ${pacienteNombre}`)
    }
    
    setGuardando(false)
  }

  const letraCorrecta = () => {
    const nuevosResultados = [...resultados, { 
      ojo: ojo, 
      tamaño: tamaño, 
      letra: letra, 
      acerto: true,
      hora: new Date().toLocaleTimeString()
    }]
    setResultados(nuevosResultados)
    
    const idxActual = tamaños.indexOf(tamaño)
    if (idxActual < tamaños.length - 1) {
      setTamaño(tamaños[idxActual + 1])
    }
    setLetra(letras[Math.floor(Math.random() * letras.length)])
    
    if (idxActual === tamaños.length - 1) {
      setTimeout(() => {
        guardarPruebaEnSupabase()
      }, 500)
    }
  }

  const letraIncorrecta = () => {
    const nuevosResultados = [...resultados, { 
      ojo: ojo, 
      tamaño: tamaño, 
      letra: letra, 
      acerto: false,
      hora: new Date().toLocaleTimeString()
    }]
    setResultados(nuevosResultados)
    setLetra(letras[Math.floor(Math.random() * letras.length)])
  }

  const cambiarOjo = (nuevoOjo: string) => {
    if (resultados.length > 0) {
      guardarPruebaEnSupabase()
    }
    setOjo(nuevoOjo)
    setResultados([])
    setTamaño(80)
    setLetra('E')
  }

  // Teclado
  useEffect(() => {
    const manejarTecla = (event: KeyboardEvent) => {
      if (event.key === 'a' || event.key === 'A') {
        letraCorrecta()
      } else if (event.key === 's' || event.key === 'S') {
        letraIncorrecta()
      } else if (event.key === 'f' || event.key === 'F') {
        cambiarOjo(ojo === 'derecho' ? 'izquierdo' : 'derecho')
      }
    }
    
    window.addEventListener('keydown', manejarTecla)
    return () => window.removeEventListener('keydown', manejarTecla)
  }, [letraCorrecta, letraIncorrecta, cambiarOjo, ojo])

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Test Oftalmológico 👁️</h1>

      {/* Selector de paciente */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <label style={{ fontWeight: 'bold', marginRight: '10px' }}>
          👤 Paciente:
        </label>
        <select 
          value={pacienteId || ''}
          onChange={(e) => setPacienteId(e.target.value)}
          style={{ padding: '8px', fontSize: '16px', minWidth: '200px' }}
          disabled={cargandoPacientes}
        >
          <option value="">-- Seleccionar paciente --</option>
          {listaPacientes.map(pac => (
            <option key={pac.id} value={pac.id}>
              {pac.nombre} {pac.dni ? `(${pac.dni})` : ''}
            </option>
          ))}
        </select>
        {cargandoPacientes && <span style={{ marginLeft: '10px' }}>⏳ Cargando...</span>}
        {!cargandoPacientes && listaPacientes.length === 0 && (
          <span style={{ marginLeft: '10px', color: 'red' }}>
            ⚠️ No hay pacientes. Creá uno en Supabase.
          </span>
        )}
      </div>

      {guardando && <p style={{ color: 'blue', fontWeight: 'bold' }}>💾 Guardando...</p>}

      <div>
        <button onClick={() => cambiarOjo('derecho')} style={estiloBoton(ojo === 'derecho')}>
          Ojo Derecho 👁️
        </button>
        <button onClick={() => cambiarOjo('izquierdo')} style={estiloBoton(ojo === 'izquierdo')}>
          Ojo Izquierdo 👁️
        </button>
      </div>
      
      <div style={{ marginTop: '40px', marginBottom: '40px' }}>
        <p style={{ fontSize: `${tamaño}px`, fontWeight: 'bold', letterSpacing: '10px' }}>
          {letra}
        </p>
        <p>Tamaño: {tamaño}px</p>
      </div>
      
      <div>
        <button onClick={letraCorrecta} style={estiloBotonCorrecto}>
          ✅ Leyó Bien (A)
        </button>
        <button onClick={letraIncorrecta} style={estiloBotonError}>
          ❌ Leyó Mal (S)
        </button>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={guardarPruebaEnSupabase} 
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          💾 Guardar Manualmente
        </button>
      </div>
      
      <div style={{ marginTop: '30px', textAlign: 'left', maxWidth: '600px', margin: '30px auto' }}>
        <h3>Resultados de esta sesión:</h3>
        <ul style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {resultados.map((r, i) => (
            <li key={i} style={{ margin: '5px 0' }}>
              {r.hora} - Ojo {r.ojo} - Tamaño {r.tamaño}px - Letra {r.letra} - 
              {r.acerto ? ' ✅ Correcta' : ' ❌ Incorrecta'}
            </li>
          ))}
        </ul>
        {resultados.length === 0 && <p>Todavía no hay resultados. Hacé clic en los botones.</p>}
        <p style={{ fontSize: '12px', color: '#666', marginTop: '20px' }}>
          💡 Atajo de teclado: <strong>A</strong> = Leyó Bien | <strong>S</strong> = Leyó Mal | <strong>F</strong> = Cambiar Ojo
        </p>
      </div>
    </div>
  )
}

const estiloBoton = (activo: boolean) => ({
  padding: '10px 20px',
  margin: '10px',
  backgroundColor: activo ? '#007bff' : '#ccc',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  transition: 'all 0.3s'
})

const estiloBotonCorrecto = {
  padding: '15px 30px',
  margin: '10px',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '16px',
  transition: 'all 0.3s'
}

const estiloBotonError = {
  padding: '15px 30px',
  margin: '10px',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '16px',
  transition: 'all 0.3s'
}

export default App