import { useEffect, useMemo, useState } from "react";



import { eliminarMantenimiento } from "../services/mantenimientoService";



import { useEquipos } from "../hooks/useEquipos";



import type { Equipos, Mantenimiento } from "../types";



import { BsFillXCircleFill } from "react-icons/bs";

import { MdEditSquare } from "react-icons/md";



import ExpenseModal from "../components/ExpenseModal";

import { fechaFormat } from "../helpers";



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



    // La vista conserva los mantenimientos realizados por defecto.

    const [filtroEstado, setFiltroEstado] =

        useState<"realizados" | "faltantes">("realizados");



    const [ciudadFiltro, setCiudadFiltro] = useState("todas");
    const [sedeFiltro, setSedeFiltro] = useState("todas");

    const [paginaActual, setPaginaActual] = useState(1);

    const elementosPorPagina = 10;







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

            // Muestra el mensaje de error exacto para depurar.

            alert("Error detallado: " + (error instanceof Error ? error.message : JSON.stringify(error)));

        }

    };





    // Las sedes disponibles dependen de la ciudad seleccionada.
    const sedesDisponibles = useMemo(() => {
        if (ciudadFiltro === "todas") return [];

        const ciudadSeleccionada = (state.ciudad || []).find(
            ciudad => String(ciudad.id) === ciudadFiltro
        );

        return ciudadSeleccionada?.centro || [];
    }, [state.ciudad, ciudadFiltro]);

    const activosConMantenimiento = useMemo(

        () => new Set(

            (state.mantenimiento || [])

                .map(mant => String(mant.activo ?? "").trim())

                .filter(Boolean)

        ),

        [state.mantenimiento]

    );



    const mantenimientosFiltrados = useMemo(() => {

        const termino = buscar.NoActivo.trim().toLowerCase();



        return (state.mantenimiento || []).filter(mant => {

            const coincideBusqueda =

                String(mant.activo ?? "").toLowerCase().includes(termino) ||

                String(mant.serie ?? "").toLowerCase().includes(termino);

            const coincideCiudad = ciudadFiltro === "todas" ||
                String(mant.ciudad ?? "") === ciudadFiltro;
            const coincideSede = sedeFiltro === "todas" ||
                String(mant.sede ?? "") === sedeFiltro;

            return coincideBusqueda && coincideCiudad && coincideSede;

        });

    }, [state.mantenimiento, buscar.NoActivo, ciudadFiltro, sedeFiltro]);



    const equiposFaltantesFiltrados = useMemo(() => {

        const termino = buscar.NoActivo.trim().toLowerCase();



        return (state.equipos || []).filter(eq => {

            const activo = String(eq.activo ?? "").trim();

            const noTieneMantenimiento = activo && !activosConMantenimiento.has(activo);

            const coincideBusqueda =

                String(eq.activo ?? "").toLowerCase().includes(termino) ||

                String(eq.serie ?? "").toLowerCase().includes(termino);

            const coincideCiudad = ciudadFiltro === "todas" ||
                String(eq.ciudad ?? "") === ciudadFiltro;
            const coincideSede = sedeFiltro === "todas" ||
                String(eq.sede ?? "") === sedeFiltro;

            return Boolean(noTieneMantenimiento) && coincideBusqueda && coincideCiudad && coincideSede;

        });

    }, [state.equipos, activosConMantenimiento, buscar.NoActivo, ciudadFiltro, sedeFiltro]);



    const elementosFiltrados = filtroEstado === "realizados"

        ? mantenimientosFiltrados

        : equiposFaltantesFiltrados;



    const totalPaginas = Math.max(1, Math.ceil(elementosFiltrados.length / elementosPorPagina));



    const elementosOrdenados = [...elementosFiltrados].reverse();



    const elementosPaginados = elementosOrdenados.slice(

        (paginaActual - 1) * elementosPorPagina,

        paginaActual * elementosPorPagina

    );



    useEffect(() => {

        setPaginaActual(1);

    }, [filtroEstado, buscar.NoActivo, ciudadFiltro, sedeFiltro]);



    useEffect(() => {

        if (paginaActual > totalPaginas) setPaginaActual(totalPaginas);

    }, [paginaActual, totalPaginas]);



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

                    placeholder="Buscar por número de activo o serie..."

                    id="NoActivo"

                    value={buscar.NoActivo}

                    onChange={handleChange}

                />



                {/* FILTRO DE CIUDAD */}

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">

                    <label htmlFor="filtroCiudad" className="font-semibold text-slate-700">

                        Filtrar por ciudad:

                    </label>

                    <select
                        id="filtroCiudad"
                        value={ciudadFiltro}
                        onChange={(e) => {
                            setCiudadFiltro(e.target.value);
                            setSedeFiltro("todas");
                            setPaginaActual(1);
                            setCaracte(null);
                        }}
                        className="p-3 border border-slate-300 rounded-lg w-full sm:w-72 bg-white"
                    >
                        <option value="todas">Todas las ciudades</option>
                        {(state.ciudad || []).map(ciudad => (
                            <option key={ciudad.id} value={String(ciudad.id)}>
                                {ciudad.nombre}
                            </option>
                        ))}
                    </select>

                    <label htmlFor="filtroSede" className="font-semibold text-slate-700 sm:ml-4">
                        Filtrar por sede:
                    </label>
                    <select
                        id="filtroSede"
                        value={sedeFiltro}
                        disabled={ciudadFiltro === "todas"}
                        onChange={(e) => {
                            setSedeFiltro(e.target.value);
                            setPaginaActual(1);
                            setCaracte(null);
                        }}
                        className="p-3 border border-slate-300 rounded-lg w-full sm:w-72 bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                        <option value="todas">
                            {ciudadFiltro === "todas" ? "Primero selecciona una ciudad" : "Todas las sedes"}
                        </option>
                        {sedesDisponibles.map(sede => (
                            <option key={sede.id} value={String(sede.id)}>
                                {sede.nombre}
                            </option>
                        ))}
                    </select>

                </div>



                {/* FILTRO DE ESTADO */}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                    <div className="flex flex-col sm:flex-row gap-2">

                        <button

                            type="button"

                            onClick={() => {
                                setCaracte(null);
                                setPaginaActual(1);
                                setFiltroEstado("realizados");
                            }}

                            className={`px-4 py-2 rounded-lg font-semibold transition ${filtroEstado === "realizados" ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}

                        >

                            Realizados ({mantenimientosFiltrados.length})

                        </button>

                        <button

                            type="button"

                            onClick={() => {
                                setCaracte(null);
                                setPaginaActual(1);
                                setFiltroEstado("faltantes");
                            }}

                            className={`px-4 py-2 rounded-lg font-semibold transition ${filtroEstado === "faltantes" ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}

                        >

                            Faltantes ({equiposFaltantesFiltrados.length})

                        </button>

                    </div>

                    <p className="text-sm text-slate-500">

                        Mostrando {elementosFiltrados.length === 0 ? 0 : (paginaActual - 1) * elementosPorPagina + 1}

                        –{Math.min(paginaActual * elementosPorPagina, elementosFiltrados.length)} de {elementosFiltrados.length}

                    </p>

                </div>



                {/* LISTADO PAGINADO */}

                <div key={filtroEstado} className="flex flex-col gap-7">
                    {elementosPaginados.length === 0 ? (

                    <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">

                        {filtroEstado === "realizados"

                            ? "No se encontraron mantenimientos realizados con ese criterio."

                            : "No se encontraron equipos faltantes con ese criterio."}

                    </div>

                ) : elementosPaginados.map((elemento) => {

                    if (filtroEstado === "faltantes") {

                        const eq = elemento as Equipos;

                        return (

                            <div key={`faltante-${eq.activo}`} className="rounded-lg border border-orange-300 bg-white p-4">

                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                                    <div>

                                        <p className="inline-block rounded-md bg-orange-500 px-3 py-1 text-sm font-bold text-white mb-2">

                                            Mantenimiento pendiente

                                        </p>

                                        <div className="flex flex-wrap items-center gap-2">

                                            <p className="text-blue-700 font-bold text-lg">{nombreMarca(eq.marca)}</p>

                                            <p className="font-medium">{modelos(eq.marca, eq.modelo)}</p>

                                        </div>

                                        <p><span className="font-bold">No. Activo:</span> {eq.activo}</p>

                                        <p><span className="font-bold">Serie:</span> {eq.serie || "N/A"}</p>

                                    </div>

                                    <div className="text-sm text-slate-600 sm:text-right">

                                        <p><span className="font-semibold">Tipo:</span> {nombreTipo(eq.tipo) || "N/A"}</p>

                                        <p><span className="font-semibold">Ciudad:</span> {nombreCiudad(eq.ciudad) || "N/A"}</p>

                                        <p><span className="font-semibold">Sede:</span> {nombreSede(eq.ciudad, eq.sede) || "N/A"}</p>

                                        <p><span className="font-semibold">Área:</span> {eq.area || "N/A"}</p>

                                    </div>

                                </div>

                            </div>

                        );

                    }



                    const mant = elemento as Mantenimiento;

                    return (

                        <div key={`realizado-${mant.activo}-${mant.año}-${mant.ciclo}`}>

                            <div className="flex flex-col gap-2">

                                <button

                                    className="bg-white border border-orange-500 p-3 rounded-lg w-full flex flex-col items-start cursor-pointer hover:bg-gray-100"

                                    onClick={(e) => {

                                        addState(mant);

                                        e.stopPropagation();

                                    }}

                                >

                                    <p className={`-ml-7 -mt-7 p-2 text-white font-bold flex flex-row justify-between gap-2 ${mant.tipo === 1 ? "bg-blue-600" : mant.tipo === 2 ? "bg-orange-500" : "bg-emerald-500"}`}>

                                        {nombreTipo(mant.tipo)}

                                    </p>

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">

                                        <div>

                                            <div className="flex flex-wrap items-center gap-2">

                                                <p className="text-blue-700 font-bold text-lg">{nombreMarca(mant.marca)}</p>

                                                <p>{modelos(mant.marca, mant.modelo)}</p>

                                            </div>

                                            <p><span className="font-bold">No Activo:</span> {mant.activo}</p>

                                            <p><span className="font-bold">Fecha:</span> {fechaFormat(mant.fecha || "N/A")}</p>

                                        </div>

                                        <div className="flex items-center gap-3 self-end sm:self-center">  &#x20;

                                            <MdEditSquare

                                                className="text-blue-700 text-3xl cursor-pointer"

                                                title="Editar mantenimiento"

                                                onClick={(e) => {

                                                    e.stopPropagation();

                                                    dispatch({ type: "modal", payload: { mantenimiento: mant } });

                                                }}

                                            />

                                            {esAdmin && (

                                                <BsFillXCircleFill

                                                    className="text-red-600 text-3xl cursor-pointer"

                                                    title="Eliminar mantenimiento"

                                                    onClick={(e) => {

                                                        e.stopPropagation();

                                                        handleDelete(mant);

                                                    }}

                                                />

                                            )}

                                        </div>

                                    </div>

                                </button>



                                {caracte?.activo === mant.activo && (

                                    <div className="bg-white p-4 rounded-lg border border-orange-500">

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                                            <p><span className="text-blue-700 font-bold">Serie:</span> {caracte.serie}</p>

                                            <p><span className="text-blue-700 font-bold">Ciudad:</span> {nombreCiudad(caracte.ciudad)}</p>

                                            <p><span className="text-blue-700 font-bold">Sede:</span> {nombreSede(caracte.ciudad, caracte.sede)}</p>

                                            <p><span className="text-blue-700 font-bold">Área:</span> {caracte.area}</p>

                                            <p><span className="text-blue-700 font-bold">Técnico:</span> {nombreTecnico(caracte.tecnico)}</p>

                                            <p><span className="text-blue-700 font-bold">Ciclo de mantenimiento:</span> {mant.ciclo || "N/A"}</p>

                                            <p><span className="text-blue-700 font-bold">Novedades:</span> {nombreNovedad(caracte.novedades)}</p>

                                            <p><span className="text-blue-700 font-bold">Observaciones:</span> {caracte.observaciones}</p>

                                        </div>

                                    </div>

                                )}

                            </div>

                        </div>

                    );

                    })}
                </div>

                {/* CONTROLES DE PAGINACIÓN */}

                {elementosFiltrados.length > elementosPorPagina && (

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 pt-5">

                        <p className="text-sm text-slate-600">Página {paginaActual} de {totalPaginas}</p>

                        <div className="flex gap-2">

                            <button

                                type="button"

                                disabled={paginaActual === 1}

                                onClick={() => setPaginaActual(pagina => Math.max(1, pagina - 1))}

                                className="rounded-lg border px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-100"

                            >Anterior</button>

                            <button

                                type="button"

                                disabled={paginaActual === totalPaginas}

                                onClick={() => setPaginaActual(pagina => Math.min(totalPaginas, pagina + 1))}

                                className="rounded-lg border px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-100"

                            >Siguiente</button>

                        </div>

                    </div>

                )}

            </div>



        </div>

    );

}


