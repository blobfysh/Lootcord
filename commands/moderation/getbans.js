const Discord = require('discord.js');

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
        var bannedList = [];

        message.client.sets.bannedUsers.forEach(value => {
            try{
                bannedList.push(message.client.users.get(value).tag + " ID: " + value);
            }
            catch(err){
                bannedList.push("Tag unknown - ID: " + value);
            }
        });

        const banMsg = new Discord.RichEmbed()
        .setAuthor('Banned users')
        .setDescription(bannedList)
        .setColor(13632027)
        .setFooter('')

        try{
            message.channel.send(banMsg);
        }
        catch(err){
            message.reply("Something went wrong. Make sure you input the correct info.")
        }
    },
}