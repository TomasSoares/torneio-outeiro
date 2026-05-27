-- Migração: suporte à fase final (meias-finais, final, 3º/4º lugar)
-- Correr no VPS: psql -d torneio_outeiro -f scripts/migrate-knockout.sql

-- Tornar 'group' opcional (null nos jogos KO)
ALTER TABLE matches ALTER COLUMN "group" DROP NOT NULL;

-- Substituir check constraint para permitir NULL
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_group_check;
ALTER TABLE matches ADD CONSTRAINT matches_group_check
  CHECK ("group" IS NULL OR "group" IN ('A', 'B'));

-- Adicionar coluna 'round' para identificar ronda eliminatória
ALTER TABLE matches ADD COLUMN IF NOT EXISTS round VARCHAR(3)
  CHECK (round IS NULL OR round IN ('SF1', 'SF2', 'F', '3P'));

-- Exatamente um de (group, round) deve ser não-null
ALTER TABLE matches ADD CONSTRAINT matches_group_or_round
  CHECK (
    ("group" IS NOT NULL AND round IS NULL) OR
    ("group" IS NULL   AND round IS NOT NULL)
  );

-- Índice para lookup rápido de jogos KO
CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(round);
