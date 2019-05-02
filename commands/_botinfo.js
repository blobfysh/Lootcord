const Discord = require('discord.js');
const { version } = require('../package.json');

module.exports = {
    name: 'update',
    aliases: ['botinfo', 'info', 'version', 'stats'],
    description: 'Displays various information about the bot.',
    hasArgs: false,
    worksInDM: true,
    requiresAcc: false,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        var used = process.memoryUsage().heapUsed / 1024 / 1024;
        var guildsCount = await message.client.shard.fetchClientValues('guilds.size');
        guildsCount = guildsCount.reduce((prev, guildCt) => prev + guildCt);

        var usersCount = await message.client.shard.fetchClientValues('users.size');
        usersCount = usersCount.reduce((prev, userCt) => prev + userCt);


        const embedInfo = new Discord.RichEmbed()
        .setTitle(`<:update:264184209617321984>**Lootcord Update Info**`)
        .setColor(13215302)
        .setThumbnail("https://cdn.discordapp.com/attachments/454163538886524928/529555281391386629/lc_icon.png")
        .setDescription("Bot has been rewritten, we've moved over to a new DBMS which has caused inventories to be wiped. **HOWEVER,** we will try restore anyones inventory who contacts us by messaging the bot.")
        .addField("Users",(usersCount),true)
        .addField("Active Servers",guildsCount, true)
        .addField("Version", "`" + version +"`", true)
        .addField("Memory Usage",Math.round(used) + " MB",true)
        .addField("Website", "https://lootcord.com",true)
        .addField("Creators","blobfysh#4679\nOGSteve#0007",true)
        .setFooter("Need help? Message the bot! | PM's to Lootcord are sent directly to moderators.")
        message.channel.send(embedInfo);
    },
}