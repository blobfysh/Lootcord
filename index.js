const Discord = require("discord.js");
global.client = new Discord.Client({
    fetchAllMembers: true,
    messageCacheMaxSize: 50
});
const commands = require("./commands");
const votes = require("./votes");
const sql = require("sqlite"); //sql library used to save data
sql.open(`./score.sqlite`); //opens sql data table, or makes one if it doesn't exist
const fs = require("fs"); //allows searching of files
const Jimp = require("jimp"); //jimp library allows realtime editing of images
const triviaQ = require('./json/_trivia_questions.json'); //opens trivia question .json file
const scrambleQ = require('./json/_scramble_words.json'); //opens scramblewords question .json file
const config = require('./json/_config.json');
const DBL = require("dblapi.js");
const dbl = new DBL(config.dblToken, {webhookPath: '/dblwebhook', webhookPort: '5000', webhookAuth: config.dblAuth});
const spell = require("spell");


var dict = spell();
dict.load("poll help rules inventory use item items buy sell sellall craft recycle shop store trade trivia scramble hourly gamble vote setprefix discord cooldown update upgrade profile level level points "
                + "health heal money leaderboard server activate deactivate delete ban unban modadd unmod warn additem addcash addpoints eval modhelp cash bal backpack")
/*NPMS
npm install discord.js
npm install sqlite
npm install jimp
npm install dblapi.js
npm install seedrandom
npm install spell
npm install cryptorjs
*/
var bannedUsers = new Set(); //contains all banned user ids
var moddedUsers = new Set(); //add mods with t-modadd command

const adminUsers = new Set(['168958344361541633', '221087115893669889', '246828746789617665']); //add admins here

let messageSpamCooldown = new Set(); //spam prevention on messages sent to mods
let lvlMsgSpamCooldown = new Set(); //spam prevention on leveling up
let spamCooldown = new Set(); //cooldown on commands as a whole

global.hourlyCooldown = new Set(); //hourly command cooldown
global.voteCooldown = new Set();
global.deactivateCooldown = new Set();
global.activateCooldown = new Set();
global.triviaUserCooldown = new Set();
global.scrambleCooldown = new Set();
global.xpPotCooldown = new Set();
global.healCooldown = new Set();  //healing cooldown id holder
global.peckCooldown = new Set(); //peck command | lasts 2 hours
global.peckCdSeconds = 7200; //2 hours in seconds | used in index.js and commands.js

global.goldShieldActive = new Set();
global.ironShieldActive = new Set();
global.mittenShieldActive = new Set();
global.weapCooldown = new Set();  //weapon cooldown stuff

var xpNeeded; //is set to players xp needed when they send a message | used to determine level and used in t-inv command to calculate xp left until next level
var totalXpNeeded = 0;

const version = "3.11.0";

client.on(`ready`,() => {
    console.log(" _                    _                           _ \n"+
                "| |                  | |                         | |\n"+
                "| |      ___    ___  | |_   ___   ___   _ __   __| |\n"+
                "| |     / _ \\  / _ \\ | __| / __| / _ \\ | '__| / _` |\n"+
                "| |____| (_) || (_) || |_ | (__ | (_) || |   | (_| |\n"+
                "\\_____/ \\___/  \\___/  \\__| \\___| \\___/ |_|    \\__,_|");
    client.user.setActivity('t-help', { type: 'LISTENING' }).then(presence => 
        console.log(`Activity set to ${presence.game ? presence.game.name : 'none'}`)).catch(console.error);
    client.user.setStatus('available');

    if(config.debug == "false"){
        setInterval(() => {
            dbl.postStats(client.guilds.size);
        }, 1800000);
    }
    else{
        console.log("-- DEBUG MODE --\n-- DEBUG MODE --\n-- DEBUG MODE --");
    }
    sql.all(`SELECT userId FROM mods`).then(row => {        //refreshes the list of moderators on startup
        row.forEach((moderatorId) => {
            if(moderatorId.userId !== undefined && moderatorId.userId !== null){
                moddedUsers.add(moderatorId.userId);
            }
        });
    });
    sql.all(`SELECT userId FROM banned`).then(row => {        //refreshes the list of banned users on startup
        row.forEach((bannedId) => {
            if(bannedId.userId !== undefined && bannedId.userId !== null){
                bannedUsers.add(bannedId.userId);
            }
        });
    });
    sql.all(`SELECT * FROM scores`).then(row => {        //refreshes cooldowns for all users
        let cdsAdded = 0;
        row.forEach((userInfo) => {
            if(userInfo.userId !== undefined && userInfo.userId !== null){
                if(userInfo.hourlyTime > 0){
                    let timeLeft = (3600*1000) - ((new Date()).getTime() - userInfo.hourlyTime);
                    if(timeLeft > 0){
                        hourlyCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            hourlyCooldown.delete(userInfo.userId);
                            sql.run(`UPDATE scores SET hourlyTime = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);
                        //client.guilds.get("454163538055790604").channels.get("454163538886524928").send((timeLeft / (1000 * 60)) + " minutes remain on `hourly` command");
                        cdsAdded++;
                    }
                }
                if(userInfo.scrambleTime > 0){
                    let timeLeft = (900*1000) - ((new Date()).getTime() - userInfo.scrambleTime);
                    if(timeLeft > 0){
                        scrambleCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            scrambleCooldown.delete(userInfo.userId);
                            sql.run(`UPDATE scores SET scrambleTime = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);
                        //client.guilds.get("454163538055790604").channels.get("454163538886524928").send((timeLeft / (1000 * 60)) + " minutes remain on `scramble` command");
                        cdsAdded++;
                    }
                }
                if(userInfo.triviaTime > 0){
                    let timeLeft = (900*1000) - ((new Date()).getTime() - userInfo.triviaTime);
                    if(timeLeft > 0){
                        triviaUserCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            triviaUserCooldown.delete(userInfo.userId);
                            sql.run(`UPDATE scores SET triviaTime = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);
                        //client.guilds.get("454163538055790604").channels.get("454163538886524928").send((timeLeft / (1000 * 60)) + " minutes remain on `trivia`");
                        cdsAdded++;
                    }
                }
                if(userInfo.voteTime > 0){
                    let timeLeft = (43300*1000) - ((new Date()).getTime() - userInfo.voteTime);
                    if(timeLeft > 0){
                        voteCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            voteCooldown.delete(userInfo.userId);
                            sql.run(`UPDATE scores SET voteTime = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);
                        cdsAdded++;
                    }
                }
                if(userInfo.peckTime > 0){
                    let timeLeft = (7200*1000) - ((new Date()).getTime() - userInfo.peckTime);
                    if(timeLeft > 0){
                        peckCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            peckCooldown.delete(userInfo.userId);
                            sql.run(`UPDATE scores SET peckTime = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);
                        cdsAdded++;
                    }
                }
                if(userInfo.ironShieldTime > 0){
                    let timeLeft = (7200*1000) - ((new Date()).getTime() - userInfo.ironShieldTime);
                    if(timeLeft > 0){
                        ironShieldActive.add(userInfo.userId);
                        setTimeout(() => {
                            ironShieldActive.delete(userInfo.userId);
                            sql.run(`UPDATE scores SET ironShieldTime = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);
                        cdsAdded++;
                    }
                }
                if(userInfo.mittenShieldTime > 0){
                    let timeLeft = (1800*1000) - ((new Date()).getTime() - userInfo.mittenShieldTime);
                    if(timeLeft > 0){
                        mittenShieldActive.add(userInfo.userId);
                        setTimeout(() => {
                            mittenShieldActive.delete(userInfo.userId);
                            sql.run(`UPDATE scores SET mittenShieldTime = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);
                        cdsAdded++;
                    }
                }
                if(userInfo.goldShieldTime > 0){
                    let timeLeft = (28800*1000) - ((new Date()).getTime() - userInfo.goldShieldTime);
                    if(timeLeft > 0){
                        goldShieldActive.add(userInfo.userId);
                        setTimeout(() => {
                            goldShieldActive.delete(userInfo.userId);
                            sql.run(`UPDATE scores SET goldShieldTime = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);
                        cdsAdded++;
                    }
                }
                if(userInfo.deactivateTime > 0){
                    let timeLeft = (86400*1000) - ((new Date()).getTime() - userInfo.deactivateTime);
                    if(timeLeft > 0){
                        deactivateCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            deactivateCooldown.delete(userInfo.userId);
                            sql.run(`UPDATE scores SET deactivateTime = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);
                        cdsAdded++;
                    }
                }
                if(userInfo.activateTime > 0){
                    let timeLeft = (3600*1000) - ((new Date()).getTime() - userInfo.activateTime);
                    if(timeLeft > 0){
                        activateCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            activateCooldown.delete(userInfo.userId);
                            sql.run(`UPDATE scores SET activateTime = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);
                        cdsAdded++;
                    }
                }
                //ATTACK COOLDOWNS BELOW
                if(userInfo.attackTime > 0){
                    let timeLeft = (3600*1000) - ((new Date()).getTime() - userInfo.attackTime);
                    if(timeLeft > 0){
                        weapCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            weapCooldown.delete(userInfo.userId);
                            sql.run(`UPDATE scores SET attackTime = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);
                        //client.guilds.get("454163538055790604").channels.get("454163538886524928").send((timeLeft / (1000 * 60)) + " minutes remain on `attack`");
                        cdsAdded++;
                    }
                }
                if(userInfo._15mCD > 0){
                    let timeLeft = (900*1000) - ((new Date()).getTime() - userInfo._15mCD);
                    if(timeLeft > 0){
                        weapCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            weapCooldown.delete(userInfo.userId);
                            sql.run(`UPDATE scores SET _15mCD = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);
                        cdsAdded++;
                    }
                }
                if(userInfo._30mCD > 0){
                    let timeLeft = (1800*1000) - ((new Date()).getTime() - userInfo._30mCD);
                    if(timeLeft > 0){
                        weapCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            weapCooldown.delete(userInfo.userId);
                            sql.run(`UPDATE scores SET _30mCD = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);
                        cdsAdded++;
                    }
                }
                if(userInfo._45mCD > 0){
                    let timeLeft = (2700*1000) - ((new Date()).getTime() - userInfo._45mCD);
                    if(timeLeft > 0){
                        weapCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            weapCooldown.delete(userInfo.userId);
                            sql.run(`UPDATE scores SET _45mCD = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);
                        cdsAdded++;
                    }
                }
                if(userInfo._60mCD > 0){
                    let timeLeft = (3600*1000) - ((new Date()).getTime() - userInfo._60mCD);
                    if(timeLeft > 0){
                        weapCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            weapCooldown.delete(userInfo.userId);
                            sql.run(`UPDATE scores SET _60mCD = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);
                        cdsAdded++;
                    }
                }
                if(userInfo._80mCD > 0){
                    let timeLeft = (4800*1000) - ((new Date()).getTime() - userInfo._80mCD);
                    if(timeLeft > 0){
                        weapCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            weapCooldown.delete(userInfo.userId);
                            sql.run(`UPDATE scores SET _80mCD = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);
                        cdsAdded++;
                    }
                }
                if(userInfo._100mCD > 0){
                    let timeLeft = (6000*1000) - ((new Date()).getTime() - userInfo._100mCD);
                    if(timeLeft > 0){
                        weapCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            weapCooldown.delete(userInfo.userId);
                            sql.run(`UPDATE scores SET _100mCD = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);
                        cdsAdded++;
                    }
                }
                if(userInfo._120mCD > 0){
                    let timeLeft = (7200*1000) - ((new Date()).getTime() - userInfo._120mCD);
                    if(timeLeft > 0){
                        weapCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            weapCooldown.delete(userInfo.userId);
                            sql.run(`UPDATE scores SET _120mCD = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);
                        cdsAdded++;
                    }
                }
                //HEAL COOLDOWNS
                if(userInfo.healTime > 0){
                    let timeLeft = (1800*1000) - ((new Date()).getTime() - userInfo.healTime);
                    if(timeLeft > 0){
                        healCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            healCooldown.delete(userInfo.userId);
                            sql.run(`UPDATE scores SET healTime = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);
                        //client.guilds.get("454163538055790604").channels.get("454163538886524928").send((timeLeft / (1000 * 60)) + " minutes remain on `heal`");
                        cdsAdded++;
                    }
                }
                if(userInfo._10mHEALCD > 0){
                    let timeLeft = (600*1000) - ((new Date()).getTime() - userInfo._10mHEALCD);
                    if(timeLeft > 0){
                        healCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            healCooldown.delete(userInfo.userId);
                            sql.run(`UPDATE scores SET _10mHEALCD = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);
                        cdsAdded++;
                    }
                }
                if(userInfo._20mHEALCD > 0){
                    let timeLeft = (1200*1000) - ((new Date()).getTime() - userInfo._20mHEALCD);
                    if(timeLeft > 0){
                        healCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            healCooldown.delete(userInfo.userId);
                            sql.run(`UPDATE scores SET _20mHEALCD = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);
                        cdsAdded++;
                    }
                }
                if(userInfo._40mHEALCD > 0){
                    let timeLeft = (2400*1000) - ((new Date()).getTime() - userInfo._40mHEALCD);
                    if(timeLeft > 0){
                        healCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            healCooldown.delete(userInfo.userId);
                            sql.run(`UPDATE scores SET _40mHEALCD = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);
                        cdsAdded++;
                    }
                }
            }
        });
        console.log(cdsAdded + " cooldowns added to users.")
    });
    sql.run(`CREATE TABLE IF NOT EXISTS guildNPC (guildId INTEGER, health INTEGER, damage INTEGER, level INTEGER, item STRING)`);
    /*
    sql.run("ALTER TABLE scores ADD deactivateTime").then(row => {
    }).catch(() => {
        console.log("added `deactivateTime` to scores | CHANGE THE SCRIPT NOW");
        sql.run("UPDATE scores SET deactivateTime = 0");
    });
    sql.all('SELECT userId, level, points, maxHealth FROM scores').then(rows => { //REMOVE IN STABLE UPDATE
        rows.forEach(function (row) {
            //test each user
            let totalXpNeeded = 0;
            for(var i = 1; i <= row.level;i++){
                xpNeeded = Math.floor(50 * (i**1.7));
                totalXpNeeded += xpNeeded;
                if(row.points < totalXpNeeded){
                    sql.run(`UPDATE scores SET level = ${i}, maxHealth = ${95 + (i * 5)} WHERE userId = ${row.userId}`);
                    console.log("Changed -- " + row.userId + " -- level to " + i + " because " + row.points + " was less than the " + totalXpNeeded + "xp requirement for level " + (i+1));
                    break;
                }
            }
        });
    });
    sql.run("ALTER TABLE gameCodes ADD startingthegame").then(row => {
    }).catch(() => {
        console.log("added `startingthegame` | CHANGE THE SCRIPT NOW");
        sql.run("UPDATE gameCodes SET startingthegame = 50");
    });
    sql.run("ALTER TABLE items ADD ultra_ammo").then(row => {
    }).catch(() => {
        console.log("added `ultra_ammo` to items | CHANGE THE SCRIPT NOW");
        sql.run("UPDATE items SET ultra_ammo = 0");
    });
    sql.run("ALTER TABLE scores ADD spamTime").then(row => {
    }).catch(() => {
        console.log("added `spamTime` to scores | CHANGE THE SCRIPT NOW");
        sql.run("UPDATE scores SET spamTime = 0");
    });
    sql.run("ALTER TABLE items ADD stick").then(row => {
    }).catch(() => {
        console.log("added `stick` to items | CHANGE THE SCRIPT NOW");
        sql.run("UPDATE items SET stick = 0");
    });

    sql.run("ALTER TABLE scores ADD stats").then(row => {
        sql.run("ALTER TABLE scores ADD luck").then(row => {
            sql.run("ALTER TABLE scores ADD scaledDamage").then(row => {
                console.log("restart now.");
            }).catch(() => {
            });
        }).catch(() => {
        });
    }).catch(() => {
        console.log("added `stats` to scores | CHANGE THE SCRIPT NOW");
        sql.run("UPDATE scores SET stats = 0");
        console.log("added `luck` to scores | CHANGE THE SCRIPT NOW");
        sql.run("UPDATE scores SET luck = 0");
        console.log("added `scaledDamage` to scores | CHANGE THE SCRIPT NOW");
        sql.run("UPDATE scores SET scaledDamage = 1.00");

        sql.all('SELECT userId, level, health, maxHealth, stats FROM scores').then(rows => { //REMOVE IN STABLE UPDATE
            rows.forEach(function (row) {
                //test each user
                sql.run(`UPDATE scores SET maxHealth = 100 WHERE userId = ${row.userId}`);
                sql.run(`UPDATE scores SET stats = ${row.level - 1} WHERE userId = ${row.userId}`);
                console.log("successfully gave user stats points")
                if(row.health > 100){
                    sql.run(`UPDATE scores SET health = 100 WHERE userId = ${row.userId}`);
                    console.log("Successfully changed users health to 100");
                }
            });
        });
    });
    */
    sql.run("ALTER TABLE scores ADD inv_slots").then(row => {
    }).catch(() => {
        console.log("added `inv_slots` to scores | CHANGE THE SCRIPT NOW");
        sql.run("UPDATE scores SET inv_slots = 10");
    });
    sql.run("ALTER TABLE scores ADD backpack").then(row => {
    }).catch(() => {
        console.log("added `backpack` to scores | CHANGE THE SCRIPT NOW");
        sql.run("UPDATE scores SET backpack = 'none'");
    });
    sql.run("ALTER TABLE scores ADD armor").then(row => {
    }).catch(() => {
        console.log("added `armor` to scores | CHANGE THE SCRIPT NOW");
        sql.run("UPDATE scores SET armor = 'none'");
    });

    sql.run("ALTER TABLE scores ADD _15mCD").then(row => {//common
    }).catch(() => {
        console.log("---CDS\nadded `_15mCD` to scores | CHANGE THE SCRIPT NOW");
        sql.run("UPDATE scores SET _15mCD = 0");
    });
    sql.run("ALTER TABLE scores ADD _30mCD").then(row => {//common
    }).catch(() => {
        console.log("added `_30mCD` to scores | CHANGE THE SCRIPT NOW");
        sql.run("UPDATE scores SET _30mCD = 0");
    });
    sql.run("ALTER TABLE scores ADD _45mCD").then(row => {//rare
    }).catch(() => {
        console.log("added `_45mCD` to scores | CHANGE THE SCRIPT NOW");
        sql.run("UPDATE scores SET _45mCD = 0");
    });
    sql.run("ALTER TABLE scores ADD _60mCD").then(row => {//epic
    }).catch(() => {
        console.log("added `_60mCD` to scores | CHANGE THE SCRIPT NOW");
        sql.run("UPDATE scores SET _60mCD = 0");
    });
    sql.run("ALTER TABLE scores ADD _80mCD").then(row => {//lege
    }).catch(() => {
        console.log("added `_80mCD` to scores | CHANGE THE SCRIPT NOW");
        sql.run("UPDATE scores SET _80mCD = 0");
    });
    sql.run("ALTER TABLE scores ADD _100mCD").then(row => {//ult
    }).catch(() => {
        console.log("added `_100mCD` to scores | CHANGE THE SCRIPT NOW");
        sql.run("UPDATE scores SET _100mCD = 0");
    });
    sql.run("ALTER TABLE scores ADD _120mCD").then(row => {//any
    }).catch(() => {
        console.log("added `_120mCD` to scores | CHANGE THE SCRIPT NOW\n-----");
        sql.run("UPDATE scores SET _120mCD = 0");
    });

    sql.run("ALTER TABLE scores ADD _10mHEALCD").then(row => {//any
    }).catch(() => {
        console.log("added `_10mHEALCD` to scores | CHANGE THE SCRIPT NOW\n-----");
        sql.run("UPDATE scores SET _10mHEALCD = 0");
    });
    sql.run("ALTER TABLE scores ADD _20mHEALCD").then(row => {//any
    }).catch(() => {
        console.log("added `_20mHEALCD` to scores | CHANGE THE SCRIPT NOW\n-----");
        sql.run("UPDATE scores SET _20mHEALCD = 0");
    });
    sql.run("ALTER TABLE scores ADD _40mHEALCD").then(row => {//any
    }).catch(() => {
        console.log("added `_40mHEALCD` to scores | CHANGE THE SCRIPT NOW\n-----");
        sql.run("UPDATE scores SET _40mHEALCD = 0");
    });

    sql.run("ALTER TABLE items ADD light_pack").then(row => {
    }).catch(() => {
        console.log("added `light_pack` to items | CHANGE THE SCRIPT NOW");
        sql.run("UPDATE items SET light_pack = 0");
    });
    sql.run("ALTER TABLE items ADD canvas_bag").then(row => {
    }).catch(() => {
        console.log("added `canvas_bag` to items | CHANGE THE SCRIPT NOW");
        sql.run("UPDATE items SET canvas_bag = 0");
    });
    sql.run("ALTER TABLE items ADD hikers_pack").then(row => {
    }).catch(() => {
        console.log("added `hikers_pack` to items | CHANGE THE SCRIPT NOW");
        sql.run("UPDATE items SET hikers_pack = 0");
    });

    sql.run("ALTER TABLE banned ADD reason").then(row => {
    }).catch(() => {
        console.log("added `reason` to banned | CHANGE THE SCRIPT NOW");
    });
    sql.run("ALTER TABLE banned ADD date").then(row => {
    }).catch(() => {
        console.log("added `date` to banned | CHANGE THE SCRIPT NOW");
    });
});

client.on("message", (message) => {    
    if(bannedUsers.has(message.author.id)) return; //Ignore banned users
    if (message.author.bot) return; // Ignore bots.
    if(message.channel.type === "dm"){              //SENDS MESSAGE TO MODS
        if(message.author.bot) return;
        if(bannedUsers.has(message.author.id)) return; //ignores banned users messages
        if (message.content.startsWith("t-help") || message.content.startsWith("T-help")) { //REMOVE T-CLAIM LATER FROM THIS AND UPDATE COMMAND
            return commands.help(message,"t-");
        }
        else if(moddedUsers.has(message.author.id)){
            if (message.content.startsWith("t-modhelp")) {
                commands.modhelp(message, moddedUsers, "t-");
            } else

            if(message.content.startsWith("t-activity")){
                commands.activity(message, moddedUsers, "t-");
            } else

            if(message.content.startsWith("t-status")){
                commands.status(message, moddedUsers, "t-");
            } else

            if(message.content.startsWith("t-getbans")){                 //RETRIEVE COMMAND
                commands.getbans(message, moddedUsers, bannedUsers, "t-");
            }
            else{
                message.reply("Only `modhelp`, `status`, and `getbans` work in DMs!");
            }
            return; //doesnt send mods bot messages
        }
        if(messageSpamCooldown.has(message.author.id)){
            return message.author.send("You just sent a message! Wait 3 minutes between sending messages.");
        }
        message.author.send("Send this message to the mods?\n**PLEASE DO NOT SEND INAPPROPRIATE IMAGES**\n`You can send one message every 3 minutes`").then(botMessage => {
            botMessage.react('✅').then(() => botMessage.react('❌'));
            const filter = (reaction, user) => {
                return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
            };
            botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] })
            .then(collected => {
                const reaction = collected.first();

                if(reaction.emoji.name === '✅'){
                    botMessage.delete();
                    if(messageSpamCooldown.has(message.author.id)){
                        return message.author.send("You just sent a message! Wait 3 minutes between sending messages.");
                    }
                    const embedInfo = new Discord.RichEmbed()
                    .setTitle(`📨**Your message has been sent to the mods!**`)
                    .setAuthor(message.author.tag, message.author.avatarURL)
                    .setDescription("We will respond soon!")
                    .setColor(0)
                    .setThumbnail("https://cdn.discordapp.com/attachments/454163538886524928/495135804943761418/sucka.png")
                    .addBlankField()
                    .addField("Website", "https://lootcord.com",true)
                    .setFooter("Spamming PM's will get you banned.")
                    message.author.send(embedInfo);
                    messageSpamCooldown.add(message.author.id);
                    setTimeout(() => {
                        messageSpamCooldown.delete(message.author.id);
                    }, 180 * 1000);


                    let imageAttached = message.attachments.array();
                    const sentInfo = new Discord.RichEmbed()
                    .setTitle(`📨**New message!**`)
                    .setFooter("Respond with t-message " + message.author.id + " (MESSAGE)")
                    .setColor(0)
                    .setThumbnail(message.author.avatarURL)
                    if(!Array.isArray(imageAttached) || !imageAttached.length){
                        sentInfo.setDescription(message.author.tag + ` ID : ${message.author.id}`+"\n\n`" + message.content + "`\n\nNo attachment.")
                    }
                    else{
                        sentInfo.setDescription(message.author.tag + ` ID : ${message.author.id}`+"\n\n`" + message.content + "`\n\nAttachment:\n"+imageAttached[0].url)
                        sentInfo.setImage(imageAttached[0].url)
                    }
                    client.guilds.get("454163538055790604").channels.get("496740775212875816").send("<@&495162711102062592>");
                    if(Array.isArray(imageAttached) && imageAttached.length){
                        if( imageAttached[0].url.endsWith(".mp4") || imageAttached[0].url.endsWith(".mp3")){return client.guilds.get("454163538055790604").channels.get(config.modChannel).send({embed : sentInfo, files: [{attachment: imageAttached[0].url}]});}
                    }
                    return client.guilds.get("454163538055790604").channels.get(config.modChannel).send(sentInfo);
                }
                else{
                    botMessage.delete();
                }
            }).catch(collected => {
                botMessage.delete();
                message.reply("You didn't react in time!");
            });
        }).catch(error => {
            console.log(error);
        })
    }
    if (message.channel.type !== "text") return; //makes sure channel type is text

    let nickname = message.member.displayName;
    let prefix = "t-";
    //let userLang = "langs.en_us";

    sql.get(`SELECT * FROM guildPrefix WHERE guildId ="${message.guild.id}"`).then(prefixRow => {//grab server prefix
        if(prefixRow){prefix = prefixRow.prefix;}
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {  //Check if user has an account, if not make one when t-play is typed)
            if (!row) {
                if(message.content.startsWith(prefix + "play")){
                    sql.run("INSERT INTO scores (userId, money, points, level, health, maxHealth, healTime, attackTime, hourlyTime, triviaTime, peckTime, voteTime, "
                            + "gambleTime, ironShieldTime, goldShieldTime, prizeTime, mittenShieldTime, scrambleTime, deactivateTime, activateTime, kills, deaths, "
                            + "spamTime, stats, luck, scaledDamage, used_stats, xpTime, inv_slots, backpack, armor, _15mCD, _30mCD, _45mCD, _60mCD, _80mCD, _100mCD, "
                            + "_120mCD, _10mHEALCD, _20mHEALCD, _40mHEALCD) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
                            [message.author.id, 100, 0, 1, 100, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1.00, 0, 0, 10, 'none', 'none', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
                    sql.run("INSERT INTO items (userId, item_box, rpg, rocket, ak47, rifle_bullet, rock, arrow, fork, club, sword, bow, pistol_bullet, glock, "
                            + "crossbow, spear,thompson, health_pot, ammo_box, javelin, awp, m4a1, spas, medkit, revolver, buckshot, blunderbuss, grenade,"
                            + "pills, bat, baseball, peck_seed, iron_shield, gold_shield, ultra_box, rail_cannon, plasma, fish, bmg_50cal, token, candycane, gingerbread, mittens, stocking, snowball, nutcracker,"
                            + "screw, steel, adhesive, fiber_optics, module, ray_gun, golf_club, ultra_ammo, stick, xp_potion, reroll_scroll, light_pack, canvas_bag, hikers_pack) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
                            [message.author.id, 1, 0, 0, 0 , 0, 0, 0 , 0 , 0 , 0, 0 , 0 , 0 , 0 , 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
                    sql.run("INSERT INTO userGuilds (userId, guildId) VALUES (?, ?)", [message.author.id, message.guild.id]);
                    if(weapCooldown.has(message.author.id)){
                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
                    }
                    if(voteCooldown.has(message.author.id)){
                        sql.run(`UPDATE scores SET voteTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
                    }
                    const embedInfo = new Discord.RichEmbed()
                    .setTitle(`Thanks for joining LOOTCORD ${nickname}!`)
                    .setColor(14202368)
                    .addField("Items Received","```1x item_box```")
                    .setFooter("Open it with t-use item_box")
                    .setImage("https://cdn.discordapp.com/attachments/454163538886524928/525315435382571028/lc_welcome.png")
                    message.channel.send(embedInfo);
                }
            } 
            else {
                sql.get(`SELECT * FROM userGuilds WHERE userId ="${message.author.id}" AND guildId = "${message.guild.id}"`).then(playRow => {
                    if(message.content.startsWith(prefix + "play")){
                        if(playRow){
                            return message.reply("Your account is already active on this server!");
                        }
                        else{
                            message.reply("Account activated in this server!");
                            sql.run("INSERT INTO userGuilds (userId, guildId) VALUES (?, ?)", [message.author.id, message.guild.id]);
                            sql.run(`UPDATE scores SET activateTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
                            activateCooldown.add(message.author.id);
                            setTimeout(() => {
                                activateCooldown.delete(message.author.id);
                                sql.run(`UPDATE scores SET activateTime = ${0} WHERE userId = ${message.author.id}`);
                            }, 3600 * 1000);
                        }
                    }
                });
                if(lvlMsgSpamCooldown.has(message.author.id)){
                    return;
                }
                //let curLevel = Math.floor((0.004 * row.points) + 1); //DEPRECATED LEVEL SYSTEM
                //xpNeeded = 50 * (row.level**1.7);
                totalXpNeeded = 0;
                for(var i = 1; i <= row.level;i++){
                    xpNeeded = Math.floor(50*(i**1.7));
                    totalXpNeeded += xpNeeded;
                    if(i == row.level){
                        break;
                    }
                }
                if (row.points >= totalXpNeeded && message.member.guild.id !== "264445053596991498") {     //Sends lvlup message | IGNORES BOT LIST DISCORD
                    let levelItem = "";
                    if((row.level + 1) > 4){ levelItem = "ultra_box" } else {levelItem = "ammo_box"}
                    sql.run(`UPDATE scores SET points = ${row.points + 1}, level = ${row.level + 1}, stats = ${row.stats + 1} WHERE userId = ${message.author.id}`);
                    sql.get(`SELECT * FROM items WHERE userId ="${message.author.id}"`).then(itemRow => {
                        if((row.level + 1) > 4){
                            sql.run(`UPDATE items SET ultra_box = ${itemRow.ultra_box + 1} WHERE userId = ${message.author.id}`);
                        }
                        else{
                            sql.run(`UPDATE items SET ammo_box = ${itemRow.ammo_box + 1} WHERE userId = ${message.author.id}`);
                        }
                    }).catch();

                    Jimp.read("./userImages/LvlUp.png").then(test => { //start creating levelup image
                        Jimp.read(message.author.avatarURL).then(avatar => {
                            avatar.resize(64,64);
                            test.quality(70);

                            Jimp.loadFont("./fonts/BebasNeue37.fnt").then(font2 => {
                                test.print(font2, 0, 0, {
                                    text: "lvl " + (row.level + 1),
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
                                        console.log("oh no");
                                        return;
                                    }
                                    message.reply(`LEVEL **${row.level + 1}!**\n` + "**YOU EARNED A 🌟 SKILL POINT!** Use it with the `upgrade` command." + `\n**Item received!**  ` + "`" + levelItem + "`", {
                                    file: buffer
                                    });
                                });
                                
                            });
                            
                            });
                        });
                    });
                }
                sql.get(`SELECT * FROM xpBoost WHERE boost`).then(boostAmount => {
                    sql.get(`SELECT * FROM userGuilds WHERE userId ="${message.author.id}" AND guildId = "${message.guild.id}"`).then(playRow => {
                        if(playRow){
                            sql.run(`UPDATE scores SET points = ${row.points + boostAmount.boost} WHERE userId = ${message.author.id}`); //CALL THIS EVERY TIME YOU TYPE | only gives xp if active
                        }
                    });
                }).catch();

                lvlMsgSpamCooldown.add(message.author.id); //prevents user from spamming to lvl up
                setTimeout(() => {
                    lvlMsgSpamCooldown.delete(message.author.id);
                }, 1700);
            }
        }).catch(() => {
            console.error;
        });
        if(message.content.startsWith("<@" + client.user.id + ">") || message.content.startsWith("<@!" + client.user.id + ">")){//send help message if user mentions bot
            return commands.help(message, prefix);
        }
        if(!message.content.startsWith(prefix) && !message.content.startsWith(prefix.toUpperCase())) return; //Makes sure message start with prefix before moving forward
        message.content = message.content.replace(message.content.substring(0,prefix.length), prefix.toLowerCase()); //IMPORTANT | CHANGES MESSAGE TO ALL LOWERCASE
        function commandCheck (command){
            switch(command.toLowerCase()){
                case 'help': commands.help(message, prefix); break;
                //
                case 'displayvotes': commands.showUserVotes(message, moddedUsers, sql); break;
                //
                //ITEMS
                case 'inventory':
                case 'inv':
                case 'i': commands.inventory(message, sql, totalXpNeeded, xpNeeded, moddedUsers, prefix); break;
                case 'use': commands.use(message, sql, prefix); break;
                case 'items':
                case 'info':
                case 'item': commands.item(message, sql, prefix); break;
                case 'buy': commands.buy(message, sql, prefix); break;
                case 'sell': commands.sell(message, sql, prefix); break;
                case 'sellall': commands.sellall(message, sql, prefix); break;
                case 'craft': commands.craft(message, sql, prefix); break;
                case 'recycle': commands.recycle(message, sql, prefix); break;
                case 'shop':
                case 'market':
                case 'store': commands.shop(message, sql, prefix); break;
                case 'trade': commands.trade(message, sql, prefix); break;
                case 'profile': commands.profile(message, sql, prefix); break;
                case 'equip': commands.equipitem(message, sql, prefix); break;
                case 'unequip': commands.unequipitem(message, sql, prefix); break;

                //GAMES
                case 'trivia': commands.trivia(message, sql, triviaQ, prefix); break;
                case 'scramble': commands.scramble(message, sql, scrambleQ, prefix); break;
                case 'hourly': commands.hourly(message, sql, prefix); break;
                case 'gamble': commands.gamble(message, sql, prefix); break;
                case 'vote': commands.vote(message, sql, prefix); break;

                //GENERAL
                case 'rules': commands.rules(message); break;
                case 'upgrade': commands.upgrade(message, sql, prefix); break;
                case 'ping': commands.ping(message, sql); break;
                case 'setprefix': commands.prefix(message, sql, prefix); break;
                case 'invite':
                case 'discord': commands.discord(message); break;
                case 'heal': commands.heal(message, prefix); break;
                case 'attack': commands.attack(message, prefix); break;
                case 'cooldowns':
                case 'cooldown':
                case 'cd': commands.cooldown(message, sql, prefix); break;
                case 'botinfo':
                case 'version':
                case 'update': commands.info(message, version); break;
                case 'lvl':
                case 'level': commands.level(message, sql, prefix); break;
                case 'xp':
                case 'points': commands.points(message, sql, prefix); break;
                case 'backpack': commands.backpack(message, sql, prefix); break;
                case 'health':
                case 'hp': commands.health(message, sql, prefix); break;
                case 'balance':
                case 'bal':
                case 'cash':
                case 'money': commands.money(message, sql, prefix); break;
                case 'leaderboard':
                case 'lb': commands.leaderboard(message, sql, prefix); break;
                case 'server': commands.server(message, sql, prefix); break;
                case 'deactivate': commands.deactivate(message, sql, prefix); break;
                case 'suicide':
                case 'delete': commands.delete(message, sql, prefix); break;
                //MODERATOR COMMANDS
                case 'modhelp': commands.modhelp(message, moddedUsers, prefix); break;
                case 'ban': commands.ban(message, sql, moddedUsers, bannedUsers, prefix); break;
                case 'unban': commands.unban(message, sql, moddedUsers, bannedUsers, prefix); break;
                case 'warn': commands.warn(message, moddedUsers, prefix); break;
                case 'message': commands.message(message, moddedUsers, prefix); break;
                case 'status': commands.status(message, moddedUsers, prefix); break;
                case 'getbans': commands.getbans(message, moddedUsers, bannedUsers, prefix); break;
                case 'getbaninfo': commands.getbaninfo(message, sql, moddedUsers, bannedUsers, prefix); break;
                case 'invwipe': commands.invwipe(message, sql, moddedUsers, prefix); break;
                case 'getinv': commands.getinv(message, sql, moddedUsers, prefix); break;
                case 'restoreinv': commands.restoreinv(message, sql, moddedUsers, prefix); break;

                //ADMIN COMMANDS
                case 'addgamecode': commands.addgamecode(message, sql, adminUsers); break;
                case 'removegamecode': commands.removegamecode(message, sql, adminUsers); break;
                case 'modadd': commands.modadd(message, sql, adminUsers, moddedUsers, prefix); break;
                case 'unmod': commands.unmod(message, sql, adminUsers, moddedUsers, prefix); break;
                case 'getmods': commands.getmods(message, sql, adminUsers, moddedUsers, prefix); break;
                case 'addcash': commands.addcash(message, sql, adminUsers, prefix); break;
                case 'additem': commands.additem(message, sql, adminUsers, prefix); break;
                case 'addpoints': commands.addpoints(message, sql, adminUsers, prefix); break;
                case 'cdclear': commands.cdclear(message, sql, adminUsers, prefix); break;
                case 'buffclean': commands.buffclean(message, sql, adminUsers, prefix); break;
                case 'eval': commands.eval(message, sql, adminUsers); break;
                case 'fullwipe': commands.fullwipe(message, sql, adminUsers); break;
                default: return;
            }
            if(config.debug == "true") return;
            spamCooldown.add(message.author.id);
            sql.run(`UPDATE scores SET spamTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
            setTimeout(() => {
                spamCooldown.delete(message.author.id);
                sql.run(`UPDATE scores SET spamTime = ${0} WHERE userId = ${message.author.id}`);
            }, 2500);//3 second spam cooldown
        }
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(checkUser => { //Run checks on user before calling commandCheck
            sql.get(`SELECT * FROM userGuilds WHERE userId ="${message.author.id}" AND guildId = "${message.guild.id}"`).then(playingRow => {
                if(message.channel.id !== "496740775212875816"){ //CHECK IF USER HAS PECK_SEED EFFECT OR UNACTIVE ACCOUNT
                    if(checkUser && !playingRow && !message.content.startsWith(prefix+ "play")){
                        return message.reply("Your account is not active in this server! You must activate your account using `"+prefix+"play` before you can use commands in this server!");
                    }
                    else if(peckCooldown.has(message.author.id)){                            //SENDS MESSAGE IF USER IS CHICKEN AND PREVENTS THEM FROM USING COMMANDS
                        message.delete();
                        const embedChicken = new Discord.RichEmbed()
                        .setAuthor(message.author.tag, message.author.avatarURL)
                        .setTitle("`you try to type a command but your insatiable appetite for seeds keeps you preoccupied`")
                        .setColor(0)
                        .setFooter("Your appetite will calm in " + ((peckCdSeconds * 1000 - ((new Date()).getTime() - checkUser.peckTime)) / 60000).toFixed(1) + " minutes.")
                        message.channel.send(embedChicken);
                        return;
                    }
                    else if(spamCooldown.has(message.author.id)){
                        let spamSeconds = ((2500 - ((new Date()).getTime() - checkUser.spamTime)) / 1000).toFixed(0);
                        let secondAmount = (spamSeconds > 1) ? " seconds`" : (spamSeconds > 0) ? " second`" : " seconds` (now)";
                        message.reply("⏱**You're talking too fast, I can't understand! Please slow down... **`" + spamSeconds + secondAmount).then(spamMsg => {
                            spamMsg.delete(3000);
                        }).catch();
                        return;
                    }
                }
                let commandWord = message.content.split(/\s+/g)[0].slice(prefix.length);
                let wordCheck = dict.lucky(message.content.split(/\s+/g)[0].slice(prefix.length));
                console.log("word: "+ wordCheck + " | " + commandWord)
                if(commandWord == "" || commandWord.startsWith("pose") || commandWord.startsWith("serie")){
                    return;
                }
                else if(wordCheck !== undefined && commandWord.length >= 3){
                    commandCheck(wordCheck);
                }
                else{
                    commandCheck(commandWord);
                }
            }).catch(() => {
                console.error;
            });
        });
    });
});

client.on("guildMemberRemove", (member) => {
    sql.run(`DELETE FROM userGuilds WHERE userId = ${member.id} AND guildId = ${member.guild.id}`); //delete user from server
    if(weapCooldown.has(member.id) && activateCooldown.has(member.id)){
        const leaveEmbed = new Discord.RichEmbed()
        .setTitle("**⛔Cooldown Dodger**\n`" + client.users.get(member.id).tag + ": " + member.id + "`")
        .setDescription("User left a server after having just activated their account in it.\nCheck the <#500467081226223646> to see if they killed someone before leaving.\nIf they did, warn/punish them. Otherwise, you can ignore this...")
        .setFooter("Respond with t-message " + member.id)
        client.guilds.get("454163538055790604").channels.get("500467081226223646").send(leaveEmbed); //send to lootcord log
        return client.guilds.get("454163538055790604").channels.get("496740775212875816").send(leaveEmbed); //send to moderator channel
    }
});

client.on("guildDelete", (guild) => {
    sql.run(`DELETE FROM guildPrefix WHERE guildId ="${guild.id}"`); //resets server prefix to t-
});

client.on(`error`,() => {
    console.log("random error.");
});

dbl.webhook.on('vote', vote =>  {
    votes.voteReward(sql, vote, config, Discord);
});

client.login(config.botToken);