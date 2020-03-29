const Discord    = require('discord.js');
const { query }  = require('../../mysql.js');
const config     = require('../../json/_config.json');
const accCodes   = require('../../methods/acc_code_handler.js');
const general    = require('../../methods/general');
const clans      = require('../../methods/clan_methods');
const clan_ranks = require('../../json/clan_ranks');
const methods    = require('../../methods/methods');

module.exports = {
    name: 'delacc',
    aliases: [''],
    description: 'Removes a users account from the bot database.',
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
        
        let userId = args[0];

        if(userId !== undefined && userId !== ""){
            try{
                const userRow = (await query(`SELECT * FROM scores WHERE userId = ${userId}`))[0];
                
                if(!userRow){
                    return message.reply('User has no account.');
                }
                
                const user = await general.getUserInfo(message, userId);
                const userCode = await accCodes.getinvcode(message, userId);
                message.client.shard.broadcastEval(`
                    const channel = this.channels.get('${config.logChannel}');
            
                    if(channel){
                        channel.send({embed: {
                                color: 16636672,
                                author: {
                                    name: "⛔ Account deleted by moderators"
                                },
                                title: "${user.username} : ${userId}",
                                description: "User inventory code prior to deletion:\`\`\`${userCode.invCode}\`\`\`",
                            }
                        });
                        true;
                    }
                    else{
                        false;
                    }
                `).then(console.log);

                if(clan_ranks[userRow.clanRank].title == 'Leader'){
                    clans.disbandClan(userRow.clanId);
                }
                query(`DELETE FROM scores WHERE userId ="${userId}"`);
                query(`DELETE FROM user_items WHERE userId ="${userId}"`);
                query(`DELETE FROM badges WHERE userId = ${userId}`);
                query(`DELETE FROM userGuilds WHERE userId = ${userId}`); //delete user from server
                
                methods.clearCD(message.client, userId, 'shield');

                message.reply(`Account deleted for \`${user.tag}\`. A log of their account code has been created in <#${config.logChannel}>.`);
            }
            catch(err){
                message.reply('Unable to send message to user, their account was still deleted however. ```' + err + '```');
            }
        }
        else{
            message.reply("This command deletes a users account. `"+prefix+"delacc <id>`");
        }
    },
}