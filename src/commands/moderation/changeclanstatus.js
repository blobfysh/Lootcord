
module.exports = {
    name: 'changeclanstatus',
    aliases: [''],
    description: "Change status for a clan.",
    long: "Change status for a clan. Should be used if you see a status that goes against Discord TOS.",
    args: {
        "Clan ID": "ID of clan to edit status of."
    },
    examples: ["changeclanstatus 12 pls"],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let clanID = message.args[0];
        let statusToSet = message.cleanContent.slice(message.prefix.length).split(/ +/).slice(2).join(" ");

        if(message.channel.id !== app.config.modChannel){
            return message.reply('❌ You must be in the moderator channel to use this command.');
        }
        else if(!userID){
            return message.reply('❌ You forgot to include a user ID.');
        }
        
        try{
            await app.query(`UPDATE clans SET status = ? WHERE clanId = ?`, [statusToSet, scoreRow.clanId]);

            message.reply(`✅ Successfully changed status of clan with ID \`${clanID}\` to: ${statusToSet}`);
        }
        catch(err){
            message.reply('Error:```\n' + err + '```');
        }
    },
}