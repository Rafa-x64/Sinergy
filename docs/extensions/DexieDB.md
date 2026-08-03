# Dexie.js (IndexedDB Offline) en Sinergy - Guía Completa y Tutorial

Dexie.js (`dexie@4.0.1`) es una librería wrapper sobre IndexedDB que proporciona almacenamiento local estructurado y transaccional dentro del navegador del usuario. Es el pilar fundamental de la estrategia **Offline-First** de Sinergy.

Permite a los técnicos registrar inspecciones y lecturas mecánicas en plantas industriales sin cobertura de internet, conservando los datos de forma persistente y sincronizándolos automáticamente con el servidor cuando la conexión se reestablezca.

---

## 1. Instalación y Configuración de la Base de Datos Local

### Instalación
```powershell
# En apps/frontend
pnpm --filter @sinergy/frontend add dexie@4.0.1
```

### Configuración del Esquema (`apps/frontend/src/db/database.ts`)

```typescript
// apps/frontend/src/db/database.ts
import Dexie, { type Table } from 'dexie'

// 1. Definición de la Entidad Local
export interface InspeccionPendiente {
  id?: number // Clave primaria autoincremental en IndexedDB
  equipoId: number
  usuarioId: number
  datosJson: Record<string, unknown>
  observaciones?: string
  creadoEn: Date
  intentosSincronizacion: number
}

export interface EquipoCache {
  id: number
  codigo: string
  nombre: string
  plantaNombre: string
  guardadoEn: Date
}

// 2. Clase de la Base de Datos Dexie
export class SinergyDatabase extends Dexie {
  inspeccionesPendientes!: Table<InspeccionPendiente>
  equiposCache!: Table<EquipoCache>

  constructor() {
    super('SinergyLocalDB')

    // Definición de tablas e índices
    // ++id indica autoincremento. Los campos enumerados son índices buscables.
    this.version(1).stores({
      inspeccionesPendientes: '++id, equipoId, usuarioId, creadoEn',
      equiposCache: 'id, codigo, plantaNombre'
    })
  }
}

// Instancia Singleton exported
export const db = new SinergyDatabase()
```

---

## 2. Operaciones CRUD en IndexedDB con Dexie

### A. Guardar un Registro Localmente
```typescript
import { db } from '@/db/database'

async function guardarInspeccionOffline(
  equipoId: number,
  usuarioId: number,
  datosJson: Record<string, unknown>
) {
  const idGenerado = await db.inspeccionesPendientes.add({
    equipoId,
    usuarioId,
    datosJson,
    creadoEn: new Date(),
    intentosSincronizacion: 0
  })
  console.log(`Inspección guardada localmente en IndexedDB con ID: ${idGenerado}`)
  return idGenerado
}
```

### B. Consultar Registros Locales
```typescript
async function obtenerPendientes() {
  // Obtener todas las inspecciones no sincronizadas
  const pendientes = await db.inspeccionesPendientes.toArray()
  return pendientes
}

async function contarPendientes(): Promise<number> {
  return await db.inspeccionesPendientes.count()
}
```

### C. Limpiar registros sincronizados
```typescript
async function borrarInspeccionLocal(id: number) {
  await db.inspeccionesPendientes.delete(id)
}

async function vaciarColaLocal() {
  await db.inspeccionesPendientes.clear()
}
```

---

## 3. Tutorial Completo: Composable de Sincronización (`useSync.ts`)

Este composable unifica Dexie.js, VueUse (`useOnline`) y Axios para lograr un flujo transparente:

```typescript
// apps/frontend/src/composables/useSync.ts
import { ref } from 'vue'
import { useOnline } from '@vueuse/core'
import { db, type InspeccionPendiente } from '@/db/database'
import http from '@/utils/http'
import { useNotifications } from './useNotifications'

export function useSync() {
  const isOnline = useOnline()
  const sincronizando = ref(false)
  const { notifySuccess, notifyError, notifyOfflineWarning } = useNotifications()

  // Guardar datos (decide si en API o en Dexie según conexión)
  const guardarInspeccion = async (
    equipoId: number,
    usuarioId: number,
    datosJson: Record<string, unknown>
  ) => {
    if (isOnline.value) {
      try {
        await http.post('/inspecciones', { equipoId, usuarioId, datosJson })
        notifySuccess('Inspección guardada directamente en el servidor')
      } catch (err) {
        // En caso de fallo de red en el envio, respaldar localmente
        await db.inspeccionesPendientes.add({
          equipoId,
          usuarioId,
          datosJson,
          creadoEn: new Date(),
          intentosSincronizacion: 1
        })
        notifyOfflineWarning()
      }
    } else {
      // Sin conexión: guardar en IndexedDB
      await db.inspeccionesPendientes.add({
        equipoId,
        usuarioId,
        datosJson,
        creadoEn: new Date(),
        intentosSincronizacion: 0
      })
      notifyOfflineWarning()
    }
  }

  // Sincronizar elementos de Dexie con el Backend
  const sincronizarPendientes = async () => {
    if (!isOnline.value || sincronizando.value) return

    const pendientes = await db.inspeccionesPendientes.toArray()
    if (pendientes.length === 0) return

    sincronizando.value = true
    try {
      // Enviar lote al backend
      await http.post('/inspecciones/sincronizar-lote', pendientes)
      // Si tuvo éxito, limpiar IndexedDB local
      await db.inspeccionesPendientes.clear()
      notifySuccess(`Se sincronizaron ${pendientes.length} inspecciones pendientes`)
    } catch (err) {
      notifyError('No se pudo completar la sincronización de datos offline')
    } finally {
      sincronizando.value = false
    }
  }

  return {
    isOnline,
    sincronizando,
    guardarInspeccion,
    sincronizarPendientes
  }
}
```
