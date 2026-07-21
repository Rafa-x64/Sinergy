-- =============================================================================
-- BASE DE DATOS COMPLETA — SISTEMA SINERGY (TUBRICA)
-- Motor: PostgreSQL 14+
-- Versión: 2.0 (Enterprise / Alta Disponibilidad)
-- Fecha: 2026-07-21
-- Autor: Sistema Sinergy
-- =============================================================================
-- Instrucciones de ejecución:
--   psql -U <usuario> -d <nombre_db> -f sinergy_schema.sql
-- =============================================================================

-- Crear la base de datos (ejecutar como superusuario si no existe)
-- CREATE DATABASE sinergy_db ENCODING 'UTF8' LC_COLLATE='es_VE.UTF-8' LC_CTYPE='es_VE.UTF-8';
-- \c sinergy_db

BEGIN;

-- =============================================================================
-- SECCIÓN 1: TIPOS ENUMERADOS (ENUMS)
-- =============================================================================

CREATE TYPE rol_enum AS ENUM (
    'ADMINISTRADOR',
    'SUPERVISOR',
    'TECNICO'
);

CREATE TYPE tipo_equipo_enum AS ENUM (
    'MAQUINARIA',
    'MONTACARGAS',
    'COMPRESOR',
    'GENERADOR',
    'CHILLER'
);

CREATE TYPE estado_operativo_enum AS ENUM (
    'OPERATIVO',
    'INOPERATIVO',
    'EN_MANTENIMIENTO'
);

CREATE TYPE tipo_evaluacion_enum AS ENUM (
    'NUMERICO_ENTERO',
    'NUMERICO_DECIMAL',
    'TEMPERATURA',
    'SELECCION'
);

CREATE TYPE tipo_inspeccion_enum AS ENUM (
    'VARIABLES_CRITICAS',
    'MONTACARGAS',
    'COMPRESOR',
    'GENERADOR',
    'CHILLER'
);

CREATE TYPE estado_inspeccion_enum AS ENUM (
    'BORRADOR',
    'PENDIENTE',
    'APROBADO',
    'RECHAZADO'
);

CREATE TYPE origen_datos_enum AS ENUM (
    'ONLINE',
    'OFFLINE_SYNC'
);

-- =============================================================================
-- SECCIÓN 2: CAPA DE SEGURIDAD — USUARIOS Y AUTENTICACIÓN (RBAC)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabla: usuarios
-- Propósito: Almacena las credenciales y el perfil de acceso de cada usuario
--            del sistema con soporte de roles RBAC.
-- Relaciones:
--   - 1:N con inspecciones (elaborado_por, revisado_por, aprobado_por)
--   - 1:N con auditoria_logs
-- -----------------------------------------------------------------------------
CREATE TABLE usuarios (
    id             SERIAL                  PRIMARY KEY,
    nombre         VARCHAR(100)            NOT NULL,
    apellido       VARCHAR(100)            NOT NULL,
    email          VARCHAR(150)            NOT NULL,
    password_hash  VARCHAR(255)            NOT NULL,
    rol            rol_enum                NOT NULL DEFAULT 'TECNICO',
    activo         BOOLEAN                 NOT NULL DEFAULT TRUE,
    ultimo_acceso  TIMESTAMP WITH TIME ZONE,
    creado_en      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_usuarios_email UNIQUE (email)
);

COMMENT ON TABLE  usuarios              IS 'Perfil de acceso y credenciales de cada colaborador de Tubrica.';
COMMENT ON COLUMN usuarios.rol          IS 'Rol RBAC del usuario: ADMINISTRADOR, SUPERVISOR o TECNICO.';
COMMENT ON COLUMN usuarios.activo       IS 'FALSE = cuenta deshabilitada; el registro jamás se borra.';
COMMENT ON COLUMN usuarios.password_hash IS 'Hash bcrypt de la contraseña. Nunca se almacena texto plano.';

-- =============================================================================
-- SECCIÓN 3: CAPA DE INFRAESTRUCTURA — JERARQUÍA FÍSICA DE PLANTA (Data-Driven UI)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabla: ubicaciones_tecnicas
-- Propósito: Nodos geográficos o lógicos que agrupan plantas, equipos y activos
--            físicos. Ej: '1000-DES-MT01' = Planta Tubrica / Despacho / Montacargas 01.
-- -----------------------------------------------------------------------------
CREATE TABLE ubicaciones_tecnicas (
    id             SERIAL                  PRIMARY KEY,
    codigo         VARCHAR(50)             NOT NULL,
    nombre         VARCHAR(255)            NOT NULL,
    descripcion    TEXT,
    creado_en      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_ubicaciones_tecnicas_codigo UNIQUE (codigo)
);

COMMENT ON TABLE  ubicaciones_tecnicas          IS 'Nodos geográficos o lógicos que agrupan activos físicos. Ej: 1000-DES-MT01.';
COMMENT ON COLUMN ubicaciones_tecnicas.codigo   IS 'Código identificador único. Ej: 1000, 1000-DES, 1000-DES-MT01.';

-- -----------------------------------------------------------------------------
-- Tabla: plantas
-- Propósito: Representa cada una de las 3 plantas industriales de Tubrica.
-- Nota de dominio: ubicacion_tecnica_id es NULLABLE por requerimiento explícito
--                  del negocio; algunas plantas no tienen UT asignada aún.
-- -----------------------------------------------------------------------------
CREATE TABLE plantas (
    id                   SERIAL                  PRIMARY KEY,
    codigo               VARCHAR(50)             NOT NULL,
    nombre               VARCHAR(255)            NOT NULL,
    ubicacion_tecnica_id INTEGER,
    activa               BOOLEAN                 NOT NULL DEFAULT TRUE,
    creado_en            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    actualizado_en       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_plantas_codigo  UNIQUE (codigo),
    CONSTRAINT uq_plantas_nombre  UNIQUE (nombre),
    CONSTRAINT fk_plantas_ubicacion_tecnica
        FOREIGN KEY (ubicacion_tecnica_id)
        REFERENCES ubicaciones_tecnicas(id)
        ON DELETE SET NULL  -- Si se borra la UT, la planta sigue existiendo sin UT asignada
        ON UPDATE CASCADE
);

COMMENT ON TABLE  plantas                        IS 'Las 3 plantas industriales de Tubrica. Relación opcional con ubicaciones_tecnicas.';
COMMENT ON COLUMN plantas.ubicacion_tecnica_id   IS 'FK nullable: una planta puede no tener ubicación técnica asignada.';

-- -----------------------------------------------------------------------------
-- Tabla: lineas
-- Propósito: Líneas de producción dentro de cada planta. Cada planta tiene
--            entre 6 y 17 líneas. La combinación (codigo, planta_id) es única.
-- -----------------------------------------------------------------------------
CREATE TABLE lineas (
    id             SERIAL                  PRIMARY KEY,
    codigo         VARCHAR(50)             NOT NULL,
    nombre         VARCHAR(255)            NOT NULL,
    planta_id      INTEGER                 NOT NULL,
    activa         BOOLEAN                 NOT NULL DEFAULT TRUE,
    creado_en      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_lineas_codigo_planta UNIQUE (codigo, planta_id),
    CONSTRAINT fk_lineas_planta
        FOREIGN KEY (planta_id)
        REFERENCES plantas(id)
        ON DELETE RESTRICT  -- No se puede borrar una planta que tenga líneas activas
        ON UPDATE CASCADE
);

COMMENT ON TABLE  lineas           IS '6 a 17 líneas de producción por planta. Ej: Línea #13 Extrusión.';
COMMENT ON COLUMN lineas.codigo    IS 'Código corto de la línea. Único por planta. Ej: L13.';

-- -----------------------------------------------------------------------------
-- Tabla: equipos
-- Propósito: Activos físicos de la planta. Puede estar asignado a una línea
--            (linea_id nullable) o ser móvil/independiente (Montacargas).
-- Tipos de equipo: MAQUINARIA, MONTACARGAS, COMPRESOR, GENERADOR, CHILLER.
-- -----------------------------------------------------------------------------
CREATE TABLE equipos (
    id               SERIAL                  PRIMARY KEY,
    codigo           VARCHAR(100)            NOT NULL,
    nombre           VARCHAR(255)            NOT NULL,
    tipo_equipo      tipo_equipo_enum        NOT NULL,
    linea_id         INTEGER,
    serial           VARCHAR(100),
    marca            VARCHAR(100),
    modelo           VARCHAR(100),
    estado_operativo estado_operativo_enum   NOT NULL DEFAULT 'OPERATIVO',
    observacion      TEXT,
    creado_en        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    actualizado_en   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_equipos_codigo UNIQUE (codigo),
    CONSTRAINT fk_equipos_linea
        FOREIGN KEY (linea_id)
        REFERENCES lineas(id)
        ON DELETE SET NULL  -- Un equipo puede desasignarse de una línea sin eliminarse
        ON UPDATE CASCADE
);

COMMENT ON TABLE  equipos                  IS 'Activos físicos de Tubrica: Maquinaria, Montacargas, Compresores, Generadores y Chillers.';
COMMENT ON COLUMN equipos.codigo           IS 'Código de activo único. Ej: 1000MTC00009 (montacargas) o EXT-MD130 (extrusora).';
COMMENT ON COLUMN equipos.linea_id         IS 'FK nullable: montacargas y equipos móviles no pertenecen a una línea fija.';
COMMENT ON COLUMN equipos.estado_operativo IS 'OPERATIVO, INOPERATIVO o EN_MANTENIMIENTO. Actualizado al finalizar cada inspección.';

-- -----------------------------------------------------------------------------
-- Tabla: montacargas_detalles
-- Propósito: Extensión 1:1 de equipos para los activos tipo MONTACARGAS.
--            Almacena la nomenclatura específica de Tubrica:
--              Código:       1000MTC00009
--              Denominación: Montacarga Yale GLP090 M09
--              UT:           1000-DES-MT01
-- -----------------------------------------------------------------------------
CREATE TABLE montacargas_detalles (
    id                      SERIAL       PRIMARY KEY,
    equipo_id               INTEGER      NOT NULL,
    denominacion            VARCHAR(255) NOT NULL,  -- 'Montacarga Yale GLP090 M09'
    tipo_montacarga         VARCHAR(100) NOT NULL DEFAULT 'Montacarga',
    marca                   VARCHAR(100) NOT NULL,  -- 'Yale'
    modelo                  VARCHAR(100) NOT NULL,  -- 'GLP090'
    identificacion_abreviada VARCHAR(50) NOT NULL,  -- 'M09'
    ubicacion_tecnica_texto VARCHAR(100) NOT NULL,  -- '1000-DES-MT01'
    denominacion_2          TEXT,                   -- Descripción larga de la ubicación técnica

    CONSTRAINT uq_montacargas_detalles_equipo UNIQUE (equipo_id),
    CONSTRAINT fk_montacargas_detalles_equipo
        FOREIGN KEY (equipo_id)
        REFERENCES equipos(id)
        ON DELETE CASCADE  -- Si se borra el equipo padre, se borran sus detalles
        ON UPDATE CASCADE
);

COMMENT ON TABLE  montacargas_detalles                      IS 'Extensión 1:1 de equipos. Datos específicos de la nomenclatura Tubrica para montacargas.';
COMMENT ON COLUMN montacargas_detalles.denominacion         IS 'Denominación compuesta. Ej: Montacarga Yale GLP090 M09.';
COMMENT ON COLUMN montacargas_detalles.identificacion_abreviada IS 'Identificador corto. Ej: M09.';
COMMENT ON COLUMN montacargas_detalles.ubicacion_tecnica_texto  IS 'Código de UT en texto. Ej: 1000-DES-MT01.';
COMMENT ON COLUMN montacargas_detalles.denominacion_2       IS 'Descripción detallada de la ubicación técnica (Denominación 2).';

-- -----------------------------------------------------------------------------
-- Tabla: componentes
-- Propósito: Partes funcionales de un equipo sujetas a evaluación.
--            Ej: Motor Principal A, Sistema de Frenos, Radiador.
--            Soporta ordenamiento personalizado para la UI (orden_posicion).
-- -----------------------------------------------------------------------------
CREATE TABLE componentes (
    id             SERIAL                  PRIMARY KEY,
    equipo_id      INTEGER                 NOT NULL,
    nombre         VARCHAR(255)            NOT NULL,
    descripcion    TEXT,
    activo         BOOLEAN                 NOT NULL DEFAULT TRUE,
    orden_posicion INTEGER                 NOT NULL DEFAULT 0,
    creado_en      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_componentes_equipo
        FOREIGN KEY (equipo_id)
        REFERENCES equipos(id)
        ON DELETE CASCADE   -- Si se borra un equipo borrador, sus componentes se limpian
        ON UPDATE CASCADE
);

COMMENT ON TABLE  componentes                IS 'Partes funcionales de un equipo sujetas a inspección. Ej: Motor A, Radiador, Frenos.';
COMMENT ON COLUMN componentes.orden_posicion IS 'Define el orden de aparición en el formulario de inspección Data-Driven.';

-- -----------------------------------------------------------------------------
-- Tabla: variables
-- Propósito: Parámetros específicos a medir en cada componente.
--            El campo tipo_evaluacion determina el control de UI a renderizar:
--              NUMERICO_ENTERO  → <input type="number" step="1">
--              NUMERICO_DECIMAL → <input type="number" step="0.01">
--              TEMPERATURA      → <input type="number"> + badge de unidad (°C / °F)
--              SELECCION        → <select> con opciones de opciones_seleccion
--            valor_minimo y valor_maximo habilitan validación de rango y alertas.
-- -----------------------------------------------------------------------------
CREATE TABLE variables (
    id              SERIAL                  PRIMARY KEY,
    componente_id   INTEGER                 NOT NULL,
    nombre          VARCHAR(255)            NOT NULL,
    tipo_evaluacion tipo_evaluacion_enum    NOT NULL,
    unidad          VARCHAR(20),            -- '°C', '°F', 'PSI', 'RPM', 'A', 'V', etc.
    valor_minimo    NUMERIC(12, 4),         -- Umbral mínimo seguro (alertas)
    valor_maximo    NUMERIC(12, 4),         -- Umbral máximo seguro (alertas)
    orden_posicion  INTEGER                 NOT NULL DEFAULT 0,
    activa          BOOLEAN                 NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_variables_componente
        FOREIGN KEY (componente_id)
        REFERENCES componentes(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

COMMENT ON TABLE  variables                IS 'Parámetros de medición por componente. Su tipo_evaluacion controla el input de UI.';
COMMENT ON COLUMN variables.tipo_evaluacion IS 'NUMERICO_ENTERO | NUMERICO_DECIMAL | TEMPERATURA | SELECCION.';
COMMENT ON COLUMN variables.unidad         IS 'Unidad de medida para tipos numéricos y de temperatura. Ej: °C, PSI, RPM.';
COMMENT ON COLUMN variables.valor_minimo   IS 'Umbral inferior esperado. Si se registra por debajo, el sistema puede emitir alerta.';
COMMENT ON COLUMN variables.valor_maximo   IS 'Umbral superior esperado. Si se supera, el sistema puede emitir alerta.';

-- -----------------------------------------------------------------------------
-- Tabla: opciones_seleccion
-- Propósito: Catálogo de opciones para variables de tipo SELECCION.
--            La combinación (variable_id, clave) es única para garantizar
--            integridad del catálogo. Leyenda oficial Tubrica:
--              N   = Normal
--              E   = Existe
--              A   = Anormal
--              B   = Bajo
--              NE  = No Existe
--              N/A = No Aplica
-- -----------------------------------------------------------------------------
CREATE TABLE opciones_seleccion (
    id             SERIAL       PRIMARY KEY,
    variable_id    INTEGER      NOT NULL,
    clave          VARCHAR(10)  NOT NULL,
    etiqueta       VARCHAR(100) NOT NULL,
    orden_posicion INTEGER      NOT NULL DEFAULT 0,

    CONSTRAINT uq_opciones_variable_clave UNIQUE (variable_id, clave),
    CONSTRAINT fk_opciones_seleccion_variable
        FOREIGN KEY (variable_id)
        REFERENCES variables(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

COMMENT ON TABLE  opciones_seleccion          IS 'Catálogo de opciones para variables tipo SELECCION. Leyenda: N, E, A, B, NE, N/A.';
COMMENT ON COLUMN opciones_seleccion.clave    IS 'Clave corta almacenada en inspeccion_detalles. Ej: N, E, A, B, NE, N/A.';
COMMENT ON COLUMN opciones_seleccion.etiqueta IS 'Texto legible mostrado en la UI. Ej: Normal, Existe, Anormal, Bajo, No Existe, No Aplica.';

-- =============================================================================
-- SECCIÓN 4: CAPA TRANSACCIONAL — REGISTRO DE INSPECCIONES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabla: inspecciones
-- Propósito: Cabecera de cada chequeo operacional. Registra la trazabilidad
--            tripartita inalterable: elaborado_por (JWT) + revisado_por +
--            aprobado_por. Distingue entre captura ONLINE y OFFLINE_SYNC.
-- Regla de integridad crítica:
--   ON DELETE RESTRICT en equipo y elaborado_por → ninguna inspección histórica
--   puede quedar huérfana al borrar un equipo o usuario.
-- D-03: id es BIGSERIAL (64-bit) → soporta más de 9 quintillones de filas.
-- -----------------------------------------------------------------------------
CREATE TABLE inspecciones (
    id                     BIGSERIAL                PRIMARY KEY,
    codigo_inspeccion      VARCHAR(100)             NOT NULL,
    tipo_inspeccion        tipo_inspeccion_enum     NOT NULL,
    equipo_id              INTEGER                  NOT NULL,
    elaborado_por          INTEGER                  NOT NULL,
    revisado_por           INTEGER,
    aprobado_por           INTEGER,
    fecha_registro         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    fecha_sincronizacion   TIMESTAMP WITH TIME ZONE,
    estado_inspeccion      estado_inspeccion_enum   NOT NULL DEFAULT 'PENDIENTE',
    origen_datos           origen_datos_enum        NOT NULL DEFAULT 'ONLINE',
    observaciones_generales TEXT,
    creado_en              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    actualizado_en         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_inspecciones_codigo UNIQUE (codigo_inspeccion),

    CONSTRAINT fk_inspecciones_equipo
        FOREIGN KEY (equipo_id)
        REFERENCES equipos(id)
        ON DELETE RESTRICT  -- Un equipo con inspecciones NO puede ser borrado
        ON UPDATE CASCADE,

    CONSTRAINT fk_inspecciones_elaborado_por
        FOREIGN KEY (elaborado_por)
        REFERENCES usuarios(id)
        ON DELETE RESTRICT  -- Un usuario con inspecciones NO puede ser borrado
        ON UPDATE CASCADE,

    CONSTRAINT fk_inspecciones_revisado_por
        FOREIGN KEY (revisado_por)
        REFERENCES usuarios(id)
        ON DELETE SET NULL  -- Si el supervisor es borrado, la inspección sigue en pie
        ON UPDATE CASCADE,

    CONSTRAINT fk_inspecciones_aprobado_por
        FOREIGN KEY (aprobado_por)
        REFERENCES usuarios(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

COMMENT ON TABLE  inspecciones                       IS 'Cabecera de cada chequeo operacional. Trazabilidad tripartita: Elaborado / Revisado / Aprobado.';
COMMENT ON COLUMN inspecciones.codigo_inspeccion     IS 'Código correlativo legible. Ej: INSP-20260721-0001.';
COMMENT ON COLUMN inspecciones.elaborado_por         IS 'FK NOT NULL: tomada del token JWT activo del técnico. Inalterable post-creación.';
COMMENT ON COLUMN inspecciones.revisado_por          IS 'FK NULLABLE: firma posterior del supervisor. No obligatoria al momento de la captura.';
COMMENT ON COLUMN inspecciones.aprobado_por          IS 'FK NULLABLE: firma posterior de la jefatura. No obligatoria al momento de la captura.';
COMMENT ON COLUMN inspecciones.fecha_registro        IS 'Timestamp de captura en planta (puede ser OFFLINE; no depende de la hora del servidor).';
COMMENT ON COLUMN inspecciones.fecha_sincronizacion  IS 'Timestamp en que la data offline llegó al servidor central. NULL si fue ONLINE.';
COMMENT ON COLUMN inspecciones.origen_datos          IS 'ONLINE: datos llegaron en tiempo real. OFFLINE_SYNC: guardados localmente y sincronizados después.';

-- -----------------------------------------------------------------------------
-- Tabla: inspeccion_detalles
-- Propósito: Registro línea a línea de cada variable evaluada en la inspección.
--            Persiste valor_numerico (para tipos numéricos/temperatura) o
--            valor_seleccion (para tipo SELECCION) mutuamente.
-- -----------------------------------------------------------------------------
-- D-03: id es BIGSERIAL (64-bit) → puede tener N filas por inspección; volumen aún mayor.
--       inspeccion_id y variable_id como BIGINT para consistencia con la FK de inspecciones.
CREATE TABLE inspeccion_detalles (
    id               BIGSERIAL               PRIMARY KEY,
    inspeccion_id    BIGINT                  NOT NULL,  -- FK a inspecciones.id (BIGSERIAL)
    variable_id      INTEGER                 NOT NULL,
    valor_numerico   NUMERIC(12, 4),
    valor_seleccion  VARCHAR(10),
    observaciones    TEXT,
    estado_componente BOOLEAN               NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_inspeccion_detalles_inspeccion
        FOREIGN KEY (inspeccion_id)
        REFERENCES inspecciones(id)
        ON DELETE CASCADE   -- Al borrar una inspección se limpian sus detalles
        ON UPDATE CASCADE,

    CONSTRAINT fk_inspeccion_detalles_variable
        FOREIGN KEY (variable_id)
        REFERENCES variables(id)
        ON DELETE RESTRICT  -- No se puede borrar una variable con historia registrada
        ON UPDATE CASCADE
);

COMMENT ON TABLE  inspeccion_detalles                  IS 'Detalle línea a línea de cada variable evaluada en una inspección.';
COMMENT ON COLUMN inspeccion_detalles.valor_numerico   IS 'Valor para tipos NUMERICO_ENTERO, NUMERICO_DECIMAL y TEMPERATURA.';
COMMENT ON COLUMN inspeccion_detalles.valor_seleccion  IS 'Clave para tipo SELECCION. Ej: N, E, A, B, NE, N/A.';
COMMENT ON COLUMN inspeccion_detalles.estado_componente IS 'TRUE = componente operativo. FALSE = componente en falla o inactivo.';

-- -----------------------------------------------------------------------------
-- Tabla: inspeccion_adjuntos
-- Propósito: Evidencia fotográfica o documental adjunta a una inspección.
--            detalle_id es NULLABLE: el adjunto puede ser a nivel de cabecera
--            o a nivel de una variable específica.
-- -----------------------------------------------------------------------------
-- D-03: BIGSERIAL. inspeccion_id y detalle_id como BIGINT por FK a tablas BIGSERIAL.
CREATE TABLE inspeccion_adjuntos (
    id             BIGSERIAL                PRIMARY KEY,
    inspeccion_id  BIGINT                   NOT NULL,  -- FK a inspecciones.id (BIGSERIAL)
    detalle_id     BIGINT,                             -- FK a inspeccion_detalles.id (BIGSERIAL) — NULLABLE
    ruta_archivo   VARCHAR(500)             NOT NULL,
    nombre_archivo VARCHAR(255)             NOT NULL,
    tipo_mime      VARCHAR(100)             NOT NULL,
    tamano_bytes   BIGINT                   NOT NULL,
    creado_en      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_inspeccion_adjuntos_inspeccion
        FOREIGN KEY (inspeccion_id)
        REFERENCES inspecciones(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_inspeccion_adjuntos_detalle
        FOREIGN KEY (detalle_id)
        REFERENCES inspeccion_detalles(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

COMMENT ON TABLE  inspeccion_adjuntos            IS 'Archivos de evidencia fotográfica o documental asociados a una inspección o variable.';
COMMENT ON COLUMN inspeccion_adjuntos.detalle_id IS 'FK NULLABLE: si es NULL, el adjunto aplica a toda la inspección; si tiene valor, aplica a esa variable.';
COMMENT ON COLUMN inspeccion_adjuntos.tipo_mime  IS 'Tipo MIME del archivo. Ej: image/jpeg, application/pdf.';

-- =============================================================================
-- SECCIÓN 5: CAPA DE AUDITORÍA Y TRAZABILIDAD ISO
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabla: auditoria_logs
-- Propósito: Registro inmutable de cambios en datos maestros y transaccionales.
--            Guarda el estado previo (datos_previos) y el nuevo estado
--            (datos_nuevos) en formato JSONB para máxima flexibilidad.
-- -----------------------------------------------------------------------------
-- D-03: BIGSERIAL. registro_id como BIGINT para soportar IDs de cualquier tabla, incluidas las BIGSERIAL.
CREATE TABLE auditoria_logs (
    id             BIGSERIAL                PRIMARY KEY,
    usuario_id     INTEGER,
    accion         VARCHAR(100)             NOT NULL,
    tabla_afectada VARCHAR(100)             NOT NULL,
    registro_id    BIGINT                   NOT NULL,  -- D-03: cubre IDs SERIAL y BIGSERIAL
    datos_previos  JSONB,
    datos_nuevos   JSONB,
    ip_origen      VARCHAR(45),
    creado_en      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_auditoria_logs_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL  -- El log sobrevive si el usuario es eliminado
        ON UPDATE CASCADE
);

COMMENT ON TABLE  auditoria_logs             IS 'Log inmutable de cambios para trazabilidad ISO. Guarda estados previo y nuevo en JSONB.';
COMMENT ON COLUMN auditoria_logs.accion      IS 'Acción ejecutada. Ej: CREAR_INSPECCION, APROBAR_INSPECCION, MODIFICAR_EQUIPO.';
COMMENT ON COLUMN auditoria_logs.datos_previos IS 'Estado del registro ANTES del cambio en formato JSONB. NULL para operaciones INSERT.';
COMMENT ON COLUMN auditoria_logs.datos_nuevos  IS 'Estado del registro DESPUÉS del cambio en formato JSONB. NULL para operaciones DELETE.';
COMMENT ON COLUMN auditoria_logs.ip_origen   IS 'Dirección IP del cliente que originó la acción. Soporte IPv4 e IPv6 (45 chars).';

-- =============================================================================
-- SECCIÓN 6: ÍNDICES DE ALTO RENDIMIENTO
-- Estrategia: Índices B-Tree sobre todas las FK y columnas de filtrado frecuente
--             para garantizar lazy loading del Dashboard en < 100ms.
-- =============================================================================

-- Jerarquía de planta (navegación Data-Driven cascada)
CREATE INDEX idx_plantas_ubicacion_tecnica     ON plantas(ubicacion_tecnica_id);
CREATE INDEX idx_lineas_planta                 ON lineas(planta_id);
CREATE INDEX idx_equipos_linea                 ON equipos(linea_id);
CREATE INDEX idx_equipos_tipo_equipo           ON equipos(tipo_equipo);
CREATE INDEX idx_equipos_estado_operativo      ON equipos(estado_operativo);
CREATE INDEX idx_componentes_equipo            ON componentes(equipo_id);
CREATE INDEX idx_componentes_activo            ON componentes(activo);
CREATE INDEX idx_variables_componente          ON variables(componente_id);
CREATE INDEX idx_variables_tipo_evaluacion     ON variables(tipo_evaluacion);
CREATE INDEX idx_opciones_seleccion_variable   ON opciones_seleccion(variable_id);

-- Inspecciones y detalle (filtros de historial y Dashboard)
CREATE INDEX idx_inspecciones_equipo           ON inspecciones(equipo_id);
CREATE INDEX idx_inspecciones_elaborado_por    ON inspecciones(elaborado_por);
CREATE INDEX idx_inspecciones_fecha_registro   ON inspecciones(fecha_registro DESC);
CREATE INDEX idx_inspecciones_estado           ON inspecciones(estado_inspeccion);
CREATE INDEX idx_inspecciones_tipo             ON inspecciones(tipo_inspeccion);
CREATE INDEX idx_inspecciones_origen           ON inspecciones(origen_datos); -- D-07: Dashboard OFFLINE_SYNC
CREATE INDEX idx_inspeccion_detalles_inspeccion ON inspeccion_detalles(inspeccion_id);
CREATE INDEX idx_inspeccion_detalles_variable  ON inspeccion_detalles(variable_id);
CREATE INDEX idx_inspeccion_adjuntos_inspeccion ON inspeccion_adjuntos(inspeccion_id);
CREATE INDEX idx_inspeccion_adjuntos_detalle   ON inspeccion_adjuntos(detalle_id); -- D-04: queries por variable específica

-- Auditoría (búsqueda por tabla/registro y por fecha)
CREATE INDEX idx_auditoria_logs_usuario        ON auditoria_logs(usuario_id);
CREATE INDEX idx_auditoria_logs_tabla_registro ON auditoria_logs(tabla_afectada, registro_id);
CREATE INDEX idx_auditoria_logs_creado_en      ON auditoria_logs(creado_en DESC);

-- =============================================================================
-- SECCIÓN 7: TRIGGER — AUTO-ACTUALIZACIÓN DE actualizado_en
-- Evita depender del ORM para mantener el timestamp de última modificación.
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_set_actualizado_en()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.actualizado_en := NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_usuarios_actualizado_en
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();

CREATE TRIGGER trg_ubicaciones_tecnicas_actualizado_en
    BEFORE UPDATE ON ubicaciones_tecnicas
    FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();

CREATE TRIGGER trg_plantas_actualizado_en
    BEFORE UPDATE ON plantas
    FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();

CREATE TRIGGER trg_lineas_actualizado_en
    BEFORE UPDATE ON lineas
    FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();

CREATE TRIGGER trg_equipos_actualizado_en
    BEFORE UPDATE ON equipos
    FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();

CREATE TRIGGER trg_componentes_actualizado_en
    BEFORE UPDATE ON componentes
    FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();

CREATE TRIGGER trg_variables_actualizado_en
    BEFORE UPDATE ON variables
    FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();

CREATE TRIGGER trg_inspecciones_actualizado_en
    BEFORE UPDATE ON inspecciones
    FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();

-- =============================================================================
-- SECCIÓN 8: DATOS SEMILLA (SEED) — DATOS INICIALES DE OPERACIÓN
-- =============================================================================

-- Opciones de selección estándar (Leyenda oficial Tubrica)
-- Nota: estas opciones se insertan junto con cada variable durante la carga
--       del catálogo maestro de planta. Este bloque es solo de referencia.
-- INSERT INTO opciones_seleccion (variable_id, clave, etiqueta, orden_posicion)
-- VALUES
--   (?, 'N',   'Normal',    1),
--   (?, 'E',   'Existe',    2),
--   (?, 'A',   'Anormal',   3),
--   (?, 'B',   'Bajo',      4),
--   (?, 'NE',  'No Existe', 5),
--   (?, 'N/A', 'No Aplica', 6);

COMMIT;

-- =============================================================================
-- FIN DEL SCRIPT
-- Total de objetos creados:
--   - 7  Tipos ENUM
--   - 11 Tablas (7 Maestras + 4 Transaccionales)
--   - 1  Función PL/pgSQL  (fn_set_actualizado_en)
--   - 8  Triggers          (actualizado_en automático en tablas maestras + inspecciones)
--   - 23 Índices B-Tree    (22 base + idx_inspeccion_adjuntos_detalle)
--   - Comentarios en todas las tablas y columnas críticas
-- =============================================================================
