-- Histon Hornets Blue - Database Schema
-- Run this in your Supabase SQL Editor to create all tables

-- ─── Seasons ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS seasons (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- ─── Players ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS players (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- ─── Matches ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS matches (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  season_id BIGINT REFERENCES seasons(id),
  match_date DATE NOT NULL,
  match_type TEXT NOT NULL, -- 'League', 'Cup', 'Friendly'
  opposition TEXT NOT NULL,
  location TEXT, -- 'H' (home), 'A' (away)
  histon_score INT,
  opposition_score INT,
  match_length_mins INT DEFAULT 60,
  created_at TIMESTAMP DEFAULT now()
);

-- ─── Player Appearances ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS player_appearances (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  match_id BIGINT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id BIGINT NOT NULL REFERENCES players(id),
  position TEXT, -- 'GK', 'CB', 'LB', 'RB', 'CM', 'CDM', 'CAM', 'LM', 'RM', 'CF', 'LF', 'RF', 'ST'
  time_start FLOAT NOT NULL,
  time_end FLOAT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- ─── Goals ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS goals (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  match_id BIGINT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  scorer_player_id BIGINT NOT NULL REFERENCES players(id),
  assist_player_id BIGINT REFERENCES players(id),
  for_histon BOOLEAN NOT NULL DEFAULT true, -- true = our goal, false = opposition goal
  goal_half TEXT, -- 'H1' or 'H2'
  goal_quarter INT, -- 1, 2, 3, or 4
  created_at TIMESTAMP DEFAULT now()
);

-- ─── Star Player Awards ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS star_player_awards (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  match_id BIGINT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id BIGINT NOT NULL REFERENCES players(id),
  created_at TIMESTAMP DEFAULT now()
);

-- ─── Indexes (for better query performance) ────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_matches_season_id ON matches(season_id);
CREATE INDEX IF NOT EXISTS idx_matches_match_date ON matches(match_date DESC);
CREATE INDEX IF NOT EXISTS idx_player_appearances_match_id ON player_appearances(match_id);
CREATE INDEX IF NOT EXISTS idx_player_appearances_player_id ON player_appearances(player_id);
CREATE INDEX IF NOT EXISTS idx_goals_match_id ON goals(match_id);
CREATE INDEX IF NOT EXISTS idx_goals_scorer_player_id ON goals(scorer_player_id);
CREATE INDEX IF NOT EXISTS idx_star_player_awards_match_id ON star_player_awards(match_id);
CREATE INDEX IF NOT EXISTS idx_star_player_awards_player_id ON star_player_awards(player_id);

-- ─── Sample Data (Optional - insert your team info) ──────────────────────

INSERT INTO seasons (name) VALUES ('2024-2025') ON CONFLICT DO NOTHING;

INSERT INTO players (name) VALUES
  ('Player 1'),
  ('Player 2'),
  ('Player 3'),
  ('Player 4'),
  ('Player 5'),
  ('Player 6'),
  ('Player 7'),
  ('Player 8'),
  ('Player 9'),
  ('Player 10'),
  ('Player 11'),
  ('Player 12')
ON CONFLICT DO NOTHING;
