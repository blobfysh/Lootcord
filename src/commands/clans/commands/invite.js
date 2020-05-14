const MEMBER_LIMIT = 20;

module.exports = {
    name: 'invite',
    aliases: [''],
    description: 'Invite a user to join your clan.',
    long: 'Invite a user to join your clan.',
    args: {"@user/discord#tag": "User to invite."},
    examples: ["clan invite @blobfysh"],
    requiresClan: true,
    minimumRank: 2,
    
    async execute(app, message, args){
        const scoreRow = await app.player.getRow(message.author.id);
        const clanRow = (await app.query(`SELECT * FROM clans WHERE clanId = ${scoreRow.clanId}`))[0];
        let user = app.parse.members(message, args)[0];

        if(!user){
            return message.reply('Please specify someone to invite. You can mention someone, use their Discord#tag, or type their user ID');
        }

        const invitedScoreRow = await app.player.getRow(user.id);

        if(!invitedScoreRow){
            return message.reply(`❌ The person you're trying to search doesn't have an account!`);
        }
        else if(invitedScoreRow.clanId !== 0){
            return message.reply('❌ That user is already in a clan!');
        }
        else if((await app.clans.getMembers(scoreRow.clanId)).count >= MEMBER_LIMIT){
            return message.reply(`❌ Your clan has the max limit of members! (${MEMBER_LIMIT}/${MEMBER_LIMIT})`);
        }

        const botMessage = await message.channel.createMessage(`<@${user.id}>, ${message.member.nick || message.member.username} invited you to join the clan: \`${clanRow.name}\`. Do you accept?`);
        
        try{
            const confirmed = await app.react.getConfirmation(user.id, botMessage);

            if(confirmed){
                const invitedScoreRow2 = await app.player.getRow(user.id);
                const memberCount = (await app.clans.getMembers(scoreRow.clanId)).count;

                if(!invitedScoreRow2){
                    return botMessage.edit(`<@${user.id}>, you don't have an account.`);
                }
                else if(invitedScoreRow2.clanId !== 0){
                    return botMessage.edit(`<@${user.id}>, you are already in a clan!`);
                }
                else if(memberCount >= MEMBER_LIMIT){
                    return botMessage.edit(`The clan has hit the max limit of members! (${MEMBER_LIMIT}/${MEMBER_LIMIT})`);
                }

                await joinClan(app, user.id, clanRow.clanId);
                app.clans.addLog(clanRow.clanId, `${user.username} joined (inv. by ${message.author.username})`);

                botMessage.edit(`<@${user.id}>, You are now a member of \`${clanRow.name}\`\n\nView your clan information with \`clan info\` and check the vault with \`clan vault\`.`);
            }
            else{
                botMessage.delete();
            }
        }
        catch(err){
            botMessage.edit("You didn't react in time.");
        }
    },
}

async function joinClan(app, userId, clanId){
    await app.query(`UPDATE scores SET clanId = ${clanId} WHERE userId = ${userId}`);
    await app.query(`UPDATE scores SET clanRank = 0 WHERE userId = ${userId}`);
}