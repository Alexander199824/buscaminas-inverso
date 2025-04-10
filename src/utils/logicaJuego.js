/**
 * Implementación de la lógica de buscaminas para el sistema de juego automático
 * Incluye funciones avanzadas de análisis de tablero, probabilidades y detección de inconsistencias
 */

/**
 * Obtener todas las celdas adyacentes a una celda
 * @param {number} fila - Fila de la celda
 * @param {number} columna - Columna de la celda
 * @param {object} tamañoTablero - Objeto con filas y columnas del tablero
 * @returns {Array} - Array de objetos {fila, columna} de las celdas adyacentes
 */
export const obtenerCeldasAdyacentes = (fila, columna, tamañoTablero) => {
    const { filas, columnas } = tamañoTablero;
    const adyacentes = [];

    // Recorrer todas las posiciones adyacentes, incluyendo diagonales
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            // Saltar la celda central (la propia celda)
            if (i === 0 && j === 0) continue;
            
            const nuevaFila = fila + i;
            const nuevaColumna = columna + j;
            
            // Verificar límites del tablero (importante para celdas en bordes y esquinas)
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
 * Obtener todas las celdas disponibles (no descubiertas y sin bandera)
 * @private
 */
const obtenerCeldasDisponibles = (tablero, tamañoTablero, celdasDescubiertas, banderas) => {
    const { filas, columnas } = tamañoTablero;
    const celdasDisponibles = [];
    
    for (let i = 0; i < filas; i++) {
        for (let j = 0; j < columnas; j++) {
            const estaDescubierta = celdasDescubiertas.some(
                c => c.fila === i && c.columna === j
            );
            
            const tieneBandera = banderas.some(
                b => b.fila === i && b.columna === j
            );
            
            if (!estaDescubierta && !tieneBandera) {
                celdasDisponibles.push({ fila: i, columna: j });
            }
        }
    }
    
    return celdasDisponibles;
};

/**
 * Seleccionar una celda aleatoria segura para el primer movimiento
 * @param {object} tamañoTablero - Objeto con filas y columnas del tablero
 * @returns {object} - Celda seleccionada {fila, columna}
 */
export const seleccionarPrimeraCeldaSegura = (tamañoTablero) => {
    const { filas, columnas } = tamañoTablero;
    
    // Elegir una posición completamente aleatoria
    const filaAleatoria = Math.floor(Math.random() * filas);
    const columnaAleatoria = Math.floor(Math.random() * columnas);
    
    return { fila: filaAleatoria, columna: columnaAleatoria };
};

/**
 * Obtener las celdas disponibles para una primera jugada segura
 * @param {object} tamañoTablero - Objeto con filas y columnas del tablero
 * @returns {Array} - Lista de celdas iniciales recomendadas
 */
export const obtenerCeldasInicialesSeguras = (tamañoTablero) => {
    const { filas, columnas } = tamañoTablero;
    const celdasDisponibles = [];
    
    // Generar todas las posiciones posibles del tablero
    for (let i = 0; i < filas; i++) {
        for (let j = 0; j < columnas; j++) {
            celdasDisponibles.push({ fila: i, columna: j });
        }
    }
    
    // Aleatorizar el orden para variedad
    celdasDisponibles.sort(() => Math.random() - 0.5);
    
    return celdasDisponibles;
};

/**
 * Verificar consistencia del tablero, detectando errores o inconsistencias
 * @param {Array} tablero - Estado actual del tablero
 * @param {object} tamañoTablero - Objeto con filas y columnas del tablero
 * @param {Array} celdasDescubiertas - Array de celdas descubiertas
 * @param {Array} banderas - Array de celdas con banderas
 * @returns {object} - Resultado del análisis de consistencia
 */
export const verificarConsistenciaTablero = (tablero, tamañoTablero, celdasDescubiertas, banderas) => {
    const inconsistencias = [];
    
    // Verificar cada celda numérica del tablero
    celdasDescubiertas.forEach(celda => {
        const { fila, columna } = celda;
        const valor = tablero[fila][columna];
        
        // Solo verificar celdas con números (incluyendo 0/vacío)
        if (valor === '' || valor === '0' || (valor && !isNaN(valor))) {
            const numeroMinas = valor === '' || valor === '0' ? 0 : parseInt(valor);
            
            // Obtener celdas adyacentes
            const adyacentes = obtenerCeldasAdyacentes(fila, columna, tamañoTablero);
            
            // Contar banderas adyacentes
            const banderasAdyacentes = adyacentes.filter(c => 
                banderas.some(b => b.fila === c.fila && b.columna === c.columna)
            ).length;
            
            // Contar celdas sin descubrir
            const celdasSinDescubrir = adyacentes.filter(c => 
                !celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
                !banderas.some(b => b.fila === c.fila && b.columna === c.columna)
            ).length;
            
            // Verificar si hay demasiadas banderas
            if (banderasAdyacentes > numeroMinas) {
                inconsistencias.push({
                    tipo: 'exceso_banderas',
                    celda: { fila, columna },
                    valor: numeroMinas,
                    actual: banderasAdyacentes,
                    mensaje: `La celda (${fila + 1},${columna + 1}) indica ${numeroMinas} minas, pero hay ${banderasAdyacentes} banderas.`
                });
            }
            
            // Verificar si faltan celdas para colocar las minas necesarias
            const minasRestantes = numeroMinas - banderasAdyacentes;
            if (minasRestantes > celdasSinDescubrir) {
                inconsistencias.push({
                    tipo: 'faltan_celdas',
                    celda: { fila, columna },
                    valor: numeroMinas,
                    restantes: celdasSinDescubrir,
                    necesarias: minasRestantes,
                    mensaje: `La celda (${fila + 1},${columna + 1}) necesita ${minasRestantes} minas más, pero solo quedan ${celdasSinDescubrir} celdas sin descubrir.`
                });
            }
        }
    });
    
    return {
        esConsistente: inconsistencias.length === 0,
        inconsistencias
    };
};

/**
 * Verificar si colocar una bandera generaría inconsistencias en el tablero
 * @param {object} celda - Celda donde se planea colocar bandera
 * @param {Array} tablero - Estado del tablero
 * @param {object} tamañoTablero - Tamaño del tablero
 * @param {Array} celdasDescubiertas - Celdas descubiertas
 * @param {Array} banderas - Banderas ya colocadas
 * @returns {object} - Resultado de la verificación
 */
export const verificarBanderaViolacion = (celda, tablero, tamañoTablero, celdasDescubiertas, banderas) => {
    const adyacentes = obtenerCeldasAdyacentes(celda.fila, celda.columna, tamañoTablero);
    
    // Obtener celdas numéricas adyacentes
    const celdasNumericas = adyacentes.filter(c => 
        celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
        (tablero[c.fila][c.columna] === '' || tablero[c.fila][c.columna] === '0' || 
         (tablero[c.fila][c.columna] && !isNaN(tablero[c.fila][c.columna])))
    );
    
    // Verificar cada celda numérica
    for (const celdaN of celdasNumericas) {
        const valor = tablero[celdaN.fila][celdaN.columna];
        const numeroMinas = valor === '' || valor === '0' ? 0 : parseInt(valor);
        
        // Contar banderas adyacentes (incluyendo la nueva)
        const banderasAdyacentes = obtenerCeldasAdyacentes(celdaN.fila, celdaN.columna, tamañoTablero)
            .filter(c => 
                banderas.some(b => b.fila === c.fila && b.columna === c.columna) ||
                (c.fila === celda.fila && c.columna === celda.columna)
            ).length;
        
        // Si hay más banderas que el número, hay una violación
        if (banderasAdyacentes > numeroMinas) {
            return {
                hayViolacion: true,
                celda: celdaN,
                mensaje: `Colocar bandera violaría la restricción de la celda (${celdaN.fila+1},${celdaN.columna+1}) que indica ${numeroMinas} minas.`
            };
        }
    }
    
    return { hayViolacion: false };
};

/**
 * Obtener celdas adyacentes que no han sido descubiertas y no tienen bandera
 * @param {number} fila - Fila de la celda
 * @param {number} columna - Columna de la celda
 * @param {object} tamañoTablero - Objeto con filas y columnas del tablero
 * @param {Array} celdasDescubiertas - Array de celdas ya descubiertas
 * @param {Array} banderas - Array de celdas con banderas
 * @returns {Array} - Array de celdas adyacentes no descubiertas
 */
export const obtenerCeldasAdyacentesNoDescubiertas = (fila, columna, tamañoTablero, celdasDescubiertas, banderas) => {
    const adyacentes = obtenerCeldasAdyacentes(fila, columna, tamañoTablero);
    
    return adyacentes.filter(celda => {
        const estaDescubierta = celdasDescubiertas.some(
            c => c.fila === celda.fila && c.columna === celda.columna
        );
        
        const tieneBandera = banderas.some(
            b => b.fila === celda.fila && b.columna === celda.columna
        );
        
        return !estaDescubierta && !tieneBandera;
    });
};

/**
 * Obtener celdas adyacentes que tienen banderas
 * @param {number} fila - Fila de la celda
 * @param {number} columna - Columna de la celda
 * @param {object} tamañoTablero - Objeto con filas y columnas del tablero
 * @param {Array} banderas - Array de celdas con banderas
 * @returns {Array} - Array de celdas adyacentes con banderas
 */
export const obtenerCeldasAdyacentesConBandera = (fila, columna, tamañoTablero, banderas) => {
    const adyacentes = obtenerCeldasAdyacentes(fila, columna, tamañoTablero);
    
    return adyacentes.filter(celda => 
        banderas.some(b => b.fila === celda.fila && b.columna === celda.columna)
    );
};

/**
 * Analizar el tablero para colocar banderas y determinar la siguiente celda a seleccionar
 * Solo coloca banderas con 100% de certeza y respeta todas las reglas del buscaminas clásico
 * @param {object} parametros - Parámetros para el análisis
 * @returns {object} - Resultado del análisis con nueva información
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
    console.log("Analizando tablero para tomar decisiones...");
    
    // Copia del estado actual para modificaciones
    let nuevasBanderas = [...banderas];
    let movimientosGenerados = [];
    
    // 1. PRIMERA FASE: Buscar celdas donde definitivamente hay minas (100% de certeza)
    const nuevasBanderasColocadas = colocarBanderasObvias({
        tablero,
        tamañoTablero,
        celdasDescubiertas,
        banderas: nuevasBanderas
    });
    
    // Si encontramos nuevas banderas obvias, actualizar estado
    if (nuevasBanderasColocadas.length > 0) {
        nuevasBanderas = [...nuevasBanderas, ...nuevasBanderasColocadas];
        
        // Registrar movimientos de bandera
        nuevasBanderasColocadas.forEach(bandera => {
            movimientosGenerados.push({
                fila: bandera.fila,
                columna: bandera.columna,
                esAccion: true,
                accion: "bandera"
            });
        });
        
        setMensajeSistema(`He confirmado con 100% de certeza ${nuevasBanderasColocadas.length} mina(s) y las he marcado con banderas.`);
        setAnimacion('bandera');
    }
    
    // 2. SEGUNDA FASE: Buscar celdas seguras (sin minas) para seleccionar
    const celdasSeguras = encontrarCeldasSeguras({
        tablero,
        tamañoTablero,
        celdasDescubiertas,
        banderas: nuevasBanderas
    });
    
    // 3. TERCERA FASE: Si no hay celdas seguras, calcular probabilidades
    let siguiente = null;
    
    if (celdasSeguras.length > 0) {
        // Si hay celdas seguras, elegir una de ellas aleatoriamente para variedad
        const indiceAleatorio = Math.floor(Math.random() * celdasSeguras.length);
        siguiente = celdasSeguras[indiceAleatorio];
        setMensajeSistema(`He encontrado una celda segura en (${siguiente.fila + 1},${siguiente.columna + 1}).`);
    } else {
        // Si no hay celdas seguras, usar análisis probabilístico
        const analisisProbabilistico = calcularProbabilidadesMinas({
            tablero,
            tamañoTablero,
            celdasDescubiertas,
            banderas: nuevasBanderas
        });
        
        if (analisisProbabilistico.celdasOptimas.length > 0) {
            // Elegir una celda aleatoria entre las que tienen menor probabilidad de mina
            const opciones = analisisProbabilistico.celdasOptimas;
            siguiente = opciones[Math.floor(Math.random() * opciones.length)];
            
            const probabilidad = Math.round(siguiente.probabilidad * 100);
            const mensaje = probabilidad < 20 
                ? `No hay celdas completamente seguras. Eligiendo la celda (${siguiente.fila + 1},${siguiente.columna + 1}) que parece bastante segura.`
                : `No hay celdas seguras. Eligiendo la celda (${siguiente.fila + 1},${siguiente.columna + 1}) con menor probabilidad de mina (${probabilidad}%).`;
            
            setMensajeSistema(mensaje);
        } else {
            // Si no hay análisis probabilístico efectivo, elegir una celda aleatoria
            const celdasDisponibles = obtenerCeldasDisponibles(tablero, tamañoTablero, celdasDescubiertas, nuevasBanderas);
            
            if (celdasDisponibles.length > 0) {
                const indiceAleatorio = Math.floor(Math.random() * celdasDisponibles.length);
                siguiente = celdasDisponibles[indiceAleatorio];
                
                setMensajeSistema(`No tengo información suficiente. Seleccionando la celda (${siguiente.fila + 1},${siguiente.columna + 1}) aleatoriamente.`);
            }
        }
    }
    
    // Resultado final del análisis
    return {
        banderas: nuevasBanderas,
        siguienteCelda: siguiente,
        movimientosGenerados
    };
};

/**
 * Colocar banderas en celdas donde hay 100% de certeza que hay minas
 * siguiendo estrictamente las reglas del buscaminas clásico
 * @private
 */
const colocarBanderasObvias = ({ tablero, tamañoTablero, celdasDescubiertas, banderas }) => {
    const nuevasBanderas = [];
    let seRealizoCambio = true;
    let iteraciones = 0;
    const MAX_ITERACIONES = 5; // Límite para evitar bucles infinitos
    
    // Realizar múltiples pasadas hasta que no se encuentren más banderas obvias
    while (seRealizoCambio && iteraciones < MAX_ITERACIONES) {
        seRealizoCambio = false;
        iteraciones++;
        
        // Revisar cada celda con número
        celdasDescubiertas.forEach(celda => {
            const { fila, columna } = celda;
            const valor = tablero[fila][columna];
            
            // Solo procesar celdas con números (incluyendo el 0/vacío)
            if (valor === '' || valor === '0' || (valor && !isNaN(valor))) {
                const numeroMinas = valor === '' || valor === '0' ? 0 : parseInt(valor);
                
                // Obtener celdas adyacentes, considerando bordes y esquinas
                const adyacentes = obtenerCeldasAdyacentes(fila, columna, tamañoTablero);
                
                // Obtener banderas ya colocadas adyacentes
                const banderasAdyacentes = adyacentes.filter(c => 
                    banderas.some(b => b.fila === c.fila && b.columna === c.columna) ||
                    nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)
                );
                
                // Obtener celdas sin descubrir y sin bandera
                const celdasSinDescubrir = adyacentes.filter(c => 
                    !celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
                    !banderas.some(b => b.fila === c.fila && b.columna === c.columna) &&
                    !nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)
                );
                
                // CASO DE 100% CERTEZA: Si el número de celdas sin descubrir es igual al número de minas que faltan,
                // todas esas celdas deben tener minas con 100% de certeza
                if (numeroMinas > banderasAdyacentes.length && 
                    numeroMinas - banderasAdyacentes.length === celdasSinDescubrir.length &&
                    celdasSinDescubrir.length > 0) {
                    
                    celdasSinDescubrir.forEach(c => {
                        // Verificar que no viole reglas con otras celdas numéricas adyacentes
                        const esConsistente = verificarConsistenciaBandera(c, tablero, tamañoTablero, celdasDescubiertas, [...banderas, ...nuevasBanderas]);
                        
                        if (esConsistente && !nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                            nuevasBanderas.push(c);
                            seRealizoCambio = true;
                        }
                    });
                }
            }
        });
    }
    
    return nuevasBanderas;
};

/**
 * Verificar si colocar una bandera en una celda es consistente con todas las celdas numéricas adyacentes
 * @param {object} celda - Celda donde se planea colocar bandera
 * @param {Array} tablero - Estado del tablero
 * @param {object} tamañoTablero - Tamaño del tablero
 * @param {Array} celdasDescubiertas - Celdas descubiertas
 * @param {Array} banderas - Banderas ya colocadas
 * @returns {boolean} - True si es consistente colocar bandera
 * @private
 */
const verificarConsistenciaBandera = (celda, tablero, tamañoTablero, celdasDescubiertas, banderas) => {
    const adyacentes = obtenerCeldasAdyacentes(celda.fila, celda.columna, tamañoTablero);
    
    // Verificar cada celda numérica adyacente
    const celdasNumericasAdyacentes = adyacentes.filter(ad => 
        celdasDescubiertas.some(d => d.fila === ad.fila && d.columna === ad.columna) &&
        (tablero[ad.fila][ad.columna] === '' || tablero[ad.fila][ad.columna] === '0' || 
         (tablero[ad.fila][ad.columna] && !isNaN(tablero[ad.fila][ad.columna])))
    );
    
    // Si no hay celdas numéricas adyacentes, es consistente
    if (celdasNumericasAdyacentes.length === 0) return true;
    
    // Verificar cada celda numérica
    for (const celdaNumerica of celdasNumericasAdyacentes) {
        const valor = tablero[celdaNumerica.fila][celdaNumerica.columna];
        const numeroMinas = valor === '' || valor === '0' ? 0 : parseInt(valor);
        
        // Contar banderas actuales (incluyendo la nueva)
        const banderasAdyacentes = obtenerCeldasAdyacentes(celdaNumerica.fila, celdaNumerica.columna, tamañoTablero)
            .filter(ad => 
                banderas.some(b => b.fila === ad.fila && b.columna === ad.columna) ||
                (ad.fila === celda.fila && ad.columna === celda.columna) // La nueva bandera
            );
        
        // Si hay más banderas que el número indicado, no es consistente
        if (banderasAdyacentes.length > numeroMinas) {
            return false;
        }
        
        // Contar celdas sin descubrir adyacentes a esta celda numérica
        const celdasNoDescubiertasAdyacentes = obtenerCeldasAdyacentes(celdaNumerica.fila, celdaNumerica.columna, tamañoTablero)
            .filter(ad => 
                !celdasDescubiertas.some(d => d.fila === ad.fila && d.columna === ad.columna) &&
                !banderas.some(b => b.fila === ad.fila && b.columna === ad.columna) &&
                !(ad.fila === celda.fila && ad.columna === celda.columna) // Excluir la nueva bandera
            );
        
        // Si colocar esta bandera obligaría a que queden celdas no descubiertas insuficientes para las minas necesarias
        const minasRestantesNecesarias = numeroMinas - banderasAdyacentes.length;
        if (minasRestantesNecesarias > celdasNoDescubiertasAdyacentes.length) {
            return false;
        }
    }
    
    return true;
};

/**
 * Encontrar celdas que definitivamente no tienen minas (100% seguras)
 * @private
 */
const encontrarCeldasSeguras = ({ tablero, tamañoTablero, celdasDescubiertas, banderas }) => {
    const celdasSeguras = [];
    
    // Revisar cada celda con número
    celdasDescubiertas.forEach(celda => {
        const { fila, columna } = celda;
        const valor = tablero[fila][columna];
        
        // Solo procesar celdas con números (incluyendo el 0/vacío)
        if (valor === '' || valor === '0' || (valor && !isNaN(valor))) {
            const numeroMinas = valor === '' || valor === '0' ? 0 : parseInt(valor);
            
            // Obtener celdas adyacentes
            const adyacentes = obtenerCeldasAdyacentes(fila, columna, tamañoTablero);
            
            // Contar banderas adyacentes
            const banderasAdyacentes = adyacentes.filter(c => 
                banderas.some(b => b.fila === c.fila && b.columna === c.columna)
            ).length;
            
            // CERTEZA 100%: Si el número de banderas coincide con el número indicado,
            // todas las demás celdas adyacentes son seguras
            if (banderasAdyacentes === numeroMinas) {
                // Encontrar celdas sin descubrir y sin bandera
                const celdasSinDescubrir = adyacentes.filter(c => 
                    !celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
                    !banderas.some(b => b.fila === c.fila && b.columna === c.columna)
                );
                
                // Añadir a la lista de celdas seguras
                celdasSinDescubrir.forEach(c => {
                    if (!celdasSeguras.some(s => s.fila === c.fila && s.columna === c.columna)) {
                        celdasSeguras.push(c);
                    }
                });
            }
        }
    });
    
    return celdasSeguras;
};

/**
 * Calcular probabilidades de minas para cada celda no descubierta
 * con bloqueo estricto de celdas con alta probabilidad de contener mina
 * @private
 */
const calcularProbabilidadesMinas = ({ tablero, tamañoTablero, celdasDescubiertas, banderas }) => {
    // Mapa para almacenar probabilidades
    const mapaProbabilidades = {};
    const celdasAnalizadas = new Set();
    
    // Paso 1: Calcular probabilidades locales para cada celda numérica
    celdasDescubiertas.forEach(celda => {
        const { fila, columna } = celda;
        const valor = tablero[fila][columna];
        
        // Solo procesar celdas con números (incluyendo el 0/vacío)
        if (valor === '' || valor === '0' || (valor && !isNaN(valor))) {
            const numeroMinas = valor === '' || valor === '0' ? 0 : parseInt(valor);
            
            // Obtener celdas adyacentes
            const adyacentes = obtenerCeldasAdyacentes(fila, columna, tamañoTablero);
            
            // Contar banderas adyacentes
            const banderasAdyacentes = adyacentes.filter(c => 
                banderas.some(b => b.fila === c.fila && b.columna === c.columna)
            ).length;
            
            // Celdas sin descubrir y sin bandera
            const celdasSinDescubrir = adyacentes.filter(c => 
                !celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
                !banderas.some(b => b.fila === c.fila && b.columna === c.columna)
            );
            
            // Si hay celdas sin descubrir
            if (celdasSinDescubrir.length > 0) {
                // Calcular probabilidad para este grupo
                const minasRestantes = numeroMinas - banderasAdyacentes;
                
                // Si ya tenemos todas las minas, la probabilidad es 0
                if (minasRestantes <= 0) {
                    celdasSinDescubrir.forEach(c => {
                        const clave = `${c.fila},${c.columna}`;
                        celdasAnalizadas.add(clave);
                        
                        if (!mapaProbabilidades[clave]) {
                            mapaProbabilidades[clave] = {
                                fila: c.fila,
                                columna: c.columna,
                                probabilidades: [],
                                vecinos: 0
                            };
                        }
                        
                        mapaProbabilidades[clave].probabilidades.push(0);
                        mapaProbabilidades[clave].vecinos += 1;
                    });
                } 
                // Si faltan todas las minas, la probabilidad es 1
                else if (minasRestantes === celdasSinDescubrir.length) {
                    celdasSinDescubrir.forEach(c => {
                        const clave = `${c.fila},${c.columna}`;
                        celdasAnalizadas.add(clave);
                        
                        if (!mapaProbabilidades[clave]) {
                            mapaProbabilidades[clave] = {
                                fila: c.fila,
                                columna: c.columna,
                                probabilidades: [],
                                vecinos: 0
                            };
                        }
                        
                        mapaProbabilidades[clave].probabilidades.push(1);
                        mapaProbabilidades[clave].vecinos += 1;
                    });
                }
                // Caso normal: probabilidad entre 0 y 1
                else {
                    const probabilidad = minasRestantes / celdasSinDescubrir.length;
                    
                    celdasSinDescubrir.forEach(c => {
                        const clave = `${c.fila},${c.columna}`;
                        celdasAnalizadas.add(clave);
                        
                        if (!mapaProbabilidades[clave]) {
                            mapaProbabilidades[clave] = {
                                fila: c.fila,
                                columna: c.columna,
                                probabilidades: [],
                                vecinos: 0
                            };
                        }
                        
                        mapaProbabilidades[clave].probabilidades.push(probabilidad);
                        mapaProbabilidades[clave].vecinos += 1;
                    });
                }
            }
        }
    });
    
    // Paso 2: Calcular probabilidad definitiva para cada celda
    const celdas = Object.values(mapaProbabilidades).map(celda => {
        // Si alguna de las probabilidades es 1 o muy cercana, la celda definitivamente tiene mina
        const tieneProbabilidadAlta = celda.probabilidades.some(p => p >= 0.9);
        
        // Si alguna de las probabilidades es 0, la celda definitivamente NO tiene mina
        const tieneProbabilidadCero = celda.probabilidades.some(p => p === 0);
        
        // Caso especial: si una celda tiene probabilidad 0 en algún contexto, es segura
        if (tieneProbabilidadCero) {
            return {
                fila: celda.fila,
                columna: celda.columna,
                probabilidad: 0,
                vecinos: celda.vecinos,
                esSegura: true
            };
        }
        
        // Caso especial: si tiene alta probabilidad en algún contexto, tiene mina
        if (tieneProbabilidadAlta) {
            return {
                fila: celda.fila,
                columna: celda.columna,
                probabilidad: 1,
                vecinos: celda.vecinos,
                tieneMina: true
            };
        }
        
        // Calcular probabilidad "máxima" (más conservadora - la mayor probabilidad encontrada)
        // Esto es crucial: usamos el máximo para evitar subestimar el riesgo
        const maxProbabilidad = Math.max(...celda.probabilidades);
        
        // Si alguna probabilidad sugiere más del 30% de chance de mina, considerar de alto riesgo
        const esAltoRiesgo = maxProbabilidad > 0.3;
        
        return {
            fila: celda.fila,
            columna: celda.columna,
            probabilidad: maxProbabilidad,
            vecinos: celda.vecinos,
            esAltoRiesgo
        };
    });
    
    // Paso 3: Añadir celdas no analizadas con probabilidad neutra
    const celdasDisponibles = obtenerCeldasDisponibles(tablero, tamañoTablero, celdasDescubiertas, banderas);
    const celdasNoAnalizadas = celdasDisponibles.filter(c => {
        const clave = `${c.fila},${c.columna}`;
        return !celdasAnalizadas.has(clave);
    });
    
    // Aleatorizar el orden de las celdas no analizadas
    celdasNoAnalizadas.sort(() => Math.random() - 0.5);
    
    // Añadir celdas no analizadas al conjunto
    celdasNoAnalizadas.forEach(c => {
        celdas.push({
            fila: c.fila,
            columna: c.columna,
            probabilidad: 0.15, // Valor neutro para celdas sin información
            vecinos: 0
        });
    });
    
    // Paso 4: Clasificar las celdas en grupos de prioridad
    
    // Grupo 1: Celdas definitivamente seguras (probabilidad 0)
    const celdasSeguras = celdas.filter(c => c.probabilidad === 0 || c.esSegura);
    
    // Grupo 2: Celdas sin información previa (no analizadas)
    const celdasSinInfo = celdas.filter(c => 
        c.vecinos === 0 && 
        !c.esSegura && 
        !c.tieneMina && 
        !c.esAltoRiesgo
    );
    
    // Grupo 3: Celdas de bajo riesgo (probabilidad < 0.25 y con información)
    const celdasBajoRiesgo = celdas.filter(c => 
        c.vecinos > 0 && 
        c.probabilidad < 0.25 && 
        !c.esSegura && 
        !c.tieneMina && 
        !c.esAltoRiesgo
    );
    
    // Grupo 4: Celdas de riesgo moderado (probabilidad < 0.4)
    const celdasRiesgoModerado = celdas.filter(c => 
        c.probabilidad >= 0.25 && 
        c.probabilidad < 0.4 && 
        !c.esSegura && 
        !c.tieneMina
    );
    
    // Paso 5: Seleccionar las mejores opciones (por prioridad)
    // CLAVE: ¡NUNCA elegimos celdas de alto riesgo (≥ 0.4) a menos que no haya otra opción!
    
    // Si hay celdas seguras, éstas son siempre la mejor opción
    if (celdasSeguras.length > 0) {
        return {
            celdasOptimas: celdasSeguras.sort((a, b) => b.vecinos - a.vecinos),
            todasLasCeldas: celdas
        };
    }
    
    // Si hay celdas de bajo riesgo o sin información, usar éstas
    if (celdasBajoRiesgo.length > 0 || celdasSinInfo.length > 0) {
        // Preferimos celdas de bajo riesgo sobre celdas sin información
        const mejoresOpciones = celdasBajoRiesgo.length > 0 ? 
            celdasBajoRiesgo.sort((a, b) => a.probabilidad - b.probabilidad) : 
            celdasSinInfo;
        
        return {
            celdasOptimas: mejoresOpciones,
            todasLasCeldas: celdas
        };
    }
    
    // Si solo quedan celdas de riesgo moderado, usarlas como última opción antes de alto riesgo
    if (celdasRiesgoModerado.length > 0) {
        return {
            celdasOptimas: celdasRiesgoModerado.sort((a, b) => a.probabilidad - b.probabilidad),
            todasLasCeldas: celdas
        };
    }
    
    // Si llegamos aquí, solo hay celdas de alto riesgo
    // Elegir las que tengan menor probabilidad de mina
    const celdasAltoRiesgo = celdas.filter(c => !c.tieneMina).sort((a, b) => a.probabilidad - b.probabilidad);
    
    if (celdasAltoRiesgo.length > 0) {
        const minProb = celdasAltoRiesgo[0].probabilidad;
        const opcionesMenorRiesgo = celdasAltoRiesgo.filter(c => Math.abs(c.probabilidad - minProb) < 0.01);
        
        return {
            celdasOptimas: opcionesMenorRiesgo,
            todasLasCeldas: celdas
        };
    }
    
    // Si no quedan opciones (extremadamente raro), devolver todas las disponibles
    return {
        celdasOptimas: celdasDisponibles.map(c => ({
            fila: c.fila,
            columna: c.columna,
            probabilidad: 0.5
        })),
        todasLasCeldas: celdas
    };
};