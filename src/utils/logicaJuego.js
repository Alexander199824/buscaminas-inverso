/**
 * Obtener celdas adyacentes no descubiertas a una celda
 */
export const obtenerCeldasAdyacentesNoDescubiertas = (fila, columna, tamañoSeleccionado, celdasDescubiertas, banderas) => {
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
                nuevaColumna >= 0 && nuevaColumna < columnasTablero &&
                !celdasDescubiertas.some(c => c.fila === nuevaFila && c.columna === nuevaColumna) &&
                !banderas.some(b => b.fila === nuevaFila && b.columna === nuevaColumna)
            ) {
                celdasAdyacentes.push({ fila: nuevaFila, columna: nuevaColumna });
            }
        }
    }

    return celdasAdyacentes;
};

/**
 * Obtener celdas adyacentes con bandera a una celda
 */
export const obtenerCeldasAdyacentesConBandera = (fila, columna, tamañoSeleccionado, banderas) => {
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
                nuevaColumna >= 0 && nuevaColumna < columnasTablero &&
                banderas.some(b => b.fila === nuevaFila && b.columna === nuevaColumna)
            ) {
                celdasAdyacentes.push({ fila: nuevaFila, columna: nuevaColumna });
            }
        }
    }

    return celdasAdyacentes;
};

/**
 * Analizar el tablero completo en busca de patrones
 */
export const analizarTableroCompleto = ({
    tablero,
    tamañoSeleccionado,
    celdasDescubiertas,
    banderas,
    historialMovimientos,
    setBanderas,
    setMensajeSistema,
    setAnimacion,
    setMostrarModal,
    setMensajeModal,
    setTipoModal,
    setHistorialMovimientos,
    seleccionarSiguienteCelda
}) => {
    console.log("Analizando tablero completo...");

    // Buscar patrones complejos que no se detectan en el análisis normal
    const filasTablero = tamañoSeleccionado.filas;
    const columnasTablero = tamañoSeleccionado.columnas;

    // Análisis de celdas descubiertas en conjunto
    let nuevasBanderas = [...banderas];
    let banderasColocadas = false;

    // Técnica 1: Análisis de intersección de conjuntos
    // Buscar números que compartan celdas adyacentes no descubiertas
    for (let i = 0; i < filasTablero; i++) {
        for (let j = 0; j < columnasTablero; j++) {
            // Verificar si esta celda está descubierta y tiene un número
            const estaDescubierta = celdasDescubiertas.some(c => c.fila === i && c.columna === j);
            const contenido = tablero[i][j];

            if (estaDescubierta && contenido && !isNaN(contenido)) {
                const numeroMinas = parseInt(contenido);

                // Obtener celdas adyacentes no descubiertas
                const adyacentesNoDescubiertas = obtenerCeldasAdyacentesNoDescubiertas(i, j, tamañoSeleccionado, celdasDescubiertas, banderas);
                const adyacentesConBandera = obtenerCeldasAdyacentesConBandera(i, j, tamañoSeleccionado, banderas);

                // Buscar otras celdas numeradas cercanas para comparar
                for (let di = -2; di <= 2; di++) {
                    for (let dj = -2; dj <= 2; dj++) {
                        // Saltar la celda actual
                        if (di === 0 && dj === 0) continue;

                        const otraFila = i + di;
                        const otraColumna = j + dj;

                        // Verificar límites del tablero
                        if (
                            otraFila >= 0 && otraFila < filasTablero &&
                            otraColumna >= 0 && otraColumna < columnasTablero
                        ) {
                            // Verificar si la otra celda está descubierta y tiene un número
                            const otraEstaDescubierta = celdasDescubiertas.some(c => c.fila === otraFila && c.columna === otraColumna);
                            const otroContenido = tablero[otraFila][otraColumna];

                            if (otraEstaDescubierta && otroContenido && !isNaN(otroContenido)) {
                                const otroNumeroMinas = parseInt(otroContenido);

                                // Obtener celdas adyacentes no descubiertas de la otra celda
                                const otrasAdyacentesNoDescubiertas = obtenerCeldasAdyacentesNoDescubiertas(
                                    otraFila, otraColumna, tamañoSeleccionado, celdasDescubiertas, banderas
                                );
                                const otrasAdyacentesConBandera = obtenerCeldasAdyacentesConBandera(
                                    otraFila, otraColumna, tamañoSeleccionado, banderas
                                );

                                // Encontrar la intersección de celdas adyacentes
                                const celdasComunes = adyacentesNoDescubiertas.filter(c1 =>
                                    otrasAdyacentesNoDescubiertas.some(c2 => c2.fila === c1.fila && c2.columna === c1.columna)
                                );

                                // Calcular minas restantes en cada conjunto
                                const minasRestantes1 = numeroMinas - adyacentesConBandera.length;
                                const minasRestantes2 = otroNumeroMinas - otrasAdyacentesConBandera.length;

                                // Verificar si hay celdas seguras o con minas basadas en la intersección
                                if (celdasComunes.length > 0) {
                                    if (minasRestantes1 === adyacentesNoDescubiertas.length) {
                                        // Todas las celdas adyacentes no descubiertas deben tener minas
                                        adyacentesNoDescubiertas.forEach(celda => {
                                            if (!nuevasBanderas.some(b => b.fila === celda.fila && b.columna === celda.columna)) {
                                                nuevasBanderas.push(celda);
                                                banderasColocadas = true;
                                            }
                                        });
                                    }
                                    else if (minasRestantes1 === 0) {
                                        // Ninguna celda adyacente no descubierta puede tener mina
                                        // Esta lógica se maneja en el seleccionarSiguienteCelda
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (banderasColocadas) {
        // Actualizar banderas y mostrar mensaje
        setBanderas(nuevasBanderas);
        setMensajeSistema(`El sistema ha encontrado patrones complejos y ha colocado nuevas banderas. Analizando siguiente movimiento...`);
        setAnimacion('bandera');

        // Actualizar historial
        const nuevoHistorial = [...historialMovimientos];
        nuevasBanderas.forEach(bandera => {
            if (!banderas.some(b => b.fila === bandera.fila && b.columna === bandera.columna)) {
                nuevoHistorial.push({
                    fila: bandera.fila,
                    columna: bandera.columna,
                    esAccion: true,
                    accion: "bandera"
                });
            }
        });
        setHistorialMovimientos(nuevoHistorial);

        // Mostrar modal
        setMostrarModal(true);
        setMensajeModal('¡Encontré nuevas minas con análisis avanzado!');
        setTipoModal('advertencia');

        // Seleccionar otra celda después de colocar banderas
        setTimeout(() => {
            seleccionarSiguienteCelda();
        }, 1500);
    }
};

/**
 * Sistema selecciona siguiente celda basado en la información disponible
 */
export const seleccionarSiguienteCelda = ({
    juegoTerminado,
    esperandoRespuesta,
    tamañoSeleccionado,
    celdasDescubiertas,
    banderas,
    tablero,
    historialMovimientos,
    setJuegoTerminado,
    setMensajeSistema,
    setAnimacion,
    setMostrarModal,
    setMensajeModal,
    setTipoModal,
    seleccionarCelda
}) => {
    // Verificaciones de seguridad importantes
    console.log('Estado esperandoRespuesta:', esperandoRespuesta);
    console.log('Estado juegoTerminado:', juegoTerminado);

    // Si el juego ya terminó, no seguir seleccionando celdas
    if (juegoTerminado) {
        console.log("Juego terminado, no se seleccionarán más celdas");
        return;
    }
    
    // Si estamos esperando respuesta, no seleccionar otra celda
    if (esperandoRespuesta) {
        console.log("Esperando respuesta, no se seleccionará otra celda");
        return;
    }

    const filasTablero = tamañoSeleccionado.filas;
    const columnasTablero = tamañoSeleccionado.columnas;

    // Verificar si quedan celdas por descubrir (que no tengan banderas)
    let celdasDisponiblesTotales = [];
    for (let i = 0; i < filasTablero; i++) {
        for (let j = 0; j < columnasTablero; j++) {
            if (
                !celdasDescubiertas.some(c => c.fila === i && c.columna === j) &&
                !banderas.some(b => b.fila === i && b.columna === j)
            ) {
                celdasDisponiblesTotales.push({ fila: i, columna: j });
            }
        }
    }

    console.log("Celdas disponibles:", celdasDisponiblesTotales.length);

    // Si no quedan celdas por descubrir (todas tienen banderas o están descubiertas), el juego termina con victoria
    if (celdasDisponiblesTotales.length === 0) {
        setJuegoTerminado(true);
        setMensajeSistema("¡El sistema ha descubierto todas las celdas sin minas! Victoria.");
        setAnimacion('victoria');
        setMostrarModal(true);
        setMensajeModal('¡Victoria! El sistema ha descubierto todas las celdas sin minas.');
        setTipoModal('éxito');
        return;
    }

    // 1. Analizar información disponible
    let celdasSeguras = [];
    let celdasSospechosas = [];
    let probabilidadesMinas = {}; // Para análisis probabilístico mejorado

    // Analizar números descubiertos
    celdasDescubiertas.forEach(celda => {
        const { fila, columna } = celda;
        const valorCelda = tablero[fila][columna];

        // Si la celda tiene un número
        if (valorCelda && !isNaN(valorCelda)) {
            const numeroMinas = parseInt(valorCelda);

            // Encontrar celdas adyacentes
            let celdasAdyacentesNoDescubiertas = [];
            let celdasAdyacentesConBandera = 0;

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
                        // Si tiene bandera
                        if (banderas.some(b => b.fila === nuevaFila && b.columna === nuevaColumna)) {
                            celdasAdyacentesConBandera++;
                        }
                        // Si no está descubierta
                        else if (!celdasDescubiertas.some(c => c.fila === nuevaFila && c.columna === nuevaColumna)) {
                            celdasAdyacentesNoDescubiertas.push({
                                fila: nuevaFila,
                                columna: nuevaColumna
                            });

                            // Actualizar mapa de probabilidades
                            const key = `${nuevaFila},${nuevaColumna}`;
                            if (!probabilidadesMinas[key]) {
                                probabilidadesMinas[key] = {
                                    fila: nuevaFila,
                                    columna: nuevaColumna,
                                    confianza: 0,
                                    vecinos: 0
                                };
                            }

                            // Aumentar confianza basada en el número de la celda y celdas adyacentes
                            const probabilidadMina = (numeroMinas - celdasAdyacentesConBandera) /
                                celdasAdyacentesNoDescubiertas.length;

                            probabilidadesMinas[key].confianza += probabilidadMina;
                            probabilidadesMinas[key].vecinos += 1;
                        }
                    }
                }
            }

            // CASO 1: Si el número de banderas ya es igual al número en la celda,
            // todas las celdas adyacentes no descubiertas son seguras
            if (celdasAdyacentesConBandera === numeroMinas && celdasAdyacentesNoDescubiertas.length > 0) {
                celdasSeguras = [...celdasSeguras, ...celdasAdyacentesNoDescubiertas];
            }

            // CASO 2: Si el número de celdas adyacentes no descubiertas es igual
            // al número de minas menos las banderas ya puestas, todas deben tener minas
            else if (celdasAdyacentesNoDescubiertas.length === numeroMinas - celdasAdyacentesConBandera) {
                celdasSospechosas = [...celdasSospechosas, ...celdasAdyacentesNoDescubiertas];
            }

            // CASO 3 (NUEVA HEURÍSTICA): Si la mayoría de las celdas adyacentes probablemente tienen minas
            else if (numeroMinas - celdasAdyacentesConBandera > celdasAdyacentesNoDescubiertas.length / 2) {
                // Marcar estas celdas con mayor probabilidad de tener minas
                celdasAdyacentesNoDescubiertas.forEach(c => {
                    const key = `${c.fila},${c.columna}`;
                    if (probabilidadesMinas[key]) {
                        probabilidadesMinas[key].confianza += 0.2; // Aumentar confianza
                    }
                });
            }
        }
    });

    // 2. Tomar decisión basada en el análisis

    // Prioridad 1: Colocar banderas en celdas sospechosas
    if (celdasSospechosas.length > 0) {
        // Filtrar las celdas sospechosas que ya tienen banderas
        const nuevasCeldasSospechosas = celdasSospechosas.filter(
            celda => !banderas.some(b => b.fila === celda.fila && b.columna === celda.columna)
        );

        if (nuevasCeldasSospechosas.length > 0) {
            const celdaElegida = nuevasCeldasSospechosas[0];
            seleccionarCelda(celdaElegida.fila, celdaElegida.columna);
            setMensajeSistema(`El sistema ha seleccionado la casilla (${celdaElegida.fila + 1},${celdaElegida.columna + 1}) que considera tiene una mina. ¿Qué hay en esta casilla?`);
            return;
        }
    }

    // Prioridad 2: Descubrir celdas seguras
    if (celdasSeguras.length > 0) {
        const celdaElegida = celdasSeguras[0];
        seleccionarCelda(celdaElegida.fila, celdaElegida.columna);
        setMensajeSistema(`El sistema ha seleccionado la casilla (${celdaElegida.fila + 1},${celdaElegida.columna + 1}) porque cree que es segura. ¿Qué hay en esta casilla?`);
        return;
    }

    // Prioridad 3: Análisis probabilístico más sofisticado
    if (Object.keys(probabilidadesMinas).length > 0) {
        // Convertir mapa a array y calcular probabilidades finales
        const celdasConProbabilidad = Object.values(probabilidadesMinas)
            .map(celda => {
                // Normalizar por número de vecinos
                const probabilidadFinal = celda.vecinos > 0 ?
                    celda.confianza / celda.vecinos : 0;

                return {
                    ...celda,
                    probabilidadFinal
                };
            })
            .filter(celda => celda.probabilidadFinal < 0.5); // Filtrar solo celdas relativamente seguras

        if (celdasConProbabilidad.length > 0) {
            // Ordenar por probabilidad más baja de contener mina
            celdasConProbabilidad.sort((a, b) => a.probabilidadFinal - b.probabilidadFinal);

            // Seleccionar la celda con menor probabilidad de contener mina
            const celdaElegida = celdasConProbabilidad[0];
            seleccionarCelda(celdaElegida.fila, celdaElegida.columna);
            setMensajeSistema(`El sistema ha seleccionado la casilla (${celdaElegida.fila + 1},${celdaElegida.columna + 1}) basado en análisis probabilístico. ¿Qué hay en esta casilla?`);
            return;
        }
    }

    // Prioridad 4: Si no hay movimientos claros, tomar decisión aleatoria
    // Usar las celdas disponibles que ya calculamos al inicio
    if (celdasDisponiblesTotales.length > 0) {
        // Preferir celdas que estén adyacentes a celdas ya descubiertas
        let celdasPreferidas = [];

        celdasDisponiblesTotales.forEach(celda => {
            const { fila, columna } = celda;

            // Verificar si esta celda es adyacente a alguna celda descubierta
            const esAdyacente = celdasDescubiertas.some(c => {
                return Math.abs(c.fila - fila) <= 1 && Math.abs(c.columna - columna) <= 1;
            });

            if (esAdyacente) {
                celdasPreferidas.push(celda);
            }
        });

        // Si no hay celdas preferidas, usar todas las disponibles
        const celdasParaElegir = celdasPreferidas.length > 0 ?
            celdasPreferidas : celdasDisponiblesTotales;

        // Elegir una celda aleatoria
        const indiceAleatorio = Math.floor(Math.random() * celdasParaElegir.length);
        const celdaElegida = celdasParaElegir[indiceAleatorio];

        seleccionarCelda(celdaElegida.fila, celdaElegida.columna);
        setMensajeSistema(`El sistema no está seguro y ha seleccionado la casilla (${celdaElegida.fila + 1},${celdaElegida.columna + 1}). ¿Qué hay en esta casilla?`);
    } else {
        // No quedan celdas para descubrir = victoria
        setJuegoTerminado(true);
        setMensajeSistema("¡El sistema ha descubierto todas las celdas sin minas! Victoria.");
        setAnimacion('victoria');
        setMostrarModal(true);
        setMensajeModal('¡Victoria! El sistema ha descubierto todas las celdas sin minas.');
        setTipoModal('éxito');
    }
};