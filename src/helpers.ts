
const ZONA_HORARIA = "America/Bogota";

/**
 * Convierte una fecha a una fecha legible en Colombia.
 * Evita que la fecha cambie por la zona horaria del navegador.
 */
export const fechaFormat = (fecha: string | Date): string => {
    if (!fecha || fecha === "N/A") return "N/A";

    const fechaDate = fecha instanceof Date
        ? fecha
        : new Date(fecha);

    if (Number.isNaN(fechaDate.getTime())) return "N/A";

    return new Intl.DateTimeFormat("es-CO", {
        timeZone: ZONA_HORARIA,
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(fechaDate);
};

/**
 * Obtiene la fecha y hora actual de Colombia.
 */
export const obtenerFechaColombia = (): Date => {
    const fecha = new Date();

    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: ZONA_HORARIA,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"
    }).formatToParts(fecha);

    const obtenerParte = (tipo: string) =>
        Number(partes.find(parte => parte.type === tipo)?.value);

    return new Date(
        obtenerParte("year"),
        obtenerParte("month") - 1,
        obtenerParte("day"),
        obtenerParte("hour"),
        obtenerParte("minute"),
        obtenerParte("second")
    );
};
