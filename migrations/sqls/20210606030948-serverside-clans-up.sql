ALTER TABLE guildinfo ADD COLUMN clansDisabled BOOLEAN DEFAULT 0 AFTER serverOnly;

CREATE TABLE IF NOT EXISTS server_clans (
    clanId BIGINT AUTO_INCREMENT,
	guildId BIGINT,
    name VARCHAR(20),
    ownerId BIGINT,
    money BIGINT,
    status VARCHAR(255),
    iconURL VARCHAR(255),
    clanCreated BIGINT,
    clanViews INT,
	health INT DEFAULT 50,
	maxHealth INT DEFAULT 50,
	level INT DEFAULT 1,
    PRIMARY KEY (clanId)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS clan_items (
    id BIGINT,
	item VARCHAR(255),
	KEY (id)
) ENGINE = InnoDB;

INSERT INTO clan_items (id, item) SELECT userId, item FROM user_items WHERE userId < 1000000;
DELETE FROM user_items WHERE userId < 1000000;

CREATE TABLE IF NOT EXISTS server_clan_items (
    id BIGINT,
	item VARCHAR(255),
	KEY (id)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS server_clan_logs (
    clanId BIGINT,
    details VARCHAR(255),
    logTime BIGINT,
    logDate DATETIME
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_general_ci;
