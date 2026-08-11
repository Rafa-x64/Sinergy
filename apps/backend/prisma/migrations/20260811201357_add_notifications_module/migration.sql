-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ERROR', 'WARNING', 'ALERT', 'SUCCESS');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "tipo" "NotificationType" NOT NULL,
    "mensaje" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_usuarioId_is_read_idx" ON "notifications"("usuarioId", "is_read");
