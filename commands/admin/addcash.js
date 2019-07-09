const Discord = require('discord.js');
const methods = require('../../methods/methods.js');

module.exports = {
    name: 'addcash',
    aliases: [''],
    description: 'Admin-only command. Adds money to user with ID',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    modOnly: false,
    adminOnly: true,
    
    async execute(message, args, lang, prefix){
        let userNameID = args[0];
        let moneyAmnt  = args[1];
                          
        if(userNameID !== undefined){
            if(userNameID == "me"){
                userNameID = message.author.id;
            }
            if(moneyAmnt == ""){
                message.reply("You forgot to put an amount! `"+prefix+"addcash <id> <amount>`");
            }
            else{
                try{
                    methods.addmoney(userNameID, moneyAmnt);
                    message.reply(`$${moneyAmnt} added to user!`);
                }
                catch(err){
                    message.reply("Something went wrong:```"+err+"```")
                }
            }
        }
        else{
            message.reply("Please use the user ID followed by the amount. `"+prefix+"addcash <id> <amount>`");
        }
    },
}