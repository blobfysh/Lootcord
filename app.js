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
const methods               = require('./methods/methods');

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

client.query           = query;
client.sets            = require('./utils/sets.js');
client.cache           = require('./utils/cache');
client.commands        = new Discord.Collection();
client.clanCommands    = new Discord.Collection();
client.airdropTimes    = [];
client.shieldTimes     = [];
client.cdTimes         = [];
client.commandsUsed    = {};
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

client.on('message', async message => {
    if(message.author.bot) return;
    if(client.fullLockdown) return console.log('[APP] Ignored message.');
    if(client.sets.bannedUsers.has(message.author.id)) return;
    
    const lang = languages['en_us']; // selects language to use.

    prefix = message.guild ? await getPrefix(message.guild.id) : config.prefix;

    if(!message.content.toLowerCase().startsWith(prefix) && message.channel.type !== "dm"){
        return
    }

    message.sentTime = new Date().getTime();

    if(message.channel.type !== "dm") await checkLevelXp(message);

    handleCmd(message, prefix, lang);
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

    const tradeBannedRows = await query(`SELECT * FROM tradebanned`); //refreshes the list of tradebanned users on startup
    tradeBannedRows.forEach((bannedId) => {
        if(bannedId.userId !== undefined && bannedId.userId !== null){
            client.sets.tradeBannedUsers.add(bannedId.userId);
        }
    });

    // refreshes cooldowns for all users
    const rows = await query(`SELECT * FROM cooldown`);
    let cdsAdded = 0;
    for(cdInfo of rows){
        if(cdInfo.userId !== undefined){
            let timeLeft = (cdInfo.length) - ((new Date()).getTime() - cdInfo.start);
            if(timeLeft > 0){
                // if startup starts lagging too bad, remove await
                await methods.addCD(client, {
                    userId: cdInfo.userId,
                    type: cdInfo.type,
                    time: timeLeft
                }, {
                    ignoreQuery: true, 
                    shardOnly: true
                });
                
                cdsAdded++;
            }
        }
    }
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

async function getPrefix(guildId){
    cachePrefix = client.cache.prefixes.get(guildId);

    if(!cachePrefix){
        try{
            const prefixRow = (await query(`SELECT * FROM guildPrefix WHERE guildId = ${guildId}`))[0];
        
            if(prefixRow){
                client.cache.prefixes.set(guildId, prefixRow.prefix, 43200);
                return prefixRow.prefix
            }
            else{
                client.cache.prefixes.set(guildId, config.prefix, 43200);
                return config.prefix
            }
        }
        catch(err){
            console.log('[APP] Prefix query failed, MySQL not working?:')
            console.log(err);
        }
    }
    else{
        return cachePrefix;
    }
}

client.login(config.botToken);