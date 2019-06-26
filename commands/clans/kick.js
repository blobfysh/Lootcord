const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const clans = require('../../methods/clan_methods.js');

// TODO check if clan member count is equal to 20 before allowing invite to clan

module.exports = {
    name: 'kick',
    aliases: [''],
    description: 'Kick a user from your clan.',
    minimumRank: 2,
    requiresClan: true,
    
    async execute(message, args, lang, prefix){
        const scoreRow = (await query(`SELECT * FROM scores WHERE userId = ${message.author.id}`))[0];
        const invitedUser = message.mentions.users.first();

        if(!args.length || invitedUser == undefined){
            return message.reply(lang.errors[1]);
        }

        const invitedScoreRow = (await query(`SELECT * FROM scores WHERE userId = ${invitedUser.id}`))[0];

        if(!invitedScoreRow){
            return message.reply(lang.errors[0]);
        }
        else if(invitedScoreRow.clanId !== scoreRow.clanId){
            return message.reply('That user is not in your clan.');
        }
        else if(message.author.id == invitedUser.id){
            return message.reply(lang.errors[1]);
        }

        query(`UPDATE scores SET clanId = 0 WHERE userId = ${invitedUser.id}`);
        query(`UPDATE scores SET clanRank = 0 WHERE userId = ${invitedUser.id}`);
        message.reply('Successfully kicked.');
    },
}