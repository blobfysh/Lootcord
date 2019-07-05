const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const config = require('../../json/_config.json');

module.exports = {
    name: 'ban',
    aliases: [''],
    description: 'Bans a user from using the bot.',
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

        var userNameID = args[0];
        
        var banReason = args.slice(1).join(" ");
                        
        if(userNameID !== undefined){
            if(banReason == ""){
                message.reply("You forgot to put the reason for banning this user! `"+prefix+"ban (ID) (REASON)`");
            }
            else if(message.client.sets.moddedUsers.has(userNameID)){
                message.reply("Hey stop trying to ban a moderator!!! >:(");
            }
            else{
                const banMsg = new Discord.RichEmbed()
                .setAuthor(`❗Your account has been banned❗`)
                .setTitle("**" + message.author.tag + "** banned your account for the following reason:")
                .setDescription(banReason)
                .setColor(13632027)
                .addBlankField()
                .setFooter("Appeal: https://lootcord.com")

                try{
                    const bannedUser = await message.client.fetchUser(userNameID);
                    
                    query("INSERT INTO banned (userId, reason, date) VALUES (?, ?, ?)", [userNameID, banReason, (new Date()).getTime()]);

                    message.client.shard.broadcastEval(`this.sets.bannedUsers.add('${bannedUser.id}')`);
                    message.reply("User ("+ bannedUser.tag +") successfully banned.");

                    await bannedUser.send(banMsg);
                }
                catch(err){
                    message.reply("```" + err + "```");
                }
            }
        }
        else{
            message.reply("Please use the user ID followed by your reason for banning. `"+prefix+"ban (ID) (REASON)`");
        }
    },
}