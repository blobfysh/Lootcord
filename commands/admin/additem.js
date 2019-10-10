const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const methods = require('../../methods/methods.js');
const itemdata = require('../../json/completeItemList.json');
const general = require('../../methods/general');

module.exports = {
    name: 'additem',
    aliases: [''],
    description: 'Admin-only command. Adds item to user with ID',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    modOnly: false,
    adminOnly: true,
    
    execute(message, args, lang, prefix){
        let userNameID = args[0];
        let itemName = general.getCorrectedItemInfo(args[1]);
        let itemAmount = args[2];
                          
        if(userNameID !== undefined){
            if(userNameID == "me"){
                userNameID = message.author.id;
            }
            if(itemName == ""){
                message.reply("You forgot to put an item! `"+prefix+"additem (ID) (ITEM) (AMOUNT)`");
            }
            else if(itemdata[itemName] == undefined){
                message.reply("That item isn't in my database!");
            }
            else{
                try{
                    methods.additem(userNameID, itemName, itemAmount);
                    message.reply(itemAmount + "x " + itemName + " added to user!");
                }
                catch(err){
                    message.reply("Something went wrong. Items must be spelled exactly as they are in data table.")
                }
            }
        }
        else{
            message.reply("Please use the user ID followed by the item. `"+prefix+"additem (ID) (ITEM) (AMOUNT)`");
        }
    },
}