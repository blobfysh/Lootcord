CREATE TABLE IF NOT EXISTS scores (
    userId BIGINT,
    createdAt BIGINT,
    level INT,
    health INT,
    maxHealth INT,
    scaledDamage DECIMAL(3,2),
    inv_slots INT,
    backpack VARCHAR(255),
    armor VARCHAR(255),
    ammo VARCHAR(255),
    badge VARCHAR(255),
    money BIGINT,
    scrap BIGINT,
    points BIGINT,
    kills INT,
    deaths INT,
    stats INT,
    luck INT,
    used_stats INT,
    status VARCHAR(255),
    banner VARCHAR(255),
    language VARCHAR(30),
    voteCounter INT,
    power INT,
    max_power INT,
    clanId BIGINT,
    clanRank TINYINT,
    lastActive DATETIME,
    notify1 BOOLEAN,
    notify2 BOOLEAN,
    notify3 BOOLEAN,
    prestige INT,
    discoinLimit INT,
    bmLimit INT,
    bleed INT,
    burn INT,
    PRIMARY KEY (userId)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_general_ci;


/* PLAYER BOUNTIES */
CREATE TABLE IF NOT EXISTS bounties (
	userId BIGINT,
	placedBy BIGINT,
    money BIGINT,
	PRIMARY KEY(userId, placedBy),
	FOREIGN KEY (userId) REFERENCES scores (userId),
	FOREIGN KEY (placedBy) REFERENCES scores (userId)
) ENGINE = InnoDB;


/* ENEMY SPAWN TABLES */
CREATE TABLE IF NOT EXISTS spawnchannels (
    channelId BIGINT,
    guildId BIGINT,
    userId BIGINT,
    PRIMARY KEY (channelId)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS spawns (
    channelId BIGINT,
    guildId BIGINT,
    start BIGINT,
    monster VARCHAR(255),
    health INT,
    money BIGINT,
    bleed INT,
    burn INT,
    PRIMARY KEY (channelId)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS spawnsdamage (
    channelId BIGINT,
    userId BIGINT,
    damage INT,
    PRIMARY KEY(channelId, userId),
	FOREIGN KEY (channelId) REFERENCES spawns (channelId),
	FOREIGN KEY (userId) REFERENCES scores (userId)
) ENGINE = InnoDB;


/* USER DATA TABLES */
CREATE TABLE IF NOT EXISTS badges (
    userId BIGINT,
    badge VARCHAR(255),
    earned BIGINT,
    UNIQUE user_badge(userId, badge)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS stats (
    userId BIGINT,
    stat VARCHAR(255),
    value INT,
    PRIMARY KEY(userId, stat)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS user_items (
    userId BIGINT,
	item VARCHAR(255),
	KEY (userId)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS cooldown (
    userId BIGINT,
    type VARCHAR(255),
    start BIGINT,
    length BIGINT,
    info VARCHAR(255)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS clans (
    clanId BIGINT AUTO_INCREMENT,
    name VARCHAR(20),
    ownerId BIGINT,
    money BIGINT,
    status VARCHAR(255),
    iconURL VARCHAR(255),
    clanCreated BIGINT,
    clanViews INT,
    reduction INT,
    PRIMARY KEY (clanId)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS blackmarket (
    listingId VARCHAR(20),
    sellerId BIGINT,
    itemName VARCHAR(255),
    price INT,
    quantity INT,
    pricePer INT,
    sellerName VARCHAR(255),
    listTime BIGINT,
    PRIMARY KEY (listingId)
) ENGINE = InnoDB;

/* PATRONS */
CREATE TABLE IF NOT EXISTS patrons (
    userId bigint,
    tier INT,
    started bigint
) ENGINE = InnoDB;


/* LOGS */
CREATE TABLE IF NOT EXISTS blackmarket_transactions (
    listingId VARCHAR(20),
    sellerId BIGINT,
    buyerId BIGINT,
    itemName VARCHAR(255),
    price INT,
    quantity INT,
    pricePer INT,
    soldDate DATETIME,
    PRIMARY KEY (listingId)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS transactions (
    userId BIGINT,
    date DATETIME,
    gained BIGINT,
    lost BIGINT
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS clan_logs (
    clanId BIGINT,
    details VARCHAR(255),
    logTime BIGINT,
    logDate DATETIME
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_general_ci;


/* MODERATION TABLES */
CREATE TABLE IF NOT EXISTS mods (userId bigint) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS banned (
	userId bigint,
	reason VARCHAR(2048),
	date bigint
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS bannedguilds (
	guildId bigint,
	reason VARCHAR(2048),
	date bigint
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS tradebanned (
	userId bigint,
	reason VARCHAR(2048),
	date bigint
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS warnings (
	userId bigint,
	modId bigint,
	reason VARCHAR(2048),
	date bigint
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS wiped_data (
    wipeId VARCHAR(255),
    userId BIGINT,
    item VARCHAR(255)
) ENGINE = InnoDB;


/* GUILD DATA TABLES */
CREATE TABLE IF NOT EXISTS guildinfo (
	guildId bigint,
	killChan bigint,
	levelChan bigint,
	dropChan bigint,
	dropItemChan bigint,
	dropItem VARCHAR(255),
	randomOnly BOOLEAN,
	serverOnly BOOLEAN
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS guildprefix (
	guildId bigint,
	prefix VARCHAR(5)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS userguilds (
	userId bigint,
	guildId bigint
) ENGINE = InnoDB;


/* GLOBAL SHOP SALES */
CREATE TABLE IF NOT EXISTS shopdata (
	itemName VARCHAR(255),
	itemAmount INT,
	itemPrice INT,
	itemCurrency VARCHAR(255),
	itemDisplay VARCHAR(255),
	item VARCHAR(255)
) ENGINE = InnoDB;


/* SERVER-SIDE ECONOMY TABLES */
CREATE TABLE IF NOT EXISTS server_scores (
    userId BIGINT,
	guildId BIGINT,
    createdAt BIGINT,
    level INT,
    health INT,
    maxHealth INT,
    scaledDamage DECIMAL(3,2),
    inv_slots INT,
    backpack VARCHAR(255),
    armor VARCHAR(255),
    ammo VARCHAR(255),
    badge VARCHAR(255),
    money BIGINT,
    scrap BIGINT,
    points BIGINT,
    kills INT,
    deaths INT,
    stats INT,
    luck INT,
    used_stats INT,
    status VARCHAR(255),
    banner VARCHAR(255),
    language VARCHAR(30),
    voteCounter INT,
    power INT,
    max_power INT,
    clanId BIGINT,
    clanRank TINYINT,
    lastActive DATETIME,
    notify1 BOOLEAN,
    notify2 BOOLEAN,
    notify3 BOOLEAN,
    prestige INT,
    discoinLimit INT,
    bmLimit INT,
    bleed INT,
    burn INT,
    PRIMARY KEY (userId, guildId)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS server_user_items (
    userId BIGINT,
	guildId BIGINT,
	item VARCHAR(255),
	KEY (userId, guildId)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS server_cooldown (
    userId BIGINT,
	guildId BIGINT,
    type VARCHAR(255),
    start BIGINT,
    length BIGINT,
    info VARCHAR(255)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS server_stats (
    userId BIGINT,
	guildId BIGINT,
    stat VARCHAR(255),
    value INT,
    PRIMARY KEY(userId, guildId, stat)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS server_badges (
    userId BIGINT,
	guildId BIGINT,
    badge VARCHAR(255),
    earned BIGINT,
    UNIQUE user_badge(userId, guildId, badge)
) ENGINE = InnoDB;
