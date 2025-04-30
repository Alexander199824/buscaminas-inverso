/**
 * Funciones para validar la consistencia lógica del tablero de Buscaminas
 * Implementación avanzada con detección de múltiples tipos de inconsistencias
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
    // VERIFICACIÓN 1: Si es un número, verificar que no sea mayor que el máximo posible
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

    // VERIFICACIÓN 2: Si es un número, verificar que no haya más banderas que el número
    if (respuesta !== 'vacío' && respuesta !== 'mina' && !isNaN(respuesta)) {
        const numeroMinas = parseInt(respuesta);
        const celdasAdyacentes = obtenerTodasCeldasAdyacentes(fila, columna, tamañoSeleccionado);
        
        // Contar banderas ya colocadas
        const banderasAdyacentes = celdasAdyacentes.filter(c => 
            banderas.some(b => b.fila === c.fila && b.columna === c.columna)
        ).length;
        
        if (banderasAdyacentes > numeroMinas) {
            return {
                esConsistente: false,
                mensaje: `Inconsistencia: Has indicado ${numeroMinas} minas, pero ya hay ${banderasAdyacentes} banderas colocadas alrededor.`,
                contradicciones: [{
                    tipo: 'exceso_banderas',
                    celda: { fila, columna },
                    valor: numeroMinas,
                    actual: banderasAdyacentes
                }]
            };
        }
    }
    
    // VERIFICACIÓN 3: Si es un número, verificar que haya suficientes celdas sin descubrir para las minas faltantes
    if (respuesta !== 'vacío' && respuesta !== 'mina' && !isNaN(respuesta)) {
        const numeroMinas = parseInt(respuesta);
        const celdasAdyacentes = obtenerTodasCeldasAdyacentes(fila, columna, tamañoSeleccionado);
        
        // Contar banderas ya colocadas
        const banderasAdyacentes = celdasAdyacentes.filter(c => 
            banderas.some(b => b.fila === c.fila && b.columna === c.columna)
        ).length;
        
        // Contar celdas sin descubrir (excepto la propia celda actual)
        const celdasSinDescubrir = celdasAdyacentes.filter(c => 
            !celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
            !banderas.some(b => b.fila === c.fila && b.columna === c.columna)
        ).length;
        
        const minasFaltantes = numeroMinas - banderasAdyacentes;
        
        if (minasFaltantes > celdasSinDescubrir) {
            return {
                esConsistente: false,
                mensaje: `Inconsistencia: Has indicado que faltan ${minasFaltantes} minas, pero solo hay ${celdasSinDescubrir} celdas sin descubrir alrededor.`,
                contradicciones: [{
                    tipo: 'minas_insuficientes',
                    celda: { fila, columna },
                    valor: numeroMinas,
                    banderas: banderasAdyacentes,
                    disponibles: celdasSinDescubrir,
                    faltantes: minasFaltantes
                }]
            };
        }
    }
    
    // VERIFICACIÓN 4: Si es una mina, verificar que no viole los números adyacentes
    if (respuesta === 'mina') {
        // Obtener celdas numéricas adyacentes (cualquier número del 0 al 8)
        const celdasAdyacentes = obtenerTodasCeldasAdyacentes(fila, columna, tamañoSeleccionado);
        const celdasNumericasAdyacentes = celdasAdyacentes.filter(c => 
            celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
            tablero[c.fila][c.columna] !== '' && 
            tablero[c.fila][c.columna] !== 'M' &&
            !isNaN(tablero[c.fila][c.columna])
        );
        
        // Verificar cada celda numérica adyacente (para cualquier número del 0 al 8)
        for (const celdaNumerica of celdasNumericasAdyacentes) {
            const { fila: filaN, columna: columnaN } = celdaNumerica;
            const valor = parseInt(tablero[filaN][columnaN]);
            
            // Contar banderas ya colocadas alrededor de esta celda numérica
            const celdasAdyacentesN = obtenerTodasCeldasAdyacentes(filaN, columnaN, tamañoSeleccionado);
            const banderasAdyacentesN = celdasAdyacentesN.filter(c => 
                banderas.some(b => b.fila === c.fila && b.columna === c.columna)
            ).length;
            
            // Si ya hay suficientes banderas, no puede haber más minas
            if (banderasAdyacentesN >= valor) {
                return {
                    esConsistente: false,
                    mensaje: `Inconsistencia: Has indicado una mina, pero la celda numérica (${filaN+1},${columnaN+1}) con valor ${valor} ya tiene ${banderasAdyacentesN} banderas colocadas.`,
                    contradicciones: [{
                        tipo: 'exceso_minas',
                        celda: { fila: filaN, columna: columnaN },
                        valor: valor,
                        banderas: banderasAdyacentesN
                    }]
                };
            }
        }
    }
    
    // VERIFICACIÓN 5: Si es un 0 o vacío, verificar que no haya banderas adyacentes
    if (respuesta === 'vacío' || respuesta === '0') {
        const celdasAdyacentes = obtenerTodasCeldasAdyacentes(fila, columna, tamañoSeleccionado);
        const banderasAdyacentes = celdasAdyacentes.filter(c => 
            banderas.some(b => b.fila === c.fila && b.columna === c.columna)
        );
        
        if (banderasAdyacentes.length > 0) {
            return {
                esConsistente: false,
                mensaje: `Inconsistencia: Has indicado que no hay minas alrededor, pero hay ${banderasAdyacentes.length} banderas colocadas cerca.`,
                contradicciones: [{
                    tipo: 'cero_con_banderas',
                    celda: { fila, columna },
                    banderas: banderasAdyacentes.length
                }]
            };
        }
    }
    
    // VERIFICACIÓN 6: Para todos los números (1-8), verificar si ya tienen suficientes banderas
    if (respuesta === 'mina') {
        // Buscar celdas numéricas adyacentes a la celda actual
        const celdasAdyacentes = obtenerTodasCeldasAdyacentes(fila, columna, tamañoSeleccionado);
        
        // Filtrar solo celdas con números del 1 al 8
        const celdasNumericas = celdasAdyacentes.filter(c => 
            celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
            tablero[c.fila][c.columna] !== '' && 
            tablero[c.fila][c.columna] !== 'M' &&
            !isNaN(tablero[c.fila][c.columna]) &&
            parseInt(tablero[c.fila][c.columna]) > 0
        );
        
        for (const celdaNumerica of celdasNumericas) {
            // Verificar si esta celda con valor numérico ya tiene suficientes banderas
            const numValor = parseInt(tablero[celdaNumerica.fila][celdaNumerica.columna]);
            const celdasAdyacentesANum = obtenerTodasCeldasAdyacentes(celdaNumerica.fila, celdaNumerica.columna, tamañoSeleccionado);
            const banderasAdyacentesANum = celdasAdyacentesANum.filter(c => 
                banderas.some(b => b.fila === c.fila && b.columna === c.columna)
            );
            
            if (banderasAdyacentesANum.length >= numValor) {
                return {
                    esConsistente: false,
                    mensaje: `Inconsistencia: Has indicado una mina, pero esta celda es adyacente a un número ${numValor} en (${celdaNumerica.fila+1},${celdaNumerica.columna+1}) que ya tiene ${banderasAdyacentesANum.length} bandera(s).`,
                    contradicciones: [{
                        tipo: 'exceso_minas_para_numero',
                        celda: celdaNumerica,
                        valor: numValor,
                        banderas: banderasAdyacentesANum.length
                    }]
                };
            }
        }
    }
    
    // VERIFICACIÓN 7: Verificar números negativos o valores inválidos
    if (respuesta !== 'vacío' && respuesta !== 'mina' && !isNaN(respuesta)) {
        const numeroMinas = parseInt(respuesta);
        if (numeroMinas < 0) {
            return {
                esConsistente: false,
                mensaje: `Inconsistencia: Has indicado un número negativo de minas (${numeroMinas}), lo cual es imposible.`,
                contradicciones: [{
                    tipo: 'valor_negativo',
                    celda: { fila, columna },
                    valor: numeroMinas
                }]
            };
        }
    }
    
    // VERIFICACIÓN GLOBAL para todos los números (0-8)
    // Crear una copia del tablero con la respuesta propuesta para análisis
    const tableroSimulado = JSON.parse(JSON.stringify(tablero));
    
    if (respuesta === 'vacío') {
        tableroSimulado[fila][columna] = '';
    } else if (respuesta === 'mina') {
        tableroSimulado[fila][columna] = 'M';
    } else {
        tableroSimulado[fila][columna] = respuesta;
    }
    
    // Actualizar la lista de celdas descubiertas para incluir la celda actual
    const nuevasCeldasDescubiertas = [
        ...celdasDescubiertas.filter(c => !(c.fila === fila && c.columna === columna)),
        { fila, columna }
    ];
    
    // Verificar consistencia con todas las celdas numéricas existentes (0-8)
    for (const celda of celdasDescubiertas) {
        const { fila: filaC, columna: columnaC } = celda;
        const valor = tablero[filaC][columnaC];
        
        // Solo verificar celdas con números (incluyendo 0)
        if (!isNaN(valor) && valor !== '') {
            const numeroMinas = parseInt(valor);
            
            // Obtener celdas adyacentes
            const celdasAdyacentes = obtenerTodasCeldasAdyacentes(filaC, columnaC, tamañoSeleccionado);
            
            // Contar minas confirmadas (banderas + la nueva respuesta si es mina)
            const minasConfirmadas = celdasAdyacentes.filter(c => {
                // Es una bandera
                if (banderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                    return true;
                }
                
                // Es la celda actual y es una mina
                if (c.fila === fila && c.columna === columna && respuesta === 'mina') {
                    return true;
                }
                
                return false;
            }).length;
            
            // Si hay más minas confirmadas que el número, hay una inconsistencia
            if (minasConfirmadas > numeroMinas) {
                return {
                    esConsistente: false,
                    mensaje: `Inconsistencia: La celda (${filaC+1},${columnaC+1}) indica ${numeroMinas} minas, pero con tu respuesta habría ${minasConfirmadas} minas confirmadas cerca.`,
                    contradicciones: [{
                        tipo: 'exceso_minas_global',
                        celda: { fila: filaC, columna: columnaC },
                        valor: numeroMinas,
                        confirmadas: minasConfirmadas
                    }]
                };
            }
            
            // Contar celdas sin descubrir restantes
            const celdasSinDescubrir = celdasAdyacentes.filter(c => {
                // Es la celda actual y NO es mina
                if (c.fila === fila && c.columna === columna && respuesta !== 'mina') {
                    return false;
                }
                
                // No está descubierta entre las existentes
                const estaDescubierta = celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna);
                
                // No tiene bandera
                const tieneBandera = banderas.some(b => b.fila === c.fila && b.columna === c.columna);
                
                return !estaDescubierta && !tieneBandera;
            }).length;
            
            // Verificar si faltan celdas para colocar las minas necesarias
            const minasRestantes = numeroMinas - minasConfirmadas;
            if (minasRestantes > celdasSinDescubrir) {
                return {
                    esConsistente: false,
                    mensaje: `Inconsistencia: La celda (${filaC+1},${columnaC+1}) necesita ${minasRestantes} minas más, pero solo quedan ${celdasSinDescubrir} celdas sin descubrir.`,
                    contradicciones: [{
                        tipo: 'faltan_celdas',
                        celda: { fila: filaC, columna: columnaC },
                        valor: numeroMinas,
                        restantes: celdasSinDescubrir,
                        necesarias: minasRestantes
                    }]
                };
            }
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
 * Verificar posibles inconsistencias futuras
 * Esta función analiza si colocar un valor en una celda podría crear 
 * inconsistencias con futuras jugadas
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
    // Si la respuesta es mina, no hacer verificación adicional
    if (respuesta === 'mina') {
        return {
            hayAdvertencia: false,
            mensaje: ""
        };
    }
    
    const advertencias = [];
    
    // Si la respuesta es un número o vacío, verificar si podría causar inconsistencias futuras
    if (respuesta === 'vacío' || respuesta === '0' || (!isNaN(respuesta) && parseInt(respuesta) >= 0)) {
        const numeroMinas = respuesta === 'vacío' ? 0 : parseInt(respuesta);
        const celdasAdyacentes = obtenerTodasCeldasAdyacentes(fila, columna, tamañoSeleccionado);
        
        // Contar banderas ya colocadas
        const banderasAdyacentes = celdasAdyacentes.filter(c => 
            banderas.some(b => b.fila === c.fila && b.columna === c.columna)
        ).length;
        
        // Contar celdas sin descubrir (excluyendo banderas)
        const celdasSinDescubrir = celdasAdyacentes.filter(c => 
            !celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
            !banderas.some(b => b.fila === c.fila && b.columna === c.columna)
        );
        
        // Verificar cada celda adyacente que ya esté descubierta y tenga un número
        for (const celdaAdj of celdasAdyacentes) {
            // Solo verificar celdas ya descubiertas con números
            if (celdasDescubiertas.some(d => d.fila === celdaAdj.fila && d.columna === celdaAdj.columna)) {
                const valorAdj = tablero[celdaAdj.fila][celdaAdj.columna];
                
                if (!isNaN(valorAdj) && valorAdj !== '' && valorAdj !== 'M') {
                    const numeroMinasAdj = parseInt(valorAdj);
                    
                    // Obtener todas las celdas adyacentes a esta celda numérica
                    const celdasAdyacentesANum = obtenerTodasCeldasAdyacentes(celdaAdj.fila, celdaAdj.columna, tamañoSeleccionado);
                    
                    // Contar banderas ya colocadas alrededor de esta celda numérica
                    const banderasAdyacentesANum = celdasAdyacentesANum.filter(c => 
                        banderas.some(b => b.fila === c.fila && b.columna === c.columna)
                    ).length;
                    
                    // Contar celdas sin descubrir (excluyendo la celda actual)
                    const celdasSinDescubrirANum = celdasAdyacentesANum.filter(c => 
                        !(c.fila === fila && c.columna === columna) &&
                        !celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
                        !banderas.some(b => b.fila === c.fila && b.columna === c.columna)
                    );
                    
                    // Calcular minas restantes para esta celda numérica
                    const minasRestantesANum = numeroMinasAdj - banderasAdyacentesANum;
                    
                    // Verificar si colocar un valor que no es mina podría crear inconsistencia
                    if (minasRestantesANum > 0 && celdasSinDescubrirANum.length === minasRestantesANum) {
                        // Todas las celdas sin descubrir alrededor de esta celda numérica deberían ser minas
                        // Si nuestra celda actual está entre ellas y no estamos marcando mina, podría causar inconsistencia
                        if (celdasAdyacentesANum.some(c => c.fila === fila && c.columna === columna)) {
                            advertencias.push({
                                tipo: 'posible_mina_ignorada',
                                celda: celdaAdj,
                                valor: numeroMinasAdj,
                                minasRestantes: minasRestantesANum,
                                celdasSinDescubrir: celdasSinDescubrirANum.length,
                                mensaje: `Advertencia: La celda (${celdaAdj.fila+1},${celdaAdj.columna+1}) con valor ${numeroMinasAdj} necesita ${minasRestantesANum} mina(s) más y solo tiene ${celdasSinDescubrirANum.length} celda(s) sin descubrir. Una de ellas es la que estás respondiendo.`
                            });
                        }
                    }
                }
            }
        }
        
        // Verificar si estamos indicando más minas de las que pueden caber
        const minasFaltantes = numeroMinas - banderasAdyacentes;
        if (minasFaltantes > celdasSinDescubrir.length) {
            advertencias.push({
                tipo: 'minas_insuficientes_futuras',
                celda: { fila, columna },
                valor: numeroMinas,
                minasFaltantes: minasFaltantes,
                celdasDisponibles: celdasSinDescubrir.length,
                mensaje: `Advertencia: Has indicado ${numeroMinas} minas, lo que implica que faltan ${minasFaltantes} por marcar, pero solo quedan ${celdasSinDescubrir.length} celdas sin descubrir alrededor.`
            });
        }
    }
    
    return {
        hayAdvertencia: advertencias.length > 0,
        advertencias,
        mensaje: advertencias.length > 0 ? advertencias[0].mensaje : ""
    };
};

/**
 * Verificar consistencia global del tablero
 * @param {Array} tablero - Estado del tablero
 * @param {object} tamañoSeleccionado - Tamaño del tablero
 * @param {Array} celdasDescubiertas - Celdas descubiertas
 * @param {Array} banderas - Banderas colocadas
 * @returns {object} - Resultado de la verificación global
 */
export const verificarConsistenciaGlobal = (tablero, tamañoSeleccionado, celdasDescubiertas, banderas) => {
    const inconsistencias = [];
    
    // Verificar cada celda con número
    celdasDescubiertas.forEach(celda => {
        const { fila, columna } = celda;
        const valor = tablero[fila][columna];
        
        // Solo verificar celdas con números
        if (!isNaN(valor) && valor !== '') {
            const numeroMinas = parseInt(valor);
            
            // Obtener celdas adyacentes
            const celdasAdyacentes = obtenerTodasCeldasAdyacentes(fila, columna, tamañoSeleccionado);
            
            // Contar banderas adyacentes
            const banderasAdyacentes = celdasAdyacentes.filter(c => 
                banderas.some(b => b.fila === c.fila && b.columna === c.columna)
            ).length;
            
            // Si hay más banderas que el número, hay una inconsistencia
            if (banderasAdyacentes > numeroMinas) {
                inconsistencias.push({
                    tipo: 'exceso_banderas_global',
                    celda: { fila, columna },
                    valor: numeroMinas,
                    banderas: banderasAdyacentes,
                    mensaje: `La celda (${fila+1},${columna+1}) indica ${numeroMinas} minas, pero hay ${banderasAdyacentes} banderas colocadas.`
                });
            }
            
            // Contar celdas sin descubrir
            const celdasSinDescubrir = celdasAdyacentes.filter(c => {
                const estaDescubierta = celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna);
                const tieneBandera = banderas.some(b => b.fila === c.fila && b.columna === c.columna);
                return !estaDescubierta && !tieneBandera;
            }).length;
            
            // Verificar si faltan celdas para colocar las minas necesarias
            const minasRestantes = numeroMinas - banderasAdyacentes;
            if (minasRestantes > celdasSinDescubrir) {
                inconsistencias.push({
                    tipo: 'faltan_celdas_global',
                    celda: { fila, columna },
                    valor: numeroMinas,
                    banderas: banderasAdyacentes,
                    restantes: celdasSinDescubrir,
                    necesarias: minasRestantes,
                    mensaje: `La celda (${fila+1},${columna+1}) necesita ${minasRestantes} minas más, pero solo quedan ${celdasSinDescubrir} celdas sin descubrir.`
                });
            }
        }
    });
    
    return {
        esConsistente: inconsistencias.length === 0,
        inconsistencias
    };
};