import { Request, Response, NextFunction } from 'express'
import { ResponseDTO } from '../../core/types/response.dto'
import { RegistrarVariableDTO, EditarVariableDTO } from './variable-critica.schemas'
import { variableCriticaService } from './variable-critica.service'
import { parsearId } from '../../core/utils/parsearId'
import { capitalizarPalabras } from '../../core/utils/capitalizarPalabras'
import { Prisma, TipoEvaluacion } from '@prisma/client'

// Valores válidos del enum para reutilizar en validaciones y mensajes de error
const TIPOS_EVALUACION_VALIDOS = Object.values(TipoEvaluacion)

export const variableCriticaController = {
  //------------------------------------------------------REGISTRAR-------------------------------------------------------
  async registrarVariable(
    req: Request<unknown, ResponseDTO, RegistrarVariableDTO>,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const { componenteId, nombre, tipoEvaluacion, unidad, valorMinimo, valorMaximo, ordenPosicion, opciones } = req.body

      if (typeof componenteId !== 'number') {
        return res.status(400).json({ status: 'error', message: 'El ID del componente es requerido y debe ser un número' })
      }

      // Verificación de existencia antes de persistir para devolver 404 en lugar de P2003
      const existeComp = await variableCriticaService.existeComponente(componenteId)
      if (!existeComp) {
        return res.status(404).json({ status: 'error', message: `El componente con ID ${componenteId} no existe o está inactivo` })
      }

      if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({ status: 'error', message: 'El nombre es requerido' })
      }

      if (nombre.trim().length > 255) {
        return res.status(400).json({ status: 'error', message: 'El nombre no puede superar los 255 caracteres' })
      }

      if (!tipoEvaluacion || !TIPOS_EVALUACION_VALIDOS.includes(tipoEvaluacion)) {
        return res.status(400).json({
          status: 'error',
          message: `El tipo de evaluación es requerido. Valores permitidos: ${TIPOS_EVALUACION_VALIDOS.join(', ')}`
        })
      }

      if (unidad !== undefined && unidad !== null && typeof unidad !== 'string') {
        return res.status(400).json({ status: 'error', message: 'La unidad debe ser texto' })
      }

      if (unidad && typeof unidad === 'string' && unidad.trim().length > 20) {
        return res.status(400).json({ status: 'error', message: 'La unidad no puede superar los 20 caracteres' })
      }

      if (valorMinimo !== undefined && valorMinimo !== null && typeof valorMinimo !== 'number') {
        return res.status(400).json({ status: 'error', message: 'El valor mínimo debe ser un número' })
      }

      if (valorMaximo !== undefined && valorMaximo !== null && typeof valorMaximo !== 'number') {
        return res.status(400).json({ status: 'error', message: 'El valor máximo debe ser un número' })
      }

      // Los rangos solo aplican para variables numéricas
      if (valorMinimo !== undefined && valorMaximo !== undefined && valorMinimo !== null && valorMaximo !== null) {
        if (valorMinimo > valorMaximo) {
          return res.status(400).json({ status: 'error', message: 'El valor mínimo no puede ser mayor que el valor máximo' })
        }
      }

      if (ordenPosicion !== undefined && typeof ordenPosicion !== 'number') {
        return res.status(400).json({ status: 'error', message: 'El orden de posición debe ser un número' })
      }

      // Validación de opciones — solo aplica al tipo SELECCION
      if (tipoEvaluacion === TipoEvaluacion.SELECCION) {
        if (!Array.isArray(opciones) || opciones.length === 0) {
          return res.status(400).json({
            status: 'error',
            message: 'Las variables de tipo SELECCION deben incluir al menos una opción en el campo "opciones"'
          })
        }

        // Verificar la estructura de cada opción individual
        for (let i = 0; i < opciones.length; i++) {
          const opcion = opciones[i]

          if (!opcion.clave || typeof opcion.clave !== 'string' || !opcion.clave.trim()) {
            return res.status(400).json({
              status: 'error',
              message: `La opción en la posición ${i} debe incluir una clave válida`
            })
          }

          if (opcion.clave.trim().length > 10) {
            return res.status(400).json({
              status: 'error',
              message: `La clave de la opción en la posición ${i} no puede superar los 10 caracteres`
            })
          }

          if (!opcion.etiqueta || typeof opcion.etiqueta !== 'string' || !opcion.etiqueta.trim()) {
            return res.status(400).json({
              status: 'error',
              message: `La opción en la posición ${i} debe incluir una etiqueta válida`
            })
          }

          if (opcion.etiqueta.trim().length > 100) {
            return res.status(400).json({
              status: 'error',
              message: `La etiqueta de la opción en la posición ${i} no puede superar los 100 caracteres`
            })
          }

          if (opcion.ordenPosicion !== undefined && typeof opcion.ordenPosicion !== 'number') {
            return res.status(400).json({
              status: 'error',
              message: `El orden de la opción en la posición ${i} debe ser un número`
            })
          }
        }

        // Detectar claves duplicadas dentro del mismo payload antes de llegar a Prisma
        const claves = opciones.map(o => o.clave.trim().toUpperCase())
        const clavesUnicas = new Set(claves)
        if (clavesUnicas.size !== claves.length) {
          return res.status(400).json({
            status: 'error',
            message: 'Las claves de las opciones no pueden repetirse dentro de la misma variable'
          })
        }
      } else if (opciones !== undefined) {
        // Para tipos numéricos, ignorar silenciosamente las opciones podría generar confusión —
        // se rechaza explícitamente para mantener contratos de API claros
        return res.status(400).json({
          status: 'error',
          message: `El campo "opciones" solo aplica para variables de tipo SELECCION. El tipo actual es "${tipoEvaluacion}"`
        })
      }

      const nuevaVariable: RegistrarVariableDTO = {
        componenteId,
        nombre: capitalizarPalabras(nombre.trim()),
        tipoEvaluacion,
        unidad: unidad ? unidad.trim() : null,
        valorMinimo: valorMinimo ?? null,
        valorMaximo: valorMaximo ?? null,
        ordenPosicion: ordenPosicion ?? 0,
        opciones: tipoEvaluacion === TipoEvaluacion.SELECCION ? opciones : undefined
      }

      const variableRegistrada = await variableCriticaService.crearVariable(nuevaVariable)

      return res.status(201).json({
        status: 'ok',
        message: 'Variable crítica registrada correctamente',
        data: variableRegistrada
      })

    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          return res.status(404).json({
            status: 'error',
            message: 'El componente especificado no existe'
          })
        }
        if (error.code === 'P2002') {
          return res.status(409).json({
            status: 'error',
            message: 'Una de las claves de las opciones ya existe para esta variable'
          })
        }
      }
      next(error)
    }
  },


  //-----------------------------------------------------EDITAR-----------------------------------------------------
  async actualizarVariable(
    req: Request<any, ResponseDTO, EditarVariableDTO>,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const id = parsearId(req.params.id)

      if (id === null) {
        return res.status(400).json({
          status: 'error',
          message: 'El ID de la variable debe ser un número válido'
        })
      }

      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Debe proporcionar al menos un campo para actualizar'
        })
      }

      const { nombre, tipoEvaluacion, unidad, valorMinimo, valorMaximo, ordenPosicion, activa } = req.body
      const datosActualizados: EditarVariableDTO = {}

      if (nombre !== undefined) {
        if (typeof nombre !== 'string' || !nombre.trim()) {
          return res.status(400).json({ status: 'error', message: 'El nombre es inválido' })
        }
        if (nombre.trim().length > 255) {
          return res.status(400).json({ status: 'error', message: 'El nombre no puede superar los 255 caracteres' })
        }
        datosActualizados.nombre = capitalizarPalabras(nombre.trim())
      }

      if (tipoEvaluacion !== undefined) {
        if (!TIPOS_EVALUACION_VALIDOS.includes(tipoEvaluacion)) {
          return res.status(400).json({
            status: 'error',
            message: `El tipo de evaluación es inválido. Valores permitidos: ${TIPOS_EVALUACION_VALIDOS.join(', ')}`
          })
        }
        datosActualizados.tipoEvaluacion = tipoEvaluacion
      }

      if (unidad !== undefined) {
        if (unidad !== null && typeof unidad !== 'string') {
          return res.status(400).json({ status: 'error', message: 'La unidad debe ser texto' })
        }
        if (unidad && typeof unidad === 'string' && unidad.trim().length > 20) {
          return res.status(400).json({ status: 'error', message: 'La unidad no puede superar los 20 caracteres' })
        }
        datosActualizados.unidad = unidad ? unidad.trim() : null
      }

      if (valorMinimo !== undefined) {
        if (valorMinimo !== null && typeof valorMinimo !== 'number') {
          return res.status(400).json({ status: 'error', message: 'El valor mínimo debe ser un número' })
        }
        datosActualizados.valorMinimo = valorMinimo
      }

      if (valorMaximo !== undefined) {
        if (valorMaximo !== null && typeof valorMaximo !== 'number') {
          return res.status(400).json({ status: 'error', message: 'El valor máximo debe ser un número' })
        }
        datosActualizados.valorMaximo = valorMaximo
      }

      if (ordenPosicion !== undefined) {
        if (typeof ordenPosicion !== 'number') {
          return res.status(400).json({ status: 'error', message: 'El orden de posición debe ser un número' })
        }
        datosActualizados.ordenPosicion = ordenPosicion
      }

      if (activa !== undefined) {
        if (typeof activa !== 'boolean') {
          return res.status(400).json({ status: 'error', message: 'El estado activa debe ser un valor booleano' })
        }
        datosActualizados.activa = activa
      }

      const variableActualizada = await variableCriticaService.editarVariable(id, datosActualizados)

      return res.status(200).json({
        status: 'ok',
        message: 'Variable crítica actualizada correctamente',
        data: variableActualizada
      })

    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({
            status: 'error',
            message: `La variable con ID ${req.params.id} no existe`
          })
        }
      }
      next(error)
    }
  },

  //----------------------------------------------------LISTAR-----------------------------------------------------------
  async listarVariables(
    req: Request<unknown, ResponseDTO, unknown, { componenteId?: string; tipoEvaluacion?: string; activo?: string }>,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const { componenteId, tipoEvaluacion, activo } = req.query

      let idComponenteFiltro: number | undefined = undefined
      let tipoFiltro: TipoEvaluacion | undefined = undefined
      let activoFiltro: boolean | undefined = undefined

      if (componenteId !== undefined) {
        const idParseado = parsearId(componenteId)
        if (idParseado === null) {
          return res.status(400).json({ status: 'error', message: 'El parámetro componenteId debe ser un número válido' })
        }
        idComponenteFiltro = idParseado
      }

      if (tipoEvaluacion !== undefined) {
        if (!TIPOS_EVALUACION_VALIDOS.includes(tipoEvaluacion as TipoEvaluacion)) {
          return res.status(400).json({
            status: 'error',
            message: `El parámetro tipoEvaluacion es inválido. Valores permitidos: ${TIPOS_EVALUACION_VALIDOS.join(', ')}`
          })
        }
        tipoFiltro = tipoEvaluacion as TipoEvaluacion
      }

      if (activo !== undefined) {
        if (activo === 'true') {
          activoFiltro = true
        } else if (activo === 'false') {
          activoFiltro = false
        } else {
          return res.status(400).json({ status: 'error', message: 'El parámetro activo debe ser "true" o "false"' })
        }
      }

      const variables = await variableCriticaService.obtenerVariables({
        componenteId: idComponenteFiltro,
        tipoEvaluacion: tipoFiltro,
        activa: activoFiltro
      })

      return res.status(200).json({
        status: 'ok',
        message: 'Lista de variables críticas obtenida correctamente',
        data: variables
      })

    } catch (error: unknown) {
      next(error)
    }
  },

  //---------------------------------------------ELIMINAR--------------------------------------------------------
  async eliminarVariable(
    req: Request,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const id = parsearId(req.params.id)

      if (id === null) {
        return res.status(400).json({
          status: 'error',
          message: 'El ID de la variable debe ser un número válido'
        })
      }

      // Verificación explícita antes de intentar el borrado lógico
      const existe = await variableCriticaService.existeVariable(id)
      if (!existe) {
        return res.status(404).json({
          status: 'error',
          message: `La variable con ID ${id} no existe o ya está inactiva`
        })
      }

      const variableEliminada = await variableCriticaService.eliminarVariable(id)

      return res.status(200).json({
        status: 'ok',
        message: 'Variable crítica eliminada correctamente',
        data: variableEliminada
      })

    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({
            status: 'error',
            message: `La variable con ID ${req.params.id} no existe`
          })
        }
      }
      next(error)
    }
  },

  //---------------------------------------------JERARQUIA ARBOL-------------------------------------------------
  async obtenerJerarquia(
    req: Request,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const esAdmin = req.usuario?.roles?.some((r: string) =>
        r.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().includes('ADMINISTRADOR')
      )
      const usuarioPlantaId: number | undefined = (!esAdmin && req.usuario?.plantaId) ? Number(req.usuario.plantaId) : undefined
      const arbol = await variableCriticaService.obtenerArbolJerarquico(usuarioPlantaId)

      return res.status(200).json({
        status: 'ok',
        message: 'Árbol jerárquico obtenido correctamente',
        data: arbol
      })
    } catch (error: unknown) {
      next(error)
    }
  },

  //---------------------------------------------PLANTILLAS DE VARIABLES-----------------------------------------
  async listarPlantillas(
    req: Request,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const tipoEquipoId = req.query.tipoEquipoId ? parsearId(req.query.tipoEquipoId as string) ?? undefined : undefined
      const plantillas = await variableCriticaService.listarPlantillas(tipoEquipoId)

      return res.status(200).json({
        status: 'ok',
        message: 'Plantillas de variables obtenidas correctamente',
        data: plantillas
      })
    } catch (error: unknown) {
      next(error)
    }
  },

  async registrarPlantilla(
    req: Request,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const { tipoEquipoId, nombreComponente, nombre, descripcion, tipoEvaluacion, unidad, valorMinimo, valorMaximo, ordenPosicion, opciones } = req.body

      if (typeof tipoEquipoId !== 'number') {
        return res.status(400).json({ status: 'error', message: 'El ID del tipo de equipo es requerido y debe ser un número' })
      }

      if (nombreComponente !== undefined && nombreComponente !== null && typeof nombreComponente !== 'string') {
        return res.status(400).json({ status: 'error', message: 'El nombre del componente debe ser texto' })
      }

      if (nombreComponente && typeof nombreComponente === 'string' && nombreComponente.trim().length > 255) {
        return res.status(400).json({ status: 'error', message: 'El nombre del componente no puede superar los 255 caracteres' })
      }

      if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({ status: 'error', message: 'El nombre de la variable de plantilla es requerido' })
      }

      if (!tipoEvaluacion || !TIPOS_EVALUACION_VALIDOS.includes(tipoEvaluacion)) {
        return res.status(400).json({
          status: 'error',
          message: `El tipo de evaluación es inválido. Valores permitidos: ${TIPOS_EVALUACION_VALIDOS.join(', ')}`
        })
      }

      const plantilla = await variableCriticaService.crearPlantilla({
        tipoEquipoId,
        nombreComponente: nombreComponente ? nombreComponente.trim().toUpperCase() : null,
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        tipoEvaluacion,
        unidad: unidad?.trim() || null,
        valorMinimo: valorMinimo !== undefined && valorMinimo !== null ? Number(valorMinimo) : null,
        valorMaximo: valorMaximo !== undefined && valorMaximo !== null ? Number(valorMaximo) : null,
        ordenPosicion: ordenPosicion ? Number(ordenPosicion) : 0,
        opciones
      })

      return res.status(201).json({
        status: 'ok',
        message: 'Variable de plantilla creada exitosamente',
        data: plantilla
      })
    } catch (error: unknown) {
      next(error)
    }
  },

  async actualizarPlantilla(
    req: Request,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const id = parsearId(req.params.id)
      if (id === null) {
        return res.status(400).json({ status: 'error', message: 'ID de plantilla inválido' })
      }

      const datos = { ...req.body }
      if (datos.nombreComponente !== undefined) {
        if (datos.nombreComponente !== null && typeof datos.nombreComponente !== 'string') {
          return res.status(400).json({ status: 'error', message: 'El nombre del componente debe ser texto' })
        }
        if (datos.nombreComponente && typeof datos.nombreComponente === 'string' && datos.nombreComponente.trim().length > 255) {
          return res.status(400).json({ status: 'error', message: 'El nombre del componente no puede superar los 255 caracteres' })
        }
        datos.nombreComponente = datos.nombreComponente ? datos.nombreComponente.trim().toUpperCase() : null
      }

      const plantillaActualizada = await variableCriticaService.editarPlantilla(id, datos)

      return res.status(200).json({
        status: 'ok',
        message: 'Variable de plantilla actualizada correctamente',
        data: plantillaActualizada
      })
    } catch (error: unknown) {
      next(error)
    }
  },

  async eliminarPlantilla(
    req: Request,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const id = parsearId(req.params.id)
      if (id === null) {
        return res.status(400).json({ status: 'error', message: 'ID de plantilla inválido' })
      }

      const plantillaEliminada = await variableCriticaService.eliminarPlantilla(id)

      return res.status(200).json({
        status: 'ok',
        message: 'Variable de plantilla eliminada correctamente',
        data: plantillaEliminada
      })
    } catch (error: unknown) {
      next(error)
    }
  },

  //---------------------------------------------SINCRONIZACIÓN--------------------------------------------------
  async sincronizarComponente(
    req: Request,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const componenteId = parsearId(req.params.componenteId)
      if (componenteId === null) {
        return res.status(400).json({ status: 'error', message: 'ID de componente inválido' })
      }

      const resultado = await variableCriticaService.sincronizarComponenteConPlantilla(componenteId)

      return res.status(200).json({
        status: 'ok',
        message: `Sincronización completada: ${resultado.creadas} creadas, ${resultado.actualizadas} actualizadas, ${resultado.desactivadas} desactivadas`,
        data: resultado
      })
    } catch (error: unknown) {
      next(error)
    }
  },

  async sincronizarTipoEquipo(
    req: Request,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const tipoEquipoId = parsearId(req.params.tipoEquipoId)
      if (tipoEquipoId === null) {
        return res.status(400).json({ status: 'error', message: 'ID de tipo de equipo inválido' })
      }

      const resultado = await variableCriticaService.sincronizarTipoEquipoCompleto(tipoEquipoId)

      return res.status(200).json({
        status: 'ok',
        message: `Sincronización masiva completada: ${resultado.totalComponentesSincronizados} componentes sincronizados en ${resultado.totalEquipos} equipos`,
        data: resultado
      })
    } catch (error: unknown) {
      next(error)
    }
  }
}
