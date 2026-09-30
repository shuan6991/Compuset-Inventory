
import { useMemo, useState } from "react";

import type {
    ChangeEvent,
    SubmitEvent
} from "react";

import { useEquipos } from "../hooks/useEquipos";

import {
    guardarMantenimiento,
    obtenerActivo
} from "../services/mantenimientoService";

import {
    obtenerCicloActual,
    obtenerAño
} from "../utilis/cicloHelpers";

import type { Mantenimiento } from "../types";


const initialState: Mantenimiento = {

    fecha: new Date().toISOString(),
    tipo: 0,
    activo: "",
    serie: "",
    marca: 0,
    modelo: 0,
    ciudad: "",
    sede: 0,
    area: "",
    tecnico: 0,
    novedades: 0,
    observaciones: "",
    año: new Date().getFullYear(),
    ciclo: 0
};


export default function Form() {

    const { state, dispatch } = useEquipos();

    const [mantenimiento, setMantenimiento] =
        useState<Mantenimiento>(initialState);

    const [mensaje, setMensaje] =
        useState<string>("");



    const isModelo = useMemo(() => {

        const marcaActual =
            state.marca.find(
                mar =>
                    mar.id ===
                    Number(mantenimiento.marca)
            );

        return marcaActual
            ? marcaActual.modelo
            : [];

    }, [
        mantenimiento.marca,
        state.marca
    ]);



    const isSede = useMemo(() => {

        const ciudadActual =
            state.ciudad.find(
                ciu =>
                    ciu.id ===
                    mantenimiento.ciudad
            );

        return ciudadActual
            ? ciudadActual.centro
            : [];

    }, [
        mantenimiento.ciudad,
        state.ciudad
    ]);



    const mantenimientoYaExiste = (
        activo: string,
        año: number,
        ciclo: number
    ): boolean => {

        return state.mantenimiento.some(
            mant =>

                String(mant.activo).trim() ===
                String(activo).trim()

                && Number(mant.año) ===
                Number(año)

                && Number(mant.ciclo) ===
                Number(ciclo)
        );
    };


    const handleChange = async (
        e: ChangeEvent<
            HTMLInputElement |
            HTMLTextAreaElement |
            HTMLSelectElement
        >
    ) => {

        const {
            id,
            value
        } = e.target;


        const numericFields = [
            "activo",
            "marca",
            "modelo",
            "sede",
            "tecnico",
            "novedades"
        ].includes(id);




        if (id === "activo") {

            const activo =
                value.replace(/\D/g, "");


            setMantenimiento(prev => ({
                ...prev,
                activo
            }));



            if (activo.length !== 12) {
                return;
            }


            try {

                const equipoData =
                    await obtenerActivo(activo);


                if (equipoData) {


                    const cicloCalc =
                        obtenerCicloActual(
                            equipoData.ciudad
                        );


                    const añoActual =
                        obtenerAño();


                    setMantenimiento(prev => ({

                        ...prev,

                        activo:
                            equipoData.activo,

                        serie:
                            equipoData.serie || "",

                        marca:
                            equipoData.marca
                                ? Number(equipoData.marca)
                                : 0,

                        modelo:
                            equipoData.modelo
                                ? Number(equipoData.modelo)
                                : 0,

                        tipo:
                            equipoData.tipo,

                        ciudad:
                            equipoData.ciudad || "",

                        sede:
                            equipoData.sede
                                ? Number(equipoData.sede)
                                : 0,

                        area:
                            equipoData.area || "",

                        año:
                            añoActual,

                        ciclo:
                            cicloCalc,

                        tecnico:
                            0,

                        novedades:
                            0,

                        observaciones:
                            ""

                    }));



                    if (
                        cicloCalc !== 0 &&
                        mantenimientoYaExiste(
                            equipoData.activo,
                            añoActual,
                            cicloCalc
                        )
                    ) {

                        setMensaje(
                            `Este equipo ya tiene un mantenimiento registrado en el ciclo ${cicloCalc} del año ${añoActual}.`
                        );

                        setTimeout(
                            () => setMensaje(""),
                            5000
                        );
                    }

                } else {

                    setMantenimiento({

                        ...initialState,

                        activo,

                        año:
                            new Date().getFullYear()

                    });

                }

            } catch (error) {

                console.error(
                    "Error en la petición al backend:",
                    error
                );

            }

            return;
        }


        const valorFinal =
            numericFields
                ? (
                    value === ""
                        ? value
                        : Number(value)
                )
                : value;



        if (id === "ciudad") {

            const idCiudad =
                String(valorFinal);


            const cicloCalc =
                obtenerCicloActual(
                    idCiudad
                );


            const añoActual =
                obtenerAño();


            setMantenimiento(prev => ({

                ...prev,

                ciudad:
                    idCiudad,

                año:
                    añoActual,

                ciclo:
                    cicloCalc

            }));



            if (
                mantenimiento.activo &&
                cicloCalc !== 0 &&
                mantenimientoYaExiste(
                    mantenimiento.activo,
                    añoActual,
                    cicloCalc
                )
            ) {

                setMensaje(
                    `Este equipo ya tiene un mantenimiento registrado en el ciclo ${cicloCalc} del año ${añoActual}.`
                );

                setTimeout(
                    () => setMensaje(""),
                    5000
                );
            }


            return;
        }



        setMantenimiento(prev => ({
            ...prev,
            [id]:
                valorFinal
        }));
    };



    const handleSubmit = async (
        e: SubmitEvent<HTMLFormElement>
    ) => {

        e.preventDefault();

        const camposObligatorios:
            (keyof Mantenimiento)[] = [
                "activo",
                "tipo",
                "serie",
                "marca",
                "modelo",
                "ciudad",
                "sede",
                "area",
                "tecnico",
                "novedades"
            ];


        const hayCamposVacios =
            camposObligatorios.some(
                campo => {
                    const valor =
                        mantenimiento[campo];
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




        const cicloCalculado =
            obtenerCicloActual(
                mantenimiento.ciudad
            );


        if (cicloCalculado === 0) {
            setMensaje(
                "La ciudad seleccionada no tiene un ciclo de mantenimiento activo en este momento."
            );
            setTimeout(
                () => setMensaje(""),
                5000
            );
            return;
        }




        const añoActual =
            obtenerAño();

        const yaExiste =
            mantenimientoYaExiste(
                mantenimiento.activo,
                añoActual,
                cicloCalculado
            );

        if (yaExiste) {
            setMensaje(
                `Este equipo ya tiene un mantenimiento registrado en el ciclo ${cicloCalculado} del año ${añoActual}.`
            );
            setTimeout(
                () => setMensaje(""),
                5000
            );

            return;
        }




        const mantenimientoFinal:
            Mantenimiento = {
            ...mantenimiento,
            año:
                añoActual,
            ciclo:
                cicloCalculado,
            fecha:
                new Date().toISOString()
        };


        try {

            setMensaje(
                "Guardando mantenimiento..."
            );

            await guardarMantenimiento(
                mantenimientoFinal
            );

            dispatch({

                type:
                    "save-mantenimiento",

                payload: {
                    equipoMan:
                        mantenimientoFinal
                }
            });


            setMensaje(
                "¡Mantenimiento guardado con éxito!"
            );


            setTimeout(
                () => setMensaje(""),
                3000
            );


            setMantenimiento({
                ...initialState,
                fecha:
                    new Date().toISOString(),
                año:
                    new Date().getFullYear()
            });


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
    };


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
                        Mantenimiento de Equipos
                    </h2>


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
                            value={mantenimiento.activo}
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
                            className="p-3 border border-slate-300 bg-slate-100 rounded-lg"
                            placeholder="Serie del equipo"
                            value={mantenimiento.serie}
                            onChange={handleChange}
                            readOnly
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
                            className="p-3 border border-slate-300 bg-slate-100 rounded-lg"
                            value={mantenimiento.marca}
                            onChange={handleChange}
                            disabled
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
                            className="p-3 border border-slate-300 bg-slate-100 rounded-lg"
                            value={mantenimiento.modelo}
                            onChange={handleChange}
                            disabled
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
                            value={mantenimiento.ciudad}
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
                            value={mantenimiento.sede}
                            onChange={handleChange}
                            disabled={!mantenimiento.ciudad}
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
                            value={mantenimiento.area}
                            onChange={handleChange}
                        />

                    </div>


                    {/* TÉCNICO */}

                    <div className="grid grid-cols-1 gap-3">

                        <label
                            htmlFor="tecnico"
                            className="font-bold"
                        >
                            Técnico:
                        </label>

                        <select
                            id="tecnico"
                            className="p-3 border border-slate-300 rounded-lg"
                            value={mantenimiento.tecnico}
                            onChange={handleChange}
                        >

                            <option value={0}>
                                --- Seleccione Técnico ---
                            </option>

                            {state.tecnicos.map(tec => (

                                <option
                                    value={tec.id}
                                    key={tec.id}
                                >
                                    {tec.nombre} {tec.apellido}
                                </option>

                            ))}

                        </select>

                    </div>


                    {/* NOVEDAD */}

                    <div className="grid grid-cols-1 gap-3">

                        <label
                            htmlFor="novedades"
                            className="font-bold"
                        >
                            Novedad:
                        </label>

                        <select
                            id="novedades"
                            className="p-3 border border-slate-300 rounded-lg"
                            value={mantenimiento.novedades}
                            onChange={handleChange}
                        >

                            <option value={0}>
                                --- Seleccione Novedad ---
                            </option>

                            {state.novedades.map(nove => (

                                <option
                                    value={nove.id}
                                    key={nove.id}
                                >
                                    {nove.nombre}
                                </option>

                            ))}

                        </select>

                    </div>


                    {/* OBSERVACIONES */}

                    <div className="grid grid-cols-1 gap-3">

                        <label
                            htmlFor="observaciones"
                            className="font-bold"
                        >
                            Observaciones:
                        </label>

                        <textarea
                            id="observaciones"
                            className="p-3 border border-slate-300 rounded-lg h-32"
                            placeholder="Detalles del mantenimiento..."
                            value={mantenimiento.observaciones}
                            onChange={handleChange}
                        />

                    </div>


                    {/* GUARDAR */}

                    <input
                        type="submit"
                        value="Guardar Mantenimiento"
                        className="bg-blue-900 hover:bg-blue-800 w-full cursor-pointer p-3 text-white uppercase font-bold rounded-lg transition-colors"
                    />

                </form>

            </div>

        </div>
    );
}

