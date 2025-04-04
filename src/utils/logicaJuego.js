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
 * Obtener todas las celdas adyacentes, independientemente de su estado
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
 * Obtener celdas adyacentes con bandera a una celda
 */
export const obtenerCeldasAdyacentesConBandera = (fila, columna, tamañoSeleccionado, banderas) => {
    const celdasAdyacentes = obtenerTodasCeldasAdyacentes(fila, columna, tamañoSeleccionado);
    return celdasAdyacentes.filter(c => 
        banderas.some(b => b.fila === c.fila && b.columna === c.columna)
    );
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

    // Crear una copia de las banderas actuales para comparación
    let nuevasBanderas = [...banderas];
    let banderasColocadas = false;

    // Realizar múltiples pasadas para encontrar todas las pistas posibles
    let hayNuevasBanderas = true;
    let iteraciones = 0;
    const MAX_ITERACIONES = 5; // Limitar iteraciones para evitar bucles infinitos
    
    while (hayNuevasBanderas && iteraciones < MAX_ITERACIONES) {
        hayNuevasBanderas = false;
        iteraciones++;
        
        // --- TÉCNICA 1: Análisis básico de números y celdas adyacentes ---
        for (const celda of celdasDescubiertas) {
            const { fila, columna } = celda;
            const valor = tablero[fila][columna];
            
            if (valor && !isNaN(valor)) {
                const numeroMinas = parseInt(valor);
                
                // Obtener celdas adyacentes
                const celdasAdyacentes = obtenerTodasCeldasAdyacentes(fila, columna, tamañoSeleccionado);
                
                // Contar banderas ya colocadas
                const banderasAdyacentes = celdasAdyacentes.filter(c => 
                    nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)
                ).length;
                
                // Obtener celdas no descubiertas sin bandera
                const celdasNoDescubiertas = celdasAdyacentes.filter(c => 
                    !celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
                    !nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)
                );
                
                // CASO 1: Si el número de celdas sin descubrir coincide con las minas restantes,
                // todas estas celdas deben tener minas
                if (numeroMinas - banderasAdyacentes > 0 && 
                    numeroMinas - banderasAdyacentes === celdasNoDescubiertas.length) {
                    celdasNoDescubiertas.forEach(c => {
                        if (!nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                            nuevasBanderas.push(c);
                            hayNuevasBanderas = true;
                            banderasColocadas = true;
                        }
                    });
                }
            }
        }
        
        // --- TÉCNICA 2: Análisis por intersección de conjuntos ---
        for (let i = 0; i < celdasDescubiertas.length; i++) {
            const celda1 = celdasDescubiertas[i];
            const valor1 = tablero[celda1.fila][celda1.columna];
            
            if (valor1 && !isNaN(valor1)) {
                const num1 = parseInt(valor1);
                const adyacentes1 = obtenerTodasCeldasAdyacentes(celda1.fila, celda1.columna, tamañoSeleccionado);
                
                // Banderas adyacentes a celda1
                const banderas1 = adyacentes1.filter(c => 
                    nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)
                ).length;
                
                // Celdas no descubiertas sin bandera adyacentes a celda1
                const noDesc1 = adyacentes1.filter(c => 
                    !celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
                    !nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)
                );
                
                // Si ya no hay minas por encontrar, continuamos con otra celda
                if (banderas1 >= num1 || noDesc1.length === 0) continue;
                
                // Buscar otras celdas numéricas cerca para comparar
                for (let j = 0; j < celdasDescubiertas.length; j++) {
                    if (i === j) continue;
                    
                    const celda2 = celdasDescubiertas[j];
                    const valor2 = tablero[celda2.fila][celda2.columna];
                    
                    // Solo procesamos celdas con números que estén lo suficientemente cerca
                    if (valor2 && !isNaN(valor2) && 
                        Math.abs(celda1.fila - celda2.fila) <= 2 && 
                        Math.abs(celda1.columna - celda2.columna) <= 2) {
                        
                        const num2 = parseInt(valor2);
                        const adyacentes2 = obtenerTodasCeldasAdyacentes(celda2.fila, celda2.columna, tamañoSeleccionado);
                        
                        // Banderas adyacentes a celda2
                        const banderas2 = adyacentes2.filter(c => 
                            nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)
                        ).length;
                        
                        // Celdas no descubiertas sin bandera adyacentes a celda2
                        const noDesc2 = adyacentes2.filter(c => 
                            !celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
                            !nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)
                        );
                        
                        if (noDesc2.length === 0) continue;
                        
                        // Calcular intersección y diferencias
                        const interseccion = noDesc1.filter(c1 => 
                            noDesc2.some(c2 => c2.fila === c1.fila && c2.columna === c1.columna)
                        );
                        
                        if (interseccion.length === 0) continue;
                        
                        const solo1 = noDesc1.filter(c1 => 
                            !interseccion.some(c => c.fila === c1.fila && c.columna === c1.columna)
                        );
                        
                        const solo2 = noDesc2.filter(c2 => 
                            !interseccion.some(c => c.fila === c2.fila && c.columna === c2.columna)
                        );
                        
                        // CASO 1: Si celda1 incluye todas las celdas de celda2 más algunas otras
                        if (solo2.length === 0 && solo1.length > 0) {
                            const minasRestantes1 = num1 - banderas1;
                            const minasRestantes2 = num2 - banderas2;
                            
                            // Si podemos deducir que todas las minas restantes de celda1 que no están 
                            // en la intersección deben estar en solo1
                            if (minasRestantes1 > minasRestantes2 && 
                                solo1.length === minasRestantes1 - minasRestantes2) {
                                // Todas las celdas en solo1 deben ser minas
                                solo1.forEach(c => {
                                    if (!nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                                        nuevasBanderas.push(c);
                                        hayNuevasBanderas = true;
                                        banderasColocadas = true;
                                    }
                                });
                            }
                        }
                        
                        // CASO 2: Si celda2 incluye todas las celdas de celda1 más algunas otras
                        if (solo1.length === 0 && solo2.length > 0) {
                            const minasRestantes1 = num1 - banderas1;
                            const minasRestantes2 = num2 - banderas2;
                            
                            // Si podemos deducir que todas las minas restantes de celda2 que no están 
                            // en la intersección deben estar en solo2
                            if (minasRestantes2 > minasRestantes1 && 
                                solo2.length === minasRestantes2 - minasRestantes1) {
                                // Todas las celdas en solo2 deben ser minas
                                solo2.forEach(c => {
                                    if (!nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                                        nuevasBanderas.push(c);
                                        hayNuevasBanderas = true;
                                        banderasColocadas = true;
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }

        // --- TÉCNICA 3: Patrón 1-2-1 (muy común en Buscaminas) ---
        for (let fila = 0; fila < tamañoSeleccionado.filas - 2; fila++) {
            for (let columna = 0; columna < tamañoSeleccionado.columnas; columna++) {
                // Buscar el patrón 1-2-1 en vertical
                const esPrimerNumero = celdasDescubiertas.some(c => c.fila === fila && c.columna === columna) && 
                                       tablero[fila][columna] === '1';
                const esSegundoNumero = celdasDescubiertas.some(c => c.fila === fila + 1 && c.columna === columna) && 
                                        tablero[fila + 1][columna] === '2';
                const esTercerNumero = celdasDescubiertas.some(c => c.fila === fila + 2 && c.columna === columna) && 
                                       tablero[fila + 2][columna] === '1';
                
                if (esPrimerNumero && esSegundoNumero && esTercerNumero) {
                    // Verificar patrón en celdas adyacentes
                    const celdasAdyacentes1 = obtenerTodasCeldasAdyacentes(fila, columna, tamañoSeleccionado);
                    const celdasAdyacentes2 = obtenerTodasCeldasAdyacentes(fila + 1, columna, tamañoSeleccionado);
                    const celdasAdyacentes3 = obtenerTodasCeldasAdyacentes(fila + 2, columna, tamañoSeleccionado);
                    
                    // Buscar celdas específicas del patrón
                    const celdaEsquina1 = celdasAdyacentes1.find(c => c.fila === fila - 1 && c.columna === columna - 1);
                    const celdaEsquina2 = celdasAdyacentes3.find(c => c.fila === fila + 3 && c.columna === columna - 1);
                    
                    // Si las celdas esquina están libres y no descubiertas, son minas
                    if (celdaEsquina1 && !celdasDescubiertas.some(c => c.fila === celdaEsquina1.fila && c.columna === celdaEsquina1.columna) &&
                        !nuevasBanderas.some(b => b.fila === celdaEsquina1.fila && b.columna === celdaEsquina1.columna)) {
                        nuevasBanderas.push(celdaEsquina1);
                        hayNuevasBanderas = true;
                        banderasColocadas = true;
                    }
                    
                    if (celdaEsquina2 && !celdasDescubiertas.some(c => c.fila === celdaEsquina2.fila && c.columna === celdaEsquina2.columna) &&
                        !nuevasBanderas.some(b => b.fila === celdaEsquina2.fila && b.columna === celdaEsquina2.columna)) {
                        nuevasBanderas.push(celdaEsquina2);
                        hayNuevasBanderas = true;
                        banderasColocadas = true;
                    }
                }
            }
        }
        
        // También comprobar el patrón 1-2-1 en horizontal
        for (let fila = 0; fila < tamañoSeleccionado.filas; fila++) {
            for (let columna = 0; columna < tamañoSeleccionado.columnas - 2; columna++) {
                const esPrimerNumero = celdasDescubiertas.some(c => c.fila === fila && c.columna === columna) && 
                                       tablero[fila][columna] === '1';
                const esSegundoNumero = celdasDescubiertas.some(c => c.fila === fila && c.columna === columna + 1) && 
                                        tablero[fila][columna + 1] === '2';
                const esTercerNumero = celdasDescubiertas.some(c => c.fila === fila && c.columna === columna + 2) && 
                                       tablero[fila][columna + 2] === '1';
                
                if (esPrimerNumero && esSegundoNumero && esTercerNumero) {
                    // Buscar celdas específicas del patrón
                    const celdaEsquina1 = { fila: fila - 1, columna: columna - 1 };
                    const celdaEsquina2 = { fila: fila - 1, columna: columna + 3 };
                    
                    // Verificar que estén dentro del tablero
                    if (celdaEsquina1.fila >= 0 && celdaEsquina1.columna >= 0 &&
                        !celdasDescubiertas.some(c => c.fila === celdaEsquina1.fila && c.columna === celdaEsquina1.columna) &&
                        !nuevasBanderas.some(b => b.fila === celdaEsquina1.fila && b.columna === celdaEsquina1.columna)) {
                        nuevasBanderas.push(celdaEsquina1);
                        hayNuevasBanderas = true;
                        banderasColocadas = true;
                    }
                    
                    if (celdaEsquina2.fila >= 0 && celdaEsquina2.columna < tamañoSeleccionado.columnas &&
                        !celdasDescubiertas.some(c => c.fila === celdaEsquina2.fila && c.columna === celdaEsquina2.columna) &&
                        !nuevasBanderas.some(b => b.fila === celdaEsquina2.fila && b.columna === celdaEsquina2.columna)) {
                        nuevasBanderas.push(celdaEsquina2);
                        hayNuevasBanderas = true;
                        banderasColocadas = true;
                    }
                }
            }
        }
    }

    // Si se colocaron nuevas banderas, actualizar estado
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

        // Seleccionar siguiente celda después de colocar banderas
        setTimeout(() => {
            seleccionarSiguienteCelda();
        }, 1500);
    } else {
        // No se colocaron nuevas banderas, continuar con la siguiente selección
        seleccionarSiguienteCelda();
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
            const celdasAdyacentes = obtenerTodasCeldasAdyacentes(fila, columna, tamañoSeleccionado);
            
            // Contar banderas adyacentes
            const banderasAdyacentes = celdasAdyacentes.filter(c => 
                banderas.some(b => b.fila === c.fila && b.columna === c.columna)
            ).length;
            
            // Obtener celdas no descubiertas sin bandera
            const celdasNoDescubiertas = celdasAdyacentes.filter(c => 
                !celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
                !banderas.some(b => b.fila === c.fila && b.columna === c.columna)
            );

            // CASO 1: Si el número de banderas ya es igual al número en la celda,
            // todas las celdas adyacentes no descubiertas son seguras
            if (banderasAdyacentes === numeroMinas && celdasNoDescubiertas.length > 0) {
                celdasSeguras = [...celdasSeguras, ...celdasNoDescubiertas];
            }

            // CASO 2: Si el número de celdas adyacentes no descubiertas es igual
            // al número de minas menos las banderas ya puestas, todas deben tener minas
            else if (celdasNoDescubiertas.length === numeroMinas - banderasAdyacentes) {
                celdasSospechosas = [...celdasSospechosas, ...celdasNoDescubiertas];
            }

            // CASO 3: Análisis probabilístico
            else {
                const probabilidadMina = (numeroMinas - banderasAdyacentes) / celdasNoDescubiertas.length;
                
                celdasNoDescubiertas.forEach(c => {
                    const key = `${c.fila},${c.columna}`;
                    if (!probabilidadesMinas[key]) {
                        probabilidadesMinas[key] = {
                            fila: c.fila,
                            columna: c.columna,
                            probabilidades: [],
                            vecinos: 0
                        };
                    }
                    
                    probabilidadesMinas[key].probabilidades.push(probabilidadMina);
                    probabilidadesMinas[key].vecinos += 1;
                });
            }
        }
    });

    // 2. Tomar decisión basada en el análisis

    // Prioridad 1: Seleccionar celdas seguras
    if (celdasSeguras.length > 0) {
        // Eliminar duplicados
        const celdasSegurasFiltradas = celdasSeguras.filter((celda, index, self) =>
            index === self.findIndex(c => c.fila === celda.fila && c.columna === celda.columna)
        );
        
        const celdaElegida = celdasSegurasFiltradas[0];
        seleccionarCelda(celdaElegida.fila, celdaElegida.columna);
        setMensajeSistema(`El sistema ha seleccionado la casilla (${celdaElegida.fila + 1},${celdaElegida.columna + 1}) porque cree que es segura. ¿Qué hay en esta casilla?`);
        return;
    }

    // Prioridad 2: Análisis probabilístico refinado
    if (Object.keys(probabilidadesMinas).length > 0) {
        // Convertir el mapa a un array con probabilidades promedio
        const celdasProbabilisticas = Object.values(probabilidadesMinas)
            .map(celda => {
                // Calcular la probabilidad media
                const probabilidadMedia = celda.probabilidades.reduce((sum, prob) => sum + prob, 0) / celda.probabilidades.length;
                
                return {
                    ...celda,
                    probabilidadFinal: probabilidadMedia
                };
            })
            .filter(celda => celda.probabilidadFinal < 0.5); // Solo considerar celdas relativamente seguras
        
        if (celdasProbabilisticas.length > 0) {
            // Ordenar por probabilidad más baja de contener mina
            celdasProbabilisticas.sort((a, b) => a.probabilidadFinal - b.probabilidadFinal);
            
            // Elegir la celda con menor probabilidad de mina
            const celdaElegida = celdasProbabilisticas[0];
            seleccionarCelda(celdaElegida.fila, celdaElegida.columna);
            setMensajeSistema(`El sistema ha seleccionado la casilla (${celdaElegida.fila + 1},${celdaElegida.columna + 1}) basado en análisis probabilístico. ¿Qué hay en esta casilla?`);
            return;
        }
    }

    // Prioridad 3: Elegir una celda aleatoria, preferiblemente adyacente a una celda descubierta
    // Intentar encontrar celdas no descubiertas adyacentes a celdas ya descubiertas
    let celdasAdyacentesADescubiertas = [];
    
    celdasDescubiertas.forEach(celda => {
        const adyacentes = obtenerTodasCeldasAdyacentes(celda.fila, celda.columna, tamañoSeleccionado);
        const noDescubiertasSinBandera = adyacentes.filter(c => 
            !celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
            !banderas.some(b => b.fila === c.fila && b.columna === c.columna)
        );
        
        celdasAdyacentesADescubiertas = [...celdasAdyacentesADescubiertas, ...noDescubiertasSinBandera];
    });
    
    // Eliminar duplicados
    celdasAdyacentesADescubiertas = celdasAdyacentesADescubiertas.filter((celda, index, self) =>
        index === self.findIndex(c => c.fila === celda.fila && c.columna === c.columna)
    );
    
    // Si hay celdas adyacentes a descubiertas, elegir una al azar
    if (celdasAdyacentesADescubiertas.length > 0) {
        const indiceAleatorio = Math.floor(Math.random() * celdasAdyacentesADescubiertas.length);
        const celdaElegida = celdasAdyacentesADescubiertas[indiceAleatorio];
        
        seleccionarCelda(celdaElegida.fila, celdaElegida.columna);
        setMensajeSistema(`El sistema no está seguro y ha seleccionado una casilla adyacente (${celdaElegida.fila + 1},${celdaElegida.columna + 1}). ¿Qué hay en esta casilla?`);
        return;
    }
    
    // Si no hay celdas adyacentes disponibles, elegir una completamente aleatoria
    const indiceAleatorio = Math.floor(Math.random() * celdasDisponiblesTotales.length);
    const celdaElegida = celdasDisponiblesTotales[indiceAleatorio];
    
    seleccionarCelda(celdaElegida.fila, celdaElegida.columna);
    setMensajeSistema(`El sistema está explorando nuevas áreas y ha seleccionado la casilla (${celdaElegida.fila + 1},${celdaElegida.columna + 1}). ¿Qué hay en esta casilla?`);
};