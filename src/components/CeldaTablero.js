import React from 'react';

const CeldaTablero = ({
    fila,
    columna,
    tablero,
    tamañoSeleccionado,
    celdaActual,
    banderas,
    celdasDescubiertas,
    animacion,
    tema,
    estaRecienActualizada,
    esInconsistente
}) => {
    const esSeleccionada = celdaActual && celdaActual.fila === fila && celdaActual.columna === columna;
    const tieneBandera = banderas.some(b => b.fila === fila && b.columna === columna);
    const estaDescubierta = celdasDescubiertas.some(c => c.fila === fila && c.columna === columna);
    const contenido = tablero[fila][columna];

    // Determinar el tamaño de las celdas según el tamaño del tablero
    let tamañoCelda = "w-8 h-8 md:w-8 md:h-8";
    if (tamañoSeleccionado.filas > 10) {
        tamañoCelda = "w-6 h-6 md:w-6 md:h-6";
    }
    else if (tamañoSeleccionado.filas <= 8) {
        tamañoCelda = "w-10 h-10 md:w-10 md:h-10";
    }

    // Estilos base para la celda
    let estilos = `${tamañoCelda} flex items-center justify-center border border-gray-400 font-bold transition-all duration-200 `;

    // Aplicar estilos según el estado de la celda
    if (esSeleccionada) {
        estilos += `${tema.celdaSeleccionada} ${animacion === 'seleccionar' ? 'animate-pulse' : ''} `;
    } else if (tieneBandera) {
        estilos += `${tema.celdaNormal} ${estaRecienActualizada(fila, columna, 'bandera') ? 'animate-bounce' : ''} `;
    } else if (estaDescubierta) {
        if (contenido === 'M') {
            estilos += `${tema.celdaMina} ${estaRecienActualizada(fila, columna, 'explosion') ? 'animate-ping' : ''} `;
        } else {
            estilos += `${tema.celdaDescubierta} ${estaRecienActualizada(fila, columna, 'respuesta') ? 'animate-pulse' : ''}`;
        }
        
        // Añadir borde rojo si la celda es inconsistente
        if (esInconsistente) {
            estilos += ' border-2 border-red-500 ';
        }
    } else {
        estilos += `${tema.celdaNormal} `;
    }

    // Determinar el color del número según su valor
    let colorNumero = "";
    if (estaDescubierta && contenido && !isNaN(contenido)) {
        const num = parseInt(contenido);
        switch (num) {
            case 1: colorNumero = "text-blue-600"; break;
            case 2: colorNumero = "text-green-600"; break;
            case 3: colorNumero = "text-red-600"; break;
            case 4: colorNumero = "text-purple-600"; break;
            case 5: colorNumero = "text-yellow-600"; break;
            case 6: colorNumero = "text-cyan-600"; break;
            case 7: colorNumero = "text-black"; break;
            case 8: colorNumero = "text-gray-500"; break;
            default: colorNumero = "";
        }
    }

    return (
        <div
            className={estilos}
            data-testid={`celda-${fila}-${columna}`}
            data-selected={esSeleccionada ? "true" : "false"}
            data-discovered={estaDescubierta ? "true" : "false"}
            data-inconsistent={esInconsistente ? "true" : "false"}
        >
            {tieneBandera ? (
                <span className={`${tema.bandera} text-lg`}>🚩</span>
            ) : (
                estaDescubierta ? (
                    contenido === 'M' ? (
                        <span className="text-lg">💣</span>
                    ) : (
                        <div className="relative">
                            <span className={colorNumero}>{contenido}</span>
                            {esInconsistente && <span className="absolute -top-1 -right-1 text-xs">⚠️</span>}
                        </div>
                    )
                ) : ""
            )}
        </div>
    );
};

export default CeldaTablero;