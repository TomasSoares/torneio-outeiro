#!/bin/bash
# setup-db.sh — Torneio Outeiro · PostgreSQL setup
# Run on your VPS as root: bash setup-db.sh

set -e

DB_NAME="torneio_outeiro"
DB_USER="torneio_app"

echo ""
echo "========================================="
echo "  Torneio Outeiro — Database Setup"
echo "========================================="
echo ""

# ── 1. Install PostgreSQL ──────────────────────────────────
echo "[1/4] Installing PostgreSQL..."
apt-get update -qq
apt-get install -y postgresql postgresql-contrib

systemctl enable postgresql
systemctl start postgresql

echo "      PostgreSQL installed and running."

# ── 2. Create DB user + database ──────────────────────────
echo ""
echo "[2/4] Creating database user and database..."
echo ""
echo "      Choose a strong password for the '$DB_USER' database user."
echo "      (This is NOT your system password — it's only for the app)"
echo ""
read -s -p "      Password: " DB_PASS
echo ""
read -s -p "      Confirm:  " DB_PASS_CONFIRM
echo ""

if [ "$DB_PASS" != "$DB_PASS_CONFIRM" ]; then
  echo "ERROR: Passwords do not match. Aborting."
  exit 1
fi

if [ -z "$DB_PASS" ]; then
  echo "ERROR: Password cannot be empty. Aborting."
  exit 1
fi

sudo -u postgres psql <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
  ELSE
    ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';
  END IF;
END
\$\$;

SELECT 'User ready.' AS status;
SQL

sudo -u postgres psql <<SQL
SELECT pg_terminate_backend(pid) FROM pg_stat_activity
  WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

SELECT 'Database ready.' AS status;
SQL

echo "      User '$DB_USER' and database '$DB_NAME' created."

# ── 3. Create schema ───────────────────────────────────────
echo ""
echo "[3/4] Creating tables..."

sudo -u postgres psql -d "$DB_NAME" <<SQL

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  code        VARCHAR(4)   PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  short       VARCHAR(50)  NOT NULL,
  "group"     CHAR(1)      NOT NULL CHECK ("group" IN ('A','B')),
  color       VARCHAR(10)  NOT NULL
);

-- Players
CREATE TABLE IF NOT EXISTS players (
  id          VARCHAR(10)  PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  team_code   VARCHAR(4)   NOT NULL REFERENCES teams(code) ON DELETE CASCADE,
  jersey_num  SMALLINT     NOT NULL
);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
  id          VARCHAR(20)  PRIMARY KEY,
  jornada     SMALLINT     NOT NULL,
  "group"     CHAR(1)      NOT NULL CHECK ("group" IN ('A','B')),
  match_date  DATE         NOT NULL,
  match_time  VARCHAR(5)   NOT NULL,
  home_code   VARCHAR(4)   NOT NULL REFERENCES teams(code),
  away_code   VARCHAR(4)   NOT NULL REFERENCES teams(code),
  played      BOOLEAN      NOT NULL DEFAULT FALSE,
  home_score  SMALLINT,
  away_score  SMALLINT,
  venue       VARCHAR(100) NOT NULL
);

-- Match scorers
CREATE TABLE IF NOT EXISTS match_scorers (
  id          SERIAL       PRIMARY KEY,
  match_id    VARCHAR(20)  NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id   VARCHAR(10)  NOT NULL REFERENCES players(id),
  team_code   VARCHAR(4)   NOT NULL REFERENCES teams(code),
  goal_count  SMALLINT     NOT NULL DEFAULT 1,
  minute      SMALLINT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_matches_jornada  ON matches(jornada);
CREATE INDEX IF NOT EXISTS idx_matches_group    ON matches("group");
CREATE INDEX IF NOT EXISTS idx_scorers_match    ON match_scorers(match_id);
CREATE INDEX IF NOT EXISTS idx_scorers_player   ON match_scorers(player_id);
CREATE INDEX IF NOT EXISTS idx_players_team     ON players(team_code);

-- Grant all to app user
GRANT ALL ON ALL TABLES    IN SCHEMA public TO $DB_USER;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;

SELECT 'Schema ready.' AS status;
SQL

# ── 4. Seed initial data ───────────────────────────────────
echo ""
echo "[4/4] Seeding teams and players..."

sudo -u postgres psql -d "$DB_NAME" <<SQL

-- Teams
INSERT INTO teams (code, name, short, "group", color) VALUES
  ('CRV', 'Os Carvalhos',    'Carvalhos',  'A', '#0c5036'),
  ('LAM', 'União Lameira',   'Lameira',    'A', '#7a3b1d'),
  ('ACP', 'Académico Pinhal','Académico',  'A', '#1f3a6b'),
  ('ERI', 'Estrela do Rio',  'Estrela',    'A', '#a31b2a'),
  ('AOT', 'Atlético Outeiro','Outeiro',    'B', '#0a4a86'),
  ('SVL', 'Sporting Vilar',  'Vilar',      'B', '#1a6b3a'),
  ('CDP', 'Casa do Povo',    'Casa Povo',  'B', '#5a2569'),
  ('RFC', 'Ribeira F.C.',    'Ribeira',    'B', '#c6791a')
ON CONFLICT (code) DO NOTHING;

-- Players
INSERT INTO players (id, name, team_code, jersey_num) VALUES
  ('p1',  'Tiago Mendes',    'CRV', 9),
  ('p2',  'Vasco Pinto',     'CRV', 11),
  ('p10', 'André Gonçalves', 'CRV', 7),
  ('p7',  'Miguel Tavares',  'LAM', 10),
  ('p11', 'Rafael Gomes',    'LAM', 9),
  ('p15', 'Pedro Faria',     'ACP', 8),
  ('p8',  'Diogo Almeida',   'ERI', 9),
  ('p3',  'João Pereira',    'AOT', 10),
  ('p9',  'Francisco Neves', 'AOT', 7),
  ('p12', 'Hugo Sampaio',    'AOT', 14),
  ('p4',  'Rui Santos',      'SVL', 10),
  ('p13', 'Filipe Cunha',    'SVL', 7),
  ('p14', 'Nuno Carmo',      'SVL', 9),
  ('p5',  'Bruno Costa',     'CDP', 9),
  ('p16', 'Sérgio Pacheco',  'CDP', 11),
  ('p6',  'Henrique Lopes',  'RFC', 9),
  ('p17', 'Daniel Ferraz',   'RFC', 8)
ON CONFLICT (id) DO NOTHING;

SELECT 'Seed complete.' AS status;
SQL

# ── Done ───────────────────────────────────────────────────
echo ""
echo "========================================="
echo "  Setup complete!"
echo "========================================="
echo ""
echo "  Add this to your Next.js .env.local:"
echo ""
echo "  DATABASE_URL=postgresql://$DB_USER:YOUR_PASSWORD@localhost:5432/$DB_NAME"
echo ""
echo "  (replace YOUR_PASSWORD with the password you chose above)"
echo ""
