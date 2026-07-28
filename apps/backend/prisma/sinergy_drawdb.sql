-- =============================================================================
-- SINERGY — SCHEMA PARA DRAWDB (SOLO VISUALIZACIÓN DE DIAGRAMA)
-- ⚠  ESTE ARCHIVO ES SOLO PARA IMPORTAR EN DRAWDB.
--    El schema canónico de producción es: sinergy_schema.sql
-- =============================================================================
-- DrawDB no soporta: CREATE TYPE AS ENUM, CREATE FUNCTION, CREATE TRIGGER,
-- COMMENT ON, BEGIN/COMMIT, TIMESTAMP WITH TIME ZONE ni BIGSERIAL.
-- Por eso este archivo usa VARCHAR, TIMESTAMP y BIGINT equivalentes.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CAPA 1: SEGURIDAD Y USUARIOS
-- -----------------------------------------------------------------------------

CREATE TABLE usuarios (
    id             SERIAL       PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL,
    apellido       VARCHAR(100) NOT NULL,
    email          VARCHAR(150) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    rol            VARCHAR(20)  NOT NULL DEFAULT 'TECNICO',
    activo         BOOLEAN      NOT NULL DEFAULT TRUE,
    ultimo_acceso  TIMESTAMP,
    creado_en      TIMESTAMP    NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- CAPA 2: JERARQUÍA FÍSICA DE PLANTA (DATA-DRIVEN UI)
-- -----------------------------------------------------------------------------

CREATE TABLE ubicaciones_tecnicas (
    id             SERIAL       PRIMARY KEY,
    codigo         VARCHAR(50)  NOT NULL UNIQUE,
    nombre         VARCHAR(255) NOT NULL,
    descripcion    TEXT,
    planta_id      INTEGER,
    creado_en      TIMESTAMP    NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_ubicaciones_tecnicas_planta FOREIGN KEY (planta_id)
        REFERENCES plantas(id) ON DELETE SET NULL
);

CREATE TABLE plantas (
    id                   SERIAL       PRIMARY KEY,
    codigo               VARCHAR(50)  NOT NULL UNIQUE,
    nombre               VARCHAR(255) NOT NULL UNIQUE,
    activa               BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en            TIMESTAMP    NOT NULL DEFAULT NOW(),
    actualizado_en       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE lineas (
    id             SERIAL       PRIMARY KEY,
    codigo         VARCHAR(50)  NOT NULL,
    nombre         VARCHAR(255) NOT NULL,
    planta_id      INTEGER      NOT NULL,
    activa         BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en      TIMESTAMP    NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_lineas_codigo_planta UNIQUE (codigo, planta_id),
    CONSTRAINT fk_lineas_planta FOREIGN KEY (planta_id)
        REFERENCES plantas(id) ON DELETE RESTRICT
);

CREATE TABLE equipos (
    id               SERIAL       PRIMARY KEY,
    codigo           VARCHAR(100) NOT NULL UNIQUE,
    nombre           VARCHAR(255) NOT NULL,
    tipo_equipo      VARCHAR(20)  NOT NULL,
    linea_id         INTEGER,
    serial           VARCHAR(100),
    marca            VARCHAR(100),
    modelo           VARCHAR(100),
    estado_operativo VARCHAR(20)  NOT NULL DEFAULT 'OPERATIVO',
    observacion      TEXT,
    creado_en        TIMESTAMP    NOT NULL DEFAULT NOW(),
    actualizado_en   TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_equipos_linea FOREIGN KEY (linea_id)
        REFERENCES lineas(id) ON DELETE SET NULL
);

CREATE TABLE montacargas_detalles (
    id                       SERIAL       PRIMARY KEY,
    equipo_id                INTEGER      NOT NULL UNIQUE,
    denominacion             VARCHAR(255) NOT NULL,
    tipo_montacarga          VARCHAR(100) NOT NULL DEFAULT 'Montacarga',
    marca                    VARCHAR(100) NOT NULL,
    modelo                   VARCHAR(100) NOT NULL,
    identificacion_abreviada VARCHAR(50)  NOT NULL,
    ubicacion_tecnica_texto  VARCHAR(100) NOT NULL,
    denominacion_2           TEXT,

    CONSTRAINT fk_montacargas_equipo FOREIGN KEY (equipo_id)
        REFERENCES equipos(id) ON DELETE CASCADE
);

CREATE TABLE componentes (
    id             SERIAL       PRIMARY KEY,
    equipo_id      INTEGER      NOT NULL,
    nombre         VARCHAR(255) NOT NULL,
    descripcion    TEXT,
    activo         BOOLEAN      NOT NULL DEFAULT TRUE,
    orden_posicion INTEGER      NOT NULL DEFAULT 0,
    creado_en      TIMESTAMP    NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_componentes_equipo FOREIGN KEY (equipo_id)
        REFERENCES equipos(id) ON DELETE CASCADE
);

CREATE TABLE variables (
    id              SERIAL       PRIMARY KEY,
    componente_id   INTEGER      NOT NULL,
    nombre          VARCHAR(255) NOT NULL,
    tipo_evaluacion VARCHAR(20)  NOT NULL,
    unidad          VARCHAR(20),
    valor_minimo    NUMERIC(12, 4),
    valor_maximo    NUMERIC(12, 4),
    orden_posicion  INTEGER      NOT NULL DEFAULT 0,
    activa          BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMP    NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_variables_componente FOREIGN KEY (componente_id)
        REFERENCES componentes(id) ON DELETE CASCADE
);

CREATE TABLE opciones_seleccion (
    id             SERIAL       PRIMARY KEY,
    variable_id    INTEGER      NOT NULL,
    clave          VARCHAR(10)  NOT NULL,
    etiqueta       VARCHAR(100) NOT NULL,
    orden_posicion INTEGER      NOT NULL DEFAULT 0,

    CONSTRAINT uq_opciones_variable_clave UNIQUE (variable_id, clave),
    CONSTRAINT fk_opciones_variable FOREIGN KEY (variable_id)
        REFERENCES variables(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- CAPA 3: REGISTRO DE INSPECCIONES
-- (id en BIGINT — tabla de alto volumen)
-- -----------------------------------------------------------------------------

CREATE TABLE inspecciones (
    id                      BIGINT       PRIMARY KEY,
    codigo_inspeccion       VARCHAR(100) NOT NULL UNIQUE,
    tipo_inspeccion         VARCHAR(20)  NOT NULL,
    equipo_id               INTEGER      NOT NULL,
    elaborado_por           INTEGER      NOT NULL,
    revisado_por            INTEGER,
    aprobado_por            INTEGER,
    fecha_registro          TIMESTAMP    NOT NULL DEFAULT NOW(),
    fecha_sincronizacion    TIMESTAMP,
    estado_inspeccion       VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE',
    origen_datos            VARCHAR(20)  NOT NULL DEFAULT 'ONLINE',
    observaciones_generales TEXT,
    creado_en               TIMESTAMP    NOT NULL DEFAULT NOW(),
    actualizado_en          TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_inspecciones_equipo FOREIGN KEY (equipo_id)
        REFERENCES equipos(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inspecciones_elaborado FOREIGN KEY (elaborado_por)
        REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inspecciones_revisado FOREIGN KEY (revisado_por)
        REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_inspecciones_aprobado FOREIGN KEY (aprobado_por)
        REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE inspeccion_detalles (
    id               BIGINT   PRIMARY KEY,
    inspeccion_id    BIGINT   NOT NULL,
    variable_id      INTEGER  NOT NULL,
    valor_numerico   NUMERIC(12, 4),
    valor_seleccion  VARCHAR(10),
    observaciones    TEXT,
    estado_componente BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_det_inspeccion FOREIGN KEY (inspeccion_id)
        REFERENCES inspecciones(id) ON DELETE CASCADE,
    CONSTRAINT fk_det_variable FOREIGN KEY (variable_id)
        REFERENCES variables(id) ON DELETE RESTRICT
);

CREATE TABLE inspeccion_adjuntos (
    id             BIGINT       PRIMARY KEY,
    inspeccion_id  BIGINT       NOT NULL,
    detalle_id     BIGINT,
    ruta_archivo   VARCHAR(500) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo_mime      VARCHAR(100) NOT NULL,
    tamano_bytes   BIGINT       NOT NULL,
    creado_en      TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_adj_inspeccion FOREIGN KEY (inspeccion_id)
        REFERENCES inspecciones(id) ON DELETE CASCADE,
    CONSTRAINT fk_adj_detalle FOREIGN KEY (detalle_id)
        REFERENCES inspeccion_detalles(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- CAPA 4: AUDITORÍA ISO
-- -----------------------------------------------------------------------------

CREATE TABLE auditoria_logs (
    id             BIGINT       PRIMARY KEY,
    usuario_id     INTEGER,
    accion         VARCHAR(100) NOT NULL,
    tabla_afectada VARCHAR(100) NOT NULL,
    registro_id    BIGINT       NOT NULL,
    datos_previos  TEXT,
    datos_nuevos   TEXT,
    ip_origen      VARCHAR(45),
    creado_en      TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_audit_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE SET NULL
);

-- =============================================================================
-- ÍNDICES (compatibles con DrawDB)
-- =============================================================================

CREATE INDEX idx_ubicaciones_tecnicas_planta ON ubicaciones_tecnicas(planta_id);
CREATE INDEX idx_lineas_planta                 ON lineas(planta_id);
CREATE INDEX idx_equipos_linea                 ON equipos(linea_id);
CREATE INDEX idx_equipos_tipo_equipo           ON equipos(tipo_equipo);
CREATE INDEX idx_equipos_estado_operativo      ON equipos(estado_operativo);
CREATE INDEX idx_componentes_equipo            ON componentes(equipo_id);
CREATE INDEX idx_componentes_activo            ON componentes(activo);
CREATE INDEX idx_variables_componente          ON variables(componente_id);
CREATE INDEX idx_variables_tipo_evaluacion     ON variables(tipo_evaluacion);
CREATE INDEX idx_opciones_seleccion_variable   ON opciones_seleccion(variable_id);

CREATE INDEX idx_inspecciones_equipo           ON inspecciones(equipo_id);
CREATE INDEX idx_inspecciones_elaborado_por    ON inspecciones(elaborado_por);
CREATE INDEX idx_inspecciones_fecha_registro   ON inspecciones(fecha_registro);
CREATE INDEX idx_inspecciones_estado           ON inspecciones(estado_inspeccion);
CREATE INDEX idx_inspecciones_tipo             ON inspecciones(tipo_inspeccion);
CREATE INDEX idx_inspecciones_origen           ON inspecciones(origen_datos);
CREATE INDEX idx_inspeccion_detalles_inspeccion ON inspeccion_detalles(inspeccion_id);
CREATE INDEX idx_inspeccion_detalles_variable  ON inspeccion_detalles(variable_id);
CREATE INDEX idx_inspeccion_adjuntos_inspeccion ON inspeccion_adjuntos(inspeccion_id);
CREATE INDEX idx_inspeccion_adjuntos_detalle   ON inspeccion_adjuntos(detalle_id);

CREATE INDEX idx_auditoria_logs_usuario        ON auditoria_logs(usuario_id);
CREATE INDEX idx_auditoria_logs_tabla_registro ON auditoria_logs(tabla_afectada, registro_id);
CREATE INDEX idx_auditoria_logs_creado_en      ON auditoria_logs(creado_en);
