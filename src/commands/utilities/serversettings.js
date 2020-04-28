
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
        const guildRow = await app.common.getGuildInfo(message.guild.id);
        const prefixRow = (await app.query(`SELECT * FROM guildPrefix WHERE guildId ="${message.guild.id}"`))[0];

        let killfeedStr = message.guild.channels.get(guildRow.killChan) ? '(Disable with `togglekillfeed`)' : '(Set with `togglekillfeed`)';
        let lvlChanStr = message.guild.channels.get(guildRow.levelChan) ? '(Disable with `togglelevelchannel`)' : '(Set with `togglelevelchannel`)';
        let airdropChan = message.guild.channels.get(guildRow.dropChan) ? '(Disable with `disabledropchannel`)' : '(Set with `setdropchannel`)';
        
        const settings = new app.Embed()
        .setTitle('Settings for: ' + message.guild.name)
        .setDescription('Changing these settings requires that you have the `Manage Server` permission.')
        .addField('Prefix\n(Change with `setprefix`)', prefixRow ? prefixRow.prefix : app.config.prefix)
        .addField(`Killfeed Channel\n${killfeedStr}`, message.guild.channels.get(guildRow.killChan) ? message.guild.channels.get(guildRow.killChan).mention : 'None set')
        .addField(`Level-up Channel\n${lvlChanStr}`, message.guild.channels.get(guildRow.levelChan) ? message.guild.channels.get(guildRow.levelChan).mention : 'None set')
        .addField('Attack Mode\n(Change with `togglerandomattacks`)', guildRow.randomOnly ? 'Random only' : 'Selectable')
        .addField(`Airdrop Channel\n${airdropChan}`, message.guild.channels.get(guildRow.dropChan) ? message.guild.channels.get(guildRow.dropChan).mention : 'None set')

        if(message.guild.iconURL) settings.setThumbnail(message.guild.iconURL);
        message.channel.createMessage(settings);
    },
}