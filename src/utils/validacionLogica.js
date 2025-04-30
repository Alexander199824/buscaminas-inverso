/**
 * Funciones para validar la consistencia lógica del tablero de Buscaminas
 * Implementación simplificada con solo validación básica de posición
 */

/**
 * Obtiene todas las celdas adyacentes a una posición dada
 * @param {number} fila - Fila de la celda
 * @param {number} columna - Columna de la celda
 * @param {Object} tamañoSeleccionado - Objeto con filas y columnas del tablero
 * @returns {Array} Array de objetos con {fila, columna} de las celdas adyacentes
 */
export const obtenerTodasCeldasAdyacentes = (fila, columna, tamañoSeleccionado) => {
    const filasTablero = tamañoSeleccionado.filas;
    const columnasTablero = tamañoSeleccionado.columnas;
    let celdasAdyacentes = [];

    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;

            const nuevaFila = fila + i;
            const nuevaColumna = columna + j;

            // Verificar límites del tablero
            if (
                nuevaFila >= 0 && nuevaFila < filasTablero &&
                nuevaColumna >= 0 && nuevaColumna < columnasTablero
            ) {
                celdasAdyacentes.push({ fila: nuevaFila, columna: nuevaColumna });
            }
        }
    }

    return celdasAdyacentes;
};

/**
 * Obtiene el número máximo posible de celdas adyacentes
 * Útil para verificar inconsistencias en esquinas y bordes
 * @param {number} fila - Fila de la celda
 * @param {number} columna - Columna de la celda
 * @param {Object} tamañoSeleccionado - Tamaño del tablero
 * @returns {number} - Número máximo de celdas adyacentes
 */
export const obtenerMaximoCeldasAdyacentes = (fila, columna, tamañoSeleccionado) => {
    return obtenerTodasCeldasAdyacentes(fila, columna, tamañoSeleccionado).length;
};

/**
 * Verifica si una respuesta es consistente con el estado actual del tablero
 * Solo verifica restricciones de posición (esquinas/bordes)
 * @param {number} fila - Fila de la celda a verificar
 * @param {number} columna - Columna de la celda a verificar
 * @param {string} respuesta - Respuesta proporcionada ('vacío', 'mina', o un número)
 * @param {Array} tablero - Estado actual del tablero
 * @param {Array} celdasDescubiertas - Celdas ya descubiertas
 * @param {Array} banderas - Celdas marcadas con bandera
 * @param {Object} tamañoSeleccionado - Tamaño del tablero
 * @returns {Object} Objeto con {esConsistente, mensaje, contradicciones}
 */
export const verificarConsistenciaRespuesta = (
    fila, 
    columna, 
    respuesta, 
    tablero, 
    celdasDescubiertas, 
    banderas, 
    tamañoSeleccionado
) => {
    // ÚNICA VERIFICACIÓN: Si es un número, verificar que no sea mayor que el máximo posible
    if (respuesta !== 'vacío' && respuesta !== 'mina' && !isNaN(respuesta)) {
        const numeroMinas = parseInt(respuesta);
        const maximoAdyacentes = obtenerMaximoCeldasAdyacentes(fila, columna, tamañoSeleccionado);
        
        if (numeroMinas > maximoAdyacentes) {
            return {
                esConsistente: false,
                mensaje: `Inconsistencia: Has indicado ${numeroMinas} minas, pero esta celda solo puede tener máximo ${maximoAdyacentes} celdas adyacentes por su posición.`,
                contradicciones: [{
                    tipo: 'valor_imposible',
                    celda: { fila, columna },
                    valor: numeroMinas,
                    maximo: maximoAdyacentes
                }]
            };
        }
    }

    // Si no se encontraron inconsistencias
    return {
        esConsistente: true,
        mensaje: "La respuesta es consistente con el estado actual del tablero.",
        contradicciones: []
    };
};

/**
 * Verifica posibles inconsistencias futuras - Versión simplificada
 * @param {number} fila - Fila de la celda
 * @param {number} columna - Columna de la celda
 * @param {string} respuesta - Respuesta propuesta
 * @param {Array} tablero - Estado actual del tablero
 * @param {Array} celdasDescubiertas - Celdas ya descubiertas
 * @param {Array} banderas - Banderas colocadas
 * @param {Object} tamañoSeleccionado - Tamaño del tablero
 * @returns {Object} - Resultado de la verificación
 */
export const verificarPosiblesInconsistenciasFuturas = (
    fila, 
    columna, 
    respuesta, 
    tablero, 
    celdasDescubiertas, 
    banderas, 
    tamañoSeleccionado
) => {
    // No realizar verificaciones adicionales en la versión simplificada
    return {
        hayAdvertencia: false,
        mensaje: ""
    };
};

/**
 * Verificar consistencia global del tablero - Versión simplificada
 * @param {Array} tablero - Estado del tablero
 * @param {object} tamañoSeleccionado - Tamaño del tablero
 * @param {Array} celdasDescubiertas - Celdas descubiertas
 * @param {Array} banderas - Banderas colocadas
 * @returns {object} - Resultado de la verificación global
 */
export const verificarConsistenciaGlobal = (tablero, tamañoSeleccionado, celdasDescubiertas, banderas) => {
    // Versión simplificada sin verificaciones adicionales
    return {
        esConsistente: true,
        inconsistencias: []
    };
};