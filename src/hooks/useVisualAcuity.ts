// Tabla ETDRS/Snellen estándar - tamaños en minutos de arco (logMAR)
// A 6 metros (20 pies), cada fila corresponde a una agudeza visual
// logMAR = log10(denominador/20) para pies, o log10(denominador/6) para metros

export interface SnellenRow {
  logMAR: number
  snellenFt: string    // ej: "20/20", "20/40"
  snellenM: string     // ej: "6/6", "6/12"
  decimal: number      // ej: 1.0, 0.5
  sizePx: number       // tamaño en píxeles (aprox para pantalla estándar)
  letters: string[]    // 5 letras por fila
}

// Configuración estándar ETDRS (letras Sloan: C, D, H, K, N, O, R, S, V, Z)
const SLOAN_LETTERS = ['C', 'D', 'H', 'K', 'N', 'O', 'R', 'S', 'V', 'Z']

// Filas ETDRS estándar (logMAR desde -0.3 hasta 1.0)
// Tamaños aproximados para monitor 24" 1920x1080 a 60cm
export const SNELLEN_ROWS: SnellenRow[] = [
  { logMAR: -0.30, snellenFt: '20/10', snellenM: '6/3',  decimal: 2.00, sizePx: 24, letters: [] },
  { logMAR: -0.20, snellenFt: '20/12', snellenM: '6/3.8', decimal: 1.60, sizePx: 30, letters: [] },
  { logMAR: -0.10, snellenFt: '20/16', snellenM: '6/4.8', decimal: 1.25, sizePx: 38, letters: [] },
  { logMAR: 0.00,  snellenFt: '20/20', snellenM: '6/6',   decimal: 1.00, sizePx: 48, letters: [] },
  { logMAR: 0.10,  snellenFt: '20/25', snellenM: '6/7.5', decimal: 0.80, sizePx: 60, letters: [] },
  { logMAR: 0.18,  snellenFt: '20/30', snellenM: '6/9',   decimal: 0.63, sizePx: 72, letters: [] },
  { logMAR: 0.22,  snellenFt: '20/32', snellenM: '6/9.5', decimal: 0.63, sizePx: 77, letters: [] },
  { logMAR: 0.30,  snellenFt: '20/40', snellenM: '6/12',  decimal: 0.50, sizePx: 96, letters: [] },
  { logMAR: 0.40,  snellenFt: '20/50', snellenM: '6/15',  decimal: 0.40, sizePx: 120, letters: [] },
  { logMAR: 0.48,  snellenFt: '20/60', snellenM: '6/18',  decimal: 0.33, sizePx: 144, letters: [] },
  { logMAR: 0.52,  snellenFt: '20/63', snellenM: '6/19',  decimal: 0.32, sizePx: 152, letters: [] },
  { logMAR: 0.60,  snellenFt: '20/80', snellenM: '6/24',  decimal: 0.25, sizePx: 192, letters: [] },
  { logMAR: 0.70,  snellenFt: '20/100', snellenM: '6/30', decimal: 0.20, sizePx: 240, letters: [] },
  { logMAR: 0.78,  snellenFt: '20/120', snellenM: '6/36', decimal: 0.17, sizePx: 288, letters: [] },
  { logMAR: 0.85,  snellenFt: '20/140', snellenM: '6/42', decimal: 0.14, sizePx: 336, letters: [] },
  { logMAR: 0.90,  snellenFt: '20/160', snellenM: '6/48', decimal: 0.125, sizePx: 384, letters: [] },
  { logMAR: 1.00,  snellenFt: '20/200', snellenM: '6/60', decimal: 0.10, sizePx: 480, letters: [] },
]

// Generar 5 letras aleatorias por fila (sin repetir en la misma fila)
export function generateRowLetters(): string[] {
  const shuffled = [...SLOAN_LETTERS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 5)
}

// Pre-generar letras para cada fila
SNELLEN_ROWS.forEach((row) => {
  row.letters = generateRowLetters()
})

// Calcular agudeza visual final (método ETDRS: logMAR = logMAR_inicio + 0.02 * errores)
export function calculateVisualAcuity(
  results: { rowIndex: number; letterIndex: number; correct: boolean }[],
  startRowIndex: number
): { logMAR: number; snellenFt: string; snellenM: string; decimal: number } {
  // Filtrar solo resultados del ojo actual
  const eyeResults = results.filter(r => r.correct !== undefined)
  
  if (eyeResults.length === 0) {
    return { logMAR: 1.0, snellenFt: '20/200', snellenM: '6/60', decimal: 0.1 }
  }

  // Contar errores totales
  const errors = eyeResults.filter(r => !r.correct).length
  
  // Método ETDRS: cada letra = 0.02 logMAR
  // Empezamos desde la fila donde comenzó el test
  const startLogMAR = SNELLEN_ROWS[startRowIndex]?.logMAR ?? 0.3
  const finalLogMAR = startLogMAR + (errors * 0.02)
  
  // Encontrar la fila más cercana
  let closestRow = SNELLEN_ROWS[0]
  let minDiff = Infinity
  
  for (const row of SNELLEN_ROWS) {
    const diff = Math.abs(row.logMAR - finalLogMAR)
    if (diff < minDiff) {
      minDiff = diff
      closestRow = row
    }
  }
  
  return {
    logMAR: Number(finalLogMAR.toFixed(2)),
    snellenFt: closestRow.snellenFt,
    snellenM: closestRow.snellenM,
    decimal: Number(closestRow.decimal.toFixed(2))
  }
}

// Calcular agudeza por ojo (versión simple: última fila leída correctamente)
export function calculateSimpleAcuity(
  results: { rowIndex: number; letterIndex: number; correct: boolean }[],
  startRowIndex: number
): { logMAR: number; snellenFt: string; snellenM: string; decimal: number } {
  const eyeResults = results.filter(r => r.correct !== undefined)
  
  if (eyeResults.length === 0) {
    return { logMAR: 1.0, snellenFt: '20/200', snellenM: '6/60', decimal: 0.1 }
  }
  
  // Encontrar la última fila donde acertó al menos 3 de 5 letras
  const rowsWithResults = new Map<number, { correct: number; total: number }>()
  
  for (const r of eyeResults) {
    const existing = rowsWithResults.get(r.rowIndex) || { correct: 0, total: 0 }
    existing.total++
    if (r.correct) existing.correct++
    rowsWithResults.set(r.rowIndex, existing)
  }
  
  let lastPassedRow = startRowIndex
  for (let i = startRowIndex; i < SNELLEN_ROWS.length; i++) {
    const rowData = rowsWithResults.get(i)
    if (rowData && rowData.correct >= 3) {
      lastPassedRow = i
    } else if (rowData && rowData.correct < 3) {
      break // Parar en la primera fila donde falla mayoría
    }
  }
  
  const row = SNELLEN_ROWS[lastPassedRow]
  return {
    logMAR: row.logMAR,
    snellenFt: row.snellenFt,
    snellenM: row.snellenM,
    decimal: row.decimal
  }
}