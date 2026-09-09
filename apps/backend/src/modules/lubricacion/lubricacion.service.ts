import prisma from '../../core/prisma'
import { AppError } from '../../core/errors/AppError'
import { eventBus } from '../../core/eventBus'
import {
  CrearLubricanteDTO,
  EditarLubricanteDTO,
  CrearPuntoLubricacionDTO,
  EditarPuntoLubricacionDTO,
  RegistrarHorometroDTO,
  FiltroMatrizDTO,
  FilaMatrizLubricacionDTO,
  PuntoMatrizDTO,
  EstadoSemaforoLubricacion,
  RegistrarRutinaDTO,
  FiltroReportesDTO,
  ReporteFugaDTO,
  ReporteConsumoDTO
} from './lubricacion.schemas'
import { Prisma, TipoLubricante, UnidadMedidaLubricante, OrigenLecturaHorometro, NivelLubricante } from '@prisma/client'
import { notificationService } from '../notificaciones/notification.service'

function normalizarNivelLubricante(nivel?: string): NivelLubricante {
  if (!nivel) return NivelLubricante.OK
  const upper = String(nivel).trim().toUpperCase()
  if (upper === 'LLENO') return NivelLubricante.OK
  if (upper === 'MEDIO') return NivelLubricante.BAJO
  if (upper === 'VACIO') return NivelLubricante.CRITICO
  if (Object.values(NivelLubricante).includes(upper as NivelLubricante)) {
    return upper as NivelLubricante
  }
  return NivelLubricante.OK
}

export const lubricacionService = {
  // ─── CATÁLOGO DE LUBRICANTES ───────────────────────────────────────────────

  async listarLubricantes(soloActivos = true) {
    const where: Prisma.CatalogoLubricanteWhereInput = soloActivos ? { activo: true } : {}
    return prisma.catalogoLubricante.findMany({
      where,
      orderBy: { nombre: 'asc' }
    })
  },

  async crearLubricante(dto: CrearLubricanteDTO) {
    const existe = await prisma.catalogoLubricante.findUnique({
      where: { codigo: dto.codigo }
    })

    if (existe) {
      throw new AppError(`Ya existe un lubricante registrado con el código "${dto.codigo}"`, 409)
    }

    return prisma.catalogoLubricante.create({
      data: {
        codigo: dto.codigo.trim().toUpperCase(),
        nombre: dto.nombre.trim(),
        marca: dto.marca ? dto.marca.trim() : null,
        tipo: dto.tipo,
        viscosidad: dto.viscosidad ? dto.viscosidad.trim() : null,
        unidadMedida: dto.unidadMedida ?? UnidadMedidaLubricante.LITROS,
        activo: true
      }
    })
  },

  async editarLubricante(id: number, dto: EditarLubricanteDTO) {
    const lubricante = await prisma.catalogoLubricante.findUnique({ where: { id } })
    if (!lubricante) {
      throw new AppError('Lubricante no encontrado', 404)
    }

    return prisma.catalogoLubricante.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
        ...(dto.marca !== undefined && { marca: dto.marca ? dto.marca.trim() : null }),
        ...(dto.tipo !== undefined && { tipo: dto.tipo }),
        ...(dto.viscosidad !== undefined && { viscosidad: dto.viscosidad ? dto.viscosidad.trim() : null }),
        ...(dto.unidadMedida !== undefined && { unidadMedida: dto.unidadMedida }),
        ...(dto.activo !== undefined && { activo: dto.activo })
      }
    })
  },

  // ─── PUNTOS DE LUBRICACIÓN ──────────────────────────────────────────────────

  async listarPuntosPorEquipo(equipoId: number, soloActivos = true) {
    const equipo = await prisma.equipo.findUnique({ where: { id: equipoId } })
    if (!equipo) {
      throw new AppError('Equipo no encontrado', 404)
    }

    return prisma.puntoLubricacion.findMany({
      where: {
        equipoId,
        ...(soloActivos && { activo: true })
      },
      include: {
        componente: { select: { id: true, nombre: true } },
        lubricante: true
      },
      orderBy: { nombrePunto: 'asc' }
    })
  },

  async crearPuntoLubricacion(dto: CrearPuntoLubricacionDTO) {
    if (dto.limiteHorasCambio <= 0) {
      throw new AppError('El límite de horas de cambio debe ser mayor a cero', 400)
    }
    if (dto.capacidadRecomendada !== undefined && dto.capacidadRecomendada !== null && Number(dto.capacidadRecomendada) < 0) {
      throw new AppError('La capacidad recomendada no puede ser un número negativo', 400)
    }
    if (dto.horometroUltimoCambio !== undefined && dto.horometroUltimoCambio !== null && Number(dto.horometroUltimoCambio) < 0) {
      throw new AppError('El horómetro del último cambio no puede ser un número negativo', 400)
    }

    const equipo = await prisma.equipo.findUnique({ where: { id: dto.equipoId } })
    if (!equipo) {
      throw new AppError('El equipo especificado no existe', 404)
    }

    const lubricante = await prisma.catalogoLubricante.findUnique({ where: { id: dto.lubricanteId } })
    if (!lubricante || !lubricante.activo) {
      throw new AppError('El lubricante seleccionado no existe o está inactivo', 404)
    }

    if (dto.componenteId) {
      const componente = await prisma.componente.findFirst({
        where: { id: dto.componenteId, equipoId: dto.equipoId }
      })
      if (!componente) {
        throw new AppError('El componente no pertenece al equipo seleccionado', 400)
      }
    }

    return prisma.puntoLubricacion.create({
      data: {
        equipoId: dto.equipoId,
        componenteId: dto.componenteId ?? null,
        lubricanteId: dto.lubricanteId,
        nombrePunto: dto.nombrePunto.trim(),
        limiteHorasCambio: new Prisma.Decimal(dto.limiteHorasCambio),
        horometroUltimoCambio: new Prisma.Decimal(dto.horometroUltimoCambio ?? 0),
        fechaUltimoCambio: dto.fechaUltimoCambio ? new Date(dto.fechaUltimoCambio) : null,
        capacidadRecomendada: dto.capacidadRecomendada !== undefined && dto.capacidadRecomendada !== null
          ? new Prisma.Decimal(dto.capacidadRecomendada)
          : null,
        activo: true
      },
      include: {
        componente: { select: { id: true, nombre: true } },
        lubricante: true
      }
    })
  },

  async editarPuntoLubricacion(id: number, dto: EditarPuntoLubricacionDTO) {
    if (dto.limiteHorasCambio !== undefined && dto.limiteHorasCambio <= 0) {
      throw new AppError('El límite de horas de cambio debe ser mayor a cero', 400)
    }
    if (dto.capacidadRecomendada !== undefined && dto.capacidadRecomendada !== null && Number(dto.capacidadRecomendada) < 0) {
      throw new AppError('La capacidad recomendada no puede ser un número negativo', 400)
    }
    if (dto.horometroUltimoCambio !== undefined && dto.horometroUltimoCambio !== null && Number(dto.horometroUltimoCambio) < 0) {
      throw new AppError('El horómetro del último cambio no puede ser un número negativo', 400)
    }

    const punto = await prisma.puntoLubricacion.findUnique({ where: { id } })
    if (!punto) {
      throw new AppError('Punto de lubricación no encontrado', 404)
    }

    if (dto.lubricanteId) {
      const lubricante = await prisma.catalogoLubricante.findUnique({ where: { id: dto.lubricanteId } })
      if (!lubricante) {
        throw new AppError('El lubricante seleccionado no existe', 404)
      }
    }

    return prisma.puntoLubricacion.update({
      where: { id },
      data: {
        ...(dto.componenteId !== undefined && { componenteId: dto.componenteId }),
        ...(dto.lubricanteId !== undefined && { lubricanteId: dto.lubricanteId }),
        ...(dto.nombrePunto !== undefined && { nombrePunto: dto.nombrePunto.trim() }),
        ...(dto.limiteHorasCambio !== undefined && { limiteHorasCambio: new Prisma.Decimal(dto.limiteHorasCambio) }),
        ...(dto.horometroUltimoCambio !== undefined && { horometroUltimoCambio: new Prisma.Decimal(dto.horometroUltimoCambio) }),
        ...(dto.fechaUltimoCambio !== undefined && { fechaUltimoCambio: dto.fechaUltimoCambio ? new Date(dto.fechaUltimoCambio) : null }),
        ...(dto.capacidadRecomendada !== undefined && {
          capacidadRecomendada: dto.capacidadRecomendada !== null ? new Prisma.Decimal(dto.capacidadRecomendada) : null
        }),
        ...(dto.activo !== undefined && { activo: dto.activo })
      },
      include: {
        componente: { select: { id: true, nombre: true } },
        lubricante: true
      }
    })
  },

  async eliminarPuntoLubricacion(id: number) {
    const punto = await prisma.puntoLubricacion.findUnique({
      where: { id },
      include: { detallesRutina: { select: { id: true } } }
    })
    if (!punto) {
      throw new AppError('Parte a lubricar no encontrada', 404)
    }

    // Si tiene registros históricos de rutina, aplicamos desactivación lógica (soft delete)
    if (punto.detallesRutina && punto.detallesRutina.length > 0) {
      return prisma.puntoLubricacion.update({
        where: { id },
        data: { activo: false }
      })
    }

    // Si es un punto recién creado sin historial, eliminación física segura
    return prisma.puntoLubricacion.delete({
      where: { id }
    })
  },

  // ─── CONTROL DE HORÓMETROS Y ANTI-RETROCESO ─────────────────────────────────

  async registrarLecturaHorometro(dto: RegistrarHorometroDTO, usuarioId: number) {
    const nuevoHorometro = Number(dto.valorHorometro)
    if (isNaN(nuevoHorometro) || nuevoHorometro < 0) {
      throw new AppError('El valor del horómetro no puede ser negativo ni inválido', 400)
    }

    const equipo = await prisma.equipo.findUnique({ where: { id: dto.equipoId } })
    if (!equipo) {
      throw new AppError('El equipo especificado no existe', 404)
    }

    // Obtener la última lectura registrada para validar retrocesos
    const ultimaLectura = await prisma.historialHorometro.findFirst({
      where: { equipoId: dto.equipoId },
      orderBy: { id: 'desc' }
    })

    if (ultimaLectura) {
      const ultimoHorometro = Number(ultimaLectura.valorHorometro)
      if (nuevoHorometro < ultimoHorometro && !dto.esReemplazoReloj) {
        throw new AppError(
          `Lectura inválida: El nuevo horómetro (${nuevoHorometro}) no puede ser menor al último registrado (${ultimoHorometro}) a menos que se declare reemplazo físico del reloj odómetro.`,
          400
        )
      }

      if (dto.esReemplazoReloj && (!dto.justificacion || !dto.justificacion.trim())) {
        throw new AppError(
          'Es obligatorio ingresar una justificación técnica cuando se declara reemplazo de reloj odómetro.',
          400
        )
      }
    }

    const registro = await prisma.historialHorometro.create({
      data: {
        equipoId: dto.equipoId,
        valorHorometro: new Prisma.Decimal(nuevoHorometro),
        fechaLectura: new Date(),
        origen: dto.origen ?? OrigenLecturaHorometro.LECTURA_MANUAL,
        registradoPorId: usuarioId,
        esReemplazoReloj: Boolean(dto.esReemplazoReloj),
        justificacion: dto.justificacion ? dto.justificacion.trim() : null
      }
    })

    return {
      ...registro,
      id: Number(registro.id),
      valorHorometro: Number(registro.valorHorometro)
    }
  },

  async obtenerUltimoHorometro(equipoId: number) {
    const ultima = await prisma.historialHorometro.findFirst({
      where: { equipoId },
      orderBy: { id: 'desc' }
    })

    if (!ultima) return null

    return {
      ...ultima,
      id: Number(ultima.id),
      valorHorometro: Number(ultima.valorHorometro)
    }
  },

  // ─── MATRIZ CONSOLIDADA DE LUBRICACIÓN Y HORÓMETROS ─────────────────────────

  async obtenerMatriz(filtros: FiltroMatrizDTO): Promise<FilaMatrizLubricacionDTO[]> {
    const whereEquipo: Prisma.EquipoWhereInput = {
      estadoOperativo: 'OPERATIVO',
      ...(filtros.equipoId && { id: filtros.equipoId }),
      ...(filtros.ubicacionTecnicaId && { ubicacionTecnicaId: filtros.ubicacionTecnicaId }),
      ...(filtros.plantaId && { ubicacionTecnica: { plantaId: filtros.plantaId } })
    }

    const equipos = await prisma.equipo.findMany({
      where: whereEquipo,
      include: {
        ubicacionTecnica: {
          include: {
            planta: { select: { nombre: true } }
          }
        },
        puntosLubricacion: {
          where: { activo: true },
          include: {
            componente: { select: { id: true, nombre: true } },
            lubricante: true
          }
        },
        historialHorometros: {
          orderBy: { id: 'desc' },
          take: 1
        }
      },
      orderBy: [
        { ubicacionTecnica: { codigo: 'asc' } },
        { codigo: 'asc' }
      ]
    })

    const matriz: FilaMatrizLubricacionDTO[] = []

    for (const eq of equipos) {
      // Si el equipo no tiene puntos de lubricación configurados, se omiten o se listan con puntos vacíos
      const ultimoHorometro = eq.historialHorometros[0]
      const horometroActual = ultimoHorometro ? Number(ultimoHorometro.valorHorometro) : 0
      const fechaUltimoHorometro = ultimoHorometro ? ultimoHorometro.fechaLectura.toISOString() : null

      const puntosMatriz: PuntoMatrizDTO[] = eq.puntosLubricacion.map((p) => {
        const limite = Number(p.limiteHorasCambio) > 0 ? Number(p.limiteHorasCambio) : 1
        const ultimoCambio = Number(p.horometroUltimoCambio)
        const horasUsoActual = Math.max(0, horometroActual - ultimoCambio)
        const porcentajeVidaUtil = Math.min(999, Math.round((horasUsoActual / limite) * 100))

        let estadoSemaforo: EstadoSemaforoLubricacion = 'NORMAL'
        if (porcentajeVidaUtil >= 100) {
          estadoSemaforo = 'CRITICO'
        } else if (porcentajeVidaUtil >= 80) {
          estadoSemaforo = 'PREVENTIVO'
        }

        return {
          id: p.id,
          nombrePunto: p.nombrePunto,
          componenteId: p.componenteId ?? null,
          componenteNombre: p.componente?.nombre ?? null,
          lubricante: {
            id: p.lubricante.id,
            codigo: p.lubricante.codigo,
            nombre: p.lubricante.nombre,
            tipo: p.lubricante.tipo,
            viscosidad: p.lubricante.viscosidad,
            unidadMedida: p.lubricante.unidadMedida
          },
          limiteHorasCambio: limite,
          horometroUltimoCambio: ultimoCambio,
          fechaUltimoCambio: p.fechaUltimoCambio ? p.fechaUltimoCambio.toISOString() : null,
          capacidadRecomendada: p.capacidadRecomendada ? Number(p.capacidadRecomendada) : null,
          horasUsoActual,
          porcentajeVidaUtil,
          estadoSemaforo
        }
      })

      matriz.push({
        equipoId: eq.id,
        equipoCodigo: eq.codigo,
        equipoNombre: eq.nombre,
        plantaNombre: eq.ubicacionTecnica.planta.nombre,
        ubicacionNombre: eq.ubicacionTecnica.nombre,
        horometroActual,
        fechaUltimoHorometro,
        puntos: puntosMatriz
      })
    }

    return matriz
  },

  // ─── SEED INICIAL DE LUBRICANTES INDUSTRIALES ───────────────────────────────

  async seedCatalogoInicial() {
    const conteo = await prisma.catalogoLubricante.count()
    if (conteo > 0) return { mensaje: 'Catálogo ya cuenta con registros', total: conteo }

    const lubricantesBase: Prisma.CatalogoLubricanteCreateInput[] = [
      {
        codigo: 'MOBIL-DTE-24',
        nombre: 'Mobil DTE 24',
        marca: 'Mobil',
        tipo: TipoLubricante.ACEITE,
        viscosidad: 'ISO VG 32',
        unidadMedida: UnidadMedidaLubricante.LITROS
      },
      {
        codigo: 'MOBIL-DTE-25',
        nombre: 'Mobil DTE 25',
        marca: 'Mobil',
        tipo: TipoLubricante.ACEITE,
        viscosidad: 'ISO VG 46',
        unidadMedida: UnidadMedidaLubricante.LITROS
      },
      {
        codigo: 'MOBIL-DTE-26',
        nombre: 'Mobil DTE 26',
        marca: 'Mobil',
        tipo: TipoLubricante.ACEITE,
        viscosidad: 'ISO VG 68',
        unidadMedida: UnidadMedidaLubricante.LITROS
      },
      {
        codigo: 'MOBILGEAR-600-220',
        nombre: 'Mobilgear 600 XP 220',
        marca: 'Mobil',
        tipo: TipoLubricante.ACEITE,
        viscosidad: 'ISO VG 220',
        unidadMedida: UnidadMedidaLubricante.LITROS
      },
      {
        codigo: 'SHELL-GADUS-S2',
        nombre: 'Shell Gadus S2 V220 2',
        marca: 'Shell',
        tipo: TipoLubricante.GRASA,
        viscosidad: 'NLGI 2',
        unidadMedida: UnidadMedidaLubricante.KILOGRAMOS
      },
      {
        codigo: 'MOBILITH-SHC-220',
        nombre: 'Mobilith SHC 220',
        marca: 'Mobil',
        tipo: TipoLubricante.GRASA,
        viscosidad: 'NLGI 2',
        unidadMedida: UnidadMedidaLubricante.KILOGRAMOS
      }
    ]

    await prisma.catalogoLubricante.createMany({
      data: lubricantesBase
    })

    return { mensaje: 'Catálogo inicial de lubricantes insertado exitosamente', total: lubricantesBase.length }
  },

  // ─── REGISTRO DE RUTINA DE LUBRICACIÓN Y HORÓMETROS ─────────────────────────

  async registrarRutina(dto: RegistrarRutinaDTO, usuarioId: number) {
    if (!dto.detalles || dto.detalles.length === 0) {
      throw new AppError('La rutina debe incluir al menos un punto de lubricación evaluado', 400)
    }

    const nuevoHorometro = Number(dto.horometroRegistrado)
    if (isNaN(nuevoHorometro) || nuevoHorometro < 0) {
      throw new AppError('El horómetro registrado no puede ser negativo ni inválido', 400)
    }

    // Validación anti-negativos para cada punto evaluado
    for (const det of dto.detalles) {
      if (det.cantidadRepuesta !== undefined && det.cantidadRepuesta !== null && Number(det.cantidadRepuesta) < 0) {
        throw new AppError('La cantidad repuesta no puede ser un número negativo', 400)
      }
      if (det.seRealizoReposicion && (det.cantidadRepuesta === undefined || det.cantidadRepuesta === null || Number(det.cantidadRepuesta) <= 0)) {
        throw new AppError('Si se indicó reposición de lubricante, la cantidad debe ser mayor a 0', 400)
      }
    }

    const equipo = await prisma.equipo.findUnique({
      where: { id: dto.equipoId },
      include: {
        ubicacionTecnica: true,
        puntosLubricacion: { where: { activo: true }, include: { lubricante: true } }
      }
    })

    if (!equipo) {
      throw new AppError('El equipo especificado no existe', 404)
    }

    // Validación anti-retroceso de horómetro
    const ultimaLectura = await prisma.historialHorometro.findFirst({
      where: { equipoId: dto.equipoId },
      orderBy: { id: 'desc' }
    })

    if (ultimaLectura) {
      const ultimoHorometro = Number(ultimaLectura.valorHorometro)
      if (nuevoHorometro < ultimoHorometro && !dto.esReemplazoReloj) {
        throw new AppError(
          `Lectura inválida: El nuevo horómetro (${nuevoHorometro}) no puede ser menor al último registrado (${ultimoHorometro}) a menos que se declare reemplazo de reloj.`,
          400
        )
      }
      if (dto.esReemplazoReloj && (!dto.justificacionReemplazo || !dto.justificacionReemplazo.trim())) {
        throw new AppError('Es obligatorio ingresar una justificación técnica para el reemplazo de reloj odómetro.', 400)
      }
    }

    const codigoRutina = `RUT-LUB-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`

    // Ejecución atómica de la rutina completa
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Registrar lectura en historial de horómetros
      await tx.historialHorometro.create({
        data: {
          equipoId: dto.equipoId,
          valorHorometro: new Prisma.Decimal(nuevoHorometro),
          fechaLectura: new Date(),
          origen: OrigenLecturaHorometro.RUTINA_LUBRICACION,
          registradoPorId: usuarioId,
          esReemplazoReloj: Boolean(dto.esReemplazoReloj),
          justificacion: dto.justificacionReemplazo ? dto.justificacionReemplazo.trim() : null
        }
      })

      // 2. Crear cabecera de la rutina en el módulo de lubricación
      const rutina = await tx.rutinaLubricacion.create({
        data: {
          codigoRutina,
          plantaId: equipo.ubicacionTecnica.plantaId,
          ubicacionTecnicaId: equipo.ubicacionTecnicaId,
          equipoId: dto.equipoId,
          elaboradoPorId: usuarioId,
          fechaEjecucion: new Date(),
          horometroRegistrado: new Prisma.Decimal(nuevoHorometro),
          observaciones: dto.observaciones ? dto.observaciones.trim() : null
        }
      })

      // 3. Crear detalles y actualizar puntos si hubo cambio total
      for (const det of dto.detalles) {
        await tx.rutinaLubricacionDetalle.create({
          data: {
            rutinaId: rutina.id,
            puntoLubricacionId: det.puntoLubricacionId,
            nivelLubricante: normalizarNivelLubricante(det.nivelLubricante),
            seRealizoReposicion: Boolean(det.seRealizoReposicion),
            cantidadRepuesta: det.cantidadRepuesta !== undefined && det.cantidadRepuesta !== null
              ? new Prisma.Decimal(det.cantidadRepuesta)
              : null,
            seRealizoCambioTotal: Boolean(det.seRealizoCambioTotal),
            presentaFuga: Boolean(det.presentaFuga),
            observaciones: det.observaciones ? det.observaciones.trim() : null
          }
        })

        // Si se realizó cambio total, se reinicia el horómetro del último cambio a la lectura actual
        if (det.seRealizoCambioTotal) {
          await tx.puntoLubricacion.update({
            where: { id: det.puntoLubricacionId },
            data: {
              horometroUltimoCambio: new Prisma.Decimal(nuevoHorometro),
              fechaUltimoCambio: new Date()
            }
          })
        }
      }

      // 4. Crear cabecera en la tabla 'inspecciones' para que aparezca en la Bandeja de Aprobaciones
      const fechaHoy = new Date()
      const codigoFecha = fechaHoy.toISOString().slice(0, 10).replace(/-/g, '')
      const prefijoPlanta = equipo.ubicacionTecnica?.plantaId ? `PL${equipo.ubicacionTecnica.plantaId}` : 'GEN'
      const conteoHoy = await tx.inspeccion.count({
        where: {
          codigoInspeccion: { startsWith: `INSP-LUB-${prefijoPlanta}-${codigoFecha}` }
        }
      })
      const secuencial = String(conteoHoy + 1).padStart(4, '0')
      const codigoInspeccion = `INSP-LUB-${prefijoPlanta}-${codigoFecha}-${secuencial}`

      const resumenPuntos = dto.detalles.map((d) => {
        const p = equipo.puntosLubricacion.find((item) => item.id === d.puntoLubricacionId)
        const pNombre = p ? p.nombrePunto : `Punto #${d.puntoLubricacionId}`
        const partes: string[] = [`Nivel: ${d.nivelLubricante || 'OK'}`]
        if (d.seRealizoReposicion) {
          partes.push(`Reposición: ${d.cantidadRepuesta} ${p?.lubricante?.unidadMedida || 'und'}`)
        }
        if (d.seRealizoCambioTotal) {
          partes.push('CAMBIO TOTAL')
        }
        if (d.presentaFuga) {
          partes.push('FUGA DETECTADA')
        }
        if (d.observaciones) {
          partes.push(`Observación: ${d.observaciones}`)
        }
        return `• ${pNombre}: ${partes.join(', ')}`
      }).join('\n')

      const observacionesGenerales = [
        `[RUTINA DE LUBRICACIÓN Y HORÓMETROS - ${equipo.codigo} - ${equipo.nombre}]`,
        `Horómetro Registrado: ${nuevoHorometro} hrs${dto.esReemplazoReloj ? ` (REEMPLAZO DE RELOJ JUSTIFICADO: ${dto.justificacionReemplazo})` : ''}`,
        dto.observaciones ? `Observaciones del Técnico: ${dto.observaciones}` : null,
        `Resumen de Puntos Evaluados (${dto.detalles.length}):`,
        resumenPuntos
      ].filter(Boolean).join('\n')

      const nuevaInspeccion = await tx.inspeccion.create({
        data: {
          codigoInspeccion,
          tipoInspeccion: 'VARIABLES_CRITICAS',
          plantaId: equipo.ubicacionTecnica?.plantaId ?? null,
          ubicacionTecnicaId: equipo.ubicacionTecnicaId,
          tipoEquipoId: equipo.tipoEquipoId,
          equipoId: dto.equipoId,
          elaboradoPorId: usuarioId,
          estadoInspeccion: 'PENDIENTE',
          observacionesGenerales,
          fechaRegistro: fechaHoy
        }
      })

      // 5. Notificar al supervisor directo (o de la planta) de la nueva inspección pendiente
      const supervisorIds = await notificationService.obtenerSupervisoresDestinatarios(
        usuarioId,
        equipo.ubicacionTecnica?.plantaId ?? null,
        tx
      )

      if (supervisorIds.length > 0) {
        await tx.notificacion.createMany({
          data: supervisorIds.map((sId) => ({
            usuarioId: sId,
            tipo: 'WARNING',
            categoria: 'INSPECCION_PENDIENTE',
            titulo: 'Nueva Rutina de Lubricación Pendiente',
            mensaje: `Se ha registrado la rutina de lubricación ${codigoInspeccion} para el equipo ${equipo.codigo} (${equipo.nombre}) pendiente de revisión.`,
            entidadAfectada: 'INSPECCION',
            entidadId: String(nuevaInspeccion.id)
          }))
        })
      }

      return rutina
    })

    // Emisión de eventos en tiempo real fuera de la transacción para no bloquear la BD
    for (const det of dto.detalles) {
      const punto = equipo.puntosLubricacion.find((p) => p.id === det.puntoLubricacionId)
      if (!punto) continue

      // Alerta de fuga detectada
      if (det.presentaFuga) {
        eventBus.emit('LUBRICACION_FUGA_DETECTADA', {
          rutinaId: String(resultado.id),
          equipoId: equipo.id,
          equipoCodigo: equipo.codigo,
          puntoId: punto.id,
          puntoNombre: punto.nombrePunto,
          plantaId: equipo.ubicacionTecnica.plantaId,
          tecnicoId: usuarioId
        })
      }

      // Alerta de límite de horas alcanzado
      const ultimoCambio = det.seRealizoCambioTotal ? nuevoHorometro : Number(punto.horometroUltimoCambio)
      const horasUso = Math.max(0, nuevoHorometro - ultimoCambio)
      const limite = Number(punto.limiteHorasCambio) > 0 ? Number(punto.limiteHorasCambio) : 1
      const pct = (horasUso / limite) * 100

      if (pct >= 80) {
        eventBus.emit('LUBRICACION_HOROMETRO_LIMITE', {
          equipoId: equipo.id,
          equipoCodigo: equipo.codigo,
          puntoId: punto.id,
          puntoNombre: punto.nombrePunto,
          plantaId: equipo.ubicacionTecnica.plantaId,
          horasUso,
          limiteHoras: limite,
          nivelAlerta: pct >= 100 ? 'CRITICO' : 'PREVENTIVO'
        })
      }
    }

    return {
      id: Number(resultado.id),
      codigoRutina: resultado.codigoRutina,
      equipoId: resultado.equipoId,
      fechaEjecucion: resultado.fechaEjecucion,
      horometroRegistrado: Number(resultado.horometroRegistrado)
    }
  },

  // ─── REPORTES ANALÍTICOS DE LUBRICACIÓN ─────────────────────────────────────

  async obtenerReporteFugas(filtros: FiltroReportesDTO): Promise<ReporteFugaDTO[]> {
    const where: Prisma.RutinaLubricacionDetalleWhereInput = {
      presentaFuga: true,
      ...(filtros.plantaId && { rutina: { plantaId: filtros.plantaId } }),
      ...(filtros.ubicacionTecnicaId && { rutina: { ubicacionTecnicaId: filtros.ubicacionTecnicaId } }),
      ...(filtros.equipoId && { rutina: { equipoId: filtros.equipoId } }),
      ...(filtros.fechaDesde || filtros.fechaHasta
        ? {
            rutina: {
              fechaEjecucion: {
                ...(filtros.fechaDesde && { gte: new Date(filtros.fechaDesde) }),
                ...(filtros.fechaHasta && { lte: new Date(filtros.fechaHasta) })
              }
            }
          }
        : {})
    }

    const fugas = await prisma.rutinaLubricacionDetalle.findMany({
      where,
      include: {
        rutina: {
          include: {
            planta: { select: { nombre: true } },
            ubicacionTecnica: { select: { nombre: true } },
            equipo: { select: { id: true, codigo: true, nombre: true } }
          }
        },
        puntoLubricacion: {
          include: {
            lubricante: { select: { nombre: true } }
          }
        }
      },
      orderBy: { rutina: { fechaEjecucion: 'desc' } },
      take: 100
    })

    return fugas.map((f) => ({
      rutinaId: String(f.rutinaId),
      codigoRutina: f.rutina.codigoRutina,
      fechaEjecucion: f.rutina.fechaEjecucion.toISOString(),
      equipoId: f.rutina.equipo.id,
      equipoCodigo: f.rutina.equipo.codigo,
      equipoNombre: f.rutina.equipo.nombre,
      plantaNombre: f.rutina.planta.nombre,
      ubicacionNombre: f.rutina.ubicacionTecnica.nombre,
      puntoId: f.puntoLubricacionId,
      puntoNombre: f.puntoLubricacion.nombrePunto,
      lubricanteNombre: f.puntoLubricacion.lubricante.nombre,
      observaciones: f.observaciones
    }))
  },

  async obtenerReporteConsumo(filtros: FiltroReportesDTO): Promise<ReporteConsumoDTO[]> {
    const where: Prisma.RutinaLubricacionDetalleWhereInput = {
      seRealizoReposicion: true,
      cantidadRepuesta: { gt: 0 },
      ...(filtros.plantaId && { rutina: { plantaId: filtros.plantaId } }),
      ...(filtros.ubicacionTecnicaId && { rutina: { ubicacionTecnicaId: filtros.ubicacionTecnicaId } }),
      ...(filtros.equipoId && { rutina: { equipoId: filtros.equipoId } }),
      ...(filtros.fechaDesde || filtros.fechaHasta
        ? {
            rutina: {
              fechaEjecucion: {
                ...(filtros.fechaDesde && { gte: new Date(filtros.fechaDesde) }),
                ...(filtros.fechaHasta && { lte: new Date(filtros.fechaHasta) })
              }
            }
          }
        : {})
    }

    const reposiciones = await prisma.rutinaLubricacionDetalle.findMany({
      where,
      include: {
        puntoLubricacion: {
          include: {
            lubricante: true
          }
        }
      }
    })

    const mapaConsumo = new Map<number, ReporteConsumoDTO>()

    for (const rep of reposiciones) {
      const lub = rep.puntoLubricacion.lubricante
      const cant = Number(rep.cantidadRepuesta ?? 0)

      const existente = mapaConsumo.get(lub.id)
      if (existente) {
        existente.totalRepuesto += cant
        existente.intervenciones += 1
      } else {
        mapaConsumo.set(lub.id, {
          lubricanteId: lub.id,
          lubricanteCodigo: lub.codigo,
          lubricanteNombre: lub.nombre,
          tipo: lub.tipo,
          unidadMedida: lub.unidadMedida,
          totalRepuesto: cant,
          intervenciones: 1
        })
      }
    }

    return Array.from(mapaConsumo.values())
  },

  async obtenerHistorialRutinas(filtros: FiltroReportesDTO, limite = 50) {
    const where: Prisma.RutinaLubricacionWhereInput = {
      ...(filtros.plantaId && { plantaId: filtros.plantaId }),
      ...(filtros.ubicacionTecnicaId && { ubicacionTecnicaId: filtros.ubicacionTecnicaId }),
      ...(filtros.equipoId && { equipoId: filtros.equipoId }),
      ...(filtros.fechaDesde || filtros.fechaHasta
        ? {
            fechaEjecucion: {
              ...(filtros.fechaDesde && { gte: new Date(filtros.fechaDesde) }),
              ...(filtros.fechaHasta && { lte: new Date(filtros.fechaHasta) })
            }
          }
        : {})
    }

    const rutinas = await prisma.rutinaLubricacion.findMany({
      where,
      include: {
        planta: { select: { nombre: true } },
        ubicacionTecnica: { select: { nombre: true } },
        equipo: { select: { id: true, codigo: true, nombre: true } },
        elaboradoPor: { select: { id: true, nombre: true, apellido: true } },
        detalles: {
          include: {
            puntoLubricacion: {
              select: {
                nombrePunto: true,
                lubricante: { select: { nombre: true, unidadMedida: true } }
              }
            }
          }
        }
      },
      orderBy: { fechaEjecucion: 'desc' },
      take: limite
    })

    return rutinas.map((r) => ({
      id: Number(r.id),
      codigoRutina: r.codigoRutina,
      plantaNombre: r.planta.nombre,
      ubicacionNombre: r.ubicacionTecnica.nombre,
      equipoCodigo: r.equipo.codigo,
      equipoNombre: r.equipo.nombre,
      elaboradoPor: `${r.elaboradoPor.nombre} ${r.elaboradoPor.apellido}`,
      fechaEjecucion: r.fechaEjecucion.toISOString(),
      horometroRegistrado: Number(r.horometroRegistrado),
      observaciones: r.observaciones,
      totalPuntosEvaluados: r.detalles.length,
      detalles: r.detalles.map((d) => ({
        id: Number(d.id),
        puntoNombre: d.puntoLubricacion.nombrePunto,
        lubricanteNombre: d.puntoLubricacion.lubricante.nombre,
        unidadMedida: d.puntoLubricacion.lubricante.unidadMedida,
        nivelLubricante: d.nivelLubricante,
        seRealizoReposicion: d.seRealizoReposicion,
        cantidadRepuesta: d.cantidadRepuesta ? Number(d.cantidadRepuesta) : null,
        seRealizoCambioTotal: d.seRealizoCambioTotal,
        presentaFuga: d.presentaFuga,
        observaciones: d.observaciones
      }))
    }))
  }
}
