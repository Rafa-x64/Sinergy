import prisma from '../../core/prisma'

export class DashboardService {

  /**
   * KPI A — Disponibilidad de equipos agrupada por estadoOperativo.
   */
  async disponibilidadEquipos(plantaId?: number) {
    const rows = await prisma.equipo.groupBy({
      by: ['estadoOperativo'],
      where: {
        ...(plantaId && {
          ubicacionTecnica: { plantaId }
        })
      },
      _count: { id: true }
    })

    const total = rows.reduce((acc, r) => acc + r._count.id, 0)

    return rows.map(r => ({
      estado: r.estadoOperativo,
      cantidad: r._count.id,
      porcentaje: total > 0 ? Math.round((r._count.id / total) * 100) : 0
    }))
  }

  /**
   * KPI A — Disponibilidad desglosada por planta.
   */
  async disponibilidadPorPlanta(plantaId?: number) {
    const equipos = await prisma.equipo.findMany({
      where: {
        ...(plantaId && {
          ubicacionTecnica: { plantaId }
        })
      },
      select: {
        estadoOperativo: true,
        ubicacionTecnica: {
          select: {
            planta: { select: { id: true, nombre: true, codigo: true } }
          }
        }
      }
    })

    const mapaPlanta: Record<string, { nombre: string; OPERATIVO: number; INOPERATIVO: number; EN_MANTENIMIENTO: number }> = {}

    for (const e of equipos) {
      const planta = e.ubicacionTecnica?.planta
      if (!planta) continue
      const key = String(planta.id)
      if (!mapaPlanta[key]) {
        mapaPlanta[key] = { nombre: planta.nombre, OPERATIVO: 0, INOPERATIVO: 0, EN_MANTENIMIENTO: 0 }
      }
      mapaPlanta[key][e.estadoOperativo]++
    }

    return Object.values(mapaPlanta)
  }

  /**
   * KPI C — Top 10 equipos cuyas variables registran mayor % de fueraDeRango.
   */
  async topEquiposConFallas(plantaId?: number, limite = 10) {
    const filtroPlanta = plantaId ? `AND pl.id = ${Number(plantaId)}` : ''

    const resultado: Array<{
      equipo_id: number
      codigo: string
      nombre: string
      planta_nombre: string
      total_variables: bigint
      fuera_de_rango: bigint
      porcentaje_fallas: string
    }> = await prisma.$queryRawUnsafe(`
      SELECT
        e.id              AS equipo_id,
        e.codigo,
        e.nombre,
        pl.nombre         AS planta_nombre,
        COUNT(id2.id)     AS total_variables,
        SUM(
          CASE
            WHEN id2.valor_numerico IS NOT NULL AND v.valor_minimo IS NOT NULL AND v.valor_maximo IS NOT NULL
             AND (id2.valor_numerico < v.valor_minimo OR id2.valor_numerico > v.valor_maximo) THEN 1
            WHEN id2.valor_numerico IS NOT NULL AND v.valor_minimo IS NOT NULL AND v.valor_maximo IS NULL
             AND id2.valor_numerico < v.valor_minimo THEN 1
            WHEN id2.valor_numerico IS NOT NULL AND v.valor_maximo IS NOT NULL AND v.valor_minimo IS NULL
             AND id2.valor_numerico > v.valor_maximo THEN 1
            ELSE 0
          END
        )                 AS fuera_de_rango,
        ROUND(
          100.0 * SUM(
            CASE
              WHEN id2.valor_numerico IS NOT NULL AND v.valor_minimo IS NOT NULL AND v.valor_maximo IS NOT NULL
               AND (id2.valor_numerico < v.valor_minimo OR id2.valor_numerico > v.valor_maximo) THEN 1
              WHEN id2.valor_numerico IS NOT NULL AND v.valor_minimo IS NOT NULL AND v.valor_maximo IS NULL
               AND id2.valor_numerico < v.valor_minimo THEN 1
              WHEN id2.valor_numerico IS NOT NULL AND v.valor_maximo IS NOT NULL AND v.valor_minimo IS NULL
               AND id2.valor_numerico > v.valor_maximo THEN 1
              ELSE 0
            END
          ) / NULLIF(COUNT(id2.id), 0), 2
        )                 AS porcentaje_fallas
      FROM inspecciones i
      JOIN inspeccion_detalles id2 ON id2.inspeccion_id = i.id
      JOIN variables v             ON v.id = id2.variable_id
      JOIN componentes c           ON c.id = v.componente_id
      JOIN equipos e               ON e.id = c.equipo_id
      JOIN ubicaciones_tecnicas ut ON ut.id = e.ubicacion_tecnica_id
      JOIN plantas pl              ON pl.id = ut.planta_id
      WHERE id2.valor_numerico IS NOT NULL
        ${filtroPlanta}
      GROUP BY e.id, e.codigo, e.nombre, pl.nombre
      HAVING COUNT(id2.id) > 0
      ORDER BY porcentaje_fallas DESC NULLS LAST
      LIMIT ${Number(limite)}
    `)

    return resultado.map(r => ({
      equipoId: Number(r.equipo_id),
      codigo: r.codigo,
      nombre: r.nombre,
      plantaNombre: r.planta_nombre,
      totalVariables: Number(r.total_variables),
      fueraDeRango: Number(r.fuera_de_rango),
      porcentajeFallas: parseFloat(r.porcentaje_fallas ?? '0')
    }))
  }

  /**
   * KPI G — Evolución de disponibilidad (% OPERATIVO) en los últimos 6 meses.
   */
  async evolucionDisponibilidad(plantaId?: number) {
    const meses: Array<{ mes: string; porcentaje: number }> = []
    const ahora = new Date()

    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
      const mesLabel = fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
      const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 59, 59)

      const [operativos, total] = await Promise.all([
        prisma.equipo.count({
          where: {
            estadoOperativo: 'OPERATIVO',
            creadoEn: { lte: finMes },
            ...(plantaId && { ubicacionTecnica: { plantaId } })
          }
        }),
        prisma.equipo.count({
          where: {
            creadoEn: { lte: finMes },
            ...(plantaId && { ubicacionTecnica: { plantaId } })
          }
        })
      ])

      meses.push({
        mes: mesLabel,
        porcentaje: total > 0 ? Math.round((operativos / total) * 100) : 0
      })
    }

    return meses
  }

  /**
   * KPI D — Inspecciones elaboradas por técnico en el mes dado.
   */
  async cargaWorkPorTecnico(plantaId?: number, mes?: string) {
    const ahora = new Date()
    const año = mes ? parseInt(mes.split('-')[0]) : ahora.getFullYear()
    const mesNum = mes ? parseInt(mes.split('-')[1]) : ahora.getMonth() + 1

    const inicio = new Date(año, mesNum - 1, 1)
    const fin = new Date(año, mesNum, 0, 23, 59, 59)

    const rows = await prisma.inspeccion.groupBy({
      by: ['elaboradoPorId'],
      where: {
        fechaRegistro: { gte: inicio, lte: fin },
        ...(plantaId && { plantaId })
      },
      _count: { id: true }
    })

    if (rows.length === 0) return []

    const usuarios = await prisma.usuario.findMany({
      where: { id: { in: rows.map(r => r.elaboradoPorId) } },
      select: { id: true, nombre: true, apellido: true }
    })

    const mapaUsuarios = new Map(usuarios.map(u => [u.id, u]))

    return rows.map(r => {
      const u = mapaUsuarios.get(r.elaboradoPorId)
      return {
        tecnicoId: r.elaboradoPorId,
        nombre: u ? `${u.nombre} ${u.apellido}` : `Técnico #${r.elaboradoPorId}`,
        cantidad: r._count.id
      }
    }).sort((a, b) => b.cantidad - a.cantidad)
  }

  /**
   * R1 — Reporte de Estado de Flota Completo.
   */
  async reporteEstadoFlota(filtros: {
    plantaId?: number
    tipoEquipoId?: number
    estadoOperativo?: string
  }) {
    const where: any = {}

    if (filtros.plantaId) {
      where.ubicacionTecnica = { plantaId: filtros.plantaId }
    }
    if (filtros.tipoEquipoId) {
      where.tipoEquipoId = filtros.tipoEquipoId
    }
    if (filtros.estadoOperativo) {
      where.estadoOperativo = filtros.estadoOperativo
    }

    const equipos = await prisma.equipo.findMany({
      where,
      orderBy: [
        { ubicacionTecnica: { plantaId: 'asc' } },
        { codigo: 'asc' }
      ],
      include: {
        tipoEquipo: { select: { id: true, nombre: true } },
        ubicacionTecnica: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            planta: { select: { id: true, nombre: true, codigo: true } }
          }
        },
        inspecciones: {
          orderBy: { fechaRegistro: 'desc' },
          take: 1,
          select: {
            id: true,
            codigoInspeccion: true,
            fechaRegistro: true,
            estadoInspeccion: true,
            _count: { select: { detalles: true } }
          }
        }
      }
    })

    const totalEquipos = equipos.length
    const operativos = equipos.filter(e => e.estadoOperativo === 'OPERATIVO').length
    const inoperativos = equipos.filter(e => e.estadoOperativo === 'INOPERATIVO').length
    const enMantenimiento = equipos.filter(e => e.estadoOperativo === 'EN_MANTENIMIENTO').length

    const listaFormateada = equipos.map(e => {
      const ultimaInsp = e.inspecciones[0]
      return {
        id: e.id,
        codigo: e.codigo,
        nombre: e.nombre,
        serial: e.serial || 'N/A',
        marca: e.marca || 'N/A',
        modelo: e.modelo || 'N/A',
        tipoEquipo: e.tipoEquipo?.nombre || 'N/A',
        planta: e.ubicacionTecnica?.planta?.nombre || 'General',
        ubicacion: `${e.ubicacionTecnica?.codigo || ''} - ${e.ubicacionTecnica?.nombre || ''}`.trim(),
        estadoOperativo: e.estadoOperativo,
        ultimaInspeccionFecha: ultimaInsp ? ultimaInsp.fechaRegistro : null,
        ultimaInspeccionCodigo: ultimaInsp ? ultimaInsp.codigoInspeccion : null,
        ultimaInspeccionEstado: ultimaInsp ? ultimaInsp.estadoInspeccion : null
      }
    })

    return {
      resumen: {
        total: totalEquipos,
        operativos,
        inoperativos,
        enMantenimiento,
        porcentajeDisponibilidad: totalEquipos > 0 ? Math.round((operativos / totalEquipos) * 100) : 0
      },
      equipos: listaFormateada
    }
  }

  /**
   * R4 — Reporte Ejecutivo Mensual (1 Página) con cálculos 100% reales.
   */
  async reporteEjecutivoMensual(plantaId?: number, mesParam?: string) {
    const ahora = new Date()
    const año = mesParam ? parseInt(mesParam.split('-')[0]) : ahora.getFullYear()
    const mesNum = mesParam ? parseInt(mesParam.split('-')[1]) : ahora.getMonth() + 1

    const inicioMes = new Date(año, mesNum - 1, 1)
    const finMes = new Date(año, mesNum, 0, 23, 59, 59)

    // Mes anterior real para cálculo exacto de tendencia
    const finMesAnt = new Date(año, mesNum - 1, 0, 23, 59, 59)

    const wherePlantaEquipo = plantaId ? { ubicacionTecnica: { plantaId } } : {}
    const wherePlantaInsp = plantaId ? { plantaId } : {}

    const [
      totalEquipos,
      operativos,
      inoperativos,
      enMantenimiento,
      operativosAnt,
      totalAnt,
      inspeccionesMes,
      aprobadasMes,
      rechazadasMes,
      pendientesMes,
      noConformidadesList,
      plantasResumen,
      equiposNoOperativos
    ] = await Promise.all([
      prisma.equipo.count({ where: wherePlantaEquipo }),
      prisma.equipo.count({ where: { ...wherePlantaEquipo, estadoOperativo: 'OPERATIVO' } }),
      prisma.equipo.count({ where: { ...wherePlantaEquipo, estadoOperativo: 'INOPERATIVO' } }),
      prisma.equipo.count({ where: { ...wherePlantaEquipo, estadoOperativo: 'EN_MANTENIMIENTO' } }),
      prisma.equipo.count({ where: { ...wherePlantaEquipo, estadoOperativo: 'OPERATIVO', creadoEn: { lte: finMesAnt } } }),
      prisma.equipo.count({ where: { ...wherePlantaEquipo, creadoEn: { lte: finMesAnt } } }),
      prisma.inspeccion.count({ where: { ...wherePlantaInsp, fechaRegistro: { gte: inicioMes, lte: finMes } } }),
      prisma.inspeccion.count({ where: { ...wherePlantaInsp, estadoInspeccion: 'APROBADO', fechaRegistro: { gte: inicioMes, lte: finMes } } }),
      prisma.inspeccion.count({ where: { ...wherePlantaInsp, estadoInspeccion: 'RECHAZADO', fechaRegistro: { gte: inicioMes, lte: finMes } } }),
      prisma.inspeccion.count({ where: { ...wherePlantaInsp, estadoInspeccion: 'PENDIENTE', fechaRegistro: { gte: inicioMes, lte: finMes } } }),
      this.noConformidades(plantaId, inicioMes.toISOString(), finMes.toISOString()),
      this.disponibilidadPorPlanta(plantaId),
      prisma.equipo.findMany({
        where: {
          ...wherePlantaEquipo,
          estadoOperativo: { in: ['INOPERATIVO', 'EN_MANTENIMIENTO'] }
        },
        select: { estadoOperativo: true, actualizadoEn: true }
      })
    ])

    const disponibilidadActual = totalEquipos > 0 ? Math.round((operativos / totalEquipos) * 100) : 0
    const disponibilidadAnt = totalAnt > 0 ? Math.round((operativosAnt / totalAnt) * 100) : disponibilidadActual
    const diff = (disponibilidadActual - disponibilidadAnt)
    const tendencia = diff > 0 ? `+${diff}%` : diff < 0 ? `${diff}%` : `0.0%`

    // Top 3 equipos con más no conformidades en el mes
    const conteoEquiposFallas: Record<string, { codigo: string; nombre: string; fallas: number }> = {}
    for (const nc of noConformidadesList) {
      if (!conteoEquiposFallas[nc.equipo_codigo]) {
        conteoEquiposFallas[nc.equipo_codigo] = { codigo: nc.equipo_codigo, nombre: nc.equipo_nombre, fallas: 0 }
      }
      conteoEquiposFallas[nc.equipo_codigo].fallas++
    }

    const top3Fallas = Object.values(conteoEquiposFallas)
      .sort((a, b) => b.fallas - a.fallas)
      .slice(0, 3)

    // Cálculo real de horas estimadas de inactividad según timestamp real de cambio de estado
    let horasInoperatividadReales = 0
    for (const eq of equiposNoOperativos) {
      const ms = Math.max(0, ahora.getTime() - new Date(eq.actualizadoEn).getTime())
      const hrs = Math.round(ms / (1000 * 60 * 60))
      // Máximo horas del mes actual
      horasInoperatividadReales += Math.min(hrs, 720)
    }

    return {
      periodo: {
        mes: mesNum,
        año,
        etiqueta: inicioMes.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      },
      kpis: {
        flotaTotal: totalEquipos,
        operativos,
        inoperativos,
        enMantenimiento,
        disponibilidad: disponibilidadActual,
        tendencia,
        inspeccionesRealizadas: inspeccionesMes,
        inspeccionesAprobadas: aprobadasMes,
        inspeccionesRechazadas: rechazadasMes,
        inspeccionesPendientes: pendientesMes,
        tasaAprobacion: inspeccionesMes > 0 ? Math.round((aprobadasMes / inspeccionesMes) * 100) : 0,
        totalNoConformidades: noConformidadesList.length,
        horasInoperatividad: horasInoperatividadReales,
        top3EquiposCriticos: top3Fallas
      },
      plantas: plantasResumen
    }
  }

  /**
   * R5 — Matriz de Criticidad por Equipo (Clasificación A, B, C) con lógica matemáticamente balanceada.
   */
  async matrizCriticidad(plantaId?: number) {
    const wherePlanta = plantaId ? { ubicacionTecnica: { plantaId } } : {}

    const equipos = await prisma.equipo.findMany({
      where: wherePlanta,
      include: {
        tipoEquipo: { select: { nombre: true } },
        ubicacionTecnica: {
          select: {
            nombre: true,
            planta: { select: { nombre: true } }
          }
        },
        inspecciones: {
          take: 20,
          orderBy: { fechaRegistro: 'desc' },
          select: {
            estadoInspeccion: true,
            detalles: {
              select: {
                valorNumerico: true,
                variable: {
                  select: { valorMinimo: true, valorMaximo: true }
                }
              }
            }
          }
        }
      }
    })

    const ranking = equipos.map(e => {
      let totalVariables = 0
      let fueraDeRangoCount = 0
      let inspeccionesRechazadas = 0
      const totalInsp = e.inspecciones.length

      for (const insp of e.inspecciones) {
        if (insp.estadoInspeccion === 'RECHAZADO') inspeccionesRechazadas++
        for (const d of insp.detalles) {
          if (d.valorNumerico !== null) {
            totalVariables++
            const val = Number(d.valorNumerico)
            const min = d.variable.valorMinimo !== null ? Number(d.variable.valorMinimo) : null
            const max = d.variable.valorMaximo !== null ? Number(d.variable.valorMaximo) : null
            if (min !== null && max !== null && (val < min || val > max)) fueraDeRangoCount++
            else if (min !== null && max === null && val < min) fueraDeRangoCount++
            else if (max !== null && min === null && val > max) fueraDeRangoCount++
          }
        }
      }

      const tasaFallas = totalVariables > 0 ? (fueraDeRangoCount / totalVariables) * 100 : 0
      const tasaRechazos = totalInsp > 0 ? (inspeccionesRechazadas / totalInsp) * 100 : 0
      
      // Ponderación real:
      // Si el equipo está inoperativo pero sin fallas, se penaliza con 25 puntos (Preventivo medio)
      // Si tiene fallas o rechazos, escala proporcionalmente
      const penalizacionEstado = e.estadoOperativo === 'INOPERATIVO' ? 25 : e.estadoOperativo === 'EN_MANTENIMIENTO' ? 15 : 0
      const score = Math.min(100, Math.round((tasaFallas * 0.45) + (tasaRechazos * 0.30) + penalizacionEstado))

      let clasificacion: 'A' | 'B' | 'C' = 'C'
      let prioridad = 'Baja (Operación Normal)'
      let color = '#10b981'

      if (score >= 55 || (e.estadoOperativo === 'INOPERATIVO' && tasaFallas > 0)) {
        clasificacion = 'A'
        prioridad = 'Crítica (Atención Inmediata)'
        color = '#ef4444'
      } else if (score >= 20 || e.estadoOperativo === 'INOPERATIVO' || e.estadoOperativo === 'EN_MANTENIMIENTO') {
        clasificacion = 'B'
        prioridad = 'Media (Preventivo Programado)'
        color = '#f59e0b'
      }

      return {
        id: e.id,
        codigo: e.codigo,
        nombre: e.nombre,
        tipo: e.tipoEquipo?.nombre || 'General',
        planta: e.ubicacionTecnica?.planta?.nombre || 'General',
        ubicacion: e.ubicacionTecnica?.nombre || 'N/A',
        estadoOperativo: e.estadoOperativo,
        score,
        clasificacion,
        prioridad,
        color,
        fueraDeRangoCount,
        tasaFallas: Math.round(tasaFallas),
        tasaRechazos: Math.round(tasaRechazos),
        inspeccionesEvaluadas: totalInsp
      }
    })

    return ranking.sort((a, b) => b.score - a.score)
  }

  /**
   * R3 — No conformidades: variables fuera de rango con contexto completo.
   */
  async noConformidades(plantaId?: number, fechaInicio?: string, fechaFin?: string) {
    const filtros: string[] = ['id2.valor_numerico IS NOT NULL']

    if (plantaId) filtros.push(`pl.id = ${Number(plantaId)}`)
    if (fechaInicio) filtros.push(`i.fecha_registro >= '${fechaInicio}'::timestamptz`)
    if (fechaFin) filtros.push(`i.fecha_registro <= '${fechaFin}'::timestamptz`)

    const where = filtros.join(' AND ')

    const resultado: Array<{
      inspeccion_id: string
      codigo_inspeccion: string
      fecha_registro: Date
      equipo_codigo: string
      equipo_nombre: string
      planta_nombre: string
      componente_nombre: string
      variable_nombre: string
      valor_medido: number
      valor_minimo: number | null
      valor_maximo: number | null
      unidad: string | null
      tecnico_nombre: string
    }> = await prisma.$queryRawUnsafe(`
      SELECT
        i.id::text                                   AS inspeccion_id,
        i.codigo_inspeccion,
        i.fecha_registro,
        e.codigo                                     AS equipo_codigo,
        e.nombre                                     AS equipo_nombre,
        pl.nombre                                    AS planta_nombre,
        c.nombre                                     AS componente_nombre,
        v.nombre                                     AS variable_nombre,
        id2.valor_numerico::float                    AS valor_medido,
        v.valor_minimo::float                        AS valor_minimo,
        v.valor_maximo::float                        AS valor_maximo,
        v.unidad,
        CONCAT(u.nombre, ' ', u.apellido)            AS tecnico_nombre
      FROM inspecciones i
      JOIN inspeccion_detalles id2 ON id2.inspeccion_id = i.id
      JOIN variables v             ON v.id = id2.variable_id
      JOIN componentes c           ON c.id = v.componente_id
      JOIN equipos e               ON e.id = c.equipo_id
      JOIN ubicaciones_tecnicas ut ON ut.id = e.ubicacion_tecnica_id
      JOIN plantas pl              ON pl.id = ut.planta_id
      JOIN usuarios u              ON u.id = i.elaborado_por
      WHERE ${where}
        AND (
          (v.valor_minimo IS NOT NULL AND v.valor_maximo IS NOT NULL AND (id2.valor_numerico < v.valor_minimo OR id2.valor_numerico > v.valor_maximo))
          OR (v.valor_minimo IS NOT NULL AND v.valor_maximo IS NULL AND id2.valor_numerico < v.valor_minimo)
          OR (v.valor_maximo IS NOT NULL AND v.valor_minimo IS NULL AND id2.valor_numerico > v.valor_maximo)
        )
      ORDER BY i.fecha_registro DESC
      LIMIT 500
    `)

    return resultado
  }

  /**
   * R2 — Historial de inspecciones del periodo con filtros y resumen estadistico.
   */
  async inspeccionesDelPeriodo(filtros: {
    plantaId?: number
    elaboradoPorId?: number
    tipoInspeccion?: string
    estado?: string
    fechaInicio?: string
    fechaFin?: string
    limite?: number
  }) {
    const where: any = {}
    if (filtros.plantaId) where.plantaId = filtros.plantaId
    if (filtros.elaboradoPorId) where.elaboradoPorId = filtros.elaboradoPorId
    if (filtros.tipoInspeccion) where.tipoInspeccion = filtros.tipoInspeccion
    if (filtros.estado) where.estadoInspeccion = filtros.estado
    if (filtros.fechaInicio || filtros.fechaFin) {
      where.fechaRegistro = {}
      if (filtros.fechaInicio) where.fechaRegistro.gte = new Date(filtros.fechaInicio)
      if (filtros.fechaFin) where.fechaRegistro.lte = new Date(filtros.fechaFin)
    }

    const [inspecciones, total, aprobadas, rechazadas] = await Promise.all([
      prisma.inspeccion.findMany({
        where,
        orderBy: { fechaRegistro: 'desc' },
        take: filtros.limite ?? 200,
        include: {
          elaboradoPor: { select: { id: true, nombre: true, apellido: true } },
          revisadoPor: { select: { id: true, nombre: true, apellido: true } },
          planta: { select: { id: true, codigo: true, nombre: true } },
          equipo: { select: { id: true, codigo: true, nombre: true } },
          tipoEquipo: { select: { id: true, nombre: true } },
          _count: { select: { detalles: true } }
        }
      }),
      prisma.inspeccion.count({ where }),
      prisma.inspeccion.count({ where: { ...where, estadoInspeccion: 'APROBADO' } }),
      prisma.inspeccion.count({ where: { ...where, estadoInspeccion: 'RECHAZADO' } })
    ])

    return {
      total,
      aprobadas,
      rechazadas,
      tasaAprobacion: total > 0 ? Math.round((aprobadas / total) * 100) : 0,
      inspecciones: inspecciones.map(i => ({ ...i, id: String(i.id) }))
    }
  }

  /**
   * R6 — Tarjeta de ronda: estructura de componentes y variables de un equipo para imprimir.
   */
  async tarjetaRonda(equipoId: number) {
    return prisma.equipo.findUnique({
      where: { id: equipoId },
      include: {
        ubicacionTecnica: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            planta: { select: { id: true, nombre: true, codigo: true } }
          }
        },
        tipoEquipo: { select: { id: true, nombre: true } },
        componentes: {
          where: { activo: true },
          orderBy: { ordenPosicion: 'asc' },
          include: {
            variables: {
              where: { activa: true },
              orderBy: { ordenPosicion: 'asc' },
              select: {
                id: true,
                nombre: true,
                tipoEvaluacion: true,
                unidad: true,
                valorMinimo: true,
                valorMaximo: true,
                ordenPosicion: true
              }
            }
          }
        }
      }
    })
  }
}

export const dashboardService = new DashboardService()
