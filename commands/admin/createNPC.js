const Discord = require('discord.js');
const { query } = require('../../mysql.js');

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
    tnt_egg)
    VALUES (
        ?,
        ?,
        0, 0, 40, 80, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0
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
    inv_slots,
    backpack,
    armor, 
    points,
    kills,
    deaths,
    stats,
    luck,
    used_stats,
    status,
    banner)
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
        ?,
        0, 0, 0, 0, 0, 0, '', ''
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

module.exports = {
    name: 'createnpc',
    aliases: [''],
    description: 'Create an NPC account with the clients ID.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    modOnly: false,
    adminOnly: true,
    
    async execute(message, args, lang){
        const row = await query(`SELECT * FROM scores WHERE userId = ${message.client.user.id}`);

        if(!row.length){
            const scoreRow = await query(insertScoreSQL, [message.client.user.id, (new Date()).getTime(), 100, 1, 100, 100, 1.00, 10, 'none', 'none']);
            const itemRow = await query(insertItemsSQL, [message.client.user.id, 1]);
            //const userGuildsRow = await query(`INSERT INTO userGuilds (userId, guildId) VALUES (${message.client.user.id}, ${message.guild.id})`);

            const guildRow = await query(`SELECT * FROM guildInfo WHERE guildId = ${message.client.user.id}`);
            if(!guildRow.length){
                query(`INSERT IGNORE INTO guildInfo (guildId, killChan, levelChan, dropChan, dropItem) VALUES (${message.client.user.id}, '', '', '', '')`);
            }

            //cooldowns row is never deleted, will keep cooldowns persistent even after account deletion
            const cooldownRow = await query(`SELECT * FROM cooldowns WHERE userId = ${message.client.user.id}`);
            if(!cooldownRow.length){
                query(insertCooldownSQL, [message.client.user.id]);
            }

            const embedInfo = new Discord.RichEmbed()
            .setTitle(`Thanks for joining LOOTCORD ${message.client.user.username}!`)
            .setColor(14202368)
            .addField("Items Received","```1x item_box```")
            .setFooter("Open it with t-use item_box")
            .setImage("https://cdn.discordapp.com/attachments/454163538886524928/525315435382571028/lc_welcome.png")

            message.channel.send(embedInfo);
        }
        else{
            message.reply('NPC already created!');
        }
    },
}