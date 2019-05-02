const { query } = require('../mysql.js');

module.exports = {
    name: 'setkillfeed',
    aliases: [''],
    description: 'Sets the channel its used in as the kill feed for the server.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    guildModsOnly: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        query(`SELECT * FROM guildInfo WHERE guildId ="${message.guild.id}"`).then(guildRow => {
            if(!guildRow.length) query("INSERT INTO guildInfo (guildId, killChan, levelChan, dropChan, dropItem) VALUES (?, ?, ?, ?, ?)", [message.guild.id, "", "", "", ""]);

            query(`UPDATE guildInfo SET killChan = ${message.channel.id} WHERE guildId = ${message.guild.id}`);

            message.reply(lang.setkillfeed[0]);
        });
    },
}