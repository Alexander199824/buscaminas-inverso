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
    historialMovimientos
}) => {
    // Función para verificar si una celda tiene un valor inconsistente
    const esInconsistente = (fila, columna) => {
        return historialMovimientos.some(mov => 
            mov.fila === fila && 
            mov.columna === columna && 
            mov.inconsistente
        );
    };

    // Calcular el tamaño de celda responsivo basado en el tamaño del tablero
    const calcularTamañoCelda = () => {
        const tamaño = tamañoSeleccionado.filas;
        
        // Para tableros más grandes, hacemos celdas más grandes
        if (tamaño <= 8) return "w-12 h-12 md:w-14 md:h-14";
        if (tamaño <= 10) return "w-10 h-10 md:w-12 md:h-12";
        if (tamaño <= 12) return "w-9 h-9 md:w-11 md:h-11";
        return "w-8 h-8 md:w-10 md:h-10"; // Para 15x15 o más grande
    };

    const tamañoCelda = calcularTamañoCelda();

    return (
        <div className="flex justify-center items-center w-full mb-16">
            <div className="overflow-x-auto overflow-y-auto w-full flex flex-col items-center">
                <div
                    className="grid gap-0 border-4 border-gray-600 p-1 bg-gray-400 shadow-lg rounded max-w-full"
                    style={{
                        gridTemplateColumns: `repeat(${tamañoSeleccionado.columnas}, minmax(0, 1fr))`,
                        maxHeight: "70vh",
                        minWidth: "60%",
                        maxWidth: "90%"
                    }}
                >
                    {tablero.map((fila, i) => (
                        fila.map((_, j) => (
                            <CeldaTablero 
                                key={`${i}-${j}`}
                                fila={i}
                                columna={j}
                                tablero={tablero}
                                tamañoSeleccionado={tamañoSeleccionado}
                                celdaActual={celdaActual}
                                banderas={banderas}
                                celdasDescubiertas={celdasDescubiertas}
                                animacion={animacion}
                                tema={tema}
                                estaRecienActualizada={estaRecienActualizada}
                                esInconsistente={esInconsistente(i, j)}
                                tamañoCelda={tamañoCelda}
                            />
                        ))
                    ))}
                </div>
                
                {/* Leyenda del tablero */}
                <div className="mt-4 p-3 bg-white rounded border border-gray-300 shadow-sm text-sm w-full max-w-md">
                    <h3 className="font-bold mb-2 text-center">Leyenda del tablero:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <div className="flex items-center">
                            <div className="w-5 h-5 bg-blue-500 rounded mr-2"></div>
                            <span>Celda actual</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-5 h-5 bg-red-100 border border-red-500 rounded mr-2 flex items-center justify-center">
                                <span className="text-xs">⚠️</span>
                            </div>
                            <span>Inconsistencia</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-5 h-5 bg-gray-100 border border-gray-300 rounded mr-2 flex items-center justify-center">
                                <span className="text-xs">🚩</span>
                            </div>
                            <span>Bandera</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TableroJuego;