-- CreateTable
CREATE TABLE IF NOT EXISTS "plantilla_puntos_lubricacion" (
    "id" SERIAL NOT NULL,
    "tipo_equipo_id" INTEGER NOT NULL,
    "nombre_componente" VARCHAR(255),
    "nombre_punto" VARCHAR(150) NOT NULL,
    "lubricante_id" INTEGER NOT NULL,
    "limite_horas_cambio" DECIMAL(10,2) NOT NULL,
    "capacidad_recomendada" DECIMAL(8,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plantilla_puntos_lubricacion_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "puntos_lubricacion" ADD COLUMN IF NOT EXISTS "plantilla_id" INTEGER;

-- AlterTable
ALTER TABLE "rutinas_lubricacion" ADD COLUMN IF NOT EXISTS "inspeccion_id" BIGINT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "plantilla_puntos_lubricacion_tipo_equipo_id_idx" ON "plantilla_puntos_lubricacion"("tipo_equipo_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "plantilla_puntos_lubricacion_lubricante_id_idx" ON "plantilla_puntos_lubricacion"("lubricante_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "plantilla_puntos_lubricacion_nombre_componente_idx" ON "plantilla_puntos_lubricacion"("nombre_componente");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "puntos_lubricacion_plantilla_id_idx" ON "puntos_lubricacion"("plantilla_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "rutinas_lubricacion_inspeccion_id_key" ON "rutinas_lubricacion"("inspeccion_id");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'plantilla_puntos_lubricacion_tipo_equipo_id_fkey'
    ) THEN
        ALTER TABLE "plantilla_puntos_lubricacion" ADD CONSTRAINT "plantilla_puntos_lubricacion_tipo_equipo_id_fkey" FOREIGN KEY ("tipo_equipo_id") REFERENCES "tipos_equipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'plantilla_puntos_lubricacion_lubricante_id_fkey'
    ) THEN
        ALTER TABLE "plantilla_puntos_lubricacion" ADD CONSTRAINT "plantilla_puntos_lubricacion_lubricante_id_fkey" FOREIGN KEY ("lubricante_id") REFERENCES "catalogo_lubricantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'puntos_lubricacion_plantilla_id_fkey'
    ) THEN
        ALTER TABLE "puntos_lubricacion" ADD CONSTRAINT "puntos_lubricacion_plantilla_id_fkey" FOREIGN KEY ("plantilla_id") REFERENCES "plantilla_puntos_lubricacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'rutinas_lubricacion_inspeccion_id_fkey'
    ) THEN
        ALTER TABLE "rutinas_lubricacion" ADD CONSTRAINT "rutinas_lubricacion_inspeccion_id_fkey" FOREIGN KEY ("inspeccion_id") REFERENCES "inspecciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
