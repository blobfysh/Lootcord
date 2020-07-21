
module.exports = {
    name: 'balance',
    aliases: ['cash', 'money', 'bal', 'lootcoin', 'scrap'],
    description: 'Displays your current balance.',
    long: 'Displays your current Lootcoin and Scrap balance.',
    args: {},
    examples: [],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        const row = await app.player.getRow(message.author.id);

        message.reply(`You currently have:\n\nLootcoin: ${app.common.formatNumber(row.money)}\nScrap: ${app.common.formatNumber(row.scrap, false, true)}`);
    },
}