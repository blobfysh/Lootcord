const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const clans = require('../../methods/clan_methods.js');
const general = require('../../methods/general');
const clan_ranks = require('../../json/clan_ranks');

module.exports = {
    name: 'promote',
    aliases: [''],
    description: 'Promote a user in your clan.',
    minimumRank: 3,
    requiresClan: true,
    
    async execute(message, args, lang, prefix){
        const scoreRow = (await query(`SELECT * FROM scores WHERE userId = ${message.author.id}`))[0];
        var invitedUser = args[0];
        var promoteMessage = '';

        if(!args.length || invitedUser == undefined){
            return message.reply(lang.errors[1]);
        }

        invitedUser = await general.getUserInfo(message, invitedUser, true);

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
        else if((invitedScoreRow.clanRank + 1) >= scoreRow.clanRank){
            return message.reply('You cannot promote members to an equal or higher rank!');
        }
        else if(clan_ranks[invitedScoreRow.clanRank + 1].title == 'Leader'){
            promoteMessage = lang.clans.promote[1].replace('{0}', invitedUser.displayName);
        }
        else{
            promoteMessage = lang.clans.promote[0].replace('{0}', clan_ranks[invitedScoreRow.clanRank + 1].title).replace('{1}', clan_ranks[invitedScoreRow.clanRank + 1].perms.join('\n'));
        }

        message.channel.send(promoteMessage).then(botMessage => {
            botMessage.react('✅').then(() => botMessage.react('❌'));
            const filter = (reaction, user) => {
                return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
            };
            botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] }).then(async collected => {
                const reaction = collected.first();

                if(reaction.emoji.name === '✅'){
                    botMessage.delete();

                    const invitedScoreRow2 = (await query(`SELECT * FROM scores WHERE userId = ${invitedUser.id}`))[0];
                    
                    if(invitedScoreRow2.clanId !== invitedScoreRow.clanId || invitedScoreRow2.clanRank !== invitedScoreRow.clanRank){
                        return message.channel.send('Error promoting user, try again?');
                    }
                    else if(clan_ranks[invitedScoreRow2.clanRank + 1].title == 'Leader'){
                        transferLeadership(message.author.id, invitedUser.id, scoreRow.clanId);
                    }
                    else{
                        query(`UPDATE scores SET clanRank = ${invitedScoreRow2.clanRank + 1} WHERE userId = ${invitedUser.id}`);
                    }

                    message.reply(lang.clans.promote[2].replace('{0}', clan_ranks[invitedScoreRow2.clanRank + 1].title));
                }
                else{
                    botMessage.delete();
                }
            }).catch(collected => {
                botMessage.delete();
                message.reply(lang.errors[3]);
            });
        });
    },
}

async function transferLeadership (oldLeaderId, leaderId, clanId){
    const newLeaderRow = (await query(`SELECT * FROM scores WHERE userId = ${leaderId}`))[0];
    const oldLeaderRow = (await query(`SELECT * FROM scores WHERE userId = ${oldLeaderId}`))[0];
    query(`UPDATE scores SET clanRank = ${newLeaderRow.clanRank + 1} WHERE userId = ${leaderId}`);
    query(`UPDATE scores SET clanRank = ${oldLeaderRow.clanRank - 1} WHERE userId = ${oldLeaderId}`);

    query(`UPDATE clans SET ownerId = ${leaderId} WHERE clanId = ${clanId}`);
}