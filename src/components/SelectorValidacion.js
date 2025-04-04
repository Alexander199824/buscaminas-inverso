import React from 'react';

const SelectorValidacion = ({ 
    tema, 
    modoValidacion, 
    cambiarModoValidacion,
    juegoIniciado
}) => {
    return (
        <div className="mb-4">
            <label className="block font-medium mb-2">Modo de validación lógica:</label>
            <div className="grid grid-cols-3 gap-2">
                <button
                    className={`py-2 rounded text-center ${modoValidacion === 'advertir' ? tema.botonPrimario : tema.botonSecundario}`}
                    onClick={() => cambiarModoValidacion('advertir')}
                    title="Muestra una advertencia pero permite continuar"
                >
                    Advertir
                </button>
                <button
                    className={`py-2 rounded text-center ${modoValidacion === 'impedir' ? tema.botonPrimario : tema.botonSecundario}`}
                    onClick={() => cambiarModoValidacion('impedir')}
                    title="No permite respuestas inconsistentes"
                >
                    Impedir
                </button>
                <button
                    className={`py-2 rounded text-center ${modoValidacion === 'ignorar' ? tema.botonPrimario : tema.botonSecundario}`}
                    onClick={() => cambiarModoValidacion('ignorar')}
                    title="Ignora las inconsistencias lógicas"
                >
                    Ignorar
                </button>
            </div>
            <div className="text-sm mt-2 text-gray-600 dark:text-gray-400">
                <p>
                    {modoValidacion === 'advertir' ? 
                        'Advertir: Te muestra un aviso si hay una inconsistencia, pero te permite continuar si así lo decides.' :
                    modoValidacion === 'impedir' ?
                        'Impedir: No permite respuestas que creen inconsistencias lógicas en el tablero.' :
                        'Ignorar: No realiza ninguna validación lógica del tablero.'}
                </p>
            </div>
        </div>
    );
};

export default SelectorValidacion;