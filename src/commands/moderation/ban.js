const { RULES } = require('../../resources/constants');

module.exports = {
    name: 'ban',
    aliases: [''],
    description: 'Bans a user.',
    long: 'Bans a user and sends them a message containing the reason. Banning will make the bot ignore every message from user. You must provide one of the following rules:\n\n**1** - Bug exploitation\n**2** - Alt accounts\n**3** - Leaving servers to avoid deactivate cooldown\n**4** - Kill-farming\n**5** - Handouts\n**6** - False reports\n**7** - Farming airdrops',
    args: {
        "User ID": "ID of user to ban.",
        "rule": "Rule broken."
    },
    examples: ["ban 168958344361541633 5"],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let userID = message.args[0];
        let rule = message.args[1];

        if(message.channel.id !== app.config.modChannel){
            return message.reply('❌ You must be in the moderator channel to use this command.');
        }
        else if(!userID){
            return message.reply('❌ You forgot to include a user ID.')
        }
        else if(!rule || !Object.keys(RULES).includes(rule)){
            return message.reply('❌ You need to specify what rule was broken:\n\n**1** - Bug exploitation\n**2** - Alt accounts\n**3** - Leaving servers to avoid deactivate cooldown\n**4** - Kill-farming\n**5** - Handouts\n**6** - False reports\n**7** - Farming airdrops');
        }
        else if(await app.cd.getCD(userID, 'banned')){
            return message.reply('❌ User is already banned.')
        }
        else if(await app.cd.getCD(userID, 'mod')){
            return message.reply("Hey stop trying to ban a moderator!!! >:(");
        }

        const warnings = (await app.query(`SELECT * FROM warnings WHERE userId = '${userID}'`));
        const user = await app.common.fetchUser(userID, { cacheIPC: false });

        const botMessage = await message.reply(`**${user.username}#${user.discriminator}** currently has **${warnings.length}** warnings on record. Continue ban for **${RULES[rule].desc}**?`);

        try{
            const confirmed = await app.react.getConfirmation(message.author.id, botMessage);

            if(confirmed){
                const banMsg = new app.Embed()
                .setTitle(`You have been banned by ${(message.author.username + '#' + message.author.discriminator)}`)
                .setDescription("You have been banned for breaking rules. If you wish to challenge this ban, you can appeal at our website.```\n" + RULES[rule].warn_message + "```")
                .setColor(16734296)
                .setFooter("https://lootcord.com/rules | Only moderators can send you messages.")

                try{
                    await app.query("INSERT INTO banned (userId, reason, date) VALUES (?, ?, ?)", [userID, RULES[rule].warn_message, (new Date()).getTime()]);
                    await app.cache.setNoExpire(`banned|${userID}`, 'Banned perma');

                    await app.common.messageUser(userID, banMsg, { throwErr: true });
                    botMessage.edit(`Successfully banned **${user.username}#${user.discriminator}**.`);
                }
                catch(err){
                    botMessage.edit('Unable to send message to user, they were still banned. ```js\n' + err + '```');
                }
            }
            else{
                botMessage.delete();
            }
        }
        catch(err){
            botMessage.edit('❌ Timed out.');
        }
    },
}