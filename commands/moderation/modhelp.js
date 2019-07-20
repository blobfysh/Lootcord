const Discord = require('discord.js');

module.exports = {
    name: 'modhelp',
    aliases: [''],
    description: 'Sends help message for mods.',
    hasArgs: false,
    worksInDM: true,
    requiresAcc: false,
    guildModsOnly: false,
    modOnly: true,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        const modCommands = [
            "`" + prefix + "message <id> <message>` - Messages a user. Allows attachments such as images, mp3, mp4.",
            "`" + prefix + "warn <id> <message>` - Warns a user, similar to messaging but warns user for a ban.",
            "`" + prefix + "ban <id> <reason>` - Bans user and messages them with the reason they've been banned.",
            "`" + prefix + "unban <id>` - Unbans user and sends them message stating they've been unbanned.",
            "`" + prefix + "botstatus <activity> <status>` - Sets bot status.",
            "`" + prefix + "getbans` - Displays list of all banned users.",
            "`" + prefix + "getbaninfo <id>` - Shows reason and date for banned user.",
            "`" + prefix + "invwipe <id> <reason>` - Wipes a users data and sends them message with reason. Will also log the users inventory and unique code prior to wipe in <#500467081226223646>.",
            "`" + prefix + "getinv <id>` - Displays a users inventory along with their unique inventory code.",
            "`" + prefix + "restoreinv <unique inventory code>` - Restores a users inventory using a code from either the getinv or invwipe commands.",
            "`" + prefix + "shardsinfo` - Show information about all running shards."
        ];
        let filteredList = [];
        for(var i = 0; i < modCommands.length; i++){
            filteredList.push((i + 1) + ". " + modCommands[i] + "\n");
        }
        const helpInfo = new Discord.RichEmbed()
        .setTitle(`🔻__**Moderator Commands**__🔻`)
        .setDescription(filteredList)
        .setFooter("Most mod commands can ONLY be used in the Lootcord Workshop server moderator channel. "+prefix+"botstatus and getbans are the only commands that can be used in DMs")
        .setColor(13632027)
        message.channel.send(helpInfo);
    },
}