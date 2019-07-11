const Discord = require('discord.js');
const general = require('../../methods/general');
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
            var moddedIDS = Array.from(message.client.sets.moddedUsers);
            
            for(var i = 0; i < moddedIDS.length; i++){
                moddedList.push((await general.getUserInfo(message, moddedIDS[i])).tag + " ID: " + moddedIDS[i]);
            }

            const modMsg = new Discord.RichEmbed()
            .setAuthor('Moderator list')
            .setDescription(moddedList)
            .setColor(720640)
            .setFooter('Mods list refreshed.')
            message.channel.send(modMsg);
        }
        catch(err){
            message.reply("Error: ```" + err + "```")
        }
    },
}