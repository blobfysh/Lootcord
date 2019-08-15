const Discord   = require('discord.js');
const { query } = require('../mysql.js');
const config    = require('../json/_config.json');
const accCodes  = require('../methods/acc_code_handler.js');
const refresher = require('../methods/refresh_active_role.js');
const clans     = require('../methods/clan_methods');
const clan_ranks = require('../json/clan_ranks');

module.exports = {
    name: 'delete',
    aliases: ['suicide'],
    description: 'Deletes your account. This action cannot be undone.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        if(message.client.sets.deleteCooldown.has(message.author.id)) return message.reply(lang.delete[2]);

        let quotes = ["drank bleach", "typed kill in console", "ate a tide pod"];
        let chance = Math.floor(Math.random() * 3) //0-2
        
        const botMessage = await message.reply(lang.delete[0]);
        await botMessage.react('✅');
        await botMessage.react('❌');
        const filter = (reaction, user) => {
            return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
        };

        try{
            const collected = await botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] });
            const reaction = collected.first();

            if(reaction.emoji.name === '✅'){
                botMessage.delete();
                const userCode = await accCodes.getinvcode(message, message.author.id);
                const userRow = (await query(`SELECT * FROM scores WHERE userId = ${message.author.id}`))[0];

                message.client.shard.broadcastEval(`
                    const channel = this.channels.get('${config.logChannel}');
            
                    if(channel){
                        channel.send({embed: {
                                color: 16636672,
                                author: {
                                    name: "⛔ Account deleted"
                                },
                                title: "${message.author.username} : ${message.author.id}",
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
                query(`DELETE FROM scores WHERE userId ="${message.author.id}"`);
                query(`DELETE FROM user_items WHERE userId ="${message.author.id}"`);
                query(`DELETE FROM userGuilds WHERE userId = ${message.author.id}`); //delete user from server

                query(`UPDATE cooldowns SET mittenShieldTime = 0, ironShieldTime = 0, goldShieldTime = 0 WHERE userId ="${message.author.id}"`);

                message.client.shard.broadcastEval(`this.sets.activeShield.delete('${message.author.id}');
                this.sets.deleteCooldown.add('${message.author.id}');
                `);

                message.client.shard.broadcastEval(`
                    this.shieldTimes.forEach(arrObj => {
        
                        if(arrObj.userId == ${message.author.id}){
                            //stop the timer
                            clearTimeout(arrObj.timer);
                
                            //remove from airdropTimes array
                            this.shieldTimes.splice(this.shieldTimes.indexOf(arrObj), 1);
                
                            console.log('canceled a timeout');
                        }
                
                    });
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
                if(Object.keys(config.activeRoleGuilds).includes(message.guild.id)){
                    refresher.refreshactives(message);
                }
            }
            else{
                botMessage.delete();
            }
        }
        catch(err){
            botMessage.delete();
            message.reply("You didn't react in time!");
        }
    },
}