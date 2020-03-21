const Base           = require('eris-sharder').Base;
const Eris           = require('eris');
                       require('eris-additions')(Eris, {disabled: ['Eris.Embed']});

const fs             = require('fs');
const Embed          = require('embedcord');

const config         = require('./resources/config/config');
const CommandHandler = require('./utils/CommandHandler');
const MySQL          = require('./utils/MySQL');
const Cooldowns      = require('./utils/Cooldowns');

const events         = fs.readdirSync(__dirname + '/events');
const categories     = fs.readdirSync(__dirname + '/commands');

class Lootcord extends Base {
    constructor(bot){
        super(bot);


        this.isReady = true;
        this.config = config;
        this.commands = this.loadCommands();
        this.sets = this.loadSets();
        this.cache = require('./utils/cache');
        this.mysql = new MySQL(config);
        this.cd = new Cooldowns(this);
        this.Embed = Embed.DiscordEmbed;
        this.commandHandler = new CommandHandler(this);
    }

    async launch(){
        await this.mysql.connect();
        await this.mysql.createDB(); // create database structure
        this.initIPC();

        console.log('Bot connected, db ready!');
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
    }

    query(sql, args){
        return this.mysql.query(sql, args);
    }
}

module.exports = Lootcord;