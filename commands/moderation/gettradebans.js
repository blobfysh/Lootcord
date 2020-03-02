const Discord = require('discord.js');
const general = require('../../methods/general');

module.exports = {
    name: 'gettradebans',
    aliases: ['gettradeban'],
    description: 'Shows a list of all trade banned users and their ID.',
    hasArgs: false,
    worksInDM: true,
    requiresAcc: false,
    guildModsOnly: false,
    modOnly: true,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        try{
            var bannedList = [];
            var bannedIDs = Array.from(message.client.sets.tradeBannedUsers);
    
            for(var i = 0; i < bannedIDs.length; i++){
                bannedList.push((i + 1) + '. ' + (await general.getUserInfo(message, bannedIDs[i])).tag + " ID: " + bannedIDs[i]);
            }
    
            const banMsg = new Discord.RichEmbed()
            .setAuthor('Trade banned users')
            .setDescription(bannedList)
            .setColor(13632027)
            .setFooter('Total: ' + bannedList.length)

            message.channel.send(banMsg);
        }
        catch(err){
            message.reply("Error: ```" + err + "```")
        }
    },
}