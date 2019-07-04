const Discord = require('discord.js');
const config = require('../../json/_config.json');
const clans = require('../../methods/clan_methods.js');
const { query } = require('../../mysql.js');

module.exports = {
    name: 'richestclans',
    aliases: [''],
    description: 'Shows information about shards.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    guildModsOnly: false,
    modOnly: true,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const topClans = await query(`SELECT * FROM clans  ORDER BY money DESC LIMIT 20`);
        var clanArr = [];

        for(var i = 0; i < topClans.length; i++){
            var clanMems = await clans.getMembers(topClans[i].clanId);

            clanArr.push('`' + topClans[i].name + '`(' + clanMems.count + ') - $' + topClans[i].money);
        }

        const clanEmb = new Discord.RichEmbed()
        .setTitle('Top Clans')
        .setDescription(clanArr.join('\n'))

        message.channel.send(clanEmb);
    },
}