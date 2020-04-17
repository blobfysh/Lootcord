
module.exports = {
    name: 'changestatus',
    aliases: [''],
    description: "Change status for a user.",
    long: "Change status for a user. Should be used if you see a status that goes against Discord TOS.",
    args: {
        "User ID": "ID of user to edit status of."
    },
    examples: ["changestatus 168958344361541633 pls"],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let userID = message.args[0];
        let statusToSet = message.cleanContent.slice(message.prefix.length).split(/ +/).slice(2).join(" ");

        if(message.channel.id !== app.config.modChannel){
            return message.reply('❌ You must be in the moderator channel to use this command.');
        }
        else if(!userID){
            return message.reply('❌ You forgot to include a user ID.');
        }
        
        try{
            const user = await app.common.fetchUser(userID, { cacheIPC: false });
            await app.query(`UPDATE scores SET status = ? WHERE userId = ?`, [statusToSet, userID]);

            message.reply(`✅ Successfully changed **${user.username}#${user.discriminator}**'s status to: ${statusToSet}`);
        }
        catch(err){
            message.reply('Error:```\n' + err + '```');
        }
    },
}