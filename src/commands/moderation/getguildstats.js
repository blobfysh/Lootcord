
module.exports = {
    name: 'getguildstats',
    aliases: ['getguildinfo', 'guildstats'],
    description: "Shows statistics about a server.",
    long: "Shows statistics about a server.",
    args: {
        "Guild ID": "ID of guild to check."
    },
    examples: ["getguildstats 454163538055790604"],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let guildID = message.args[0];

        if(!guildID){
            return message.reply('❌ You forgot to include a guild ID.')
        }
        
        try{
            if(await app.cd.getCD(guildID, 'guildbanned')) return message.reply('❌ That guild has been banned from using the bot.');

            const guildInfo = await app.common.fetchGuild(guildID);

            if(!guildInfo) return message.reply('❌ I am not in a guild with that ID.');

            const guildRow = await app.common.getGuildInfo(guildID);
            const prefixRow = (await app.query(`SELECT * FROM guildPrefix WHERE guildId ="${guildID}"`))[0];
            const activeRows = await app.query(`SELECT * FROM userGuilds WHERE guildId = ?`, [guildID]);
            const guildCreated = codeWrap(new Date(Math.floor((guildID / 4194304) + 1420070400000)).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/New_York'}) + '\n' + new Date(Math.floor((guildID / 4194304) + 1420070400000)).toLocaleTimeString('en-US', {timeZone: 'America/New_York'}) + ' (EST)', 'fix')
            const joinedGuild = codeWrap(new Date(guildInfo.joinedAt).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/New_York'}) + '\n' + new Date(guildInfo.joinedAt).toLocaleTimeString('en-US', {timeZone: 'America/New_York'}) + ' (EST)', 'fix')
            const cachedChannels = guildInfo.channels instanceof Map ? guildInfo.channels : new Map(Object.entries(guildInfo.channels));
            const cachedMembers = guildInfo.members instanceof Map ? guildInfo.members : new Map(Object.entries(guildInfo.members));
            
            const killFeedChan = cachedChannels.get(guildRow.killChan) ? cachedChannels.get(guildRow.killChan).name + ' (' + guildRow.killChan + ')' : 'None set';
            const levelChan = cachedChannels.get(guildRow.levelChan) ? cachedChannels.get(guildRow.levelChan).name + ' (' + guildRow.levelChan + ')' : 'None set';
            const airdropChan = cachedChannels.get(guildRow.dropChan) ? cachedChannels.get(guildRow.dropChan).name + ' (' + guildRow.dropChan + ')' : 'None set';
            const attackMode = guildRow.randomOnly ? 'Random only' : 'Selectable';

            const statEmbed = new app.Embed()
            .setColor(13451564)
            .setAuthor(`${guildInfo.name}`)
            .setDescription('Only a max of 15 members/channels will be shown due to length limitations.')
            .addField('Guild Created', guildCreated, true)
            .addField('Lootcord Joined Date', joinedGuild, true)
            .addField('Stats', `**Total Members:** ${guildInfo.memberCount}
            **Server Owner:** \`${guildInfo.ownerID}\`
            **Prefix:** ${prefixRow ? prefixRow.prefix : app.config.prefix}
            **Kill Feed Channel:** ${killFeedChan}
            **Level Channel:** ${levelChan}
            **Airdrop Channel:** ${airdropChan}
            **Attack Mode:** ${attackMode}`)
            .addField(`Channels - ${cachedChannels.size}`, codeWrap(cachedChannels.map(chan => getChannelType(chan.type) + ' - ' + chan.name + ' (' + chan.id + ')').slice(0, 15).join('\n') || 'None', ''))
            .addField(`Cached Members - ${cachedMembers.size}`, codeWrap(cachedMembers.filter(user => !user.user.bot).map(user => user.user.username + '#' + user.user.discriminator + ' (' + user.user.id + ')').slice(0, 15).join('\n') || 'None (cached bots are not shown)', ''))
            .addField(`Activated Players - ${activeRows.length}`, codeWrap(activeRows.map(row => row.userId).slice(0, 15).join('\n') || 'None', ''))

            if(guildInfo.icon) statEmbed.setThumbnail(app.bot._formatImage(`/icons/${guildID}/${guildInfo.icon}`));

            message.channel.createMessage(statEmbed);
        }
        catch(err){
            message.reply('Error:```' + err + '```');
        }
    },
}

function getChannelType(type){
    switch(type){
        case 0: return 'Text';
        case 2: return 'Voice';
        case 4: return 'Category';
        default: return '';
    }
}

function codeWrap(input, code){
    return '```' + code + '\n' + input + '```';
}