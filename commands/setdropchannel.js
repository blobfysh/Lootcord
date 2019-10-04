const { query } = require('../mysql.js');
const airdrop = require('../utils/airdrop.js');

module.exports = {
    name: 'setdropchannel',
    aliases: ['setdropchan'],
    description: 'Will send care_package drops to the channel it was used in.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    guildModsOnly: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const guildRow  = await query(`SELECT * FROM guildInfo WHERE guildId ="${message.guild.id}"`)
        const activeRow = await query(`SELECT * FROM userGuilds WHERE guildId = ${message.guild.id}`);
        
        if(!guildRow.length) query("INSERT INTO guildInfo (guildId, killChan, levelChan, dropChan, dropItem, randomOnly) VALUES (?, ?, ?, ?, ?, ?)", [message.guild.id, "", "", "", "", 0]);

        if(Object.keys(activeRow).length < 5){
            return message.reply(lang.setdropchannel[1]);
        }


        query(`UPDATE guildInfo SET dropChan = ${message.channel.id} WHERE guildId = ${message.guild.id}`);
        message.reply(lang.setdropchannel[0]);

        if(guildRow[0].dropChan == 0){
            airdrop.initAirdrop(message.client, message.guild.id);
        }
    },
}