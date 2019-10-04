const { query } = require('../mysql.js');

module.exports = {
    name: 'toggleattacknotify',
    aliases: [''],
    description: 'Toggle this to enable DMs when you are attacked.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    guildModsOnly: false,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const row = (await query(`SELECT * FROM scores WHERE userId ="${message.author.id}"`))[0];

        if(row.notify2 == 0){
            query(`UPDATE scores SET notify2 = 1 WHERE userId = ${message.author.id}`);

            message.reply('✅ You will now receive a DM when you are attacked.');
        }
        else{
            query(`UPDATE scores SET notify2 = 0 WHERE userId = ${message.author.id}`);

            message.reply('❌ You will no longer receive a DM when you are attacked.');
        }
    },
}