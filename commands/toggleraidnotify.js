const { query } = require('../mysql.js');

module.exports = {
    name: 'toggleraidnotify',
    aliases: ['toggleclannotify'],
    description: 'Toggle this to enable DMs when your clan is raided.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    guildModsOnly: false,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const row = (await query(`SELECT * FROM scores WHERE userId ="${message.author.id}"`))[0];

        if(row.notify3 == 0){
            query(`UPDATE scores SET notify3 = 1 WHERE userId = ${message.author.id}`);

            message.reply('✅ You will now receive a DM when your clan is raided.');
        }
        else{
            query(`UPDATE scores SET notify3 = 0 WHERE userId = ${message.author.id}`);

            message.reply('❌ You will no longer receive a DM when your clan is raided.');
        }
    },
}