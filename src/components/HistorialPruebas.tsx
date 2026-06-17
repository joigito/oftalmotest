import { PDFDownloadLink } from '@react-pdf/renderer'
import { ReportePDF } from './ReportePDF'

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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        width: '650px',
        maxWidth: '90%',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        {/* HEADER con botones */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <h2 style={{ margin: 0 }}>📊 Historial de {pacienteNombre}</h2>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            {/* Botón PDF */}
            <PDFDownloadLink
              document={<ReportePDF pacienteNombre={pacienteNombre} historial={historial} />}
              fileName={`resultados_${pacienteNombre}_${new Date().toISOString().slice(0,10)}.pdf`}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                textDecoration: 'none',
                fontSize: '14px',
                display: 'inline-block'
              }}
            >
              {({ loading }) => loading ? '⏳ Generando...' : '📄 PDF'}
            </PDFDownloadLink>
            
            {/* Botón Cerrar */}
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ✕ Cerrar
            </button>
          </div>
        </div>
        
        {/* CONTENIDO */}
        {cargando ? (
          <p style={{ textAlign: 'center', padding: '30px' }}>⏳ Cargando historial...</p>
        ) : historial.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
            🕊️ Este paciente aún no tiene pruebas registradas.
          </p>
        ) : (
          <div>
            {/* Resumen */}
            <div style={{
              backgroundColor: '#f0f8ff',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '15px',
              border: '1px solid #d0e8ff'
            }}>
              <p style={{ margin: 0, fontSize: '14px' }}>
                <strong>📋 Resumen:</strong> {historial.length} pruebas | 
                ✅ {totalAciertos} aciertos | ❌ {totalFallos} fallos | 
                🎯 {historial.length > 0 ? Math.round((totalAciertos / (totalAciertos + totalFallos)) * 100) : 0}% efectividad
              </p>
            </div>

            {/* Lista de pruebas */}
            {historial.map((prueba, index) => {
              const resultados = prueba.resultados || {}
              const parciales = resultados.resultados_parciales || []
              const aciertos = parciales.filter((r: any) => r.acerto).length
              const fallos = parciales.filter((r: any) => !r.acerto).length
              
              return (
                <div key={index} style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '12px 15px',
                  marginBottom: '10px',
                  backgroundColor: '#f9f9f9'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <strong>#{index + 1} - {new Date(prueba.fecha).toLocaleDateString()}</strong>
                    <span style={{ color: '#666' }}>{new Date(prueba.fecha).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '14px' }}>
                    <span style={{ color: '#28a745' }}>✅ Aciertos: {aciertos}</span>
                    {' | '}
                    <span style={{ color: '#dc3545' }}>❌ Fallos: {fallos}</span>
                    {' | '}
                    <span>👁️ {resultados.ojo || 'No especificado'}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    Último tamaño: {parciales.length > 0 ? parciales[parciales.length - 1].tamaño : 'N/A'}px
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}