const { query } = require('../mysql.js');
const Discord   = require('discord.js');

module.exports = {
    name: 'serversettings',
    aliases: ['guildsettings'],
    description: 'View the servers settings and how to change them.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    guildModsOnly: false,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const guildRow  = (await query(`SELECT * FROM guildInfo WHERE guildId ="${message.guild.id}"`))[0] || {};
        const prefixRow = (await query(`SELECT * FROM guildPrefix WHERE guildId ="${message.guild.id}"`))[0];

        var killfeedStr = message.guild.channels.get(guildRow.killChan) ? '(Disable with `togglekillfeed`)' : '(Set with `togglekillfeed`)';
        var lvlChanStr = message.guild.channels.get(guildRow.levelChan) ? '(Disable with `togglelevelchannel`)' : '(Set with `togglelevelchannel`)';
        var airdropChan = message.guild.channels.get(guildRow.dropChan) ? '(Disable with `disabledropchannel`)' : '(Set with `setdropchannel`)';
        
        const settings = new Discord.RichEmbed()
        .setTitle('Settings for: ' + message.guild.name)
        .setThumbnail(message.guild.iconURL)
        .setDescription('Changing these settings requires that you have the `Manage Server` permission.')
        .addField('Prefix (Change with `setprefix`):', prefixRow ? prefixRow.prefix : 't-')
        .addField(`Killfeed Channel ${killfeedStr}:`, message.guild.channels.get(guildRow.killChan) ? message.guild.channels.get(guildRow.killChan) : 'None set', true)
        .addField(`Level-up Channel ${lvlChanStr}:`, message.guild.channels.get(guildRow.levelChan) ? message.guild.channels.get(guildRow.levelChan) : 'None set', true)
        .addField('Attack Mode (Change with `togglerandomattacks`):', guildRow.randomOnly ? 'Random only' : 'Selectable', true)
        .addField(`Airdrop Channel ${airdropChan}:`, message.guild.channels.get(guildRow.dropChan) ? message.guild.channels.get(guildRow.dropChan) : 'None set', true)

        message.reply(settings);
    },
}