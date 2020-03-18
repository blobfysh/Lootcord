const Discord = require('discord.js');
const methods = require('../methods/methods.js');
const badgedata = require('../json/badges.json');
const general = require('../methods/general');

module.exports = {
    name: 'badge',
    aliases: [''],
    description: 'Shows information about a badge.',
    hasArgs: false,
    worksInDM: true,
    requiresAcc: false,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        let badgeSearched = general.parseBadgeWithSpaces(args[0], args[1]);
        let badge = badgedata[badgeSearched];

        if(badge){
            const badgeEmbed = new Discord.RichEmbed()
            .setTitle(badge.icon + ' ' + badgeSearched)
            .setThumbnail(badge.image)
            .setDescription(badge.description)
            .setColor(13215302)

            message.channel.send(badgeEmbed);
        }
        else{
            return message.reply("❌ I don't recognize that badge.");
        }
    },
}