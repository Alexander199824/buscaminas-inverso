import React from 'react';
import CeldaTablero from './CeldaTablero';

const TableroJuego = ({ 
    tablero, 
    tamañoSeleccionado, 
    celdaActual, 
    banderas, 
    celdasDescubiertas, 
    animacion, 
    tema,
    estaRecienActualizada,
    historialMovimientos,
    onCeldaClick
}) => {
    // Función para verificar si una celda tiene un valor inconsistente
    const esInconsistente = (fila, columna) => {
        return historialMovimientos.some(mov => 
            mov.fila === fila && 
            mov.columna === columna && 
            mov.inconsistente
        );
    };

    // Generar números para filas y columnas
    const numerosColumnas = Array.from({ length: tamañoSeleccionado.columnas }, (_, i) => i + 1);

    // Calcular un tamaño base adaptativo según el tamaño del tablero
    const calcularTamañoCelda = () => {
        if (tamañoSeleccionado.filas <= 8) return 38;  
        if (tamañoSeleccionado.filas <= 10) return 34;
        if (tamañoSeleccionado.filas <= 15) return 28;
        return 22; // Para tableros muy grandes
    };

    const tamañoCelda = calcularTamañoCelda();

    // Colores para el tablero
    const colores = {
        fondoPrincipal: '#2d3748',
        fondoTablero: '#1e2a3b',
        coordenadasFondo: '#2c3e50', 
        coordenadasTexto: '#d1b45c',
        bordeNormal: '#64748b',
        bordeExt: '#94a3b8',
        textoLeyenda: '#a0aec0'
    };

    return (
        <div className="flex flex-col items-center justify-center w-full mb-8 select-none">
            <div className="flex justify-center overflow-auto">
                <div className="tablero-container p-4 rounded-lg" style={{
                    background: `linear-gradient(135deg, ${colores.fondoPrincipal}, ${colores.fondoTablero})`,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.05)',
                    maxWidth: '95vw',
                    maxHeight: '80vh'
                }}>
                    <div 
                        className="tablero-wrapper" 
                        style={{
                            padding: '2px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: `2px solid ${colores.bordeExt}`,
                            background: colores.fondoTablero
                        }}
                    >
                        <table 
                            style={{
                                borderCollapse: 'separate',
                                borderSpacing: '1px',
                                width: 'auto',
                                background: colores.bordeNormal
                            }}
                        >
                            <thead>
                                <tr>
                                    {/* Celda X/Y */}
                                    <th 
                                        style={{
                                            width: `${tamañoCelda}px`,
                                            height: `${tamañoCelda}px`,
                                            padding: '0',
                                            backgroundColor: colores.coordenadasFondo,
                                            color: colores.coordenadasTexto,
                                            borderTopLeftRadius: '6px',
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            fontSize: tamañoSeleccionado.filas > 15 ? '0.7rem' : '0.85rem'
                                        }}
                                    >
                                        <div className="transform -rotate-45 text-xs font-bold opacity-80">X/Y</div>
                                    </th>
                                    
                                    {/* Números de columna */}
                                    {numerosColumnas.map((num, idx) => (
                                        <th 
                                            key={`col-${num}`}
                                            style={{
                                                width: `${tamañoCelda}px`,
                                                height: `${tamañoCelda}px`,
                                                padding: '0',
                                                backgroundColor: colores.coordenadasFondo,
                                                color: colores.coordenadasTexto,
                                                fontWeight: 'bold',
                                                textAlign: 'center',
                                                borderTopRightRadius: idx === numerosColumnas.length - 1 ? '6px' : '0',
                                                fontSize: tamañoSeleccionado.filas > 15 ? '0.7rem' : '0.85rem'
                                            }}
                                        >
                                            {num}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tablero.map((fila, i) => (
                                    <tr key={`fila-${i}`}>
                                        {/* Número de fila */}
                                        <th 
                                            style={{
                                                width: `${tamañoCelda}px`,
                                                height: `${tamañoCelda}px`,
                                                padding: '0',
                                                backgroundColor: colores.coordenadasFondo,
                                                color: colores.coordenadasTexto,
                                                fontWeight: 'bold',
                                                textAlign: 'center',
                                                borderBottomLeftRadius: i === tablero.length - 1 ? '6px' : '0',
                                                fontSize: tamañoSeleccionado.filas > 15 ? '0.7rem' : '0.85rem'
                                            }}
                                        >
                                            {i + 1}
                                        </th>
                                        
                                        {/* Celdas del tablero */}
                                        {fila.map((_, j) => (
                                            <td 
                                                key={`celda-${i}-${j}`}
                                                style={{
                                                    width: `${tamañoCelda}px`,
                                                    height: `${tamañoCelda}px`,
                                                    padding: '0',
                                                    borderBottomRightRadius: (i === tablero.length - 1 && j === fila.length - 1) ? '6px' : '0'
                                                }}
                                            >
                                                <CeldaTablero 
                                                    fila={i}
                                                    columna={j}
                                                    tablero={tablero}
                                                    tamañoSeleccionado={tamañoSeleccionado}
                                                    celdaActual={celdaActual}
                                                    banderas={banderas}
                                                    celdasDescubiertas={celdasDescubiertas}
                                                    animacion={animacion}
                                                    tema={tema}
                                                    esInconsistente={esInconsistente(i, j)}
                                                    estaRecienActualizada={estaRecienActualizada}
                                                    onCeldaClick={onCeldaClick}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Leyenda del tablero */}
                    <div className="mt-4 text-sm flex justify-center space-x-6" style={{ 
                        color: colores.textoLeyenda
                    }}>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ 
                                backgroundColor: colores.coordenadasTexto
                            }}></div>
                            <span>Coordenadas</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-sm mr-2" style={{ 
                                backgroundColor: '#e2e8f0',
                                border: `1px solid ${colores.bordeNormal}`
                            }}></div>
                            <span>Celdas</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TableroJuego;