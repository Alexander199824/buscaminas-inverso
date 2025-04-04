/**
 * Funciones para validar la consistencia lógica del tablero de Buscaminas
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
 * Verifica si una respuesta es consistente con el estado actual del tablero
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
    // Crear una copia del tablero con la respuesta propuesta para análisis
    const tableroSimulado = JSON.parse(JSON.stringify(tablero));
    if (respuesta === 'vacío') {
        tableroSimulado[fila][columna] = '';
    } else if (respuesta === 'mina') {
        tableroSimulado[fila][columna] = 'M';
    } else {
        tableroSimulado[fila][columna] = respuesta;
    }
    
    // Verificar primero si la respuesta contradice directamente los números cercanos
    const contradiccionDirecta = verificarContradiccionesDirectas(
        fila, 
        columna, 
        respuesta, 
        tablero, 
        celdasDescubiertas, 
        banderas, 
        tamañoSeleccionado
    );
    
    if (!contradiccionDirecta.esConsistente) {
        // Intentar un análisis más profundo antes de rechazar definitivamente
        const analisisExhaustivo = intentarResolverContradiccion(
            fila,
            columna,
            respuesta,
            tableroSimulado,
            celdasDescubiertas,
            banderas,
            tamañoSeleccionado,
            contradiccionDirecta
        );
        
        if (analisisExhaustivo.esConsistente) {
            return analisisExhaustivo; // Si el análisis profundo encuentra que es posible, aceptamos
        }
        return contradiccionDirecta;
    }
    
    // Si no hay contradicciones directas, verificar globalmente
    return verificarConsistenciaGlobal(
        fila, 
        columna, 
        respuesta, 
        tablero, 
        celdasDescubiertas, 
        banderas, 
        tamañoSeleccionado
    );
};

/**
 * Intenta resolver una contradicción aparente mediante análisis más exhaustivo
 */
const intentarResolverContradiccion = (
    fila,
    columna,
    respuesta,
    tableroSimulado,
    celdasDescubiertas,
    banderas,
    tamañoSeleccionado,
    contradiccionDetectada
) => {
    // Simulamos que la celda ya está descubierta
    const celdasDescubiertasSimuladas = [
        ...celdasDescubiertas,
        { fila, columna }
    ];
    
    // Obtenemos las celdas relacionadas con la contradicción para un análisis más profundo
    // Esto incluye todas las celdas numéricas que podrían verse afectadas
    const celdasRelacionadas = obtenerCeldasRelacionadas(
        fila, 
        columna, 
        tableroSimulado, 
        celdasDescubiertasSimuladas, 
        tamañoSeleccionado
    );
    
    // Si son pocas celdas relacionadas, hacemos un análisis exhaustivo
    if (celdasRelacionadas.length <= 8) {
        // Intentamos encontrar una configuración válida usando backtracking
        const esResoluble = intentarEncontrarConfiguracionValida(
            tableroSimulado,
            celdasDescubiertasSimuladas,
            banderas,
            tamañoSeleccionado,
            celdasRelacionadas
        );
        
        if (esResoluble) {
            return {
                esConsistente: true,
                mensaje: "La respuesta parece inicialmente conflictiva, pero un análisis más profundo muestra que es posible.",
                contradicciones: []
            };
        }
    }
    
    // Si no podemos resolver, mantenemos la contradicción original
    return contradiccionDetectada;
};

/**
 * Obtiene todas las celdas relacionadas con una posición para análisis
 */
const obtenerCeldasRelacionadas = (
    fila,
    columna,
    tablero,
    celdasDescubiertas,
    tamañoSeleccionado
) => {
    // Comenzamos con las celdas adyacentes directas
    const adyacentesDirectas = obtenerTodasCeldasAdyacentes(fila, columna, tamañoSeleccionado);
    
    // Añadimos las celdas numéricas adyacentes a las adyacentes
    let celdasRelacionadas = new Set();
    
    // Añadir la celda actual y sus adyacentes
    celdasRelacionadas.add(`${fila},${columna}`);
    adyacentesDirectas.forEach(c => celdasRelacionadas.add(`${c.fila},${c.columna}`));
    
    // Buscar todas las celdas numéricas que están relacionadas
    adyacentesDirectas.forEach(celda => {
        const celdasAdyacentes = obtenerTodasCeldasAdyacentes(celda.fila, celda.columna, tamañoSeleccionado);
        
        celdasAdyacentes.forEach(adj => {
            // Si es una celda numérica
            if (celdasDescubiertas.some(d => d.fila === adj.fila && d.columna === adj.columna) &&
                tablero[adj.fila][adj.columna] && !isNaN(tablero[adj.fila][adj.columna])) {
                celdasRelacionadas.add(`${adj.fila},${adj.columna}`);
                
                // Añadimos también las adyacentes a esta celda numérica
                const otrasAdyacentes = obtenerTodasCeldasAdyacentes(adj.fila, adj.columna, tamañoSeleccionado);
                otrasAdyacentes.forEach(oa => celdasRelacionadas.add(`${oa.fila},${oa.columna}`));
            }
        });
    });
    
    // Convertir el Set a un array de objetos {fila, columna}
    return Array.from(celdasRelacionadas).map(coord => {
        const [f, c] = coord.split(',').map(Number);
        return { fila: f, columna: c };
    });
};

/**
 * Intenta encontrar una configuración válida usando backtracking
 */
const intentarEncontrarConfiguracionValida = (
    tablero,
    celdasDescubiertas,
    banderas,
    tamañoSeleccionado,
    celdasImportantes
) => {
    // Obtenemos las celdas no descubiertas sin bandera que están relacionadas
    const celdasNoDescubiertasSinBandera = celdasImportantes.filter(celda => {
        return !celdasDescubiertas.some(d => d.fila === celda.fila && d.columna === celda.columna) &&
               !banderas.some(b => b.fila === celda.fila && b.columna === celda.columna);
    });
    
    // Obtenemos las celdas numéricas relacionadas
    const celdasNumericas = celdasImportantes.filter(celda => {
        return celdasDescubiertas.some(d => d.fila === celda.fila && d.columna === celda.columna) &&
               tablero[celda.fila][celda.columna] && !isNaN(tablero[celda.fila][celda.columna]);
    });
    
    // Si hay demasiadas celdas para analizar, simplificamos
    if (celdasNoDescubiertasSinBandera.length > 12) {
        return true; // Asumimos que hay una solución posible para evitar cálculos excesivos
    }
    
    // Usamos backtracking para probar todas las configuraciones posibles
    return backtrackingConfiguracion(
        celdasNoDescubiertasSinBandera,
        0,
        banderas,
        tablero,
        celdasDescubiertas,
        tamañoSeleccionado,
        celdasNumericas
    );
};

/**
 * Función recursiva de backtracking para probar configuraciones
 */
const backtrackingConfiguracion = (
    celdasNoDescubiertas,
    indice,
    banderasActuales,
    tablero,
    celdasDescubiertas,
    tamañoSeleccionado,
    celdasNumericas
) => {
    // Si hemos revisado todas las celdas no descubiertas, verificamos si la configuración es válida
    if (indice >= celdasNoDescubiertas.length) {
        return esConfiguracionValida(banderasActuales, tablero, celdasDescubiertas, tamañoSeleccionado, celdasNumericas);
    }
    
    const celdaActual = celdasNoDescubiertas[indice];
    
    // Caso 1: Probamos sin poner bandera (celda vacía)
    const sinBandera = backtrackingConfiguracion(
        celdasNoDescubiertas,
        indice + 1,
        banderasActuales,
        tablero,
        celdasDescubiertas,
        tamañoSeleccionado,
        celdasNumericas
    );
    
    if (sinBandera) return true;
    
    // Caso 2: Probamos poniendo bandera (mina)
    const conBandera = backtrackingConfiguracion(
        celdasNoDescubiertas,
        indice + 1,
        [...banderasActuales, celdaActual],
        tablero,
        celdasDescubiertas,
        tamañoSeleccionado,
        celdasNumericas
    );
    
    return conBandera;
};

/**
 * Verifica si una configuración de banderas es válida para las celdas numéricas dadas
 */
const esConfiguracionValida = (
    banderas,
    tablero,
    celdasDescubiertas,
    tamañoSeleccionado,
    celdasNumericas
) => {
    // Verificamos cada celda numérica
    for (const celda of celdasNumericas) {
        const { fila, columna } = celda;
        const numeroMinas = parseInt(tablero[fila][columna]);
        
        // Contamos las banderas adyacentes
        const adyacentes = obtenerTodasCeldasAdyacentes(fila, columna, tamañoSeleccionado);
        const banderasAdyacentes = adyacentes.filter(adj => 
            banderas.some(b => b.fila === adj.fila && b.columna === adj.columna)
        ).length;
        
        // Si el número no coincide, la configuración no es válida
        if (banderasAdyacentes !== numeroMinas) {
            return false;
        }
    }
    
    // Si todas las celdas numéricas tienen el número correcto de banderas adyacentes
    return true;
};

/**
 * Verifica si la respuesta contradice directamente alguno de los números cercanos
 */
const verificarContradiccionesDirectas = (
    fila, 
    columna, 
    respuesta, 
    tablero, 
    celdasDescubiertas, 
    banderas, 
    tamañoSeleccionado
) => {
    // Caso especial: si estamos colocando una mina, verificar números adyacentes
    if (respuesta === 'mina') {
        // Obtener celdas adyacentes que tengan números
        const celdasAdyacentesConNumero = obtenerTodasCeldasAdyacentes(fila, columna, tamañoSeleccionado)
            .filter(c => {
                // Debe estar descubierta y tener un número
                const estaDescubierta = celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna);
                if (!estaDescubierta) return false;
                
                const valor = tablero[c.fila][c.columna];
                return valor && !isNaN(valor);
            });
        
        // Para cada celda con número, verificar si ya tiene suficientes minas
        for (const celdaNum of celdasAdyacentesConNumero) {
            const numeroMinas = parseInt(tablero[celdaNum.fila][celdaNum.columna]);
            
            // Contar banderas adyacentes a este número
            const banderasAdyacentes = obtenerTodasCeldasAdyacentes(celdaNum.fila, celdaNum.columna, tamañoSeleccionado)
                .filter(c => banderas.some(b => b.fila === c.fila && b.columna === c.columna))
                .length;
            
            // Si ya tiene suficientes banderas, no puede haber más minas
            if (banderasAdyacentes >= numeroMinas) {
                return {
                    esConsistente: false,
                    mensaje: `Inconsistencia: la celda (${celdaNum.fila + 1},${celdaNum.columna + 1}) indica ${numeroMinas} minas, pero ya hay ${banderasAdyacentes} banderas colocadas. No puede haber otra mina en (${fila + 1},${columna + 1}).`,
                    contradicciones: [{
                        tipo: 'exceso_banderas',
                        celda: celdaNum,
                        valor: numeroMinas,
                        actual: banderasAdyacentes + 1 // +1 por la nueva mina
                    }]
                };
            }
        }
    }
    
    // Caso especial: si estamos colocando un número, verificar si tiene demasiadas banderas
    if (!isNaN(respuesta)) {
        const numeroMinas = parseInt(respuesta);
        
        // Contar banderas adyacentes
        const banderasAdyacentes = obtenerTodasCeldasAdyacentes(fila, columna, tamañoSeleccionado)
            .filter(c => banderas.some(b => b.fila === c.fila && b.columna === c.columna))
            .length;
        
        // Si hay más banderas que el número, hay una contradicción
        if (banderasAdyacentes > numeroMinas) {
            return {
                esConsistente: false,
                mensaje: `Inconsistencia: has indicado ${numeroMinas} minas, pero ya hay ${banderasAdyacentes} banderas colocadas alrededor.`,
                contradicciones: [{
                    tipo: 'exceso_banderas',
                    celda: { fila, columna },
                    valor: numeroMinas,
                    actual: banderasAdyacentes
                }]
            };
        }
    }
    
    // Si no hay contradicciones directas
    return {
        esConsistente: true,
        mensaje: "No hay contradicciones directas.",
        contradicciones: []
    };
};

/**
 * Verifica la consistencia global del tablero teniendo en cuenta todas las celdas numéricas
 */
export const verificarConsistenciaGlobal = (
    filaActual, 
    columnaActual, 
    respuestaActual, 
    tablero, 
    celdasDescubiertas, 
    banderas, 
    tamañoSeleccionado
) => {
    // Crear una copia del tablero con la respuesta actual
    const tableroSimulado = JSON.parse(JSON.stringify(tablero));
    if (respuestaActual === 'vacío') {
        tableroSimulado[filaActual][columnaActual] = '';
    } else if (respuestaActual === 'mina') {
        tableroSimulado[filaActual][columnaActual] = 'M';
    } else {
        tableroSimulado[filaActual][columnaActual] = respuestaActual;
    }
    
    // Lista para almacenar contradicciones encontradas
    const contradicciones = [];
    
    // Actualizar la lista de celdas descubiertas para incluir la celda actual
    const nuevasCeldasDescubiertas = [
        ...celdasDescubiertas.filter(c => !(c.fila === filaActual && c.columna === columnaActual)),
        { fila: filaActual, columna: columnaActual }
    ];
    
    // Obtener todas las celdas con números
    const celdasConNumero = nuevasCeldasDescubiertas.filter(c => {
        const valor = tableroSimulado[c.fila][c.columna];
        return valor && !isNaN(valor);
    });
    
    // Si no hay celdas con números, no hay restricciones que verificar
    if (celdasConNumero.length === 0) {
        return {
            esConsistente: true,
            mensaje: "La respuesta es consistente con el estado actual del tablero.",
            contradicciones: []
        };
    }
    
    // Verificar cada celda numérica por separado - Primera pasada
    for (const celda of celdasConNumero) {
        const { fila, columna } = celda;
        const valor = tableroSimulado[fila][columna];
        const numeroMinas = parseInt(valor);
        
        // Obtener celdas adyacentes
        const celdasAdyacentes = obtenerTodasCeldasAdyacentes(fila, columna, tamañoSeleccionado);
        
        // Contar banderas y celdas marcadas como mina
        const minasConfirmadas = celdasAdyacentes.filter(c => {
            // Es una bandera
            if (banderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                return true;
            }
            
            // Es la celda actual y es una mina
            if (c.fila === filaActual && c.columna === columnaActual && respuestaActual === 'mina') {
                return true;
            }
            
            // Es una celda marcada como mina en el tablero
            if (tableroSimulado[c.fila][c.columna] === 'M') {
                return true;
            }
            
            return false;
        }).length;
        
        // CRÍTICO: Verificar si hay demasiadas minas confirmadas
        if (minasConfirmadas > numeroMinas) {
            contradicciones.push({
                tipo: 'exceso_minas',
                celda: { fila, columna },
                valor: numeroMinas,
                confirmadas: minasConfirmadas,
                mensaje: `La celda (${fila + 1},${columna + 1}) indica ${numeroMinas} minas, pero hay ${minasConfirmadas} minas confirmadas cerca.`
            });
            
            // Intentamos hacer un análisis más profundo antes de rechazar
            const analisisAvanzado = intentarResolverContradiccion(
                filaActual,
                columnaActual,
                respuestaActual,
                tableroSimulado,
                celdasDescubiertas,
                banderas,
                tamañoSeleccionado,
                {
                    esConsistente: false,
                    mensaje: contradicciones[0].mensaje,
                    contradicciones: [contradicciones[0]]
                }
            );
            
            if (analisisAvanzado.esConsistente) {
                return analisisAvanzado;
            }
            
            // Si encontramos una contradicción clara, terminamos inmediatamente
            return {
                esConsistente: false,
                mensaje: `Inconsistencia: la celda (${fila + 1},${columna + 1}) indica ${numeroMinas} minas, pero hay ${minasConfirmadas} minas confirmadas cerca.`,
                contradicciones: [contradicciones[0]]
            };
        }
        
        // Celdas sin descubrir para posibles minas futuras
        const celdasNoDescubiertas = celdasAdyacentes.filter(c => {
            // No está descubierta (excepto la celda actual que estamos evaluando)
            const estaDescubierta = celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) ||
                                 (c.fila === filaActual && c.columna === columnaActual && respuestaActual !== 'mina');
            
            // No tiene bandera
            const tieneBandera = banderas.some(b => b.fila === c.fila && b.columna === c.columna);
            
            return !estaDescubierta && !tieneBandera;
        }).length;
        
        // Verificar si faltan celdas para colocar las minas necesarias
        const minasRestantes = numeroMinas - minasConfirmadas;
        if (minasRestantes > celdasNoDescubiertas) {
            contradicciones.push({
                tipo: 'faltan_celdas',
                celda: { fila, columna },
                valor: numeroMinas,
                restantes: celdasNoDescubiertas,
                necesarias: minasRestantes,
                mensaje: `La celda (${fila + 1},${columna + 1}) necesita ${minasRestantes} minas más, pero solo quedan ${celdasNoDescubiertas} celdas sin descubrir.`
            });
        }
    }
    
    // Si encontramos contradicciones básicas, intentamos un análisis más profundo
    if (contradicciones.length > 0) {
        // Intentamos resolver la contradicción
        const analisisAvanzado = intentarResolverContradiccion(
            filaActual,
            columnaActual,
            respuestaActual,
            tableroSimulado,
            celdasDescubiertas,
            banderas,
            tamañoSeleccionado,
            {
                esConsistente: false,
                mensaje: contradicciones[0].mensaje,
                contradicciones: [contradicciones[0]]
            }
        );
        
        if (analisisAvanzado.esConsistente) {
            return analisisAvanzado;
        }
        
        return {
            esConsistente: false,
            mensaje: contradicciones[0].mensaje || "Se ha detectado una inconsistencia lógica en el tablero.",
            contradicciones: [contradicciones[0]]
        };
    }
    
    // Si llegamos aquí, no se encontraron inconsistencias
    return {
        esConsistente: true,
        mensaje: "La respuesta es consistente con el estado actual del tablero.",
        contradicciones: []
    };
};