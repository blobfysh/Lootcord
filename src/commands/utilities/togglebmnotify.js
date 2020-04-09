module.exports = {
    name: 'togglebmnotify',
    aliases: ['toggleblackmarketnotify'],
    description: "Toggle this to enable DMs when you sell an item on the Black Market.",
    long: "Toggle notifications whenever you sell an item on the Black Market.",
    args: {},
    examples: [],
    ignoreHelp: true,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        const row = await app.player.getRow(message.author.id);

        if(row.notify1 == 0){
            await app.query(`UPDATE scores SET notify1 = 1 WHERE userId = ${message.author.id}`);

            message.reply('✅ You will now receive notifications for sold items on the Black Market.');
        }
        else{
            await app.query(`UPDATE scores SET notify1 = 0 WHERE userId = ${message.author.id}`);

            message.reply('❌ You will no longer receive notifications for sold items on the Black Market.');
        }
    },
}