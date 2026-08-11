-- DropIndex
DROP INDEX "variables_tipo_evaluacion_idx";

-- AlterTable
ALTER TABLE "usuarios" ALTER COLUMN "nombreUsuario" DROP DEFAULT;

-- AlterTable
ALTER TABLE "variables" ADD COLUMN     "plantilla_id" INTEGER;

-- CreateTable
CREATE TABLE "plantilla_variables" (
    "id" SERIAL NOT NULL,
    "tipo_equipo_id" INTEGER NOT NULL,
    "tipo_inspeccion" "TipoInspeccion",
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
    "plantilla_id" INTEGER NOT NULL,
    "clave" VARCHAR(10) NOT NULL,
    "etiqueta" VARCHAR(100) NOT NULL,
    "orden_posicion" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "plantilla_opciones_seleccion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plantilla_variables_tipo_equipo_id_idx" ON "plantilla_variables"("tipo_equipo_id");

-- CreateIndex
CREATE INDEX "plantilla_variables_tipo_inspeccion_idx" ON "plantilla_variables"("tipo_inspeccion");

-- CreateIndex
CREATE INDEX "plantilla_opciones_seleccion_plantilla_id_idx" ON "plantilla_opciones_seleccion"("plantilla_id");

-- CreateIndex
CREATE UNIQUE INDEX "plantilla_opciones_seleccion_plantilla_id_clave_key" ON "plantilla_opciones_seleccion"("plantilla_id", "clave");

-- CreateIndex
CREATE INDEX "variables_plantilla_id_idx" ON "variables"("plantilla_id");

-- AddForeignKey
ALTER TABLE "variables" ADD CONSTRAINT "variables_plantilla_id_fkey" FOREIGN KEY ("plantilla_id") REFERENCES "plantilla_variables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantilla_variables" ADD CONSTRAINT "plantilla_variables_tipo_equipo_id_fkey" FOREIGN KEY ("tipo_equipo_id") REFERENCES "tipos_equipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantilla_opciones_seleccion" ADD CONSTRAINT "plantilla_opciones_seleccion_plantilla_id_fkey" FOREIGN KEY ("plantilla_id") REFERENCES "plantilla_variables"("id") ON DELETE CASCADE ON UPDATE CASCADE;
