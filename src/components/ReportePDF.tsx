import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff'
  },
  title: {
    fontSize: 22,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666'
  },
  patientInfo: {
    fontSize: 12,
    marginBottom: 20,
    borderBottom: '1px solid #ccc',
    paddingBottom: 15
  },
  resumen: {
    fontSize: 12,
    marginBottom: 15,
    backgroundColor: '#f0f8ff',
    padding: 10,
    borderRadius: 4
  },
  pruebaContainer: {
    marginBottom: 12,
    borderBottom: '1px solid #eee',
    paddingBottom: 10
  },
  pruebaHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4
  },
  pruebaDetail: {
    fontSize: 10,
    marginBottom: 2
  },
  acierto: {
    color: 'green'
  },
  fallo: {
    color: 'red'
  },
  footer: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 30,
    color: '#999'
  }
})

interface ReportePDFProps {
  pacienteNombre: string
  historial: any[]
}

export function ReportePDF({ pacienteNombre, historial }: ReportePDFProps) {
  const totalAciertos = historial.reduce((acc, prueba) => {
    const parciales = prueba.resultados?.resultados_parciales || []
    return acc + parciales.filter((r: any) => r.acerto).length
  }, 0)
  
  const totalFallos = historial.reduce((acc, prueba) => {
    const parciales = prueba.resultados?.resultados_parciales || []
    return acc + parciales.filter((r: any) => !r.acerto).length
  }, 0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>👁️ INFORME OFTALMOLÓGICO</Text>
        <Text style={styles.subtitle}>Resultados de Agudeza Visual</Text>
        
        <View style={styles.patientInfo}>
          <Text>👤 Paciente: {pacienteNombre}</Text>
          <Text>📅 Fecha de informe: {new Date().toLocaleDateString()}</Text>
          <Text>📊 Total pruebas: {historial.length}</Text>
          <Text>✅ Total aciertos: {totalAciertos}</Text>
          <Text>❌ Total fallos: {totalFallos}</Text>
          <Text>🎯 Efectividad: {historial.length > 0 ? Math.round((totalAciertos / (totalAciertos + totalFallos)) * 100) : 0}%</Text>
        </View>

        <Text style={styles.resumen}>
          📋 DETALLE DE PRUEBAS
        </Text>

        {historial.map((prueba, index) => {
          const resultados = prueba.resultados || {}
          const parciales = resultados.resultados_parciales || []
          const aciertos = parciales.filter((r: any) => r.acerto).length
          const fallos = parciales.filter((r: any) => !r.acerto).length
          
          return (
            <View key={index} style={styles.pruebaContainer}>
              <Text style={styles.pruebaHeader}>
                Prueba #{index + 1} - {new Date(prueba.fecha).toLocaleDateString()} {new Date(prueba.fecha).toLocaleTimeString()}
              </Text>
              <Text style={styles.pruebaDetail}>👁️ Ojo: {resultados.ojo || 'No especificado'}</Text>
              <Text style={styles.pruebaDetail}>
                ✅ Aciertos: {aciertos} | ❌ Fallos: {fallos}
              </Text>
              {parciales.length > 0 && (
                <Text style={styles.pruebaDetail}>
                  📏 Último tamaño logrado: {parciales[parciales.length - 1].tamaño}px
                </Text>
              )}
            </View>
          )
        })}

        <Text style={styles.footer}>
          Sistema Oftalmológico - {new Date().toLocaleDateString()}
        </Text>
      </Page>
    </Document>
  )
}