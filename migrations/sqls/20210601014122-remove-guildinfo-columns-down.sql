ALTER TABLE guildinfo ADD COLUMN dropChan BIGINT AFTER levelChan;
ALTER TABLE guildinfo ADD COLUMN dropItemChan BIGINT AFTER dropChan;
ALTER TABLE guildinfo ADD COLUMN dropItem VARCHAR(255) AFTER dropItemChan;

ALTER TABLE guildinfo DROP PRIMARY KEY;
