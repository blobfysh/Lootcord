const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const general = require('../../methods/general');

module.exports = {
    name: 'getwarnings',
    aliases: [''],
    description: 'Get all warnings for a user.',
    hasArgs: false,
    worksInDM: true,
    requiresAcc: false,
    guildModsOnly: false,
    modOnly: true,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        var warnedID = args[0];

        try{
            const warningRows = await query(`SELECT * FROM warnings WHERE userId = '${warnedID}'`);
            const warnedUser = await general.getUserInfo(message, warnedID);

            if(!warningRows.length){
                return message.reply('That user has no warnings.');
            }

            const warnMsg = new Discord.RichEmbed()
            .setTitle(warnedUser.tag + " Warnings")
            .setColor(13632027)
            .setFooter('Total: ' + warningRows.length)

            for(var i = 0; i < warningRows.length; i++){
                warnMsg.addField('Warning ' + (i + 1), '**Moderator:** ' + (await general.getUserInfo(message, warningRows[i].modId)).tag + 
                '\n**Date:** ' + getShortDate(warningRows[i].date) +
                '\n**Reason:**\n' + warningRows[i].reason);
                //make it so it displays warning reason, who warned, and date warned
            }

            message.channel.send(warnMsg);
        }
        catch(err){
            message.reply('Error: ```' + err + '```')
        }
    },
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
    
    return month + '/' + day + '/' + year.toString().slice(2) + ' - ' + time + ' EST';
}