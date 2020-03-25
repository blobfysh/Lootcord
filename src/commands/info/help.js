const tips = require('../../resources/json/tips');

module.exports = {
    name: 'help',
    aliases: [''],
    description: 'helpception',
    long: 'helpception',
    args: {
        "command": "Command to lookup info for."
    },
    examples: ["help inv"],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        if(message.args[0]){
            let cmd = app.commands.get(message.args[0]) || app.commands.find(cmd => cmd.aliases && cmd.aliases.includes(message.args[0]));

            if(!cmd) return message.reply("❌ That command doesn't exist!");

            // disable command lookup of admin/moderator commands
            if(cmd.category == 'admin'  && !app.sets.adminUsers.has(message.author.id)) return message.reply("❌ That command doesn't exist!");

            if(cmd.category == 'moderation' && ! (await app.cd.getCD(message.author.id, 'mod') || app.sets.adminUsers.has(message.author.id))) return message.reply("❌ That command doesn't exist!");

            const embed = new app.Embed()
            .setTitle(`🔎 ${cmd.name}`)
            .setDescription(cmd.long)

            if(cmd.examples.length && cmd.examples[0].length) embed.addField("Examples", cmd.examples.map(ex => '`' + message.prefix + ex + '`').join(', '))
            if(cmd.aliases.length && cmd.aliases[0].length) embed.addField("Aliases", cmd.aliases.map(alias => '`' + alias + '`').join(', '))
            embed.addField("Usage", '`' + getUsage(message.prefix, cmd) + '`')
            if(Object.keys(cmd.args).length) embed.addField("Options", getOptions(cmd))
            embed.setColor(13215302)

            return message.channel.createMessage(embed);
        }

        let categories = {};
        
        app.commands.forEach(cmd => {
            if(cmd.ignoreHelp) return;

            if(categories[cmd.category]){
                categories[cmd.category].push(cmd.name);
            }
            else{
                categories[cmd.category] = [cmd.name];
            }
        });

        const embed = new app.Embed()
        .setTitle(message.prefix + 'play - Creates an account!')
        .setFooter(`To see more about a command, use ${message.prefix}help <command>`)
        .setColor(13215302)

        Object.keys(categories).forEach(category => {
            if(category == 'items') embed.addField('⚔ Item Usage', categories[category].map(cmd => '`' + cmd + '`').join(', '));
            else if(category == 'games') embed.addField('🎲 Games and Rewards', categories[category].map(cmd => '`' + cmd + '`').join(', '));
            else if(category == 'info') embed.addField('📋 Info', categories[category].map(cmd => '`' + cmd + '`').join(', '));
            else if(category == 'blackmarket') embed.addField('💰 Black Market', categories[category].map(cmd => '`' + cmd + '`').join(', '));
            else if(category == 'other') embed.addField('📈 Other', categories[category].map(cmd => '`' + cmd + '`').join(', '));
            else if(category == 'utilities') embed.addField('⚙ Utility', categories[category].map(cmd => '`' + cmd + '`').join(', '));
        });
        
        embed.addField('⚔️ Clans', 'Use `clan help` to see clan commands. Check this [link](https://github.com/blobfysh/Lootcord/wiki/Clans) out for more details on how clans work.')
        embed.addField('💡 Random Tip', tips[Math.floor(Math.random() * tips.length)])

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