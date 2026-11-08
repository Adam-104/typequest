-- Indexes for the queries that run on every page view. No data changes.
-- MySQL already indexes game_results.user_id for its foreign key; the composite
-- index below starts with user_id, so it serves the same lookups and also the sort.

-- Leaderboard: WHERE leaderboard_banned = 0 ORDER BY total_xp DESC, id ASC LIMIT 100.
-- Without this MySQL reads and sorts every user for each request.
CREATE INDEX idx_users_leaderboard ON users (leaderboard_banned, total_xp DESC, id ASC);

-- History and chart: WHERE user_id = ? ORDER BY played_at DESC.
CREATE INDEX idx_game_results_user_played ON game_results (user_id, played_at DESC);

-- Admin games list: ORDER BY played_at DESC over all games.
CREATE INDEX idx_game_results_played ON game_results (played_at DESC);
