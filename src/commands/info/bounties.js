
module.exports = {
    name: 'bounties',
    aliases: ['bountys', 'bounty'],
    description: 'Show a list of available bounties.',
    long: 'Show a list of available bounties. Hunt down bounties for rare loot and earn some money.\nCurrently bounties are exclusive to the official Lootcord server.',
    args: {},
    examples: [],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        const userSpawns = await app.mysql.select('spawnChannels', 'guildId', message.guild.id, true);
        if(userSpawns.length === 0) return message.reply("❌ There are no bounties available in this server.");
        
        let bountyChans = userSpawns.map((spawn) => userSpawns.length > 1 && userSpawns.indexOf(spawn) == (userSpawns.length - 1) ? 'and <#' + spawn.channelId + '>': '<#' + spawn.channelId + '>').join(' ');
        const bounties = new app.Embed()
        .setTitle('Bounties')
        .setThumbnail('https://cdn.discordapp.com/attachments/497302646521069570/702382998187933757/thedealer.png')
        .setDescription(`I need help taking out some targets. Heavily armed, trained mercenaries known all around Lootcord. They were last seen near ${bountyChans} but could be anywhere now. Get rid of these guys and you'll be paid well.`)

        for(let bounty of Object.keys(app.mobdata)){
            bounties.addField(app.mobdata[bounty].title, `Reward: ${app.common.formatNumber(app.mobdata[bounty].minMoney)} - ${app.common.formatNumber(app.mobdata[bounty].maxMoney)}`)
        }

        bounties.addField('\u200b', 'You know where to look, now get the job done.')

        message.channel.createMessage(bounties);
    },
}