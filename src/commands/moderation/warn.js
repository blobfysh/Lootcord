
module.exports = {
    name: 'warn',
    aliases: [''],
    description: 'Warns a user.',
    long: 'Warns a user and sends them a message containing the reason.',
    args: {
        "User ID": "ID of user to warn.",
        "reason": "Reason for warning."
    },
    examples: ["warn 168958344361541633 cheating"],
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
            return message.reply('❌ You must include a reason for warning this user. Specify what rule(s) were broken.');
        }
        else if(await app.cd.getCD(userID, 'mod')){
            return message.reply("Hey stop trying to warn a moderator!!! >:(");
        }

        const warnings = (await app.query(`SELECT * FROM warnings WHERE userId = '${userID}'`));
        const user = await app.common.fetchUser(userID, { cacheIPC: false });

        const botMessage = await message.reply(`**${user.username}#${user.discriminator}** currently has **${warnings.length}** warnings on record. Continue warning?`);

        try{
            const confirmed = await app.react.getConfirmation(message.author.id, botMessage);

            if(confirmed){
                const warnMsg = new app.Embed()
                .setTitle(`You have been warned by ${(message.author.username + '#' + message.author.discriminator)}`)
                .setDescription("You have been warned for breaking rules. Future offenses will result in a ban.```\n" + messageIn + "```")
                .setColor(16734296)
                .setFooter("https://lootcord.com/rules | Only moderators can send you messages.")

                try{
                    await app.query("INSERT INTO warnings (userId, modId, reason, date) VALUES (?, ?, ?, ?)", [userID, message.author.id, messageIn, (new Date()).getTime()]);
                    await app.common.messageUser(userID, warnMsg, { throwErr: true });
                    botMessage.edit(`Successfully warned **${user.username}#${user.discriminator}**.`);
                }
                catch(err){
                    botMessage.edit('Unable to send message to user, a warning was still saved. ```js\n' + err + '```');
                }
            }
            else{
                botMessage.delete();
            }
        }
        catch(err){
            console.log(err);
            botMessage.edit('❌ Timed out.');
        }
    },
}