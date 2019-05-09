const Discord = require('discord.js');
const { query } = require('../../mysql.js');

module.exports = {
    name: 'buffclean',
    aliases: [''],
    description: 'Clears a user of all shields and other buffs/debuffs.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    modOnly: false,
    adminOnly: true,
    
    execute(message, args, lang, prefix){
        let userId = args[0];

        if(userId !== undefined){
            if(userId == ""){
                message.reply("You forgot an ID! `"+prefix+"buffclean (ID)`");
            }
            else{
                try{
                    message.client.shard.broadcastEval(`this.sets.peckCooldown.delete('${userId}');
                    this.sets.activeShield.delete('${userId}');`);

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

                    query(`UPDATE cooldowns SET peckTime = ${0}, mittenShieldTime = ${0}, ironShieldTime = ${0}, goldShieldTime = ${0} WHERE userId = ${userId}`);
                    message.reply("Shields/debuffs cleaned for user.");
                }
                catch(err){
                    message.reply("Error clearing cooldowns: ```"+err+"```")
                }
            }
        }
        else{
            message.reply("This command clears user of all buffs/debuffs including peck_seed effects, and shields. `"+prefix+"buffclean <ID>`");
        }
    },
}