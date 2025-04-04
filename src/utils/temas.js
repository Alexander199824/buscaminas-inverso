// Funciones para manejar temas de la aplicación

/**
 * Obtiene las clases CSS según el tema seleccionado
 * @param {string} temaColor - 'claro' u 'oscuro'
 * @returns {Object} - Objeto con las clases CSS para cada elemento
 */
export const obtenerClasesTema = (temaColor) => {
    switch (temaColor) {
        case 'oscuro':
            return {
                principal: 'bg-gray-900',
                tarjeta: 'bg-gray-800 shadow-xl text-white',
                botonPrimario: 'bg-indigo-600 hover:bg-indigo-700 text-white',
                botonSecundario: 'bg-gray-700 hover:bg-gray-600 text-white',
                botonSeleccionado: 'bg-indigo-500 text-white',
                cabecera: 'bg-indigo-800 text-white',
                panel: 'bg-gray-700 border-gray-600 text-white',
                celdaDescubierta: 'bg-gray-700',
                celdaNormal: 'bg-gray-600 hover:bg-gray-500',
                celdaSeleccionada: 'bg-yellow-600 border-2 border-yellow-400',
                celdaMina: 'bg-red-700 text-white',
                mensaje: 'bg-gray-700 border-gray-600 text-white',
                bandera: 'text-red-400',
                selector: 'bg-gray-700 text-white border-gray-600',
                modalError: 'bg-red-900 border-red-600 text-red-200',
                modalExito: 'bg-green-900 border-green-600 text-green-200',
                modalAdvertencia: 'bg-yellow-900 border-yellow-600 text-yellow-200'
            };
        case 'claro':
        default:
            return {
                principal: 'bg-white',
                tarjeta: 'bg-gray-50 shadow-sm border border-gray-200',
                botonPrimario: 'bg-blue-600 hover:bg-blue-700 text-white',
                botonSecundario: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
                botonSeleccionado: 'bg-blue-500 text-white',
                cabecera: 'bg-gray-100 text-gray-800 border-b border-gray-200',
                panel: 'bg-white border-gray-200',
                celdaDescubierta: 'bg-gray-50',
                celdaNormal: 'bg-gray-100 hover:bg-gray-200',
                celdaSeleccionada: 'bg-yellow-100 border-2 border-yellow-400',
                celdaMina: 'bg-red-100 text-red-600',
                mensaje: 'bg-white border-gray-200',
                bandera: 'text-red-500',
                selector: 'bg-white text-gray-800 border-gray-300',
                modalError: 'bg-red-50 border-red-200 text-red-600',
                modalExito: 'bg-green-50 border-green-200 text-green-600',
                modalAdvertencia: 'bg-yellow-50 border-yellow-200 text-yellow-600'
            };
    }
};