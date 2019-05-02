const Discord = require('discord.js');
//const { query } = require('../../mysql.js');

module.exports = {
    name: 'getmods',
    aliases: [''],
    description: 'Get a list of all moderators.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    guildModsOnly: false,
    modOnly: false,
    adminOnly: true,
    
    async execute(message, args, lang, prefix){
        try{
            let moddedList = [];
            /* This code was used to refresh the list of moderators. It is no longer needed now that the bot does it at launch
            query(`SELECT userId FROM mods`).then(row => {
                row.forEach((moderatorId) => {
                    if(moderatorId.userId !== undefined && moderatorId.userId !== null){
                        moddedUsers.add(moderatorId.userId);
                    }
                });
            });
            */
            message.client.sets.moddedUsers.forEach(value => {
                moddedList.push(message.client.users.get(value).tag + " ID: " + value);
            });
            const modMsg = new Discord.RichEmbed()
            .setAuthor('Moderator list')
            .setDescription(moddedList)
            .setColor(720640)
            .setFooter('Mods list refreshed.')
            message.channel.send(modMsg);
        }
        catch(err){
            message.reply("Something went wrong. Make sure you input the correct info.")
        }
    },
}