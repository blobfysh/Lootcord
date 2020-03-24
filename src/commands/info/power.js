
module.exports = {
    name: 'power',
    aliases: [''],
    description: 'View your current power.',
    long: 'View your current power.',
    args: {},
    examples: ["power"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        const row = await app.player.getRow(message.author.id);
        
        message.reply(`You currently have **${row.power}/${row.max_power}** power.`);
    },
}