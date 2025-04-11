/**
 * Implementación avanzada de lógica de buscaminas con análisis global del tablero
 * Con validación exhaustiva para evitar errores en las intersecciones de restricciones
 */

/**
 * Obtener todas las celdas adyacentes a una celda
 * @param {number} fila - Fila de la celda
 * @param {number} columna - Columna de la celda
 * @param {object} tamañoTablero - Objeto con filas y columnas del tablero
 * @returns {Array} - Array de objetos {fila, columna} de las celdas adyacentes
 */
export const obtenerCeldasAdyacentes = (fila, columna, tamañoTablero) => {
    // Validar que tamañoTablero sea un objeto válido
    if (!tamañoTablero || typeof tamañoTablero !== 'object' || !tamañoTablero.filas || !tamañoTablero.columnas) {
        console.error("Error: tamañoTablero no es válido", tamañoTablero);
        return []; // Retornar array vacío en lugar de fallar
    }
    
    const { filas, columnas } = tamañoTablero;
    const adyacentes = [];

    // Recorrer todas las posiciones adyacentes, incluyendo diagonales
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            // Saltar la celda central (la propia celda)
            if (i === 0 && j === 0) continue;
            
            const nuevaFila = fila + i;
            const nuevaColumna = columna + j;
            
            // Verificar límites del tablero
            if (
                nuevaFila >= 0 && nuevaFila < filas &&
                nuevaColumna >= 0 && nuevaColumna < columnas
            ) {
                adyacentes.push({ fila: nuevaFila, columna: nuevaColumna });
            }
        }
    }
    
    return adyacentes;
};

/**
 * Seleccionar una celda aleatoria para el primer movimiento
 * @param {object} tamañoTablero - Objeto con filas y columnas del tablero
 * @returns {object} - Celda seleccionada {fila, columna}
 */
export const seleccionarPrimeraCeldaSegura = (tamañoTablero) => {
    // Validar que tamañoTablero sea un objeto válido
    if (!tamañoTablero || typeof tamañoTablero !== 'object' || !tamañoTablero.filas || !tamañoTablero.columnas) {
        console.error("Error: tamañoTablero no es válido", tamañoTablero);
        return { fila: 0, columna: 0 }; // Valor por defecto en caso de error
    }
    
    const { filas, columnas } = tamañoTablero;
    
    // Agregar aleatoriedad usando múltiples factores
    const timestamp = Date.now();
    const randomFactor = Math.random();
    
    const filaAleatoria = Math.floor(randomFactor * filas);
    const columnaAleatoria = Math.floor((timestamp % 1000) / 1000 * columnas);
    
    return { fila: filaAleatoria, columna: columnaAleatoria };
};

/**
 * Analizar el tablero para tomar decisiones estratégicas
 * Implementación mejorada con validación exhaustiva global
 * @param {object} parametros - Parámetros del análisis
 * @returns {object} - Decisiones del análisis
 */
export const analizarTablero = ({
    tablero,
    tamañoTablero,
    celdasDescubiertas,
    banderas,
    historialMovimientos,
    setMensajeSistema,
    setAnimacion
}) => {
    // Verificar todos los parámetros para evitar errores
    if (!tablero || !Array.isArray(tablero) || tablero.length === 0) {
        console.error("Error: tablero no es válido", tablero);
        return { banderas: banderas || [], siguienteCelda: null, movimientosGenerados: [] };
    }
    
    if (!tamañoTablero || typeof tamañoTablero !== 'object' || !tamañoTablero.filas || !tamañoTablero.columnas) {
        console.error("Error: tamañoTablero no es válido", tamañoTablero);
        return { banderas: banderas || [], siguienteCelda: null, movimientosGenerados: [] };
    }
    
    if (!celdasDescubiertas || !Array.isArray(celdasDescubiertas)) {
        console.error("Error: celdasDescubiertas no es válido", celdasDescubiertas);
        return { banderas: banderas || [], siguienteCelda: null, movimientosGenerados: [] };
    }
    
    if (!banderas || !Array.isArray(banderas)) {
        console.error("Error: banderas no es válido", banderas);
        return { banderas: [], siguienteCelda: null, movimientosGenerados: [] };
    }
    
    try {
        // 1. CONSTRUIR MODELO COMPLETO DEL TABLERO
        // Crear modelo que represente todas las restricciones del tablero
        const modeloTablero = construirModeloTablero(tablero, tamañoTablero, celdasDescubiertas, banderas);
        
        // 2. RESOLVER TODAS LAS RESTRICCIONES DE FORMA CONJUNTA
        // En lugar de análisis local, resolver globalmente
        const solucionGlobal = resolverModeloTablero(modeloTablero);
        
        // 3. EXTRAER INFORMACIÓN DE LA SOLUCIÓN GLOBAL
        const { banderasSeguras, celdasSeguras } = solucionGlobal;
        
        // Crear lista de nuevas banderas (no incluir las ya existentes)
        const nuevasBanderas = banderasSeguras.filter(b => 
            !banderas.some(existente => existente.fila === b.fila && existente.columna === b.columna)
        );
        
        // 4. DECIDIR SIGUIENTE JUGADA
        let siguienteCelda = null;
        
        // Prioridad 1: Celdas 100% seguras
        if (celdasSeguras.length > 0) {
            // Elegir una celda segura aleatoriamente
            const indiceAleatorio = Math.floor(Math.random() * celdasSeguras.length);
            siguienteCelda = {
                ...celdasSeguras[indiceAleatorio],
                tipoAnalisis: 'celda 100% segura'
            };
            
            if (setMensajeSistema) {
                setMensajeSistema(`He encontrado una celda segura en (${siguienteCelda.fila + 1},${siguienteCelda.columna + 1}).`);
            }
        } 
        // Prioridad 2: Celdas de bajo riesgo según el análisis global
        else {
            // Buscar la celda con menor probabilidad usando el análisis global
            siguienteCelda = encontrarMejorJugada(tablero, tamañoTablero, celdasDescubiertas, 
                [...banderas, ...nuevasBanderas], solucionGlobal);
            
            if (setMensajeSistema && siguienteCelda) {
                const mensaje = `Seleccionando la celda (${siguienteCelda.fila + 1},${siguienteCelda.columna + 1})`;
                setMensajeSistema(mensaje);
            }
        }
        
        // 5. GENERAR MOVIMIENTOS PARA NUEVAS BANDERAS
        const movimientosGenerados = nuevasBanderas.map(bandera => ({
            fila: bandera.fila,
            columna: bandera.columna,
            esAccion: true,
            accion: "bandera"
        }));
        
        // Si hay banderas nuevas, actualizar mensaje
        if (nuevasBanderas.length > 0 && setMensajeSistema) {
            setMensajeSistema(`He identificado ${nuevasBanderas.length} mina${nuevasBanderas.length > 1 ? 's' : ''} con certeza y las he marcado con banderas.`);
            if (setAnimacion) setAnimacion('bandera');
        }
        
        return {
            banderas: [...banderas, ...nuevasBanderas],
            siguienteCelda,
            movimientosGenerados
        };
    } catch (error) {
        console.error("Error al analizar tablero:", error);
        // En caso de error, devolver estado actual sin cambios
        return {
            banderas: banderas || [],
            siguienteCelda: seleccionarCeldaAleatoria(tablero, tamañoTablero, celdasDescubiertas, banderas),
            movimientosGenerados: []
        };
    }
};

/**
 * Construir un modelo completo del tablero para análisis global
 * @private
 */
const construirModeloTablero = (tablero, tamañoTablero, celdasDescubiertas, banderas) => {
    const { filas, columnas } = tamañoTablero;
    
    // 1. Preparar estructura básica
    const modelo = {
        tamañoTablero,
        celdas: [],           // Todas las celdas sin descubrir
        restricciones: [],    // Lista de todas las restricciones
        celdasDescubiertas,   // Celdas ya descubiertas
        banderas,             // Banderas ya colocadas
        estado: tablero       // Estado actual del tablero
    };
    
    // 2. Crear lista de todas las celdas sin descubrir y sin bandera
    for (let i = 0; i < filas; i++) {
        for (let j = 0; j < columnas; j++) {
            // Verificar si la celda ya está descubierta o tiene bandera
            const estaDescubierta = celdasDescubiertas.some(c => c.fila === i && c.columna === j);
            const tieneBandera = banderas.some(b => b.fila === i && b.columna === j);
            
            if (!estaDescubierta && !tieneBandera) {
                modelo.celdas.push({ fila: i, columna: j });
            }
        }
    }
    
    // 3. Identificar todas las restricciones del tablero (cada número es una restricción)
    celdasDescubiertas.forEach(celda => {
        const { fila, columna } = celda;
        const valor = tablero[fila][columna];
        
        // Solo considerar celdas con números
        if (valor && !isNaN(valor) && parseInt(valor) > 0) {
            const numeroMinas = parseInt(valor);
            
            // Obtener todas las celdas adyacentes
            const adyacentes = obtenerCeldasAdyacentes(fila, columna, tamañoTablero);
            
            // Filtrar las celdas adyacentes sin descubrir
            const celdasSinDescubrir = adyacentes.filter(c => 
                !celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna)
            );
            
            // Contar banderas adyacentes ya colocadas
            const banderasColocadas = celdasSinDescubrir.filter(c => 
                banderas.some(b => b.fila === c.fila && b.columna === c.columna)
            );
            
            // Identificar celdas sin bandera
            const celdasSinBandera = celdasSinDescubrir.filter(c => 
                !banderas.some(b => b.fila === c.fila && b.columna === c.columna)
            );
            
            // Crear la restricción con la información necesaria
            modelo.restricciones.push({
                celda: { fila, columna },
                valor: numeroMinas,
                banderasColocadas: banderasColocadas.length,
                celdasRestantes: celdasSinBandera,
                minasFaltantes: numeroMinas - banderasColocadas.length
            });
        }
    });
    
    return modelo;
};

/**
 * Resolver el modelo global del tablero
 * Implementa estrategias avanzadas de resolución
 * @private
 */
const resolverModeloTablero = (modelo) => {
    // Preparar estructuras para los resultados
    const banderasSeguras = [];  // Celdas donde seguro hay minas (100% certeza)
    const celdasSeguras = [];    // Celdas donde seguro NO hay minas (100% certeza)
    const mapaProbabilidades = {}; // Mapa de probabilidades para todas las celdas
    
    // 1. VALIDACIÓN BÁSICA: Buscar restricciones obvias
    buscarSolucionesObvias(modelo, banderasSeguras, celdasSeguras);
    
    // 2. VALIDACIÓN POR INTERSECCIONES: Buscar celdas a través de intersecciones entre restricciones
    analizarInterseccionesRestricciones(modelo, banderasSeguras, celdasSeguras);
    
    // 3. VALIDACIÓN DE PATRÓN 1-2-1: Buscar patrones específicos
    buscarPatrones121(modelo, banderasSeguras, celdasSeguras);
    
    // 4. VALIDACIÓN DE TANDEM: Buscar grupos de restricciones
    validarGruposRestricciones(modelo, banderasSeguras, celdasSeguras);
    
    // 5. VALIDACIÓN EXHAUSTIVA GLOBAL: Verificar que no haya contradicciones
    validacionGlobalExhaustiva(modelo, banderasSeguras, celdasSeguras);
    
    // 6. CALCULAR MAPA DE PROBABILIDADES para todas las celdas
    calcularMapaProbabilidadesGlobal(modelo, banderasSeguras, celdasSeguras, mapaProbabilidades);
    
    return {
        banderasSeguras,
        celdasSeguras,
        mapaProbabilidades
    };
};

/**
 * Buscar soluciones obvias en el tablero (análisis simple)
 * @private
 */
const buscarSolucionesObvias = (modelo, banderasSeguras, celdasSeguras) => {
    let cambiosRealizados = true;
    
    // Iteramos hasta que no haya más cambios (garantiza resolución completa)
    while (cambiosRealizados) {
        cambiosRealizados = false;
        
        // Revisar cada restricción
        modelo.restricciones.forEach(restriccion => {
            const { minasFaltantes, celdasRestantes } = restriccion;
            
            // CASO 1: Si las minas que faltan son exactamente las celdas restantes, todas tienen minas
            if (minasFaltantes > 0 && minasFaltantes === celdasRestantes.length) {
                celdasRestantes.forEach(celda => {
                    if (!estaCeldaEnLista(celda, banderasSeguras)) {
                        banderasSeguras.push(celda);
                        cambiosRealizados = true;
                    }
                });
            }
            
            // CASO 2: Si no faltan minas, todas las celdas restantes son seguras
            if (minasFaltantes === 0 && celdasRestantes.length > 0) {
                celdasRestantes.forEach(celda => {
                    if (!estaCeldaEnLista(celda, celdasSeguras)) {
                        celdasSeguras.push(celda);
                        cambiosRealizados = true;
                    }
                });
            }
        });
        
        // Si se encontraron nuevas banderas o celdas seguras, actualizar las restricciones
        if (cambiosRealizados) {
            actualizarRestricciones(modelo, banderasSeguras, celdasSeguras);
        }
    }
};

/**
 * Verificar si una celda ya está en una lista de celdas
 * @private
 */
const estaCeldaEnLista = (celda, lista) => {
    return lista.some(c => c.fila === celda.fila && c.columna === celda.columna);
};

/**
 * Actualizar las restricciones del modelo con las nuevas banderas y celdas seguras
 * @private
 */
const actualizarRestricciones = (modelo, banderasSeguras, celdasSeguras) => {
    modelo.restricciones.forEach(restriccion => {
        // Filtrar celdas restantes que ahora tienen banderas o son seguras
        restriccion.celdasRestantes = restriccion.celdasRestantes.filter(celda => 
            !estaCeldaEnLista(celda, banderasSeguras) && 
            !estaCeldaEnLista(celda, celdasSeguras)
        );
        
        // Actualizar el número de minas faltantes
        const nuevasBanderasEnRestriccion = banderasSeguras.filter(bandera => 
            estaCeldaEnRestricciones(bandera, [restriccion])
        ).length;
        
        restriccion.banderasColocadas += nuevasBanderasEnRestriccion;
        restriccion.minasFaltantes = restriccion.valor - restriccion.banderasColocadas;
    });
};

/**
 * Verifica si una celda está en las celdas de una o más restricciones
 * @private
 */
const estaCeldaEnRestricciones = (celda, restricciones) => {
    return restricciones.some(restriccion => 
        restriccion.celdasRestantes.some(c => c.fila === celda.fila && c.columna === celda.columna)
    );
};

/**
 * Analizar intersecciones entre restricciones para encontrar soluciones más complejas
 * @private
 */
const analizarInterseccionesRestricciones = (modelo, banderasSeguras, celdasSeguras) => {
    const { restricciones } = modelo;
    
    // Para cada par de restricciones, buscar intersecciones
    for (let i = 0; i < restricciones.length; i++) {
        const r1 = restricciones[i];
        
        for (let j = i + 1; j < restricciones.length; j++) {
            const r2 = restricciones[j];
            
            // Encontrar celdas que están en ambas restricciones (intersección)
            const interseccion = encontrarInterseccion(r1.celdasRestantes, r2.celdasRestantes);
            
            // Encontrar celdas que están solo en r1 (diferencia)
            const soloEnR1 = encontrarDiferencia(r1.celdasRestantes, r2.celdasRestantes);
            
            // Encontrar celdas que están solo en r2 (diferencia)
            const soloEnR2 = encontrarDiferencia(r2.celdasRestantes, r1.celdasRestantes);
            
            // CASO 1: Si la intersección tiene todas las minas de r1
            if (interseccion.length > 0 && soloEnR2.length > 0 && 
                r1.minasFaltantes === interseccion.length && r2.minasFaltantes > interseccion.length) {
                
                // Todas las celdas en soloEnR2 son seguras
                soloEnR2.forEach(celda => {
                    if (!estaCeldaEnLista(celda, celdasSeguras)) {
                        celdasSeguras.push(celda);
                    }
                });
                
                // Actualizar restricciones
                actualizarRestricciones(modelo, banderasSeguras, celdasSeguras);
            }
            
            // CASO 2: Si la intersección tiene todas las minas de r2
            if (interseccion.length > 0 && soloEnR1.length > 0 && 
                r2.minasFaltantes === interseccion.length && r1.minasFaltantes > interseccion.length) {
                
                // Todas las celdas en soloEnR1 son seguras
                soloEnR1.forEach(celda => {
                    if (!estaCeldaEnLista(celda, celdasSeguras)) {
                        celdasSeguras.push(celda);
                    }
                });
                
                // Actualizar restricciones
                actualizarRestricciones(modelo, banderasSeguras, celdasSeguras);
            }
            
            // CASO 3: Si podemos determinar el número exacto de minas en la intersección
            // Caso importante para la situación de 1 y 3 con intersección
            const minasEnInterseccion = calcularMinasEnInterseccion(r1, r2, interseccion, soloEnR1, soloEnR2);
            
            if (minasEnInterseccion !== null) {
                // Si sabemos cuántas minas hay en la intersección...
                
                // Si todas las celdas de la intersección tienen minas
                if (minasEnInterseccion === interseccion.length && minasEnInterseccion > 0) {
                    interseccion.forEach(celda => {
                        if (!estaCeldaEnLista(celda, banderasSeguras)) {
                            banderasSeguras.push(celda);
                        }
                    });
                }
                
                // Si no hay minas en la intersección
                if (minasEnInterseccion === 0 && interseccion.length > 0) {
                    interseccion.forEach(celda => {
                        if (!estaCeldaEnLista(celda, celdasSeguras)) {
                            celdasSeguras.push(celda);
                        }
                    });
                }
                
                // Si todas las minas restantes de r1 están en soloEnR1
                if (r1.minasFaltantes - minasEnInterseccion === soloEnR1.length && soloEnR1.length > 0) {
                    soloEnR1.forEach(celda => {
                        if (!estaCeldaEnLista(celda, banderasSeguras)) {
                            banderasSeguras.push(celda);
                        }
                    });
                }
                
                // Si todas las minas restantes de r2 están en soloEnR2
                if (r2.minasFaltantes - minasEnInterseccion === soloEnR2.length && soloEnR2.length > 0) {
                    soloEnR2.forEach(celda => {
                        if (!estaCeldaEnLista(celda, banderasSeguras)) {
                            banderasSeguras.push(celda);
                        }
                    });
                }
                
                // Si no hay minas restantes en soloEnR1
                if (r1.minasFaltantes - minasEnInterseccion === 0 && soloEnR1.length > 0) {
                    soloEnR1.forEach(celda => {
                        if (!estaCeldaEnLista(celda, celdasSeguras)) {
                            celdasSeguras.push(celda);
                        }
                    });
                }
                
                // Si no hay minas restantes en soloEnR2
                if (r2.minasFaltantes - minasEnInterseccion === 0 && soloEnR2.length > 0) {
                    soloEnR2.forEach(celda => {
                        if (!estaCeldaEnLista(celda, celdasSeguras)) {
                            celdasSeguras.push(celda);
                        }
                    });
                }
                
                // Actualizar restricciones
                actualizarRestricciones(modelo, banderasSeguras, celdasSeguras);
            }
        }
    }
};

/**
 * Encuentra la intersección de dos conjuntos de celdas
 * @private
 */
const encontrarInterseccion = (celdas1, celdas2) => {
    return celdas1.filter(c1 => 
        celdas2.some(c2 => c1.fila === c2.fila && c1.columna === c2.columna)
    );
};

/**
 * Encuentra la diferencia entre dos conjuntos de celdas (celdas en celdas1 que no están en celdas2)
 * @private
 */
const encontrarDiferencia = (celdas1, celdas2) => {
    return celdas1.filter(c1 => 
        !celdas2.some(c2 => c1.fila === c2.fila && c1.columna === c2.columna)
    );
};

/**
 * Calcula el número exacto de minas en la intersección de dos restricciones
 * Resuelve el sistema de ecuaciones:
 * a + c = r1.minasFaltantes
 * b + c = r2.minasFaltantes
 * donde a = minas en soloEnR1, b = minas en soloEnR2, c = minas en intersección
 * @private
 */
const calcularMinasEnInterseccion = (r1, r2, interseccion, soloEnR1, soloEnR2) => {
    // Si no hay intersección o si faltan conjuntos de celdas
    if (interseccion.length === 0 || soloEnR1 === undefined || soloEnR2 === undefined) {
        return null;
    }
    
    // Si podemos resolver el sistema
    if (soloEnR1.length + interseccion.length === r1.minasFaltantes + soloEnR2.length) {
        // c = r1.minasFaltantes + r2.minasFaltantes - (a + b + c)
        const minasEnInterseccion = r1.minasFaltantes + r2.minasFaltantes - (soloEnR1.length + soloEnR2.length + interseccion.length);
        
        // Validar que el resultado sea un número válido de minas
        if (minasEnInterseccion >= 0 && minasEnInterseccion <= interseccion.length) {
            return minasEnInterseccion;
        }
    }
    
    // En caso contrario, resolver directamente:
    // Si a = soloEnR1.length, b = soloEnR2.length, c = interseccion.length
    // c = r1.minasFaltantes - a = r2.minasFaltantes - b
    
    // Si sabemos cuántas minas hay en soloEnR1
    if (soloEnR1.length <= r1.minasFaltantes && soloEnR1.length + interseccion.length === r1.celdasRestantes.length) {
        const minasEnSoloR1 = r1.minasFaltantes - interseccion.length; // si es negativo, no hay suficientes celdas
        const minasEnInterseccion = r1.minasFaltantes - minasEnSoloR1;
        
        // Verificar validez del resultado
        if (minasEnInterseccion >= 0 && minasEnInterseccion <= interseccion.length) {
            return minasEnInterseccion;
        }
    }
    
    // Si sabemos cuántas minas hay en soloEnR2
    if (soloEnR2.length <= r2.minasFaltantes && soloEnR2.length + interseccion.length === r2.celdasRestantes.length) {
        const minasEnSoloR2 = r2.minasFaltantes - interseccion.length; // si es negativo, no hay suficientes celdas
        const minasEnInterseccion = r2.minasFaltantes - minasEnSoloR2;
        
        // Verificar validez del resultado
        if (minasEnInterseccion >= 0 && minasEnInterseccion <= interseccion.length) {
            return minasEnInterseccion;
        }
    }
    
    return null; // No pudimos determinar con certeza
};

/**
 * Buscar patrones específicos como 1-2-1 en el tablero
 * @private
 */
const buscarPatrones121 = (modelo, banderasSeguras, celdasSeguras) => {
    const { estado: tablero, tamañoTablero } = modelo;
    const { filas, columnas } = tamañoTablero;
    
    // Buscamos patrones horizontales y verticales
    const direcciones = [
        { dx: 1, dy: 0 }, // horizontal
        { dx: 0, dy: 1 }  // vertical
    ];
    
    // Buscar patrones en cada dirección
    direcciones.forEach(({ dx, dy }) => {
        // Recorrer todo el tablero
        for (let i = 0; i < filas - 2 * dy; i++) {
            for (let j = 0; j < columnas - 2 * dx; j++) {
                // Posiciones de las tres celdas en el patrón
                const pos1 = { fila: i, columna: j };
                const pos2 = { fila: i + dy, columna: j + dx };
                const pos3 = { fila: i + 2*dy, columna: j + 2*dx };
                
                // Verificar si las tres celdas están descubiertas
                const celda1Descubierta = modelo.celdasDescubiertas.some(c => c.fila === pos1.fila && c.columna === pos1.columna);
                const celda2Descubierta = modelo.celdasDescubiertas.some(c => c.fila === pos2.fila && c.columna === pos2.columna);
                const celda3Descubierta = modelo.celdasDescubiertas.some(c => c.fila === pos3.fila && c.columna === pos3.columna);
                
                // Solo procesar si las tres celdas están descubiertas
                if (celda1Descubierta && celda2Descubierta && celda3Descubierta) {









                    
                    const valor1 = tablero[pos1.fila][pos1.columna];
                    const valor2 = tablero[pos2.fila][pos2.columna];
                    const valor3 = tablero[pos3.fila][pos3.columna];
                    
                    // Verificar si es un patrón 1-2-1
                    if (valor1 === '1' && valor2 === '2' && valor3 === '1') {
                        // Buscar las celdas adyacentes al 2 que no son adyacentes a los 1
                        const adyacentesA2 = obtenerCeldasAdyacentes(pos2.fila, pos2.columna, tamañoTablero);
                        const adyacentesA1 = obtenerCeldasAdyacentes(pos1.fila, pos1.columna, tamañoTablero);
                        const adyacentesA3 = obtenerCeldasAdyacentes(pos3.fila, pos3.columna, tamañoTablero);
                        
                        // Celdas únicas del 2
                        const celdasUnicas = adyacentesA2.filter(c2 => 
                            !adyacentesA1.some(c1 => c1.fila === c2.fila && c1.columna === c2.columna) &&
                            !adyacentesA3.some(c3 => c3.fila === c2.fila && c3.columna === c2.columna)
                        );
                        
                        // Si hay exactamente 2 celdas únicas, son minas
                        if (celdasUnicas.length === 2) {
                            // Verificar si no están descubiertas y no tienen bandera
                            const celdasValidasParaMinas = celdasUnicas.filter(c => 
                                !modelo.celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
                                !modelo.banderas.some(b => b.fila === c.fila && b.columna === c.columna) &&
                                !estaCeldaEnLista(c, banderasSeguras)
                            );
                            
                            // Añadir como banderas
                            celdasValidasParaMinas.forEach(c => {
                                if (!estaCeldaEnLista(c, banderasSeguras)) {
                                    banderasSeguras.push(c);
                                }
                            });
                            
                            // Celdas adyacentes a los 1 (no al 2) son seguras
                            const celdasSegurasPosibles = [
                                ...adyacentesA1.filter(c1 => 
                                    !adyacentesA2.some(c2 => c1.fila === c2.fila && c1.columna === c2.columna)
                                ),
                                ...adyacentesA3.filter(c3 => 
                                    !adyacentesA2.some(c2 => c3.fila === c2.fila && c3.columna === c2.columna)
                                )
                            ];
                            
                            // Eliminar duplicados y validar
                            const celdasSegurasFiltradas = celdasSegurasPosibles.filter((c, index, self) => 
                                index === self.findIndex(s => s.fila === c.fila && s.columna === c.columna) &&
                                !modelo.celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
                                !modelo.banderas.some(b => b.fila === c.fila && b.columna === c.columna) &&
                                !estaCeldaEnLista(c, celdasSeguras)
                            );
                            
                            // Añadir como celdas seguras
                            celdasSegurasFiltradas.forEach(c => {
                                if (!estaCeldaEnLista(c, celdasSeguras)) {
                                    celdasSeguras.push(c);
                                }
                            });
                            
                            // Actualizar restricciones
                            actualizarRestricciones(modelo, banderasSeguras, celdasSeguras);
                        }
                    }
                }
            }
        }
    });
};

/**
 * Validar grupos de restricciones (tandem) para encontrar soluciones más complejas
 * @private
 */
const validarGruposRestricciones = (modelo, banderasSeguras, celdasSeguras) => {
    const { restricciones } = modelo;
    
    // Buscar grupos de restricciones que compartan celdas
    for (let i = 0; i < restricciones.length; i++) {
        const baseRestriccion = restricciones[i];
        
        // Ignorar restricciones vacías o ya resueltas
        if (baseRestriccion.celdasRestantes.length === 0 || baseRestriccion.minasFaltantes === 0) {
            continue;
        }
        
        // Encontrar todas las restricciones que comparten celdas con esta
        const grupoRestricciones = [baseRestriccion];
        const celdasDelGrupo = new Set(baseRestriccion.celdasRestantes.map(c => `${c.fila},${c.columna}`));
        
        // Añadir restricciones relacionadas al grupo
        for (let j = 0; j < restricciones.length; j++) {
            if (i !== j) {
                const otraRestriccion = restricciones[j];
                
                // Verificar si comparten celdas
                const compartenCeldas = otraRestriccion.celdasRestantes.some(c => 
                    celdasDelGrupo.has(`${c.fila},${c.columna}`)
                );
                
                if (compartenCeldas) {
                    grupoRestricciones.push(otraRestriccion);
                    otraRestriccion.celdasRestantes.forEach(c => 
                        celdasDelGrupo.add(`${c.fila},${c.columna}`)
                    );
                }
            }
        }
        
        // Si formamos un grupo de al menos 2 restricciones
        if (grupoRestricciones.length >= 2) {
            // Convertir el grupo en un conjunto de ecuaciones
            const grupoEcuaciones = resolverGrupoEcuaciones(grupoRestricciones, celdasDelGrupo);
            
            // Aplicar resultados
            grupoEcuaciones.banderasSeguras.forEach(c => {
                if (!estaCeldaEnLista(c, banderasSeguras)) {
                    banderasSeguras.push(c);
                }
            });
            
            grupoEcuaciones.celdasSeguras.forEach(c => {
                if (!estaCeldaEnLista(c, celdasSeguras)) {
                    celdasSeguras.push(c);
                }
            });
            
            // Actualizar restricciones si se encontraron soluciones
            if (grupoEcuaciones.banderasSeguras.length > 0 || grupoEcuaciones.celdasSeguras.length > 0) {
                actualizarRestricciones(modelo, banderasSeguras, celdasSeguras);
            }
        }
    }
};

/**
 * Resolver un grupo de restricciones como un sistema de ecuaciones
 * @private
 */
const resolverGrupoEcuaciones = (restricciones, celdasDelGrupo) => {
    // Resultado del análisis
    const resultado = {
        banderasSeguras: [],
        celdasSeguras: []
    };
    
    // Convertir el conjunto de celdas a array
    const celdasArray = Array.from(celdasDelGrupo).map(str => {
        const [fila, columna] = str.split(',').map(Number);
        return { fila, columna };
    });
    
    // Para grupos pequeños, podemos aplicar un enfoque de fuerza bruta
    if (celdasArray.length <= 12) { // Límite para mantener eficiencia
        const posiblesDistribuciones = generarPosiblesDistribuciones(celdasArray, restricciones);
        
        // Si tenemos distribuciones válidas
        if (posiblesDistribuciones.length > 0) {
            // Identificar celdas que tienen mina en todas las distribuciones válidas
            celdasArray.forEach(celda => {
                // Si todas las distribuciones válidas tienen mina en esta celda
                const tieneMina = posiblesDistribuciones.every(dist => 
                    dist.celdasConMina.some(c => c.fila === celda.fila && c.columna === celda.columna)
                );
                
                if (tieneMina) {
                    resultado.banderasSeguras.push(celda);
                }
                
                // Si ninguna distribución válida tiene mina en esta celda
                const sinMina = posiblesDistribuciones.every(dist => 
                    !dist.celdasConMina.some(c => c.fila === celda.fila && c.columna === celda.columna)
                );
                
                if (sinMina) {
                    resultado.celdasSeguras.push(celda);
                }
            });
        }
    }
    
    return resultado;
};

/**
 * Genera todas las posibles distribuciones de minas que satisfacen las restricciones
 * @private
 */
const generarPosiblesDistribuciones = (celdas, restricciones) => {
    const posiblesDistribuciones = [];
    
    // Contar el total de celdas y restricciones
    const numCeldas = celdas.length;
    const numRestricciones = restricciones.length;
    
    // Para grupos no muy grandes, probamos todas las combinaciones posibles
    // Límite: 2^12 = 4096 combinaciones en el peor caso
    const limite = Math.min(numCeldas, 12);
    
    // Generamos todas las posibles distribuciones (2^n posibilidades)
    const maxCombinaciones = 1 << limite;
    
    for (let i = 0; i < maxCombinaciones; i++) {
        // Crear la distribución actual
        const celdasConMina = [];
        
        for (let j = 0; j < limite; j++) {
            // Si el bit j está activado en i, esta celda tiene mina
            if ((i & (1 << j)) !== 0) {
                celdasConMina.push(celdas[j]);
            }
        }
        
        // Verificar si esta distribución satisface todas las restricciones
        const satisface = verificarDistribucion(celdasConMina, restricciones);
        
        if (satisface) {
            posiblesDistribuciones.push({ celdasConMina });
        }
    }
    
    return posiblesDistribuciones;
};

/**
 * Verifica si una distribución de minas satisface todas las restricciones
 * @private
 */
const verificarDistribucion = (celdasConMina, restricciones) => {
    return restricciones.every(restriccion => {
        // Contar cuántas de las celdas con mina están en esta restricción
        const minasEnRestriccion = celdasConMina.filter(celda => 
            restriccion.celdasRestantes.some(c => c.fila === celda.fila && c.columna === celda.columna)
        ).length;
        
        // La distribución satisface la restricción si el número de minas coincide con el valor
        return minasEnRestriccion === restriccion.minasFaltantes;
    });
};

/**
 * Validación global exhaustiva para evitar contradicciones
 * Este paso final verifica que todas las banderas y celdas seguras identificadas son consistentes
 * @private
 */
const validacionGlobalExhaustiva = (modelo, banderasSeguras, celdasSeguras) => {
    // 1. Verificar que no hay celdas que estén tanto en banderasSeguras como en celdasSeguras
    const duplicados = banderasSeguras.filter(bs => 
        celdasSeguras.some(cs => cs.fila === bs.fila && cs.columna === bs.columna)
    );
    
    if (duplicados.length > 0) {
        console.error("¡CONTRADICCIÓN CRÍTICA! Celdas marcadas como seguras y con mina:", duplicados);
        // En caso de contradicción, borrar las celdas problemáticas de ambas listas
        duplicados.forEach(d => {
            // Eliminar de banderasSeguras
            const indexBandera = banderasSeguras.findIndex(b => b.fila === d.fila && b.columna === d.columna);
            if (indexBandera !== -1) banderasSeguras.splice(indexBandera, 1);
            
            // Eliminar de celdasSeguras
            const indexSegura = celdasSeguras.findIndex(s => s.fila === d.fila && s.columna === d.columna);
            if (indexSegura !== -1) celdasSeguras.splice(indexSegura, 1);
        });
    }
    
    // 2. Verificar que cada restricción sigue siendo satisfacible con las banderas y celdas seguras
    let restriccionesValidas = true;
    
    modelo.restricciones.forEach(restriccion => {
        // Contar banderas ya colocadas en esta restricción
        const banderasColocadas = restriccion.celdasRestantes.filter(celda => 
            banderasSeguras.some(b => b.fila === celda.fila && b.columna === celda.columna) ||
            modelo.banderas.some(b => b.fila === celda.fila && b.columna === celda.columna)
        ).length;
        
        // Contar celdas seguras en esta restricción
        const celdasSegurasEnRestriccion = restriccion.celdasRestantes.filter(celda => 
            celdasSeguras.some(s => s.fila === celda.fila && s.columna === celda.columna)
        ).length;
        
        // Celdas no clasificadas en esta restricción
        const celdasSinClasificar = restriccion.celdasRestantes.length - banderasColocadas - celdasSegurasEnRestriccion;
        
        // Verificar si hay suficientes celdas para las minas faltantes
        if (banderasColocadas > restriccion.minasFaltantes) {
            restriccionesValidas = false;
            console.error("Contradicción: Demasiadas banderas en restricción", restriccion);
        }
        
        // Verificar si hay suficientes celdas sin clasificar para las minas faltantes
        if (restriccion.minasFaltantes - banderasColocadas > celdasSinClasificar) {
            restriccionesValidas = false;
            console.error("Contradicción: No hay suficientes celdas para minas faltantes", restriccion);
        }
    });
    
    // Si hay contradicciones, limpiar las listas de resultados
    if (!restriccionesValidas) {
        console.warn("Se detectaron contradicciones en el análisis global. Reiniciando análisis.");
        banderasSeguras.length = 0;
        celdasSeguras.length = 0;
    }
    
    // 3. Verificación adicional: si una bandera candidata está marcada como segura en otro análisis
    const banderasProblematicas = banderasSeguras.filter(b => {
        // Verificar si esta bandera está en alguna restricción donde debería ser segura
        // (es decir, si esa restricción ya tiene todas sus minas identificadas)
        return modelo.restricciones.some(r => {
            const estaEnRestriccion = r.celdasRestantes.some(c => c.fila === b.fila && c.columna === b.columna);
            if (!estaEnRestriccion) return false;
            
            // Contar otras banderas en esta restricción
            const otrasBanderas = r.celdasRestantes.filter(c => 
                (c.fila !== b.fila || c.columna !== b.columna) && (
                    banderasSeguras.some(bs => bs.fila === c.fila && bs.columna === c.columna) ||
                    modelo.banderas.some(mb => mb.fila === c.fila && mb.columna === c.columna)
                )
            ).length;
            
            // Si ya hay suficientes banderas sin contar esta, entonces esta celda debería ser segura
            return otrasBanderas >= r.minasFaltantes;
        });
    });
    
    // Eliminar banderas problemáticas
    banderasProblematicas.forEach(b => {
        const index = banderasSeguras.findIndex(bs => bs.fila === b.fila && bs.columna === b.columna);
        if (index !== -1) {
            console.warn(`Eliminando bandera problemática en (${b.fila+1},${b.columna+1})`);
            banderasSeguras.splice(index, 1);
        }
    });
};

/**
 * Calcular mapa de probabilidades global para todas las celdas
 * @private
 */
const calcularMapaProbabilidadesGlobal = (modelo, banderasSeguras, celdasSeguras, mapaProbabilidades) => {
    const { tamañoTablero, restricciones, celdasDescubiertas, banderas } = modelo;
    const { filas, columnas } = tamañoTablero;
    
    // Inicializar mapa de probabilidades
    for (let i = 0; i < filas; i++) {
        for (let j = 0; j < columnas; j++) {
            const clave = `${i},${j}`;
            
            // Verificar si la celda ya está descubierta o tiene bandera
            const estaDescubierta = celdasDescubiertas.some(c => c.fila === i && c.columna === j);
            const tieneBandera = banderas.some(b => b.fila === i && b.columna === j) || 
                               estaCeldaEnLista({fila: i, columna: j}, banderasSeguras);
            const esSegura = estaCeldaEnLista({fila: i, columna: j}, celdasSeguras);
            
            if (!estaDescubierta && !tieneBandera) {
                if (esSegura) {
                    // Celda segura identificada por análisis avanzado
                    mapaProbabilidades[clave] = {
                        probabilidad: 0,
                        certeza: true,
                        origen: 'análisis global'
                    };
                } else {
                    // Probabilidad base para celdas no analizadas
                    mapaProbabilidades[clave] = {
                        probabilidad: 0.15, // Valor conservador por defecto
                        certeza: false,
                        origen: 'valor base'
                    };
                }
            }
        }
    }
    
    // Para cada restricción, calcular probabilidades más precisas
    restricciones.forEach(restriccion => {
        const { celdasRestantes, minasFaltantes } = restriccion;
        
        // Filtrar celdas que ya sabemos que son seguras o tienen minas
        const celdasSinClasificar = celdasRestantes.filter(c => 
            !estaCeldaEnLista(c, banderasSeguras) && 
            !estaCeldaEnLista(c, celdasSeguras)
        );
        
        // Si hay celdas sin clasificar y minas por encontrar
        if (celdasSinClasificar.length > 0 && minasFaltantes > 0) {
            // Calcular probabilidad para estas celdas
            const probabilidad = minasFaltantes / celdasSinClasificar.length;
            
            // Actualizar mapa de probabilidades
            celdasSinClasificar.forEach(c => {
                const clave = `${c.fila},${c.columna}`;
                
                // Solo actualizar si la nueva probabilidad es mayor
                if (!mapaProbabilidades[clave] || mapaProbabilidades[clave].probabilidad < probabilidad) {
                    mapaProbabilidades[clave] = {
                        probabilidad,
                        certeza: false,
                        origen: `restricción (${restriccion.celda.fila+1},${restriccion.celda.columna+1})`
                    };
                }
            });
        }
    });
    
    // Identificar celdas que no están en ninguna restricción (bordes seguros)
    for (let i = 0; i < filas; i++) {
        for (let j = 0; j < columnas; j++) {
            const clave = `${i},${j}`;
            
            // Verificar si la celda está disponible y no está en ninguna restricción
            const estaDescubierta = celdasDescubiertas.some(c => c.fila === i && c.columna === j);
            const tieneBandera = banderas.some(b => b.fila === i && b.columna === j) || 
                               estaCeldaEnLista({fila: i, columna: j}, banderasSeguras);
            
            if (!estaDescubierta && !tieneBandera) {
                const estaEnAlgunaRestriccion = restricciones.some(r => 
                    r.celdasRestantes.some(c => c.fila === i && c.columna === j)
                );
                
                // Si no está en ninguna restricción, es más segura
                if (!estaEnAlgunaRestriccion && mapaProbabilidades[clave]) {
                    mapaProbabilidades[clave].probabilidad = 0.05; // Menor probabilidad para celdas libres
                    mapaProbabilidades[clave].origen = 'celda libre (borde seguro)';
                }
            }
        }
    }
};

/**
 * Encontrar la mejor jugada (celda con menor probabilidad de contener mina)
 * Versión mejorada con análisis global
 * @private
 */
const encontrarMejorJugada = (tablero, tamañoTablero, celdasDescubiertas, banderas, solucionGlobal) => {
    // Validar parámetros
    if (!tablero || !tamañoTablero || !celdasDescubiertas || !banderas) {
        return seleccionarCeldaAleatoria(tablero, tamañoTablero, celdasDescubiertas, banderas);
    }
    
    // Preparar lista de celdas candidatas con sus probabilidades
    const candidatos = [];
    
    // Si tenemos un mapa de probabilidades del análisis global, usarlo
    if (solucionGlobal && solucionGlobal.mapaProbabilidades) {
        const { filas, columnas } = tamañoTablero;
        
        // Convertir el mapa de probabilidades a una lista de candidatos
        for (let i = 0; i < filas; i++) {
            for (let j = 0; j < columnas; j++) {
                const clave = `${i},${j}`;
                
                // Verificar si la celda está disponible
                const estaDescubierta = celdasDescubiertas.some(c => c.fila === i && c.columna === j);
                const tieneBandera = banderas.some(b => b.fila === i && b.columna === j);
                
                if (!estaDescubierta && !tieneBandera && solucionGlobal.mapaProbabilidades[clave]) {
                    candidatos.push({
                        fila: i,
                        columna: j,
                        probabilidad: solucionGlobal.mapaProbabilidades[clave].probabilidad,
                        origen: solucionGlobal.mapaProbabilidades[clave].origen
                    });
                }
            }
        }
    }
    
    // Si no tenemos candidatos del análisis global o son muy pocos, buscar más opciones
    if (candidatos.length < 3) {
        // 1. Buscar celdas seguras mediante análisis local
        const celdasSeguras = buscarCeldasSeguras(tablero, tamañoTablero, celdasDescubiertas, banderas);
        
        // Añadir celdas seguras a candidatos
        celdasSeguras.forEach(c => {
            if (!candidatos.some(cand => cand.fila === c.fila && cand.columna === c.columna)) {
                candidatos.push({
                    fila: c.fila,
                    columna: c.columna,
                    probabilidad: 0,
                    origen: 'análisis local'
                });
            }
        });
        
        // 2. Buscar celdas en bordes seguros (lejos de números y banderas)
        const celdasBordeSeguro = buscarCeldasSinRiesgo(tablero, tamañoTablero, celdasDescubiertas, banderas);
        
        // Añadir celdas de borde seguro a candidatos
        celdasBordeSeguro.forEach(c => {
            if (!candidatos.some(cand => cand.fila === c.fila && cand.columna === c.columna)) {
                candidatos.push({
                    fila: c.fila,
                    columna: c.columna,
                    probabilidad: 0.05,
                    origen: 'borde seguro'
                });
            }
        });
    }
    
    // Si tenemos candidatos, elegir el mejor (menor probabilidad)
    if (candidatos.length > 0) {
        // Ordenar por probabilidad ascendente
        candidatos.sort((a, b) => a.probabilidad - b.probabilidad);
        
        // Ahora, entre las celdas con la misma probabilidad mínima, elegir una aleatoriamente
        const probabilidadMinima = candidatos[0].probabilidad;
        const mejoresCandidatos = candidatos.filter(c => c.probabilidad === probabilidadMinima);
        
        // Elegir aleatoriamente entre los mejores candidatos
        const indiceAleatorio = Math.floor(Math.random() * mejoresCandidatos.length);
        
        return {
            fila: mejoresCandidatos[indiceAleatorio].fila,
            columna: mejoresCandidatos[indiceAleatorio].columna,
            tipoAnalisis: `${mejoresCandidatos[indiceAleatorio].origen} (${Math.round(probabilidadMinima*100)}%)`
        };
    }
    
    // Si no hay análisis disponible, seleccionar celda aleatoria
    const celdaAleatoria = seleccionarCeldaAleatoria(tablero, tamañoTablero, celdasDescubiertas, banderas);
    
    if (celdaAleatoria) {
        celdaAleatoria.tipoAnalisis = 'selección aleatoria';
    }
    
    return celdaAleatoria;
};

/**
 * Buscar celdas seguras (análisis local)
 * @private
 */
const buscarCeldasSeguras = (tablero, tamañoTablero, celdasDescubiertas, banderas) => {
    const celdasSeguras = [];
    
    // Validar parámetros
    if (!tablero || !tamañoTablero || !celdasDescubiertas || !banderas) {
        return celdasSeguras;
    }
    
    // Recorrer celdas con números
    celdasDescubiertas.forEach(celda => {
        const { fila, columna } = celda;
        
        // Validar que la celda tiene coordenadas válidas
        if (fila === undefined || columna === undefined || 
            fila < 0 || columna < 0 ||
            fila >= tablero.length || columna >= tablero[0].length) {
            return;
        }
        
        const valor = tablero[fila][columna];
        
        // Solo procesar celdas con números (incluyendo 0/vacío)
        if (valor === undefined || (isNaN(valor) && valor !== '' && valor !== '0')) {
            return;
        }
        
        const numeroMinas = valor === '' || valor === '0' ? 0 : parseInt(valor);
        
        // Obtener celdas adyacentes
        const celdasAdyacentes = obtenerCeldasAdyacentes(fila, columna, tamañoTablero);
        
        // Contar banderas adyacentes
        const banderasAdyacentes = celdasAdyacentes.filter(c => 
            banderas.some(b => b.fila === c.fila && b.columna === c.columna)
        ).length;
        
        // Si el número coincide con las banderas, las demás celdas son seguras
        if (banderasAdyacentes === numeroMinas) {
            celdasAdyacentes.forEach(c => {
                // No considerar celdas ya descubiertas o con bandera
                if (celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) ||
                    banderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                    return;
                }
                
                // Agregar a celdas seguras si no está ya
                if (!estaCeldaEnLista(c, celdasSeguras)) {
                    celdasSeguras.push(c);
                }
            });
        }
    });
    
    return celdasSeguras;
};

/**
 * Buscar celdas en bordes seguros (lejos de números y banderas)
 * @private
 */
const buscarCeldasSinRiesgo = (tablero, tamañoTablero, celdasDescubiertas, banderas) => {
    // Validar parámetros
    if (!tablero || !tamañoTablero || !celdasDescubiertas || !banderas) {
        return [];
    }
    
    const { filas, columnas } = tamañoTablero;
    const celdasDisponibles = [];
    
    // Crear un mapa de riesgo: inicializado a 0 para todas las celdas
    // Un valor más alto = más riesgo (más números cercanos)
    const mapaRiesgo = Array(filas).fill().map(() => Array(columnas).fill(0));
    
    // Para cada celda con número o bandera, aumentar el riesgo en las celdas cercanas
    const aumentarRiesgoAlrededor = (fila, columna, valor) => {
        // Alcance del aumento de riesgo (2 celdas de distancia es suficiente)
        const alcance = 2;
        
        // Aumentar riesgo en un área cuadrada alrededor de la celda
        for (let i = Math.max(0, fila - alcance); i <= Math.min(filas - 1, fila + alcance); i++) {
            for (let j = Math.max(0, columna - alcance); j <= Math.min(columnas - 1, columna + alcance); j++) {
                // Calcular distancia Manhattan
                const distancia = Math.abs(i - fila) + Math.abs(j - columna);
                // El riesgo disminuye con la distancia
                if (distancia <= alcance) {
                    // Valor + 1 para números, 2 para banderas (más riesgo)
                    // El valor disminuye con la distancia
                    mapaRiesgo[i][j] += valor / Math.max(1, distancia);
                }
            }
        }
    };
    
    // Aumentar riesgo alrededor de celdas con números
    celdasDescubiertas.forEach(celda => {
        const { fila, columna } = celda;
        const valor = tablero[fila][columna];
        
        // Solo considerar celdas con números > 0
        if (valor && !isNaN(valor) && parseInt(valor) > 0) {
            aumentarRiesgoAlrededor(fila, columna, parseInt(valor));
        }
    });
    
    // Aumentar riesgo alrededor de banderas (más riesgo)
    banderas.forEach(bandera => {
        aumentarRiesgoAlrededor(bandera.fila, bandera.columna, 2);
    });
    
    // Encontrar todas las celdas disponibles y su nivel de riesgo
    for (let i = 0; i < filas; i++) {
        for (let j = 0; j < columnas; j++) {
            // Verificar si la celda está disponible
            const estaDescubierta = celdasDescubiertas.some(c => c.fila === i && c.columna === j);
            const tieneBandera = banderas.some(b => b.fila === i && b.columna === j);
            
            if (!estaDescubierta && !tieneBandera) {
                celdasDisponibles.push({
                    fila: i,
                    columna: j,
                    riesgo: mapaRiesgo[i][j]
                });
            }
        }
    }
    
    // Ordenar por nivel de riesgo (menor primero)
    celdasDisponibles.sort((a, b) => a.riesgo - b.riesgo);
    
    // Tomar las celdas con menor riesgo (máximo 5)
    // Solo consideramos celdas realmente de bajo riesgo (valor menor a un umbral)
    const UMBRAL_BAJO_RIESGO = 0.5;
    const celdasBajoRiesgo = celdasDisponibles
        .filter(c => c.riesgo < UMBRAL_BAJO_RIESGO)
        .slice(0, 5);
    
    return celdasBajoRiesgo;
};

/**
 * Seleccionar una celda aleatoria entre las disponibles
 * @private
 */
const seleccionarCeldaAleatoria = (tablero, tamañoTablero, celdasDescubiertas, banderas) => {
    // Validar parámetros
    if (!tablero || !Array.isArray(tablero) || tablero.length === 0 || 
        !tamañoTablero || !tamañoTablero.filas || !tamañoTablero.columnas) {
        console.error("Error al seleccionar celda aleatoria: parámetros inválidos");
        // Retornar un valor por defecto seguro
        return { fila: 0, columna: 0 };
    }
    
    // Lista de celdas disponibles (no descubiertas y sin bandera)
    const celdasDisponibles = [];
    
    // Recorrer el tablero
    for (let i = 0; i < tamañoTablero.filas; i++) {
        for (let j = 0; j < tamañoTablero.columnas; j++) {
            // Validar que los arrays existen
            if (!celdasDescubiertas || !banderas) {
                celdasDisponibles.push({ fila: i, columna: j });
                continue;
            }
            
            // Verificar si la celda ya ha sido descubierta
            const estaDescubierta = celdasDescubiertas.some(c => c.fila === i && c.columna === j);
            
            // Verificar si la celda tiene bandera
            const tieneBandera = banderas.some(b => b.fila === i && b.columna === j);
            
            // Si no está descubierta y no tiene bandera, está disponible
            if (!estaDescubierta && !tieneBandera) {
                celdasDisponibles.push({ fila: i, columna: j });
            }
        }
    }
    
    // Si hay celdas disponibles, seleccionar una aleatoriamente
    if (celdasDisponibles.length > 0) {
        const indiceAleatorio = Math.floor(Math.random() * celdasDisponibles.length);
        return celdasDisponibles[indiceAleatorio];
    }
    
    // Si no hay celdas disponibles (raro), retornar null
    return null;
};