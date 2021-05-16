ALTER TABLE clans ADD COLUMN health INT DEFAULT 50 AFTER reduction;
ALTER TABLE clans ADD COLUMN maxHealth INT DEFAULT 50 AFTER health;
ALTER TABLE clans ADD COLUMN level INT DEFAULT 1 AFTER maxHealth;

ALTER TABLE clans DROP COLUMN reduction;
ALTER TABLE scores DROP COLUMN power;
ALTER TABLE scores DROP COLUMN max_power;
ALTER TABLE server_scores DROP COLUMN power;
ALTER TABLE server_scores DROP COLUMN max_power;
