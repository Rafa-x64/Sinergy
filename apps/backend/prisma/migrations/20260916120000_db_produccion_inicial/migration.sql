-- Encoding: UTF-8
-- Este archivo debe mantenerse en UTF-8. No editar con editores que cambien el encoding.
SET client_encoding = 'UTF8';

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EstadoOperativo" AS ENUM ('OPERATIVO', 'INOPERATIVO', 'EN_MANTENIMIENTO');

-- CreateEnum
CREATE TYPE "TipoEvaluacion" AS ENUM ('NUMERICO_ENTERO', 'NUMERICO_DECIMAL', 'TEMPERATURA', 'SELECCION');

-- CreateEnum
CREATE TYPE "TipoInspeccion" AS ENUM ('VARIABLES_CRITICAS', 'MONTACARGAS', 'COMPRESOR', 'GENERADOR', 'CHILLER');

-- CreateEnum
CREATE TYPE "EstadoInspeccion" AS ENUM ('BORRADOR', 'PENDIENTE', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "OrigenDatos" AS ENUM ('ONLINE', 'OFFLINE_SYNC');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ERROR', 'WARNING', 'ALERT', 'SUCCESS');

-- CreateEnum
CREATE TYPE "CategoriaNotificacion" AS ENUM ('INSPECCION_PENDIENTE', 'INSPECCION_APROBADA', 'INSPECCION_RECHAZADA', 'AUDITORIA_SISTEMA');

-- CreateEnum
CREATE TYPE "NivelLubricante" AS ENUM ('OK', 'BAJO', 'CRITICO', 'SOBRELLENADO', 'NO_APLICA');

-- CreateEnum
CREATE TYPE "OrigenLecturaHorometro" AS ENUM ('RUTINA_LUBRICACION', 'INSPECCION_OPERATIVA', 'LECTURA_MANUAL', 'CAMBIO_ACEITE');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "nombreUsuario" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_acceso" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "planta_id" INTEGER,
    "supervisor_id" INTEGER,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "es_supervisor" BOOLEAN NOT NULL DEFAULT false,
    "requiere_supervisor" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles_usuario" (
    "id" SERIAL NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,

    CONSTRAINT "roles_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plantas" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plantas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ubicaciones_tecnicas" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "planta_id" INTEGER NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ubicaciones_tecnicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipos" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(100) NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "serial" VARCHAR(100),
    "marca" VARCHAR(100),
    "modelo" VARCHAR(100),
    "estado_operativo" "EstadoOperativo" NOT NULL DEFAULT 'OPERATIVO',
    "observacion" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "ubicacion_tecnica_id" INTEGER NOT NULL,
    "tipo_equipo_id" INTEGER NOT NULL,

    CONSTRAINT "equipos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_equipo" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "tipos_equipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "montacargas_detalles" (
    "id" SERIAL NOT NULL,
    "equipo_id" INTEGER NOT NULL,
    "denominacion" VARCHAR(255) NOT NULL,
    "tipo_montacarga" VARCHAR(100) NOT NULL DEFAULT 'Montacarga',
    "marca" VARCHAR(100) NOT NULL,
    "modelo" VARCHAR(100) NOT NULL,
    "identificacion_abreviada" VARCHAR(50) NOT NULL,
    "ubicacion_tecnica_texto" VARCHAR(100) NOT NULL,
    "denominacion_2" TEXT,

    CONSTRAINT "montacargas_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "componentes" (
    "id" SERIAL NOT NULL,
    "equipo_id" INTEGER NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden_posicion" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "componentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variables" (
    "id" SERIAL NOT NULL,
    "componente_id" INTEGER NOT NULL,
    "plantilla_id" INTEGER,
    "nombre" VARCHAR(255) NOT NULL,
    "tipo_evaluacion" "TipoEvaluacion" NOT NULL,
    "unidad" VARCHAR(20),
    "valor_minimo" DECIMAL(12,4),
    "valor_maximo" DECIMAL(12,4),
    "orden_posicion" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opciones_seleccion" (
    "id" SERIAL NOT NULL,
    "variable_id" INTEGER NOT NULL,
    "clave" VARCHAR(10) NOT NULL,
    "etiqueta" VARCHAR(100) NOT NULL,
    "orden_posicion" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "opciones_seleccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plantilla_variables" (
    "id" SERIAL NOT NULL,
    "tipo_equipo_id" INTEGER NOT NULL,
    "tipo_inspeccion" "TipoInspeccion",
    "nombre_componente" VARCHAR(255),
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "tipo_evaluacion" "TipoEvaluacion" NOT NULL,
    "unidad" VARCHAR(20),
    "valor_minimo" DECIMAL(12,4),
    "valor_maximo" DECIMAL(12,4),
    "orden_posicion" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plantilla_variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plantilla_opciones_seleccion" (
    "id" SERIAL NOT NULL,
    "plantilla_id" INTEGER,
    "clave" VARCHAR(10) NOT NULL,
    "etiqueta" VARCHAR(100) NOT NULL,
    "orden_posicion" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "plantilla_opciones_seleccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspecciones" (
    "id" BIGSERIAL NOT NULL,
    "codigo_inspeccion" VARCHAR(100) NOT NULL,
    "tipo_inspeccion" "TipoInspeccion" NOT NULL,
    "planta_id" INTEGER,
    "ubicacion_tecnica_id" INTEGER,
    "tipo_equipo_id" INTEGER,
    "equipo_id" INTEGER,
    "elaborado_por" INTEGER NOT NULL,
    "revisado_por" INTEGER,
    "aprobado_por" INTEGER,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_sincronizacion" TIMESTAMP(3),
    "estado_inspeccion" "EstadoInspeccion" NOT NULL DEFAULT 'PENDIENTE',
    "origen_datos" "OrigenDatos" NOT NULL DEFAULT 'ONLINE',
    "observaciones_generales" TEXT,
    "motivo_rechazo" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspecciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspeccion_detalles" (
    "id" BIGSERIAL NOT NULL,
    "inspeccion_id" BIGINT NOT NULL,
    "variable_id" INTEGER NOT NULL,
    "valor_numerico" DECIMAL(12,4),
    "valor_seleccion" VARCHAR(10),
    "observaciones" TEXT,
    "estado_componente" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "inspeccion_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspeccion_adjuntos" (
    "id" BIGSERIAL NOT NULL,
    "inspeccion_id" BIGINT NOT NULL,
    "detalle_id" BIGINT,
    "ruta_archivo" VARCHAR(500) NOT NULL,
    "nombre_archivo" VARCHAR(255) NOT NULL,
    "tipo_mime" VARCHAR(100) NOT NULL,
    "tamano_bytes" BIGINT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspeccion_adjuntos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_logs" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" INTEGER,
    "accion" VARCHAR(100) NOT NULL,
    "tabla_afectada" VARCHAR(100) NOT NULL,
    "registro_id" BIGINT NOT NULL,
    "datos_previos" JSONB,
    "datos_nuevos" JSONB,
    "ip_origen" VARCHAR(45),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "usuario_id" INTEGER,
    "tipo" "NotificationType" NOT NULL,
    "categoria" "CategoriaNotificacion" NOT NULL DEFAULT 'AUDITORIA_SISTEMA',
    "titulo" VARCHAR(150) NOT NULL DEFAULT 'Notificación del Sistema',
    "mensaje" TEXT NOT NULL,
    "entidad_afectada" VARCHAR(50),
    "entidad_id" VARCHAR(100),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogo_lubricantes" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "marca" VARCHAR(100),
    "tipo" VARCHAR(100) NOT NULL,
    "viscosidad" VARCHAR(50),
    "unidad_medida" VARCHAR(50) NOT NULL DEFAULT 'Litros',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catalogo_lubricantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puntos_lubricacion" (
    "id" SERIAL NOT NULL,
    "equipo_id" INTEGER NOT NULL,
    "componente_id" INTEGER,
    "lubricante_id" INTEGER NOT NULL,
    "nombre_punto" VARCHAR(150) NOT NULL,
    "limite_horas_cambio" DECIMAL(10,2) NOT NULL,
    "horometro_ultimo_cambio" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fecha_ultimo_cambio" TIMESTAMP(3),
    "capacidad_recomendada" DECIMAL(8,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "puntos_lubricacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_horometros" (
    "id" BIGSERIAL NOT NULL,
    "equipo_id" INTEGER NOT NULL,
    "valor_horometro" DECIMAL(10,2) NOT NULL,
    "fecha_lectura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "origen" "OrigenLecturaHorometro" NOT NULL DEFAULT 'RUTINA_LUBRICACION',
    "registrado_por_id" INTEGER NOT NULL,
    "es_reemplazo_reloj" BOOLEAN NOT NULL DEFAULT false,
    "justificacion" TEXT,

    CONSTRAINT "historial_horometros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rutinas_lubricacion" (
    "id" BIGSERIAL NOT NULL,
    "codigo_rutina" VARCHAR(100) NOT NULL,
    "planta_id" INTEGER NOT NULL,
    "ubicacion_tecnica_id" INTEGER NOT NULL,
    "equipo_id" INTEGER NOT NULL,
    "elaborado_por_id" INTEGER NOT NULL,
    "fecha_ejecucion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "horometro_registrado" DECIMAL(10,2) NOT NULL,
    "observaciones" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rutinas_lubricacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rutina_lubricacion_detalles" (
    "id" BIGSERIAL NOT NULL,
    "rutina_id" BIGINT NOT NULL,
    "punto_lubricacion_id" INTEGER NOT NULL,
    "nivel_lubricante" "NivelLubricante" NOT NULL DEFAULT 'OK',
    "se_realizo_reposicion" BOOLEAN NOT NULL DEFAULT false,
    "cantidad_repuesta" DECIMAL(8,2),
    "se_realizo_cambio_total" BOOLEAN NOT NULL DEFAULT false,
    "presenta_fuga" BOOLEAN NOT NULL DEFAULT false,
    "observaciones" TEXT,

    CONSTRAINT "rutina_lubricacion_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_nombreUsuario_key" ON "usuarios"("nombreUsuario");

-- CreateIndex
CREATE INDEX "usuarios_supervisor_id_idx" ON "usuarios"("supervisor_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "roles_usuario_rol_id_usuario_id_key" ON "roles_usuario"("rol_id", "usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "plantas_codigo_key" ON "plantas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "plantas_nombre_key" ON "plantas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ubicaciones_tecnicas_codigo_key" ON "ubicaciones_tecnicas"("codigo");

-- CreateIndex
CREATE INDEX "ubicaciones_tecnicas_planta_id_idx" ON "ubicaciones_tecnicas"("planta_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipos_codigo_key" ON "equipos"("codigo");

-- CreateIndex
CREATE INDEX "equipos_ubicacion_tecnica_id_idx" ON "equipos"("ubicacion_tecnica_id");

-- CreateIndex
CREATE INDEX "equipos_tipo_equipo_id_idx" ON "equipos"("tipo_equipo_id");

-- CreateIndex
CREATE INDEX "equipos_estado_operativo_idx" ON "equipos"("estado_operativo");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_equipo_nombre_key" ON "tipos_equipo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "montacargas_detalles_equipo_id_key" ON "montacargas_detalles"("equipo_id");

-- CreateIndex
CREATE INDEX "componentes_equipo_id_idx" ON "componentes"("equipo_id");

-- CreateIndex
CREATE INDEX "componentes_activo_idx" ON "componentes"("activo");

-- CreateIndex
CREATE INDEX "variables_componente_id_idx" ON "variables"("componente_id");

-- CreateIndex
CREATE INDEX "variables_plantilla_id_idx" ON "variables"("plantilla_id");

-- CreateIndex
CREATE INDEX "opciones_seleccion_variable_id_idx" ON "opciones_seleccion"("variable_id");

-- CreateIndex
CREATE UNIQUE INDEX "opciones_seleccion_variable_id_clave_key" ON "opciones_seleccion"("variable_id", "clave");

-- CreateIndex
CREATE INDEX "plantilla_variables_tipo_equipo_id_idx" ON "plantilla_variables"("tipo_equipo_id");

-- CreateIndex
CREATE INDEX "plantilla_variables_tipo_inspeccion_idx" ON "plantilla_variables"("tipo_inspeccion");

-- CreateIndex
CREATE INDEX "plantilla_variables_nombre_componente_idx" ON "plantilla_variables"("nombre_componente");

-- CreateIndex
CREATE INDEX "plantilla_opciones_seleccion_plantilla_id_idx" ON "plantilla_opciones_seleccion"("plantilla_id");

-- CreateIndex
CREATE UNIQUE INDEX "plantilla_opciones_seleccion_plantilla_id_clave_key" ON "plantilla_opciones_seleccion"("plantilla_id", "clave");

-- CreateIndex
CREATE UNIQUE INDEX "inspecciones_codigo_inspeccion_key" ON "inspecciones"("codigo_inspeccion");

-- CreateIndex
CREATE INDEX "inspecciones_planta_id_idx" ON "inspecciones"("planta_id");

-- CreateIndex
CREATE INDEX "inspecciones_ubicacion_tecnica_id_idx" ON "inspecciones"("ubicacion_tecnica_id");

-- CreateIndex
CREATE INDEX "inspecciones_tipo_equipo_id_idx" ON "inspecciones"("tipo_equipo_id");

-- CreateIndex
CREATE INDEX "inspecciones_equipo_id_idx" ON "inspecciones"("equipo_id");

-- CreateIndex
CREATE INDEX "inspecciones_elaborado_por_idx" ON "inspecciones"("elaborado_por");

-- CreateIndex
CREATE INDEX "inspecciones_fecha_registro_idx" ON "inspecciones"("fecha_registro");

-- CreateIndex
CREATE INDEX "inspecciones_estado_inspeccion_idx" ON "inspecciones"("estado_inspeccion");

-- CreateIndex
CREATE INDEX "inspecciones_tipo_inspeccion_idx" ON "inspecciones"("tipo_inspeccion");

-- CreateIndex
CREATE INDEX "inspecciones_origen_datos_idx" ON "inspecciones"("origen_datos");

-- CreateIndex
CREATE INDEX "inspeccion_detalles_inspeccion_id_idx" ON "inspeccion_detalles"("inspeccion_id");

-- CreateIndex
CREATE INDEX "inspeccion_detalles_variable_id_idx" ON "inspeccion_detalles"("variable_id");

-- CreateIndex
CREATE INDEX "inspeccion_adjuntos_inspeccion_id_idx" ON "inspeccion_adjuntos"("inspeccion_id");

-- CreateIndex
CREATE INDEX "inspeccion_adjuntos_detalle_id_idx" ON "inspeccion_adjuntos"("detalle_id");

-- CreateIndex
CREATE INDEX "auditoria_logs_usuario_id_idx" ON "auditoria_logs"("usuario_id");

-- CreateIndex
CREATE INDEX "auditoria_logs_tabla_afectada_registro_id_idx" ON "auditoria_logs"("tabla_afectada", "registro_id");

-- CreateIndex
CREATE INDEX "auditoria_logs_creado_en_idx" ON "auditoria_logs"("creado_en");

-- CreateIndex
CREATE INDEX "notifications_usuario_id_is_read_idx" ON "notifications"("usuario_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_categoria_idx" ON "notifications"("categoria");

-- CreateIndex
CREATE UNIQUE INDEX "catalogo_lubricantes_codigo_key" ON "catalogo_lubricantes"("codigo");

-- CreateIndex
CREATE INDEX "puntos_lubricacion_equipo_id_idx" ON "puntos_lubricacion"("equipo_id");

-- CreateIndex
CREATE INDEX "puntos_lubricacion_componente_id_idx" ON "puntos_lubricacion"("componente_id");

-- CreateIndex
CREATE INDEX "puntos_lubricacion_lubricante_id_idx" ON "puntos_lubricacion"("lubricante_id");

-- CreateIndex
CREATE INDEX "historial_horometros_equipo_id_fecha_lectura_idx" ON "historial_horometros"("equipo_id", "fecha_lectura");

-- CreateIndex
CREATE UNIQUE INDEX "rutinas_lubricacion_codigo_rutina_key" ON "rutinas_lubricacion"("codigo_rutina");

-- CreateIndex
CREATE INDEX "rutinas_lubricacion_planta_id_idx" ON "rutinas_lubricacion"("planta_id");

-- CreateIndex
CREATE INDEX "rutinas_lubricacion_ubicacion_tecnica_id_idx" ON "rutinas_lubricacion"("ubicacion_tecnica_id");

-- CreateIndex
CREATE INDEX "rutinas_lubricacion_equipo_id_idx" ON "rutinas_lubricacion"("equipo_id");

-- CreateIndex
CREATE INDEX "rutinas_lubricacion_fecha_ejecucion_idx" ON "rutinas_lubricacion"("fecha_ejecucion");

-- CreateIndex
CREATE INDEX "rutina_lubricacion_detalles_rutina_id_idx" ON "rutina_lubricacion_detalles"("rutina_id");

-- CreateIndex
CREATE INDEX "rutina_lubricacion_detalles_punto_lubricacion_id_idx" ON "rutina_lubricacion_detalles"("punto_lubricacion_id");

-- CreateIndex
CREATE INDEX "rutina_lubricacion_detalles_presenta_fuga_idx" ON "rutina_lubricacion_detalles"("presenta_fuga");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_planta_id_fkey" FOREIGN KEY ("planta_id") REFERENCES "plantas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_usuario" ADD CONSTRAINT "roles_usuario_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_usuario" ADD CONSTRAINT "roles_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ubicaciones_tecnicas" ADD CONSTRAINT "ubicaciones_tecnicas_planta_id_fkey" FOREIGN KEY ("planta_id") REFERENCES "plantas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipos" ADD CONSTRAINT "equipos_ubicacion_tecnica_id_fkey" FOREIGN KEY ("ubicacion_tecnica_id") REFERENCES "ubicaciones_tecnicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipos" ADD CONSTRAINT "equipos_tipo_equipo_id_fkey" FOREIGN KEY ("tipo_equipo_id") REFERENCES "tipos_equipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "montacargas_detalles" ADD CONSTRAINT "montacargas_detalles_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "componentes" ADD CONSTRAINT "componentes_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variables" ADD CONSTRAINT "variables_componente_id_fkey" FOREIGN KEY ("componente_id") REFERENCES "componentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variables" ADD CONSTRAINT "variables_plantilla_id_fkey" FOREIGN KEY ("plantilla_id") REFERENCES "plantilla_variables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opciones_seleccion" ADD CONSTRAINT "opciones_seleccion_variable_id_fkey" FOREIGN KEY ("variable_id") REFERENCES "variables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantilla_variables" ADD CONSTRAINT "plantilla_variables_tipo_equipo_id_fkey" FOREIGN KEY ("tipo_equipo_id") REFERENCES "tipos_equipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantilla_opciones_seleccion" ADD CONSTRAINT "plantilla_opciones_seleccion_plantilla_id_fkey" FOREIGN KEY ("plantilla_id") REFERENCES "plantilla_variables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecciones" ADD CONSTRAINT "inspecciones_planta_id_fkey" FOREIGN KEY ("planta_id") REFERENCES "plantas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecciones" ADD CONSTRAINT "inspecciones_ubicacion_tecnica_id_fkey" FOREIGN KEY ("ubicacion_tecnica_id") REFERENCES "ubicaciones_tecnicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecciones" ADD CONSTRAINT "inspecciones_tipo_equipo_id_fkey" FOREIGN KEY ("tipo_equipo_id") REFERENCES "tipos_equipo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecciones" ADD CONSTRAINT "inspecciones_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecciones" ADD CONSTRAINT "inspecciones_elaborado_por_fkey" FOREIGN KEY ("elaborado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecciones" ADD CONSTRAINT "inspecciones_revisado_por_fkey" FOREIGN KEY ("revisado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecciones" ADD CONSTRAINT "inspecciones_aprobado_por_fkey" FOREIGN KEY ("aprobado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspeccion_detalles" ADD CONSTRAINT "inspeccion_detalles_inspeccion_id_fkey" FOREIGN KEY ("inspeccion_id") REFERENCES "inspecciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspeccion_detalles" ADD CONSTRAINT "inspeccion_detalles_variable_id_fkey" FOREIGN KEY ("variable_id") REFERENCES "variables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspeccion_adjuntos" ADD CONSTRAINT "inspeccion_adjuntos_inspeccion_id_fkey" FOREIGN KEY ("inspeccion_id") REFERENCES "inspecciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspeccion_adjuntos" ADD CONSTRAINT "inspeccion_adjuntos_detalle_id_fkey" FOREIGN KEY ("detalle_id") REFERENCES "inspeccion_detalles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_logs" ADD CONSTRAINT "auditoria_logs_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puntos_lubricacion" ADD CONSTRAINT "puntos_lubricacion_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puntos_lubricacion" ADD CONSTRAINT "puntos_lubricacion_componente_id_fkey" FOREIGN KEY ("componente_id") REFERENCES "componentes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puntos_lubricacion" ADD CONSTRAINT "puntos_lubricacion_lubricante_id_fkey" FOREIGN KEY ("lubricante_id") REFERENCES "catalogo_lubricantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_horometros" ADD CONSTRAINT "historial_horometros_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_horometros" ADD CONSTRAINT "historial_horometros_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutinas_lubricacion" ADD CONSTRAINT "rutinas_lubricacion_planta_id_fkey" FOREIGN KEY ("planta_id") REFERENCES "plantas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutinas_lubricacion" ADD CONSTRAINT "rutinas_lubricacion_ubicacion_tecnica_id_fkey" FOREIGN KEY ("ubicacion_tecnica_id") REFERENCES "ubicaciones_tecnicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutinas_lubricacion" ADD CONSTRAINT "rutinas_lubricacion_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutinas_lubricacion" ADD CONSTRAINT "rutinas_lubricacion_elaborado_por_id_fkey" FOREIGN KEY ("elaborado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutina_lubricacion_detalles" ADD CONSTRAINT "rutina_lubricacion_detalles_rutina_id_fkey" FOREIGN KEY ("rutina_id") REFERENCES "rutinas_lubricacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutina_lubricacion_detalles" ADD CONSTRAINT "rutina_lubricacion_detalles_punto_lubricacion_id_fkey" FOREIGN KEY ("punto_lubricacion_id") REFERENCES "puntos_lubricacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

