
module.exports = {
    name: 'info',
    aliases: ['i', 'inf'],
    description: 'Show information about a clan.',
    long: 'Shows information about a clan.',
    args: {"clan/user": "Clan or user to search, will default to your own clan if none specified."},
    examples: ["clan info Mod Squad"],
    requiresClan: false,
    minimumRank: 0,
    
    async execute(app, message, args){
        const scoreRow = await app.player.getRow(message.author.id);
        const mentionedUser = app.parse.members(message, args)[0];

        if(!args.length && scoreRow.clanId === 0){
            return message.reply('You are not a member of any clan! You can look up other clans by searching their name.');
        }
        else if(!args.length){
            message.channel.createMessage(await getClanInfo(app, message.author.id, scoreRow.clanId));
        }
        else if(mentionedUser){
            const invitedScoreRow = await app.player.getRow(mentionedUser.id);

            if(!invitedScoreRow){
                return message.reply(`❌ The person you're trying to search doesn't have an account!`);
            }
            else if(invitedScoreRow.clanId == 0){
                return message.reply('❌ That user is not in a clan.');
            }
            else{
                message.channel.createMessage(await getClanInfo(app, message.author.id, invitedScoreRow.clanId));
            }
        }
        else{
            let clanName = args.join(" ");
            const clanRow = (await app.query(`SELECT * FROM clans WHERE LOWER(name) = ?`, [clanName.toLowerCase()]));

            if(!clanRow.length){
                return message.reply('I could not find a clan with that name! Maybe you misspelled it?');
            }
            
            message.channel.createMessage(await getClanInfo(app, message.author.id, clanRow[0].clanId));
        }
    },
}

async function getClanInfo(app, userId, clanId){
    const clanRow = (await app.query(`SELECT * FROM clans WHERE clanId = ${clanId}`))[0];
    const clanMembers = await app.clans.getMembers(clanId);
    const clanPower = await app.clans.getClanData(clanId);
    const raidCD = await app.cd.getCD(clanId, 'raid');

    let membersRanksList = [];
    let membersList = [];

    for(let i = 0; i < clanMembers.count; i++){
        const clanUser = await app.common.fetchUser(clanMembers.memberIds[i]);
        const clanUserRow = await app.player.getRow(clanMembers.memberIds[i]);

        if(clanUser.id == userId){
            membersRanksList.push(['** ->' + app.clan_ranks[clanUserRow.clanRank].title + ' ' + app.player.getBadge(clanUserRow.badge) + ' ' + (`${clanUser.username}#${clanUser.discriminator}`) + '**', clanUserRow.clanRank]);
        }
        else{
            if(app.clan_ranks[clanUserRow.clanRank].title == 'Leader'){
                membersRanksList.push([` - ${app.icons.clan_leader_crown} ` + app.clan_ranks[clanUserRow.clanRank].title + ' ' + app.player.getBadge(clanUserRow.badge) + ' ' + (`${clanUser.username}#${clanUser.discriminator}`), clanUserRow.clanRank]);
            }
            else{
                membersRanksList.push([' - ' + app.clan_ranks[clanUserRow.clanRank].title + ' ' + app.player.getBadge(clanUserRow.badge) + ' ' + (`${clanUser.username}#${clanUser.discriminator}`), clanUserRow.clanRank]);
            }
        }
    }

    membersRanksList.sort(function(a, b){return b[1] - a[1]}); // Sort clan members by rank.

    membersRanksList.forEach(member => {membersList.push(member[0])});

    const clanEmbed = new app.Embed()
    .setColor(13215302)
    .setAuthor(clanRow.name, 'https://cdn.discordapp.com/attachments/497302646521069570/695319745003520110/clan-icon-zoomed-out.png')
    .setTitle('Info')
    .setDescription(clanRow.status !== '' ? clanRow.status : 'This clan is too mysterious for a status...')
    .addField('Clan Power (Used / Current / Max)', clanPower.usedPower + '/' + clanPower.currPower + '/' + clanPower.maxPower, true)
    .addField('Founded', getShortDate(clanRow.clanCreated), true)
    if(raidCD){
        clanEmbed.addField('Raid Timer', '`' + raidCD + '`')
    }
    if(clanRow.iconURL){
        clanEmbed.setThumbnail(clanRow.iconURL)
    }
    clanEmbed.addBlankField()    
    clanEmbed.addField(`Bank (Interest Rate: \`${((clanMembers.count * app.config.clan_interest_rate) * 100).toFixed(1)}%\`)`, app.common.formatNumber(clanRow.money))
    clanEmbed.addField(`Members (${clanMembers.count})`, membersList.join('\n'), true)
    clanEmbed.addField('Member Stats', `${clanPower.kills + ' kills | ' + clanPower.deaths + ' deaths'}\n${app.cd.convertTime(clanPower.playtime)} of total playtime`, true)
    
    return clanEmbed;
}

function getShortDate(date){
    var convertedTime = new Date(date).toLocaleString('en-US', {
        timeZone: 'America/New_York'
    });
    convertedTime = new Date(convertedTime);
    
    var d = convertedTime;
    var month = d.getMonth() + 1;
    var day = d.getDate();
    var year = d.getFullYear();
    var time = d.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'}).replace(' ', '');
    
    return month + '/' + day + '/' + year.toString().slice(2) + ' ' + time + ' EST';
}