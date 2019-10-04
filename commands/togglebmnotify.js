const { query } = require('../mysql.js');

module.exports = {
    name: 'togglebmnotify',
    aliases: ['toggleblackmarketnotify'],
    description: 'Toggle this to enable DMs when you sell an item on the Black Market.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    guildModsOnly: false,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const row = (await query(`SELECT * FROM scores WHERE userId ="${message.author.id}"`))[0];

        if(row.notify1 == 0){
            query(`UPDATE scores SET notify1 = 1 WHERE userId = ${message.author.id}`);

            message.reply('✅ You will now receive notifications for sold items on the Black Market.');
        }
        else{
            query(`UPDATE scores SET notify1 = 0 WHERE userId = ${message.author.id}`);

            message.reply('❌ You will no longer receive notifications for sold items on the Black Market.');
        }
    },
}