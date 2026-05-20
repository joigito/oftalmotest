// Al principio del archivo, en la definición del componente:
interface TestLetrasProps {
  onComplete: (resultados: any) => void  // ← AGREGÁ ESTA LÍNEA
}

// Modificá la función del componente:
export function TestLetras({ onComplete }: TestLetrasProps) {  // ← AGREGÁ onComplete acá
  // ... todo tu código actual ...
  
  // Cuando el test termina (donde mostrás el resultado), llamá a onComplete:
  const terminarTest = () => {
    const resultados = {
      aciertos: contadorAciertos,  // ajustá según tu variable
      errores: contadorErrores,     // ajustá según tu variable
      teclas: historialTeclas       // ajustá según tu variable
    }
    onComplete(resultados)
  }
  
  // ... resto de tu código
}