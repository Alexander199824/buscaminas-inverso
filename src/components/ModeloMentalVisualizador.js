import React, { useState } from 'react';
import { obtenerCeldasAdyacentes } from '../utils/logicaJuego';

/**
 * Componente para visualizar el proceso de razonamiento del algoritmo de Buscaminas
 * Versión mejorada con análisis de probabilidades
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
    
    // Analizar cada celda numérica para mostrar su razonamiento
    const analisisCeldas = celdasNumericas.map(celda => {
        const { fila, columna } = celda;
        const valor = parseInt(tablero[fila][columna]);
        
        // Obtener celdas adyacentes
        const celdasAdyacentes = obtenerCeldasAdyacentes(fila, columna, tamañoSeleccionado);
        
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
        
        // Calcular probabilidad si no es segura ni tiene definitivamente minas
        const probabilidad = !hayCeldasSeguras && !hayCeldasConMina && celdasSinDescubrir.length > 0 ? 
            (valor - celdasConBandera.length) / celdasSinDescubrir.length : null;
        
        return {
            celda: { fila, columna },
            valor,
            celdasAdyacentes,
            celdasConBandera,
            celdasSinDescubrir,
            hayCeldasSeguras,
            hayCeldasConMina,
            probabilidad,
            esRelevante
        };
    });
    
    // Filtrar solo los análisis relevantes (tienen hallazgos o están cerca de la celda actual)
    const analisisRelevantes = analisisCeldas.filter(analisis => 
        analisis.hayCeldasSeguras || 
        analisis.hayCeldasConMina || 
        analisis.probabilidad !== null ||
        analisis.esRelevante
    );
    
    // Calcular un mapa de calor de probabilidades combinadas para todas las celdas
    const calcularMapaProbabilidades = () => {
        const mapa = {};
        
        analisisCeldas.forEach(analisis => {
            if (analisis.celdasSinDescubrir.length > 0 && !analisis.hayCeldasSeguras && !analisis.hayCeldasConMina) {
                const probPorCelda = analisis.probabilidad || 0;
                
                analisis.celdasSinDescubrir.forEach(c => {
                    const clave = `${c.fila},${c.columna}`;
                    if (!mapa[clave] || mapa[clave].probabilidad < probPorCelda) {
                        mapa[clave] = {
                            probabilidad: probPorCelda,
                            razon: `Cercanía a ${analisis.valor} en (${analisis.celda.fila+1},${analisis.celda.columna+1})`
                        };
                    }
                });
            }
            
            // Marcar celdas 100% seguras
            if (analisis.hayCeldasSeguras) {
                analisis.celdasSinDescubrir.forEach(c => {
                    const clave = `${c.fila},${c.columna}`;
                    mapa[clave] = {
                        probabilidad: 0,
                        razon: `Todas las minas identificadas alrededor de (${analisis.celda.fila+1},${analisis.celda.columna+1})`
                    };
                });
            }
            
            // Marcar celdas 100% con minas
            if (analisis.hayCeldasConMina) {
                analisis.celdasSinDescubrir.forEach(c => {
                    const clave = `${c.fila},${c.columna}`;
                    mapa[clave] = {
                        probabilidad: 1,
                        razon: `Todas las ${analisis.valor - analisis.celdasConBandera.length} celdas sin descubrir tienen minas alrededor de (${analisis.celda.fila+1},${analisis.celda.columna+1})`
                    };
                });
            }
        });
        
        return mapa;
    };
    
    const mapaProbabilidades = calcularMapaProbabilidades();
    
    // Encontrar las mejores jugadas (menor probabilidad de mina)
    const encontrarMejoresJugadas = () => {
        const celdasDisponibles = [];
        
        // Recopilar todas las celdas sin descubrir y sin bandera
        for (let i = 0; i < tamañoSeleccionado.filas; i++) {
            for (let j = 0; j < tamañoSeleccionado.columnas; j++) {
                const estaDescubierta = celdasDescubiertas.some(c => c.fila === i && c.columna === j);
                const tieneBandera = banderas.some(b => b.fila === i && b.columna === j);
                
                if (!estaDescubierta && !tieneBandera) {
                    const clave = `${i},${j}`;
                    const info = mapaProbabilidades[clave] || { probabilidad: 0.15, razon: "Sin información" };
                    
                    celdasDisponibles.push({
                        fila: i,
                        columna: j,
                        probabilidad: info.probabilidad,
                        razon: info.razon
                    });
                }
            }
        }
        
        // Ordenar por probabilidad (menor primero)
        celdasDisponibles.sort((a, b) => a.probabilidad - b.probabilidad);
        
        // Devolver las 3 mejores opciones
        return celdasDisponibles.slice(0, 3);
    };
    
    const mejoresJugadas = encontrarMejoresJugadas();
    
    return (
        <div className={`p-4 border rounded ${tema.panel} shadow-sm mb-6`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Análisis del Sistema</h3>
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
                        <li><span className="text-orange-600 font-medium">Probabilidades:</span> Si no hay certeza, el sistema calcula la probabilidad de mina para cada celda</li>
                        <li>El sistema utiliza análisis avanzado para determinar la mejor jugada basada en probabilidades</li>
                    </ul>
                </div>
            )}
            
            {/* Sección: Mejores jugadas */}
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                <h4 className="font-medium mb-2">Mejores jugadas detectadas:</h4>
                {mejoresJugadas.length > 0 ? (
                    <div className="space-y-2">
                        {mejoresJugadas.map((jugada, idx) => (
                            <div key={idx} className={`p-2 rounded flex justify-between items-center ${
                                jugada.probabilidad === 0 ? 'bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800' : 
                                jugada.probabilidad < 0.3 ? 'bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800' :
                                'bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800'
                            }`}>
                                <div>
                                    <span className="font-bold">({jugada.fila+1},{jugada.columna+1})</span>
                                    <div className="text-xs mt-1">{jugada.razon}</div>
                                </div>
                                <div className={`text-right font-bold ${
                                    jugada.probabilidad === 0 ? 'text-green-600 dark:text-green-300' : 
                                    jugada.probabilidad < 0.3 ? 'text-yellow-600 dark:text-yellow-300' :
                                    'text-red-600 dark:text-red-300'
                                }`}>
                                    {Math.round(jugada.probabilidad * 100)}%
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center">
                        No se han detectado jugadas óptimas aún.
                    </p>
                )}
            </div>
            
            {/* Sección: Análisis detallado */}
            <div className="max-h-60 overflow-y-auto">
                <h4 className="font-medium mb-2">Análisis de celdas con números:</h4>
                {analisisRelevantes.length > 0 ? (
                    <ul className="space-y-2">
                        {analisisRelevantes.map((analisis, index) => (
                            <li key={index} className={`p-2 rounded border ${analisis.esRelevante ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-900 dark:border-yellow-700' : 'border-gray-200 dark:border-gray-700'}`}>
                                <div className="font-medium">
                                    Celda ({analisis.celda.fila + 1},{analisis.celda.columna + 1}) → {analisis.valor}
                                </div>
                                <div className="text-sm mt-1">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Banderas: {analisis.celdasConBandera.length}, 
                                        Sin descubrir: {analisis.celdasSinDescubrir.length}
                                    </span>
                                    
                                    {analisis.hayCeldasSeguras && (
                                        <p className="text-green-600 dark:text-green-400 mt-1">
                                            ✓ Todas las celdas sin bandera son seguras
                                        </p>
                                    )}
                                    
                                    {analisis.hayCeldasConMina && (
                                        <p className="text-red-600 dark:text-red-400 mt-1">
                                            ⚠ Todas las celdas sin descubrir tienen minas
                                        </p>
                                    )}
                                    
                                    {analisis.probabilidad !== null && (
                                        <p className={`mt-1 ${
                                            analisis.probabilidad < 0.3 ? 'text-green-600 dark:text-green-400' : 
                                            analisis.probabilidad < 0.6 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'
                                        }`}>
                                            ℹ {Math.round(analisis.probabilidad * 100)}% de probabilidad de mina en cada celda
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
            
            {/* Sección: Explicación visual del razonamiento */}
            {celdaActual && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium mb-2">Razonamiento actual:</h4>
                    <p className="text-sm">
                        {`Analizando celda (${celdaActual.fila + 1},${celdaActual.columna + 1})...`}
                    </p>
                    
                    {/* Información de probabilidad para la celda actual */}
                    {!celdasDescubiertas.some(c => c.fila === celdaActual.fila && c.columna === celdaActual.columna) && (
                        <div className="mt-2 text-sm">
                            {mapaProbabilidades[`${celdaActual.fila},${celdaActual.columna}`] ? (
                                <p>
                                    Probabilidad de mina: <span className={`font-bold ${
                                        mapaProbabilidades[`${celdaActual.fila},${celdaActual.columna}`].probabilidad === 0 ? 'text-green-600 dark:text-green-400' : 
                                        mapaProbabilidades[`${celdaActual.fila},${celdaActual.columna}`].probabilidad < 0.3 ? 'text-yellow-600 dark:text-yellow-400' :
                                        'text-red-600 dark:text-red-400'
                                    }`}>
                                        {Math.round(mapaProbabilidades[`${celdaActual.fila},${celdaActual.columna}`].probabilidad * 100)}%
                                    </span>
                                </p>
                            ) : (
                                <p>Sin información de probabilidad disponible para esta celda.</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ModeloMentalVisualizador;