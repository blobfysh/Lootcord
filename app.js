const fs        = require('fs');
const config    = require('./json/_config.json');
const languages = require('./json/_translations.json');

const Discord = require('discord.js');
const DBL     = require('dblapi.js');
const dbl     = new DBL(config.dblToken);

const { connectSQL, query } = require('./mysql.js');
const { handleCmd }         = require('./commandhandler.js');
const { checkLevelXp }      = require('./utils/checklevel.js');
const airdropper            = require('./utils/airdrop.js');

const client = new Discord.Client({
    fetchAllMembers: true,
    messageCacheMaxSize: 50
});

client.sets         = require('./utils/sets.js'); //load cooldown sets into client variable so we can broadcastEval()
client.commands     = new Discord.Collection();
client.airdropTimes = [];
client.shieldTimes  = [];

const commandFiles      = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const moderatorCommands = fs.readdirSync('./commands/moderation').filter(file => file.endsWith('.js'));
const adminCommands     = fs.readdirSync('./commands/admin').filter(file => file.endsWith('.js'));

for(const file of moderatorCommands){
    commandFiles.push(`moderation/${file}`);
}
for(const file of adminCommands){
    commandFiles.push(`admin/${file}`);
}
for(const file of commandFiles){
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

var prefix = config.prefix;

client.on('message', message => {
    if(message.author.bot && message.author.id !== message.client.user.id) return;
    if(message.client.sets.bannedUsers.has(message.author.id)) return;

    const lang = languages['en_us']; // selects language to use.

    query(`SELECT prefix FROM guildPrefix WHERE guildId = ${message.guild !== null ? message.guild.id : 0}`).then(prefixRow => {
        if(prefixRow.length) prefix = prefixRow[0].prefix;

        if(!message.content.toLowerCase().startsWith(prefix) && message.channel.type !== "dm") return checkLevelXp(message);
        
        if(message.channel.type === "dm") handleCmd(message, 't-', lang);
        
        else handleCmd(message, prefix, lang);
    });
});

client.on("guildMemberRemove", (member) => {
    query(`DELETE FROM userGuilds WHERE userId = ${member.id} AND guildId = ${member.guild.id}`); //delete user from server
    /*
    if(weapCooldown.has(member.id) && activateCooldown.has(member.id)){
        const leaveEmbed = new Discord.RichEmbed()
        .setTitle("**⛔Cooldown Dodger**\n`" + client.users.get(member.id).tag + ": " + member.id + "`")
        .setDescription("User left a server after having just activated their account in it.\nCheck the <#500467081226223646> to see if they killed someone before leaving.\nIf they did, warn/punish them. Otherwise, you can ignore this...")
        .setFooter("Respond with t-message " + member.id)
        client.guilds.get("454163538055790604").channels.get("500467081226223646").send(leaveEmbed); //send to lootcord log
        return client.guilds.get("454163538055790604").channels.get("496740775212875816").send(leaveEmbed); //send to moderator channel
    }
    */
});

client.on("guildDelete", (guild) => {
    query(`DELETE FROM guildPrefix WHERE guildId ="${guild.id}"`); //resets server prefix to t-
});

client.on('error', (err) => {
    console.log('Random error: ' + err);
});

client.on('ready', () => {
    console.log(`Launched shard ${client.shard.id}`);

    if(config.debug == false){
        setInterval(() => {
            //methods.sendlbtoweb(sql);
            dbl.postStats(client.guilds.size, client.shard.id, client.shard.count);
        }, 1800000); // 30 minutes
    }

    // refreshes cooldowns for all users
    query(`SELECT * FROM cooldowns`).then(rows => {
        let cdsAdded = 0;
        rows.forEach((userInfo) => {
            if(userInfo.userId !== undefined && userInfo.userId !== null){
                if(userInfo.hourlyTime > 0){
                    let timeLeft = (3600*1000) - ((new Date()).getTime() - userInfo.hourlyTime);
                    if(timeLeft > 0){
                        client.sets.hourlyCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            client.sets.hourlyCooldown.delete(userInfo.userId);
                            query(`UPDATE cooldowns SET hourlyTime = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);

                        cdsAdded++;
                    }
                }
                if(userInfo.scrambleTime > 0){
                    let timeLeft = (900*1000) - ((new Date()).getTime() - userInfo.scrambleTime);
                    if(timeLeft > 0){
                        client.sets.scrambleCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            client.sets.scrambleCooldown.delete(userInfo.userId);
                            query(`UPDATE cooldowns SET scrambleTime = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);

                        cdsAdded++;
                    }
                }
                if(userInfo.triviaTime > 0){
                    let timeLeft = (900*1000) - ((new Date()).getTime() - userInfo.triviaTime);
                    if(timeLeft > 0){
                        client.sets.triviaUserCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            client.sets.triviaUserCooldown.delete(userInfo.userId);
                            query(`UPDATE cooldowns SET triviaTime = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);

                        cdsAdded++;
                    }
                }
                if(userInfo.voteTime > 0){
                    let timeLeft = (43300*1000) - ((new Date()).getTime() - userInfo.voteTime);
                    if(timeLeft > 0){
                        client.sets.voteCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            client.sets.voteCooldown.delete(userInfo.userId);
                            query(`UPDATE cooldowns SET voteTime = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);

                        cdsAdded++;
                    }
                }
                if(userInfo.peckTime > 0){
                    let timeLeft = (7200*1000) - ((new Date()).getTime() - userInfo.peckTime);
                    if(timeLeft > 0){
                        client.sets.peckCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            client.sets.peckCooldown.delete(userInfo.userId);
                            query(`UPDATE cooldowns SET peckTime = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);

                        cdsAdded++;
                    }
                }
                if(userInfo.ironShieldTime > 0){
                    let timeLeft = (7200*1000) - ((new Date()).getTime() - userInfo.ironShieldTime);
                    if(timeLeft > 0){
                        client.sets.activeShield.add(userInfo.userId);
                        setTimeout(() => {
                            client.sets.activeShield.delete(userInfo.userId);
                            query(`UPDATE cooldowns SET ironShieldTime = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);

                        cdsAdded++;
                    }
                }
                if(userInfo.mittenShieldTime > 0){
                    let timeLeft = (1800*1000) - ((new Date()).getTime() - userInfo.mittenShieldTime);
                    if(timeLeft > 0){
                        client.sets.activeShield.add(userInfo.userId);
                        setTimeout(() => {
                            client.sets.activeShield.delete(userInfo.userId);
                            query(`UPDATE cooldowns SET mittenShieldTime = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);

                        cdsAdded++;
                    }
                }
                if(userInfo.goldShieldTime > 0){
                    let timeLeft = (28800*1000) - ((new Date()).getTime() - userInfo.goldShieldTime);
                    if(timeLeft > 0){
                        client.sets.activeShield.add(userInfo.userId);
                        setTimeout(() => {
                            client.sets.activeShield.delete(userInfo.userId);
                            query(`UPDATE cooldowns SET goldShieldTime = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);

                        cdsAdded++;
                    }
                }
                if(userInfo.deactivateTime > 0){
                    let timeLeft = (86400*1000) - ((new Date()).getTime() - userInfo.deactivateTime);
                    if(timeLeft > 0){
                        client.sets.deactivateCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            client.sets.deactivateCooldown.delete(userInfo.userId);
                            query(`UPDATE cooldowns SET deactivateTime = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);

                        cdsAdded++;
                    }
                }
                if(userInfo.activateTime > 0){
                    let timeLeft = (3600*1000) - ((new Date()).getTime() - userInfo.activateTime);
                    if(timeLeft > 0){
                        client.sets.activateCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            client.sets.activateCooldown.delete(userInfo.userId);
                            query(`UPDATE cooldowns SET activateTime = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);

                        cdsAdded++;
                    }
                }
                //ATTACK COOLDOWNS BELOW
                if(userInfo._15mCD > 0){
                    let timeLeft = (900*1000) - ((new Date()).getTime() - userInfo._15mCD);
                    if(timeLeft > 0){
                        client.sets.weapCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            client.sets.weapCooldown.delete(userInfo.userId);
                            query(`UPDATE cooldowns SET _15mCD = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);

                        cdsAdded++;
                    }
                }
                if(userInfo._30mCD > 0){
                    let timeLeft = (1800*1000) - ((new Date()).getTime() - userInfo._30mCD);
                    if(timeLeft > 0){
                        client.sets.weapCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            client.sets.weapCooldown.delete(userInfo.userId);
                            query(`UPDATE cooldowns SET _30mCD = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);

                        cdsAdded++;
                    }
                }
                if(userInfo._45mCD > 0){
                    let timeLeft = (2700*1000) - ((new Date()).getTime() - userInfo._45mCD);
                    if(timeLeft > 0){
                        client.sets.weapCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            client.sets.weapCooldown.delete(userInfo.userId);
                            query(`UPDATE cooldowns SET _45mCD = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);

                        cdsAdded++;
                    }
                }
                if(userInfo._60mCD > 0){
                    let timeLeft = (3600*1000) - ((new Date()).getTime() - userInfo._60mCD);
                    if(timeLeft > 0){
                        client.sets.weapCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            client.sets.weapCooldown.delete(userInfo.userId);
                            query(`UPDATE cooldowns SET _60mCD = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);

                        cdsAdded++;
                    }
                }
                if(userInfo._80mCD > 0){
                    let timeLeft = (4800*1000) - ((new Date()).getTime() - userInfo._80mCD);
                    if(timeLeft > 0){
                        client.sets.weapCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            client.sets.weapCooldown.delete(userInfo.userId);
                            query(`UPDATE cooldowns SET _80mCD = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);

                        cdsAdded++;
                    }
                }
                if(userInfo._100mCD > 0){
                    let timeLeft = (6000*1000) - ((new Date()).getTime() - userInfo._100mCD);
                    if(timeLeft > 0){
                        client.sets.weapCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            client.sets.weapCooldown.delete(userInfo.userId);
                            query(`UPDATE cooldowns SET _100mCD = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);

                        cdsAdded++;
                    }
                }
                if(userInfo._120mCD > 0){
                    let timeLeft = (7200*1000) - ((new Date()).getTime() - userInfo._120mCD);
                    if(timeLeft > 0){
                        client.sets.weapCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            client.sets.weapCooldown.delete(userInfo.userId);
                            query(`UPDATE cooldowns SET _120mCD = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);

                        cdsAdded++;
                    }
                }
                //HEAL COOLDOWNS
                if(userInfo.healTime > 0){
                    let timeLeft = (1800*1000) - ((new Date()).getTime() - userInfo.healTime);
                    if(timeLeft > 0){
                        client.sets.healCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            client.sets.healCooldown.delete(userInfo.userId);
                            query(`UPDATE cooldowns SET healTime = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);

                        cdsAdded++;
                    }
                }
                if(userInfo._10mHEALCD > 0){
                    let timeLeft = (600*1000) - ((new Date()).getTime() - userInfo._10mHEALCD);
                    if(timeLeft > 0){
                        client.sets.healCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            client.sets.healCooldown.delete(userInfo.userId);
                            query(`UPDATE cooldowns SET _10mHEALCD = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);

                        cdsAdded++;
                    }
                }
                if(userInfo._20mHEALCD > 0){
                    let timeLeft = (1200*1000) - ((new Date()).getTime() - userInfo._20mHEALCD);
                    if(timeLeft > 0){
                        client.sets.healCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            client.sets.healCooldown.delete(userInfo.userId);
                            query(`UPDATE cooldowns SET _20mHEALCD = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);

                        cdsAdded++;
                    }
                }
                if(userInfo._40mHEALCD > 0){
                    let timeLeft = (2400*1000) - ((new Date()).getTime() - userInfo._40mHEALCD);
                    if(timeLeft > 0){
                        client.sets.healCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            client.sets.healCooldown.delete(userInfo.userId);
                            query(`UPDATE cooldowns SET _40mHEALCD = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);

                        cdsAdded++;
                    }
                }
                //EASTER ONLY
                if(userInfo.prizeTime > 0){
                    let timeLeft = (43300*1000) - ((new Date()).getTime() - userInfo.prizeTime);
                    if(timeLeft > 0){
                        client.sets.eventCooldown.add(userInfo.userId);
                        setTimeout(() => {
                            client.sets.eventCooldown.delete(userInfo.userId);
                            query(`UPDATE cooldowns SET prizeTime = ${0} WHERE userId = ${userInfo.userId}`);
                        }, timeLeft);

                        cdsAdded++;
                    }
                }
            }
        });
        console.log(cdsAdded + " cooldowns added to users.")
    });

    // The following code calls in airdrops for all guilds who have a dropChannel set
    query(`SELECT * FROM guildInfo`).then(rows => {
        let airdropsCalled = 0;
        rows.forEach((guild) => {
            if(guild.guildId !== undefined && guild.guildId !== null && guild.dropChan !== 0){
                airdropper.initAirdrop(client, guild.guildId);
                airdropsCalled++;
            }
        });
    });
});

client.login(config.botToken);