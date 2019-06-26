const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const clans = require('../../methods/clan_methods.js');
const methods = require('../../methods/methods.js');
//const itemdata = require('../json/completeItemList.json');

module.exports = {
    name: 'info',
    aliases: [''],
    description: 'Show information about a clan.',
    minimumRank: 0,
    requiresClan: false,
    
    async execute(message, args, lang, prefix){
        const scoreRow = (await query(`SELECT * FROM scores WHERE userId = ${message.author.id}`))[0];
        const mentionedUser = message.mentions.users.first();

        if(!args.length && scoreRow.clanId == 0){
            return message.reply('You are not a member of any clan! You can look up other clans by searching their name.');
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
                return message.reply('That user is not in a clan.');
            }
            else{
                getClanInfo(message, lang, invitedScoreRow.clanId);
            }
        }
        else{
            var clanName = args.join(" ");
            const clanRow = (await query(`SELECT * FROM clans WHERE LOWER(name) = ?`, [clanName.toLowerCase()]));

            if(!clanRow.length){
                return message.reply('I could not find a clan with that name! Maybe you misspelled it?');
            }
            
            getClanInfo(message, lang, clanRow[0].clanId);
        }
    },
}

async function getClanInfo(message, lang, clanId){
    const clanRow = (await query(`SELECT * FROM clans WHERE clanId = ${clanId}`))[0];
    const clanMembers = await clans.getMembers(clanId);
    const clanPower = await clans.getPower(clanId);

    var membersRanksList = [];
    var membersList = [];

    for(var i = 0; i < clanMembers.count; i++){
        const clanUser = await message.client.fetchUser(clanMembers.memberIds[i]);
        const clanUserRank = (await query(`SELECT * FROM scores WHERE userId = ${clanMembers.memberIds[i]}`))[0].clanRank;

        if(clanUser.id == message.author.id){
            membersRanksList.push(['** ->' + lang.clans.clan_ranks[clanUserRank].title + ' ' + clanUser.tag + '**', clanUserRank]);
        }
        else{
            membersRanksList.push([' - ' + lang.clans.clan_ranks[clanUserRank].title + ' ' + clanUser.tag, clanUserRank]);
        }
    }

    membersRanksList.sort(function(a, b){return b[1] - a[1]}); // Sort clan members by rank.

    membersRanksList.forEach(member => {membersList.push(member[0])});

    const clanEmbed = new Discord.RichEmbed()
    .setColor(14202368)
    .setTitle(clanRow.name)
    .setDescription(clanRow.status !== '' ? clanRow.status : 'This clan is too mysterious for a status...')
    .setThumbnail(clanRow.iconURL)
    .addField('Clan Power (Used / Current / Max)', clanPower.usedPower + '/' + clanPower.currPower + '/' + clanPower.maxPower, true)
    .addField('Founded', getShortDate(clanRow.clanCreated), true)
    .addBlankField()    
    .addField('Bank', methods.formatMoney(clanRow.money))
    .addField('Members', membersList.join('\n'))

    message.channel.send(clanEmbed);
}

function getShortDate(date){
    var convertedTime = new Date(date).toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles'
    });
    convertedTime = new Date(convertedTime);
    
    var d = convertedTime;
    var month = d.getMonth() + 1;
    var day = d.getDate();
    var year = d.getFullYear();
    var time = d.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'}).replace(' ', '');
    
    return month + '/' + day + '/' + year.toString().slice(2) + ' ' + time + ' EST';
}