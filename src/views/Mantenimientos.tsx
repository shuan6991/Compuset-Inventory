import { useState } from "react";

import { eliminarMantenimiento } from "../services/mantenimientoService";

import { useEquipos } from "../hooks/useEquipos";

import type { Mantenimiento } from "../types";

import { BsFillXCircleFill } from "react-icons/bs";
import { MdEditSquare } from "react-icons/md";

import ExpenseModal from "../components/ExpenseModal";

export default function Mantenimientos() {

    const { state, dispatch } = useEquipos();


    const usuarioGuardado =
        localStorage.getItem("usuario");

    const usuario = usuarioGuardado
        ? JSON.parse(usuarioGuardado)
        : null;

    const esAdmin =
        usuario?.rol === "admin";



    const [caracte, setCaracte] =
        useState<Mantenimiento | null>(null);

    const [buscar, setBuscar] = useState({
        NoActivo: ""
    });



    const addState = (
        item: Mantenimiento
    ) => {

        if (
            caracte?.activo === item.activo
        ) {
            setCaracte(null);
            return;
        }

        setCaracte(item);
    };



    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {

        setBuscar({
            ...buscar,
            [e.target.id]: e.target.value
        });
    };



    const handleDelete = async (
        mantenimiento: Mantenimiento
    ) => {



        if (!esAdmin) {

            console.error(
                "El usuario no tiene permisos para eliminar."
            );

            return;
        }

        try {

            const response =
                await eliminarMantenimiento(
                    mantenimiento.activo,
                    mantenimiento.año,
                    mantenimiento.ciclo
                );

        

            if (response?.success) {

                dispatch({
                    type: "delete-equipoMan",

                    payload: {
                        id: mantenimiento.activo,
                        año: mantenimiento.año,
                        ciclo: mantenimiento.ciclo
                    }
                });

            

                if (
                    caracte?.activo ===
                    mantenimiento.activo
                ) {
                    setCaracte(null);
                }

            } else {

                alert(
                    response?.message ||
                    "No fue posible eliminar el mantenimiento."
                );
            }

        } catch (error) {

            console.error("Error eliminando mantenimiento:", error);
            // Muestra el mensaje de error exacto para depurar
            alert("Error detallado: " + (error instanceof Error ? error.message : JSON.stringify(error)));
        }
    };


    const mantenimientosFiltrados =
        state.mantenimiento.filter(
            mant =>
                mant.activo
                    .toString()
                    .includes(
                        buscar.NoActivo
                    ) ||

                mant.serie
                    .toLowerCase()
                    .includes(
                        buscar.NoActivo.toLowerCase()
                    )
        );

    /**
     * ============================================================
     * FUNCIÓN GENERAL PARA OBTENER NOMBRES
     * ============================================================
     */

    const obtenerNombre = <
        T extends {
            id: number | string;
            nombre: string;
        }
    >(
        array: T[],
        id: number | string
    ) => {

        const item = array.find(
            el =>
                el.id.toString() ===
                id.toString()
        );

        return item
            ? item.nombre
            : "";
    };

    /**
     * ============================================================
     * MARCA
     * ============================================================
     */

    const nombreMarca = (
        marcaActu: Mantenimiento["marca"]
    ) => {

        return obtenerNombre(
            state.marca,
            marcaActu
        );
    };

    /**
     * ============================================================
     * MODELO
     * ============================================================
     */

    const modelos = (
        marcaActu: Mantenimiento["marca"],
        modeloActu: Mantenimiento["modelo"]
    ) => {

        const marca =
            state.marca.find(
                marc =>
                    marc.id === marcaActu
            );

        if (!marca) {
            return "";
        }

        return obtenerNombre(
            marca.modelo,
            modeloActu
        );
    };

    /**
     * ============================================================
     * TIPO
     * ============================================================
     */

    const nombreTipo = (
        tipoActu: Mantenimiento["tipo"]
    ) => {

        return obtenerNombre(
            state.tipo,
            tipoActu
        );
    };

    /**
     * ============================================================
     * TÉCNICO
     * ============================================================
     */

    const nombreTecnico = (
        tecnicoActu: Mantenimiento["tecnico"]
    ) => {

        const tecnico =
            state.tecnicos.find(
                tec =>
                    tec.id === tecnicoActu
            );

        return tecnico
            ? `${tecnico.nombre} ${tecnico.apellido}`
            : "";
    };

    /**
     * ============================================================
     * NOVEDADES
     * ============================================================
     */

    const nombreNovedad = (
        novedadActu: Mantenimiento["novedades"]
    ) => {

        return obtenerNombre(
            state.novedades,
            novedadActu
        );
    };

    /**
     * ============================================================
     * CIUDAD
     * ============================================================
     */

    const nombreCiudad = (
        ciudadActu: Mantenimiento["ciudad"]
    ) => {

        const ciudad =
            state.ciudad.find(
                ciu =>
                    ciu.id === ciudadActu
            );

        return ciudad
            ? ciudad.nombre
            : "";
    };

    /**
     * ============================================================
     * SEDE
     * ============================================================
     */

    const nombreSede = (
        ciudadActu: Mantenimiento["ciudad"],
        sedeActu: Mantenimiento["sede"]
    ) => {

        const ciudad =
            state.ciudad.find(
                ciu =>
                    ciu.id === ciudadActu
            );

        if (!ciudad) {
            return "";
        }

        const sede =
            ciudad.centro.find(
                cen =>
                    cen.id === sedeActu
            );

        return sede
            ? sede.nombre
            : "";
    };

    /**
     * ============================================================
     * RENDER
     * ============================================================
     */

    return (

        <div className="bg-blue-700 py-20 min-h-screen">

            <ExpenseModal />

            <h1 className="text-white text-3xl uppercase text-center font-bold mb-10">
                Mantenimientos Realizados
            </h1>

            <div className="space-y-10 max-w-6xl mx-auto rounded-lg bg-white p-10">

                {/* BUSCADOR */}

                <input
                    className="p-3 border border-orange-500 rounded-lg w-full"
                    type="text"
                    placeholder="Buscar equipo por activo..."
                    id="NoActivo"
                    value={buscar.NoActivo}
                    onChange={handleChange}
                />

                {/* LISTADO */}

                {mantenimientosFiltrados.map(
                    (mant) => (

                        <div
                            key={`${mant.activo}-${mant.año}-${mant.ciclo}`}
                        >

                            <div className="flex flex-col gap-2">

                                <button
                                    className="bg-white border border-orange-500 p-3 rounded-lg w-full flex flex-col items-start cursor-pointer hover:bg-gray-100"

                                    onClick={(e) => {

                                        addState(mant);

                                        e.stopPropagation();
                                    }}
                                >

                                    <p
                                        className={`
                                            -ml-7
                                            -mt-7
                                            p-2
                                            text-white
                                            font-bold
                                            flex
                                            flex-row
                                            justify-between
                                            gap-2
                                            ${mant.tipo === 1
                                                ? "bg-blue-600"
                                                : mant.tipo === 2
                                                    ? "bg-orange-500"
                                                    : "bg-emerald-500"
                                            }
                                        `}
                                    >
                                        {nombreTipo(
                                            mant.tipo
                                        )}
                                    </p>

                                    <div className="flex flex-row justify-between w-full">

                                        <div className="flex flex-row gap-4">

                                            <div className="flex flex-col gap-1">

                                                <div className="flex items-center gap-2">

                                                    <p className="text-blue-700 font-bold text-lg">
                                                        {nombreMarca(
                                                            mant.marca
                                                        )}
                                                    </p>

                                                    <p>
                                                        {modelos(
                                                            mant.marca,
                                                            mant.modelo
                                                        )}
                                                    </p>

                                                </div>

                                                <p>

                                                    <span className="font-bold">
                                                        No Activo:
                                                    </span>

                                                    {" "}

                                                    {mant.activo}

                                                </p>

                                            </div>

                                        </div>

                                        <div className="flex items-center gap-2">

                                            {/* EDITAR - ADMIN Y USER */}

                                            <MdEditSquare
                                                className="text-blue-700 text-3xl cursor-pointer"
                                                title="Editar mantenimiento"

                                                onClick={(e) => {

                                                    e.stopPropagation();

                                                    dispatch({
                                                        type: "modal",

                                                        payload: {
                                                            mantenimiento: mant
                                                        }
                                                    });
                                                }}
                                            />

                                            {/* ELIMINAR - SOLO ADMIN */}

                                            {esAdmin && (

                                                <BsFillXCircleFill
                                                    className="text-red-600 text-3xl cursor-pointer"
                                                    title="Eliminar mantenimiento"

                                                    onClick={(e) => {

                                                        e.stopPropagation();

                                                        handleDelete(
                                                            mant
                                                        );
                                                    }}
                                                />

                                            )}

                                        </div>

                                    </div>

                                </button>

                                {/* DETALLE */}

                                {caracte?.activo === mant.activo && (

                                    <div className="bg-white p-4 rounded-lg border border-orange-500">

                                        <div className="grid grid-cols-3 gap-4">

                                            <p>

                                                <span className="text-blue-700 font-bold">
                                                    Serie:
                                                </span>

                                                {" "}

                                                {caracte.serie}

                                            </p>

                                            <p>

                                                <span className="text-blue-700 font-bold">
                                                    Ciudad:
                                                </span>

                                                {" "}

                                                {nombreCiudad(
                                                    caracte.ciudad
                                                )}

                                            </p>

                                            <p>

                                                <span className="text-blue-700 font-bold">
                                                    Sede:
                                                </span>

                                                {" "}

                                                {nombreSede(
                                                    caracte.ciudad,
                                                    caracte.sede
                                                )}

                                            </p>

                                            <p>

                                                <span className="text-blue-700 font-bold">
                                                    Área:
                                                </span>

                                                {" "}

                                                {caracte.area}

                                            </p>

                                            <p>

                                                <span className="text-blue-700 font-bold">
                                                    Técnico:
                                                </span>

                                                {" "}

                                                {nombreTecnico(
                                                    caracte.tecnico
                                                )}

                                            </p>

                                            <p>

                                                <span className="text-blue-700 font-bold">
                                                    Ciclo de mantenimiento:
                                                </span>

                                                {" "}

                                                {mant.ciclo || "N/A"}

                                            </p>

                                            <p>

                                                <span className="text-blue-700 font-bold">
                                                    Novedades:
                                                </span>

                                                {" "}

                                                {nombreNovedad(
                                                    caracte.novedades
                                                )}

                                            </p>

                                            <p>

                                                <span className="text-blue-700 font-bold">
                                                    Observaciones:
                                                </span>

                                                {" "}

                                                {caracte.observaciones}

                                            </p>

                                        </div>

                                    </div>

                                )}

                            </div>

                        </div>

                    )
                )}

            </div>

        </div>
    );
}

