const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const sql = require('sqlite');
sql.open('./score.sqlite');
const config = require('../../json/_config.json');

module.exports = {
    name: 'importacc',
    aliases: [''],
    description: 'Imports a users account from the old sqlite database.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    guildModsOnly: false,
    modOnly: true,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        if(message.channel.id !== config.modChannel){
            return message.reply('You must be in the mod-command-center!');
        }
        
        let userId = args[0];

        if(userId !== undefined && userId !== ""){
            query(`SELECT * FROM items 
            INNER JOIN scores
            ON items.userId = scores.userId
            WHERE items.userId = '${userId}'`).then(oldRow => {
                if(!oldRow.length) return message.reply("The user must create an account for this command to work.");

                sql.get(`SELECT * FROM items
                JOIN scores
                ON items.userId = scores.userId
                WHERE items.userId = "${userId}"`).then(liteRow => {
                    if(!liteRow) return message.reply("This user didn't have an old account.");

                    console.log('yarrr  ' + liteRow.backpack);
                    var changedVals = [];
    
                    //iterate every column in row
                    Object.keys(liteRow).forEach(item => {
                        var amount = liteRow[item];
                        if(item !== 'userId' && item !== 'createdAt' && item !== 'testrow' && item !== 'jackpotMoney'){
                            if(item == 'bmg_50cal') item = '50_cal';

                            if(item == 'inv_slots'){
                                if(liteRow.backpack == 'none') amount = 0;

                                else if(liteRow.backpack == 'light_pack') amount = 5;

                                else if(liteRow.backpack == 'canvas_bag') amount = 15;

                                else if(liteRow.backpack == 'hikers_pack') amount = 25;
                            }
                            
                            changedVals.push('Set ' + item + ' to ' + amount);
                            
                            //run this query every iteration to reset each column
                            query(`UPDATE scores
                            INNER JOIN items
                            ON scores.userId = items.userId
                            INNER JOIN cooldowns
                            ON scores.userId = cooldowns.userId
                            SET ${item} = '${amount}'
                            WHERE scores.userId = '${userId}'`);
                        }
                    });

                    message.reply('Success! Here\'s the values I\'ve changed:\n```' + changedVals.join('\n') + '```')
                });
            }).catch(err => {
                message.reply("Error importing acc: ```"+err+"```")
            });
        }
        else{
            message.reply("This command wipes a users inventory. `"+prefix+"invwipe <id> <reason>`");
        }
    },
}