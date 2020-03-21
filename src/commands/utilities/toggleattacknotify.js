module.exports = {
    name: 'toggleattacknotify',
    aliases: [''],
    description: "Toggle this to enable DMs when you are attacked.",
    long: "Toggle notifications whenever you get attacked.",
    args: {"prefix": "Input to change server prefix to. Must be 1-3 characters long."},
    examples: ["toggleattacknotify"],
    ignoreHelp: true,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        const row = await app.player.getRow(message.author.id);

        if(row.notify2 == 0){
            await app.query(`UPDATE scores SET notify2 = 1 WHERE userId = ${message.author.id}`);

            message.reply('✅ You will now receive a DM when you are attacked.');
        }
        else{
            await app.query(`UPDATE scores SET notify2 = 0 WHERE userId = ${message.author.id}`);

            message.reply('❌ You will no longer receive a DM when you are attacked.');
        }
    },
}