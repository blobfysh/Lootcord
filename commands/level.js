const Discord = require('discord.js');
const { query } = require('../mysql.js');
const Jimp = require('jimp');

module.exports = {
    name: 'level',
    aliases: ['lvl'],
    description: 'Displays level.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        query(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            Jimp.read("./userImages/LvlUp.png").then(test => {
                Jimp.read(message.author.avatarURL).then(avatar => {
                    avatar.resize(64,64);
                    test.quality(70);
                    Jimp.loadFont("./fonts/BebasNeue37.fnt").then(font2 => {
                        test.print(font2, 0, 0, {
                            text: "lvl " + row[0].level,
                            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                            alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
                        }, 128, 144);
                        Jimp.loadFont("./fonts/BebasNeue25.fnt").then(font => {
                        test.print(
                            font,
                            0,
                            0,
                            {
                            text: message.author.username.substring(0,13),
                            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                            alignmentY: Jimp.VERTICAL_ALIGN_TOP
                            },
                            128,
                            144
                        );
                        //test.print(font, 0, 0, message.author.username);
                        test.composite(avatar, 32, 32);
                        test.write("./userImages/userLvl.jpeg");
                        test.getBuffer(Jimp.AUTO, (err, buffer) => {
                            if(err){
                                console.log(err);
                                return;
                            }
                            message.reply(`Your current level is **${row[0].level}**.\nYour damage scaling is currently **${row[0].scaledDamage.toFixed(2)}x**`, {
                                file: buffer
                            });
                        });    
                    });
                    });
                });
            });
        });
    },
}