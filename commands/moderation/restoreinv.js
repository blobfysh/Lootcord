const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const method = require('../../methods/acc_code_handler.js');
const config = require('../../json/_config.json');
const general = require('../../methods/general');

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
            const row = (await query(`SELECT * FROM items 
            INNER JOIN scores
            ON items.userId = scores.userId
            WHERE items.userId = '${userObj.userId}'`))[0];
            const user = await general.getUserInfo(message, userObj.userId);
            
            if(!row) return message.reply("Invalid code or the user has no account to overwrite with restored data.");

            Object.keys(row).forEach(item => {
                if(item !== 'userId'){
                    var amount;
                    if(userObj[item] !== undefined){
                        amount = userObj[item];
                    }
                    else{
                        amount = 0;
                    }

                    query(`UPDATE scores
                    INNER JOIN items
                    ON scores.userId = items.userId
                    SET ${item} = '${amount}'
                    WHERE scores.userId = '${userObj.userId}'`);
                }
            });
            
            message.reply("Account successfully restored for " + user.tag);
        }
        catch(err){
            message.reply('Error restoring account: ```' + err + '```');
        }
    },
}