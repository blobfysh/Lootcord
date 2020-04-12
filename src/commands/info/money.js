
module.exports = {
    name: 'money',
    aliases: ['cash', 'balance', 'bal'],
    description: 'Displays your current balance.',
    long: 'Displays your current balance.',
    args: {},
    examples: [],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        const row = await app.player.getRow(message.author.id);

        message.reply(`You currently have ${app.common.formatNumber(row.money)}.`);
    },
}