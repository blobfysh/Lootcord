const Discord     = require('discord.js');
const { version } = require('../package.json');
const os          = require('os');
const botInfo     = require('../json/_update_info.json');

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

        /* This user count is highly inaccurate (only counts cached users)
        var usersCount = await message.client.shard.broadcastEval(`this.guilds.reduce((prevCount, currGuild) => prevCount + currGuild.memberCount, 0);`);
        usersCount = usersCount.reduce((prev, userCt) => prev + userCt);
        */
        
        const embedInfo = new Discord.RichEmbed()
        embedInfo.setTitle(`<:update:264184209617321984>**Lootcord Update Info**`)
        embedInfo.setColor(13215302)
        embedInfo.setThumbnail(message.client.user.avatarURL)
        embedInfo.setDescription(botInfo.desc)
        embedInfo.addField("Shard ID", message.client.shard.id, true)
        embedInfo.addField("Active Servers",guildsCount, true)
        embedInfo.addField("Version", "`" + version +"`", true)
        embedInfo.addField("Memory Usage",Math.round(used) + "/" + Math.round(os.totalmem() / 1024 / 1024) + " MB",true)
        embedInfo.addField("Website", "https://lootcord.com",true)
        embedInfo.addField("Creators","blobfysh#4679\nOGSteve#0007",true)
        embedInfo.addField("Discord","https://discord.gg/7XNbdzP",true)
        embedInfo.setFooter("Need help? Message the bot! | PM's to Lootcord are sent directly to moderators.")
        message.channel.send(embedInfo);
    },
}