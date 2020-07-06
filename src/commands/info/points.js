
module.exports = {
    name: 'points',
    aliases: ['xp'],
    description: 'Shows total experience earned.',
    long: 'Shows your lifetime earned experience.',
    args: {},
    examples: [],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        const row = await app.player.getRow(message.author.id);
        const xp = app.common.calculateXP(row.points, row.level);
        
        message.reply('You currently have **' + xp.curLvlXp + ' / ' + xp.neededForLvl + '** XP towards level **' + (row.level + 1) + '**.');
    },
}