import { PDFDownloadLink } from '@react-pdf/renderer'
import { ReportePDF } from './ReportePDF'
import styles from './HistorialPruebas.module.css'

interface HistorialPruebasProps {
  historial: any[]
  pacienteNombre: string
  onClose: () => void
  cargando: boolean
}

export function HistorialPruebas({ historial, pacienteNombre, onClose, cargando }: HistorialPruebasProps) {
  // Calcular totales para el resumen
  const totalAciertos = historial.reduce((acc, prueba) => {
    const parciales = prueba.resultados?.resultados_parciales || []
    return acc + parciales.filter((r: any) => r.acerto).length
  }, 0)
  
  const totalFallos = historial.reduce((acc, prueba) => {
    const parciales = prueba.resultados?.resultados_parciales || []
    return acc + parciales.filter((r: any) => !r.acerto).length
  }, 0)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* HEADER con botones */}
        <div className={styles.header}>
          <h2 className={styles.title}>📊 Historial de {pacienteNombre}</h2>
          
          <div className={styles.actions}>
            {/* Botón PDF */}
            <PDFDownloadLink
              document={<ReportePDF pacienteNombre={pacienteNombre} historial={historial} />}
              fileName={`resultados_${pacienteNombre}_${new Date().toISOString().slice(0,10)}.pdf`}
              className={styles.btnPDF}
            >
              {({ loading }) => loading ? '⏳ Generando...' : '📄 PDF'}
            </PDFDownloadLink>
            
            {/* Botón Cerrar */}
            <button
              onClick={onClose}
              className={styles.btnClose}
            >
              ✕ Cerrar
            </button>
          </div>
        </div>
        
        {/* CONTENIDO */}
        {cargando ? (
          <p className={styles.loading}>⏳ Cargando historial...</p>
        ) : historial.length === 0 ? (
          <p className={styles.empty}>🕊️ Este paciente aún no tiene pruebas registradas.</p>
        ) : (
          <div>
            {/* Resumen */}
            <div className={styles.summary}>
              <p className={styles.summaryText}>
                <strong>📋 Resumen:</strong> {historial.length} pruebas | 
                ✅ {totalAciertos} aciertos | ❌ {totalFallos} fallos | 
                🎯 {historial.length > 0 ? Math.round((totalAciertos / (totalAciertos + totalFallos)) * 100) : 0}% efectividad
              </p>
            </div>

            {/* Lista de pruebas */}
            <div className={styles.testList}>
              {historial.map((prueba, index) => {
                const resultados = prueba.resultados || {}
                const parciales = resultados.resultados_parciales || []
                const aciertos = parciales.filter((r: any) => r.acerto).length
                const fallos = parciales.filter((r: any) => !r.acerto).length
                
                return (
                  <div key={index} className={styles.testItem}>
                    <div className={styles.testHeader}>
                      <strong className={styles.testNumber}>#{index + 1} - {new Date(prueba.fecha).toLocaleDateString()}</strong>
                      <span className={styles.testTime}>{new Date(prueba.fecha).toLocaleTimeString()}</span>
                    </div>
                    <div className={styles.testStats}>
                      <span className={styles.statCorrect}>✅ Aciertos: {aciertos}</span>
                      <span className={styles.statError}>❌ Fallos: {fallos}</span>
                      <span className={styles.statEye}>👁️ {resultados.ojo || 'No especificado'}</span>
                    </div>
                    <div className={styles.testDetail}>
                      Último tamaño: {parciales.length > 0 ? parciales[parciales.length - 1].tamaño : 'N/A'}px
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}