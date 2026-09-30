import type {
    Ciudad,
    Equipos,
    Mantenimiento,
    Marcas,
    Novedades,
    Tecnico,
    Tipo
} from "../types";


export type EquipoAction =

    {
        type: "Inicial-bases",
        payload: {
            marca: Marcas[],
            tecnicos: Tecnico[],
            ciudad: Ciudad[],
            novedades: Novedades[],
            tipo: Tipo[],
            mantenimiento: Mantenimiento[],
            cantidadEquipos: number,
            equipos: Equipos[]
        }
    }

    |

    {
        type: "modal",
        payload: {
            mantenimiento: Mantenimiento
        }
    }

    |

    {
        type: "save-mantenimiento",
        payload: {
            equipoMan: Mantenimiento
        }
    }

    |

    {
        type: "update-mantenimiento",
        payload: {
            equipoMan: Mantenimiento
        }
    }

    |

    {
        type: "delete-equipoMan",
        payload: {
            id: Mantenimiento["activo"],
            año: number,
            ciclo: number
        }
    }

    |

    {
        type: "cerrar-modal"
    } |
    {type:'add-equipo-nuevo', payload:{equipoNuevo: Equipos}}


export type EquipoState = {

    marca: Marcas[];

    tecnicos: Tecnico[];

    ciudad: Ciudad[];

    novedades: Novedades[];

    tipo: Tipo[];

    mantenimiento: Mantenimiento[];

    modal: boolean;

    mantenimientoSeleccionado:
        Mantenimiento | null;

    cantidadEquipos: number;

    equipos: Equipos[];
};


export const initialState: EquipoState = {

    marca: [],

    tecnicos: [],

    ciudad: [],

    novedades: [],

    tipo: [],

    mantenimiento: [],

    modal: false,

    mantenimientoSeleccionado: null,

    cantidadEquipos: 0,

    equipos: []
};


export const equipoReducer = (

    state: EquipoState = initialState,

    action: EquipoAction

): EquipoState => {


    // =====================================================
    // CARGA INICIAL
    // =====================================================

    if (action.type === "Inicial-bases") {

        return {

            ...state,

            ...action.payload

        };
    }


    // =====================================================
    // ABRIR MODAL
    // =====================================================

    if (action.type === "modal") {

        return {

            ...state,

            modal: true,

            mantenimientoSeleccionado:
                action.payload.mantenimiento

        };
    }


    // =====================================================
    // GUARDAR MANTENIMIENTO
    // =====================================================

    if (action.type === "save-mantenimiento") {

        return {

            ...state,

            mantenimiento: [

                ...state.mantenimiento,

                action.payload.equipoMan

            ]

        };
    }


    // =====================================================
    // ACTUALIZAR MANTENIMIENTO
    // =====================================================

    if (action.type === "update-mantenimiento") {

        const mantenimientoActualizado =

            state.mantenimiento.map(
                mantenimiento => {

                    /**
                     * Un mantenimiento se identifica
                     * mediante:
                     *
                     * activo + año + ciclo
                     */

                    const mismoActivo =
                        String(
                            mantenimiento.activo
                        ).trim() ===
                        String(
                            action.payload.equipoMan.activo
                        ).trim();


                    const mismoAño =
                        Number(
                            mantenimiento.año
                        ) ===
                        Number(
                            action.payload.equipoMan.año
                        );


                    const mismoCiclo =
                        Number(
                            mantenimiento.ciclo
                        ) ===
                        Number(
                            action.payload.equipoMan.ciclo
                        );


                    /**
                     * Solo actualizamos cuando
                     * coinciden las tres condiciones.
                     */

                    return (
                        mismoActivo &&
                        mismoAño &&
                        mismoCiclo
                    )

                        ? action.payload.equipoMan

                        : mantenimiento;
                }
            );


        return {

            ...state,

            mantenimiento:
                mantenimientoActualizado,

            mantenimientoSeleccionado:
                action.payload.equipoMan,

            modal: false

        };
    }


    // =====================================================
    // ELIMINAR MANTENIMIENTO
    // =====================================================

    if (action.type === "delete-equipoMan") {

        const newMantenimiento =

            state.mantenimiento.filter(
                equipo => {

                    const mismoActivo =
                        String(
                            equipo.activo
                        ).trim() ===
                        String(
                            action.payload.id
                        ).trim();


                    const mismoAño =
                        Number(
                            equipo.año
                        ) ===
                        Number(
                            action.payload.año
                        );


                    const mismoCiclo =
                        Number(
                            equipo.ciclo
                        ) ===
                        Number(
                            action.payload.ciclo
                        );


                    /**
                     * Eliminamos solamente
                     * el mantenimiento que coincida
                     * con activo + año + ciclo.
                     */

                    return !(
                        mismoActivo &&
                        mismoAño &&
                        mismoCiclo
                    );
                }
            );


        return {

            ...state,

            mantenimiento:
                newMantenimiento

        };
    }


    // =====================================================
    // CERRAR MODAL
    // =====================================================

    if (action.type === "cerrar-modal") {

        return {

            ...state,

            modal: false,

            mantenimientoSeleccionado:
                null

        };
    }


    if(action.type ==='add-equipo-nuevo'){
        return{
            ...state,
            equipos:[...state.equipos, action.payload.equipoNuevo]
        }
    }


    return state;
};

