
module.exports = {
    name: 'promote',
    aliases: [''],
    description: 'Promote a user in your clan.',
    long: 'Promote a user in your clan.',
    args: {"@user/discord#tag": "User to promote."},
    examples: ["clan promote @blobfysh"],
    requiresClan: true,
    requiresActive: true,
    minimumRank: 3,
    
    async execute(app, message, args){
        const scoreRow = await app.player.getRow(message.author.id);
        let user = app.parse.members(message, args)[0];
        let promoteMessage = '';

        if(!user){
            return message.reply('Please specify someone to promote. You can mention someone, use their Discord#tag, or type their user ID');
        }

        const invitedScoreRow = await app.player.getRow(user.id);

        if(!invitedScoreRow){
            return message.reply(`❌ The person you're trying to search doesn't have an account!`);
        }
        else if(invitedScoreRow.clanId !== scoreRow.clanId){
            return message.reply('❌ That user is not in your clan.');
        }
        else if(message.author.id == user.id){
            return message.reply('❌ You cannot promote yourself.');
        }
        else if(app.clan_ranks[invitedScoreRow.clanRank + 1].title !== 'Leader' && (invitedScoreRow.clanRank + 1) >= scoreRow.clanRank){
            return message.reply('You cannot promote members to an equal or higher rank!');
        }
        else if(app.clan_ranks[invitedScoreRow.clanRank + 1].title == 'Leader'){
            promoteMessage = `Promoting this member will make them the leader of the clan! Are you sure you want to give leadership to ${user.nick || user.username}?`;
        }
        else{
            promoteMessage = `Promote member to \`${app.clan_ranks[invitedScoreRow.clanRank + 1].title}\`? This rank grants the following permissions:\n\`\`\`${app.clan_ranks[invitedScoreRow.clanRank + 1].perms.join('\n')}\`\`\`\n**Promoting a member you don't trust is dangerous!**`;
        }

        const botMessage = await message.channel.createMessage(promoteMessage);

        try{
            const confirmed = await app.react.getConfirmation(message.author.id, botMessage);

            if(confirmed){
                const invitedScoreRow2 = await app.player.getRow(user.id);
                
                if(invitedScoreRow2.clanId !== invitedScoreRow.clanId || invitedScoreRow2.clanRank !== invitedScoreRow.clanRank){
                    return botMessage.edit('❌ Error promoting user, try again?');
                }
                else if(app.clan_ranks[invitedScoreRow2.clanRank + 1].title == 'Leader'){
                    await transferLeadership(app, message.author.id, user.id, scoreRow.clanId);
                }
                else{
                    await app.query(`UPDATE scores SET clanRank = ${invitedScoreRow2.clanRank + 1} WHERE userId = ${user.id}`);
                }

                botMessage.edit(`✅ Successfully promoted **${user.nick || user.username}** to rank \`${app.clan_ranks[invitedScoreRow2.clanRank + 1].title}\``);
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

async function transferLeadership (app, oldLeaderId, leaderId, clanId){
    const newLeaderRow = (await app.query(`SELECT * FROM scores WHERE userId = ${leaderId}`))[0];
    const oldLeaderRow = (await app.query(`SELECT * FROM scores WHERE userId = ${oldLeaderId}`))[0];
    await app.query(`UPDATE scores SET clanRank = ${newLeaderRow.clanRank + 1} WHERE userId = ${leaderId}`);
    await app.query(`UPDATE scores SET clanRank = ${oldLeaderRow.clanRank - 1} WHERE userId = ${oldLeaderId}`);

    await app.query(`UPDATE clans SET ownerId = ${leaderId} WHERE clanId = ${clanId}`);
}