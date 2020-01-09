const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const clans = require('../../methods/clan_methods.js');
const general = require('../../methods/general');

module.exports = {
    name: 'kick',
    aliases: [''],
    description: 'Kick a user from your clan.',
    minimumRank: 4,
    requiresClan: true,
    
    async execute(message, args, lang, prefix){
        const scoreRow = (await query(`SELECT * FROM scores WHERE userId = ${message.author.id}`))[0];
        var invitedUser = args[0];

        if(!args.length || invitedUser == undefined){
            return message.reply(lang.errors[1]);
        }

        invitedUser = await general.getUserInfo(message, invitedUser);

        if(invitedUser == undefined){
            return message.reply(lang.errors[1]);
        }

        const invitedScoreRow = (await query(`SELECT * FROM scores WHERE userId = ${invitedUser.id}`))[0];

        if(!invitedScoreRow){
            return message.reply(lang.errors[0]);
        }
        else if(invitedScoreRow.clanId !== scoreRow.clanId){
            return message.reply(lang.clans.kick[0]);
        }
        else if(message.author.id == invitedUser.id){
            return message.reply(lang.errors[1]);
        }
        else if(invitedScoreRow.clanRank >= scoreRow.clanRank){
            return message.reply('You cannot kick members of equal or higher rank!');
        }

        query(`UPDATE scores SET clanId = 0 WHERE userId = ${invitedUser.id}`);
        query(`UPDATE scores SET clanRank = 0 WHERE userId = ${invitedUser.id}`);
        message.reply(lang.clans.kick[1].replace('{0}', invitedUser.tag));
    },
}