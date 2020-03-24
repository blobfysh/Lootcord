const { version } = require('../../../package.json');

module.exports = {
    name: 'botinfo',
    aliases: ['update', 'info', 'version', 'stats'],
    description: "Displays various information about the bot.",
    long: "Displays information about the current update and the bot.",
    args: {},
    examples: ["update", "botinfo"],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        var used = process.memoryUsage().heapUsed / 1024 / 1024;
        let stats = JSON.parse(await app.cache.get('stats'));

        const embedInfo = new app.Embed()
        embedInfo.setTitle(`**Lootcord Update Info**`)
        embedInfo.setColor(13215302)
        embedInfo.setThumbnail(app.bot.user.avatarURL)
        embedInfo.setDescription('Hey!')
        embedInfo.addField("Shard ID", message.guild.shard.id.toString(), true)
        embedInfo.addField("Cluster ID", app.clusterID.toString(), true)
        embedInfo.addField("Active Servers", stats.guilds, true)
        embedInfo.addField("Uptime", app.cd.convertTime(app.bot.uptime), true)
        embedInfo.addField("Library", "Eris", true)
        embedInfo.addField("Memory Usage", Math.round(used) + " MB",true)
        embedInfo.addField("Creators","blobfysh#4679\nOGSteve#0007",true)
        embedInfo.addField("Website", "https://lootcord.com",true)
        embedInfo.addField("Discord","https://discord.gg/7XNbdzP",true)
        embedInfo.setFooter("Need help? Message the bot! | PM's to Lootcord are sent directly to moderators.")
        message.channel.createMessage(embedInfo);
    },
}