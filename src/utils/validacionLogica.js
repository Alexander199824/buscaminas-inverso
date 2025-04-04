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
        return contradiccionDirecta;
    }
    
    // Si la respuesta es vacío o mina, no hay restricciones directas adicionales que verificar
    if (respuesta === 'vacío' || respuesta === 'mina') {
        // Verificamos si esta respuesta afecta indirectamente a otras celdas
        return verificarConsistenciaGlobal(
            fila, 
            columna, 
            respuesta, 
            tablero, 
            celdasDescubiertas, 
            banderas, 
            tamañoSeleccionado
        );
    }

    // Si la respuesta es un número, verificar que sea posible
    const numeroMinas = parseInt(respuesta);
    
    // Obtener todas las celdas adyacentes
    const celdasAdyacentes = obtenerTodasCeldasAdyacentes(fila, columna, tamañoSeleccionado);
    
    // Contar banderas ya colocadas
    const banderasAdyacentes = celdasAdyacentes.filter(c => 
        banderas.some(b => b.fila === c.fila && b.columna === c.columna)
    ).length;
    
    // Contar celdas sin descubrir (excluir las que tienen banderas)
    const celdasNoDescubiertas = celdasAdyacentes.filter(c => 
        !celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
        !banderas.some(b => b.fila === c.fila && b.columna === c.columna)
    ).length;
    
    // Verificar que el número sea posible
    if (banderasAdyacentes > numeroMinas) {
        return {
            esConsistente: false,
            mensaje: `Inconsistencia: hay ${banderasAdyacentes} banderas adyacentes pero has indicado que hay ${numeroMinas} minas.`,
            contradicciones: [{
                tipo: 'exceso_banderas',
                celda: { fila, columna },
                valor: numeroMinas,
                esperado: banderasAdyacentes
            }]
        };
    }
    
    // Verificar que haya suficientes celdas sin descubrir para colocar las minas restantes
    const minasRestantes = numeroMinas - banderasAdyacentes;
    if (minasRestantes > celdasNoDescubiertas) {
        return {
            esConsistente: false,
            mensaje: `Inconsistencia: necesitas colocar ${minasRestantes} minas más pero solo quedan ${celdasNoDescubiertas} celdas sin descubrir.`,
            contradicciones: [{
                tipo: 'faltan_celdas',
                celda: { fila, columna },
                valor: numeroMinas,
                restantes: celdasNoDescubiertas,
                necesarias: minasRestantes
            }]
        };
    }
    
    // Verificar consistencia con otros números en el tablero
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
 * @param {number} filaActual - Fila de la celda actual que se está verificando
 * @param {number} columnaActual - Columna de la celda actual que se está verificando
 * @param {string} respuestaActual - Respuesta que se está evaluando
 * @param {Array} tablero - Estado actual del tablero
 * @param {Array} celdasDescubiertas - Celdas ya descubiertas
 * @param {Array} banderas - Celdas marcadas con bandera
 * @param {Object} tamañoSeleccionado - Tamaño del tablero
 * @returns {Object} Objeto con {esConsistente, mensaje, contradicciones}
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
    
    // ===== FASE 1: Verificaciones individuales para cada celda numérica =====
    
    // Verificar cada celda numérica por separado
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
    
    // Si encontramos contradicciones básicas, retornar la primera con un mensaje claro
    if (contradicciones.length > 0) {
        return {
            esConsistente: false,
            mensaje: contradicciones[0].mensaje || "Se ha detectado una inconsistencia lógica en el tablero.",
            contradicciones: [contradicciones[0]]
        };
    }
    
    // ===== FASE 2: Verificaciones avanzadas para grupos de celdas relacionadas =====
    
    // Verificación para detectar cuando un grupo de celdas no tiene solución posible
    // Identificamos grupos de celdas numéricas cercanas entre sí
    let grupos = [];
    let celdaVisitada = Array(celdasConNumero.length).fill(false);
    
    // Agrupar celdas que estén conectadas (comparten al menos una celda adyacente)
    for (let i = 0; i < celdasConNumero.length; i++) {
        if (celdaVisitada[i]) continue;
        
        const grupo = [celdasConNumero[i]];
        celdaVisitada[i] = true;
        
        // Función recursiva para encontrar todas las celdas relacionadas
        const buscarConectadas = (indice) => {
            const celdaBase = celdasConNumero[indice];
            const adyacentesBase = obtenerTodasCeldasAdyacentes(celdaBase.fila, celdaBase.columna, tamañoSeleccionado);
            
            for (let j = 0; j < celdasConNumero.length; j++) {
                if (celdaVisitada[j]) continue;
                
                const otraCelda = celdasConNumero[j];
                const adyacentesOtra = obtenerTodasCeldasAdyacentes(otraCelda.fila, otraCelda.columna, tamañoSeleccionado);
                
                // Verificar si comparten al menos una celda adyacente
                const hayInterseccion = adyacentesBase.some(c1 => 
                    adyacentesOtra.some(c2 => c2.fila === c1.fila && c2.columna === c1.columna)
                );
                
                if (hayInterseccion) {
                    grupo.push(otraCelda);
                    celdaVisitada[j] = true;
                    buscarConectadas(j);
                }
            }
        };
        
        // Buscar para el grupo inicial
        buscarConectadas(i);
        
        // Guardar el grupo si tiene más de una celda
        if (grupo.length > 1) {
            grupos.push(grupo);
        }
    }
    
    // Para cada grupo, verificar si existe una solución compatible con todos los números
    for (const grupo of grupos) {
        // Para grupos muy grandes, usamos un enfoque simplificado para evitar explosión combinatoria
        if (grupo.length > 6) continue;
        
        // Obtener todas las celdas adyacentes a este grupo
        const adyacentesGrupo = new Set();
        for (const celda of grupo) {
            const adyacentes = obtenerTodasCeldasAdyacentes(celda.fila, celda.columna, tamañoSeleccionado);
            adyacentes.forEach(adj => {
                adyacentesGrupo.add(`${adj.fila},${adj.columna}`);
            });
        }
        
        // Convertir de Set a Array
        const todasAdyacentes = Array.from(adyacentesGrupo).map(coord => {
            const [fila, columna] = coord.split(',').map(Number);
            return { fila, columna };
        });
        
        // Separar en minas confirmadas y celdas no descubiertas
        const minasConfirmadas = todasAdyacentes.filter(c => 
            banderas.some(b => b.fila === c.fila && b.columna === c.columna) ||
            (c.fila === filaActual && c.columna === columnaActual && respuestaActual === 'mina')
        );
        
        const celdasNoResueltas = todasAdyacentes.filter(c => 
            !minasConfirmadas.some(m => m.fila === c.fila && m.columna === c.columna) &&
            !nuevasCeldasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna)
        );
        
        // Si no hay celdas para resolver, seguir con el siguiente grupo
        if (celdasNoResueltas.length === 0) continue;
        
        // Usar backtracking para intentar encontrar una configuración válida
        const esPosible = buscarConfiguracionValida(celdasNoResueltas, 0, minasConfirmadas, grupo, tableroSimulado, tamañoSeleccionado);
        
        if (!esPosible) {
            // Encontramos un grupo sin solución posible
            const celdas = grupo.map(c => `(${c.fila + 1},${c.columna + 1})`).join(', ');
            return {
                esConsistente: false,
                mensaje: `Inconsistencia lógica: no existe ninguna configuración válida de minas para las celdas ${celdas}.`,
                contradicciones: [{
                    tipo: 'grupo_sin_solucion',
                    grupo: grupo,
                    mensaje: `No existe configuración válida para el grupo.`
                }]
            };
        }
    }
    
    // Si llegamos aquí, no se encontraron inconsistencias
    return {
        esConsistente: true,
        mensaje: "La respuesta es consistente con el estado actual del tablero.",
        contradicciones: []
    };
};

/**
 * Busca una configuración válida de minas usando backtracking
 * @param {Array} celdasNoResueltas - Celdas sin resolver
 * @param {number} indice - Índice actual en el array de celdasNoResueltas
 * @param {Array} minasActuales - Minas colocadas hasta ahora
 * @param {Array} grupo - Grupo de celdas numéricas a satisfacer
 * @param {Array} tablero - Estado del tablero
 * @param {Object} tamañoSeleccionado - Tamaño del tablero
 * @returns {boolean} true si existe una configuración válida
 */
const buscarConfiguracionValida = (celdasNoResueltas, indice, minasActuales, grupo, tablero, tamañoSeleccionado) => {
    // Si hemos procesado todas las celdas, verificar si la configuración es válida
    if (indice >= celdasNoResueltas.length) {
        // Verificar que cada celda del grupo tenga el número correcto de minas adyacentes
        for (const celda of grupo) {
            const { fila, columna } = celda;
            const numeroMinas = parseInt(tablero[fila][columna]);
            const adyacentes = obtenerTodasCeldasAdyacentes(fila, columna, tamañoSeleccionado);
            
            // Contar minas adyacentes en la configuración actual
            const minasAdyacentes = adyacentes.filter(c => 
                minasActuales.some(m => m.fila === c.fila && m.columna === c.columna)
            ).length;
            
            // Si no coincide con el número esperado, esta configuración no es válida
            if (minasAdyacentes !== numeroMinas) {
                return false;
            }
        }
        
        // Si todas las celdas tienen el número correcto de minas, la configuración es válida
        return true;
    }
    
    const celdaActual = celdasNoResueltas[indice];
    
    // Probar colocando una mina en esta posición
    const configConMina = buscarConfiguracionValida(
        celdasNoResueltas,
        indice + 1,
        [...minasActuales, celdaActual],
        grupo,
        tablero,
        tamañoSeleccionado
    );
    
    // Si encontramos una configuración válida, terminamos
    if (configConMina) return true;
    
    // Probar sin colocar mina en esta posición
    return buscarConfiguracionValida(
        celdasNoResueltas,
        indice + 1,
        minasActuales,
        grupo,
        tablero,
        tamañoSeleccionado
    );
};