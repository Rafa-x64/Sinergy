import { Request, Response, NextFunction } from 'express'
import { lubricacionService } from './lubricacion.service'
import { ResponseDTO } from '../../core/types/response.dto'
import { parsearId } from '../../core/utils/parsearId'
import {
  CrearLubricanteDTO,
  EditarLubricanteDTO,
  CrearPuntoLubricacionDTO,
  EditarPuntoLubricacionDTO,
  RegistrarHorometroDTO,
  FiltroMatrizDTO,
  RegistrarRutinaDTO,
  FiltroReportesDTO
} from './lubricacion.schemas'

export const lubricacionController = {
  // ─── CATÁLOGO DE LUBRICANTES ───────────────────────────────────────────────

  async listarCatalogos(req: Request, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      let catalogos = await lubricacionService.listarLubricantes(false)

      // Si está completamente vacío, se precarga automáticamente el catálogo base
      if (catalogos.length === 0) {
        await lubricacionService.seedCatalogoInicial()
        catalogos = await lubricacionService.listarLubricantes(false)
      }

      return res.status(200).json({
        status: 'ok',
        message: 'Catálogo de lubricantes obtenido correctamente',
        data: catalogos
      })
    } catch (error) {
      next(error)
    }
  },

  async crearLubricante(req: Request<{}, {}, CrearLubricanteDTO>, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      const { codigo, nombre, marca, tipo, viscosidad, unidadMedida } = req.body

      if (!codigo || typeof codigo !== 'string' || !codigo.trim()) {
        return res.status(400).json({ status: 'error', message: 'El código del lubricante es requerido' })
      }
      if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({ status: 'error', message: 'El nombre del lubricante es requerido' })
      }
      if (!tipo || typeof tipo !== 'string' || !tipo.trim()) {
        return res.status(400).json({ status: 'error', message: 'El tipo de lubricante es requerido' })
      }

      const nuevo = await lubricacionService.crearLubricante({
        codigo,
        nombre,
        marca,
        tipo,
        viscosidad,
        unidadMedida
      })

      return res.status(201).json({
        status: 'ok',
        message: 'Lubricante registrado exitosamente en el catálogo',
        data: nuevo
      })
    } catch (error) {
      next(error)
    }
  },

  async editarLubricante(req: Request<{ id: string }, {}, EditarLubricanteDTO>, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      const id = parsearId(req.params.id)
      if (id === null) {
        return res.status(400).json({ status: 'error', message: 'ID de lubricante inválido' })
      }

      const actualizado = await lubricacionService.editarLubricante(id, req.body)
      return res.status(200).json({
        status: 'ok',
        message: 'Lubricante actualizado correctamente',
        data: actualizado
      })
    } catch (error) {
      next(error)
    }
  },

  // ─── PUNTOS DE LUBRICACIÓN ──────────────────────────────────────────────────

  async listarPuntosPorEquipo(req: Request<{ equipoId: string }>, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      const equipoId = parsearId(req.params.equipoId)
      if (equipoId === null) {
        return res.status(400).json({ status: 'error', message: 'ID de equipo inválido' })
      }

      const puntos = await lubricacionService.listarPuntosPorEquipo(equipoId)
      return res.status(200).json({
        status: 'ok',
        message: 'Puntos de lubricación obtenidos',
        data: puntos
      })
    } catch (error) {
      next(error)
    }
  },

  async crearPuntoLubricacion(req: Request<{}, {}, CrearPuntoLubricacionDTO>, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      const {
        equipoId,
        componenteId,
        lubricanteId,
        nombrePunto,
        limiteHorasCambio,
        horometroUltimoCambio,
        fechaUltimoCambio,
        capacidadRecomendada
      } = req.body

      if (!equipoId || typeof equipoId !== 'number') {
        return res.status(400).json({ status: 'error', message: 'El ID de equipo es requerido y debe ser numérico' })
      }
      if (!lubricanteId || typeof lubricanteId !== 'number') {
        return res.status(400).json({ status: 'error', message: 'El ID del lubricante es requerido y debe ser numérico' })
      }
      if (!nombrePunto || typeof nombrePunto !== 'string' || !nombrePunto.trim()) {
        return res.status(400).json({ status: 'error', message: 'El nombre del punto de lubricación es requerido' })
      }
      if (limiteHorasCambio === undefined || typeof limiteHorasCambio !== 'number' || limiteHorasCambio <= 0) {
        return res.status(400).json({ status: 'error', message: 'El límite de horas de cambio debe ser un número mayor a cero' })
      }
      if (capacidadRecomendada !== undefined && capacidadRecomendada !== null && (typeof capacidadRecomendada !== 'number' || capacidadRecomendada < 0)) {
        return res.status(400).json({ status: 'error', message: 'La capacidad recomendada no puede ser un número negativo' })
      }
      if (horometroUltimoCambio !== undefined && horometroUltimoCambio !== null && (typeof horometroUltimoCambio !== 'number' || horometroUltimoCambio < 0)) {
        return res.status(400).json({ status: 'error', message: 'El horómetro del último cambio no puede ser un número negativo' })
      }

      const nuevoPunto = await lubricacionService.crearPuntoLubricacion({
        equipoId,
        componenteId,
        lubricanteId,
        nombrePunto,
        limiteHorasCambio,
        horometroUltimoCambio,
        fechaUltimoCambio,
        capacidadRecomendada
      })

      return res.status(201).json({
        status: 'ok',
        message: 'Punto de lubricación configurado exitosamente',
        data: nuevoPunto
      })
    } catch (error) {
      next(error)
    }
  },

  async editarPuntoLubricacion(req: Request<{ id: string }, {}, EditarPuntoLubricacionDTO>, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      const id = parsearId(req.params.id)
      if (id === null) {
        return res.status(400).json({ status: 'error', message: 'ID de punto de lubricación inválido' })
      }

      const { limiteHorasCambio, capacidadRecomendada, horometroUltimoCambio } = req.body
      if (limiteHorasCambio !== undefined && (typeof limiteHorasCambio !== 'number' || limiteHorasCambio <= 0)) {
        return res.status(400).json({ status: 'error', message: 'El límite de horas de cambio debe ser mayor a cero' })
      }
      if (capacidadRecomendada !== undefined && capacidadRecomendada !== null && (typeof capacidadRecomendada !== 'number' || capacidadRecomendada < 0)) {
        return res.status(400).json({ status: 'error', message: 'La capacidad recomendada no puede ser negativa' })
      }
      if (horometroUltimoCambio !== undefined && horometroUltimoCambio !== null && (typeof horometroUltimoCambio !== 'number' || horometroUltimoCambio < 0)) {
        return res.status(400).json({ status: 'error', message: 'El horómetro no puede ser negativo' })
      }

      const actualizado = await lubricacionService.editarPuntoLubricacion(id, req.body)
      return res.status(200).json({
        status: 'ok',
        message: 'Punto de lubricación actualizado correctamente',
        data: actualizado
      })
    } catch (error) {
      next(error)
    }
  },

  async eliminarPuntoLubricacion(req: Request<{ id: string }>, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      const id = parsearId(req.params.id)
      if (id === null) {
        return res.status(400).json({ status: 'error', message: 'ID de parte a lubricar inválido' })
      }

      await lubricacionService.eliminarPuntoLubricacion(id)
      return res.status(200).json({
        status: 'ok',
        message: 'Parte a lubricar eliminada o desactivada correctamente'
      })
    } catch (error) {
      next(error)
    }
  },

  // ─── CONTROL DE HORÓMETRO ───────────────────────────────────────────────────

  async registrarHorometro(req: Request<{}, {}, RegistrarHorometroDTO>, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      const { equipoId, valorHorometro, origen, esReemplazoReloj, justificacion } = req.body

      if (!equipoId || typeof equipoId !== 'number') {
        return res.status(400).json({ status: 'error', message: 'El ID de equipo es requerido y debe ser numérico' })
      }
      if (valorHorometro === undefined || typeof valorHorometro !== 'number' || valorHorometro < 0) {
        return res.status(400).json({ status: 'error', message: 'El valor de horómetro debe ser un número igual o mayor a cero' })
      }

      const usuarioId = req.usuario?.sub ? Number(req.usuario.sub) : 0
      if (!usuarioId) {
        return res.status(401).json({ status: 'error', message: 'Usuario no autenticado' })
      }

      const registro = await lubricacionService.registrarLecturaHorometro(
        {
          equipoId,
          valorHorometro,
          origen,
          esReemplazoReloj,
          justificacion
        },
        usuarioId
      )

      return res.status(201).json({
        status: 'ok',
        message: 'Lectura de horómetro registrada correctamente',
        data: registro
      })
    } catch (error) {
      next(error)
    }
  },

  async obtenerUltimoHorometro(req: Request<{ equipoId: string }>, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      const equipoId = parsearId(req.params.equipoId)
      if (equipoId === null) {
        return res.status(400).json({ status: 'error', message: 'ID de equipo inválido' })
      }

      const lectura = await lubricacionService.obtenerUltimoHorometro(equipoId)
      return res.status(200).json({
        status: 'ok',
        message: lectura ? 'Último horómetro encontrado' : 'El equipo aún no cuenta con lecturas de horómetro',
        data: lectura ?? undefined
      })
    } catch (error) {
      next(error)
    }
  },

  // ─── MATRIZ CONSOLIDADA DE LUBRICACIÓN ─────────────────────────────────────

  async obtenerMatriz(req: Request, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      const filtros: FiltroMatrizDTO = {}

      if (req.query.plantaId) {
        const pId = parsearId(String(req.query.plantaId))
        if (pId !== null) filtros.plantaId = pId
      }

      // PBAC: Si el usuario tiene planta asignada y no es administrador, forzar filtro de su planta
      if (req.usuario?.plantaId && (!req.usuario.roles || !req.usuario.roles.includes('ADMINISTRADOR'))) {
        filtros.plantaId = Number(req.usuario.plantaId)
      }

      if (req.query.ubicacionTecnicaId) {
        const uId = parsearId(String(req.query.ubicacionTecnicaId))
        if (uId !== null) filtros.ubicacionTecnicaId = uId
      }

      if (req.query.equipoId) {
        const eId = parsearId(String(req.query.equipoId))
        if (eId !== null) filtros.equipoId = eId
      }

      const matriz = await lubricacionService.obtenerMatriz(filtros)
      return res.status(200).json({
        status: 'ok',
        message: 'Matriz de lubricación y horómetros obtenida correctamente',
        data: matriz
      })
    } catch (error) {
      next(error)
    }
  },

  // ─── REGISTRO DE RUTINA DIARIA ───────────────────────────────────────────────

  async registrarRutina(req: Request<{}, {}, RegistrarRutinaDTO>, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      const { equipoId, horometroRegistrado, esReemplazoReloj, justificacionReemplazo, observaciones, detalles } = req.body

      if (!equipoId || typeof equipoId !== 'number') {
        return res.status(400).json({ status: 'error', message: 'El ID de equipo es requerido y debe ser numérico' })
      }
      if (horometroRegistrado === undefined || typeof horometroRegistrado !== 'number' || horometroRegistrado < 0) {
        return res.status(400).json({ status: 'error', message: 'El horómetro registrado debe ser un número igual o mayor a cero' })
      }
      if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
        return res.status(400).json({ status: 'error', message: 'Debe ingresar al menos un punto de lubricación evaluado en la rutina' })
      }

      for (const det of detalles) {
        if (!det.puntoLubricacionId || typeof det.puntoLubricacionId !== 'number') {
          return res.status(400).json({ status: 'error', message: 'Cada detalle debe incluir un ID de punto de lubricación válido' })
        }
        if (det.cantidadRepuesta !== undefined && det.cantidadRepuesta !== null && (typeof det.cantidadRepuesta !== 'number' || det.cantidadRepuesta < 0)) {
          return res.status(400).json({ status: 'error', message: 'La cantidad repuesta no puede ser un número negativo' })
        }
        if (det.seRealizoReposicion && (det.cantidadRepuesta === undefined || det.cantidadRepuesta === null || det.cantidadRepuesta <= 0)) {
          return res.status(400).json({ status: 'error', message: 'Si se marcó reposición, debe indicar una cantidad mayor a cero' })
        }
      }

      const usuarioId = req.usuario?.sub ? Number(req.usuario.sub) : 0
      if (!usuarioId) {
        return res.status(401).json({ status: 'error', message: 'Usuario no autenticado' })
      }

      const rutina = await lubricacionService.registrarRutina(
        {
          equipoId,
          horometroRegistrado,
          esReemplazoReloj,
          justificacionReemplazo,
          observaciones,
          detalles
        },
        usuarioId
      )

      return res.status(201).json({
        status: 'ok',
        message: 'Rutina de lubricación registrada exitosamente',
        data: rutina
      })
    } catch (error) {
      next(error)
    }
  },

  // ─── REPORTES ANALÍTICOS ───────────────────────────────────────────────────

  async obtenerReporteFugas(req: Request, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      const filtros = parsearFiltrosReportes(req)
      const fugas = await lubricacionService.obtenerReporteFugas(filtros)
      return res.status(200).json({
        status: 'ok',
        message: 'Reporte de fugas obtenido exitosamente',
        data: fugas
      })
    } catch (error) {
      next(error)
    }
  },

  async obtenerReporteConsumo(req: Request, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      const filtros = parsearFiltrosReportes(req)
      const consumo = await lubricacionService.obtenerReporteConsumo(filtros)
      return res.status(200).json({
        status: 'ok',
        message: 'Reporte de consumo de lubricantes obtenido exitosamente',
        data: consumo
      })
    } catch (error) {
      next(error)
    }
  },

  async obtenerHistorialRutinas(req: Request, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      const filtros = parsearFiltrosReportes(req)
      const limite = req.query.limite ? parsearId(String(req.query.limite)) ?? 50 : 50
      const historial = await lubricacionService.obtenerHistorialRutinas(filtros, limite)
      return res.status(200).json({
        status: 'ok',
        message: 'Historial de rutinas de lubricación obtenido exitosamente',
        data: historial
      })
    } catch (error) {
      next(error)
    }
  }
}

function parsearFiltrosReportes(req: Request): FiltroReportesDTO {
  const filtros: FiltroReportesDTO = {}
  if (req.query.plantaId) {
    const pId = parsearId(String(req.query.plantaId))
    if (pId !== null) filtros.plantaId = pId
  }
  if (req.usuario?.plantaId && (!req.usuario.roles || !req.usuario.roles.includes('ADMINISTRADOR'))) {
    filtros.plantaId = Number(req.usuario.plantaId)
  }
  if (req.query.ubicacionTecnicaId) {
    const uId = parsearId(String(req.query.ubicacionTecnicaId))
    if (uId !== null) filtros.ubicacionTecnicaId = uId
  }
  if (req.query.equipoId) {
    const eId = parsearId(String(req.query.equipoId))
    if (eId !== null) filtros.equipoId = eId
  }
  if (req.query.fechaDesde) {
    filtros.fechaDesde = String(req.query.fechaDesde)
  }
  if (req.query.fechaHasta) {
    filtros.fechaHasta = String(req.query.fechaHasta)
  }
  return filtros
}

