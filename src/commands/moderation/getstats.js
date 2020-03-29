
module.exports = {
    name: 'getstats',
    aliases: [''],
    description: "Displays information about the bot.",
    long: "Displays statistics about the bot.",
    args: {},
    examples: ["getstats"],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let stats = JSON.parse(await app.cache.get('stats'));
        let guildsJoined = await app.cache.get('servers_joined') || 0;
        let guildsLeft = await app.cache.get('servers_left') || 0;
        let disconnects = await app.cache.get('shards_disconnected') || 0;
        let resumes = await app.cache.get('shards_resumed') || 0;
        let errors = await app.cache.get('errors') || 0;
        let commandsUsed = await app.cache.get('commands') || 0;

        const embedInfo = new app.Embed()
        .setTitle(`Lootcord Stats`)
        .setColor(13215302)
        .setThumbnail(app.bot.user.avatarURL)
        .setDescription('Some top secret information right here...')
        .addField("Clusters", codeWrap(stats.clusters.length || 'unknown', 'js'), true)
        .addField("Total Memory Usage", codeWrap(stats.totalRam.toFixed(2) + ' MB', 'fix'), true)
        .addField("Cluster ID", codeWrap(app.clusterID.toString(), 'js'), true)
        .addField("Total Servers", codeWrap(stats.guilds.toString() || 'unknown', 'js'), true)
        .addField("Servers Gained", codeWrap(guildsJoined.toString(), 'js'), true)
        .addField("Servers Lost", codeWrap(guildsLeft.toString(), 'js'), true)
        .addField("Shard Disconnects", codeWrap(disconnects.toString(), 'js'), true)
        .addField("Shards Resumed", codeWrap(resumes.toString(), 'js'), true)
        .addField("Commands Called", codeWrap(commandsUsed, 'js'), true)
        .addField("Total Errors", codeWrap(errors.toString(), 'js'), true)
        .addField("Total Large Guilds", codeWrap(stats.largeGuilds.toString() || 'unknown', 'js'), true)
        message.channel.createMessage(embedInfo);
    },
}

function codeWrap(input, code){
    return '```' + code + '\n' + input + '```';
}