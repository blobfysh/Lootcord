
module.exports = {
    name: 'points',
    aliases: ['xp'],
    description: 'Shows experience towards the next level.',
    long: 'Shows your current experience towards the next level.',
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