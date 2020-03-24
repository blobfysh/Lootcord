const Jimp = require('jimp');
//TODO replace Jimp with a different image manipulation library, maybe have someone else make the level-up image

module.exports = {
    name: 'level',
    aliases: ['lvl'],
    description: 'Displays level.',
    long: 'Displays your level along with your current scaled damage.',
    args: {},
    examples: ["level"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        try{
            const row = await app.player.getRow(message.author.id);

            const image = await Jimp.read('./src/resources/images/LvlUp2.png');
            const avatar = await Jimp.read(message.author.avatarURL);
            const largeFont = await Jimp.loadFont('./src/resources/fonts/BebasNeue37.fnt');
            const smallFont = await Jimp.loadFont('./src/resources/fonts/BebasNeue25.fnt');
            image.quality(70);
            avatar.resize(64, 64);

            image.print(largeFont, 0, 0, {
                text: "lvl " + row.level,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
            }, 128, 144);
            
            image.print(smallFont, 0, 0, {
                text: message.author.username.substring(0, 13),
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY: Jimp.VERTICAL_ALIGN_TOP
            }, 128, 144);

            image.composite(avatar, 32, 32);
            image.write('./src/resources/images/userLvl.jpeg');
            image.getBuffer(Jimp.AUTO, (err, buffer) => {
                if(err) throw new Error(err);

                message.channel.createMessage({content: `Your current level is **${row.level}**`}, { 
                    file: buffer, 
                    name: 'userLvl.jpeg'
                });
            });
        }
        catch(err){
            console.log(err);
            message.reply('There was an error creating your level image! woops...');
        }
    },
}