const tips = require('../../resources/json/tips');

module.exports = {
    name: 'help',
    aliases: [''],
    description: '',
    requiresAcc: false,
    
    execute(app, message){
        let categories = {};
        
        app.commands.forEach(cmd => {
            if(categories[cmd.category]){
                categories[cmd.category].push(cmd.name);
            }
            else{
                categories[cmd.category] = [cmd.name];
            }
        });

        const embed = new app.Embed()
        .setTitle('t!play - Creates an account!')
        .setFooter('To see more about a command, use help <command> | Need more help? Message me!')
        .setColor(13215302)

        Object.keys(categories).forEach(category => {
            if(category == 'items') embed.addField('⚔ Item Usage', categories[category].map(cmd => '`' + cmd + '`').join(', '));
            else if(category == 'games') embed.addField('🎲 Games and Rewards', categories[category].map(cmd => '`' + cmd + '`').join(', '));
            else if(category == 'info') embed.addField('📋 Info', categories[category].map(cmd => '`' + cmd + '`').join(', '));
            else if(category == 'blackmarket') embed.addField('💰 Black Market', categories[category].map(cmd => '`' + cmd + '`').join(', '));
            else if(category == 'utilities') embed.addField('⚙ Utility', categories[category].map(cmd => '`' + cmd + '`').join(', '));
            else if(category == 'other') embed.addField('📈 Other', categories[category].map(cmd => '`' + cmd + '`').join(', '));
        });
        
        embed.addField('⚔️ Clans', 'Use `clan help` to see clan commands. Check this [link](https://github.com/blobfysh/Lootcord/wiki/Clans) out for more details on how clans work.')
        embed.addField('💡 Random Tip', tips[Math.floor(Math.random() * tips.length)])

        message.channel.createMessage(embed);
    },
}