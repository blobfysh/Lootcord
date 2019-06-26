const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const clans = require('../../methods/clan_methods.js');

// TODO check if clan member count is equal to 20 before allowing invite to clan

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
            return message.reply('You need to mention the person you want to invite!');
        }

        const invitedScoreRow = (await query(`SELECT * FROM scores WHERE userId = ${invitedUser.id}`))[0];

        if(!invitedScoreRow){
            return message.reply(lang.errors[0]);
        }
        else if(invitedScoreRow.clanId !== 0){
            return message.reply('That user is already in a clan!');
        }

        message.channel.send(invitedUser + `, ${message.member.displayName} invited you to join the clan: \`${clanRow.name}\`. Do you accept?`).then(botMessage => {
            botMessage.react('✅').then(() => botMessage.react('❌'));
            const filter = (reaction, user) => {
                return ['✅', '❌'].includes(reaction.emoji.name) && user.id === invitedUser.id || ['❌'].includes(reaction.emoji.name) && user.id === message.author.id;
            };
            botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] }).then(async collected => {
                const reaction = collected.first();

                if(reaction.emoji.name === '✅'){
                    botMessage.delete();

                    const invitedScoreRow2 = (await query(`SELECT * FROM scores WHERE userId = ${invitedUser.id}`))[0];

                    if(!invitedScoreRow2){
                        return message.channel.send(invitedUser + ', you need an account to join a clan!');
                    }
                    else if(invitedScoreRow2.clanId !== 0){
                        return message.channel.send(invitedUser + ', you are already in a clan!');
                    }

                    joinClan(invitedUser.id, clanRow.clanId);
                    message.channel.send(invitedUser + ', success!');
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