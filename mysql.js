const mysql = require('mysql');
const config = require('./json/_config.json');

var db;

const createItemsSQL = `
CREATE TABLE IF NOT EXISTS items (
    userId BIGINT,
    item_box INT,
    rpg INT, 
    rocket INT, 
    ak47 INT,
    rifle_bullet INT, 
    rock INT, 
    arrow INT, 
    fork INT, 
    club INT, 
    sword INT, 
    bow INT, 
    pistol_bullet INT, 
    glock INT, 
    crossbow INT, 
    spear INT,
    thompson INT, 
    health_pot INT, 
    ammo_box INT, 
    javelin INT, 
    awp INT, 
    m4a1 INT, 
    spas INT, 
    medkit INT, 
    revolver INT, 
    buckshot INT, 
    blunderbuss INT, 
    grenade INT,
    pills INT, 
    bat INT, 
    baseball INT, 
    peck_seed INT, 
    iron_shield INT, 
    gold_shield INT, 
    ultra_box INT, 
    rail_cannon INT, 
    plasma INT, 
    fish INT, 
    50_cal INT,
    token INT, 
    candycane INT, 
    gingerbread INT,
    mittens INT, 
    stocking INT,
    snowball INT, 
    nutcracker INT,
    screw INT, 
    steel INT,
    adhesive INT,
    fiber_optics INT,
    module INT,
    ray_gun INT,
    golf_club INT, 
    ultra_ammo INT, 
    stick INT, 
    xp_potion INT, 
    reroll_scroll INT, 
    light_pack INT, 
    canvas_bag INT, 
    hikers_pack INT,
    golden_egg INT, 
    easter_egg INT, 
    bunny INT, 
    carrot INT, 
    candy_egg INT, 
    tnt_egg INT,
    care_package INT,
    recruit INT,
    looter INT,
    killer INT,
    hitman INT)
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
    money BIGINT, 
    points BIGINT,
    kills INT,
    deaths INT,
    stats INT,
    luck INT,
    used_stats INT,
    status VARCHAR(255),
    banner VARCHAR(255))
    ENGINE = InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_general_ci
`

const createCooldownsSQL = `CREATE TABLE IF NOT EXISTS cooldowns (
    userId BIGINT,
    healTime BIGINT,
    attackTime BIGINT,
    hourlyTime BIGINT,
    triviaTime BIGINT,
    peckTime BIGINT,
    voteTime BIGINT,
    gambleTime BIGINT,
    ironShieldTime BIGINT,
    goldShieldTime BIGINT,
    prizeTime BIGINT,
    mittenShieldTime BIGINT,
    scrambleTime BIGINT,
    deactivateTime BIGINT,
    activateTime BIGINT,
    spamTime BIGINT,
    xpTime BIGINT,
    _15mCD BIGINT,
    _30mCD BIGINT,
    _45mCD BIGINT,
    _60mCD BIGINT,
    _80mCD BIGINT,
    _100mCD BIGINT,
    _120mCD BIGINT,
    _10mHEALCD BIGINT,
    _20mHEALCD BIGINT,
    _40mHEALCD BIGINT)
    ENGINE = InnoDB`

function connectSQL(){
    db = mysql.createConnection({
        host     : config.sqlhostname,
        user     : config.sqluser,
        password : config.sqlpass,
        database : config.sqldatabase,
        /*
        host     : 'localhost',
        user     : 'root',
        password : 'password',
        database : 'lootcord',
        */
        supportBigNumbers: true,
        bigNumberStrings: false,
        charset: "utf8mb4",
    });

    db.connect((err) => {
        if(err) return console.log('Could not connect to SQL database.');
        
        console.log('MySQL Connected.');

        /* remove drop statements before production
        db.query(`DROP TABLE scores`);
        db.query(`DROP TABLE items`);
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

        // cooldowns table
        db.query(createCooldownsSQL, (err, result) => {
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
        db.query('CREATE TABLE IF NOT EXISTS guildInfo (guildId bigint, killChan bigint, levelChan bigint, dropChan bigint, dropItem VARCHAR(255)) ENGINE = InnoDB', (err, result) => {
            if(err) return console.log(err);
        });

        db.query('CREATE TABLE IF NOT EXISTS mods (userId bigint) ENGINE = InnoDB', (err, result) => {
            if(err) return console.log(err);
        });

        db.query('CREATE TABLE IF NOT EXISTS banned (userId bigint, reason VARCHAR(2048), date bigint) ENGINE = InnoDB', (err, result) => {
            if(err) return console.log(err);
        });

        db.query('CREATE TABLE IF NOT EXISTS gamesData (gameName VARCHAR(255), gameAmount INT, gamePrice INT, gameCurrency VARCHAR(255), gameDisplay VARCHAR(255)) ENGINE = InnoDB', (err, result) => {
            if(err) return console.log(err);
        });
    });

    db.on('error', (err) => {
        if(err.fatal){
            console.log('Fatal SQL error, attempting to reconnect.');
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