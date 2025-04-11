import React from 'react';

/**
 * Componente para gestionar advertencias de inconsistencias lógicas
 * Versión mejorada con visualización detallada y explicaciones adicionales
 */
const GestionInconsistencias = ({
    mostrarAdvertencia,
    inconsistenciaDetectada,
    tablero,
    celdasDescubiertas,
    setMostrarAdvertencia,
    aplicarRespuestaConInconsistencia,
    tema
}) => {
    if (!mostrarAdvertencia || !inconsistenciaDetectada) return null;
    
    // Extraer la información de la inconsistencia para un mensaje más específico
    const { contradicciones } = inconsistenciaDetectada;
    const tipoContradiccion = contradicciones && contradicciones[0] ? contradicciones[0].tipo : '';
    
    // Función para generar un mensaje más amigable según el tipo de contradicción
    const obtenerMensajeAmigable = () => {
        if (!contradicciones || contradicciones.length === 0) {
            return "Se ha detectado una inconsistencia lógica en el tablero. Revisa las reglas de Buscaminas.";
        }
        
        const contradiccion = contradicciones[0];
        
        switch (contradiccion.tipo) {
            case 'exceso_minas':
            case 'exceso_minas_global':
                return `Inconsistencia: La celda (${contradiccion.celda.fila + 1},${contradiccion.celda.columna + 1}) indica ${contradiccion.valor} minas, pero hay ${contradiccion.confirmadas || contradiccion.actual} minas confirmadas cerca. Esto viola las reglas básicas del Buscaminas.`;
                
            case 'exceso_banderas':
            case 'exceso_banderas_global':
                return `Inconsistencia: La celda (${contradiccion.celda.fila + 1},${contradiccion.celda.columna + 1}) indica ${contradiccion.valor} minas, pero ya hay ${contradiccion.actual || contradiccion.banderas} banderas colocadas alrededor. Esto viola las reglas básicas del Buscaminas.`;
                
            case 'faltan_celdas':
            case 'minas_insuficientes':
                return `Inconsistencia: La celda (${contradiccion.celda.fila + 1},${contradiccion.celda.columna + 1}) necesita ${contradiccion.necesarias || contradiccion.faltantes} minas más, pero solo quedan ${contradiccion.restantes || contradiccion.disponibles} celdas sin descubrir. Esto crearía una situación imposible en el juego.`;
                
            case 'valor_imposible':
                return `Inconsistencia: La celda (${contradiccion.celda.fila + 1},${contradiccion.celda.columna + 1}) no puede tener un valor de ${contradiccion.valor}, ya que solo tiene ${contradiccion.maximo} celdas adyacentes por su posición en el tablero.`;
                
            case 'cero_con_banderas':
                return `Inconsistencia: Has indicado que no hay minas alrededor (0 o vacío), pero hay ${contradiccion.banderas} banderas ya colocadas cerca. Si no hay minas, no puede haber banderas.`;
                
            case 'grupo_sin_solucion':
                return `Inconsistencia lógica: No existe ninguna configuración válida de minas para este grupo de celdas. Esto crearía un tablero imposible de resolver.`;
                
            default:
                return "Se ha detectado una inconsistencia con las reglas de Buscaminas. Revisa tu respuesta.";
        }
    };
    
    // Obtener una explicación visual de la inconsistencia
    const obtenerExplicacionVisual = () => {
        if (!contradicciones || contradicciones.length === 0) return null;
        
        const contradiccion = contradicciones[0];
        
        if (!contradiccion.celda) return null;
        
        const { fila, columna } = contradiccion.celda;
        
        // Si es un número, mostrar las celdas adyacentes
        if (celdasDescubiertas.some(c => c.fila === fila && c.columna === columna) && 
            tablero[fila][columna] && !isNaN(tablero[fila][columna])) {
            
            return (
                <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm font-medium mb-2">Visualización del problema:</p>
                    <div className="flex justify-center">
                        {/* Miniatura 3x3 para mostrar el problema */}
                        <div className="grid grid-cols-3 gap-1">
                            {[-1, 0, 1].map(i => (
                                [-1, 0, 1].map(j => {
                                    const celdaFila = fila + i;
                                    const celdaColumna = columna + j;
                                    
                                    // Si es la celda central (el número)
                                    if (i === 0 && j === 0) {
                                        return (
                                            <div key={`${i}-${j}`} className="w-8 h-8 bg-blue-200 dark:bg-blue-800 border border-blue-400 dark:border-blue-600 flex items-center justify-center font-bold">
                                                {tablero[fila][columna]}
                                            </div>
                                        );
                                    }
                                    
                                    // Si está fuera de los límites del tablero
                                    if (celdaFila < 0 || celdaFila >= tablero.length || 
                                        celdaColumna < 0 || celdaColumna >= tablero[0].length) {
                                        return (
                                            <div key={`${i}-${j}`} className="w-8 h-8 bg-gray-300 dark:bg-gray-600 border border-gray-400 dark:border-gray-500"></div>
                                        );
                                    }
                                    
                                    // Si tiene bandera
                                    const tieneBandera = celdasDescubiertas.some(c => 
                                        c.fila === celdaFila && c.columna === celdaColumna && 
                                        tablero[celdaFila][celdaColumna] === 'M'
                                    );
                                    
                                    // Si es una celda descubierta
                                    const estaDescubierta = celdasDescubiertas.some(c => 
                                        c.fila === celdaFila && c.columna === celdaColumna
                                    );
                                    
                                    // Determinar el estilo según el estado
                                    let estilo = "w-8 h-8 border flex items-center justify-center ";
                                    
                                    if (tieneBandera) {
                                        estilo += "bg-red-100 dark:bg-red-900 border-red-400 dark:border-red-700";
                                    } else if (estaDescubierta) {
                                        estilo += "bg-gray-100 dark:bg-gray-700 border-gray-400 dark:border-gray-600";
                                    } else {
                                        estilo += "bg-gray-200 dark:bg-gray-800 border-gray-400 dark:border-gray-600";
                                    }
                                    
                                    return (
                                        <div key={`${i}-${j}`} className={estilo}>
                                            {tieneBandera ? "🚩" : estaDescubierta ? (tablero[celdaFila][celdaColumna] || "") : ""}
                                        </div>
                                    );
                                })
                            ))}
                        </div>
                    </div>
                </div>
            );
        }
        
        return null;
    };
    
    // Obtener una explicación detallada sobre la inconsistencia
    const obtenerExplicacionDetallada = () => {
        if (!contradicciones || contradicciones.length === 0) return null;
        
        const contradiccion = contradicciones[0];
        
        let textoExplicacion = "";
        
        switch (contradiccion.tipo) {
            case 'exceso_minas':
            case 'exceso_minas_global':
            case 'exceso_banderas':
            case 'exceso_banderas_global':
                textoExplicacion = "En el Buscaminas, el número en una celda indica exactamente cuántas minas hay en las 8 celdas adyacentes. Si hay más minas o banderas que ese número, el juego se vuelve imposible de resolver.";
                break;
                
            case 'faltan_celdas':
            case 'minas_insuficientes':
                textoExplicacion = "Para mantener la consistencia, debe haber suficientes celdas sin descubrir para colocar todas las minas que indica el número. De lo contrario, el juego se vuelve matemáticamente imposible.";
                break;
                
            case 'valor_imposible':
                textoExplicacion = "Las celdas en las esquinas solo tienen 3 celdas adyacentes. Las celdas en los bordes tienen 5. Solo las celdas interiores tienen 8 adyacentes. Un número no puede ser mayor que la cantidad de celdas adyacentes.";
                break;
                
            case 'cero_con_banderas':
                textoExplicacion = "Una celda con valor 0 o vacía indica que no hay ninguna mina en sus celdas adyacentes. Si hay banderas colocadas cerca, es imposible que sea 0.";
                break;
                
            default:
                textoExplicacion = "Las reglas del Buscaminas exigen que los números sean consistentes con la cantidad de minas adyacentes en todo momento.";
        }
        
        return (
            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg text-xs">
                <h4 className="font-medium mb-1">¿Por qué es esto una inconsistencia?</h4>
                <p>{textoExplicacion}</p>
            </div>
        );
    };
    
    // Determinar qué tan grave es la inconsistencia
    const esContradiccionCritica = tipoContradiccion === 'exceso_minas' || 
                                   tipoContradiccion === 'exceso_minas_global' ||
                                   tipoContradiccion === 'exceso_banderas' ||
                                   tipoContradiccion === 'exceso_banderas_global';
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg mx-auto text-center ${
                esContradiccionCritica ? 'border-4 border-red-500 dark:border-red-700' : 'border-4 border-yellow-500 dark:border-yellow-700'
            }`}>
                <h2 className={`text-xl font-bold mb-4 ${
                    esContradiccionCritica ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                    {esContradiccionCritica ? 'Error de Reglas de Buscaminas' : 'Advertencia de Inconsistencia'}
                </h2>
                
                <p className="mb-4 dark:text-gray-300">{obtenerMensajeAmigable()}</p>
                
                {obtenerExplicacionVisual()}
                {obtenerExplicacionDetallada()}
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <button 
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded"
                        onClick={() => setMostrarAdvertencia(false)}
                    >
                        Corregir mi respuesta
                    </button>
                    <button 
                        className={`px-4 py-2 ${esContradiccionCritica ? 'bg-gray-500 dark:bg-gray-600 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800'} text-white rounded`}
                        onClick={aplicarRespuestaConInconsistencia}
                        disabled={esContradiccionCritica}
                    >
                        {esContradiccionCritica ? 'No permitido' : 'Continuar de todos modos'}
                    </button>
                </div>
                
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                    <p>Nota: Las inconsistencias críticas que violan reglas fundamentales de Buscaminas nunca se pueden ignorar.</p>
                </div>
            </div>
        </div>
    );
};

export default GestionInconsistencias;