const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const methods = require('../../methods/methods.js');
const itemdata = require('../../json/completeItemList.json');

module.exports = {
    name: 'addpoints',
    aliases: ['addpoint'],
    description: 'Admin-only command. Adds points/xp to user with ID',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    modOnly: false,
    adminOnly: true,
    
    execute(message, args, lang, prefix){
        let userNameID = args[0];
        let amount = args[1];

        if(userNameID !== undefined){

            if(amount == undefined){
                message.reply("You forgot to put an amount! `"+prefix+"addpoints (ID) (AMOUNT)`");
            }

            else{
                query(`SELECT * FROM scores WHERE userId =${userNameID}`).then(row => {

                    query(`UPDATE scores SET points = ${parseInt(row[0].points) + parseInt(amount)} WHERE userId = ${userNameID}`);
                    message.reply(amount + " points added to user!");
                    
                }).catch(err => {
                    message.reply('Something went wrong: ```' + err + '```');
                });
            }
        }

        else{
            message.reply("Please use the user ID followed by the amount. `"+prefix+"addpoints (ID) (AMOUNT)`");
        }
    },
}