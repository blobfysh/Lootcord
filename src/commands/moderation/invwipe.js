const shortid = require('shortid');

module.exports = {
    name: 'invwipe',
    aliases: [''],
    description: 'Wipes a users inventory.',
    long: 'Wipes a users inventory (specifically all items and money). Will generate a wipe ID that can be used to restore the player\'s inventory.\nNotifies user',
    args: {
        "User ID": "ID of user to wipe.",
        "reason": "Reason for wiping."
    },
    examples: ["invwipe 168958344361541633 cheating"],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    
    async execute(app, message){
        let userID = message.args[0];
        let banReason = message.args.slice(1).join(" ");

        if(message.channel.id !== app.config.modChannel){
            return message.reply('❌ You must be in the moderator channel to use this command.');
        }
        else if(!userID){
            return message.reply('❌ You forgot to include a user ID.')
        }

        const row = await app.player.getRow(userID);
        const user = await app.common.fetchUser(userID, { cacheIPC: false });

        if(!row){
            return message.reply('❌ User has no account.');
        }
        if(!banReason || banReason === ""){
            banReason = "No reason provided.";
        }

        const botMessage = await message.reply(`Wipe **${user.username}#${user.discriminator}**?`);

        try{
            const confirmed = await app.react.getConfirmation(message.author.id, botMessage);

            if(confirmed){
                let wipeId = shortid.generate();

                await app.query(`INSERT INTO wiped_data (wipeId, userId, item) SELECT ?, userId, item FROM user_items WHERE userId = ?`, [wipeId, userID]);
                
                await app.query(`DELETE FROM user_items WHERE userId = ?`, [userID]);
                await app.query(`UPDATE scores SET money = 100, scrap = 0 WHERE userId = ?`, [userID]);
        
                const invWipeMsg = new app.Embed()
                .setTitle("Inventory Wiped")
                .setDescription("Your inventory was wiped for breaking rules. Future offenses will result in a ban.```\n" + banReason + "```")
                .setColor(16734296)
                .setFooter("https://lootcord.com/rules | Only moderators can send you messages.")
                
                const logMsg = new app.Embed()
                .setTitle("Inventory Wiped")
                .setThumbnail(app.common.getAvatar(user))
                .addField('Moderator', '```\n' + (message.author.username + '#' + message.author.discriminator) + '```')
                .addField('User', '```\n' + (user.username + '#' + user.discriminator) + '\nID: ' + userID + '```')
                .addField('Wipe ID', '```\n' + wipeId + '```')
                .addField('Money Wiped', app.common.formatNumber(row.money))
                .setColor(11346517)
                .setTimestamp()
        
                try{
                    app.messager.messageLogs(logMsg);
                    await app.common.messageUser(userID, invWipeMsg, { throwErr: true });

                    botMessage.edit(`Successfully wiped **${user.username}#${user.discriminator}**'s items and money. (Wipe ID: \`${wipeId}\`)`);
                }
                catch(err){
                    botMessage.edit('Unable to send message to user, their inventory was still wiped however. ```js\n' + err + '```');
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