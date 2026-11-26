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

  const [ciudadFiltro, setCiudadFiltro] =
    useState<string>('todas')

  const [sedeFiltro, setSedeFiltro] = useState<string>('todas')

  const sedesDisponibles = useMemo(() => {
    if (ciudadFiltro === 'todas') return []
    const ciudadSeleccionada = (state.ciudad || []).find(c => String(c.id) === ciudadFiltro)
    return ciudadSeleccionada?.centro || []
  }, [state.ciudad, ciudadFiltro])

  const [modoConsulta, setModoConsulta] = useState<'ciclo' | 'historico'>('ciclo')
  const [fechaDesde, setFechaDesde] = useState<string>('')
  const [fechaHasta, setFechaHasta] = useState<string>('')

  // Compara las fechas usando la fecha local de Colombia, incluso si el
  // servicio entrega timestamps ISO terminados en Z (UTC).
  const obtenerFechaColombia = (fecha: unknown) => {
    if (!fecha) return ''
    const valor = new Date(String(fecha))
    if (!Number.isFinite(valor.getTime())) return ''
    const partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(valor)
    const parte = (tipo: string) => partes.find(p => p.type === tipo)?.value || ''
    return `${parte('year')}-${parte('month')}-${parte('day')}`
  }

  const fechaDentroDelFiltro = (fecha: unknown) => {
    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) return false
    const dia = obtenerFechaColombia(fecha)
    if (!dia) return false
    return (!fechaDesde || dia >= fechaDesde) && (!fechaHasta || dia <= fechaHasta)
  }

  // Los ciclos se calculan por calendario y ciudad. Buenaventura tiene
  // tres ciclos; las demás ciudades manejan dos.
  const obtenerPeriodoCiclo = (fecha: unknown, ciudadId: unknown) => {
    const dia = obtenerFechaColombia(fecha)
    if (!dia) return null

    const [anio, mes] = dia.split('-').map(Number)
    const ciudad = (state.ciudad || []).find(c =>
      String(c.id) === String(ciudadId) ||
      String(c.nombre).toLowerCase() === String(ciudadId).toLowerCase()
    )
    const esBuenaventura = String(ciudadId).toUpperCase() === 'BV' ||
      String(ciudad?.nombre || '').toLowerCase().includes('buenaventura')

    let ciclo: number | null = null
    if (mes >= 9 && mes <= 12) ciclo = 1
    else if (esBuenaventura && mes >= 2 && mes <= 3) ciclo = 2
    else if (mes >= 5 && mes <= 7) ciclo = esBuenaventura ? 3 : 2

    return ciclo === null ? null : { ciclo, anio }
  }

  const mantenimientoDelCicloActual = (m: any) => {
    const periodoActual = obtenerPeriodoCiclo(new Date(), m.ciudad)
    if (!periodoActual) return false

    const periodoGuardado = m.ciclo !== undefined && m.ciclo !== null && m.ciclo !== ''
      ? Number(m.ciclo)
      : obtenerPeriodoCiclo(m.fecha, m.ciudad)?.ciclo
    const anioGuardado = m.año !== undefined && m.año !== null && m.año !== ''
      ? Number(m.año)
      : Number(obtenerFechaColombia(m.fecha).slice(0, 4))

    return periodoGuardado === periodoActual.ciclo && anioGuardado === periodoActual.anio
  }

  // En ambos modos se respeta el rango de fechas seleccionado.
  // En ciclo actual, además se limita al ciclo vigente.
  const mantenimientoEnConsulta = (m: any) =>
    fechaDentroDelFiltro(m.fecha) &&
    (modoConsulta === 'ciclo' ? mantenimientoDelCicloActual(m) : true)

  const graficaRealizadosRef =
    useRef<HTMLDivElement>(null)

  const graficaFaltantesRef =
    useRef<HTMLDivElement>(null)

  const graficaCiudadesRef =
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
    const inventarioCompleto = state.equipos || []
    const tipos = state.tipo || []
    const equiposTotales = inventarioCompleto.filter(eq =>
      (ciudadFiltro === 'todas' || String(eq.ciudad) === ciudadFiltro) &&
      (sedeFiltro === 'todas' || String(eq.sede) === sedeFiltro)
    )
    const mantenimientos = (state.mantenimiento || []).filter(m =>
      mantenimientoEnConsulta(m) &&
      (ciudadFiltro === 'todas' || String(m.ciudad) === ciudadFiltro) &&
      (sedeFiltro === 'todas' || String(m.sede) === sedeFiltro)
    )
    const activosConMantenimiento = new Set(
      mantenimientos.map(m => String(m.activo ?? '').trim()).filter(Boolean)
    )
    const equiposRealizados = equiposTotales.filter(eq =>
      activosConMantenimiento.has(String(eq.activo ?? '').trim())
    )
    const equiposFaltantes = equiposTotales.filter(eq =>
      !activosConMantenimiento.has(String(eq.activo ?? '').trim())
    )

    const contarPorTipo = (equipos: typeof equiposTotales) => {
      const resultado: Record<number, number> = {}
      equipos.forEach(eq => {
        const tipoId = Number(eq.tipo)
        if (!Number.isNaN(tipoId)) resultado[tipoId] = (resultado[tipoId] || 0) + 1
      })
      return resultado
    }
    const inventarioPorTipo = contarPorTipo(equiposTotales)
    const realizadosPorTipo = contarPorTipo(equiposRealizados)
    const faltantesPorTipo = contarPorTipo(equiposFaltantes)

    const desgloseCategorias = tipos.map(tObj => {
      const tId = Number(tObj.id)
      const totalBD = inventarioPorTipo[tId] || 0
      const realizados = realizadosPorTipo[tId] || 0
      const faltantes = faltantesPorTipo[tId] || 0
      return {
        id: tObj.id,
        nombre: tObj.nombre,
        totalBD,
        realizados,
        faltantes,
        avancePorcentaje: totalBD > 0 ? Number(((realizados / totalBD) * 100).toFixed(1)) : 0
      }
    })

    const totalInventario = equiposTotales.length
    const totalRealizados = equiposRealizados.length
    const totalFaltantes = equiposFaltantes.length
    const porcentajeGlobal = totalInventario > 0
      ? Number(((totalRealizados / totalInventario) * 100).toFixed(1))
      : 0

    return {
      totalInventario, totalRealizados, totalFaltantes, porcentajeGlobal,
      desgloseCategorias, equiposRealizados, equiposFaltantes, mantenimientosFiltrados: mantenimientos
    }
  }, [state, ciudadFiltro, sedeFiltro, modoConsulta, fechaDesde, fechaHasta])


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
  // MANTENIMIENTOS REALIZADOS Y FALTANTES POR CIUDAD
  // Realizados usan la ciudad guardada en el mantenimiento;
  // faltantes usan la ciudad del inventario actual.
  // =====================================================

  const mantenimientosPorCiudad = useMemo(() => {
    const inventario = (state.equipos || []).filter(eq =>
      (ciudadFiltro === 'todas' || String(eq.ciudad) === ciudadFiltro) &&
      (sedeFiltro === 'todas' || String(eq.sede) === sedeFiltro)
    )
    const mantenimientos = reportesData.mantenimientosFiltrados
    const ciudades = state.ciudad || []
    const inventarioPorActivo = new Map(inventario.map(eq => [String(eq.activo ?? '').trim(), eq]))
    const realizadosPorCiudad = new Map<string, Set<string>>()
    const mantenimientosOrdenados = [...mantenimientos].sort((a, b) => {
      const fechaA = new Date(a.fecha).getTime()
      const fechaB = new Date(b.fecha).getTime()
      return (Number.isFinite(fechaB) ? fechaB : 0) - (Number.isFinite(fechaA) ? fechaA : 0)
    })
    const ultimoMantenimiento = new Map<string, (typeof mantenimientos)[number]>()
    mantenimientosOrdenados.forEach(m => {
      const activo = String(m.activo ?? '').trim()
      const tipoEquipo = inventarioPorActivo.get(activo)?.tipo ?? m.tipo
      if (activo && !ultimoMantenimiento.has(activo) &&
        (categoriaFiltro === 'todas' || String(tipoEquipo) === categoriaFiltro)) {
        ultimoMantenimiento.set(activo, m)
      }
    })
    ultimoMantenimiento.forEach((m, activo) => {
      const ciudadId = String(m.ciudad ?? '').trim()
      if (!ciudadId) return
      if (!realizadosPorCiudad.has(ciudadId)) realizadosPorCiudad.set(ciudadId, new Set())
      realizadosPorCiudad.get(ciudadId)!.add(activo)
    })

    const activosConMantenimiento = new Set(mantenimientos.map(m => String(m.activo ?? '').trim()).filter(Boolean))
    const faltantesPorCiudad = new Map<string, Set<string>>()
    inventario.forEach(eq => {
      const activo = String(eq.activo ?? '').trim()
      if (!activo || activosConMantenimiento.has(activo)) return
      if (categoriaFiltro !== 'todas' && String(eq.tipo) !== categoriaFiltro) return
      const ciudadId = String(eq.ciudad ?? '').trim()
      if (!ciudadId) return
      if (!faltantesPorCiudad.has(ciudadId)) faltantesPorCiudad.set(ciudadId, new Set())
      faltantesPorCiudad.get(ciudadId)!.add(activo)
    })

    const ciudadIds = new Set([...ciudades.map(c => String(c.id)), ...realizadosPorCiudad.keys(), ...faltantesPorCiudad.keys()])
    return Array.from(ciudadIds).map(id => {
      const ciudad = ciudades.find(c => String(c.id) === id || String(c.nombre).toLowerCase() === id.toLowerCase())
      return { id, nombre: ciudad?.nombre || id, realizados: realizadosPorCiudad.get(id)?.size || 0, faltantes: faltantesPorCiudad.get(id)?.size || 0 }
    }).filter(c => (c.realizados > 0 || c.faltantes > 0) && (ciudadFiltro === 'todas' || c.id === ciudadFiltro || String((state.ciudad || []).find(x => x.nombre === c.nombre)?.id) === ciudadFiltro))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }, [state, categoriaFiltro, ciudadFiltro, sedeFiltro, reportesData])


  // =====================================================
  // EQUIPOS FILTRADOS PARA EXPORTAR
  // =====================================================

  const equiposFaltantesFiltrados =
    useMemo(() => {

      if (categoriaFiltro === 'todas') {

        return reportesData.equiposFaltantes

      }

      return reportesData.equiposFaltantes.filter(
        eq => String(eq.tipo) === categoriaFiltro
      )

    }, [
      reportesData,
      categoriaFiltro
    ])

  const equiposFaltantesParaExportar = useMemo(() => {
    return equiposFaltantesFiltrados.filter(eq =>
      (ciudadFiltro === 'todas' || String(eq.ciudad) === ciudadFiltro) &&
      (sedeFiltro === 'todas' || String(eq.sede) === sedeFiltro)
    )
  }, [equiposFaltantesFiltrados, ciudadFiltro, sedeFiltro])


  // =====================================================
  // EXPORTAR EXCEL
  // =====================================================

  const exportarExcel = async () => {

    try {

      if (
        !graficaRealizadosRef.current ||
        !graficaFaltantesRef.current ||
        !graficaCiudadesRef.current
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

      const imagenCiudades =
        await toPng(
          graficaCiudadesRef.current,
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

        valor: categoriaFiltro === 'todas' ? reportesData.totalInventario : categoriasFiltradas[0]?.totalBD || 0

      })


      resumen.addRow({

        indicador: 'Total Con Mantenimiento',

        valor: categoriaFiltro === 'todas' ? reportesData.totalRealizados : categoriasFiltradas[0]?.realizados || 0

      })


      resumen.addRow({

        indicador: 'Total Faltantes',

        valor: categoriaFiltro === 'todas' ? reportesData.totalFaltantes : categoriasFiltradas[0]?.faltantes || 0

      })


      resumen.addRow({

        indicador: 'Progreso Global',

        valor: `${categoriaFiltro === 'todas' ? reportesData.porcentajeGlobal : categoriasFiltradas[0]?.avancePorcentaje || 0}%`

      })


      resumen.addRow({
        indicador: 'Tipo de consulta',
        valor: modoConsulta === 'ciclo' ? 'Ciclo actual' : 'Consulta histórica'
      })
      if (modoConsulta === 'historico') {
        resumen.addRow({ indicador: 'Fecha desde', valor: fechaDesde || 'Sin límite' })
        resumen.addRow({ indicador: 'Fecha hasta', valor: fechaHasta || 'Sin límite' })
      }

      resumen.addRow({
        indicador: 'Categoría',
        valor: categoriaFiltro === 'todas'
          ? 'Todas las categorías'
          : categoriasFiltradas[0]?.nombre || ''
      })

      resumen.addRow({
        indicador: 'Ciudad',
        valor: ciudadFiltro === 'todas'
          ? 'Todas las ciudades'
          : (state.ciudad || []).find(c => String(c.id) === ciudadFiltro)?.nombre || ciudadFiltro
      })

      resumen.addRow({
        indicador: 'Sede',
        valor: sedeFiltro === 'todas'
          ? 'Todas las sedes'
          : sedesDisponibles.find(s => String(s.id) === sedeFiltro)?.nombre || sedeFiltro
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
        { header: 'Fecha', key: 'fecha', width: 22 },
        { header: 'Activo', key: 'activo', width: 18 },
        { header: 'Serie', key: 'serie', width: 22 },
        { header: 'Marca', key: 'marca', width: 20 },
        { header: 'Modelo', key: 'modelo', width: 25 },
        { header: 'Tipo', key: 'tipo', width: 20 },
        { header: 'Ciudad', key: 'ciudad', width: 20 },
        { header: 'Sede', key: 'sede', width: 20 },
        { header: 'Área', key: 'area', width: 25 }
      ]

      // Los equipos realizados deben mostrar los datos guardados
      // en el registro de mantenimiento, no los del inventario actual.
      const mantenimientosParaExportar = reportesData.mantenimientosFiltrados
        .filter(m => {
          const activo = String(m.activo ?? '').trim()
          const equipo = (state.equipos || []).find(eq => String(eq.activo ?? '').trim() === activo)
          const coincideCategoria = categoriaFiltro === 'todas' || String(equipo?.tipo ?? m.tipo) === categoriaFiltro
          return activo !== '' && coincideCategoria
        })
        .sort((a, b) => {
          const fechaA = new Date(a.fecha).getTime()
          const fechaB = new Date(b.fecha).getTime()
          return (Number.isFinite(fechaB) ? fechaB : 0) -
            (Number.isFinite(fechaA) ? fechaA : 0)
        })

      // En el ciclo actual se muestra una fila por equipo (la más reciente).
      // En la consulta histórica se conservan todos los registros del rango,
      // incluso si un mismo activo tuvo más de un mantenimiento.
      const mantenimientosUnicos = modoConsulta === 'historico'
        ? mantenimientosParaExportar
        : Array.from(
          new Map(
            mantenimientosParaExportar.map(m => [String(m.activo ?? '').trim(), m])
          ).values()
        )

      const obtenerMarca = (marcaId: number | string) => {
        const marca = (state.marca || []).find(m =>
          String(m.id) === String(marcaId) ||
          String(m.nombre).toLowerCase() === String(marcaId).toLowerCase()
        )
        return marca?.nombre || String(marcaId ?? '')
      }

      const obtenerModelo = (marcaId: number | string, modeloId: number | string) => {
        const marca = (state.marca || []).find(m =>
          String(m.id) === String(marcaId) ||
          String(m.nombre).toLowerCase() === String(marcaId).toLowerCase()
        )
        const modelo = marca?.modelo?.find(m =>
          String(m.id) === String(modeloId) ||
          String(m.nombre).toLowerCase() === String(modeloId).toLowerCase()
        )
        return modelo?.nombre || String(modeloId ?? '')
      }

      const obtenerTipo = (tipoId: number | string) => {
        const tipo = (state.tipo || []).find(t =>
          String(t.id) === String(tipoId) ||
          String(t.nombre).toLowerCase() === String(tipoId).toLowerCase()
        )
        return tipo?.nombre || String(tipoId ?? '')
      }

      const obtenerCiudad = (ciudadId: string | number) => {
        const ciudad = (state.ciudad || []).find(c =>
          String(c.id) === String(ciudadId) ||
          String(c.nombre).toLowerCase() === String(ciudadId).toLowerCase()
        )
        return ciudad?.nombre || String(ciudadId ?? '')
      }

      const obtenerSede = (ciudadId: string | number, sedeId: number | string) => {
        const ciudad = (state.ciudad || []).find(c =>
          String(c.id) === String(ciudadId) ||
          String(c.nombre).toLowerCase() === String(ciudadId).toLowerCase()
        )
        const sede = ciudad?.centro?.find(c =>
          String(c.id) === String(sedeId) ||
          String(c.nombre).toLowerCase() === String(sedeId).toLowerCase()
        )
        return sede?.nombre || String(sedeId ?? '')
      }

      mantenimientosUnicos.forEach(m => {
        realizadosSheet.addRow({
          fecha: m.fecha ? new Date(m.fecha) : '',
          activo: m.activo,
          serie: m.serie,
          marca: obtenerMarca(m.marca),
          modelo: obtenerModelo(m.marca, m.modelo),
          tipo: obtenerTipo(m.tipo),
          ciudad: obtenerCiudad(m.ciudad),
          sede: obtenerSede(m.ciudad, m.sede),
          area: m.area
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


      realizadosSheet.getColumn('fecha').numFmt = 'dd/mm/yyyy hh:mm'

      realizadosSheet.autoFilter = {
        from: 'A1',
        to: 'I1'
      }


      // =================================================
      // HOJA FALTANTES
      // =================================================

      const faltantesSheet =
        workbook.addWorksheet('Faltantes')


      faltantesSheet.columns = [
        { header: 'Activo', key: 'activo', width: 18 },
        { header: 'Serie', key: 'serie', width: 22 },
        { header: 'Marca', key: 'marca', width: 20 },
        { header: 'Modelo', key: 'modelo', width: 25 },
        { header: 'Tipo', key: 'tipo', width: 20 },
        { header: 'Ciudad', key: 'ciudad', width: 20 },
        { header: 'Sede', key: 'sede', width: 20 },
        { header: 'Área', key: 'area', width: 25 }
      ]

      // Los faltantes siguen tomando los datos del inventario actual.
      equiposFaltantesParaExportar.forEach(eq => {
        faltantesSheet.addRow({
          activo: eq.activo,
          serie: eq.serie,
          marca: obtenerMarca(eq.marca),
          modelo: obtenerModelo(eq.marca, eq.modelo),
          tipo: obtenerTipo(eq.tipo),
          ciudad: obtenerCiudad(eq.ciudad),
          sede: obtenerSede(eq.ciudad, eq.sede),
          area: eq.area
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

        to: 'H1'

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
          tl: { col: 0, row: 27 },
          ext: { width: 700, height: 400 }
        }
      )

      graficas.getCell('A49').value = 'Mantenimientos realizados y faltantes por ciudad'
      graficas.getCell('A49').font = { bold: true, size: 14 }
      const imagenCiudadesId = workbook.addImage({ base64: imagenCiudades, extension: 'png' })
      graficas.addImage(imagenCiudadesId, {
        tl: { col: 0, row: 50 },
        ext: { width: 850, height: 430 }
      })


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


      const nombreCiudad = ciudadFiltro === 'todas'
        ? 'TodasLasCiudades'
        : ((state.ciudad || []).find(c => String(c.id) === ciudadFiltro)?.nombre || ciudadFiltro)
          .replace(/[^a-zA-Z0-9_-]/g, '_')

      enlace.download =
        `Reporte_CompuInventory_${modoConsulta === 'ciclo' ? 'CicloActual' : `Historico_${fechaDesde || 'Inicio'}_${fechaHasta || 'Fin'}`}_${nombreCategoria}_${nombreCiudad}.xlsx`


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

            {modoConsulta === 'ciclo'
              ? 'Resumen del ciclo de mantenimiento vigente'
              : 'Consulta de mantenimientos por rango de fechas'}

          </p>

        </div>


        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Consulta:</label>
            <select
              value={modoConsulta}
              onChange={e => setModoConsulta(e.target.value as 'ciclo' | 'historico')}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ciclo">Ciclo actual</option>
              <option value="historico">Consulta histórica</option>
            </select>
          </div>

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

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
              Filtrar ciudad:
            </label>
            <select
              value={ciudadFiltro}
              onChange={(e) => {
                setCiudadFiltro(e.target.value)
                setSedeFiltro('todas')
              }}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="todas">Todas las ciudades</option>
              {(state.ciudad || []).map(c => (
                <option key={c.id} value={String(c.id)}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {ciudadFiltro !== 'todas' && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                Filtrar sede:
              </label>
              <select
                value={sedeFiltro}
                onChange={e => setSedeFiltro(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="todas">Todas las sedes</option>
                {sedesDisponibles.map(sede => (
                  <option key={sede.id} value={String(sede.id)}>
                    {sede.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Desde:</label>
            <input type="date" value={fechaDesde} max={fechaHasta || undefined}
              onChange={e => setFechaDesde(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Hasta:</label>
            <input type="date" value={fechaHasta} min={fechaDesde || undefined}
              onChange={e => setFechaHasta(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none" />
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

              {Number((100 - reportesData.porcentajeGlobal).toFixed(1))}% pendiente

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
                MANTENIMIENTOS POR CIUDAD
            ================================================= */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-base font-bold text-slate-800 mb-4">
          Mantenimientos realizados y faltantes por ciudad
        </h3>
        <div ref={graficaCiudadesRef} className="w-full h-80 bg-white">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mantenimientosPorCiudad} margin={{ top: 10, right: 20, left: 0, bottom: 45 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="nombre" interval={0} angle={-25} textAnchor="end" height={60} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip formatter={(val: any, name: any) => [`${val} equipos`, name === 'realizados' ? 'Realizados' : 'Faltantes']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              <Bar dataKey="realizados" name="Realizados" fill="#2563eb" radius={[5, 5, 0, 0]} />
              <Bar dataKey="faltantes" name="Faltantes" fill="#f97316" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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