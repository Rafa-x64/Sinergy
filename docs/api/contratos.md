# Contratos de API (API Contracts)

Este documento define la estructura de las peticiones y respuestas para los endpoints principales de la API de Sinergy. Se utiliza como referencia para asegurar que el Frontend (Vue) y el Backend (Express) se comuniquen correctamente.

## Formato de Respuestas (Estándar)
Todas las respuestas exitosas o fallidas seguirán esta estructura base:

**Éxito (2xx):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa" 
}
```

**Error (4xx, 5xx):**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descripción amigable del error",
    "details": [] 
  }
}
```

---

## 1. Autenticación

### `POST /api/auth/login`
Autentica a un usuario y devuelve un JSON Web Token (JWT).

**Request Body:**
```json
{
  "email": "tecnico@sinergy.com",
  "password": "mypassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-1234",
      "email": "tecnico@sinergy.com",
      "nombre": "Juan Pérez",
      "rol": "TECNICO",
      "plantaId": "planta-xyz"
    }
  }
}
```

---

## 2. Maestros (Plantas, Equipos, Técnicos)

### `GET /api/equipos`
Obtiene la lista de equipos, opcionalmente filtrada por planta.

**Query Parameters:**
- `plantaId` (opcional): ID de la planta.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "eq-1",
      "codigo": "MC-01",
      "tipo": "MONTACARGAS",
      "marca": "Toyota",
      "plantaId": "planta-xyz"
    }
  ]
}
```

---

## 3. Inspecciones

### `POST /api/inspecciones/montacargas`
Registra una nueva inspección de montacargas.

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "equipoId": "eq-1",
  "fechaInspeccion": "2026-07-20T10:00:00Z",
  "turno": "MAÑANA",
  "horometro": 1500,
  "nivelesAceite": "NORMAL",
  "frenos": "NORMAL",
  "fugas": "REVISION",
  "observaciones": "Pequeña fuga de aceite hidráulico detectada.",
  "isOfflineSync": false
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "insp-100",
    "status": "GUARDADO"
  },
  "message": "Inspección registrada con éxito."
}
```

### `POST /api/inspecciones/batch`
Endpoint utilizado por el Frontend para sincronizar los registros guardados en offline (Dexie.js) cuando se recupera la conexión.

**Request Body:**
```json
{
  "inspecciones": [
    {
      "tipo": "MONTACARGAS",
      "payload": { /* Datos de la inspección */ },
      "offlineId": "local-uuid-1"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "procesadas": 1,
    "fallidas": 0,
    "errores": []
  },
  "message": "Sincronización completada."
}
```
