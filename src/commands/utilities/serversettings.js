
module.exports = {
    name: 'serversettings',
    aliases: ['guildsettings'],
    description: "View the servers settings and how to change them.",
    long: "View current settings for the server and see how to change them.",
    args: {},
    examples: [],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        const guildRow = await app.common.getGuildInfo(message.channel.guild.id);
        const prefixRow = (await app.query(`SELECT * FROM guildPrefix WHERE guildId ="${message.channel.guild.id}"`))[0];

        let killfeedStr = message.channel.guild.channels.get(guildRow.killChan) ? '(Disable with `togglekillfeed`)' : '(Set with `togglekillfeed`)';
        let lvlChanStr = message.channel.guild.channels.get(guildRow.levelChan) ? '(Disable with `togglelevelchannel`)' : '(Set with `togglelevelchannel`)';
        let airdropChan = message.channel.guild.channels.get(guildRow.dropChan) ? '(Disable with `disabledropchannel`)' : '(Set with `setdropchannel`)';
        
        const settings = new app.Embed()
        .setTitle('Settings for: ' + message.channel.guild.name)
        .setDescription('Changing these settings requires that you have the `Manage Server` permission.')
        .addField('Prefix\n(Change with `setprefix`)', prefixRow ? prefixRow.prefix : app.config.prefix)
        .addField(`Killfeed Channel\n${killfeedStr}`, message.channel.guild.channels.get(guildRow.killChan) ? message.channel.guild.channels.get(guildRow.killChan).mention : 'None set')
        .addField(`Level-up Channel\n${lvlChanStr}`, message.channel.guild.channels.get(guildRow.levelChan) ? message.channel.guild.channels.get(guildRow.levelChan).mention : 'None set')
        .addField('Attack Mode\n(Change with `togglerandomattacks`)', guildRow.randomOnly ? 'Random only' : 'Selectable')
        .addField(`Airdrop Channel\n${airdropChan}`, message.channel.guild.channels.get(guildRow.dropChan) ? message.channel.guild.channels.get(guildRow.dropChan).mention : 'None set')

        if(message.channel.guild.iconURL) settings.setThumbnail(message.channel.guild.iconURL);
        message.channel.createMessage(settings);
    },
}