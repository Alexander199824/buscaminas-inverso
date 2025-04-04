import React, { useState } from 'react';

/**
 * Componente para visualizar el proceso de razonamiento del algoritmo de Buscaminas
 */
const ModeloMentalVisualizador = ({ 
    tablero, 
    tamañoSeleccionado, 
    celdasDescubiertas, 
    banderas,
    celdaActual,
    tema
}) => {
    const [mostrarAyuda, setMostrarAyuda] = useState(false);
    
    // Solo consideramos celdas numéricas para analizar
    const celdasNumericas = celdasDescubiertas.filter(celda => {
        const valor = tablero[celda.fila][celda.columna];
        return valor && !isNaN(valor);
    });
    
    // Función para obtener todas las celdas adyacentes
    const obtenerTodasCeldasAdyacentes = (fila, columna) => {
        const filasTablero = tamañoSeleccionado.filas;
        const columnasTablero = tamañoSeleccionado.columnas;
        let celdasAdyacentes = [];

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;

                const nuevaFila = fila + i;
                const nuevaColumna = columna + j;

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
    
    // Analizar cada celda numérica para mostrar su razonamiento
    const analisisCeldas = celdasNumericas.map(celda => {
        const { fila, columna } = celda;
        const valor = parseInt(tablero[fila][columna]);
        
        // Obtener celdas adyacentes
        const celdasAdyacentes = obtenerTodasCeldasAdyacentes(fila, columna);
        
        // Contar banderas
        const celdasConBandera = celdasAdyacentes.filter(c => 
            banderas.some(b => b.fila === c.fila && b.columna === c.columna)
        );
        
        // Contar celdas sin descubrir y sin bandera
        const celdasSinDescubrir = celdasAdyacentes.filter(c => 
            !celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
            !celdasConBandera.some(b => b.fila === c.fila && b.columna === c.columna)
        );
        
        // Celdas seguras (si el número coincide con las banderas)
        const hayCeldasSeguras = celdasConBandera.length === valor && celdasSinDescubrir.length > 0;
        
        // Celdas con mina (si las celdas sin descubrir son exactamente las minas que faltan)
        const hayCeldasConMina = celdasSinDescubrir.length > 0 && 
                                celdasSinDescubrir.length === valor - celdasConBandera.length;
        
        // Verificar si esta celda es la actual o está cerca de la actual
        const esRelevante = celdaActual && 
                          (Math.abs(celdaActual.fila - fila) <= 1 && 
                           Math.abs(celdaActual.columna - columna) <= 1);
        
        return {
            celda: { fila, columna },
            valor,
            celdasAdyacentes,
            celdasConBandera,
            celdasSinDescubrir,
            hayCeldasSeguras,
            hayCeldasConMina,
            esRelevante
        };
    });
    
    // Filtrar solo los análisis relevantes (tienen hallazgos o están cerca de la celda actual)
    const analisisRelevantes = analisisCeldas.filter(analisis => 
        analisis.hayCeldasSeguras || 
        analisis.hayCeldasConMina || 
        analisis.esRelevante
    );
    
    return (
        <div className={`p-4 border rounded ${tema.panel} shadow-sm mb-6`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Modelo Mental</h3>
                <button 
                    className={`text-sm ${tema.botonSecundario} px-2 py-1 rounded`}
                    onClick={() => setMostrarAyuda(!mostrarAyuda)}
                >
                    {mostrarAyuda ? "Ocultar Ayuda" : "Mostrar Ayuda"}
                </button>
            </div>
            
            {mostrarAyuda && (
                <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded border border-blue-200 text-sm">
                    <p className="font-medium mb-2">¿Cómo piensa el sistema?</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Para cada celda con número, el sistema analiza sus 8 celdas adyacentes</li>
                        <li><span className="text-green-600 font-medium">Celdas seguras:</span> Si el número coincide con las banderas ya colocadas, todas las demás celdas adyacentes son seguras</li>
                        <li><span className="text-red-600 font-medium">Celdas con mina:</span> Si el número de celdas sin descubrir es igual al número de minas que faltan por marcar, todas deben tener minas</li>
                        <li>El sistema también utiliza técnicas avanzadas como análisis de intersecciones y patrones típicos de Buscaminas</li>
                    </ul>
                </div>
            )}
            
            <div className="max-h-60 overflow-y-auto">
                {analisisRelevantes.length > 0 ? (
                    <ul className="space-y-2">
                        {analisisRelevantes.map((analisis, index) => (
                            <li key={index} className={`p-2 rounded border ${analisis.esRelevante ? 'bg-yellow-50 border-yellow-300' : 'border-gray-200'}`}>
                                <div className="font-medium">
                                    Celda ({analisis.celda.fila + 1},{analisis.celda.columna + 1}) → {analisis.valor}
                                </div>
                                <div className="text-sm mt-1">
                                    <span className="text-gray-600">
                                        Banderas: {analisis.celdasConBandera.length}, 
                                        Sin descubrir: {analisis.celdasSinDescubrir.length}
                                    </span>
                                    
                                    {analisis.hayCeldasSeguras && (
                                        <p className="text-green-600 mt-1">
                                            ✓ Todas las celdas sin bandera son seguras
                                        </p>
                                    )}
                                    
                                    {analisis.hayCeldasConMina && (
                                        <p className="text-red-600 mt-1">
                                            ⚠ Todas las celdas sin descubrir tienen minas
                                        </p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 text-center">
                        Aún no hay suficiente información para análisis relevantes.
                    </p>
                )}
            </div>
        </div>
    );
};

export default ModeloMentalVisualizador;