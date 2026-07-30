/*
  Warnings:

  - You are about to drop the column `ubicacion_tecnica_id` on the `plantas` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nombre]` on the table `ubicaciones_tecnicas` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `planta_id` to the `ubicaciones_tecnicas` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "plantas" DROP CONSTRAINT "plantas_ubicacion_tecnica_id_fkey";

-- DropIndex
DROP INDEX "plantas_ubicacion_tecnica_id_idx";

-- AlterTable
ALTER TABLE "plantas" DROP COLUMN "ubicacion_tecnica_id";

-- AlterTable
ALTER TABLE "ubicaciones_tecnicas" ADD COLUMN     "planta_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ubicaciones_tecnicas_nombre_key" ON "ubicaciones_tecnicas"("nombre");

-- CreateIndex
CREATE INDEX "ubicaciones_tecnicas_planta_id_idx" ON "ubicaciones_tecnicas"("planta_id");

-- AddForeignKey
ALTER TABLE "ubicaciones_tecnicas" ADD CONSTRAINT "ubicaciones_tecnicas_planta_id_fkey" FOREIGN KEY ("planta_id") REFERENCES "plantas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
