
import { useMemo } from "react";

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer
} from "recharts";

import { useEquipos } from "../hooks/useEquipos";

import { obtenerCicloActual } from "../utilis/cicloHelpers";

export default function GraficaMantenimiento() {

    const { state } = useEquipos();

    const añoActual = new Date().getFullYear();

  
    const mantenimientosCicloActual = useMemo(() => {

        return (state.mantenimiento || []).filter(mantenimiento => {

            const cicloActivo = obtenerCicloActual(
                mantenimiento.ciudad
            );

            return (
                Number(mantenimiento.año) === añoActual &&
                cicloActivo !== 0 &&
                Number(mantenimiento.ciclo) === cicloActivo
            );
        });

    }, [state.mantenimiento, añoActual]);


    
    const equiposCicloActual = useMemo(() => {

        return (state.equipos || []).filter(equipo => {

            const cicloActivo = obtenerCicloActual(
                equipo.ciudad
            );

            return cicloActivo !== 0;
        });

    }, [state.equipos]);


   
    const totalRealizados =
        mantenimientosCicloActual.length;


    const totalEquipos =
        equiposCicloActual.length;


    
    const porcentaje =
        totalEquipos > 0
            ? Math.min(
                100,
                Number(
                    ((totalRealizados / totalEquipos) * 100).toFixed(1)
                )
            )
            : 0;


    const data = [
        {
            name: "Mantenimientos",
            value: porcentaje
        },
        {
            name: "Pendientes",
            value: 100 - porcentaje
        }
    ];


    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl w-full h-auto flex flex-col items-center justify-between">

            <h1 className="uppercase font-bold text-lg text-gray-800 text-center">
                Mantenimientos Realizados
            </h1>


            <div className="w-full h-64">

                <ResponsiveContainer
                    width="100%"
                    height="100%"
                >

                    <PieChart>

                        <Pie
                            data={data}
                            dataKey="value"
                            innerRadius={70}
                            outerRadius={100}
                            cy="50%"
                        >

                            <Cell fill="#2563eb" />

                            <Cell fill="#e5e7eb" />

                        </Pie>


                        <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="font-bold text-3xl"
                            fill="#1e293b"
                        >
                            {porcentaje}%
                        </text>

                    </PieChart>

                </ResponsiveContainer>

            </div>


            <div className="mt-2 pt-3 border-t border-slate-100 w-full text-center">

                <p className="text-sm font-semibold text-slate-600">

                    Total de equipos con mantenimiento:

                    <span className="font-bold text-blue-600 text-base">

                        {" "}

                        {totalRealizados}

                    </span>

                </p>

            </div>

        </div>
    );
}
