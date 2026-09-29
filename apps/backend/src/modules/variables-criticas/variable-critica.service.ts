import prisma from '../../core/prisma'
import {
  RegistrarVariableDTO,
  EditarVariableDTO,
  FiltrosVariable,
  RegistrarPlantillaVariableDTO,
  EditarPlantillaVariableDTO
} from './variable-critica.schemas'
import { Prisma, TipoInspeccion } from '@prisma/client'

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

// Función defensiva para deduplicar y sanitizar opciones de selección antes de insertar en BD
function sanitizarOpcionesVariable(
  opciones: { clave: string; etiqueta: string; ordenPosicion?: number }[],
  variableId?: number
) {
  const map = new Map<string, { variableId?: number; clave: string; etiqueta: string; ordenPosicion: number }>()
  for (const o of opciones) {
    const claveLimpia = o.clave.trim().toUpperCase()
    if (!claveLimpia) continue
    if (!map.has(claveLimpia)) {
      map.set(claveLimpia, {
        ...(variableId ? { variableId } : {}),
        clave: claveLimpia,
        etiqueta: o.etiqueta.trim(),
        ordenPosicion: o.ordenPosicion ?? 0
      })
    }
  }
  return Array.from(map.values())
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

  async obtenerArbolJerarquico(plantaId?: number) {
    return prisma.planta.findMany({
      where: {
        activa: true,
        ...(plantaId ? { id: plantaId } : {})
      },
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        ubicacionesTecnicas: {
          where: { activa: true },
          orderBy: { codigo: 'asc' },
          select: {
            id: true,
            codigo: true,
            nombre: true,
            plantaId: true,
            equipos: {
              orderBy: { nombre: 'asc' },
              select: {
                id: true,
                codigo: true,
                nombre: true,
                ubicacionTecnicaId: true,
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
    })
  }

  // ─── PLANTILLAS DE VARIABLES ──────────────────────────────────────────────────

  async listarPlantillas(tipoEquipoId?: number, tipoInspeccion?: TipoInspeccion | string) {
    const where: Prisma.PlantillaVariableWhereInput = { activa: true }
    if (tipoEquipoId) {
      where.tipoEquipoId = tipoEquipoId
    }

    if (tipoInspeccion && tipoInspeccion !== 'TODOS') {
      if (tipoInspeccion === 'VARIABLES_CRITICAS') {
        where.OR = [
          { tipoInspeccion: 'VARIABLES_CRITICAS' },
          { tipoInspeccion: null }
        ]
      } else {
        where.tipoInspeccion = tipoInspeccion as TipoInspeccion
      }
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

    return prisma.$transaction(async (tx) => {
      const plantilla = await tx.plantillaVariable.create({
        data: {
          ...camposPlantilla,
          tipoInspeccion: camposPlantilla.tipoInspeccion || 'VARIABLES_CRITICAS',
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


      // Propagar automáticamente como variable instancia a los componentes activos cuyo nombre coincida
      const equipos = await tx.equipo.findMany({
        where: { tipoEquipoId: datos.tipoEquipoId },
        include: {
          componentes: {
            where: { activo: true },
            select: { id: true, nombre: true }
          }
        }
      })

      for (const equipo of equipos) {
        for (const comp of equipo.componentes) {
          const coincideComponente = !plantilla.nombreComponente || comp.nombre.trim().toUpperCase() === plantilla.nombreComponente.trim().toUpperCase()
          if (!coincideComponente) continue

          // Verificar si ya existe una variable con este nombre o plantilla en el componente para no duplicar
          const variableExistente = await tx.variable.findFirst({
            where: {
              componenteId: comp.id,
              OR: [
                { plantillaId: plantilla.id },
                { nombre: { equals: plantilla.nombre, mode: 'insensitive' } }
              ]
            }
          })

          if (variableExistente) {
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

            if (plantilla.tipoEvaluacion === 'SELECCION' && opciones && opciones.length > 0) {
              await tx.opcionSeleccion.deleteMany({ where: { variableId: variableExistente.id } })
              const opcionesSanitizadas = sanitizarOpcionesVariable(opciones, variableExistente.id) as {
                variableId: number
                clave: string
                etiqueta: string
                ordenPosicion: number
              }[]

              if (opcionesSanitizadas.length > 0) {
                await tx.opcionSeleccion.createMany({
                  data: opcionesSanitizadas,
                  skipDuplicates: true
                })
              }
            }
          } else {
            const nuevaVar = await tx.variable.create({
              data: {
                componenteId: comp.id,
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

            if (plantilla.tipoEvaluacion === 'SELECCION' && opciones && opciones.length > 0) {
              const opcionesSanitizadas = sanitizarOpcionesVariable(opciones, nuevaVar.id) as {
                variableId: number
                clave: string
                etiqueta: string
                ordenPosicion: number
              }[]

              if (opcionesSanitizadas.length > 0) {
                await tx.opcionSeleccion.createMany({
                  data: opcionesSanitizadas,
                  skipDuplicates: true
                })
              }
            }
          }
        }
      }

      return tx.plantillaVariable.findUniqueOrThrow({
        where: { id: plantilla.id },
        include: {
          tipoEquipo: { select: { id: true, nombre: true } },
          opcionesSeleccion: { orderBy: { ordenPosicion: 'asc' } },
          _count: {
            select: { variablesInstancia: { where: { activa: true } } }
          }
        }
      })
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

      // Si se enviaron opciones, reemplazarlas completamente en la plantilla
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
      }

      // Propagar automáticamente los cambios a todas las instancias activas de esta plantilla
      await tx.variable.updateMany({
        where: { plantillaId: id, activa: true },
        data: {
          nombre: camposPlantilla.nombre !== undefined ? camposPlantilla.nombre : undefined,
          tipoEvaluacion: camposPlantilla.tipoEvaluacion !== undefined ? camposPlantilla.tipoEvaluacion : undefined,
          unidad: camposPlantilla.unidad !== undefined ? camposPlantilla.unidad : undefined,
          valorMinimo: camposPlantilla.valorMinimo !== undefined ? camposPlantilla.valorMinimo : undefined,
          valorMaximo: camposPlantilla.valorMaximo !== undefined ? camposPlantilla.valorMaximo : undefined,
          ordenPosicion: camposPlantilla.ordenPosicion !== undefined ? camposPlantilla.ordenPosicion : undefined
        }
      })

      // Si se actualizaron opciones en una plantilla de tipo SELECCION, replicar a las instancias
      if (opciones !== undefined) {
        const variablesInstancia = await tx.variable.findMany({
          where: { plantillaId: id, activa: true },
          select: { id: true }
        })

        for (const vInst of variablesInstancia) {
          await tx.opcionSeleccion.deleteMany({ where: { variableId: vInst.id } })
          if (opciones.length > 0) {
            const opcionesSanitizadas = sanitizarOpcionesVariable(opciones, vInst.id) as {
              variableId: number
              clave: string
              etiqueta: string
              ordenPosicion: number
            }[]

            if (opcionesSanitizadas.length > 0) {
              await tx.opcionSeleccion.createMany({
                data: opcionesSanitizadas,
                skipDuplicates: true
              })
            }
          }
        }
      }

      return tx.plantillaVariable.findUniqueOrThrow({
        where: { id },
        include: {
          tipoEquipo: { select: { id: true, nombre: true } },
          opcionesSeleccion: { orderBy: { ordenPosicion: 'asc' } },
          _count: {
            select: { variablesInstancia: { where: { activa: true } } }
          }
        }
      })
    })
  }

  async eliminarPlantilla(id: number) {
    return prisma.$transaction(async (tx) => {
      const plantilla = await tx.plantillaVariable.update({
        where: { id },
        data: { activa: false },
        include: {
          tipoEquipo: { select: { id: true, nombre: true } },
          opcionesSeleccion: { orderBy: { ordenPosicion: 'asc' } }
        }
      })

      // Desactivar en cascada todas las instancias vinculadas a esta plantilla
      await tx.variable.updateMany({
        where: { plantillaId: id },
        data: { activa: false }
      })

      return plantilla
    })
  }

  // ─── MOTOR DE SINCRONIZACIÓN DE VARIABLES ────────────────────────────────────

  async sincronizarComponenteConPlantilla(componenteId: number, plantillasPreCargadas?: any[]) {
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
    const plantillas = plantillasPreCargadas ?? await prisma.plantillaVariable.findMany({
      where: { tipoEquipoId, activa: true },
      include: {
        opcionesSeleccion: { orderBy: { ordenPosicion: 'asc' } }
      },
      orderBy: [
        { ordenPosicion: 'asc' },
        { id: 'asc' }
      ]
    })

    // 1. Filtrar y deduplicar plantillas aplicables para este componente
    const plantillasAplicablesMap = new Map<string, typeof plantillas[0]>()

    for (const p of plantillas) {
      const nombreCompLimpio = componente.nombre.trim().toUpperCase()
      const plantillaCompLimpio = p.nombreComponente ? p.nombreComponente.trim().toUpperCase() : null

      const esEspecifico = plantillaCompLimpio === nombreCompLimpio
      const esGlobal = !plantillaCompLimpio

      if (!esEspecifico && !esGlobal) continue

      const claveNombreVar = p.nombre.trim().toLowerCase()
      const existente = plantillasAplicablesMap.get(claveNombreVar)

      if (!existente) {
        plantillasAplicablesMap.set(claveNombreVar, p)
      } else {
        if (esEspecifico && !existente.nombreComponente) {
          plantillasAplicablesMap.set(claveNombreVar, p)
        }
      }
    }

    const plantillasAplicables = Array.from(plantillasAplicablesMap.values())

    let creadas = 0
    let actualizadas = 0
    let desactivadas = 0

    await prisma.$transaction(async (tx) => {
      // 2. Cargar variables actuales dentro de la transacción
      const variablesActuales = await tx.variable.findMany({
        where: { componenteId },
        include: { opcionesSeleccion: true }
      })

      // Identificar y sanear variables duplicadas preexistentes en BD
      const variablesPorNombre = new Map<string, typeof variablesActuales>()
      for (const v of variablesActuales) {
        const k = v.nombre.trim().toLowerCase()
        if (!variablesPorNombre.has(k)) {
          variablesPorNombre.set(k, [])
        }
        variablesPorNombre.get(k)!.push(v)
      }

      const variableCanonicasMap = new Map<string, typeof variablesActuales[0]>()
      const idsVariablesDesactivadas = new Set<number>()

      for (const [nombreNorm, lista] of variablesPorNombre.entries()) {
        if (lista.length === 1) {
          variableCanonicasMap.set(nombreNorm, lista[0])
        } else {
          const activaConPlantilla = lista.find(v => v.activa && v.plantillaId)
          const activaSinPlantilla = lista.find(v => v.activa)
          const canonica = activaConPlantilla || activaSinPlantilla || lista[0]

          variableCanonicasMap.set(nombreNorm, canonica)

          for (const vDup of lista) {
            if (vDup.id !== canonica.id && vDup.activa) {
              await tx.variable.update({
                where: { id: vDup.id },
                data: { activa: false }
              })
              idsVariablesDesactivadas.add(vDup.id)
              desactivadas++
            }
          }
        }
      }

      const idsVariablesProcesadas = new Set<number>()

      // 3. Sincronizar o crear cada variable desde la plantilla aplicable única
      for (const plantilla of plantillasAplicables) {
        const claveNombre = plantilla.nombre.trim().toLowerCase()

        let variableExistente = variableCanonicasMap.get(claveNombre)
        if (!variableExistente) {
          variableExistente = variablesActuales.find(
            v => v.plantillaId === plantilla.id && !idsVariablesDesactivadas.has(v.id) && !idsVariablesProcesadas.has(v.id)
          )
        }

        if (variableExistente) {
          idsVariablesProcesadas.add(variableExistente.id)

          // Comprobar si hubo cambios reales antes de emitir UPDATE
          const requiereActualizacion =
            variableExistente.plantillaId !== plantilla.id ||
            variableExistente.nombre !== plantilla.nombre ||
            variableExistente.tipoEvaluacion !== plantilla.tipoEvaluacion ||
            variableExistente.unidad !== plantilla.unidad ||
            Number(variableExistente.valorMinimo) !== (plantilla.valorMinimo !== null ? Number(plantilla.valorMinimo) : null) ||
            Number(variableExistente.valorMaximo) !== (plantilla.valorMaximo !== null ? Number(plantilla.valorMaximo) : null) ||
            variableExistente.ordenPosicion !== plantilla.ordenPosicion ||
            !variableExistente.activa

          if (requiereActualizacion) {
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
            actualizadas++
          }

          // Si es tipo selección, verificar opciones
          if (plantilla.tipoEvaluacion === 'SELECCION') {
            const opcionesActuales = variableExistente.opcionesSeleccion || []
            const opcionesPlantilla = plantilla.opcionesSeleccion || []
            const sonIguales =
              opcionesActuales.length === opcionesPlantilla.length &&
              opcionesPlantilla.every((op: any, idx: number) => {
                const oa = opcionesActuales[idx]
                return oa && oa.clave === op.clave && oa.etiqueta === op.etiqueta
              })


            if (!sonIguales) {
              await tx.opcionSeleccion.deleteMany({
                where: { variableId: variableExistente.id }
              })

              if (opcionesPlantilla.length > 0) {
                const opcionesSanitizadas = sanitizarOpcionesVariable(opcionesPlantilla, variableExistente.id) as {
                  variableId: number
                  clave: string
                  etiqueta: string
                  ordenPosicion: number
                }[]

                if (opcionesSanitizadas.length > 0) {
                  await tx.opcionSeleccion.createMany({
                    data: opcionesSanitizadas,
                    skipDuplicates: true
                  })
                }
              }
            }
          }
        } else {
          // Crear nueva variable instancia única
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

          if (plantilla.tipoEvaluacion === 'SELECCION' && plantilla.opcionesSeleccion && plantilla.opcionesSeleccion.length > 0) {
            const opcionesSanitizadas = sanitizarOpcionesVariable(plantilla.opcionesSeleccion, nuevaVar.id) as {
              variableId: number
              clave: string
              etiqueta: string
              ordenPosicion: number
            }[]

            if (opcionesSanitizadas.length > 0) {
              await tx.opcionSeleccion.createMany({
                data: opcionesSanitizadas,
                skipDuplicates: true
              })
            }
          }

          idsVariablesProcesadas.add(nuevaVar.id)
          variableCanonicasMap.set(claveNombre, nuevaVar as any)
          creadas++
        }
      }

      // 4. Desactivar variables que provienen de plantilla pero ya no aplican
      const idsPlantillasAplicables = new Set(plantillasAplicables.map(p => p.id))
      for (const variable of variablesActuales) {
        if (
          variable.plantillaId &&
          !idsPlantillasAplicables.has(variable.plantillaId) &&
          !idsVariablesProcesadas.has(variable.id) &&
          variable.activa &&
          !idsVariablesDesactivadas.has(variable.id)
        ) {
          await tx.variable.update({
            where: { id: variable.id },
            data: { activa: false }
          })
          desactivadas++
        }
      }
    }, { timeout: 30000, maxWait: 10000 })

    return {
      componenteId,
      componenteNombre: componente.nombre,
      creadas,
      actualizadas,
      desactivadas,
      totalPlantillas: plantillasAplicables.length
    }
  }

  async sincronizarTipoEquipoCompleto(tipoEquipoId: number) {
    const [equipos, plantillas] = await Promise.all([
      prisma.equipo.findMany({
        where: { tipoEquipoId },
        include: {
          componentes: {
            where: { activo: true },
            select: { id: true, nombre: true }
          }
        }
      }),
      prisma.plantillaVariable.findMany({
        where: { tipoEquipoId, activa: true },
        include: {
          opcionesSeleccion: { orderBy: { ordenPosicion: 'asc' } }
        },
        orderBy: [
          { ordenPosicion: 'asc' },
          { id: 'asc' }
        ]
      })
    ])

    const componentesIds = equipos.flatMap(e => e.componentes.map(c => c.id))
    const resultados = []

    // Procesar componentes en lotes de 5 concurrentes para máxima velocidad sin saturar el pool
    const LOTE_SIZE = 5
    for (let i = 0; i < componentesIds.length; i += LOTE_SIZE) {
      const lote = componentesIds.slice(i, i + LOTE_SIZE)
      const resLote = await Promise.all(
        lote.map(id => this.sincronizarComponenteConPlantilla(id, plantillas))
      )
      resultados.push(...resLote)
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

