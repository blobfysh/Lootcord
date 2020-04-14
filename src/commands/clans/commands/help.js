
module.exports = {
    name: 'help',
    aliases: [''],
    description: 'Show all clan commands.',
    long: 'Shows all clan commands.',
    args: {"command": "Command to lookup info for."},
    examples: [],
    requiresClan: false,
    minimumRank: 0,
    
    async execute(app, message, args){

        if(args[0]){
            let cmd = app.clanCommands.get(args[0]) || app.clanCommands.find(cmd => cmd.aliases && cmd.aliases.includes(args[0]));

            if(!cmd) return message.reply("❌ That isn't a clan command, use `clan help` to see available clan commands.");

            const embed = new app.Embed()
            .setTitle(`🔎 clan ${cmd.name}`)
            .setDescription(cmd.long)
            if(cmd.requiresClan) embed.addField('Required Rank', getRank(app, cmd))
            if(cmd.examples.length && cmd.examples[0].length) embed.addField("Examples", cmd.examples.map(ex => '`' + message.prefix + ex + '`').join(', '))
            if(cmd.aliases.length && cmd.aliases[0].length) embed.addField("Aliases", cmd.aliases.map(alias => '`' + alias + '`').join(', '))
            embed.addField("Usage", '`' + getUsage(message.prefix, cmd) + '`')
            if(Object.keys(cmd.args).length) embed.addField("Options", getOptions(cmd))
            embed.setColor(13215302)

            return message.channel.createMessage(embed);
        }


        let commands = [];
        
        app.clanCommands.forEach(cmd => {
            commands.push('▫`' + cmd.name + '` - ' + cmd.description + (cmd.levelReq ? ` (Lvl Required: ${cmd.levelReq}+)` : ''));
        });
        commands.sort();

        const helpEmbed = new app.Embed()
        .setTitle('Clan help')
        .setColor(13215302)
        .setDescription('Check out this page for specific help: [Clans Wiki](https://github.com/blobfysh/Lootcord/wiki/Clans)\nTo use a clan command: `clan <command>`')
        .addField('Information', commands.join('\n'))
        .setFooter('To see more about a clan command, use t-clan help <command>')

        message.channel.createMessage(helpEmbed);
    },
}

function getRank(app, cmd){
    return '`' + app.clan_ranks[cmd.minimumRank].title + '`+'
}

function getUsage(prefix, cmd){
    let finalStr = `${prefix}clan ${cmd.name}`;

    for(let arg of Object.keys(cmd.args)){
        finalStr += ` <${arg}>`;
    }

    return finalStr;
}

function getOptions(cmd){
    let finalStr = '';

    for(let arg of Object.keys(cmd.args)){
        finalStr += `\`${arg}\` - ${cmd.args[arg]}\n`
    }

    return finalStr;
}