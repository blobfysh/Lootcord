const { query } = require('../mysql.js');

module.exports = {
    name: 'togglerandomattacks',
    aliases: ['randomonly', 'togglerandomattack', 'togglerandattacks', 'togglerandattack', 'togglerandonly'],
    description: 'Toggles the server to only allow random attacks.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    guildModsOnly: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        query(`SELECT * FROM guildInfo WHERE guildId ="${message.guild.id}"`).then(guildRow => {
            if(!guildRow.length) query("INSERT INTO guildInfo (guildId, killChan, levelChan, dropChan, dropItem, randomOnly) VALUES (?, ?, ?, ?, ?, ?)", [message.guild.id, "", "", "", "", 0]);

            if(guildRow[0].randomOnly == 0){
                query(`UPDATE guildInfo SET randomOnly = 1 WHERE guildId = ${message.guild.id}`);

                message.reply(lang.togglerandomattacks[0]);
            }
            else{
                query(`UPDATE guildInfo SET randomOnly = 0 WHERE guildId = "${message.guild.id}"`);

                message.reply(lang.togglerandomattacks[1]);
            }
        });
    },
}