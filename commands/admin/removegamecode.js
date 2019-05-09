const Discord = require('discord.js');
const { query } = require('../../mysql.js');

module.exports = {
    name: 'removegamecode',
    aliases: [''],
    description: 'Remove a game key from the database.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    guildModsOnly: false,
    modOnly: false,
    adminOnly: true,
    
    execute(message, args, lang, prefix){
        let gameName = args[0];
        try{
            query(`DELETE FROM gamesData WHERE gameName = '${gameName}'`);
            message.reply("success")
        }
        catch(err){
            message.reply("Error removing game `removegamecode <game_name>`: ```" + err + "```");
        }
    },
}