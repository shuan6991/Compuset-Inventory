import { Fragment, useEffect, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useEquipos } from '../hooks/useEquipos'
import { actualizarMantenimiento } from '../services/mantenimientoService'
import type { ChangeEvent } from 'react'
import type { Mantenimiento } from '../types'



export default function ExpenseModal() {

    const { state, dispatch } = useEquipos()

    const [formulario, setFormulario] =
        useState<Mantenimiento | null>(null)

    const [guardando, setGuardando] =
        useState(false)




    useEffect(() => {

        if (state.mantenimientoSeleccionado) {

            setFormulario({
                ...state.mantenimientoSeleccionado
            })
        }

    }, [state.mantenimientoSeleccionado])




    const modelos = useMemo(() => {

        if (!formulario) return []

        const marca = state.marca.find(
            mar => mar.id === Number(formulario.marca)
        )

        return marca?.modelo || []

    }, [
        formulario?.marca,
        state.marca
    ])



    const sedes = useMemo(() => {

        if (!formulario) return []

        const ciudad = state.ciudad.find(
            ciu => ciu.id === formulario.ciudad
        )

        return ciudad?.centro || []

    }, [
        formulario?.ciudad,
        state.ciudad
    ])




    const handleChange = (
        e: ChangeEvent<
            HTMLInputElement |
            HTMLSelectElement |
            HTMLTextAreaElement
        >
    ) => {

        const { id, value } = e.target

        const camposNumericos = [
            'activo',
            'tipo',
            'marca',
            'modelo',
            'sede',
            'tecnico',
            'novedades'
        ]

        const nuevoValor =
            camposNumericos.includes(id)
                ? Number(value)
                : value


        setFormulario(prev => {

            if (!prev) return prev

            return {
                ...prev,
                [id]: nuevoValor
            }
        })
    }



    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {

        e.preventDefault()

        if (!formulario) return


        try {

            setGuardando(true)

            console.log(
                "Actualizando mantenimiento:",
                formulario
            )


            const respuesta =
                await actualizarMantenimiento(formulario)


            if (!respuesta?.success) {

                throw new Error(
                    respuesta?.message ||
                    "No se pudo actualizar el mantenimiento"
                )
            }


            dispatch({
                type: 'update-mantenimiento',
                payload: {
                    equipoMan: formulario
                }
            })


        } catch (error) {

            console.error(
                "Error actualizando mantenimiento:",
                error
            )

            alert(
                "No fue posible actualizar el mantenimiento."
            )

        } finally {

            setGuardando(false)

        }
    }




    return (

        <Transition
            appear
            show={state.modal}
            as={Fragment}
        >

            <Dialog
                as="div"
                className="relative z-50"
                onClose={() =>
                    dispatch({
                        type: 'cerrar-modal'
                    })
                }
            >

                {/* FONDO */}

                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >

                    <div className="fixed inset-0 bg-black/75" />

                </Transition.Child>


                {/* CONTENEDOR */}

                <div className="fixed inset-0 overflow-y-auto">

                    <div className="flex min-h-full items-center justify-center p-4">

                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >

                            <Dialog.Panel
                                className="
                                    w-full
                                    max-w-4xl
                                    transform
                                    overflow-hidden
                                    rounded-2xl
                                    bg-white
                                    p-6
                                    text-left
                                    shadow-xl
                                    transition-all
                                "
                            >

                                {/* TITULO */}

                                <Dialog.Title
                                    className="
                                        text-2xl
                                        font-bold
                                        text-center
                                        text-blue-700
                                        mb-6
                                    "
                                >
                                    Editar mantenimiento
                                </Dialog.Title>


                                {!formulario ? (

                                    <div className="text-center py-10">
                                        Cargando...
                                    </div>

                                ) : (

                                    <form
                                        onSubmit={handleSubmit}
                                        className="space-y-5"
                                    >

                                        {/* INFORMACIÓN DEL EQUIPO */}

                                        <div>

                                            <h3 className="
                                                text-lg
                                                font-bold
                                                text-slate-700
                                                border-b
                                                pb-2
                                                mb-4
                                            ">
                                                Información del equipo
                                            </h3>


                                            <div className="
                                                grid
                                                grid-cols-1
                                                md:grid-cols-2
                                                gap-4
                                            ">

                                                {/* ACTIVO */}

                                                <div>

                                                    <label
                                                        htmlFor="activo"
                                                        className="block font-bold mb-1"
                                                    >
                                                        Activo
                                                    </label>

                                                    <input
                                                        id="activo"
                                                        type="number"
                                                        value={formulario.activo}
                                                        onChange={handleChange}
                                                        className="
                                                            w-full
                                                            p-3
                                                            border
                                                            border-slate-300
                                                            rounded-lg
                                                            bg-slate-100
                                                        "
                                                        readOnly
                                                    />

                                                </div>


                                                {/* SERIE */}

                                                <div>

                                                    <label
                                                        htmlFor="serie"
                                                        className="block font-bold mb-1"
                                                    >
                                                        Serie
                                                    </label>

                                                    <input
                                                        id="serie"
                                                        type="text"
                                                        value={formulario.serie}
                                                        onChange={handleChange}
                                                        className="
                                                            w-full
                                                            p-3
                                                            border
                                                            border-slate-300
                                                            rounded-lg
                                                          bg-slate-100
                                                        "
                                                        readOnly
                                                    />

                                                </div>


                                                {/* MARCA */}

                                                <div>

                                                    <label
                                                        htmlFor="marca"
                                                        className="block font-bold mb-1"
                                                    >
                                                        Marca
                                                    </label>

                                                    <select
                                                        id="marca"
                                                        value={formulario.marca}
                                                        onChange={handleChange}
                                                        className="
                                                            w-full
                                                            p-3
                                                            border
                                                            border-slate-300
                                                            rounded-lg
                                                           bg-slate-100
                                                        "
                                                        disabled
                                                    >

                                                        <option value={0}>
                                                            --- Seleccione Marca ---
                                                        </option>

                                                        {state.marca.map(marca => (

                                                            <option
                                                                key={marca.id}
                                                                value={marca.id}
                                                            >
                                                                {marca.nombre}
                                                            </option>

                                                        ))}

                                                    </select>

                                                </div>


                                                {/* MODELO */}

                                                <div>

                                                    <label
                                                        htmlFor="modelo"
                                                        className="block font-bold mb-1"
                                                    >
                                                        Modelo
                                                    </label>

                                                    <select
                                                        id="modelo"
                                                        value={formulario.modelo}
                                                        onChange={handleChange}
                                                        disabled
                                                        className="
                                                            w-full
                                                            p-3
                                                            border
                                                            border-slate-300
                                                            rounded-lg
                                                            disabled:bg-slate-100
                                                        "                                                        
                                                    >

                                                        <option value={0}>
                                                            --- Seleccione Modelo ---
                                                        </option>

                                                        {modelos.map(modelo => (

                                                            <option
                                                                key={modelo.id}
                                                                value={modelo.id}
                                                            >
                                                                {modelo.nombre}
                                                            </option>

                                                        ))}

                                                    </select>

                                                </div>


                                                {/* CIUDAD */}

                                                <div>

                                                    <label
                                                        htmlFor="ciudad"
                                                        className="block font-bold mb-1"
                                                    >
                                                        Ciudad
                                                    </label>

                                                    <select
                                                        id="ciudad"
                                                        value={formulario.ciudad}
                                                        onChange={handleChange}
                                                        className="
                                                            w-full
                                                            p-3
                                                            border
                                                            border-slate-300
                                                            rounded-lg
                                                        "
                                                    >

                                                        <option value="">
                                                            --- Seleccione Ciudad ---
                                                        </option>

                                                        {state.ciudad.map(ciudad => (

                                                            <option
                                                                key={ciudad.id}
                                                                value={ciudad.id}
                                                            >
                                                                {ciudad.nombre}
                                                            </option>

                                                        ))}

                                                    </select>

                                                </div>


                                                {/* SEDE */}

                                                <div>

                                                    <label
                                                        htmlFor="sede"
                                                        className="block font-bold mb-1"
                                                    >
                                                        Sede
                                                    </label>

                                                    <select
                                                        id="sede"
                                                        value={formulario.sede}
                                                        onChange={handleChange}
                                                        disabled={!formulario.ciudad}
                                                        className="
                                                            w-full
                                                            p-3
                                                            border
                                                            border-slate-300
                                                            rounded-lg
                                                            disabled:bg-slate-100
                                                        "
                                                    >

                                                        <option value={0}>
                                                            --- Seleccione Sede ---
                                                        </option>

                                                        {sedes.map(sede => (

                                                            <option
                                                                key={sede.id}
                                                                value={sede.id}
                                                            >
                                                                {sede.nombre}
                                                            </option>

                                                        ))}

                                                    </select>

                                                </div>


                                                {/* ÁREA */}

                                                <div>

                                                    <label
                                                        htmlFor="area"
                                                        className="block font-bold mb-1"
                                                    >
                                                        Área
                                                    </label>

                                                    <input
                                                        id="area"
                                                        type="text"
                                                        value={formulario.area}
                                                        onChange={handleChange}
                                                        className="
                                                            w-full
                                                            p-3
                                                            border
                                                            border-slate-300
                                                            rounded-lg
                                                        "
                                                    />

                                                </div>                                                                                                                                                                         

                                            </div>

                                        </div>


                                        {/* INFORMACIÓN DEL MANTENIMIENTO */}

                                        <div>

                                            <h3 className="
                                                text-lg
                                                font-bold
                                                text-slate-700
                                                border-b
                                                pb-2
                                                mb-4
                                            ">
                                                Información del mantenimiento
                                            </h3>


                                            <div className="
                                                grid
                                                grid-cols-1
                                                md:grid-cols-2
                                                gap-4
                                            ">

                                                {/* TIPO */}

                                                <div>

                                                    <label
                                                        htmlFor="tipo"
                                                        className="block font-bold mb-1"
                                                    >
                                                        Tipo
                                                    </label>

                                                    <select
                                                        id="tipo"
                                                        value={formulario.tipo}
                                                        onChange={handleChange}
                                                        className="
                                                            w-full
                                                            p-3
                                                            border
                                                            border-slate-300
                                                            rounded-lg
                                                        "
                                                    >

                                                        <option value={0}>
                                                            --- Seleccione Tipo ---
                                                        </option>

                                                        {state.tipo.map(tipo => (

                                                            <option
                                                                key={tipo.id}
                                                                value={tipo.id}
                                                            >
                                                                {tipo.nombre}
                                                            </option>

                                                        ))}

                                                    </select>

                                                </div>


                                                {/* TÉCNICO */}

                                                <div>

                                                    <label
                                                        htmlFor="tecnico"
                                                        className="block font-bold mb-1"
                                                    >
                                                        Técnico
                                                    </label>

                                                    <select
                                                        id="tecnico"
                                                        value={formulario.tecnico}
                                                        onChange={handleChange}
                                                        className="
                                                            w-full
                                                            p-3
                                                            border
                                                            border-slate-300
                                                            rounded-lg
                                                        "
                                                    >

                                                        <option value={0}>
                                                            --- Seleccione Técnico ---
                                                        </option>

                                                        {state.tecnicos.map(tecnico => (

                                                            <option
                                                                key={tecnico.id}
                                                                value={tecnico.id}
                                                            >
                                                                {tecnico.nombre} {tecnico.apellido}
                                                            </option>

                                                        ))}

                                                    </select>

                                                </div>


                                                {/* NOVEDAD */}

                                                <div>

                                                    <label
                                                        htmlFor="novedades"
                                                        className="block font-bold mb-1"
                                                    >
                                                        Novedad
                                                    </label>

                                                    <select
                                                        id="novedades"
                                                        value={formulario.novedades}
                                                        onChange={handleChange}
                                                        className="
                                                            w-full
                                                            p-3
                                                            border
                                                            border-slate-300
                                                            rounded-lg
                                                        "
                                                    >

                                                        <option value={0}>
                                                            --- Seleccione Novedad ---
                                                        </option>

                                                        {state.novedades.map(novedad => (

                                                            <option
                                                                key={novedad.id}
                                                                value={novedad.id}
                                                            >
                                                                {novedad.nombre}
                                                            </option>

                                                        ))}

                                                    </select>

                                                </div>

                                            </div>

                                        </div>


                                        {/* OBSERVACIONES */}

                                        <div>

                                            <label
                                                htmlFor="observaciones"
                                                className="block font-bold mb-1"
                                            >
                                                Observaciones
                                            </label>

                                            <textarea
                                                id="observaciones"
                                                rows={4}
                                                value={formulario.observaciones}
                                                onChange={handleChange}
                                                className="
                                                    w-full
                                                    p-3
                                                    border
                                                    border-slate-300
                                                    rounded-lg
                                                    resize-none
                                                "
                                                placeholder="Ingrese las observaciones..."
                                            />

                                        </div>


                                        {/* BOTONES */}

                                        <div className="
                                            flex
                                            flex-col-reverse
                                            sm:flex-row
                                            justify-end
                                            gap-3
                                            pt-4
                                            border-t
                                        ">

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    dispatch({
                                                        type: 'cerrar-modal'
                                                    })
                                                }
                                                className="
                                                    px-5
                                                    py-3
                                                    rounded-lg
                                                    border
                                                    border-slate-300
                                                    text-slate-700
                                                    font-bold
                                                    hover:bg-slate-100
                                                "
                                                disabled={guardando}
                                            >
                                                Cancelar
                                            </button>


                                            <button
                                                type="submit"
                                                disabled={guardando}
                                                className="
                                                    px-5
                                                    py-3
                                                    rounded-lg
                                                    bg-blue-700
                                                    text-white
                                                    font-bold
                                                    hover:bg-blue-800
                                                    disabled:bg-slate-400
                                                "
                                            >
                                                {guardando
                                                    ? 'Guardando...'
                                                    : 'Guardar cambios'
                                                }
                                            </button>

                                        </div>

                                    </form>

                                )}

                            </Dialog.Panel>

                        </Transition.Child>

                    </div>

                </div>

            </Dialog>

        </Transition>
    )
}