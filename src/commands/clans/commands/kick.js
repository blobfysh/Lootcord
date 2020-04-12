
module.exports = {
    name: 'kick',
    aliases: [''],
    description: 'Kick a user from your clan (using mention or user id).',
    long: 'Kick a user from your clan, you can kick using their user ID if you dont share a server with them.',
    args: {"@user/discord ID": "User to kick."},
    examples: ["clan kick @blobfysh"],
    requiresClan: true,
    minimumRank: 4,
    
    async execute(app, message, args){
        const scoreRow = await app.player.getRow(message.author.id);
        let member = app.parse.members(message, message.args)[0];

        if(!member){
            // check args for id
            if(/^<?@?!?(\d+)>?$/.test(args[0])){
                let userId = args[0].match(/^<?@?!?(\d+)>?$/)[1];
                
                member = {
                    id: userId,
                    username: userId
                }
            }
            else{
                return message.reply('Please specify someone to kick. You can mention someone, use their Discord#tag, or type their user ID');
            }
        }

        const invitedScoreRow = await app.player.getRow(member.id);

        if(!invitedScoreRow){
            return message.reply(`❌ The person you're trying to search doesn't have an account!`);
        }
        else if(invitedScoreRow.clanId !== scoreRow.clanId){
            return message.reply('❌ That user is not in your clan.');
        }
        else if(message.author.id == member.id){
            return message.reply('❌ You cannot kick yourself.');
        }
        else if(invitedScoreRow.clanRank >= scoreRow.clanRank){
            return message.reply('You cannot kick members of equal or higher rank!');
        }

        await app.query(`UPDATE scores SET clanId = 0 WHERE userId = ${member.id}`);
        await app.query(`UPDATE scores SET clanRank = 0 WHERE userId = ${member.id}`);
        message.reply(`✅ Successfully kicked ${member.username}`);
    },
}