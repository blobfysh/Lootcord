const Filter = require('bad-words');
const filter = new Filter();
//TODO probably remove this command entirely...

module.exports = {
    name: 'setstatus',
    aliases: [''],
    description: "Sets the users status to display in commands.",
    long: "Changes your status in the profile command. Supports Discord unicode emoji.",
    args: {"status": "Status to set in the profile command."},
    examples: ["setstatus I am very cool"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let statusToSet = message.cleanContent.slice(message.prefix.length).split(/ +/).slice(1).join(" ");

        if(statusToSet.length > 120){
            return message.reply(`Your status can only be up to 120 characters long! You tried to set one that was ${statusToSet.length} characters long.`);
        }
        else if(/['"`]/g.test(statusToSet)){
            return message.reply("Statuses cannot contain the characters ', \", `");
        }

        statusToSet = filter.clean(statusToSet);

        try{
            await app.query(`UPDATE scores SET status = ? WHERE userId = ?`, [statusToSet, message.author.id]);

            message.reply('✅ Successfully set status to: ' + statusToSet);
        }
        catch(err){
            message.reply('❌ There was an error trying to modify your status.');
        }
    },
}