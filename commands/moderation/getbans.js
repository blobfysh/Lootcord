const Discord = require('discord.js');
const general = require('../../methods/general');

module.exports = {
    name: 'getbans',
    aliases: ['getban'],
    description: 'Shows a list of all banned users and their ID.',
    hasArgs: false,
    worksInDM: true,
    requiresAcc: false,
    guildModsOnly: false,
    modOnly: true,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        try{
            var bannedList = [];
            var bannedIDs = Array.from(message.client.sets.bannedUsers);
    
            for(var i = 0; i < bannedIDs.length; i++){
                bannedList.push((await general.getUserInfo(message, bannedIDs[i])).tag + " ID: " + bannedIDs[i]);
            }
    
            const banMsg = new Discord.RichEmbed()
            .setAuthor('Banned users')
            .setDescription(bannedList)
            .setColor(13632027)
            .setFooter('')

            message.channel.send(banMsg);
        }
        catch(err){
            message.reply("Error: ```" + err + "```")
        }
    },
}