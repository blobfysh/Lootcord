
module.exports = {
    name: 'getstats',
    aliases: [''],
    description: "Shows statistics about a user.",
    long: "Shows statistics about a user.",
    args: {
        "User ID": "ID of user to check."
    },
    examples: ["getstats 168958344361541633"],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let userID = message.args[0];

        try{
            const row = await app.player.getRow(userID);

            if(!row){
                return message.reply('❌ User has no account.');
            }

            const userInfo   = await app.common.fetchUser(userID, { cacheIPC: false });
            const activeRows = await app.query(`SELECT * FROM userGuilds WHERE userId = '${userID}'`)
            const warnings = (await app.query(`SELECT * FROM warnings WHERE userId = '${userID}'`));
            const banned = await app.cd.getCD(userID, 'banned');
            const tradebanned = await app.cd.getCD(userID, 'tradeban');

            const statEmbed = new app.Embed()
            .setColor(13215302)
            .setAuthor(`${userInfo.username}#${userInfo.discriminator}`)
            .setThumbnail(app.common.getAvatar(userInfo))
            .addField('Account Created', codeWrap(new Date(row.createdAt).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/New_York'}) + '\n' + new Date(row.createdAt).toLocaleTimeString('en-US', {timeZone: 'America/New_York'}) + ' (EST)', 'fix'), true)
            .addField('Last Active', codeWrap(new Date(row.lastActive).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/New_York'}) + '\n' + new Date(row.lastActive).toLocaleTimeString('en-US', {timeZone: 'America/New_York'}) + ' (EST)', 'fix'), true)
            .addField('Activated in ' + activeRows.length + ' servers', codeWrap(activeRows.length > 0 ? activeRows.map(g => g.guildId).join('\n') : 'None', 'js'))
            .addField('Times Warned', codeWrap(warnings.length, 'js'))

            if(banned){
                const bannedRow = (await app.query(`SELECT * FROM banned WHERE userId =${userID}`))[0];

                statEmbed.addField('Banned?', codeWrap(`Yes - Length: ${banned}\n\nDate Banned:\n${app.common.getShortDate(bannedRow.date)}\n\nReason:\n${bannedRow.reason}`, 'cs'))
            }
            else{
                statEmbed.addField('Banned?', codeWrap('No', 'cs'))
            }
            
            if(tradebanned){
                const bannedRow = (await app.query(`SELECT * FROM tradebanned WHERE userId =${userID}`))[0];
                
                statEmbed.addField('Trade banned?', codeWrap(`Yes - Length: ${tradebanned}\n\nDate Banned:\n${app.common.getShortDate(bannedRow.date)}\n\nReason:\n${bannedRow.reason}`, 'cs'))
            }
            else{
                statEmbed.addField('Trade banned?', codeWrap(tradebanned || 'No', 'cs'));
            }

            message.channel.createMessage(statEmbed);
        }
        catch(err){
            message.reply('Error:```' + err + '```');
        }
    },
}

function codeWrap(input, code){
    return '```' + code + '\n' + input + '```';
}