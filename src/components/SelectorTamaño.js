import React from 'react';

const SelectorTamaño = ({ 
    tema, 
    tamañosTablero, 
    tamañoSeleccionado, 
    setTamañoSeleccionado, 
    juegoIniciado 
}) => {
    return (
        <div className="mb-4">
            <label className="block font-medium mb-2">Tamaño del tablero:</label>
            <select
                className={`w-full p-2 border rounded ${tema.selector}`}
                value={tamañoSeleccionado.nombre}
                onChange={(e) => {
                    const nuevoTamaño = tamañosTablero.find(t => t.nombre === e.target.value);
                    setTamañoSeleccionado(nuevoTamaño);
                }}
                disabled={juegoIniciado}
            >
                {tamañosTablero.map((tamaño) => (
                    <option key={tamaño.nombre} value={tamaño.nombre}>
                        {tamaño.nombre}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default SelectorTamaño;