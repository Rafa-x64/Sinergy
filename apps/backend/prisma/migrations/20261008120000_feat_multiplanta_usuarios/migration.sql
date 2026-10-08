-- CreateTable
CREATE TABLE IF NOT EXISTS "usuarios_plantas" (
    "id" SERIAL NOT NULL,
    "planta_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,

    CONSTRAINT "usuarios_plantas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "uq_usuario_planta" ON "usuarios_plantas"("planta_id", "usuario_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "usuarios_plantas_usuario_id_idx" ON "usuarios_plantas"("usuario_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "usuarios_plantas_planta_id_idx" ON "usuarios_plantas"("planta_id");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_plantas_planta_id_fkey'
    ) THEN
        ALTER TABLE "usuarios_plantas" ADD CONSTRAINT "usuarios_plantas_planta_id_fkey" FOREIGN KEY ("planta_id") REFERENCES "plantas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_plantas_usuario_id_fkey'
    ) THEN
        ALTER TABLE "usuarios_plantas" ADD CONSTRAINT "usuarios_plantas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Poblar usuarios_plantas con los datos actuales de usuarios que tengan planta_id
INSERT INTO "usuarios_plantas" ("planta_id", "usuario_id")
SELECT "planta_id", "id" FROM "usuarios" WHERE "planta_id" IS NOT NULL
ON CONFLICT ("planta_id", "usuario_id") DO NOTHING;
