const Base             = require('eris-sharder').Base;
const Eris             = require('eris');

const fs               = require('fs');

const config           = require('./resources/config/config');
const icons            = require('./resources/config/icons');
const Embed            = require('./structures/Embed');
const CommandHandler   = require('./utils/CommandHandler');
const MySQL            = require('./utils/MySQL');
const Cooldowns        = require('./utils/Cooldowns');
const Items            = require('./utils/Items');
const Player           = require('./utils/Player');
const ArgParser        = require('./utils/ArgParser');
const Reactor          = require('./utils/Reactor');
const Discoin          = require('./utils/Discoin');
const NoFlyList        = require('./utils/NoFlyList');
const Messager         = require('./utils/Messager');
const Common           = require('./utils/Common');
const Leaderboard      = require('./utils/Leaderboard');
const Airdrop          = require('./utils/Airdrop');
const Monsters         = require('./utils/Monsters');
const MessageCollector = require('./utils/MessageCollector');
const BlackMarket      = require('./utils/BlackMarket');
const Clans            = require('./utils/Clans');
const LoopTasks        = require('./utils/LoopTasks');
const PatreonHandler   = require('./utils/PatreonHandler');
const voteHandler      = require('./utils/voteHandler');
const kofiHandler      = require('./utils/kofiHandler');

const events           = fs.readdirSync(__dirname + '/events');
const categories       = fs.readdirSync(__dirname + '/commands');

class Lootcord extends Base {
    constructor(bot){
        super(bot);

        this.isReady = true;
        this.config = config;
        this.icons = icons;
        this.itemdata = require('./resources/json/items/completeItemList');
        this.badgedata = require('./resources/json/badges');
        this.mobdata = require('./resources/json/monsters');
        this.clan_ranks = require('./resources/json/clan_ranks');
        this.trivia_questions = require('./resources/json/trivia_questions');
        this.scramble_words = require('./resources/json/scramble_words');
        this.commands = this.loadCommands();
        this.clanCommands = this.loadClanCommands();
        this.sets = this.loadSets();
        this.cache = require('./utils/cache');
        this.mysql = new MySQL(config);
        this.common = new Common(this);
        this.react = new Reactor(icons);
        this.patreonHandler = new PatreonHandler(this);
        this.msgCollector = new MessageCollector(this);
        this.discoin = new Discoin(config);
        this.noflylist = new NoFlyList(config);
        this.messager = new Messager(this);
        this.cd = new Cooldowns(this);
        this.itm = new Items(this);
        this.player = new Player(this);
        this.leaderboard = new Leaderboard(this);
        this.bm = new BlackMarket(this);
        this.clans = new Clans(this);
        this.parse = new ArgParser(this);
        this.Embed = Embed;
        this.airdrop = new Airdrop(this);
        this.monsters = new Monsters(this);
        this.loopTasks = new LoopTasks(this);
        this.commandHandler = new CommandHandler(this);
    }

    async launch(){
        await this.mysql.createDB(); // create database structure
        this.initIPC();
        this.loopTasks.start();


        if(this.clusterID === 0) {
            // only run these on main cluster, cooldowns only need to be refreshed once for all other clusters
            await this.refreshCooldowns();
            await this.refreshLists();
            await this.startAirdrops();
            await this.startSpawns();
        }

        this.bot.editStatus('online', {
            name: 't-help | Join the discord!',
            type: 0
        });

        console.info('[APP] Listening for events');
        for(let event of events){
            this.bot.on(event.replace('.js', ''), require(`./events/${event}`).run.bind(this));
        }
    }

    loadCommands(){
        let commands = new Eris.Collection();

        for(let category of categories){
            
            const commandFiles = fs.readdirSync(__dirname + `/commands/${category}`).filter(file => file.endsWith('.js'));
        
            for(let file of commandFiles){
                if(file == 'convert.js' && this.config.debug) continue; // removes convert command to prevent issues with Discoin api
                
                const command = require(`./commands/${category}/${file}`);
    
                // set command category based on which folder it's in
                command.category = category;
    
                commands.set(command.name, command);
            }
        }
    
        return commands
    }
    
    loadClanCommands(){
        let commands = new Eris.Collection();

        const clanFiles = fs.readdirSync(__dirname + `/commands/clans/commands`);

        for(let file of clanFiles){
            const command = require(`./commands/clans/commands/${file}`);

            command.category = 'clans';

            commands.set(command.name, command);
        }

        return commands;
    }

    loadSets(){
        return {
            adminUsers: new Set(this.config.adminUsers),
            disabledCommands: new Set()
        }
    }

    initIPC(){
        this.ipc.register('clearCD', (msg) => {
            this.cd.clearTimers(msg.userId, msg.type);
        });

        this.ipc.register('reloadItems', (msg) => {
            console.log('[APP] Reloading items');
            delete require.cache[require.resolve('./resources/json/items/completeItemList')]
            this.itemdata = require('./resources/json/items/completeItemList');
            this.parse = new ArgParser(this); // must reload arg parser so the spell correction can update
        });

        this.ipc.register('setStatus', (msg) => {
            this.bot.editStatus(msg.status || 'online', {
                name: 't-help | ' + msg.content,
                type: parseInt(msg.type) || 0
            });
        });

        this.ipc.register('disableCmd', (msg) => {
            this.sets.disabledCommands.add(msg.cmd);
        });
        this.ipc.register('enableCmd', (msg) => {
            this.sets.disabledCommands.delete(msg.cmd);
        });

        this.ipc.register('vote', voteHandler.handle.bind(this));
        this.ipc.register('donation', kofiHandler.handle.bind(this));

        this.ipc.register('addKofiRole', async (msg) => {
            const guild = this.bot.guilds.get(msg.guildId);
            if(guild){
                const member = await this.common.fetchMember(guild, msg.userId);

                try{
                    if(member) await member.addRole(this.config.donatorRoles.kofi);
                }
                catch(err){
                    console.warn('Failed adding donator role.');
                    console.warn(err);
                }
            }
        });
        this.ipc.register('removeKofiRole', async (msg) => {
            const guild = this.bot.guilds.get(msg.guildId);
            if(guild){
                const member = await this.common.fetchMember(guild, msg.userId);

                try{
                    if(member) await member.removeRole(this.config.donatorRoles.kofi);
                }
                catch(err){
                    console.warn('Failed removing donator role.');
                    console.warn(err);
                }
            }
        });

        this.ipc.register('removeActiveRole', async (msg) => {
            const guild = this.bot.guilds.get(msg.guildId);
            if(guild){
                const member = await this.common.fetchMember(guild, msg.userId);

                try{
                    if(member) await member.removeRole(msg.roleId);
                }
                catch(err){
                    console.warn('Failed removing active role.');
                    console.warn(err);
                }
            }
        });
    }

    query(sql, args){
        return this.mysql.query(sql, args);
    }

    async refreshCooldowns(){
        const rows = await this.query(`SELECT * FROM cooldown`);
        let cdsAdded = 0;

        for(let cdInfo of rows){
            if(cdInfo.userId !== undefined){
                let timeLeft = (cdInfo.length) - ((new Date()).getTime() - cdInfo.start);
                if(timeLeft > 0){
                    let callback = undefined;
                    if(cdInfo.type === 'mob'){
                        callback = () => {
                            this.monsters.onFinished(cdInfo.userId);
                        }
                    }
                    else if(cdInfo.type === 'mobHalf'){
                        callback = () => {
                            this.monsters.onHalf(cdInfo.userId);
                        }
                    }
                    else if(cdInfo.type === 'explosion'){
                        setTimeout(async () => {
                            await this.query("UPDATE clans SET reduction = reduction - 5 WHERE clanId = ?", [cdInfo.userId]);
                            await this.query(`DELETE FROM cooldown WHERE userId = ? AND type = 'explosion'`, [cdInfo.userId]);
                        }, timeLeft);

                        continue;
                    }
                    
                    await this.cd.setCD(cdInfo.userId, cdInfo.type, timeLeft, { ignoreQuery: true }, callback);
                    
                    cdsAdded++;
                }
                else if(cdInfo.type === 'mob'){
                    // delete mob
                    await this.query(`DELETE FROM cooldown WHERE userId = '${cdInfo.userId}' AND type = '${cdInfo.type}'`);
                    await this.query(`DELETE FROM spawns WHERE channelId = ?`, [cdInfo.userId]);
                }
                else if(cdInfo.type === 'explosion'){
                    await this.query("UPDATE clans SET reduction = reduction - 5 WHERE clanId = ?", [cdInfo.userId]);
                    await this.query(`DELETE FROM cooldown WHERE userId = ? AND type = 'explosion'`, [cdInfo.userId]);
                }
            }
        }

        console.log('[APP] ' + cdsAdded + " cooldowns refreshed.");
    }

    async refreshLists(){
        // refreshes the list of moderators on startup
        const modRows = await this.query(`SELECT * FROM mods`); 
        for(let mod of modRows){
            if(mod.userId !== undefined && mod.userId !== null){
                await this.cache.setNoExpire(`mod|${mod.userId}`, 'Modded');
            }
        }

        // refreshes tier 1 patrons
        const tier1Patrons = await this.query(`SELECT * FROM patrons WHERE tier = 1`); 
        for(let patron of tier1Patrons){
            if(patron.userId !== undefined && patron.userId !== null){
                await this.cache.setNoExpire(`patron1|${patron.userId}`, 'Patron Monthly Tier 1');
            }
        }

        // refreshes tier 2 patrons
        const tier2Patrons = await this.query(`SELECT * FROM patrons WHERE tier = 2`); 
        for(let patron of tier2Patrons){
            if(patron.userId !== undefined && patron.userId !== null){
                await this.cache.setNoExpire(`patron2|${patron.userId}`, 'Patron Monthly Tier 2');
            }
        }

        // refreshes tier 3 patrons
        const tier3Patrons = await this.query(`SELECT * FROM patrons WHERE tier = 3`); 
        for(let patron of tier3Patrons){
            if(patron.userId !== undefined && patron.userId !== null){
                await this.cache.setNoExpire(`patron3|${patron.userId}`, 'Patron Monthly Tier 3');
            }
        }

        // refreshes tier 4 patrons
        const tier4Patrons = await this.query(`SELECT * FROM patrons WHERE tier = 4`); 
        for(let patron of tier4Patrons){
            if(patron.userId !== undefined && patron.userId !== null){
                await this.cache.setNoExpire(`patron4|${patron.userId}`, 'Patron Monthly Tier 4');
            }
        }
        
        const bannedRows = await this.query(`SELECT * FROM banned`); 
        for(let banned of bannedRows){
            if(banned.userId !== undefined && banned.userId !== null){
                if(await this.cd.getCD(banned.userId, 'banned')) continue;
                
                await this.cache.setNoExpire(`banned|${banned.userId}`, 'Banned perma');
            }
        }

        // refreshes the list of tradebanned users on startup
        const tradeBannedRows = await this.query(`SELECT * FROM tradebanned`); 
        for(let banned of tradeBannedRows){
            if(banned.userId !== undefined && banned.userId !== null){
                await this.cache.setNoExpire(`tradeban|${banned.userId}`, 'Tradebanned perma');
            }
        }
    }

    async startAirdrops(){
        const airdropRows = await this.query(`SELECT * FROM guildInfo WHERE dropChan != 0`);

        for(let i = 0; i < airdropRows.length; i++){
            if(airdropRows[i].guildId !== undefined && airdropRows[i].guildId !== null && airdropRows[i].dropChan !== 0){
                this.airdrop.initAirdrop(airdropRows[i].guildId);
            }
        }
    }

    async startSpawns(){
        const spawnChannels = await this.query(`SELECT * FROM spawnChannels`);

        for(let i = 0; i < spawnChannels.length; i++){
            await this.monsters.initSpawn(spawnChannels[i].channelId);
        }
    }
}

module.exports = Lootcord;