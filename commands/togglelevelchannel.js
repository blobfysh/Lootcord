const { query } = require('../mysql.js');

module.exports = {
    name: 'togglelevelchannel',
    aliases: ['setlevelchan', 'setlevelchannel', 'togglelevelchan', 'togglelvlchan', 'togglelvlchannel'],
    description: 'Toggles whether or not to send all level up messages for the server to the channel this command is used in.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    guildModsOnly: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        query(`SELECT * FROM guildInfo WHERE guildId ="${message.guild.id}"`).then(guildRow => {
            if(!guildRow.length) query("INSERT INTO guildInfo (guildId, killChan, levelChan, dropChan, dropItem) VALUES (?, ?, ?, ?, ?)", [message.guild.id, "", "", "", ""]);

            if(guildRow[0].levelChan == 0){
                query(`UPDATE guildInfo SET levelChan = "${message.channel.id}" WHERE guildId = "${message.guild.id}"`);
                message.reply(lang.setlevelchannel[0]);
            }
            else{
                query(`UPDATE guildInfo SET levelChan = 0 WHERE guildId = "${message.guild.id}"`);
                message.reply(lang.disablelevelchannel[0]);
            }
        });
    },
}