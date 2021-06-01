ALTER TABLE guildinfo ADD PRIMARY KEY (guildId);

ALTER TABLE guildinfo DROP COLUMN dropChan;
ALTER TABLE guildinfo DROP COLUMN dropItem;
ALTER TABLE guildinfo DROP COLUMN dropItemChan;
