/*
  Warnings:

  - You are about to drop the column `planta_id` on the `lineas` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[codigo,ubicacion_tecnica_id]` on the table `lineas` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ubicacion_tecnica_id` to the `lineas` table without a default value. This is not possible if the table is not empty.

*/
-- 1. Agregar el campo 'activa' a ubicaciones_tecnicas (valor por defecto TRUE)
ALTER TABLE "ubicaciones_tecnicas" ADD COLUMN "activa" BOOLEAN NOT NULL DEFAULT true;

-- 2. Agregar la nueva columna 'ubicacion_tecnica_id' a la tabla lineas permitiendo NULL inicialmente
ALTER TABLE "lineas" ADD COLUMN "ubicacion_tecnica_id" INTEGER;

-- 3. Mapear los registros existentes de lineas a una ubicación técnica válida (ejemplo: ID 1)
UPDATE "lineas" SET "ubicacion_tecnica_id" = 1 WHERE "ubicacion_tecnica_id" IS NULL;

-- 4. Convertir 'ubicacion_tecnica_id' a NOT NULL
ALTER TABLE "lineas" ALTER COLUMN "ubicacion_tecnica_id" SET NOT NULL;

-- 5. Eliminar la restricción de unicidad y la clave foránea antiguas en 'lineas'
ALTER TABLE "lineas" DROP CONSTRAINT IF EXISTS "uq_linea_planta";
ALTER TABLE "lineas" DROP CONSTRAINT IF EXISTS "lineas_planta_id_fkey";
DROP INDEX IF EXISTS "lineas_planta_id_idx";

-- 6. Eliminar la columna 'planta_id' de 'lineas'
ALTER TABLE "lineas" DROP COLUMN "planta_id";

-- 7. Crear los nuevos índices y restricciones en 'lineas'
CREATE INDEX "lineas_ubicacion_tecnica_id_idx" ON "lineas"("ubicacion_tecnica_id");
CREATE UNIQUE INDEX "uq_linea_ubicacion" ON "lineas"("codigo", "ubicacion_tecnica_id");

-- 8. Crear la clave foránea desde 'lineas' hacia 'ubicaciones_tecnicas'
ALTER TABLE "lineas" ADD CONSTRAINT "lineas_ubicacion_tecnica_id_fkey"
FOREIGN KEY ("ubicacion_tecnica_id") REFERENCES "ubicaciones_tecnicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
