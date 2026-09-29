-- AlterEnum: Agrega el valor LUBRICACION al enum TipoInspeccion
-- para distinguir las rutinas de lubricación de las inspecciones de variables críticas.
ALTER TYPE "TipoInspeccion" ADD VALUE 'LUBRICACION';
