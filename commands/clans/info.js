const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const clans = require('../../methods/clan_methods.js');
const methods = require('../../methods/methods.js');
const config = require('../../json/_config.json');
const general = require('../../methods/general');
const icons = require('../../json/icons');
const clan_ranks = require('../../json/clan_ranks');
//const itemdata = require('../json/completeItemList.json');

module.exports = {
    name: 'info',
    aliases: ['i', 'inf'],
    description: 'Show information about a clan.',
    minimumRank: 0,
    requiresClan: false,
    
    async execute(message, args, lang, prefix){
        const scoreRow = (await query(`SELECT * FROM scores WHERE userId = ${message.author.id}`))[0];
        var mentionedUser = await general.getUserInfo(message, general.getUserId(args, true, message), true);

        if(!args.length && scoreRow.clanId == 0){
            return message.reply(lang.clans.info[0]);
        }
        else if(!args.length){
            getClanInfo(message, lang, scoreRow.clanId);
        }
        else if(mentionedUser !== undefined){
            const invitedScoreRow = (await query(`SELECT * FROM scores WHERE userId = ${mentionedUser.id}`))[0];
            if(!invitedScoreRow){
                return message.reply(lang.errors[0]);
            }
            else if(invitedScoreRow.clanId == 0){
                return message.reply(lang.clans.errors[1]);
            }
            else{
                getClanInfo(message, lang, invitedScoreRow.clanId);
            }
        }
        else{
            var clanName = args.join(" ");
            const clanRow = (await query(`SELECT * FROM clans WHERE LOWER(name) = ?`, [clanName.toLowerCase()]));

            if(!clanRow.length){
                return message.reply(lang.clans.info[1]);
            }
            
            getClanInfo(message, lang, clanRow[0].clanId);
        }
    },
}

async function getClanInfo(message, lang, clanId){
    const clanRow = (await query(`SELECT * FROM clans WHERE clanId = ${clanId}`))[0];
    const clanMembers = await clans.getMembers(clanId);
    const clanPower = await clans.getClanData(clanId);
    const raidCD = methods.getCD(message.client, {
        userId: clanId,
        type: 'raid'
    });

    var membersRanksList = [];
    var membersList = [];

    for(var i = 0; i < clanMembers.count; i++){
        const clanUser = await message.client.fetchUser(clanMembers.memberIds[i]);
        const clanUserRow = (await query(`SELECT clanRank, prestige FROM scores WHERE userId = ${clanMembers.memberIds[i]}`))[0];

        if(clanUser.id == message.author.id){
            membersRanksList.push(['** ->' + clan_ranks[clanUserRow.clanRank].title + ' ' + methods.getPrestigeBadge(clanUserRow.prestige) + ' ' + clanUser.tag + '**', clanUserRow.clanRank]);
        }
        else{
            if(clan_ranks[clanUserRow.clanRank].title == 'Leader'){
                membersRanksList.push([` - ${icons.clan_leader_crown} ` + clan_ranks[clanUserRow.clanRank].title + ' ' + methods.getPrestigeBadge(clanUserRow.prestige) + ' ' + clanUser.tag, clanUserRow.clanRank]);
            }
            else{
                membersRanksList.push([' - ' + clan_ranks[clanUserRow.clanRank].title + ' ' + methods.getPrestigeBadge(clanUserRow.prestige) + ' ' + clanUser.tag, clanUserRow.clanRank]);
            }
        }
    }

    membersRanksList.sort(function(a, b){return b[1] - a[1]}); // Sort clan members by rank.

    membersRanksList.forEach(member => {membersList.push(member[0])});

    const clanEmbed = new Discord.RichEmbed()
    .setColor(13215302)
    .setTitle(icons.clan_icon + clanRow.name)
    .setDescription(clanRow.status !== '' ? clanRow.status : lang.clans.info[2])
    .setThumbnail(clanRow.iconURL)
    .addField(lang.clans.info[3], clanPower.usedPower + '/' + clanPower.currPower + '/' + clanPower.maxPower, true)
    .addField(lang.clans.info[4], getShortDate(clanRow.clanCreated), true)
    if(raidCD){
        clanEmbed.addField(lang.clans.info[7], '`' + raidCD + '`')
    }
    clanEmbed.addBlankField()    
    clanEmbed.addField(lang.clans.info[5].replace('{0}', ((clanMembers.count * config.clan_interest_rate) * 100).toFixed(1)), methods.formatMoney(clanRow.money))
    clanEmbed.addField(lang.clans.info[6].replace('{0}', clanMembers.count), membersList.join('\n'), true)
    clanEmbed.addField('Member Stats', `${clanPower.kills + ' kills | ' + clanPower.deaths + ' deaths'}\n${methods.convertTime(clanPower.playtime)} of total playtime`, true)
    
    message.channel.send(clanEmbed);
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