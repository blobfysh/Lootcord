
module.exports = {
    name: 'tradeban',
    aliases: [''],
    description: 'Bans a user from trading.',
    long: 'Bans a user from being able to use the trade command as well as the black market, clan vaults, and Discoin conversions.',
    args: {
        "User ID": "ID of user to ban.",
        "reason": "Reason for ban."
    },
    examples: ["tradeban 168958344361541633 Warned 2+ times"],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let userID = message.args[0];
        let messageIn = message.args.slice(1).join(" ");

        if(message.channel.id !== app.config.modChannel){
            return message.reply('❌ You must be in the moderator channel to use this command.');
        }
        else if(!userID){
            return message.reply('❌ You forgot to include a user ID.')
        }
        else if(!messageIn){
            return message.reply('❌ You must include a reason for tradebanning this user. Specify what rule(s) were broken.');
        }
        else if(await app.cd.getCD(userID, 'mod')){
            return message.reply("Hey stop trying to ban a moderator!!! >:(");
        }

        const warnings = (await app.query(`SELECT * FROM warnings WHERE userId = '${userID}'`));
        const user = await app.common.fetchUser(userID, { cacheIPC: false });

        const botMessage = await message.reply(`**${user.username}#${user.discriminator}** currently has **${warnings.length}** warnings on record. Continue tradeban?`);

        try{
            const confirmed = await app.react.getConfirmation(message.author.id, botMessage);

            if(confirmed){
                const banMsg = new app.Embed()
                .setTitle(`You were banned from trading by ${(message.author.username + '#' + message.author.discriminator)}`)
                .setDescription("You have been banned from trading for breaking rules. If you wish to challenge this ban, you can appeal at our website.```\n" + messageIn + "```")
                .setColor(16734296)
                .setFooter("https://lootcord.com/rules | Only moderators can send you messages.")

                try{
                    await app.query("INSERT INTO tradebanned (userId, reason, date) VALUES (?, ?, ?)", [userID, messageIn, (new Date()).getTime()]);
                    await app.cache.setNoExpire(`tradeban|${userID}`, 'Banned perma');

                    await app.common.messageUser(userID, banMsg, { throwErr: true });
                    botMessage.edit(`Successfully banned **${user.username}#${user.discriminator}** from trading.`);
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