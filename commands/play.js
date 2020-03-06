const Discord   = require('discord.js');
const { query } = require('../mysql.js');
const config    = require('../json/_config.json');
const refresher = require('../methods/refresh_active_role.js');
const methods   = require('../methods/methods');

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
    ammo,
    inv_slots,
    points,
    kills,
    deaths,
    stats,
    luck,
    used_stats,
    status,
    banner,
    language,
    voteCounter,
    power,
    max_power,
    clanId,
    clanRank,
    lastActive,
    notify1,
    notify2,
    notify3)
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
        0, 0, 0, 0, 0, 0, 0, '', 'recruit', 'en-us', 
        0, 5, 5, 0, 0, NOW(), 0, 0, 0
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
    voteTimeLeft,
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
    jackpotTime,
    _15mCD,
    _30mCD,
    _45mCD,
    _60mCD,
    _80mCD,
    _100mCD,
    _120mCD,
    _10mHEALCD,
    _20mHEALCD,
    _40mHEALCD,
    airdropTime,
    slotsTime,
    rouletteTime,
    coinflipTime)
    VALUES (
        ?,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0
    )
`

module.exports = {
    name: 'play',
    aliases: ['create'],
    description: 'Create an account!',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang){
        const row = await query(`SELECT * FROM scores WHERE userId = ${message.author.id}`);

        if(!row.length){
            const scoreRow = await query(insertScoreSQL, [message.author.id, (new Date()).getTime(), 100, 1, 100, 100, 1.00, 'none', 'none', 'none']);
            methods.additem(message.author.id, 'item_box', 1);
            const userGuildsRow = await query(`INSERT INTO userGuilds (userId, guildId) VALUES (${message.author.id}, ${message.guild.id})`);

            const guildRow = await query(`SELECT * FROM guildInfo WHERE guildId = ${message.guild.id}`);
            if(!guildRow.length){
                query(`INSERT IGNORE INTO guildInfo (guildId, killChan, levelChan, dropChan, dropItemChan, dropItem, randomOnly) VALUES (${message.guild.id}, '', '', '', '', 0, 0)`);
            }

            //cooldowns row is never deleted, will keep cooldowns persistent even after account deletion
            const cooldownRow = await query(`SELECT * FROM cooldowns WHERE userId = ${message.author.id}`);
            if(!cooldownRow.length){
                query(insertCooldownSQL, [message.author.id]);
            }

            const embedInfo = new Discord.RichEmbed()
            .setTitle(`Thanks for joining LOOTCORD ${message.member.displayName}!`)
            .setColor(14202368)
            .addField("Items Received","```1x item_box```")
            .setFooter("Open it with t-use item_box")
            .setImage("https://cdn.discordapp.com/attachments/454163538886524928/525315435382571028/lc_welcome.png")

            message.channel.send(embedInfo);
        }

        //try to activate users account in guild
        else{
            const activeRow = await query(`SELECT * FROM userGuilds WHERE userId = ${message.author.id} AND guildId = ${message.guild.id}`);
            
            if(activeRow.length) return message.reply(lang.play[0]);

            const guildRow = await query(`SELECT * FROM guildInfo WHERE guildId = ${message.guild.id}`);
            if(!guildRow.length){
                query(`INSERT IGNORE INTO guildInfo (guildId, killChan, levelChan, dropChan, dropItemChan, dropItem, randomOnly) VALUES (${message.guild.id}, '', '', '', '', 0, 0)`);
            }

            const activate = await query(`INSERT INTO userGuilds (userId, guildId) VALUES (${message.author.id}, ${message.guild.id})`);
            
            message.reply(lang.play[1]);

            query(`UPDATE cooldowns SET activateTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
            message.client.shard.broadcastEval(`this.sets.activateCooldown.add('${message.author.id}')`);
            setTimeout(() => {
                message.client.shard.broadcastEval(`this.sets.activateCooldown.delete('${message.author.id}')`);
                query(`UPDATE cooldowns SET activateTime = ${0} WHERE userId = ${message.author.id}`);
            }, 3600 * 1000);
        }
        if(Object.keys(config.activeRoleGuilds).includes(message.guild.id)){
            refresher.refreshactives(message);
        }
    },
}