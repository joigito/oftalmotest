import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabaseClient'
import { NuevoPacienteModal } from './components/NuevoPacienteModal'
import { HistorialPruebas } from './components/HistorialPruebas'
import { toast } from 'sonner'
import { SNELLEN_ROWS, calculateSimpleAcuity, generateRowLetters } from './hooks/useVisualAcuity'
import styles from './TestOftalmologico.module.css'

interface LetterResult {
  rowIndex: number
  letterIndex: number
  letter: string
  correct: boolean
  eye: 'derecho' | 'izquierdo'
  time: string
}

interface TestState {
  currentRow: number
  currentLetterIndex: number
  results: LetterResult[]
  eye: 'derecho' | 'izquierdo'
  startRow: number
}

const INITIAL_TEST_STATE: TestState = {
  currentRow: 3, // Empezar en 20/20 (logMAR 0.0)
  currentLetterIndex: 0,
  results: [],
  eye: 'derecho',
  startRow: 3,
}

export default function TestOftalmologico({ consultorioId }: { consultorioId: string }) {
  const [testState, setTestState] = useState<TestState>(INITIAL_TEST_STATE)
  const [pacienteId, setPacienteId] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [listaPacientes, setListaPacientes] = useState<any[]>([])
  const [cargandoPacientes, setCargandoPacientes] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [historial, setHistorial] = useState<any[]>([])
  const [mostrandoHistorial, setMostrandoHistorial] = useState(false)
  const [cargandoHistorial, setCargandoHistorial] = useState(false)

  const currentRow = SNELLEN_ROWS[testState.currentRow]
  const currentLetter = currentRow?.letters[testState.currentLetterIndex] || '?'

  // Cargar pacientes
  useEffect(() => {
    const cargarDatos = async () => {
      setCargandoPacientes(true)
      const { data, error } = await supabase
        .from('pacientes')
        .select('id, nombre, dni')
        .eq('consultorio_id', consultorioId)
        .order('nombre')
      
      if (error) {
        console.error('Error cargando pacientes:', error)
      } else if (data && data.length > 0) {
        setListaPacientes(data)
        setPacienteId(data[0].id)
        console.log('Pacientes cargados:', data.length)
      }
      setCargandoPacientes(false)
    }
    cargarDatos()
  }, [consultorioId])

  const rightAcuity = testState.results.some(r => r.eye === 'derecho')
    ? calculateSimpleAcuity(
        testState.results.filter(r => r.eye === 'derecho'),
        testState.startRow
      )
    : null

  const leftAcuity = testState.results.some(r => r.eye === 'izquierdo')
    ? calculateSimpleAcuity(
        testState.results.filter(r => r.eye === 'izquierdo'),
        testState.startRow
      )
    : null

  // Guardar prueba
  const guardarPruebaEnSupabase = async () => {
    if (!pacienteId || !consultorioId) {
      toast.error('Falta paciente o consultorio. No se puede guardar.')
      return
    }
    
    if (testState.results.length === 0) {
      toast.error('No hay resultados para guardar.')
      return
    }
    
    setGuardando(true)
    
    const { error } = await supabase
      .from('pruebas')
      .insert({
        consultorio_id: consultorioId,
        paciente_id: pacienteId,
        fecha: new Date().toISOString(),
        resultados: {
          ojo: testState.eye,
          resultados_parciales: testState.results,
          agudeza_derecho: rightAcuity,
          agudeza_izquierdo: leftAcuity,
          filas_usadas: SNELLEN_ROWS.map(r => ({
            logMAR: r.logMAR,
            snellenFt: r.snellenFt,
            snellenM: r.snellenM,
            sizePx: r.sizePx
          }))
        },
        finalizado: true
      })
    
    if (error) {
      console.error('Error guardando:', error)
      toast.error('Error al guardar en Supabase: ' + error.message)
    } else {
      const pacienteNombre = listaPacientes.find(p => p.id === pacienteId)?.nombre || 'Desconocido'
      toast.success(`Prueba guardada correctamente para: ${pacienteNombre}`)
    }
    
    setGuardando(false)
  }

  // Cargar historial
  const cargarHistorial = async () => {
    if (!pacienteId) {
      toast.error('Primero seleccioná un paciente')
      return
    }
    
    setCargandoHistorial(true)
    setMostrandoHistorial(true)
    
    const { data, error } = await supabase
      .from('pruebas')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: false })
    
    if (error) {
      console.error('Error cargando historial:', error)
      toast.error('Error al cargar el historial')
    } else {
      setHistorial(data || [])
      console.log('Historial cargado:', data?.length, 'pruebas')
    }
    setCargandoHistorial(false)
  }

  const agregarPaciente = (nuevoPaciente: any) => {
    setListaPacientes([...listaPacientes, nuevoPaciente])
    setPacienteId(nuevoPaciente.id)
  }

  const registrarRespuesta = useCallback((correct: boolean) => {
    const { currentRow, currentLetterIndex, eye } = testState
    
    const newResult: LetterResult = {
      rowIndex: currentRow,
      letterIndex: currentLetterIndex,
      letter: currentLetter,
      correct,
      eye,
      time: new Date().toLocaleTimeString()
    }
    
    setTestState(prev => {
      const newResults = [...prev.results, newResult]
      let nextRow = prev.currentRow
      let nextLetterIndex = prev.currentLetterIndex + 1
      
      // Avanzar a siguiente letra
      if (nextLetterIndex >= 5) {
        nextLetterIndex = 0
        nextRow = prev.currentRow + 1
      }
      
      // Si terminó todas las filas, auto-guardar
      if (nextRow >= SNELLEN_ROWS.length) {
        setTimeout(() => guardarPruebaEnSupabase(), 500)
      }
      
      return {
        ...prev,
        currentRow: nextRow,
        currentLetterIndex: nextLetterIndex,
        results: newResults
      }
    })
  }, [testState.currentRow, testState.currentLetterIndex, testState.results, testState.eye])

  const cambiarOjo = useCallback((nuevoOjo: 'derecho' | 'izquierdo') => {
    if (testState.results.length > 0) {
      guardarPruebaEnSupabase()
    }
    // Generar nuevas letras para el nuevo ojo
    SNELLEN_ROWS.forEach((row) => {
      row.letters = generateRowLetters()
    })
    setTestState(prev => ({
      ...prev,
      eye: nuevoOjo,
      currentRow: prev.startRow,
      currentLetterIndex: 0,
      results: prev.results.filter(r => r.eye !== nuevoOjo) // Mantener resultados del otro ojo
    }))
  }, [testState.results.length])

  // Teclado
  useEffect(() => {
    const manejarTecla = (event: KeyboardEvent) => {
      if (event.key === 'a' || event.key === 'A') {
        registrarRespuesta(true)
      } else if (event.key === 's' || event.key === 'S') {
        registrarRespuesta(false)
      } else if (event.key === 'f' || event.key === 'F') {
        cambiarOjo(testState.eye === 'derecho' ? 'izquierdo' : 'derecho')
      }
    }
    
    window.addEventListener('keydown', manejarTecla)
    return () => window.removeEventListener('keydown', manejarTecla)
  }, [registrarRespuesta, cambiarOjo, testState.eye])

  const progress = ((testState.currentRow - testState.startRow) / (SNELLEN_ROWS.length - testState.startRow)) * 100

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Test Oftalmológico ETDRS 👁️</h1>

      {/* Selector de paciente */}
      <div className={styles.patientSelector}>
        <div className={styles.patientRow}>
          <label className={styles.patientLabel}>👤 Paciente:</label>
          <select 
            value={pacienteId || ''}
            onChange={(e) => setPacienteId(e.target.value)}
            className={styles.patientSelect}
            disabled={cargandoPacientes}
          >
            <option value="">-- Seleccionar paciente --</option>
            {listaPacientes.map(pac => (
              <option key={pac.id} value={pac.id}>
                {pac.nombre} {pac.dni ? `(${pac.dni})` : ''}
              </option>
            ))}
          </select>
          
          <button onClick={() => setMostrarModal(true)} className={styles.btnNuevo}>
            ➕ Nuevo
          </button>
          <button onClick={cargarHistorial} className={styles.btnHistorial}>
            📊 Historial
          </button>
        </div>
        
        {cargandoPacientes && <span className={styles.loading}>⏳ Cargando...</span>}
        {!cargandoPacientes && listaPacientes.length === 0 && (
          <span className={styles.noPatients}>⚠️ No hay pacientes. Creá uno.</span>
        )}
      </div>

      {guardando && <p className={styles.saving}>💾 Guardando...</p>}

      {/* Selector de ojo con agudeza calculada */}
      <div className={styles.eyeButtons}>
        <button 
          onClick={() => cambiarOjo('derecho')} 
          className={`${styles.eyeBtn} ${testState.eye === 'derecho' ? styles.eyeBtnActive : styles.eyeBtnInactive}`}
        >
          Ojo Derecho 👁️
          {rightAcuity && <span className={styles.acuityBadge}>{rightAcuity.snellenFt}</span>}
        </button>
        <button 
          onClick={() => cambiarOjo('izquierdo')} 
          className={`${styles.eyeBtn} ${testState.eye === 'izquierdo' ? styles.eyeBtnActive : styles.eyeBtnInactive}`}
        >
          Ojo Izquierdo 👁️
          {leftAcuity && <span className={styles.acuityBadge}>{leftAcuity.snellenFt}</span>}
        </button>
      </div>

      {/* Progreso del test */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className={styles.progressText}>
          Fila {testState.currentRow - testState.startRow + 1} de {SNELLEN_ROWS.length - testState.startRow} 
          ({currentRow?.snellenFt || '—'})
        </p>
      </div>
      
      {/* Letra actual - tamaño según fila ETDRS */}
      <div className={styles.letterDisplay}>
        <p className={styles.letter} style={{ fontSize: `${currentRow?.sizePx || 48}px` }}>
          {currentLetter}
        </p>
        <p className={styles.letterSize}>
          {currentRow?.snellenFt} / {currentRow?.snellenM} 
          (logMAR: {currentRow?.logMAR.toFixed(2)} | {currentRow?.sizePx}px)
        </p>
        <p className={styles.letterHint}>
          Letra {testState.currentLetterIndex + 1} de 5
        </p>
      </div>
      
      <div className={styles.actionButtons}>
        <button onClick={() => registrarRespuesta(true)} className={styles.btnCorrect}>
          ✅ Leyó Bien (A)
        </button>
        <button onClick={() => registrarRespuesta(false)} className={styles.btnError}>
          ❌ Leyó Mal (S)
        </button>
      </div>
      
      <div>
        <button onClick={guardarPruebaEnSupabase} className={styles.btnSave}>
          💾 Guardar Manualmente
        </button>
      </div>
      
      {/* Agudeza actual en vivo */}
      <div className={styles.currentAcuity}>
        <h4>Agudeza actual:</h4>
        <div className={styles.acuityRow}>
          <span>OD: {rightAcuity ? `${rightAcuity.snellenFt} (${rightAcuity.decimal})` : '—'}</span>
          <span>OI: {leftAcuity ? `${leftAcuity.snellenFt} (${leftAcuity.decimal})` : '—'}</span>
        </div>
      </div>

      {/* Resultados detallados */}
      <div className={styles.resultsSection}>
        <h3 className={styles.resultsTitle}>Detalle de respuestas:</h3>
        <ul className={styles.resultsList}>
          {testState.results.map((r, i) => (
            <li key={i} className={`${styles.resultItem} ${r.correct ? styles.correct : styles.incorrect}`}>
              {r.time} | {r.eye === 'derecho' ? 'OD' : 'OI'} | 
              Fila {r.rowIndex + 1} ({SNELLEN_ROWS[r.rowIndex]?.snellenFt}) | 
              Letra {r.letter} | {r.correct ? '✅' : '❌'}
            </li>
          ))}
        </ul>
        {testState.results.length === 0 && <p className={styles.emptyResults}>Todavía no hay resultados. Hacé clic en los botones.</p>}
        <p className={styles.keyboardHint}>
          💡 Atajos: <strong>A</strong> = Leyó Bien | <strong>S</strong> = Leyó Mal | <strong>F</strong> = Cambiar Ojo
        </p>
      </div>

      {/* Modal Nuevo Paciente */}
      {mostrarModal && (
        <NuevoPacienteModal
          consultorioId={consultorioId}
          onPacienteCreado={agregarPaciente}
          onClose={() => setMostrarModal(false)}
        />
      )}

      {/* Modal Historial */}
      {mostrandoHistorial && (
        <HistorialPruebas
          historial={historial}
          pacienteNombre={listaPacientes.find(p => p.id === pacienteId)?.nombre || 'Paciente'}
          cargando={cargandoHistorial}
          onClose={() => {
            setMostrandoHistorial(false)
            setHistorial([])
          }}
        />
      )}
    </div>
  )
}