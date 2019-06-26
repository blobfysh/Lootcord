const Discord = require('discord.js');
const { query } = require('../mysql.js');
//const methods = require('../methods/methods.js');
//const itemdata = require('../json/completeItemList.json');

module.exports = {
    name: 'clan',
    aliases: ['clans'],
    description: 'The base command for everything to do with clans!',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const scoreRow = (await query(`SELECT * FROM scores WHERE userId = ${message.author.id}`))[0];
        var commandName
        if(args.length > 0){
            commandName = args[0].toLowerCase();
        }
        const command = message.client.clanCommands.get(commandName) || message.client.clanCommands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

        if(!command){
            return message.client.clanCommands.get('info').execute(message, args, lang, prefix);
        }
        else if(scoreRow.clanId == 0 && command.requiresClan){
            return message.reply('You are not a member of any clan. 2');
        }
        else if(scoreRow.clanRank < command.minimumRank){
            return message.reply('Your clan rank is not high enough to use this command! Your rank: `' + lang.clans.clan_ranks[scoreRow.clanRank].title + '` Required: `' + lang.clans.clan_ranks[command.minimumRank].title + '`+');
        }
        try{
            command.execute(message, args.slice(1), lang, prefix);
        }
        catch(err){
            console.log(err);
        }
    },
}