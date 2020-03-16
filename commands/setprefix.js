const { query } = require('../mysql.js');

module.exports = {
    name: 'setprefix',
    aliases: ['prefix'],
    description: 'Changes the prefix for the server.',
    hasArgs: true,
    worksInDM: false,
    requiresAcc: true,
    guildModsOnly: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        let prefixString = args[0];

        if(prefixString == undefined || prefixString == "" || prefixString.length > 5){
            return message.reply(lang.setprefix[0].replace('{0}', prefix))
        }
        else{
            query(`SELECT * FROM guildPrefix WHERE guildId ="${message.guild.id}"`).then(prefixRow => {
                if(prefixRow.length){
                    query(`DELETE FROM guildPrefix WHERE guildId ="${message.guild.id}"`);
                }

                prefixString = prefixString.toLowerCase();
                
                query("INSERT IGNORE INTO guildPrefix (guildId, prefix) VALUES (?, ?)", [message.guild.id, prefixString]);
                message.client.cache.prefixes.set(message.guild.id, prefixString, 43200);
                
                message.reply(lang.setprefix[1].replace('{0}', prefixString));
            });
        }
    },
}