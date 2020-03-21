const mysql  = require('mysql');

const createItemsSQL = `
CREATE TABLE IF NOT EXISTS user_items (
    userId BIGINT,
    item VARCHAR(255))
    ENGINE = InnoDB
`

const createBadgesSQL = `
CREATE TABLE IF NOT EXISTS badges (
    userId BIGINT,
    badge VARCHAR(255),
    earned BIGINT,
    UNIQUE user_badge(userId, badge))
    ENGINE = InnoDB
`

const createScoreSQL = `
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
    prestige INT)
    ENGINE = InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_general_ci
`

const createCooldownsSQL = `
CREATE TABLE IF NOT EXISTS cooldown (
    userId BIGINT,
    type VARCHAR(255),
    start BIGINT,
    length BIGINT)
    ENGINE = InnoDB
`

const createClansSQL = `
CREATE TABLE IF NOT EXISTS clans (
    clanId BIGINT AUTO_INCREMENT,
    name VARCHAR(20),
    ownerId BIGINT,
    money BIGINT,
    status VARCHAR(255),
    iconURL VARCHAR(255),
    clanCreated BIGINT,
    clanViews INT,
    raidTime BIGINT,
    PRIMARY KEY (clanId))
    ENGINE = InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_general_ci
`

const createClansLogs = `
CREATE TABLE IF NOT EXISTS clan_logs (
    clanId BIGINT,
    details VARCHAR(255),
    logTime BIGINT,
    logDate DATETIME)
    ENGINE = InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_general_ci
`

const createBlackMarket = `
CREATE TABLE IF NOT EXISTS blackmarket (
    listingId VARCHAR(20),
    sellerId BIGINT,
    itemName VARCHAR(255),
    price INT,
    quantity INT,
    pricePer INT,
    sellerName VARCHAR(255),
    listTime BIGINT)
    ENGINE = InnoDB
`

class MySQL {
    constructor(config){
        this.db = mysql.createConnection({
            host     : config.sqlhostname,
            user     : config.sqluser,
            password : config.sqlpass,
            database : config.sqldatabase,
            supportBigNumbers: true,
            bigNumberStrings: false,
            charset: "utf8mb4",
        });
    }

    connect(){
        return new Promise((resolve, reject) => {
            this.db.connect(err => {
                if(err) {
                    console.error('[MYSQL] Could not connect to SQL database. Did you create the database?');
                    return reject(err);
                }
                console.log('[MYSQL] MySQL connected!');
                resolve('[MYSQL] MySQL connected!');
            });
        });
    }

    async createDB(){
        try{
            /* remove drop statements before production
                    
            await this.query(`DROP TABLE scores`);
            await this.query(`DROP TABLE items`);
            await this.query(`DROP TABLE cooldowns`);
            await this.query(`DROP TABLE userGuilds`);
            await this.query(`DROP TABLE guildPrefix`);
            await this.query(`DROP TABLE guildInfo`);
            await this.query(`DROP TABLE banned`);
            await this.query(`DROP TABLE gamesData`);
            */
            
            // create scores table (main table)
            await this.query(createScoreSQL);

            // items table
            await this.query(createItemsSQL);

            // player badges table
            await this.query(createBadgesSQL);

            // cooldowns table
            await this.query(createCooldownsSQL);

            // clans table
            await this.query(createClansSQL);

            // clans logs table
            await this.query(createClansLogs);

            // blackmarket listings table
            await this.query(createBlackMarket);

            // userGuilds table for keeping track of which servers users are activated in
            await this.query('CREATE TABLE IF NOT EXISTS userGuilds (userId bigint, guildId bigint) ENGINE = InnoDB');

            await this.query('CREATE TABLE IF NOT EXISTS guildPrefix (guildId bigint, prefix VARCHAR(5)) ENGINE = InnoDB');

            // guildInfo table for keeping information about specific guild
            await this.query('CREATE TABLE IF NOT EXISTS guildInfo (guildId bigint, killChan bigint, levelChan bigint, dropChan bigint, dropItemChan bigint, dropItem VARCHAR(255), randomOnly BOOLEAN) ENGINE = InnoDB');
        
            // mods table
            await this.query('CREATE TABLE IF NOT EXISTS mods (userId bigint) ENGINE = InnoDB');

            await this.query('CREATE TABLE IF NOT EXISTS banned (userId bigint, reason VARCHAR(2048), date bigint) ENGINE = InnoDB');

            await this.query('CREATE TABLE IF NOT EXISTS tradebanned (userId bigint, reason VARCHAR(2048), date bigint) ENGINE = InnoDB');

            await this.query('CREATE TABLE IF NOT EXISTS warnings (userId bigint, modId bigint, reason VARCHAR(2048), date bigint) ENGINE = InnoDB');

            await this.query('CREATE TABLE IF NOT EXISTS gamesData (gameName VARCHAR(255), gameAmount INT, gamePrice INT, gameCurrency VARCHAR(255), gameDisplay VARCHAR(255)) ENGINE = InnoDB');

            return 'Success';
        }
        catch(err){
            console.error('[MYSQL] Error creating tables:');
            return err;
        }
    }

    query(sql, args){
        return new Promise((resolve, reject) => {
            this.db.query(sql, args, (err, rows) => {
                if(err) return reject(err);
                
                resolve(rows);
            });
        });
    }
}

module.exports = MySQL;