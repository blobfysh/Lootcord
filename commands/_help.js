const Discord = require('discord.js');
const methods = require('../methods/methods.js');

module.exports = {
    name: 'help',
    aliases: [''],
    description: 'Displays information about commands.',
    hasArgs: false,
    worksInDM: true,
    requiresAcc: false,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        let helpCommand = args[0];

        if(helpCommand !== undefined){
            return methods.commandhelp(message, helpCommand, prefix);
        }

        let otherCmds = ["`rules`","`cooldowns`","`delete`","`deactivate`","`server`","`update`","`health`",
        "`money`","`level`","`points`","`leaderboard`","`discord`","`upgrade`","`backpack`", "`invite`"];
        
        let utilities = ["`setprefix`", "`setstatus`", "`setkillfeed`", "`setlevelchannel`", "`disablekillfeed`", "`disablelevelchannel`"];
        
        otherCmds.sort();

        let itemsString = `${lang.help[1].replace('{0}', `🔸\`${prefix}use <item> [@user]\``)}
        🔸\`${prefix}inv [@user]\`
        ▫\`${prefix}trade <@user>\`
        ▫\`${prefix}item [item]\`
        ▫\`${prefix}shop\`
        ▫\`${prefix}buy <item> [amount]\`
        ▫\`${prefix}sell <item> [amount]\`
        ▫\`${prefix}sellall [rarity]\`
        ▫\`${prefix}craft <item>\`
        ▫\`${prefix}recycle <item>\`
        ▫\`${prefix}profile [@user]\`
        ▫\`${prefix}equip/unequip <item>\`
        `
        let gamesString = `▫\`${prefix}scramble <easy/hard>\`
        ▫\`${prefix}trivia\`
        ▫\`${prefix}hourly\`
        ▫\`${prefix}vote\`
        ▫\`${prefix}gamble <type> <amount>\`
        `

        const helpInfo = new Discord.RichEmbed()
        .setTitle(lang.help[0].replace('{0}', `\`${prefix}play\``))
        .addField("⚔ Items", itemsString, true)
        .addField("🎲 Games/Free stuff", gamesString, true)
        //.addField("🔰Stats", ,true)
        .addField("📈 Other", otherCmds.join(" "),true)
        .addField("⚙ Utility", utilities.join(" "),true)
        .setColor(13215302)
        .setFooter("To see more about a command, use "+prefix+"help <command> | Need more help? Message me!")
        
        message.channel.send(helpInfo);
    },
}