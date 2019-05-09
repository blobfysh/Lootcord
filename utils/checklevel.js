const { query } = require('../mysql.js');
const Jimp = require('jimp');

exports.checkLevelXp = async function(message){
    try{
        const oldRow = await query(`SELECT * FROM items 
        INNER JOIN scores
        ON items.userId = scores.userId
        WHERE items.userId = '${message.author.id}'`);

        if(oldRow.length){
            const row = oldRow[0];
            var totalXpNeeded = 0;

            for(var i = 1; i <= row.level; i++){
                var xpNeeded = Math.floor(50*(i**1.7));
                totalXpNeeded += xpNeeded;
                if(i == row.level){
                    break;
                }
            }

            if(row.points >= totalXpNeeded && message.guild.id !== "264445053596991498") {     //Sends lvlup message | IGNORES BOT LIST DISCORD
                let levelItem = "";
                if((row.level + 1) > 4){ levelItem = "ultra_box" } else {levelItem = "ammo_box"}

                query(`UPDATE scores SET points = ${row.points + 1}, level = ${row.level + 1}, stats = ${row.stats + 1} WHERE userId = ${message.author.id}`);

                if((row.level + 1) > 4){
                    query(`UPDATE items SET ultra_box = ${row.ultra_box + 1} WHERE userId = ${message.author.id}`);
                }
                else{
                    query(`UPDATE items SET ammo_box = ${row.ammo_box + 1} WHERE userId = ${message.author.id}`);
                }

                const oldRow2 = await query(`SELECT * FROM guildInfo WHERE guildId ="${message.guild.id}"`);
                const guildRow = oldRow2[0];


                //Create level image
                var baseImage = await Jimp.read("./userImages/LvlUp.png");
                var avatar = await Jimp.read(message.author.avatarURL);

                avatar.resize(64, 64);
                baseImage.quality(70);

                var lvlFont = await Jimp.loadFont("./fonts/BebasNeue37.fnt");
                baseImage.print(lvlFont, 0, 0, {
                    text: 'lvl ' + (row.level + 1),
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
                        message.guild.channels.get(guildRow.levelChan).send(message.author + `\nLEVEL **${row.level + 1}!**\n` + "**YOU EARNED A 🌟 SKILL POINT!** Use it with the `upgrade` command." + `\n**Item received!**  ` + "`" + levelItem + "`", {
                            file: buffer
                        }).catch(err => {
                            message.reply(`LEVEL **${row.level + 1}!**\n` + "**YOU EARNED A 🌟 SKILL POINT!** Use it with the `upgrade` command." + `\n**Item received!**  ` + "`" + levelItem + "`", {
                                file: buffer
                            });
                        });
                    }
                    else{
                        message.reply(`LEVEL **${row.level + 1}!**\n` + "**YOU EARNED A 🌟 SKILL POINT!** Use it with the `upgrade` command." + `\n**Item received!**  ` + "`" + levelItem + "`", {
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