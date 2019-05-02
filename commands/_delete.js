const Discord   = require('discord.js');
const { query } = require('../mysql.js');
const config    = require('../json/_config.json');
const accCodes  = require('../methods/acc_code_handler.js');

module.exports = {
    name: 'delete',
    aliases: ['suicide'],
    description: 'Deletes your account. This action cannot be undone.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        if(message.client.sets.deleteCooldown.has(message.author.id)) return message.reply(lang.delete[2]);

        let quotes = ["drank bleach", "typed kill in console", "ate a tide pod"];
        let chance = Math.floor(Math.random() * 3) //0-2
        
        message.reply(lang.delete[0]).then(botMessage => {
            botMessage.react('✅').then(() => botMessage.react('❌'));
            const filter = (reaction, user) => {
                return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
            };
            botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] }).then(collected => {
                const reaction = collected.first();

                if(reaction.emoji.name === '✅'){
                    botMessage.delete();

                    accCodes.getinvcode(message, message.author.id).then(userCode => {
                        message.client.shard.broadcastEval(`
                            const channel = this.channels.get('${config.logChannel}');
                    
                            if(channel){
                                channel.send({embed: {
                                        color: 16636672,
                                        title: "⛔ Account deleted",
                                        description: "User inventory code prior to deletion:\`\`\`${userCode.invCode}\`\`\`",
                                    }
                                });
                                true;
                            }
                            else{
                                false;
                            }
                        `).then(console.log);

                        query(`DELETE FROM scores WHERE userId ="${message.author.id}"`);
                        query(`DELETE FROM items WHERE userId ="${message.author.id}"`);
                        query(`DELETE FROM userGuilds WHERE userId = ${message.author.id}`); //delete user from server
    
                        query(`UPDATE cooldowns SET mittenShieldTime = 0, ironShieldTime = 0, goldShieldTime = 0 WHERE userId ="${message.author.id}"`);
                    });

                    message.client.shard.broadcastEval(`this.sets.activeShield.delete('${message.author.id}');
                    this.sets.deleteCooldown.add('${message.author.id}');
                    `);

                    setTimeout(() => {
                        message.client.shard.broadcastEval(`this.sets.deleteCooldown.delete('${message.author.id}')`);
                    }, 3600 * 1000);
                    

                    if(message.content.startsWith(prefix + "suicide")){
                        message.channel.send(`${message.author} ${quotes[chance]}...\n${lang.delete[1]}`);
                    }
                    else{
                        message.reply(lang.delete[1]);
                    }
                }
                else{
                    botMessage.delete();
                }
            }).catch(collected => {
                botMessage.delete();
                message.reply("You didn't react in time!");
            });
        });
    },
}