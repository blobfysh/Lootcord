const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const config = require('../../json/_config.json');

module.exports = {
    name: 'warn',
    aliases: [''],
    description: 'Warns a user.',
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
        var messageIn = args.slice(1).join(" ");
                        
        if(userNameID !== undefined){
            if(messageIn == ""){
                message.reply("You forgot to put the reason for warning this user! `"+prefix+"warn (ID) (REASON)`");
            }
            else if(message.client.sets.moddedUsers.has(userNameID)){
                message.reply("Hey stop trying to warn a moderator!!! >:(");
            }
            else{
                const botMessage = await message.reply('This user currently has ' + (await query(`SELECT * FROM warnings WHERE userId = '${userNameID}'`)).length + ' warnings on record. Continue warning?');
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

                        const banMsg = new Discord.RichEmbed()
                        .setAuthor('❗You have been warned❗')
                        .addField('**' + message.author.tag + '** issued a warning!', 'Any more could result in a ban or inventory wipe!')
                        .addField('Reason', messageIn)
                        .setColor(13064193)

                        try{
                            const warnUser = await message.client.fetchUser(userNameID);

                            query("INSERT INTO warnings (userId, modId, reason, date) VALUES (?, ?, ?, ?)", [userNameID, message.author.id, messageIn, (new Date()).getTime()]);

                            await warnUser.send(banMsg);
                            message.reply("User ("+ warnUser.tag +") successfully warned");
                        }
                        catch(err){
                            message.reply("Something went wrong:```" + err + "```");
                        }
                    }
                    else{
                        botMessage.delete();
                    }
                }
                catch(err){
                    botMessage.edit("You didn't react in time!");
                }
            }
        }
        else{
            message.reply("Please use the user ID followed by your reason for warning. `"+prefix+"warn (ID) (REASON)`");
        }
    },
}