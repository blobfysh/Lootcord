const Discord = require('discord.js');
const { query } = require('../mysql.js');
const Jimp = require('jimp');

module.exports = {
    name: 'health',
    aliases: ['hp'],
    description: 'Displays current health.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        query(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(oldRow => {
            const row = oldRow[0];

            let hpMsg = "Current health:";
            let chance = Math.floor(Math.random() * 5); //returns value 0 between 4 (1 of 5)
            if(row.health >= 120){
                if(chance <= "2"){
                    hpMsg = "**A B S O L U T E   U N I T**";
                }
                else{
                    hpMsg = "Not gonna die anytime soon.";
                }
            }
            else if(row.health >= 100){
                if(chance == 0){
                    hpMsg = "That's a lot of health";
                }
                else if(chance == 1){
                    hpMsg = "You been workin' out?";
                }
                else if(chance == 2){
                    hpMsg = "Insert affirmation here.";
                }
                else if(chance == 3){
                    hpMsg = "💯";
                }
                else{
                    hpMsg = ":)";
                }
            }
            else if(row.health >= 60){
                if(chance == 0){
                    hpMsg = "ur aight m8";
                }
                else if(chance == 1){
                    hpMsg = "👌";
                }
                else if(chance == 2){
                    hpMsg = "Fair amount.";
                }
                else if(chance == 3){
                    hpMsg = "Here you go!";
                }
                else{
                    hpMsg = "Is this what you're looking for?";
                }
            }
            else if(row.health >= 40){
                if(chance == 0){
                    hpMsg = "Could use a `health_pot`.";
                }
                else if(chance == 1){
                    hpMsg = "oof";
                }
                else if(chance == 2){
                    hpMsg = ":)";
                }
                else if (chance == 3){
                    hpMsg = "It's turning yellow";
                }
                else{
                    hpMsg = ""
                }
            }
            else if(row.health >= 20){
                if(chance == 0){
                    hpMsg = "You look pale, are you okay?";
                }
                else if(chance == 1){
                    hpMsg = "*Health potion intensifies*";
                }
                else if(chance == 2){
                    hpMsg = "Gettin' low";
                }
                else if(chance == 3){
                    hpMsg = "Could use a health potion";
                }
                else{
                    hpMsg = "Might wanna invest in a `health_pot`";
                }
            }
            else{
                if(chance == 0){
                    hpMsg = "Here's a free `health_pot`. **SIKE** AHAHAA";
                }
                else if(chance == 1){
                    hpMsg = "Listen, I'm not saying you're gonna die... but you ded";
                }
                else if(chance == 2){
                    hpMsg = "RIP";
                }
                else if(chance == 3){
                    hpMsg = "The results aren't good";
                }
                else {
                    hpMsg = "YO SOMEONE KILL THIS DUDE";
                }
            }
            
            Jimp.read("./userImages/healthBarEmpty.png").then(emptyBar => {
                Jimp.read("./userImages/greenBar.png").then(greenBar => {
                    Jimp.read("./userImages/redBar.png").then(redBar => {
                        Jimp.read("./userImages/healthBarMask.png").then(barMask => {
                            greenBar.cover((row.health/row.maxHealth) * 150, 15);
                            greenBar.color([
                                {apply: 'hue', params: [-100 * (1 -(row.health/row.maxHealth))]}
                            ]);
                            redBar.composite(greenBar, 0, 0);
                            redBar.composite(emptyBar, 0, 0);
                            Jimp.loadFont("./fonts/BebasNeue16.fnt").then(font => {
                                redBar.print(
                                font,
                                    0,
                                    -2,
                                    {
                                    text: row.health + "/" + row.maxHealth,
                                    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                                    alignmentY: 0
                                    },
                                    150,
                                    15
                                );
                                redBar.mask(barMask, 0, 0);
                                redBar.resize(190,19);
                                redBar.write("./userImages/healthBarFinal.png");
                                redBar.getBuffer(Jimp.AUTO, (err, buffer) => {
                                    if(err){
                                        console.log("oh no");
                                        return;
                                    }
                                    message.reply(hpMsg, {
                                        file: buffer
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    },
}