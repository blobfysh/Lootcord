
module.exports = {
    name: 'getclan',
    aliases: ['getclaninfo', 'getclanid'],
    description: "Get metadata of a clan.",
    long: "Get metadata of a clan using the name. Will retrieve the clan's ID and all member ID's.",
    args: {
        "clan": "Clan to search."
    },
    examples: ["getclan Mod Squad"],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let clanName = message.args.join(" ");
        const clanRow = (await app.query(`SELECT * FROM clans WHERE LOWER(name) = ?`, [clanName.toLowerCase()]));

        if(!clanRow.length){
            return message.reply('❌ A clan with that name does not exist.');
        }

        const clanMembers = await app.clans.getMembers(clanRow[0].clanId);

        let membersRanksList = [];

        for(let i = 0; i < clanMembers.count; i++){
            const clanUser = await app.common.fetchUser(clanMembers.memberIds[i], { cacheIPC: false });
            const clanUserRow = await app.player.getRow(clanMembers.memberIds[i]);

            if(app.clan_ranks[clanUserRow.clanRank].title == 'Leader'){
                membersRanksList.push([` - ${app.icons.clan_leader_crown} ` + app.clan_ranks[clanUserRow.clanRank].title + ' ' + app.player.getBadge(clanUserRow.badge) + ' ' + (`${clanUser.username}#${clanUser.discriminator}`)+ ' (`' + clanMembers.memberIds[i] + '`)', clanUserRow.clanRank]);
            }
            else{
                membersRanksList.push([' - ' + app.clan_ranks[clanUserRow.clanRank].title + ' ' + app.player.getBadge(clanUserRow.badge) + ' ' + (`${clanUser.username}#${clanUser.discriminator}`) + ' (`' + clanMembers.memberIds[i] + '`)', clanUserRow.clanRank]);
            }
        }

        membersRanksList.sort(function(a, b){return b[1] - a[1]}); // Sort clan members by rank.

        const baseEmbed = new app.Embed()
        .setColor(13215302)
        .setAuthor(clanRow[0].name, 'https://cdn.discordapp.com/attachments/497302646521069570/695319745003520110/clan-icon-zoomed-out.png')
        .addField('Clan ID', '```\n' + clanRow[0].clanId + '```')
        .addField(`Members (${clanMembers.count})`, membersRanksList.map(member => member[0]).join('\n'))

        message.channel.createMessage(baseEmbed);
    },
}