const Discord = require('discord.js');
const methods = require('../methods/methods.js');
const helpJSON = require('../json/_help_commands.json');
const tips = require('../json/tips');

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

        var itemCmds = [];
        var gameCmds = [];
        var infoCmds = [];
        var utilCmds = [];
        var bmCmds = [];
        var otherCmds = [];
        
        for(var i = 0; i < helpJSON.length; i++){
            if(!helpJSON[i].ignoreHelp){
                let isDisabled = '';
                let disabledEnd = '';
                if(message.client.sets.disabledCommands.has(helpJSON[i].command.toLowerCase())) isDisabled = '❌~~', disabledEnd = '~~';

                if(helpJSON[i].category == 'items') itemCmds.push(isDisabled + '`' + helpJSON[i].command.toLowerCase() + '`' + disabledEnd)
                else if(helpJSON[i].category == 'games') gameCmds.push(isDisabled + '`' + helpJSON[i].command.toLowerCase() + '`' + disabledEnd)
                else if(helpJSON[i].category == 'info') infoCmds.push(isDisabled + '`' + helpJSON[i].command.toLowerCase() + '`' + disabledEnd)
                else if(helpJSON[i].category == 'utility') utilCmds.push(isDisabled + '`' + helpJSON[i].command.toLowerCase() + '`' + disabledEnd)
                else if(helpJSON[i].category == 'other') otherCmds.push(isDisabled + '`' + helpJSON[i].command.toLowerCase() + '`' + disabledEnd)
                else if(helpJSON[i].category == 'blackmarket') bmCmds.push(isDisabled + '`' + helpJSON[i].command.toLowerCase() + '`' + disabledEnd)
            }
        }

        const helpInfo = new Discord.RichEmbed()
        .setTitle(lang.help[0].replace('{0}', `\`${prefix}play\``))
        .addField(lang.help[2], itemCmds.sort().join(', '))
        .addField(lang.help[3], gameCmds.sort().join(', '))
        .addField(lang.help[4], infoCmds.sort().join(', '))
        .addField('💰 Black Market', bmCmds.join(', '))
        .addField(lang.help[5], utilCmds.sort().join(', '))
        .addField(lang.help[6], otherCmds.sort().join(', '))
        .addField(lang.help[8], lang.help[9])
        .addField('💡 Random Tip', tips[Math.floor(Math.random() * tips.length)])
        .setColor(13215302)
        .setFooter(lang.help[7].replace('{0}', prefix))
        
        message.channel.send(helpInfo);
    },
}