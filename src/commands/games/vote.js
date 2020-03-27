
module.exports = {
    name: 'vote',
    aliases: [''],
    description: 'Vote for the bot to collect a reward!',
    long: 'Vote for the bot to receive a reward.',
    args: {},
    examples: ["vote"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        const voteCD = await app.cd.getCD(message.author.id, 'vote');

        if(voteCD){
            message.reply(`Vote available in \`${voteCD}\`!\n🎟Vote for the bot to collect a reward!\nhttps://top.gg/bot/493316754689359874/vote\nYou should receive a DM after you vote!`);
        }
        else{
            message.reply(`☑VOTE AVAILABLE\n🎟Vote for the bot to collect a reward!\nhttps://top.gg/bot/493316754689359874/vote\nYou should receive a DM after you vote!`);
        }
    },
}