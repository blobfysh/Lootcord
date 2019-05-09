const { query } = require('../mysql.js');

module.exports = {
    name: 'setlevelchannel',
    aliases: ['setlevelchan'],
    description: 'Sends all level up messages for the server to the channel this command is used in.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    guildModsOnly: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        query(`SELECT * FROM guildInfo WHERE guildId ="${message.guild.id}"`).then(guildRow => {
            if(!guildRow.length) query("INSERT INTO guildInfo (guildId, killChan, levelChan, dropChan, dropItem) VALUES (?, ?, ?, ?, ?)", [message.guild.id, "", "", "", ""]);

            query(`UPDATE guildInfo SET levelChan = "${message.channel.id}" WHERE guildId = "${message.guild.id}"`);
            message.reply(lang.setlevelchannel[0]);
        });
    },
}