const { query } = require('../mysql.js');

module.exports = {
    name: 'disablelevelchannel',
    aliases: ['disablelevelchan'],
    description: 'Disables the dedicated channel for level-up messages.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    guildModsOnly: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        query(`SELECT * FROM guildInfo WHERE guildId ="${message.guild.id}"`).then(guildRow => {
            if(!guildRow.length) query("INSERT INTO guildInfo (guildId, killChan, levelChan, dropChan, dropItem) VALUES (?, ?, ?, ?, ?)", [message.guild.id, "", "", "", ""]);

            query(`UPDATE guildInfo SET levelChan = "" WHERE guildId = "${message.guild.id}"`);
            message.reply(lang.disablelevelchannel[0]);
        });
    },
}