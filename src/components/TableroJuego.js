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
        
        // Para tableros más grandes, hacemos celdas más pequeñas
        if (tamaño <= 8) return "w-12 h-12 md:w-14 md:h-14";
        if (tamaño <= 10) return "w-10 h-10 md:w-12 md:h-12";
        if (tamaño <= 12) return "w-9 h-9 md:w-11 md:h-11";
        if (tamaño <= 15) return "w-8 h-8 md:w-10 md:h-10";
        return "w-7 h-7 md:w-8 md:h-8"; // Para tableros muy grandes
    };

    const tamañoCelda = calcularTamañoCelda();

    return (
        <div className="flex justify-center items-center w-full mb-8">
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
            </div>
        </div>
    );
};

export default TableroJuego;