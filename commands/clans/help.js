const Discord = require('discord.js');
//const { query } = require('../../mysql.js');
//const clans = require('../../methods/clan_methods.js');
//const methods = require('../../methods/methods.js');
//const itemdata = require('../json/completeItemList.json');

module.exports = {
    name: 'help',
    aliases: [''],
    description: 'Show all clan commands.',
    minimumRank: 0,
    requiresClan: false,
    
    async execute(message, args, lang, prefix){
        var commands = [];
        var count = 0;
        
        message.client.clanCommands.forEach(cmd => {
            commands.push('▫`' + cmd.name + '` - ' + cmd.description + (cmd.levelReq ? ` (Lvl Required: ${cmd.levelReq}+)` : ''));
        });
        commands.sort();

        const helpEmbed = new Discord.RichEmbed()
        .setTitle('Clan help')
        .setColor(13215302)
        .setDescription('Check out this page for specific help: [Clans Wiki](https://github.com/blobfysh/Lootcord/wiki/Clans)')
        .addField('Information', commands.join('\n'))
        .setFooter('Syntax: ' + prefix + 'clan <command>')

        message.channel.send(helpEmbed);
    },
}