const Discord   = require('discord.js');
const methods   = require('./methods.js');
const { query } = require('../mysql.js');
const config    = require('../json/_config.json');
const sql       = require('sqlite');
sql.open('./score.sqlite');

const insertItemsSQL = `
INSERT IGNORE INTO items (
    userId,
    item_box,
    rpg,
    rocket, 
    ak47,
    rifle_bullet, 
    rock,
    arrow, 
    fork, 
    club, 
    sword, 
    bow,
    pistol_bullet, 
    glock,
    crossbow, 
    spear,
    thompson, 
    health_pot, 
    ammo_box, 
    javelin, 
    awp, 
    m4a1, 
    spas, 
    medkit, 
    revolver, 
    buckshot,
    blunderbuss, 
    grenade,
    pills, 
    bat,
    baseball, 
    peck_seed, 
    iron_shield, 
    gold_shield, 
    ultra_box, 
    rail_cannon, 
    plasma, 
    fish, 
    50_cal,
    token,
    candycane, 
    gingerbread,
    mittens, 
    stocking,
    snowball, 
    nutcracker,
    screw, 
    steel,
    adhesive,
    fiber_optics,
    module,
    ray_gun,
    golf_club, 
    ultra_ammo, 
    stick,
    xp_potion,
    reroll_scroll, 
    light_pack, 
    canvas_bag, 
    hikers_pack,
    golden_egg, 
    easter_egg, 
    bunny, 
    carrot,
    candy_egg, 
    tnt_egg,
    care_package,
    recruit,
    looter,
    killer,
    hitman,
    cyber_pack)
    VALUES (
        ?,
        ?,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    )
`

const insertScoreSQL = `
INSERT IGNORE INTO scores (
    userId,
    createdAt,
    money,
    level,
    health,
    maxHealth,
    scaledDamage,
    backpack,
    armor,
    inv_slots,
    points,
    kills,
    deaths,
    stats,
    luck,
    used_stats,
    status,
    banner,
    language)
    VALUES (
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        0, 0, 0, 0, 0, 0, 0, '', 'recruit', 'en-us'
    )
`

const insertCooldownSQL = `
INSERT IGNORE INTO cooldowns (
    userId,
    healTime,
    attackTime,
    hourlyTime,
    triviaTime,
    peckTime,
    voteTime,
    gambleTime,
    ironShieldTime,
    goldShieldTime,
    prizeTime,
    mittenShieldTime,
    scrambleTime,
    deactivateTime,
    activateTime,
    spamTime,
    xpTime,
    _15mCD,
    _30mCD,
    _45mCD,
    _60mCD,
    _80mCD,
    _100mCD,
    _120mCD,
    _10mHEALCD,
    _20mHEALCD,
    _40mHEALCD)
    VALUES (
        ?,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0
    )
`

exports.import_acc = async function(userId){
    const row = await query(`SELECT * FROM scores WHERE userId = ${userId}`);

    if(!row.length){
        try{
            const scoreRow = await query(insertScoreSQL, [userId, (new Date()).getTime(), 100, 1, 100, 100, 1.00, 'none', 'none']);
            const itemRow = await query(insertItemsSQL, [userId, 1]);
            const cdRow = await query(insertCooldownSQL, [userId]);
    
            const liteRow = await sql.get(`SELECT * FROM items
            JOIN scores
            ON items.userId = scores.userId
            WHERE items.userId = "${userId}"`);
    
            var items = Object.keys(liteRow);

            for(var i = 0; i < items.length; i++){
                var item = items[i];
                var amount = liteRow[item];
                if(amount == null){
                    amount = 0;
                }
                if(item !== 'userId' && item !== 'createdAt' && item !== 'testrow' && item !== 'jackpotMoney'){
                    if(item == 'bmg_50cal') item = '50_cal';
    
                    if(item == 'inv_slots'){
                        if(liteRow.backpack == 'none') amount = 0;
    
                        else if(liteRow.backpack == 'light_pack') amount = 5;
    
                        else if(liteRow.backpack == 'canvas_bag') amount = 15;
    
                        else if(liteRow.backpack == 'hikers_pack') amount = 25;
                    }
                    
                    //run this query every iteration to reset each column
                    query(`UPDATE scores
                    INNER JOIN items
                    ON scores.userId = items.userId
                    INNER JOIN cooldowns
                    ON scores.userId = cooldowns.userId
                    SET ${item} = '${amount}'
                    WHERE scores.userId = '${userId}'`);
                }
            }

            return true;
        }
        catch(err){
            console.log(err);
            return false;
        }
    }
}