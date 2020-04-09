
module.exports = {
    name: 'modhelp',
    aliases: [''],
    description: 'Shows moderation commands.',
    long: 'Shows moderation commands.',
    args: {
        "command": "Command to lookup info for."
    },
    examples: [],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        if(message.args[0]){
            let command = message.args[0].toLowerCase();
            let cmd = app.commands.find(cmd => cmd.name === command && cmd.category === 'moderation') || app.commands.find(cmd => cmd.aliases && cmd.aliases.includes(command) && cmd.category === 'moderation');

            if(!cmd) return message.reply("❌ I don't recognize that moderator command.");

            const embed = new app.Embed()
            .setTitle(`🔎 ${cmd.name}`)
            .setDescription(cmd.long)

            if(cmd.examples.length && cmd.examples[0].length) embed.addField("Examples", cmd.examples.map(ex => '`' + message.prefix + ex + '`').join(', '))
            if(cmd.aliases.length && cmd.aliases[0].length) embed.addField("Aliases", cmd.aliases.map(alias => '`' + alias + '`').join(', '))
            embed.addField("Usage", '`' + getUsage(message.prefix, cmd) + '`')
            if(Object.keys(cmd.args).length) embed.addField("Options", getOptions(cmd))
            embed.setColor('#ff7272')

            return message.channel.createMessage(embed);
        }

        let commands = app.commands.filter(cmd => cmd.category === 'moderation');

        const embed = new app.Embed()
        .setAuthor('Moderation Commands', message.author.avatarURL)
        .setDescription('Most commands require you are in the moderator channel. `getstats`, `getprofile`, `getinv`, and `shardinfo` work anywhere.\n\n' + commands.map(cmd => '`' + cmd.name + '`').join(' '))
        .setFooter(`To see more about a command, use ${message.prefix}modhelp <command>`)
        .setColor('#ff7272')

        message.channel.createMessage(embed);
    },
}

function getUsage(prefix, cmd){
    let finalStr = `${prefix}${cmd.name}`;

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