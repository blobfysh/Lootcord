
module.exports = {
    name: 'health',
    aliases: ['hp'],
    description: 'Displays current health.',
    long: 'Displays your current health and your maximum possible health.',
    args: {},
    examples: [],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        const row = await app.player.getRow(message.author.id);

        message.reply(`You currently have: ${app.player.getHealthIcon(row.health, row.maxHealth)}\`${row.health}/${row.maxHealth}\` HP (Gain more with the \`upgrade\` command)`);
    },
}