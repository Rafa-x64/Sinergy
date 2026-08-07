/*
  Warnings:

  - A unique constraint covering the columns `[nombreUsuario]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "nombreUsuario" VARCHAR(50) NOT NULL DEFAULT 'Rafa-x64';

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_nombreUsuario_key" ON "usuarios"("nombreUsuario");
