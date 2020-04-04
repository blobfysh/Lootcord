const Base             = require('eris-sharder').Base;
const Eris             = require('eris');
                         require('eris-additions')(Eris, {disabled: ['Eris.Embed']});

const cluster          = require('cluster');
const fs               = require('fs');
const Embed            = require('embedcord');

const config           = require('./resources/config/config');
const icons            = require('./resources/config/icons');
const CommandHandler   = require('./utils/CommandHandler');
const MySQL            = require('./utils/MySQL');
const Cooldowns        = require('./utils/Cooldowns');
const Items            = require('./utils/Items');
const Player           = require('./utils/Player');
const ArgParser        = require('./utils/ArgParser');
const Reactor          = require('./utils/Reactor');
const Discoin          = require('./utils/Discoin');
const Messager         = require('./utils/Messager');
const Common           = require('./utils/Common');
const Leaderboard      = require('./utils/Leaderboard');
const Airdrop          = require('./utils/Airdrop');
const MessageCollector = require('./utils/MessageCollector');
const BlackMarket      = require('./utils/BlackMarket');
const Clans            = require('./utils/Clans');

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
        this.msgCollector = new MessageCollector(this);
        this.discoin = new Discoin(this);
        this.messager = new Messager(this);
        this.cd = new Cooldowns(this);
        this.itm = new Items(this);
        this.player = new Player(this);
        this.leaderboard = new Leaderboard(this);
        this.bm = new BlackMarket(this);
        this.clans = new Clans(this);
        this.parse = new ArgParser(this);
        this.Embed = Embed.DiscordEmbed;
        this.airdrop = new Airdrop(this);
        this.commandHandler = new CommandHandler(this);
    }

    async launch(){
        await this.mysql.createDB(); // create database structure
        this.initIPC();

        if(cluster.worker.id === 1) {
            // only run these on main cluster, cooldowns only need to be refreshed once for all other clusters
            await this.refreshCooldowns();
            await this.refreshLists();

            await this.startAirdrops();
        }

        this.bot.editStatus('online', {
            name: 't-help | early alpha beta TEST',
            type: 0
        });

        console.log('[APP] Listening for events');
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
            delete require.cache[require.resolve('./resources/json/items/completeItemList')]
            this.itemdata = require('./resources/json/items/completeItemList');
            this.parse = new ArgParser(this); // must reload arg parser so the spell correction can update
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
                    await this.cd.setCD(cdInfo.userId, cdInfo.type, timeLeft, { ignoreQuery: true });
                    
                    cdsAdded++;
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

        // OLD MODS TABLE, cooldown table is now used to ban
        const bannedRows = await this.query(`SELECT * FROM banned`); 
        for(let banned of bannedRows){
            if(banned.userId !== undefined && banned.userId !== null){
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
                await this.airdrop.initAirdrop(airdropRows[i].guildId);
            }
        }
    }
}

module.exports = Lootcord;