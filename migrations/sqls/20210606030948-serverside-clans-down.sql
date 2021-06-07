ALTER TABLE guildinfo DROP COLUMN clansDisabled;

DROP TABLE IF EXISTS server_clans;

INSERT INTO user_items (userId, item) SELECT id, item FROM clan_items;
DROP TABLE IF EXISTS clan_items;
DROP TABLE IF EXISTS server_clan_items;
DROP TABLE IF EXISTS server_clan_logs;

UPDATE server_scores SET clanId = 0, clanRank = 0;
