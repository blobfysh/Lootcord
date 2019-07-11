const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const general = require('../../methods/general');

module.exports = {
    name: 'getbaninfo',
    aliases: ['baninfo'],
    description: 'Get detailed info about a ban using an ID.',
    hasArgs: false,
    worksInDM: true,
    requiresAcc: false,
    guildModsOnly: false,
    modOnly: true,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        var bannedID = args[0];

        if(!message.client.sets.bannedUsers.has(bannedID)){
            message.reply("That user wasn't banned.\nMake sure to use the users ID which can be found with the `getbans` command.");
            return;
        }

        try{
            const bannedRow = await query(`SELECT * FROM banned WHERE userId =${bannedID}`);
            const bannedUser = await general.getUserInfo(message, bannedID);
    
            const banMsg = new Discord.RichEmbed()
            .setTitle(bannedUser.tag + " Ban Info")
            .addField("Reason", "```" + bannedRow[0].reason + "```")
            .addField("Date", new Date(bannedRow[0].date).toString())
            .setColor(13632027)

            message.channel.send(banMsg);
        }
        catch(err){
            message.reply('Error: ```' + err + '```')
        }
    },
}