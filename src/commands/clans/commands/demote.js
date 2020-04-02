
module.exports = {
    name: 'demote',
    aliases: [''],
    description: 'Demote a user in your clan.',
    long: 'Demote a user in your clan.',
    args: {"@user/discord#tag": "User to demote."},
    examples: ["clan demote @blobfysh"],
    requiresClan: true,
    minimumRank: 3,
    
    async execute(app, message, args){
        const scoreRow = await app.player.getRow(message.author.id);
        let user = app.parse.members(message, args)[0];

        if(!user){
            return message.reply('Please specify someone to demote. You can mention someone, use their Discord#tag, or type their user ID');
        }

        const invitedScoreRow = await app.player.getRow(user.id);

        if(!invitedScoreRow){
            return message.reply(`❌ The person you're trying to search doesn't have an account!`);
        }
        else if(invitedScoreRow.clanId !== scoreRow.clanId){
            return message.reply('❌ That user is not in your clan.');
        }
        else if(message.author.id === user.id){
            return message.reply('❌ You cannot demote yourself.');
        }
        else if(app.clan_ranks[invitedScoreRow.clanRank].title == 'Recruit'){
            return message.reply('❌ That member is already the lowest possible rank.');
        }
        else if(invitedScoreRow.clanRank >= scoreRow.clanRank){
            return message.reply('You cannot demote members of equal or higher rank!');
        }

        const botMessage = await message.channel.createMessage(`Demote member to \`${app.clan_ranks[invitedScoreRow.clanRank - 1].title}\`? They will LOSE these permissions:\n\`\`\`${app.clan_ranks[invitedScoreRow.clanRank].perms.join('\n')}\`\`\``);

        try{
            const confirmed = await app.react.getConfirmation(message.author.id, botMessage);

            if(confirmed){
                const invitedScoreRow2 = await app.player.getRow(user.id);
                
                if(invitedScoreRow2.clanId !== invitedScoreRow.clanId || invitedScoreRow2.clanRank !== invitedScoreRow.clanRank || app.clan_ranks[invitedScoreRow2.clanRank].title == 'Recruit'){
                    return botMessage.edit('❌ Error demoting member, try again?');
                }
                
                await app.query(`UPDATE scores SET clanRank = ${invitedScoreRow2.clanRank - 1} WHERE userId = ${user.id}`);

                botMessage.edit(`Demoted member to rank \`${app.clan_ranks[invitedScoreRow2.clanRank - 1].title}\``);
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