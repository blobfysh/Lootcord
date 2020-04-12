
module.exports = {
    name: 'getwarnings',
    aliases: ['getwarning'],
    description: "Get all warnings for a user.",
    long: "Retrieves all warnings for a user.",
    args: {
        "User ID": "ID of user to check."
    },
    examples: ["getwarnings 168958344361541633"],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let userID = message.args[0];

        try{
            const warningRows = await app.query(`SELECT * FROM warnings WHERE userId = '${userID}'`);

            if(!warningRows.length){
                return message.reply('❌ User has not been warned.');
            }

            const userInfo   = await app.common.fetchUser(userID, { cacheIPC: false });

            const warnings = new app.Embed()
            .setColor(13215302)
            .setAuthor(`${userInfo.username}#${userInfo.discriminator}`)
            .setTitle('Warnings')
            .setThumbnail(app.common.getAvatar(userInfo))
            
            for(let i = 0; i < warningRows.length; i++){
                let moderator = await app.common.fetchUser(warningRows[i].modId);
                
                warnings.addField(`Warning ${i + 1}`, `Moderator: ${moderator.username}#${moderator.discriminator}\nDate: ${app.common.getShortDate(warningRows[i].date)}\nReason: \`\`\`\n${warningRows[i].reason}\`\`\``)
            }
            
            message.channel.createMessage(warnings);
        }
        catch(err){
            message.reply('Error:```' + err + '```');
        }
    },
}