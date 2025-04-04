// Constantes y configuración para el juego de Buscaminas Inverso

// Tamaños disponibles para el tablero (ampliados)
export const TAMAÑOS_TABLERO = [
    { nombre: "10x10", filas: 10, columnas: 10 },
    { nombre: "15x15", filas: 15, columnas: 15 },
    { nombre: "8x8", filas: 8, columnas: 8 },
    { nombre: "12x12", filas: 12, columnas: 12 },
    { nombre: "16x16", filas: 16, columnas: 16 },  // Nuevo tamaño
    { nombre: "20x20", filas: 20, columnas: 20 },  // Nuevo tamaño (muy grande)
];

// Tipos de animación
export const TIPOS_ANIMACION = {
    SELECCIONAR: 'seleccionar',
    RESPUESTA: 'respuesta',
    BANDERA: 'bandera',
    EXPLOSION: 'explosion',
    VICTORIA: 'victoria',
    INICIAR: 'iniciar'
};

// Tipos de modal
export const TIPOS_MODAL = {
    ERROR: 'error',
    EXITO: 'éxito',
    ADVERTENCIA: 'advertencia'
};

// Duración de animaciones (en ms)
export const DURACION_ANIMACION = 1500;
export const DURACION_MODAL = 3000;

// Intervalo de análisis periódico (en ms)
export const INTERVALO_ANALISIS = 3000;

// Modos de validación
export const MODOS_VALIDACION = {
    ADVERTIR: 'advertir',
    IMPEDIR: 'impedir',
    IGNORAR: 'ignorar'
};