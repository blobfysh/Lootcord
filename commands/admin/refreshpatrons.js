const Discord        = require('discord.js');
const patreonHandler = require('../../utils/patreonHandler.js');

module.exports = {
    name: 'refreshpatrons',
    aliases: [''],
    description: 'Manually refresh the list of patrons.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    guildModsOnly: false,
    modOnly: false,
    adminOnly: true,
    
    async execute(message, args, lang, prefix){
        try{
            const results = await patreonHandler.refreshPatrons(message.client.shard);

            const patronMsg = new Discord.RichEmbed()
            .setTitle('Refreshed patrons!')
            .setDescription(results.patronsAdded + ' patrons added to the database.\n' + results.patronsRemoved + ' patrons removed')
            .setColor(16345172)
            message.channel.send(patronMsg);
        }
        catch(err){
            message.reply("Error: ```" + err + "```")
        }
    },
}