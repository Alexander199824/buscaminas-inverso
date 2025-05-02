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
    esInconsistente,
    estaRecienActualizada,
    onCeldaClick
}) => {
    // Estados de la celda
    const esSeleccionada = celdaActual && celdaActual.fila === fila && celdaActual.columna === columna;
    const tieneBandera = banderas.some(b => b.fila === fila && b.columna === columna);
    const estaDescubierta = celdasDescubiertas.some(c => c.fila === fila && c.columna === columna);
    const contenido = tablero[fila][columna];
    
    // Ajustar tamaño de texto según tamaño del tablero
    const esTableroGrande = tamañoSeleccionado.filas > 15;
    const tamañoFuente = esTableroGrande ? '0.75rem' : '0.85rem';
    const tamañoIcono = esTableroGrande ? '0.9rem' : '1.1rem';

    // Determinar estilo base según el estado
    let colorFondo, colorTexto;
    
    if (esSeleccionada) {
        colorFondo = '#1e40af'; // Azul oscuro para celda seleccionada
    } else if (tieneBandera) {
        colorFondo = '#e2e8f0'; // Gris muy claro
    } else if (estaDescubierta) {
        if (contenido === 'M') {
            colorFondo = '#fecaca'; // Rojo muy suave
        } else {
            colorFondo = '#ffffff'; // Blanco
        }
    } else {
        colorFondo = '#e2e8f0'; // Gris muy claro
    }

    // Determinar el color del número según su valor
    if (estaDescubierta && contenido && (contenido !== 'M' && contenido !== '')) {
        const num = contenido === '0' ? 0 : parseInt(contenido);
        switch (num) {
            case 0: colorTexto = "#000000"; break; // negro
            case 1: colorTexto = "#3b82f6"; break; // Azul
            case 2: colorTexto = "#10b981"; break; // Verde
            case 3: colorTexto = "#ef4444"; break; // Rojo
            case 4: colorTexto = "#8b5cf6"; break; // Púrpura
            case 5: colorTexto = "#f97316"; break; // Naranja
            case 6: colorTexto = "#06b6d4"; break; // Turquesa
            case 7: colorTexto = "#1f2937"; break; // Gris muy oscuro
            case 8: colorTexto = "#64748b"; break; // Gris medio
            default: colorTexto = "#64748b";      // Gris predeterminado
        }
    }

    // Determinar animaciones
    let animacionClase = '';
    if (esSeleccionada && animacion === 'seleccionar') {
        animacionClase = 'animate-pulse';
    } else if (tieneBandera && estaRecienActualizada(fila, columna, 'bandera')) {
        animacionClase = 'animate-bounce';
    } else if (estaDescubierta) {
        if (contenido === 'M' && estaRecienActualizada(fila, columna, 'explosion')) {
            animacionClase = 'animate-ping';
        } else if (estaRecienActualizada(fila, columna, 'respuesta')) {
            animacionClase = 'animate-pulse';
        }
    }

    return (
        <div
            className={`w-full h-full flex items-center justify-center ${animacionClase}`}
            data-testid={`celda-${fila}-${columna}`}
            data-selected={esSeleccionada ? "true" : "false"}
            data-discovered={estaDescubierta ? "true" : "false"}
            data-inconsistent={esInconsistente ? "true" : "false"}
            onClick={() => onCeldaClick && onCeldaClick(fila, columna)}
            style={{
                backgroundColor: colorFondo,
                border: esInconsistente ? '2px solid #ef4444' : 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
                borderRadius: '2px',
                overflow: 'hidden'
            }}
        >
            {tieneBandera ? (
                <span style={{ fontSize: tamañoIcono }}>🚩</span>
            ) : (
                estaDescubierta ? (
                    contenido === 'M' ? (
                        <span style={{ fontSize: tamañoIcono }}>💣</span>
                    ) : (
                        <div className="relative w-full h-full flex items-center justify-center">
                            {/* Mostrar el valor  */}
                            <span style={{ 
                                color: colorTexto, 
                                fontSize: tamañoFuente, 
                                fontWeight: 'bold' 
                            }}>
                                {contenido === '' ? '' : contenido}
                            </span>
                            {esInconsistente && 
                                <span className="absolute -top-1 -right-1 text-xs">⚠️</span>
                            }
                        </div>
                    )
                ) : ""
            )}
        </div>
    );
};

export default CeldaTablero;