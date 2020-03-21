const { version } = require('../../../package.json');
const os          = require('os');

module.exports = {
    name: 'update',
    aliases: ['botinfo', 'info', 'version', 'stats'],
    description: 'Displays various information about the bot.',
    requiresAcc: false,
    
    async execute(app, message){
        var used = process.memoryUsage().heapUsed / 1024 / 1024;
        let stats = JSON.parse(await app.cache.get('stats'));

        console.log(stats);

        const embedInfo = new app.Embed()
        embedInfo.setTitle(`**Lootcord Update Info**`)
        embedInfo.setColor(13215302)
        embedInfo.setThumbnail(app.bot.user.avatarURL)
        embedInfo.setDescription('Hey!')
        embedInfo.addField("Shard ID", message.guild.shard.id.toString(), true)
        embedInfo.addField("Cluster ID", app.clusterID.toString())
        embedInfo.addField("Active Servers", Object.keys(app.bot.guildShardMap).length, true)
        embedInfo.addField("Version", "`" + version +"`", true)
        embedInfo.addField("Memory Usage",Math.round(used) + "/" + Math.round(os.totalmem() / 1024 / 1024) + " MB",true)
        embedInfo.addField("Website", "https://lootcord.com",true)
        embedInfo.addField("Creators","blobfysh#4679\nOGSteve#0007",true)
        embedInfo.addField("Discord","https://discord.gg/7XNbdzP",true)
        embedInfo.setFooter("Need help? Message the bot! | PM's to Lootcord are sent directly to moderators.")
        message.channel.createMessage(embedInfo);
    },
}