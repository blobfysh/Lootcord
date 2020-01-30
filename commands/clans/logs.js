const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const general = require('../../methods/general');
const icons = require('../../json/icons');
//const itemdata = require('../json/completeItemList.json');

module.exports = {
    name: 'logs',
    aliases: ['log'],
    description: 'Shows logs of a clan.',
    minimumRank: 0,
    requiresClan: false,
    
    async execute(message, args, lang, prefix){
        const scoreRow = (await query(`SELECT * FROM scores WHERE userId = ${message.author.id}`))[0];
        var mentionedUser = await general.getUserInfo(message, general.getUserId(args, true, message), true);

        if(!args.length && scoreRow.clanId == 0){
            return message.reply(lang.clans.info[0]);
        }
        else if(!args.length){
            getClanLogs(message, scoreRow.clanId);
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
                getClanLogs(message, invitedScoreRow.clanId);
            }
        }
        else{
            var clanName = args.join(" ");
            const clanRow = (await query(`SELECT * FROM clans WHERE LOWER(name) = ?`, [clanName.toLowerCase()]));

            if(!clanRow.length){
                return message.reply(lang.clans.info[1]);
            }
            
            getClanLogs(message, clanRow[0].clanId);
        }
    },
}

async function getClanLogs(message, clanId){
    const clanRow = (await query(`SELECT * FROM clans WHERE clanId = ${clanId}`))[0];
    const logs = await query(`SELECT * FROM clan_logs WHERE clanId = ${clanId} ORDER BY logDate DESC LIMIT 10`);

    let display = '';
    let header = 'Description                           Time   ';

    for(var i = 0; i < logs.length; i++){
        display += `${logs[i].details.slice(0, 38)}`.padEnd(39, ' ') + `${getShortDate(logs[i].logTime)}\n`;
    }

    const logsEmbed = new Discord.RichEmbed()
    .setTitle('🗒️Logs for: ' + clanRow.name + ' (Last 10)')
    .setDescription('Sorted newest to oldest:```' + header + '\n' + '-'.repeat(header.length) + '\n' + display + '```')
    .setColor(13215302)

    message.reply(logsEmbed);
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
    
    return month + '/' + day + '/' + year.toString().slice(2);
}