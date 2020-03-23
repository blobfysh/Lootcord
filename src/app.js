const Base           = require('eris-sharder').Base;
const Eris           = require('eris');
                       require('eris-additions')(Eris, {disabled: ['Eris.Embed']});

const cluster        = require('cluster');
const fs             = require('fs');
const Embed          = require('embedcord');

const config         = require('./resources/config/config');
const CommandHandler = require('./utils/CommandHandler');
const MySQL          = require('./utils/MySQL');
const Cooldowns      = require('./utils/Cooldowns');
const Items          = require('./utils/Items');
const Player         = require('./utils/Player');
const ArgParser      = require('./utils/ArgParser');

const events         = fs.readdirSync(__dirname + '/events');
const categories     = fs.readdirSync(__dirname + '/commands');

class Lootcord extends Base {
    constructor(bot){
        super(bot);

        this.isReady = true;
        this.config = config;
        this.itemdata = require('./resources/json/items/completeItemList');
        this.commands = this.loadCommands();
        this.sets = this.loadSets();
        this.cache = require('./utils/cache');
        this.mysql = new MySQL(config);
        this.cd = new Cooldowns(this);
        this.itm = new Items(this);
        this.player = new Player(this);
        this.parse = new ArgParser(this);
        this.Embed = Embed.DiscordEmbed;
        this.commandHandler = new CommandHandler(this);
    }

    async launch(){
        await this.mysql.connect();
        await this.mysql.createDB(); // create database structure
        this.initIPC();

        if(cluster.worker.id === 1) {
            // only run these on main cluster, cooldowns only need to be refreshed once for all other clusters
            await this.refreshCooldowns();

            //TODO airdrops start here
        }

        this.bot.editStatus(null, {
            name: 't-help',
            type: 0
        });

        console.log('[APP] Listening for events');
        for(var event of events){
            this.bot.on(event.replace('.js', ''), require(`./events/${event}`).run.bind(this));
        }
    }

    loadCommands(){
        let commands = new Eris.Collection();

        for(var category of categories){
            const commandFiles = fs.readdirSync(__dirname + `/commands/${category}`);
        
            for(var file of commandFiles){
                const command = require(`./commands/${category}/${file}`);
    
                // set command category based on which folder it's in
                command.category = category;
    
                commands.set(command.name, command);
            }
        }
    
        return commands
    }

    loadSets(){
        //TODO make this obsolete by using cache
        return {
            adminUsers: new Set(this.config.adminUsers),
            moddedUsers: new Set(),
            activeCmdCooldown: new Set(),
            disabledCommands: new Set(),
            gettingRaided: new Set()
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

        for(var cdInfo of rows){
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
}

module.exports = Lootcord;