import { useMemo, useState } from "react";
import { useEquipos } from "../hooks/useEquipos";
import type { Equipos } from "../types";
import { guardarEquipo } from "../services/mantenimientoService";


export default function FormEquipos() {

    const [equipoNuevo, setEquipoNuevo] = useState<Equipos>({
        tipo: 0,
        activo: "",
        serie: "",
        marca: 0,
        modelo: 0,
        ciudad: "",
        sede: 0,
        area: "",
    })

    const [mensaje, setMensaje] = useState<string>("");

    const { state, dispatch } = useEquipos()

    const { equipos } = state;

    const isModelo = useMemo(() => {

        const marcaActual =
            state.marca.find(
                mar =>
                    mar.id ===
                    Number(equipoNuevo.marca)
            );

        return marcaActual
            ? marcaActual.modelo
            : [];

    }, [
        equipoNuevo.marca,
        state.marca
    ]);


    const isSede = useMemo(() => {

        const ciudadActual =
            state.ciudad.find(
                ciu =>
                    ciu.id ===
                    equipoNuevo.ciudad
            );

        return ciudadActual
            ? ciudadActual.centro
            : [];

    }, [
        equipoNuevo.ciudad,
        state.ciudad
    ]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement, HTMLInputElement> | React.ChangeEvent<HTMLSelectElement, HTMLSelectElement>) => {
        setEquipoNuevo({
            ...equipoNuevo,
            [e.target.id]: e.target.value
        })
    }

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {

        e.preventDefault();



        const equipoExist = equipos.some(equi => equi.activo === equipoNuevo.activo)

        if (equipoExist) {
            setMensaje('El equipo ya existe en la base de datos')
            return
        }


        const camposObligatorios:
            (keyof Equipos)[] = [
                "activo",
                "tipo",
                "serie",
                "marca",
                "modelo",
                "ciudad",
                "sede",
                "area"
            ];


        const hayCamposVacios =
            camposObligatorios.some(
                campo => {
                    const valor =
                        equipoNuevo[campo];
                    return (
                        valor === "" ||
                        valor === 0
                    );

                }
            );


        if (hayCamposVacios) {
            setMensaje(
                "Todos los campos son obligatorios, excepto Observaciones."
            );
            setTimeout(
                () => setMensaje(""),
                4000
            );
            return;
        }


        try {
            setMensaje(
                "Guardando equipo nuevo..."
            );

            await guardarEquipo(equipoNuevo)

            dispatch({ type: 'add-equipo-nuevo', payload: { equipoNuevo } })

            setMensaje(
                "Equipo guardado con éxito!"
            );


            setTimeout(
                () => setMensaje(""),
                3000
            );


            setEquipoNuevo({
                tipo: 0,
                activo: "",
                serie: "",
                marca: 0,
                modelo: 0,
                ciudad: "",
                sede: 0,
                area: "",
            })

        } catch (error) {
            console.error(
                "Error al guardar mantenimiento:",
                error
            );


            setMensaje(
                "Ocurrió un error al intentar guardar en la base de datos."
            );

            setTimeout(
                () => setMensaje(""),
                4000
            );
        }

    }

    return (
        <div className="bg-blue-700 py-20">

            <div className="max-w-4xl mx-auto">

                {mensaje && (

                    <div className="fixed top-5 right-5 z-50 animate-bounce-short">

                        <div
                            className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl text-white font-bold text-sm tracking-wide transition-all ${mensaje.includes("éxito")
                                ? "bg-emerald-600 border-l-4 border-emerald-300"
                                : mensaje.includes("Guardando")
                                    ? "bg-yellow-500 border-l-4 border-blue-300"
                                    : "bg-red-600 border-l-4 border-red-300"
                                }`}
                        >

                            <span>

                                {mensaje.includes("éxito")
                                    ? "✓"
                                    : mensaje.includes("Guardando")
                                        ? "⏳"
                                        : "⚠️"}

                            </span>

                            <p>
                                {mensaje}
                            </p>

                        </div>

                    </div>
                )}


                <form
                    className="bg-white p-5 md:p-10 rounded-lg shadow space-y-5"
                    onSubmit={handleSubmit}
                >

                    <h2 className="text-2xl font-bold text-center text-slate-600">
                        Nuevo de Equipo
                    </h2>

                    {/* Tipo */}

                    <div className="grid grid-cols-1 gap-3">

                        <label
                            htmlFor="tipo"
                            className="font-bold"
                        >
                            Tipo:
                        </label>

                        <select
                            id="tipo"
                            className="p-3 border border-slate-300  rounded-lg"
                            value={equipoNuevo.tipo}
                            onChange={handleChange}

                        >

                            <option value={0}>
                                --- Seleccione tipo ---
                            </option>

                            {state.tipo.map(tip => (

                                <option
                                    value={tip.id}
                                    key={tip.id}
                                >
                                    {tip.nombre}
                                </option>

                            ))}

                        </select>

                    </div>


                    {/* ACTIVO */}

                    <div className="grid grid-cols-1 gap-3">

                        <label
                            htmlFor="activo"
                            className="font-bold"
                        >
                            Activo:
                        </label>

                        <input
                            type="number"
                            id="activo"
                            className="p-3 border border-slate-300 rounded-lg"
                            placeholder="Activo Fijo"
                            value={equipoNuevo.activo}
                            onChange={handleChange}
                        />

                    </div>


                    {/* SERIE */}

                    <div className="grid grid-cols-1 gap-3">

                        <label
                            htmlFor="serie"
                            className="font-bold"
                        >
                            Serie:
                        </label>

                        <input
                            type="text"
                            id="serie"
                            className="p-3 border border-slate-300 rounded-lg"
                            placeholder="Serie del equipo"
                            value={equipoNuevo.serie}
                            onChange={handleChange}

                        />

                    </div>


                    {/* MARCA */}

                    <div className="grid grid-cols-1 gap-3">

                        <label
                            htmlFor="marca"
                            className="font-bold"
                        >
                            Marca:
                        </label>

                        <select
                            id="marca"
                            className="p-3 border border-slate-300  rounded-lg"
                            value={equipoNuevo.marca}
                            onChange={handleChange}

                        >

                            <option value={0}>
                                --- Seleccione Marca ---
                            </option>

                            {state.marca.map(mar => (

                                <option
                                    value={mar.id}
                                    key={mar.id}
                                >
                                    {mar.nombre}
                                </option>

                            ))}

                        </select>

                    </div>


                    {/* MODELO */}

                    <div className="grid grid-cols-1 gap-3">

                        <label
                            htmlFor="modelo"
                            className="font-bold"
                        >
                            Modelo:
                        </label>

                        <select
                            id="modelo"
                            className="p-3 border border-slate-300  rounded-lg"
                            value={equipoNuevo.modelo}
                            onChange={handleChange}

                        >

                            <option value={0}>
                                --- Seleccione Modelo ---
                            </option>

                            {isModelo.map(mod => (

                                <option
                                    value={mod.id}
                                    key={mod.id}
                                >
                                    {mod.nombre}
                                </option>

                            ))}

                        </select>

                    </div>


                    {/* CIUDAD */}

                    <div className="grid grid-cols-1 gap-3">

                        <label
                            htmlFor="ciudad"
                            className="font-bold"
                        >
                            Ciudad:
                        </label>

                        <select
                            id="ciudad"
                            className="p-3 border border-slate-300 rounded-lg"
                            value={equipoNuevo.ciudad}
                            onChange={handleChange}
                        >

                            <option value="">
                                --- Seleccione Ciudad ---
                            </option>

                            {state.ciudad.map(ciu => (

                                <option
                                    value={ciu.id}
                                    key={ciu.id}
                                >
                                    {ciu.nombre}
                                </option>

                            ))}

                        </select>

                    </div>


                    {/* SEDE */}

                    <div className="grid grid-cols-1 gap-3">

                        <label
                            htmlFor="sede"
                            className="font-bold"
                        >
                            Sede:
                        </label>

                        <select
                            id="sede"
                            className="p-3 border border-slate-300 rounded-lg"
                            value={equipoNuevo.sede}
                            onChange={handleChange}
                            disabled={!equipoNuevo.ciudad}
                        >

                            <option value={0}>
                                --- Seleccione Sede ---
                            </option>

                            {isSede.map(se => (

                                <option
                                    value={se.id}
                                    key={se.id}
                                >
                                    {se.nombre}
                                </option>

                            ))}

                        </select>

                    </div>


                    {/* ÁREA */}

                    <div className="grid grid-cols-1 gap-3">

                        <label
                            htmlFor="area"
                            className="font-bold"
                        >
                            Área:
                        </label>

                        <input
                            type="text"
                            id="area"
                            className="p-3 border border-slate-300 rounded-lg"
                            placeholder="Área de ubicación"
                            value={equipoNuevo.area}
                            onChange={handleChange}
                        />

                    </div>

                    {/* GUARDAR */}

                    <input
                        type="submit"
                        value="Guardar equipoNuevo"
                        className="bg-blue-900 hover:bg-blue-800 w-full cursor-pointer p-3 text-white uppercase font-bold rounded-lg transition-colors"
                    />

                </form>

            </div>

        </div>
    )
}
