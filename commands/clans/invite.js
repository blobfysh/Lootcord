const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const clans = require('../../methods/clan_methods.js');

module.exports = {
    name: 'invite',
    aliases: [''],
    description: 'Invite a user to join your clan.',
    minimumRank: 1,
    requiresClan: true,
    
    async execute(message, args, lang, prefix){
        const scoreRow = (await query(`SELECT * FROM scores WHERE userId = ${message.author.id}`))[0];
        const clanRow = (await query(`SELECT * FROM clans WHERE clanId = ${scoreRow.clanId}`))[0];
        const invitedUser = message.mentions.users.first();

        if(!args.length || invitedUser == undefined){
            return message.reply(lang.errors[1]);
        }

        const invitedScoreRow = (await query(`SELECT * FROM scores WHERE userId = ${invitedUser.id}`))[0];

        if(!invitedScoreRow){
            return message.reply(lang.errors[0]);
        }
        else if(invitedScoreRow.clanId !== 0){
            return message.reply(lang.clans.invite[0]);
        }
        else if((await clans.getMembers(scoreRow.clanId)).count >= 20){
            return message.reply(lang.clans.invite[1]);
        }
        message.channel.send(lang.clans.invite[2].replace('{0}', invitedUser).replace('{1}', message.member.displayName).replace('{2}', clanRow.name)).then(botMessage => {
            botMessage.react('✅').then(() => botMessage.react('❌'));
            const filter = (reaction, user) => {
                return ['✅', '❌'].includes(reaction.emoji.name) && user.id === invitedUser.id || ['❌'].includes(reaction.emoji.name) && user.id === message.author.id;
            };
            botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] }).then(async collected => {
                const reaction = collected.first();

                if(reaction.emoji.name === '✅'){
                    botMessage.delete();

                    const invitedScoreRow2 = (await query(`SELECT * FROM scores WHERE userId = ${invitedUser.id}`))[0];
                    const memberCount = (await clans.getMembers(scoreRow.clanId)).count;

                    if(!invitedScoreRow2){
                        return message.channel.send(lang.general[0].replace('{0}', prefix));
                    }
                    else if(invitedScoreRow2.clanId !== 0){
                        return message.channel.send(lang.clans.invite[3].replace('{0}', invitedUser));
                    }
                    else if(memberCount >= 20){
                        return message.reply(lang.clans.invite[1]);
                    }

                    joinClan(invitedUser.id, clanRow.clanId);
                    message.channel.send(lang.clans.invite[4].replace('{0}', invitedUser).replace('{1}', clanRow.name).replace('{2}', prefix).replace('{3}', prefix));
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

async function joinClan(userId, clanId){
    query(`UPDATE scores SET clanId = ${clanId} WHERE userId = ${userId}`);
    query(`UPDATE scores SET clanRank = 0 WHERE userId = ${userId}`);
}