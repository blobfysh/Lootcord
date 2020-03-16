const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const methods = require('../../methods/methods.js');
const itemdata = require('../../json/completeItemList.json');

module.exports = {
    name: 'cdclear',
    aliases: [''],
    description: 'Clears a user of all cooldowns using their ID. WARNING: Clearing cooldowns this way is unreliable since it does not stop setTimeout()s',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    modOnly: false,
    adminOnly: true,
    
    async execute(message, args, lang, prefix){
        let userId = args[0];

        if(userId !== undefined){
            if(userId == ""){
                message.reply("You forgot an ID! `"+prefix+"cdclear (ID)`");
            }
            else{
                try{
                    await methods.clearAllCD(message.client, userId);

                    await message.reply('Cleared all user cooldowns. To clear just one cooldown, use `eval methods.clearCD(client, userId, type)`');
                }
                catch(err){
                    message.reply("Error clearing cooldowns: ```"+err+"```")
                }
            }
        }
        else{
            message.reply("This command wipes all **command** cooldowns for a user. `"+prefix+"cdclear <ID>`");
        }
    },
}