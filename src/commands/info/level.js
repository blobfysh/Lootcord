const Jimp = require('jimp');
//TODO replace Jimp with a different image manipulation library, maybe have someone else make the level-up image

module.exports = {
    name: 'level',
    aliases: ['lvl'],
    description: 'Displays level.',
    long: 'Displays your level along with your current scaled damage.',
    args: {},
    examples: [],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        try{
            const row = await app.player.getRow(message.author.id);

            message.channel.createMessage({content: `Your current level is **${row.level}**`}, { 
                file: await app.player.getLevelImage(message.author.avatarURL, row.level), 
                name: 'userLvl.jpeg'
            });
        }
        catch(err){
            console.log(err);
            message.reply('There was an error creating your level image! woops...');
        }
    },
}