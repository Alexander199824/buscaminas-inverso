import React from 'react';

/**
 * Componente mejorado para gestionar advertencias de inconsistencias lógicas
 */
const GestionInconsistencias = ({
    mostrarAdvertencia,
    inconsistenciaDetectada,
    tablero,
    celdasDescubiertas,
    setMostrarAdvertencia,
    aplicarRespuestaConInconsistencia,
    modoValidacion,
    cambiarModoValidacion,
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
                return `Inconsistencia: La celda (${contradiccion.celda.fila + 1},${contradiccion.celda.columna + 1}) indica ${contradiccion.valor} minas, pero hay ${contradiccion.confirmadas} minas confirmadas cerca. Esto viola las reglas básicas del Buscaminas.`;
                
            case 'exceso_banderas':
                return `Inconsistencia: La celda (${contradiccion.celda.fila + 1},${contradiccion.celda.columna + 1}) indica ${contradiccion.valor} minas, pero ya hay ${contradiccion.actual} banderas colocadas alrededor. Esto viola las reglas básicas del Buscaminas.`;
                
            case 'faltan_celdas':
                return `Inconsistencia: La celda (${contradiccion.celda.fila + 1},${contradiccion.celda.columna + 1}) necesita ${contradiccion.necesarias} minas más, pero solo quedan ${contradiccion.restantes} celdas sin descubrir. Esto crearía una situación imposible en el juego.`;
                
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
                <div className="mt-3 p-2 bg-gray-100 rounded-lg">
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
                                            <div key={`${i}-${j}`} className="w-8 h-8 bg-blue-200 border border-blue-400 flex items-center justify-center font-bold">
                                                {tablero[fila][columna]}
                                            </div>
                                        );
                                    }
                                    
                                    // Si está fuera de los límites del tablero
                                    if (celdaFila < 0 || celdaFila >= tablero.length || 
                                        celdaColumna < 0 || celdaColumna >= tablero[0].length) {
                                        return (
                                            <div key={`${i}-${j}`} className="w-8 h-8 bg-gray-300 border border-gray-400"></div>
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
                                        estilo += "bg-red-100 border-red-400";
                                    } else if (estaDescubierta) {
                                        estilo += "bg-gray-100 border-gray-400";
                                    } else {
                                        estilo += "bg-gray-200 border-gray-400";
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
    
    // Determinar qué tan grave es la inconsistencia
    const esContradiccionCritica = tipoContradiccion === 'exceso_minas' || 
                                  tipoContradiccion === 'exceso_banderas';
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto text-center ${
                esContradiccionCritica ? 'border-4 border-red-500' : 'border-4 border-yellow-500'
            }`}>
                <h2 className={`text-xl font-bold mb-4 ${
                    esContradiccionCritica ? 'text-red-600' : 'text-yellow-600'
                }`}>
                    {esContradiccionCritica ? 'Error de Reglas de Buscaminas' : 'Advertencia de Inconsistencia'}
                </h2>
                
                <p className="mb-4">{obtenerMensajeAmigable()}</p>
                
                {obtenerExplicacionVisual()}
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                    {modoValidacion === 'advertir' && (
                        <>
                            <button 
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                onClick={() => setMostrarAdvertencia(false)}
                            >
                                Corregir mi respuesta
                            </button>
                            <button 
                                className={`px-4 py-2 ${esContradiccionCritica ? 'bg-gray-500 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-700'} text-white rounded`}
                                onClick={aplicarRespuestaConInconsistencia}
                                disabled={esContradiccionCritica}
                            >
                                {esContradiccionCritica ? 'No permitido' : 'Continuar de todos modos'}
                            </button>
                        </>
                    )}
                    
                    {modoValidacion === 'impedir' && (
                        <button 
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 col-span-2"
                            onClick={() => setMostrarAdvertencia(false)}
                        >
                            Volver y elegir otra respuesta
                        </button>
                    )}
                </div>
                
                <div className="mt-4">
                    <h3 className="font-semibold mb-2">Preferencias de validación:</h3>
                    <div className="flex justify-center space-x-4">
                        <button 
                            className={`px-3 py-1 rounded ${modoValidacion === 'advertir' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                            onClick={() => cambiarModoValidacion('advertir')}
                            title="Muestra advertencias pero permite continuar en algunos casos"
                        >
                            Advertir
                        </button>
                        <button 
                            className={`px-3 py-1 rounded ${modoValidacion === 'impedir' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                            onClick={() => cambiarModoValidacion('impedir')}
                            title="No permite respuestas inconsistentes"
                        >
                            Impedir
                        </button>
                        <button 
                            className={`px-3 py-1 rounded ${modoValidacion === 'ignorar' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                            onClick={() => cambiarModoValidacion('ignorar')}
                            title="Ignora todas las inconsistencias"
                        >
                            Ignorar
                        </button>
                    </div>
                </div>
                
                <div className="mt-4 text-xs text-gray-500">
                    <p>Nota: Las inconsistencias críticas que violan reglas fundamentales de Buscaminas nunca se pueden ignorar.</p>
                </div>
            </div>
        </div>
    );
};

export default GestionInconsistencias;