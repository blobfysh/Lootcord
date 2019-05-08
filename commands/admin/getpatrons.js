const Discord = require('discord.js');
//const { query } = require('../../mysql.js');
const patrons = require('../../methods/patron_list.js');

module.exports = {
    name: 'getpatrons',
    aliases: [''],
    description: 'Get a list of all patrons.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    guildModsOnly: false,
    modOnly: false,
    adminOnly: true,
    
    async execute(message, args, lang, prefix){
        try{
            const patronList = await patrons.list_patrons(message.client);

            const modMsg = new Discord.RichEmbed()
            .setAuthor('AMAZING PATRONS list')
            .addField('Tier 1', patronList.tier1s.length > 0 ? patronList.tier1s : 'none')
            .addField('Tier 2', patronList.tier2s.length > 0 ? patronList.tier2s : 'none')
            .addField('Tier 3', patronList.tier3s.length > 0 ? patronList.tier3s : 'none')
            .setColor(720640)
            message.channel.send(modMsg);
        }
        catch(err){
            message.reply("Error: ```" + err + "```")
        }
    },
}