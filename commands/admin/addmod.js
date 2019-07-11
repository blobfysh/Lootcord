const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const general = require('../../methods/general');

module.exports = {
    name: 'addmod',
    aliases: ['modadd'],
    description: 'Make someone a moderator using their ID',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    guildModsOnly: false,
    modOnly: false,
    adminOnly: true,
    
    async execute(message, args, lang, prefix){
        let modderId = args[0];

        if(modderId !== undefined){
            const modMsg = new Discord.RichEmbed()
            .setAuthor(`😃Congratulations!!😃`)
            .setTitle("**" + message.author.tag + "** made you a moderator!")
            .setDescription("Use `t-modhelp` to see your fancy new commands!")
            .setFooter("You can use mod commands in the Lootcord Workshop moderator channel")
            .setColor(720640)

            if(modderId == ""){
                message.reply("You forgot an ID! `" + prefix + "modadd (ID)`");
            }
            else{
                try{
                    const userInfo = await general.getUserInfo(message, modderId);

                    message.client.shard.broadcastEval(`this.sets.moddedUsers.add('${modderId}')`);
                    query("INSERT INTO mods (userId) VALUES (?)", [modderId]);
                    
                    message.reply("User has been added to the moderator list!");
                    await userInfo.send(modMsg);
                }
                catch(err){
                    message.reply("Error messaging user:```" + err + "```")
                }
            }
        }
        else{
            message.reply("ERROR. `" + prefix + "modadd (ID)`");
        }
    },
}