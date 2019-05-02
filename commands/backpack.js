const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');

module.exports = {
    name: 'backpack',
    aliases: [''],
    description: 'View your currently equipped backpack and stats.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        query(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(oldRow => {
            const row = oldRow[0];

            methods.getitemcount(message.author.id).then(itemCt => {
                if(row.backpack !== "none"){
                    message.reply("\n**Backpack equipped:** `" + row.backpack + "`\n**Inventory space:** `" + itemCt.capacity + "` (base 10 ***+"+itemdata[row.backpack].inv_slots+"***)\nIncrease space by equipping a better backpack!");
                }
                else{
                    message.reply("\n**Backpack equipped:** `" + row.backpack + "`\n**Inventory space:** `" + itemCt.capacity + "`\nIncrease space by equipping a better backpack!");
                }
            });
        });
    },
}