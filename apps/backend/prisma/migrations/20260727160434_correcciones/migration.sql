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

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_acceso" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,

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
CREATE TABLE "ubicaciones_tecnicas" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ubicaciones_tecnicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plantas" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "ubicacion_tecnica_id" INTEGER,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plantas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lineas" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "planta_id" INTEGER NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lineas_pkey" PRIMARY KEY ("id")
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
    "linea_id" INTEGER,
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
CREATE TABLE "inspecciones" (
    "id" BIGSERIAL NOT NULL,
    "codigo_inspeccion" VARCHAR(100) NOT NULL,
    "tipo_inspeccion" "TipoInspeccion" NOT NULL,
    "equipo_id" INTEGER NOT NULL,
    "elaborado_por" INTEGER NOT NULL,
    "revisado_por" INTEGER,
    "aprobado_por" INTEGER,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_sincronizacion" TIMESTAMP(3),
    "estado_inspeccion" "EstadoInspeccion" NOT NULL DEFAULT 'PENDIENTE',
    "origen_datos" "OrigenDatos" NOT NULL DEFAULT 'ONLINE',
    "observaciones_generales" TEXT,
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

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "roles_usuario_rol_id_usuario_id_key" ON "roles_usuario"("rol_id", "usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "ubicaciones_tecnicas_codigo_key" ON "ubicaciones_tecnicas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "plantas_codigo_key" ON "plantas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "plantas_nombre_key" ON "plantas"("nombre");

-- CreateIndex
CREATE INDEX "plantas_ubicacion_tecnica_id_idx" ON "plantas"("ubicacion_tecnica_id");

-- CreateIndex
CREATE INDEX "lineas_planta_id_idx" ON "lineas"("planta_id");

-- CreateIndex
CREATE UNIQUE INDEX "lineas_codigo_planta_id_key" ON "lineas"("codigo", "planta_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipos_codigo_key" ON "equipos"("codigo");

-- CreateIndex
CREATE INDEX "equipos_linea_id_idx" ON "equipos"("linea_id");

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
CREATE INDEX "variables_tipo_evaluacion_idx" ON "variables"("tipo_evaluacion");

-- CreateIndex
CREATE INDEX "opciones_seleccion_variable_id_idx" ON "opciones_seleccion"("variable_id");

-- CreateIndex
CREATE UNIQUE INDEX "opciones_seleccion_variable_id_clave_key" ON "opciones_seleccion"("variable_id", "clave");

-- CreateIndex
CREATE UNIQUE INDEX "inspecciones_codigo_inspeccion_key" ON "inspecciones"("codigo_inspeccion");

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

-- AddForeignKey
ALTER TABLE "roles_usuario" ADD CONSTRAINT "roles_usuario_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_usuario" ADD CONSTRAINT "roles_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantas" ADD CONSTRAINT "plantas_ubicacion_tecnica_id_fkey" FOREIGN KEY ("ubicacion_tecnica_id") REFERENCES "ubicaciones_tecnicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas" ADD CONSTRAINT "lineas_planta_id_fkey" FOREIGN KEY ("planta_id") REFERENCES "plantas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipos" ADD CONSTRAINT "equipos_linea_id_fkey" FOREIGN KEY ("linea_id") REFERENCES "lineas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipos" ADD CONSTRAINT "equipos_tipo_equipo_id_fkey" FOREIGN KEY ("tipo_equipo_id") REFERENCES "tipos_equipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "montacargas_detalles" ADD CONSTRAINT "montacargas_detalles_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "componentes" ADD CONSTRAINT "componentes_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variables" ADD CONSTRAINT "variables_componente_id_fkey" FOREIGN KEY ("componente_id") REFERENCES "componentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opciones_seleccion" ADD CONSTRAINT "opciones_seleccion_variable_id_fkey" FOREIGN KEY ("variable_id") REFERENCES "variables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecciones" ADD CONSTRAINT "inspecciones_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
