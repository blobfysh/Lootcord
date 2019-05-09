const Discord = require('discord.js');
const { query } = require('../../mysql.js');

module.exports = {
    name: 'unmod',
    aliases: ['modremove'],
    description: 'Take away moderator rights from a user.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    guildModsOnly: false,
    modOnly: false,
    adminOnly: true,
    
    async execute(message, args, lang, prefix){
        let modderId = args[0];
                          
        if(modderId !== undefined){
            
            if(modderId == ""){
                message.reply("You forgot an ID! `"+prefix+"unmod (ID)`");
            }
            else{
                const demodMsg = new Discord.RichEmbed()
                .setAuthor(`❗You have been demodded❗`)
                .setTitle("**An admin unmodded you!**")
                .setColor(13064193)
                try{
                    const userInfo = await message.client.fetchUser(modderId);

                    message.client.shard.broadcastEval(`this.sets.moddedUsers.delete('${modderId}')`);
                    query(`DELETE FROM mods WHERE userId ="${modderId}"`);
                    userInfo.send(demodMsg);
                    message.reply("User has been removed from the moderator list!");
                }
                catch(err){
                    message.reply("Something went wrong. Make sure you input the correct info.")
                }
            }
        }
        else{
            message.reply("ERROR. `"+prefix+"unmod (ID)`");
        }
    },
}