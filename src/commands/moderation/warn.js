const rules = {
    "1": {
        "desc": "Bug exploitation",
        "message": "Exploiting bugs to gain an unfair advantage over other players is not allowed, bugs should be reported to the bug-reports channel in the official Lootcord server."
    },
    "2": {
        "desc": "Alt accounts",
        "message": "Alt abuse violates rule #2, please refrain from using alts to gain an unfair advantage over other players."
    },
    "3": {
        "desc": "Cooldown dodging",
        "message": "Cooldown dodging/leaving servers to avoid the deactivate cooldown is not allowed (rule #3)."
    },
    "4": {
        "desc": "Kill-farming",
        "message": "Killing another player and trading items back to avoid loss of items is against rule #4!"
    },
    "5": {
        "desc": "Handouts",
        "message": "Trading items/money of large value or giving handouts to other players is not allowed (rule #5), please don't give items/money to other players. Thank you."
    },
};

const ordinals = {
    "0": "first",
    "1": "second",
    "2": "third",
    "3": "fourth",
    "4": "fifth"
};

module.exports = {
    name: 'warn',
    aliases: [''],
    description: 'Warns a user.',
    long: 'Warns a user and sends them a message containing the reason. You must provide one of the following rules:\n\n**1** - Bug exploitation\n**2** - Alt accounts\n**3** - Leaving servers to avoid deactivate cooldown\n**4** - Kill-farming\n**5** - Handouts',
    args: {
        "User ID": "ID of user to warn.",
        "rule": "Rule broken."
    },
    examples: ["warn 168958344361541633 5"],
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
        else if(!rule || !Object.keys(rules).includes(rule)){
            return message.reply('❌ You need to specify what rule was broken:\n\n**1** - Bug exploitation\n**2** - Alt accounts\n**3** - Leaving servers to avoid deactivate cooldown\n**4** - Kill-farming\n**5** - Handouts');
        }
        else if(await app.cd.getCD(userID, 'mod')){
            return message.reply("Hey stop trying to warn a moderator!!! >:(");
        }

        const warnings = (await app.query(`SELECT * FROM warnings WHERE userId = '${userID}'`));
        const user = await app.common.fetchUser(userID, { cacheIPC: false });

        if(!user){
            return message.reply(`❌ A user with that ID does not exist!`);
        }
        else if(warnings.length >= 2){
            return message.reply(`❌ **${user.username}#${user.discriminator}** has already been warned **2**+ times. It is time to \`ban\`, \`tradeban\` or \`tempban\` this user.`)
        }

        const botMessage = await message.reply(`Warn **${user.username}#${user.discriminator}** for **${rules[rule].desc}**? This will be their **${ordinals[warnings.length]}** warning.`);

        try{
            const confirmed = await app.react.getConfirmation(message.author.id, botMessage);

            if(confirmed){
                const warnMsg = new app.Embed()
                .setTitle(`You have been warned by ${(message.author.username + '#' + message.author.discriminator)}`)
                .setDescription("You have been warned for breaking rules. Future offenses will result in a ban.```\n" + rules[rule].message + "```\n" + 
                (warnings.length === 0 ? "**It looks like this is your first warning, any more than 2 warnings will result in a ban.**" : "**This is your last warning, please don't break the rules again or you will be banned!**"))
                .setColor(16734296)
                .setFooter("https://lootcord.com/rules | Only moderators can send you messages.")

                try{
                    await app.query("INSERT INTO warnings (userId, modId, reason, date) VALUES (?, ?, ?, ?)", [userID, message.author.id, rules[rule].message, (new Date()).getTime()]);
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