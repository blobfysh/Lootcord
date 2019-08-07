const { query } = require('../mysql.js');
const Jimp = require('jimp');
const methods = require('../methods/methods');

exports.checkLevelXp = async function(message){
    try{
        const userRow = (await query(`SELECT * FROM scores WHERE userId = '${message.author.id}'`))[0];

        if(userRow){
            var totalXpNeeded = 0;

            for(var i = 1; i <= userRow.level; i++){
                var xpNeeded = Math.floor(50*(i**1.7));
                totalXpNeeded += xpNeeded;
                if(i == userRow.level){
                    break;
                }
            }

            if(userRow.points >= totalXpNeeded && message.guild.id !== "264445053596991498") {     //Sends lvlup message | IGNORES BOT LIST DISCORD
                let levelItem = "";
                if((userRow.level + 1) > 4){ levelItem = "ultra_box" } else {levelItem = "2x item_box"}

                query(`UPDATE scores SET points = ${userRow.points + 1}, level = ${userRow.level + 1}, stats = ${userRow.stats + 1} WHERE userId = ${message.author.id}`);

                if((userRow.level + 1) > 4){
                    methods.additem(message.author.id, 'ultra_box', 1);
                }
                else{
                    methods.additem(message.author.id, 'item_box', 2);
                }

                const guildRow = (await query(`SELECT * FROM guildInfo WHERE guildId ="${message.guild.id}"`))[0];

                //Create level image
                var baseImage = await Jimp.read("./userImages/LvlUp.png");
                var avatar = await Jimp.read(message.author.avatarURL);

                avatar.resize(64, 64);
                baseImage.quality(70);

                var lvlFont = await Jimp.loadFont("./fonts/BebasNeue37.fnt");
                baseImage.print(lvlFont, 0, 0, {
                    text: 'lvl ' + (userRow.level + 1),
                    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                    alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
                }, 128, 144);

                var nameFont = await Jimp.loadFont("./fonts/BebasNeue25.fnt");
                baseImage.print(nameFont, 0, 0, {
                    text: message.author.username.substring(0, 13),
                    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                    alignmentY: Jimp.VERTICAL_ALIGN_TOP
                }, 128, 144);

                baseImage.composite(avatar, 32, 32);
                baseImage.write('./userImages/userLvl.jpeg');
                baseImage.getBuffer(Jimp.AUTO, (err, buffer) => {
                    if(err) return;
                    if(guildRow.levelChan !== undefined && guildRow.levelChan !== "" && guildRow.levelChan !== 0){
                        message.guild.channels.get(guildRow.levelChan).send(message.author + `\nLEVEL **${userRow.level + 1}!**\n` + "**YOU EARNED A 🌟 SKILL POINT!** Use it with the `upgrade` command." + `\n**Item received!**  ` + "`" + levelItem + "`", {
                            file: buffer
                        }).catch(err => {
                            message.reply(`LEVEL **${userRow.level + 1}!**\n` + "**YOU EARNED A 🌟 SKILL POINT!** Use it with the `upgrade` command." + `\n**Item received!**  ` + "`" + levelItem + "`", {
                                file: buffer
                            });
                        });
                    }
                    else{
                        message.reply(`LEVEL **${userRow.level + 1}!**\n` + "**YOU EARNED A 🌟 SKILL POINT!** Use it with the `upgrade` command." + `\n**Item received!**  ` + "`" + levelItem + "`", {
                            file: buffer
                        });
                    }
                });
            }
        }
    }
    catch(err){
        console.log(err);
    }
}