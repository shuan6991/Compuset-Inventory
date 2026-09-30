
import { useMemo } from "react";

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from "recharts";

import { useEquipos } from "../hooks/useEquipos";
import { obtenerCicloActual } from "../utilis/cicloHelpers";


export default function GraficaFaltantesPorTipo() {

    const { state } = useEquipos();

    const añoActual = new Date().getFullYear();


    /**
     * Mantenimientos correspondientes únicamente
     * al año y ciclo activo de cada ciudad.
     */
    const mantenimientosCicloActual = useMemo(() => {

        return (state.mantenimiento || []).filter(mantenimiento => {

            const cicloActivo =
                obtenerCicloActual(
                    mantenimiento.ciudad
                );

            return (
                Number(mantenimiento.año) === añoActual &&
                cicloActivo !== 0 &&
                Number(mantenimiento.ciclo) === cicloActivo
            );

        });

    }, [state.mantenimiento, añoActual]);


    /**
     * Agrupar mantenimientos realizados por
     * tipo de equipo.
     */
    const realizadosPorTipo = useMemo(() => {

        return mantenimientosCicloActual.reduce(
            (acc, mant) => {

                const tipoId = Number(mant.tipo);

                if (!isNaN(tipoId)) {

                    acc[tipoId] =
                        (acc[tipoId] || 0) + 1;

                }

                return acc;

            },
            {} as Record<number, number>
        );

    }, [mantenimientosCicloActual]);


    /**
     * Inventario únicamente de las ciudades
     * que actualmente tienen un ciclo activo.
     */
    const inventarioCicloActual = useMemo(() => {

        return (state.equipos || []).filter(equipo => {

            const cicloActivo =
                obtenerCicloActual(
                    equipo.ciudad
                );

            return cicloActivo !== 0;

        });

    }, [state.equipos]);


    /**
     * Agrupar inventario por tipo.
     */
    const inventarioRealPorTipo = useMemo(() => {

        return inventarioCicloActual.reduce(
            (acc, equipo) => {

                const tipoId = Number(equipo.tipo);

                if (!isNaN(tipoId)) {

                    acc[tipoId] =
                        (acc[tipoId] || 0) + 1;

                }

                return acc;

            },
            {} as Record<number, number>
        );

    }, [inventarioCicloActual]);


    /**
     * Calcular equipos pendientes por tipo.
     */
    const dataFaltantes = useMemo(() => {

        return (state.tipo || [])
            .map(tipoObj => {

                const tipoId =
                    Number(tipoObj.id);

                const totalBD =
                    inventarioRealPorTipo[tipoId] || 0;

                const realizados =
                    realizadosPorTipo[tipoId] || 0;

                const pendientes =
                    Math.max(
                        0,
                        totalBD - realizados
                    );


                return {

                    name: tipoObj.nombre,

                    value: pendientes,

                    hechos: realizados,

                    totalBD: totalBD

                };

            })
            .filter(
                item => item.value > 0
            );

    }, [
        state.tipo,
        inventarioRealPorTipo,
        realizadosPorTipo
    ]);


    /**
     * Total global de equipos pendientes.
     */
    const totalPendientes =
        dataFaltantes.reduce(
            (sum, item) =>
                sum + item.value,
            0
        );


    const COLORES = [
        "#2563eb",
        "#f97316",
        "#10b981",
        "#a855f7",
        "#ec4899",
        "#eab308",
        "#6366f1",
        "#06b6d4"
    ];


    return (

        <div className="bg-white p-6 rounded-2xl shadow-xl w-full h-96 flex flex-col items-center justify-between">

            <h1 className="uppercase font-bold text-lg text-gray-800 text-center">

                Desglose Faltantes ({totalPendientes})

            </h1>


            <div className="w-full h-72">

                <ResponsiveContainer
                    width="100%"
                    height="100%"
                >

                    <PieChart>

                        <Pie
                            data={dataFaltantes}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={3}
                            cy="42%"
                        >

                            {dataFaltantes.map(
                                (_, index) => (

                                    <Cell
                                        key={`cell-${index}`}
                                        fill={
                                            COLORES[
                                                index %
                                                COLORES.length
                                            ]
                                        }
                                    />

                                )
                            )}

                        </Pie>


                        <Tooltip
                            formatter={(
                                value: any,
                                name: any,
                                props: any
                            ) => [

                                `${value} pendientes (Realizados: ${props.payload.hechos} / Total BD: ${props.payload.totalBD})`,

                                name

                            ]}
                        />


                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            iconType="circle"
                            wrapperStyle={{
                                color: "#334155",
                                fontSize: "12px",
                                fontWeight: "600"
                            }}
                        />


                        <text
                            x="50%"
                            y="39%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="font-bold text-3xl"
                            fill="#1e293b"
                        >
                            {totalPendientes}
                        </text>


                        <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-xs font-semibold"
                            fill="#64748b"
                        >
                            Pendientes
                        </text>

                    </PieChart>

                </ResponsiveContainer>

            </div>

        </div>
    );
}

