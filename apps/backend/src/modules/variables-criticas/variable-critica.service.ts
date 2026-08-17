import prisma from '../../core/prisma'
import {
  RegistrarVariableDTO,
  EditarVariableDTO,
  FiltrosVariable,
  RegistrarPlantillaVariableDTO,
  EditarPlantillaVariableDTO
} from './variable-critica.schemas'
import { Prisma } from '@prisma/client'

// Proyección estándar reutilizada en todas las respuestas del servicio
const INCLUDE_VARIABLE_RELACIONES: Prisma.VariableInclude = {
  componente: {
    select: {
      id: true,
      nombre: true,
      equipoId: true
    }
  },
  opcionesSeleccion: {
    orderBy: { ordenPosicion: 'asc' }
  }
}

class VariableCriticaService {

  async crearVariable(datos: RegistrarVariableDTO) {
    const { opciones, ...camposVariable } = datos

    return prisma.variable.create({
      data: {
        ...camposVariable,
        // Si se enviaron opciones (tipo SELECCION), se crean en la misma transacción atómica
        ...(opciones && opciones.length > 0
          ? {
              opcionesSeleccion: {
                createMany: {
                  data: opciones.map(o => ({
                    clave: o.clave.trim().toUpperCase(),
                    etiqueta: o.etiqueta.trim(),
                    ordenPosicion: o.ordenPosicion ?? 0
                  }))
                }
              }
            }
          : {})
      },
      include: INCLUDE_VARIABLE_RELACIONES
    })
  }

  async obtenerVariables(filtros: FiltrosVariable) {
    const where: Prisma.VariableWhereInput = {}

    if (filtros.componenteId !== undefined) {
      where.componenteId = filtros.componenteId
    }

    if (filtros.tipoEvaluacion !== undefined) {
      where.tipoEvaluacion = filtros.tipoEvaluacion
    }

    // Por defecto solo devuelve variables activas si no se especifica el filtro
    where.activa = filtros.activa !== undefined ? filtros.activa : true

    return prisma.variable.findMany({
      where,
      include: INCLUDE_VARIABLE_RELACIONES,
      orderBy: [
        { ordenPosicion: 'asc' },
        { creadoEn: 'asc' }
      ]
    })
  }

  async buscarPorId(id: number) {
    return prisma.variable.findFirst({
      where: {
        id,
        activa: true
      },
      include: INCLUDE_VARIABLE_RELACIONES
    })
  }

  async editarVariable(id: number, datos: EditarVariableDTO) {
    const { opciones, ...camposVariable } = datos

    return prisma.$transaction(async (tx) => {
      const variable = await tx.variable.update({
        where: { id },
        data: camposVariable,
        include: INCLUDE_VARIABLE_RELACIONES
      })

      if (opciones !== undefined) {
        await tx.opcionSeleccion.deleteMany({ where: { variableId: id } })

        if (opciones.length > 0) {
          await tx.opcionSeleccion.createMany({
            data: opciones.map((o) => ({
              variableId: id,
              clave: o.clave.trim().toUpperCase(),
              etiqueta: o.etiqueta.trim(),
              ordenPosicion: o.ordenPosicion ?? 0
            }))
          })
        }

        return tx.variable.findUniqueOrThrow({
          where: { id },
          include: INCLUDE_VARIABLE_RELACIONES
        })
      }

      return variable
    })
  }

  // Borrado lógico: se marca activa = false para preservar historial en InspeccionDetalle
  async eliminarVariable(id: number) {
    return prisma.variable.update({
      where: { id },
      data: { activa: false },
      include: INCLUDE_VARIABLE_RELACIONES
    })
  }

  async existeVariable(id: number): Promise<boolean> {
    const conteo = await prisma.variable.count({
      where: { id, activa: true }
    })
    return conteo > 0
  }

  async existeComponente(componenteId: number): Promise<boolean> {
    const conteo = await prisma.componente.count({
      where: { id: componenteId, activo: true }
    })
    return conteo > 0
  }

  async obtenerArbolJerarquico() {
    return prisma.planta.findMany({
      where: { activa: true },
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        ubicacionesTecnicas: {
          where: { activa: true },
          orderBy: { nombre: 'asc' },
          select: {
            id: true,
            codigo: true,
            nombre: true,
            plantaId: true,
            lineas: {
              where: { activa: true },
              orderBy: { nombre: 'asc' },
              select: {
                id: true,
                codigo: true,
                nombre: true,
                ubicacionTecnicaId: true,
                equipos: {
                  orderBy: { nombre: 'asc' },
                  select: {
                    id: true,
                    codigo: true,
                    nombre: true,
                    lineaId: true,
                    tipoEquipoId: true,
                    tipoEquipo: {
                      select: {
                        id: true,
                        nombre: true
                      }
                    },
                    componentes: {
                      where: { activo: true },
                      orderBy: { ordenPosicion: 'asc' },
                      select: {
                        id: true,
                        nombre: true,
                        descripcion: true,
                        equipoId: true,
                        activo: true,
                        ordenPosicion: true,
                        _count: {
                          select: {
                            variables: {
                              where: { activa: true }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })
  }

  // ─── PLANTILLAS DE VARIABLES ──────────────────────────────────────────────────

  async listarPlantillas(tipoEquipoId?: number) {
    const where: Prisma.PlantillaVariableWhereInput = { activa: true }
    if (tipoEquipoId) {
      where.tipoEquipoId = tipoEquipoId
    }

    return prisma.plantillaVariable.findMany({
      where,
      include: {
        tipoEquipo: {
          select: { id: true, nombre: true }
        },
        opcionesSeleccion: {
          orderBy: { ordenPosicion: 'asc' }
        },
        _count: {
          select: { variablesInstancia: { where: { activa: true } } }
        }
      },
      orderBy: [
        { ordenPosicion: 'asc' },
        { creadoEn: 'asc' }
      ]
    })
  }

  async crearPlantilla(datos: RegistrarPlantillaVariableDTO) {
    const { opciones, ...camposPlantilla } = datos

    return prisma.plantillaVariable.create({
      data: {
        ...camposPlantilla,
        ...(opciones && opciones.length > 0
          ? {
              opcionesSeleccion: {
                createMany: {
                  data: opciones.map(o => ({
                    clave: o.clave.trim().toUpperCase(),
                    etiqueta: o.etiqueta.trim(),
                    ordenPosicion: o.ordenPosicion ?? 0
                  }))
                }
              }
            }
          : {})
      },
      include: {
        tipoEquipo: { select: { id: true, nombre: true } },
        opcionesSeleccion: { orderBy: { ordenPosicion: 'asc' } }
      }
    })
  }

  async editarPlantilla(id: number, datos: EditarPlantillaVariableDTO) {
    const { opciones, ...camposPlantilla } = datos

    return prisma.$transaction(async (tx) => {
      const plantilla = await tx.plantillaVariable.update({
        where: { id },
        data: camposPlantilla,
        include: {
          tipoEquipo: { select: { id: true, nombre: true } },
          opcionesSeleccion: { orderBy: { ordenPosicion: 'asc' } }
        }
      })

      // Si se enviaron opciones, reemplazarlas completamente
      if (opciones !== undefined) {
        await tx.plantillaOpcionSeleccion.deleteMany({ where: { plantillaId: id } })

        if (opciones.length > 0) {
          await tx.plantillaOpcionSeleccion.createMany({
            data: opciones.map((o) => ({
              plantillaId: id,
              clave: o.clave.trim().toUpperCase(),
              etiqueta: o.etiqueta.trim(),
              ordenPosicion: o.ordenPosicion ?? 0
            }))
          })
        }

        // Retornar con opciones actualizadas
        return tx.plantillaVariable.findUniqueOrThrow({
          where: { id },
          include: {
            tipoEquipo: { select: { id: true, nombre: true } },
            opcionesSeleccion: { orderBy: { ordenPosicion: 'asc' } }
          }
        })
      }

      return plantilla
    })
  }

  async eliminarPlantilla(id: number) {
    return prisma.plantillaVariable.update({
      where: { id },
      data: { activa: false },
      include: {
        tipoEquipo: { select: { id: true, nombre: true } },
        opcionesSeleccion: { orderBy: { ordenPosicion: 'asc' } }
      }
    })
  }

  // ─── MOTOR DE SINCRONIZACIÓN DE VARIABLES ────────────────────────────────────

  async sincronizarComponenteConPlantilla(componenteId: number) {
    const componente = await prisma.componente.findUnique({
      where: { id: componenteId },
      include: {
        equipo: true,
        variables: {
          include: { opcionesSeleccion: true }
        }
      }
    })

    if (!componente || !componente.activo) {
      throw new Error(`El componente con ID ${componenteId} no existe o está inactivo`)
    }

    const tipoEquipoId = componente.equipo.tipoEquipoId
    const plantillas = await prisma.plantillaVariable.findMany({
      where: { tipoEquipoId, activa: true },
      include: {
        opcionesSeleccion: { orderBy: { ordenPosicion: 'asc' } }
      }
    })

    let creadas = 0
    let actualizadas = 0
    let desactivadas = 0

    await prisma.$transaction(async (tx) => {
      // 1. Sincronizar o crear variables desde la plantilla
      for (const plantilla of plantillas) {
        const variableExistente = componente.variables.find(
          v => v.plantillaId === plantilla.id || v.nombre.trim().toLowerCase() === plantilla.nombre.trim().toLowerCase()
        )

        if (variableExistente) {
          // Actualizar variable existente
          await tx.variable.update({
            where: { id: variableExistente.id },
            data: {
              plantillaId: plantilla.id,
              nombre: plantilla.nombre,
              tipoEvaluacion: plantilla.tipoEvaluacion,
              unidad: plantilla.unidad,
              valorMinimo: plantilla.valorMinimo,
              valorMaximo: plantilla.valorMaximo,
              ordenPosicion: plantilla.ordenPosicion,
              activa: true
            }
          })

          // Si es de tipo selección, recrear opciones
          if (plantilla.tipoEvaluacion === 'SELECCION') {
            await tx.opcionSeleccion.deleteMany({
              where: { variableId: variableExistente.id }
            })

            if (plantilla.opcionesSeleccion.length > 0) {
              await tx.opcionSeleccion.createMany({
                data: plantilla.opcionesSeleccion.map(o => ({
                  variableId: variableExistente.id,
                  clave: o.clave,
                  etiqueta: o.etiqueta,
                  ordenPosicion: o.ordenPosicion
                }))
              })
            }
          }
          actualizadas++
        } else {
          // Crear nueva variable instancia
          const nuevaVar = await tx.variable.create({
            data: {
              componenteId,
              plantillaId: plantilla.id,
              nombre: plantilla.nombre,
              tipoEvaluacion: plantilla.tipoEvaluacion,
              unidad: plantilla.unidad,
              valorMinimo: plantilla.valorMinimo,
              valorMaximo: plantilla.valorMaximo,
              ordenPosicion: plantilla.ordenPosicion,
              activa: true
            }
          })

          if (plantilla.tipoEvaluacion === 'SELECCION' && plantilla.opcionesSeleccion.length > 0) {
            await tx.opcionSeleccion.createMany({
              data: plantilla.opcionesSeleccion.map(o => ({
                variableId: nuevaVar.id,
                clave: o.clave,
                etiqueta: o.etiqueta,
                ordenPosicion: o.ordenPosicion
              }))
            })
          }
          creadas++
        }
      }

      // 2. Desactivar variables que provienen de plantilla pero ya no existen en la definición actual
      const idsPlantillasActivas = new Set(plantillas.map(p => p.id))
      for (const variable of componente.variables) {
        if (variable.plantillaId && !idsPlantillasActivas.has(variable.plantillaId) && variable.activa) {
          await tx.variable.update({
            where: { id: variable.id },
            data: { activa: false }
          })
          desactivadas++
        }
      }
    })

    return {
      componenteId,
      componenteNombre: componente.nombre,
      creadas,
      actualizadas,
      desactivadas,
      totalPlantillas: plantillas.length
    }
  }

  async sincronizarTipoEquipoCompleto(tipoEquipoId: number) {
    const equipos = await prisma.equipo.findMany({
      where: { tipoEquipoId },
      include: {
        componentes: {
          where: { activo: true },
          select: { id: true, nombre: true }
        }
      }
    })

    const resultados = []
    for (const equipo of equipos) {
      for (const componente of equipo.componentes) {
        const res = await this.sincronizarComponenteConPlantilla(componente.id)
        resultados.push(res)
      }
    }

    return {
      tipoEquipoId,
      totalEquipos: equipos.length,
      totalComponentesSincronizados: resultados.length,
      detalles: resultados
    }
  }
}

export const variableCriticaService = new VariableCriticaService()
