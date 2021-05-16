ALTER TABLE clans DROP COLUMN health;
ALTER TABLE clans DROP COLUMN level;
ALTER TABLE clans DROP COLUMN maxHealth;

ALTER TABLE clans ADD COLUMN reduction INT AFTER clanViews;
UPDATE clans SET reduction = 0;

ALTER TABLE scores ADD COLUMN power INT AFTER voteCounter;
UPDATE scores SET power = 5;

ALTER TABLE scores ADD COLUMN max_power INT AFTER power;
UPDATE scores SET max_power = 5;

ALTER TABLE server_scores ADD COLUMN power INT AFTER voteCounter;
UPDATE server_scores SET power = 5;

ALTER TABLE server_scores ADD COLUMN max_power INT AFTER power;
UPDATE server_scores SET max_power = 5;
