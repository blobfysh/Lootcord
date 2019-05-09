const Discord = require('discord.js');
const { query } = require('../../mysql.js');

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
    
    execute(message, args, lang, prefix){
        var bannedID = args[0];

        if(!message.client.sets.bannedUsers.has(bannedID)){
            message.reply("That user wasn't banned.\nMake sure to use the users ID which can be found with the `getbans` command.");
            return;
        }

        query(`SELECT * FROM banned WHERE userId =${bannedID}`).then(row => {
            
            message.client.fetchUser(bannedID).then(bannedUser => {

                const banMsg = new Discord.RichEmbed()
                .setTitle(bannedUser.tag + " Ban Info")
                .addField("Reason", "```" + row[0].reason + "```")
                .addField("Date", new Date(row[0].date).toString())
                .setColor(13632027)

                message.channel.send(banMsg);
            }).catch(err => {

                const banMsg = new Discord.RichEmbed()
                .setTitle("Unknown user's Ban Info")
                .addField("Reason", "```" + row[0].reason + "```")
                .addField("Date", new Date(row[0].date).toString())
                .setColor(13632027)

                message.channel.send(banMsg);
            });
        }).catch(err => {
            message.channel.send("ERROR GETTING BAN INFO:\n```" + err + "```")
        });
    },
}