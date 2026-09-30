import { useState, useMemo, useRef } from 'react'

import { useEquipos } from '../hooks/useEquipos'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid
} from 'recharts'

import ExcelJS from 'exceljs'
import { toPng } from 'html-to-image'


export default function Reportes() {

  const { state } = useEquipos()

  const [categoriaFiltro, setCategoriaFiltro] =
    useState<string>('todas')

  const graficaRealizadosRef =
    useRef<HTMLDivElement>(null)

  const graficaFaltantesRef =
    useRef<HTMLDivElement>(null)




  const COLORES = [
    '#2563eb',
    '#f97316',
    '#10b981',
    '#a855f7',
    '#ec4899',
    '#eab308',
    '#6366f1',
    '#06b6d4'
  ]


  // =====================================================
  // CÁLCULOS GENERALES
  // =====================================================

  const reportesData = useMemo(() => {

    const mantenimientos = state.mantenimiento || []

    const equiposTotales = state.equipos || []

    const tipos = state.tipo || []


    // =================================================
    // ACTIVOS CON MANTENIMIENTO
    // =================================================

    const activosConMantenimiento = new Set(
      mantenimientos
        .map(m =>
          String(m.activo ?? '').trim()
        )
        .filter(Boolean)
    )


    // =================================================
    // EQUIPOS REALIZADOS
    // =================================================

    const equiposRealizados =
      equiposTotales.filter(eq =>
        activosConMantenimiento.has(
          String(eq.activo ?? '').trim()
        )
      )


    // =================================================
    // EQUIPOS FALTANTES
    // =================================================

    const equiposFaltantes =
      equiposTotales.filter(eq =>
        !activosConMantenimiento.has(
          String(eq.activo ?? '').trim()
        )
      )


    // =================================================
    // AGRUPAR INVENTARIO POR TIPO
    // =================================================

    const inventarioPorTipo: Record<number, number> = {}

    equiposTotales.forEach(eq => {

      const tId = Number(eq.tipo)

      if (!isNaN(tId)) {

        inventarioPorTipo[tId] =
          (inventarioPorTipo[tId] || 0) + 1

      }

    })


    // =================================================
    // AGRUPAR REALIZADOS POR TIPO
    // =================================================

    const realizadosPorTipo: Record<number, number> = {}

    equiposRealizados.forEach(eq => {

      const tId = Number(eq.tipo)

      if (!isNaN(tId)) {

        realizadosPorTipo[tId] =
          (realizadosPorTipo[tId] || 0) + 1

      }

    })


    // =================================================
    // AGRUPAR FALTANTES POR TIPO
    // =================================================

    const faltantesPorTipo: Record<number, number> = {}

    equiposFaltantes.forEach(eq => {

      const tId = Number(eq.tipo)

      if (!isNaN(tId)) {

        faltantesPorTipo[tId] =
          (faltantesPorTipo[tId] || 0) + 1

      }

    })


    // =================================================
    // DESGLOSE POR CATEGORÍA
    // =================================================

    const desgloseCategorias = tipos.map(tObj => {

      const tId = Number(tObj.id)

      const totalBD =
        inventarioPorTipo[tId] || 0

      const realizados =
        realizadosPorTipo[tId] || 0

      const faltantes =
        faltantesPorTipo[tId] || 0

      const avancePorcentaje =
        totalBD > 0
          ? Number(((realizados / totalBD) * 100).toFixed(1))
          : 0;


      return {

        id: tObj.id,

        nombre: tObj.nombre,

        totalBD,

        realizados,

        faltantes,

        avancePorcentaje

      }

    })




    const totalInventario =
      equiposTotales.length ||
      state.cantidadEquipos ||
      0

    const totalRealizados =
      equiposRealizados.length

    const totalFaltantes =
      equiposFaltantes.length

    const porcentajeGlobal =
      totalInventario > 0
        ? Number(((totalRealizados / totalInventario) * 100).toFixed(1))
        : 0;


    return {

      totalInventario,

      totalRealizados,

      totalFaltantes,

      porcentajeGlobal,

      desgloseCategorias,

      equiposRealizados,

      equiposFaltantes

    }

  }, [state])


  // =====================================================
  // CATEGORÍAS FILTRADAS
  // =====================================================

  const categoriasFiltradas = useMemo(() => {

    if (categoriaFiltro === 'todas') {

      return reportesData.desgloseCategorias

    }

    return reportesData.desgloseCategorias.filter(
      c =>
        String(c.id) === categoriaFiltro
    )

  }, [
    reportesData,
    categoriaFiltro
  ])


  // =====================================================
  // EQUIPOS FILTRADOS PARA EXPORTAR
  // =====================================================

  const equiposRealizadosFiltrados =
    useMemo(() => {

      if (categoriaFiltro === 'todas') {

        return reportesData.equiposRealizados

      }

      return reportesData.equiposRealizados.filter(
        eq =>
          String(eq.tipo) ===
          categoriaFiltro
      )

    }, [
      reportesData,
      categoriaFiltro
    ])


  const equiposFaltantesFiltrados =
    useMemo(() => {

      if (categoriaFiltro === 'todas') {

        return reportesData.equiposFaltantes

      }

      return reportesData.equiposFaltantes.filter(
        eq =>
          String(eq.tipo) ===
          categoriaFiltro
      )

    }, [
      reportesData,
      categoriaFiltro
    ])


  // =====================================================
  // EXPORTAR EXCEL
  // =====================================================

  const exportarExcel = async () => {

    try {

      if (
        !graficaRealizadosRef.current ||
        !graficaFaltantesRef.current
      ) {

        alert(
          "No se pudieron encontrar las gráficas."
        )

        return

      }


      if (categoriasFiltradas.length === 0) {

        alert(
          "No hay datos para exportar."
        )

        return

      }


      // =================================================
      // CONVERTIR GRÁFICAS A PNG
      // =================================================

      const imagenRealizados =
        await toPng(
          graficaRealizadosRef.current,
          {
            pixelRatio: 2,
            backgroundColor: '#ffffff'
          }
        )


      const imagenFaltantes =
        await toPng(
          graficaFaltantesRef.current,
          {
            pixelRatio: 2,
            backgroundColor: '#ffffff'
          }
        )


      // =================================================
      // CREAR LIBRO
      // =================================================

      const workbook =
        new ExcelJS.Workbook()


      workbook.creator =
        'Compu Inventory'

      workbook.created =
        new Date()

      workbook.modified =
        new Date()


      // =================================================
      // HOJA RESUMEN
      // =================================================

      const resumen =
        workbook.addWorksheet('Resumen')


      resumen.columns = [

        {
          header: 'Indicador',
          key: 'indicador',
          width: 30
        },

        {
          header: 'Valor',
          key: 'valor',
          width: 25
        }

      ]


      resumen.addRow({

        indicador: 'Total Equipos',

        valor:
          categoriaFiltro === 'todas'
            ? reportesData.totalInventario
            : categoriasFiltradas[0]?.totalBD || 0

      })


      resumen.addRow({

        indicador: 'Total Con Mantenimiento',

        valor:
          categoriaFiltro === 'todas'
            ? reportesData.totalRealizados
            : categoriasFiltradas[0]?.realizados || 0

      })


      resumen.addRow({

        indicador: 'Total Faltantes',

        valor:
          categoriaFiltro === 'todas'
            ? reportesData.totalFaltantes
            : categoriasFiltradas[0]?.faltantes || 0

      })


      resumen.addRow({

        indicador: 'Progreso Global',

        valor:
          categoriaFiltro === 'todas'
            ? `${reportesData.porcentajeGlobal}%`
            : `${categoriasFiltradas[0]?.avancePorcentaje || 0}%`

      })


      resumen.addRow({

        indicador: 'Categoría',

        valor:
          categoriaFiltro === 'todas'
            ? 'Todas las categorías'
            : categoriasFiltradas[0]?.nombre || ''

      })


      // =================================================
      // ESTILO RESUMEN
      // =================================================

      resumen.getRow(1).font = {

        bold: true,

        color: {
          argb: 'FFFFFF'
        }

      }


      resumen.getRow(1).fill = {

        type: 'pattern',

        pattern: 'solid',

        fgColor: {
          argb: '1E40AF'
        }

      }


      resumen.getRow(1).alignment = {

        vertical: 'middle',

        horizontal: 'center'

      }


      // =================================================
      // HOJA TABLA
      // =================================================

      const tabla =
        workbook.addWorksheet('Tabla')


      tabla.columns = [

        {
          header: 'Categoría / Tipo',
          key: 'categoria',
          width: 30
        },

        {
          header: 'Inventario Total BD',
          key: 'inventario',
          width: 22
        },

        {
          header: 'Realizados',
          key: 'realizados',
          width: 15
        },

        {
          header: 'Faltantes',
          key: 'faltantes',
          width: 15
        },

        {
          header: '% Cumplimiento',
          key: 'cumplimiento',
          width: 20
        }

      ]


      categoriasFiltradas.forEach(cat => {

        tabla.addRow({

          categoria: cat.nombre,

          inventario: cat.totalBD,

          realizados: cat.realizados,

          faltantes: cat.faltantes,

          cumplimiento:
            `${cat.avancePorcentaje}%`

        })

      })


      // =================================================
      // ESTILO TABLA
      // =================================================

      const encabezadoTabla =
        tabla.getRow(1)


      encabezadoTabla.font = {

        bold: true,

        color: {
          argb: 'FFFFFF'
        }

      }


      encabezadoTabla.fill = {

        type: 'pattern',

        pattern: 'solid',

        fgColor: {
          argb: '1E40AF'
        }

      }


      encabezadoTabla.alignment = {

        vertical: 'middle',

        horizontal: 'center'

      }


      // =================================================
      // HOJA REALIZADOS
      // =================================================

      const realizadosSheet =
        workbook.addWorksheet('Realizados')


      realizadosSheet.columns = [

        {
          header: 'Activo',
          key: 'activo',
          width: 18
        },

        {
          header: 'Serie',
          key: 'serie',
          width: 22
        },

        {
          header: 'Marca',
          key: 'marca',
          width: 20
        },

        {
          header: 'Modelo',
          key: 'modelo',
          width: 25
        },

        {
          header: 'Tipo',
          key: 'tipo',
          width: 20
        },

        {
          header: 'Windows',
          key: 'windows',
          width: 18
        },

        {
          header: 'Office',
          key: 'office',
          width: 18
        },

        {
          header: 'Ciudad',
          key: 'ciudad',
          width: 20
        },

        {
          header: 'Sede',
          key: 'sede',
          width: 20
        },

        {
          header: 'Área',
          key: 'area',
          width: 25
        },

        {
          header: 'Localización',
          key: 'localizacion',
          width: 25
        }

      ]


      equiposRealizadosFiltrados.forEach(eq => {

        const tipo =
          state.tipo?.find(
            t =>
              String(t.id) ===
              String(eq.tipo)
          )


        realizadosSheet.addRow({

          activo: eq.activo,

          serie: eq.serie,

          marca: eq.marca,

          modelo: eq.modelo,

          tipo:
            tipo?.nombre ||
            eq.tipo,

          ciudad: eq.ciudad,

          sede: eq.sede,

          area: eq.area,



        })

      })


      // =================================================
      // ESTILO REALIZADOS
      // =================================================

      const encabezadoRealizados =
        realizadosSheet.getRow(1)


      encabezadoRealizados.font = {

        bold: true,

        color: {
          argb: 'FFFFFF'
        }

      }


      encabezadoRealizados.fill = {

        type: 'pattern',

        pattern: 'solid',

        fgColor: {
          argb: '16A34A'
        }

      }


      encabezadoRealizados.alignment = {

        vertical: 'middle',

        horizontal: 'center'

      }


      realizadosSheet.autoFilter = {

        from: 'A1',

        to: 'K1'

      }


      // =================================================
      // HOJA FALTANTES
      // =================================================

      const faltantesSheet =
        workbook.addWorksheet('Faltantes')


      faltantesSheet.columns = [

        {
          header: 'Activo',
          key: 'activo',
          width: 18
        },

        {
          header: 'Serie',
          key: 'serie',
          width: 22
        },

        {
          header: 'Marca',
          key: 'marca',
          width: 20
        },

        {
          header: 'Modelo',
          key: 'modelo',
          width: 25
        },

        {
          header: 'Tipo',
          key: 'tipo',
          width: 20
        },

        {
          header: 'Windows',
          key: 'windows',
          width: 18
        },

        {
          header: 'Office',
          key: 'office',
          width: 18
        },

        {
          header: 'Ciudad',
          key: 'ciudad',
          width: 20
        },

        {
          header: 'Sede',
          key: 'sede',
          width: 20
        },

        {
          header: 'Área',
          key: 'area',
          width: 25
        },

        {
          header: 'Localización',
          key: 'localizacion',
          width: 25
        }

      ]


      equiposFaltantesFiltrados.forEach(eq => {

        const tipo =
          state.tipo?.find(
            t =>
              String(t.id) ===
              String(eq.tipo)
          )


        faltantesSheet.addRow({

          activo: eq.activo,

          serie: eq.serie,

          marca: eq.marca,

          modelo: eq.modelo,

          tipo:
            tipo?.nombre ||
            eq.tipo,

          ciudad: eq.ciudad,

          sede: eq.sede,

          area: eq.area,



        })

      })


      // =================================================
      // ESTILO FALTANTES
      // =================================================

      const encabezadoFaltantes =
        faltantesSheet.getRow(1)


      encabezadoFaltantes.font = {

        bold: true,

        color: {
          argb: 'FFFFFF'
        }

      }


      encabezadoFaltantes.fill = {

        type: 'pattern',

        pattern: 'solid',

        fgColor: {
          argb: 'EA580C'
        }

      }


      encabezadoFaltantes.alignment = {

        vertical: 'middle',

        horizontal: 'center'

      }


      faltantesSheet.autoFilter = {

        from: 'A1',

        to: 'K1'

      }


      // =================================================
      // HOJA GRÁFICAS
      // =================================================

      const graficas =
        workbook.addWorksheet('Gráficas')


      graficas.getCell('A1').value =
        'Reporte de Mantenimientos - Compu Inventory'


      graficas.getCell('A1').font = {

        bold: true,

        size: 18,

        color: {
          argb: '1E40AF'
        }

      }


      graficas.getCell('A3').value =
        'Equipos con mantenimiento por categoría'


      graficas.getCell('A3').font = {

        bold: true,

        size: 14

      }


      // =================================================
      // GRÁFICA REALIZADOS
      // =================================================

      const imagenRealizadosId =
        workbook.addImage({

          base64:
            imagenRealizados,

          extension: 'png'

        })


      graficas.addImage(

        imagenRealizadosId,

        {

          tl: {

            col: 0,

            row: 4

          },

          ext: {

            width: 700,

            height: 400

          }

        }

      )


      // =================================================
      // GRÁFICA FALTANTES
      // =================================================

      graficas.getCell('A26').value =
        'Equipos faltantes por categoría'


      graficas.getCell('A26').font = {

        bold: true,

        size: 14

      }


      const imagenFaltantesId =
        workbook.addImage({

          base64:
            imagenFaltantes,

          extension: 'png'

        })


      graficas.addImage(

        imagenFaltantesId,

        {

          tl: {

            col: 0,

            row: 27

          },

          ext: {

            width: 700,

            height: 400

          }

        }

      )


      // =================================================
      // GENERAR ARCHIVO
      // =================================================

      const buffer =
        await workbook.xlsx.writeBuffer()


      // =================================================
      // DESCARGAR
      // =================================================

      const blob =
        new Blob(

          [buffer],

          {

            type:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

          }

        )


      const url =
        window.URL.createObjectURL(blob)


      const enlace =
        document.createElement('a')


      enlace.href = url


      const nombreCategoria =
        categoriaFiltro === 'todas'
          ? 'Todas'
          : categoriasFiltradas[0]?.nombre ||
          'Categoria'


      enlace.download =
        `Reporte_CompuInventory_${nombreCategoria}.xlsx`


      document.body.appendChild(enlace)

      enlace.click()

      document.body.removeChild(enlace)

      window.URL.revokeObjectURL(url)


    } catch (error) {

      console.error(
        'Error exportando Excel:',
        error
      )

      alert(
        'Ocurrió un error al generar el Excel.'
      )

    }

  }


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="w-full bg-slate-100 p-6 space-y-6">

      {/* =================================================
                ENCABEZADO
            ================================================= */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">

        <div>

          <h2 className="text-2xl font-bold text-slate-800">

            Reportes Compu Inventory

          </h2>

          <p className="text-sm text-slate-500 font-medium">

            Resumen en tiempo real del estado de mantenimientos

          </p>

        </div>


        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

          {/* FILTRO */}

          <div className="flex items-center gap-2">

            <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">

              Filtrar Categoría:

            </label>


            <select

              value={categoriaFiltro}

              onChange={(e) =>
                setCategoriaFiltro(
                  e.target.value
                )
              }

              className="bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"

            >

              <option value="todas">

                Todas las categorías

              </option>


              {(state.tipo || []).map(t => (

                <option
                  key={t.id}
                  value={t.id}
                >

                  {t.nombre}

                </option>

              ))}

            </select>

          </div>


          {/* EXPORTAR */}

          <button

            type="button"

            onClick={exportarExcel}

            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2.5 rounded-lg transition-colors cursor-pointer"

          >

            Exportar Excel

          </button>

        </div>

      </div>


      {/* =================================================
                TARJETAS KPI
            ================================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">


        {/* TOTAL INVENTARIO */}

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">

          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">

            Total Equipos (Inventario)

          </span>


          <div className="mt-2 flex items-baseline justify-between">

            <span className="text-3xl font-extrabold text-slate-800">

              {reportesData.totalInventario}

            </span>


            <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600">

              100% Base

            </span>

          </div>

        </div>


        {/* REALIZADOS */}

        <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-l-blue-600 border border-slate-200 flex flex-col justify-between">

          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">

            Total Con Mantenimiento

          </span>


          <div className="mt-2 flex items-baseline justify-between">

            <span className="text-3xl font-extrabold text-blue-600">

              {reportesData.totalRealizados}

            </span>


            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">

              {reportesData.porcentajeGlobal}% completado

            </span>

          </div>

        </div>


        {/* FALTANTES */}

        <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-l-orange-500 border border-slate-200 flex flex-col justify-between">

          <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">

            Total Faltantes

          </span>


          <div className="mt-2 flex items-baseline justify-between">

            <span className="text-3xl font-extrabold text-orange-500">

              {reportesData.totalFaltantes}

            </span>


            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700">

              {100 - reportesData.porcentajeGlobal}% pendiente

            </span>

          </div>

        </div>


        {/* PROGRESO */}

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">

          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">

            Progreso Global

          </span>


          <div className="mt-2">

            <div className="flex justify-between items-center mb-1">

              <span className="text-2xl font-extrabold text-slate-800">

                {reportesData.porcentajeGlobal}%

              </span>

            </div>


            <div className="w-full bg-slate-200 rounded-full h-2.5">

              <div

                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"

                style={{
                  width:
                    `${reportesData.porcentajeGlobal}%`
                }}

              />

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
                GRÁFICAS
            ================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


        {/* REALIZADOS */}

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">

          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center justify-between">

            <span>
              Equipos Con Mantenimiento por Categoría
            </span>

          </h3>


          <div
            ref={graficaRealizadosRef}
            className="w-full h-72"
          >

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={categoriasFiltradas}
                margin={{
                  top: 10,
                  right: 10,
                  left: -20,
                  bottom: 25
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />


                <XAxis

                  dataKey="nombre"

                  tick={{
                    fontSize: 11,
                    fill: '#64748b'
                  }}

                  interval={0}

                  angle={-15}

                  textAnchor="end"

                />


                <YAxis

                  tick={{
                    fontSize: 11,
                    fill: '#64748b'
                  }}

                />


                <Tooltip

                  formatter={(val: any) => [
                    `${val} Equipos`,
                    'Realizados'
                  ]}

                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}

                />


                <Bar
                  dataKey="realizados"
                  radius={[6, 6, 0, 0]}
                >

                  {categoriasFiltradas.map(
                    (_, idx) => (

                      <Cell
                        key={
                          `c-realizados-${idx}`
                        }
                        fill={
                          COLORES[
                          idx %
                          COLORES.length
                          ]
                        }
                      />

                    )
                  )}

                </Bar>

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>


        {/* FALTANTES */}

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">

          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center justify-between">

            <span>
              Equipos Faltantes por Categoría
            </span>

          </h3>


          <div
            ref={graficaFaltantesRef}
            className="w-full h-72"
          >

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={categoriasFiltradas}
                margin={{
                  top: 10,
                  right: 10,
                  left: -20,
                  bottom: 25
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />


                <XAxis

                  dataKey="nombre"

                  tick={{
                    fontSize: 11,
                    fill: '#64748b'
                  }}

                  interval={0}

                  angle={-15}

                  textAnchor="end"

                />


                <YAxis

                  tick={{
                    fontSize: 11,
                    fill: '#64748b'
                  }}

                />


                <Tooltip

                  formatter={(val: any) => [
                    `${val} Equipos`,
                    'Faltantes'
                  ]}

                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}

                />


                <Bar
                  dataKey="faltantes"
                  fill="#f97316"
                  radius={[6, 6, 0, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>


      {/* =================================================
                TABLA DETALLADA
            ================================================= */}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

        <div className="p-5 border-b border-slate-100 flex items-center justify-between">

          <h3 className="text-base font-bold text-slate-800">

            Tabla Detallada por Categoría

          </h3>


          <span className="text-xs text-slate-500 font-semibold">

            {categoriasFiltradas.length}
            {' '}
            Categorías encontradas

          </span>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full text-left border-collapse">

            <thead>

              <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">

                <th className="p-4">
                  Categoría / Tipo
                </th>

                <th className="p-4 text-center">
                  Inventario Total BD
                </th>

                <th className="p-4 text-center">
                  Realizados
                </th>

                <th className="p-4 text-center">
                  Faltantes
                </th>

                <th className="p-4 text-center">
                  % Cumplimiento
                </th>

              </tr>

            </thead>


            <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">

              {categoriasFiltradas.map(
                (cat, idx) => (

                  <tr
                    key={
                      cat.id ||
                      idx
                    }
                    className="hover:bg-slate-50/80 transition-colors"
                  >

                    <td className="p-4 font-semibold text-slate-800 flex items-center gap-2">

                      <span

                        className="w-3 h-3 rounded-full inline-block"

                        style={{
                          backgroundColor:
                            COLORES[
                            idx %
                            COLORES.length
                            ]
                        }}

                      />

                      {cat.nombre}

                    </td>


                    <td className="p-4 text-center font-bold text-slate-800">

                      {cat.totalBD}

                    </td>


                    <td className="p-4 text-center">

                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-bold text-xs">

                        {cat.realizados}

                      </span>

                    </td>


                    <td className="p-4 text-center">

                      <span className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 font-bold text-xs">

                        {cat.faltantes}

                      </span>

                    </td>


                    <td className="p-4 text-center">

                      <div className="flex items-center justify-center gap-2">

                        <span className="text-xs font-bold w-9 text-right">

                          {cat.avancePorcentaje}%

                        </span>


                        <div className="w-16 bg-slate-200 rounded-full h-1.5">

                          <div

                            className="bg-emerald-500 h-1.5 rounded-full"

                            style={{
                              width:
                                `${cat.avancePorcentaje}%`
                            }}

                          />

                        </div>

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  )

}