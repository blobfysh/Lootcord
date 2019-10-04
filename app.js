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
const patreonHandler        = require('./utils/patreonHandler.js');

const client = new Discord.Client({
    messageCacheMaxSize: 50,
    messageCacheLifetime: 300,
    messageSweepInterval: 500,
    disableEveryone: true,
    disabledEvents: [
        'PRESENCE_UPDATE',
        'TYPING_START'
    ]
});

client.sets            = require('./utils/sets.js');
client.commands        = new Discord.Collection();
client.clanCommands    = new Discord.Collection();
client.airdropTimes    = [];
client.shieldTimes     = [];
client.commandsUsed    = 0;
client.restartLockdown = false;
client.fullLockdown    = true;

const commandFiles      = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const moderatorCommands = fs.readdirSync('./commands/moderation').filter(file => file.endsWith('.js'));
const adminCommands     = fs.readdirSync('./commands/admin').filter(file => file.endsWith('.js'));
const clanCommandFiles  = fs.readdirSync('./commands/clans').filter(file => file.endsWith('.js'));

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
for(const file of clanCommandFiles){
    const clanCmd = require(`./commands/clans/${file}`);
    client.clanCommands.set(clanCmd.name, clanCmd);
}

var prefix = config.prefix;

client.on('message', message => {
    if(message.author.bot) return;
    if(client.fullLockdown) return console.log('[APP] Ignored message.');
    if(client.sets.bannedUsers.has(message.author.id)) return;
    
    const lang = languages['en_us']; // selects language to use.

    query(`SELECT * FROM guildPrefix WHERE guildId = ${message.guild !== null ? message.guild.id : 0}`).then(prefixRow => {
        
        if(prefixRow !== undefined && prefixRow.length > 0) {
            prefix = prefixRow[0].prefix;
        }
        else{
            prefix = config.prefix;
        }

        if(!message.content.toLowerCase().startsWith(prefix) && message.channel.type !== "dm"){
            if(!client.sets.activeScramblers.has(message.author.id)){
                return checkLevelXp(message);
            }
            else return;
        }

        if(message.channel.type === "dm") handleCmd(message, 't-', lang);
        
        else handleCmd(message, prefix, lang);
    }).catch(err => {
        console.log('[APP] Query failed, MySQL not working?:')
        console.log(err);
    });
});

client.on("guildMemberRemove", (member) => {
    query(`DELETE FROM userGuilds WHERE userId = ${member.id} AND guildId = ${member.guild.id}`); // delete user from server
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

client.on('guildMemberUpdate', (oldMember, newMember) => {
    patreonHandler.checkIfPatron(oldMember, newMember);
});

client.on("guildDelete", (guild) => {
    query(`DELETE FROM guildPrefix WHERE guildId ="${guild.id}"`); //resets server prefix to t-
});

client.on('error', (err) => {
    console.log(err);
});

client.on('disconnect', (err) => {
    console.log(err);
    client.destroy().then(client.login(config.botToken));
});

/*
client.on('debug', (message) => {
	console.debug(message);
});
*/

client.on('reconnecting', () => {
	console.log('[APP] ' + client.shard.id + ' is reconnecting...');
});

client.on('ready', async () => {
    if(config.debug == false){
        setInterval(() => {
            //methods.sendlbtoweb(sql);
            if(client.user.presence.game.name.endsWith('Dungeons')){
                client.shard.broadcastEval(`
                    this.shard.fetchClientValues('guilds.size').then(results => {
                        var result = results.reduce((prev, guildCount) => prev + guildCount, 0);
                        this.user.setActivity('t-help | ' + result + ' Loot Dungeons', {type: 'LISTENING'});
                        result;
                    })
                `);
            }
            dbl.postStats(client.guilds.size, client.shard.id, client.shard.count);
        }, 1800000); // 30 minutes
    }

    const modRows = await query(`SELECT * FROM mods`); //refreshes the list of moderators on startup
    modRows.forEach((moderatorId) => {
        if(moderatorId.userId !== undefined && moderatorId.userId !== null){
            client.sets.moddedUsers.add(moderatorId.userId);
        }
    });

    const bannedRows = await query(`SELECT * FROM banned`); //refreshes the list of banned users on startup
    bannedRows.forEach((bannedId) => {
        if(bannedId.userId !== undefined && bannedId.userId !== null){
            client.sets.bannedUsers.add(bannedId.userId);
        }
    });

    // refresh clan raid cooldowns
    const raidRows = await query(`SELECT clanId, raidTime FROM clans`);
    raidRows.forEach((clanInfo) => {
        if(clanInfo.clanId !== undefined && clanInfo.clanId !== null){
            if(clanInfo.raidTime > 0){
                let timeLeft = (3600*1000) - ((new Date()).getTime() - clanInfo.raidTime);
                if(timeLeft > 0){
                    client.sets.raidCooldown.add(clanInfo.clanId.toString());
                    setTimeout(() => {
                        client.sets.raidCooldown.delete(clanInfo.clanId.toString());
                        query(`UPDATE clans SET raidTime = ${0} WHERE clanId = ${clanInfo.userId}`);
                    }, timeLeft);
                }
            }
        }
    });

    // refreshes cooldowns for all users
    const rows = await query(`SELECT * FROM cooldowns`);
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
                let timeLeft = (43200*1000) - ((new Date()).getTime() - userInfo.voteTime);
                if(timeLeft > 0){
                    client.sets.voteCooldown.add(userInfo.userId);
                    setTimeout(() => {
                        client.sets.voteCooldown.delete(userInfo.userId);
                        query(`UPDATE cooldowns SET voteTime = ${0} WHERE userId = ${userInfo.userId}`);
                    }, timeLeft);

                    cdsAdded++;
                }
                else{
                    query(`UPDATE cooldowns SET voteTime = ${0} WHERE userId = ${userInfo.userId}`);
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
            if(userInfo.airdropTime > 0){
                let timeLeft = (21600*1000) - ((new Date()).getTime() - userInfo.airdropTime);
                if(timeLeft > 0){
                    client.sets.airdropCooldown.add(userInfo.userId);
                    setTimeout(() => {
                        client.sets.airdropCooldown.delete(userInfo.userId);
                        query(`UPDATE cooldowns SET airdropTime = ${0} WHERE userId = ${userInfo.userId}`);
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
    console.log('[APP] ' + cdsAdded + " cooldowns added to users.");

    // The following code calls in airdrops for all guilds who have a dropChannel set
    const airdropRows = await query(`SELECT * FROM guildInfo WHERE dropChan != 0`);
    for(var i = 0; i < airdropRows.length; i++){
        if(airdropRows[i].guildId !== undefined && airdropRows[i].guildId !== null && airdropRows[i].dropChan !== 0){
            await airdropper.initAirdrop(client, airdropRows[i].guildId);
        }
    }

    console.log(`[APP] Shard ${client.shard.id} is ready`);
    client.fullLockdown = false;
});

process.on('message', async message => {
    if(client.shard.id === 0){
        try{
            const user = await client.fetchUser(message.userId);
            
            if(message.msgToSend.embed){
                await user.send(message.msgToSend.text, {embed: message.msgToSend.embed});
            }
            else{
                await user.send(message.msgToSend.text);
            }
        }
        catch(err){

        }
    }
});

process.on('unhandledRejection', (reason, p) => {
	console.error('[APP][' + new Date().toLocaleString(undefined, {timeZone: 'America/New_York'}) + '] Unhandled Rejection: ', reason);
});

client.login(config.botToken);