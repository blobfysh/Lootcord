const Discord = require('discord.js');
const { query } = require('../mysql.js');
const config    = require('../json/_config.json');
const refresher = require('../methods/refresh_active_role.js');

module.exports = {
    name: 'deactivate',
    aliases: [''],
    description: 'Deactivate your account in a server.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        query(`SELECT * FROM cooldowns WHERE userId ="${message.author.id}"`).then(row => {
            if(message.client.sets.deactivateCooldown.has(message.author.id)) return message.reply(lang.deactivate[0]);

            if(message.client.sets.activateCooldown.has(message.author.id)) return message.reply(lang.deactivate[1].replace('{0}', ((3600 * 1000 - ((new Date()).getTime() - row[0].activateTime)) / 60000).toFixed(1)));
            //((3600 * 1000 - ((new Date()).getTime() - row.activateTime)) / 60000).toFixed(1)
            if(message.client.sets.weapCooldown.has(message.author.id)) return message.reply(lang.deactivate[2]);
            
            message.reply(lang.deactivate[3]).then(botMessage => {
                
                botMessage.react('✅').then(() => botMessage.react('❌'));
                const filter = (reaction, user) => {
                    return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                };
                botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] }).then(collected => {
                    const reaction = collected.first();
                    
                    if(reaction.emoji.name === '✅'){
                        botMessage.delete();
                        query(`DELETE FROM userGuilds WHERE userId = ${message.author.id} AND guildId = ${message.guild.id}`); //delete user from server 
                        

                        query(`UPDATE cooldowns SET deactivateTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);

                        message.client.shard.broadcastEval(`this.sets.deactivateCooldown.add('${message.author.id}')`);
                        setTimeout(() => {
                            message.client.shard.broadcastEval(`this.sets.deactivateCooldown.delete('${message.author.id}')`);
                            query(`UPDATE cooldowns SET deactivateTime = ${0} WHERE userId = ${message.author.id}`);
                        }, 86400 * 1000);
                        message.reply(lang.deactivate[4]);

                        if(message.guild.id == config.supportGuildID){
                            refresher.refreshactives(message);
                        }
                    }
                    else{
                        botMessage.delete();
                    }
                }).catch(collected => {
                    botMessage.delete();
                    message.reply(lang.errors[3]);
                });
            });
        });
    },
}