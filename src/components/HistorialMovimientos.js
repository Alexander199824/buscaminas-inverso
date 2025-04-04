import React from 'react';

const HistorialMovimientos = ({ tema, historialMovimientos }) => {
    return (
        <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Últimos movimientos:</h3>
            <div className={`max-h-60 overflow-y-auto border rounded p-3 ${tema.panel}`}>
                {historialMovimientos.slice(-8).map((mov, idx) => (
                    <p key={idx} className={`
                        ${mov.esAccion ? "text-orange-600" : ""} 
                        ${mov.inconsistente ? "text-red-500" : ""}
                        ${idx === historialMovimientos.length - 1 ? "font-bold" : ""}
                    `}>
                        {mov.esAccion ?
                            `Sistema coloca bandera 🚩 en (${mov.fila + 1},${mov.columna + 1})` :
                            `Sistema selecciona (${mov.fila + 1},${mov.columna + 1}) → ${mov.contenido === 'mina' ? '💣' : mov.contenido === 'vacío' ? 'vacío' : mov.contenido}
                            ${mov.inconsistente ? " ⚠️" : ""}`
                        }
                    </p>
                ))}
            </div>
        </div>
    );
};

export default HistorialMovimientos;