
export const obtenerCicloPorFecha = (
    idCiudad: string,
    fecha: Date = new Date()
): number => {

    const id = String(idCiudad ?? "")
        .toUpperCase()
        .trim();

    if (!id) {
        return 0;
    }

    const mes = fecha.getMonth() + 1;


    // =====================================================
    // BUENAVENTURA
    // =====================================================

    if (id === "BV") {

        // Ciclo 2 → febrero - marzo
        if (mes >= 2 && mes <= 3) {
            return 2;
        }

        // Ciclo 3 → mayo - julio
        if (mes >= 5 && mes <= 7) {
            return 3;
        }

        // Ciclo 1 → septiembre - diciembre
        if (mes >= 9 && mes <= 12) {
            return 1;
        }

        return 0;
    }


    // =====================================================
    // TODAS LAS DEMÁS CIUDADES
    // =====================================================

    // Ciclo 2 → mayo - julio
    if (mes >= 5 && mes <= 7) {
        return 2;
    }

    // Ciclo 1 → septiembre - diciembre
    if (mes >= 9 && mes <= 12) {
        return 1;
    }

    return 0;
};


/**
 * Obtiene el ciclo actualmente activo
 * para una ciudad.
 */
export const obtenerCicloActual = (
    idCiudad: string,
    fechaActual: Date = new Date()
): number => {

    return obtenerCicloPorFecha(
        idCiudad,
        fechaActual
    );
};


/**
 * Indica si una ciudad tiene actualmente
 * un ciclo de mantenimiento activo.
 */
export const tieneCicloActivo = (
    idCiudad: string,
    fechaActual: Date = new Date()
): boolean => {

    return (
        obtenerCicloActual(
            idCiudad,
            fechaActual
        ) !== 0
    );
};


/**
 * Obtiene el año correspondiente
 * a una fecha determinada.
 */
export const obtenerAño = (
    fecha: Date = new Date()
): number => {

    return fecha.getFullYear();
};
