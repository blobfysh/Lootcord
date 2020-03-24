
module.exports = {
    name: 'points',
    aliases: ['xp'],
    description: 'Shows total experience earned.',
    long: 'Shows your lifetime earned experience.',
    args: {},
    examples: ["points"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        const row = await app.player.getRow(message.author.id);
        
        message.reply(`You currently have ${row.points} points!`);
    },
}