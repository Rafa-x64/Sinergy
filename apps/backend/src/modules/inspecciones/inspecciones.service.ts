import prisma from '../../core/prisma'
import { AppError } from '../../core/errors/AppError'
import type { EstadoInspeccion, TipoInspeccion } from '@prisma/client'
import type {
  AlcanceInspeccion,
  CrearInspeccionDTO,
  EvaluarInspeccionDTO,
  FiltrosInspeccionDTO
} from './inspecciones.schemas'
import { notificationService } from '../notificaciones/notification.service'

export class InspeccionesService {

  /**
   * Obtiene la estructura de equipos elegibles para inspección rutinaria.
   *
   * REGLA DE NEGOCIO: Solo equipos OPERATIVOS en la planta.
   *
   * RESOLUCIÓN DE VARIABLES:
   * - Si el tipoEquipo del equipo tiene PlantillaVariable activas, la definición
   *   normativa (rangos, tipo, unidad, opciones) proviene de la plantilla.
   *   Solo se incluyen las variables del componente que tienen plantillaId.
   *   Si una variable existe tanto en la plantilla como directamente en el
   *   componente, siempre prevalece la definición de la plantilla.
   * - Si el tipoEquipo no tiene plantillas activas, se usan las variables
   *   propias del componente directamente.
   */
  async obtenerEquiposElegibles(
    plantaId: number,
    alcance: AlcanceInspeccion,
    referenciaId?: number,
    referenciaCodigo?: string
  ) {
    // 1. Identificar si la planta seleccionada es la planta "NINGUNA" (equipos móviles / sin ubicación fija)
    const planta = plantaId > 0
      ? await prisma.planta.findUnique({
          where: { id: plantaId },
          select: { id: true, codigo: true, nombre: true }
        })
      : null

    const esPlantaNinguna = plantaId === 0 || Boolean(
      planta && (
        planta.nombre.trim().toLowerCase().includes('ninguna') ||
        planta.codigo.trim().toLowerCase().includes('ninguna')
      )
    )

    let whereCondition: any = {
      estadoOperativo: 'OPERATIVO'
    }

    if (esPlantaNinguna) {
      // Si la planta es "Ninguna", incluye equipos con ubicación "Ninguna", con montacargasDetalle o de tipo Montacargas
      whereCondition.OR = [
        ...(plantaId > 0 ? [{ ubicacionTecnica: { plantaId, activa: true } }] : []),
        { ubicacionTecnica: { nombre: { contains: 'ninguna', mode: 'insensitive' } } },
        { ubicacionTecnica: { codigo: { contains: 'ninguna', mode: 'insensitive' } } },
        { montacargasDetalle: { isNot: null } },
        { tipoEquipo: { nombre: { contains: 'montacarg', mode: 'insensitive' } } }
      ]
    } else {
      whereCondition.ubicacionTecnica = { plantaId, activa: true }
    }

    if (alcance === 'POR_LINEA' && referenciaId) {
      if (whereCondition.OR) {
        whereCondition = {
          AND: [
            { OR: whereCondition.OR },
            { ubicacionTecnicaId: referenciaId }
          ],
          estadoOperativo: 'OPERATIVO'
        }
      } else {
        whereCondition.ubicacionTecnicaId = referenciaId
      }
    } else if (alcance === 'POR_TIPO_EQUIPO' && referenciaId) {
      if (whereCondition.OR) {
        whereCondition = {
          AND: [
            { OR: whereCondition.OR },
            { tipoEquipoId: referenciaId }
          ],
          estadoOperativo: 'OPERATIVO'
        }
      } else {
        whereCondition.tipoEquipoId = referenciaId
      }
    } else if (alcance === 'POR_EQUIPO') {
      if (referenciaId) {
        if (whereCondition.OR) {
          whereCondition = {
            AND: [
              { OR: whereCondition.OR },
              { id: referenciaId }
            ],
            estadoOperativo: 'OPERATIVO'
          }
        } else {
          whereCondition.id = referenciaId
        }
      } else if (referenciaCodigo && referenciaCodigo.trim()) {
        const codigoBuscado = referenciaCodigo.trim()
        const orBusqueda = [
          { codigo: { contains: codigoBuscado, mode: 'insensitive' } },
          { nombre: { contains: codigoBuscado, mode: 'insensitive' } },
          { montacargasDetalle: { identificacionAbreviada: { contains: codigoBuscado, mode: 'insensitive' } } },
          { montacargasDetalle: { denominacion: { contains: codigoBuscado, mode: 'insensitive' } } }
        ]
        if (whereCondition.OR) {
          whereCondition = {
            AND: [
              { OR: whereCondition.OR },
              { OR: orBusqueda }
            ],
            estadoOperativo: 'OPERATIVO'
          }
        } else {
          whereCondition.OR = orBusqueda
        }
      }
    }

    const equipos = await prisma.equipo.findMany({
      where: whereCondition,
      orderBy: [
        { ubicacionTecnica: { codigo: 'asc' } },
        { codigo: 'asc' }
      ],
      include: {
        ubicacionTecnica: {
          select: { id: true, codigo: true, nombre: true, plantaId: true }
        },
        tipoEquipo: {
          select: { id: true, nombre: true },
        },
        montacargasDetalle: true,
        componentes: {
          where: { activo: true },
          orderBy: { ordenPosicion: 'asc' },
          include: {
            variables: {
              where: { activa: true },
              orderBy: { ordenPosicion: 'asc' },
              include: {
                plantilla: {
                  include: {
                    opcionesSeleccion: { orderBy: { ordenPosicion: 'asc' } }
                  }
                },
                opcionesSeleccion: { orderBy: { ordenPosicion: 'asc' } }
              }
            }
          }
        }
      }
    })

    // Cargar las plantillas activas de cada tipoEquipo involucrado
    const tipoEquipoIds = [...new Set(equipos.map((e) => e.tipoEquipoId).filter(Boolean))] as number[]

    const plantillasPorTipo = new Map<number, Map<number, any>>()

    if (tipoEquipoIds.length > 0) {
      const plantillas = await prisma.plantillaVariable.findMany({
        where: { tipoEquipoId: { in: tipoEquipoIds }, activa: true },
        include: { opcionesSeleccion: { orderBy: { ordenPosicion: 'asc' } } },
        orderBy: { ordenPosicion: 'asc' }
      })

      for (const p of plantillas) {
        if (!plantillasPorTipo.has(p.tipoEquipoId)) {
          plantillasPorTipo.set(p.tipoEquipoId, new Map())
        }
        plantillasPorTipo.get(p.tipoEquipoId)!.set(p.id, p)
      }
    }

    return equipos.map((equipo) => {
      const plantillasDelTipo = equipo.tipoEquipoId
        ? plantillasPorTipo.get(equipo.tipoEquipoId)
        : undefined

      const tieneEsquemaDePlantilla = plantillasDelTipo && plantillasDelTipo.size > 0

      const componentesResueltos = equipo.componentes.map((componente) => {
        let variablesResueltas: any[]

        if (tieneEsquemaDePlantilla) {
          // Incluir solo variables que fueron instanciadas desde una plantilla
          // y sobrescribir sus metadatos normativos con los de la plantilla fuente.
          variablesResueltas = componente.variables
            .filter((v) => v.plantillaId !== null && plantillasDelTipo!.has(v.plantillaId!))
            .map((v) => {
              const plantilla = plantillasPorTipo
                .get(equipo.tipoEquipoId!)!
                .get(v.plantillaId!)!

              return {
                id: v.id,
                componenteId: v.componenteId,
                plantillaId: v.plantillaId,
                nombre: plantilla.nombre,
                tipoEvaluacion: plantilla.tipoEvaluacion,
                unidad: plantilla.unidad,
                valorMinimo: plantilla.valorMinimo !== null ? Number(plantilla.valorMinimo) : null,
                valorMaximo: plantilla.valorMaximo !== null ? Number(plantilla.valorMaximo) : null,
                ordenPosicion: plantilla.ordenPosicion,
                activa: v.activa,
                origenNormativo: 'PLANTILLA',
                opcionesSeleccion: plantilla.opcionesSeleccion
              }
            })
        } else {
          // Sin plantilla: usar las variables propias del componente
          variablesResueltas = componente.variables.map((v) => ({
            id: v.id,
            componenteId: v.componenteId,
            plantillaId: v.plantillaId,
            nombre: v.nombre,
            tipoEvaluacion: v.tipoEvaluacion,
            unidad: v.unidad,
            valorMinimo: v.valorMinimo !== null ? Number(v.valorMinimo) : null,
            valorMaximo: v.valorMaximo !== null ? Number(v.valorMaximo) : null,
            ordenPosicion: v.ordenPosicion,
            activa: v.activa,
            origenNormativo: 'VARIABLE_DIRECTA',
            opcionesSeleccion: v.opcionesSeleccion
          }))
        }

        return {
          id: componente.id,
          nombre: componente.nombre,
          descripcion: componente.descripcion,
          activo: componente.activo,
          ordenPosicion: componente.ordenPosicion,
          variables: variablesResueltas
        }
      }).filter((c) => c.variables.length > 0) // Excluir componentes sin variables evaluables

      return {
        id: equipo.id,
        codigo: equipo.codigo,
        nombre: equipo.nombre,
        serial: equipo.serial,
        marca: equipo.marca,
        modelo: equipo.modelo,
        estadoOperativo: equipo.estadoOperativo,
        ubicacionTecnica: equipo.ubicacionTecnica,
        tipoEquipo: equipo.tipoEquipo,
        montacargasDetalle: equipo.montacargasDetalle,
        tieneEsquemaDePlantilla,
        componentes: componentesResueltos
      }
    }).filter((e) => e.componentes.length > 0) // Excluir equipos sin variables evaluables
  }

  /**
   * Registra una nueva inspección elaborada por un técnico.
   */
  async crearInspeccion(elaboradoPorId: number, dto: CrearInspeccionDTO) {
    if (!dto.detalles || dto.detalles.length === 0) {
      throw new AppError('La inspección debe incluir al menos un detalle de evaluación', 400)
    }

    const fechaHoy = new Date()
    const codigoFecha = fechaHoy.toISOString().slice(0, 10).replace(/-/g, '')
    const prefijoPlanta = dto.plantaId ? `PL${dto.plantaId}` : 'GEN'

    // Contar inspecciones de hoy para correlativo secuencial
    const conteoHoy = await prisma.inspeccion.count({
      where: {
        codigoInspeccion: { startsWith: `INSP-${prefijoPlanta}-${codigoFecha}` }
      }
    })
    const secuencial = String(conteoHoy + 1).padStart(4, '0')
    const codigoInspeccion = `INSP-${prefijoPlanta}-${codigoFecha}-${secuencial}`

    const tipoInspeccion: TipoInspeccion = dto.tipoInspeccion ?? 'VARIABLES_CRITICAS'

    return prisma.$transaction(async (tx) => {
      // 1. Crear registro maestro de Inspeccion
      const inspeccion = await tx.inspeccion.create({
        data: {
          codigoInspeccion,
          tipoInspeccion,
          plantaId: dto.plantaId ?? null,
          ubicacionTecnicaId: dto.ubicacionTecnicaId ?? null,
          tipoEquipoId: dto.tipoEquipoId ?? null,
          equipoId: dto.equipoId ?? null,
          elaboradoPorId,
          estadoInspeccion: 'PENDIENTE',
          observacionesGenerales: dto.observacionesGenerales ?? null,
          fechaRegistro: fechaHoy
        }
      })

      // 2. Insertar los detalles evaluados
      await tx.inspeccionDetalle.createMany({
        data: dto.detalles.map((d) => ({
          inspeccionId: inspeccion.id,
          variableId: d.variableId,
          valorNumerico: d.valorNumerico !== undefined && d.valorNumerico !== null ? d.valorNumerico : null,
          valorSeleccion: d.valorSeleccion ?? null,
          observaciones: d.observaciones ?? null,
          estadoComponente: d.estadoComponente ?? true
        }))
      })

      // 3. Notificar al supervisor directo (o de la planta) del técnico
      const supervisorIds = await notificationService.obtenerSupervisoresDestinatarios(
        elaboradoPorId,
        dto.plantaId ?? null,
        tx
      )

      if (supervisorIds.length > 0) {
        await tx.notificacion.createMany({
          data: supervisorIds.map((sId) => ({
            usuarioId: sId,
            tipo: 'WARNING',
            categoria: 'INSPECCION_PENDIENTE',
            titulo: 'Nueva Inspección Pendiente',
            mensaje: `Se ha registrado la inspección ${codigoInspeccion} pendiente de revisión.`,
            entidadAfectada: 'INSPECCION',
            entidadId: String(inspeccion.id)
          }))
        })
      }

      return {
        id: String(inspeccion.id),
        codigoInspeccion: inspeccion.codigoInspeccion,
        estadoInspeccion: inspeccion.estadoInspeccion
      }
    })
  }

  /**
   * Lista todas las inspecciones PENDIENTES de aprobación.
   */
  async obtenerPendientesRevision(plantaId?: number) {
    const inspecciones = await prisma.inspeccion.findMany({
      where: {
        estadoInspeccion: 'PENDIENTE',
        ...(plantaId && { plantaId })
      },
      orderBy: { fechaRegistro: 'desc' },
      include: {
        elaboradoPor: { select: { id: true, nombre: true, apellido: true, email: true } },
        planta: { select: { id: true, codigo: true, nombre: true } },
        ubicacionTecnica: { select: { id: true, codigo: true, nombre: true } },
        tipoEquipo: { select: { id: true, nombre: true } },
        equipo: { select: { id: true, codigo: true, nombre: true } },
        _count: { select: { detalles: true } }
      }
    })

    return inspecciones.map((i) => ({
      ...i,
      id: String(i.id)
    }))
  }

  /**
   * Obtiene una inspección por ID con todos sus detalles evaluados y comparación de rangos.
   */
  async obtenerPorId(idInput: string | number) {
    const id = BigInt(idInput)
    const inspeccion = await prisma.inspeccion.findUnique({
      where: { id },
      include: {
        elaboradoPor: { select: { id: true, nombre: true, apellido: true, email: true } },
        revisadoPor: { select: { id: true, nombre: true, apellido: true } },
        aprobadoPor: { select: { id: true, nombre: true, apellido: true } },
        planta: { select: { id: true, codigo: true, nombre: true } },
        ubicacionTecnica: { select: { id: true, codigo: true, nombre: true } },
        tipoEquipo: { select: { id: true, nombre: true } },
        equipo: { select: { id: true, codigo: true, nombre: true } },
        detalles: {
          include: {
            variable: {
              include: {
                componente: {
                  include: {
                    equipo: { select: { id: true, codigo: true, nombre: true } }
                  }
                },
                opcionesSeleccion: true
              }
            }
          }
        }
      }
    })

    if (!inspeccion) {
      throw new AppError('La inspección solicitada no existe', 404)
    }

    // Transformación de BigInt y evaluación de rangos operativos
    const detallesFormateados = inspeccion.detalles.map((d) => {
      const v = d.variable
      let fueraDeRango = false

      if (
        v.tipoEvaluacion !== 'SELECCION' &&
        d.valorNumerico !== null &&
        d.valorNumerico !== undefined
      ) {
        const val = Number(d.valorNumerico)
        const tieneMin = v.valorMinimo !== null && v.valorMinimo !== undefined
        const tieneMax = v.valorMaximo !== null && v.valorMaximo !== undefined

        if (tieneMin && tieneMax) {
          fueraDeRango = val < Number(v.valorMinimo) || val > Number(v.valorMaximo)
        } else if (tieneMin) {
          fueraDeRango = val < Number(v.valorMinimo)
        } else if (tieneMax) {
          fueraDeRango = val > Number(v.valorMaximo)
        }
      }

      return {
        ...d,
        id: String(d.id),
        inspeccionId: String(d.inspeccionId),
        valorNumerico: d.valorNumerico !== null ? Number(d.valorNumerico) : null,
        fueraDeRango
      }
    })

    return {
      ...inspeccion,
      id: String(inspeccion.id),
      detalles: detallesFormateados
    }
  }

  /**
   * Procesa la decisión de un supervisor (APROBADO o RECHAZADO).
   */
  async evaluarInspeccion(
    idInput: string | number,
    supervisorId: number,
    dto: EvaluarInspeccionDTO
  ) {
    const id = BigInt(idInput)
    const inspeccion = await prisma.inspeccion.findUnique({ where: { id } })

    if (!inspeccion) {
      throw new AppError('Inspección no encontrada', 404)
    }

    if (inspeccion.estadoInspeccion !== 'PENDIENTE') {
      throw new AppError('Solo se pueden evaluar inspecciones en estado PENDIENTE', 400)
    }

    if (dto.estado === 'RECHAZADO' && (!dto.motivoRechazo || !dto.motivoRechazo.trim())) {
      throw new AppError('Debes indicar el motivo del rechazo', 400)
    }

    const ahora = new Date()

    return prisma.$transaction(async (tx) => {
      const actualizada = await tx.inspeccion.update({
        where: { id },
        data: {
          estadoInspeccion: dto.estado,
          revisadoPorId: supervisorId,
          aprobadoPorId: dto.estado === 'APROBADO' ? supervisorId : null,
          motivoRechazo: dto.motivoRechazo ?? null,
          actualizadoEn: ahora
        }
      })

      // Notificar al técnico que elaboró la inspección
      await tx.notificacion.create({
        data: {
          usuarioId: inspeccion.elaboradoPorId,
          tipo: dto.estado === 'APROBADO' ? 'SUCCESS' : 'ERROR',
          categoria: dto.estado === 'APROBADO' ? 'INSPECCION_APROBADA' : 'INSPECCION_RECHAZADA',
          titulo: `Inspección ${dto.estado === 'APROBADO' ? 'Aprobada' : 'Rechazada'}`,
          mensaje: `Tu inspección ${inspeccion.codigoInspeccion} ha sido ${dto.estado === 'APROBADO' ? 'aprobada' : 'rechazada'}. ${dto.motivoRechazo ? `Motivo: ${dto.motivoRechazo}` : ''}`.trim(),
          entidadAfectada: 'INSPECCION',
          entidadId: String(inspeccion.id)
        }
      })

      return {
        id: String(actualizada.id),
        codigoInspeccion: actualizada.codigoInspeccion,
        estadoInspeccion: actualizada.estadoInspeccion
      }
    })
  }

  /**
   * Consulta el historial general de inspecciones con filtrado.
   */
  async obtenerHistorial(filtros: FiltrosInspeccionDTO) {
    const where: any = {}
    if (filtros.plantaId) where.plantaId = filtros.plantaId
    if (filtros.estado) where.estadoInspeccion = filtros.estado
    if (filtros.tipoInspeccion) where.tipoInspeccion = filtros.tipoInspeccion
    if (filtros.elaboradoPorId) where.elaboradoPorId = filtros.elaboradoPorId

    if (filtros.fechaInicio || filtros.fechaFin) {
      where.fechaRegistro = {}
      if (filtros.fechaInicio) where.fechaRegistro.gte = new Date(filtros.fechaInicio)
      if (filtros.fechaFin) where.fechaRegistro.lte = new Date(filtros.fechaFin)
    }

    const inspecciones = await prisma.inspeccion.findMany({
      where,
      orderBy: { fechaRegistro: 'desc' },
      take: 100,
      include: {
        elaboradoPor: { select: { id: true, nombre: true, apellido: true } },
        revisadoPor: { select: { id: true, nombre: true, apellido: true } },
        planta: { select: { id: true, codigo: true, nombre: true } },
        equipo: { select: { id: true, codigo: true, nombre: true } },
        _count: { select: { detalles: true } }
      }
    })

    return inspecciones.map((i) => ({
      ...i,
      id: String(i.id)
    }))
  }

  /**
   * Elimina una inspección física o administrativamente.
   */
  async eliminarInspeccion(idInput: string | number) {
    const id = BigInt(idInput)
    const inspeccion = await prisma.inspeccion.findUnique({ where: { id } })

    if (!inspeccion) {
      throw new AppError('Inspección no encontrada', 404)
    }

    return prisma.inspeccion.delete({
      where: { id }
    })
  }
}

export const inspeccionesService = new InspeccionesService()
