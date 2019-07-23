const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const methods = require('../../methods/methods.js');
const itemdata = require('../../json/completeItemList.json');

module.exports = {
    name: 'cdclear',
    aliases: [''],
    description: 'Clears a user of all cooldowns using their ID.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    modOnly: false,
    adminOnly: true,
    
    execute(message, args, lang, prefix){
        let userId = args[0];

        if(userId !== undefined){
            if(userId == ""){
                message.reply("You forgot an ID! `"+prefix+"cdclear (ID)`");
            }
            else{
                try{
                    message.client.shard.broadcastEval(`this.sets.voteCooldown.delete('${userId}');
                    this.sets.scrambleCooldown.delete('${userId}');
                    this.sets.triviaUserCooldown.delete('${userId}');
                    this.sets.hourlyCooldown.delete('${userId}');
                    this.sets.gambleCooldown.delete('${userId}');
                    this.sets.healCooldown.delete('${userId}');
                    this.sets.deactivateCooldown.delete('${userId}');
                    this.sets.activateCooldown.delete('${userId}');
                    this.sets.deleteCooldown.delete('${userId}');
                    this.sets.weapCooldown.delete('${userId}');
                    this.sets.eventCooldown.delete('${userId}');`);
                    
                    query(`UPDATE cooldowns SET voteTime = ${0}, scrambleTime = ${0}, triviaTime = ${0}, hourlyTime = ${0}, gambleTime = ${0}, 
                    healTime = ${0}, deactivateTime = ${0}, activateTime = ${0}, attackTime = ${0}, _15mCD = ${0}, _30mCD = ${0}, _45mCD = ${0},
                    _60mCD = ${0}, _80mCD = ${0}, _100mCD = ${0}, _120mCD = ${0}, airdropTime = ${0} WHERE userId = ${userId}`);
                    message.reply("Cooldowns cleared for user.");
                }
                catch(err){
                    message.reply("Error clearing cooldowns: ```"+err+"```")
                }
            }
        }
        else{
            message.reply("This command wipes all **command** cooldowns for a user. `"+prefix+"cdclear <ID>`");
        }
    },
}