const mysql  = require('mysql');
const config = require('./json/_config.json');

var db;

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

function connectSQL(){
    db = mysql.createConnection({
        host     : config.sqlhostname,
        user     : config.sqluser,
        password : config.sqlpass,
        database : config.sqldatabase,
        supportBigNumbers: true,
        bigNumberStrings: false,
        charset: "utf8mb4",
    });

    db.connect((err) => {
        if(err) return console.log('[MYSQL] Could not connect to SQL database.');
        
        console.log('[MYSQL] MySQL Connected.');

        /* remove drop statements before production
        db.query(`DROP TABLE scores`);
        db.query(`DROP TABLE items`);
        db.query(`DROP TABLE cooldowns`);
        db.query(`DROP TABLE userGuilds`);
        db.query(`DROP TABLE guildPrefix`);
        db.query(`DROP TABLE guildInfo`);
        db.query(`DROP TABLE banned`);
        db.query(`DROP TABLE gamesData`);
        */
        
        
        // create scores table (main table)
        db.query(createScoreSQL, (err, result) => {
            if(err) return console.log(err);
        });

        // items table
        db.query(createItemsSQL, (err, result) => {
            if(err) return console.log(err);
        });
        //player badges table
        db.query(createBadgesSQL, (err, result) => {
            if(err) return console.log(err);
        });

        // cooldowns table
        db.query(createCooldownsSQL, (err, result) => {
            if(err) return console.log(err);
        });

        // clans table
        db.query(createClansSQL, (err, result) => {
            if(err) return console.log(err);
        });
        // clans logs table
        db.query(createClansLogs, (err, result) => {
            if(err) return console.log(err);
        });

        // blackmarket listings table
        db.query(createBlackMarket, (err, result) => {
            if(err) return console.log(err);
        });

        // userGuilds table for keeping track of which servers users are activated in
        db.query('CREATE TABLE IF NOT EXISTS userGuilds (userId bigint, guildId bigint) ENGINE = InnoDB', (err, result) => {
            if(err) return console.log(err);
        });

        db.query('CREATE TABLE IF NOT EXISTS guildPrefix (guildId bigint, prefix VARCHAR(5)) ENGINE = InnoDB', (err, result) => {
            if(err) return console.log(err);
        });

        //guildInfo table for keeping information about specific guild
        db.query('CREATE TABLE IF NOT EXISTS guildInfo (guildId bigint, killChan bigint, levelChan bigint, dropChan bigint, dropItemChan bigint, dropItem VARCHAR(255), randomOnly BOOLEAN) ENGINE = InnoDB', (err, result) => {
            if(err) return console.log(err);
        });

        db.query('CREATE TABLE IF NOT EXISTS mods (userId bigint) ENGINE = InnoDB', (err, result) => {
            if(err) return console.log(err);
        });

        db.query('CREATE TABLE IF NOT EXISTS banned (userId bigint, reason VARCHAR(2048), date bigint) ENGINE = InnoDB', (err, result) => {
            if(err) return console.log(err);
        });

        db.query('CREATE TABLE IF NOT EXISTS tradebanned (userId bigint, reason VARCHAR(2048), date bigint) ENGINE = InnoDB', (err, result) => {
            if(err) return console.log(err);
        });

        db.query('CREATE TABLE IF NOT EXISTS warnings (userId bigint, modId bigint, reason VARCHAR(2048), date bigint) ENGINE = InnoDB', (err, result) => {
            if(err) return console.log(err);
        });

        db.query('CREATE TABLE IF NOT EXISTS gamesData (gameName VARCHAR(255), gameAmount INT, gamePrice INT, gameCurrency VARCHAR(255), gameDisplay VARCHAR(255)) ENGINE = InnoDB', (err, result) => {
            if(err) return console.log(err);
        });

        db.query('CREATE TABLE IF NOT EXISTS patrons (userId bigint, tier INT) ENGINE = InnoDB', (err, result) => {
            if(err) return console.log(err);
        });
    });

    db.on('error', (err) => {
        if(err.fatal){
            console.log('[MYSQL] Fatal SQL error, attempting to reconnect.');
            db.end();
            connectSQL();
            return;
        }
    });
}

connectSQL();

function query(sql, args){
    return new Promise((resolve, reject) => {
        db.query(sql, args, (err, rows) => {
            if(err) return reject(err);
            
            resolve(rows);
        });
    });
}

exports.db = db;

exports.query = query;

exports.connectSQL = connectSQL;