
module.exports = {
    name: 'help',
    aliases: [''],
    description: 'Show all clan commands.',
    long: 'Shows all clan commands.',
    args: {},
    examples: ["clan help"],
    requiresClan: false,
    minimumRank: 0,
    
    async execute(app, message, args){
        let commands = [];
        
        app.clanCommands.forEach(cmd => {
            commands.push('▫`' + cmd.name + '` - ' + cmd.description + (cmd.levelReq ? ` (Lvl Required: ${cmd.levelReq}+)` : ''));
        });
        commands.sort();

        const helpEmbed = new app.Embed()
        .setTitle('Clan help')
        .setColor(13215302)
        .setDescription('Check out this page for specific help: [Clans Wiki](https://github.com/blobfysh/Lootcord/wiki/Clans)')
        .addField('Information', commands.join('\n'))
        .setFooter('Syntax: ' + message.prefix + 'clan <command>')

        message.channel.createMessage(helpEmbed);
    },
}