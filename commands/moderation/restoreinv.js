const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const method = require('../../methods/acc_code_handler.js');
const methods = require('../../methods/methods');
const config = require('../../json/_config.json');
const general = require('../../methods/general');
const itemdata = require('../../json/completeItemList');

module.exports = {
    name: 'restoreinv',
    aliases: ['restoreacc'],
    description: 'Restore a users inventory using their account code.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    guildModsOnly: false,
    modOnly: true,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        if(message.channel.id !== config.modChannel){
            return message.reply('You must be in the mod-command-center!');
        }

        let accCode = args[0];

        try{
            const userObj = method.decodeCode(accCode);
            const row = (await query(`SELECT * FROM scores WHERE userId = '${userObj.userId}'`))[0];
            const user = await general.getUserInfo(message, userObj.userId);
            
            if(!row) return message.reply("Invalid code or the user has no account to overwrite with restored data.");

            Object.keys(userObj).forEach(item => {
                if(item !== 'userId' && item !== 'clanId' && item !== 'clanRank' && item !== 'lastActive'){
                    var amount;
                    if(userObj[item] !== undefined){
                        amount = userObj[item];
                    }
                    else{
                        amount = 0;
                    }
                    
                    if(itemdata[item] !== undefined){
                        methods.additem(userObj.userId, item, amount);
                    }
                    else{
                        query(`UPDATE scores SET ${item} = '${amount}' WHERE userId = '${userObj.userId}'`);
                    }
                }
            });
            
            message.reply("Account successfully restored for " + user.tag);
        }
        catch(err){
            message.reply('Error restoring account: ```' + err + '```');
        }
    },
}