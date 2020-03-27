const EventEmitter = require('events').EventEmitter;

class MessageCollector {
    constructor(app) {
        this.app = app;
        this.collectors = {};
        this.listener = (message) => this.verify(message);

        this.app.bot.on('messageCreate', this.listener);
    }

    verify(msg){
        if(msg.author.bot) return;

        const collectorObj = this.collectors[`${msg.channel.id}`];
        const userCollectorObj = this.collectors[`${msg.author.id}_${msg.channel.id}`];

        // check if any collectors exist...
        if(!collectorObj && !userCollectorObj) return;

        // check if message passes the collector filters
        if(collectorObj && collectorObj.filter(msg)){
            collectorObj.collector.emit('collect', msg);
        }

        if(userCollectorObj && userCollectorObj.filter(msg)){
            userCollectorObj.collector.emit('collect', msg);
        }
    }

    /**
     * Collects messages from all users in a channel
     * @param {*} message Discord message object
     * @param {*} filter custom filter options
     * @param {*} options options.time - time in milliseconds collector should last
     */
    createChannelCollector(message, filter, options = { time: 15000 }){
        // check if a collector already exists on this channel
        if(this.collectors[`${message.channel.id}`]){
            throw new Error('Overlapping collectors should be handled gracefully. You should be checking if a collector already exists before creating a new one.');
        }

        const eventCollector = new EventEmitter();
        let timer;

        if(options.time){
            timer = setTimeout(() => {
                eventCollector.emit('end', 'time');
                delete this.collectors[`${message.channel.id}`];
            }, options.time);
        }

        this.collectors[`${message.channel.id}`] = {
            timer: timer,
            collector: eventCollector,
            filter: filter
        };
    }

    /**
     * Collects messages from a user in a channel, allows multiple collectors in the same channel for different users
     * @param {*} message Discord message object
     * @param {*} filter custom filter options
     * @param {*} options options.time - time in milliseconds collector should last
     */
    createUserCollector(message, filter, options = { time: 15000 }){
        // check if a collector already exists for this user on this channel
        if(this.collectors[`${message.author.id}_${message.channel.id}`]){
            throw new Error('Overlapping collectors should be handled gracefully. You should be checking if a collector already exists before creating a new one.');
        }

        const eventCollector = new EventEmitter();
        let timer;

        if(options.time){
            timer = setTimeout(() => {
                eventCollector.emit('end', 'time');
                delete this.collectors[`${message.author.id}_${message.channel.id}`];
            }, options.time);
        }

        this.collectors[`${message.author.id}_${message.channel.id}`] = {
            timer: timer,
            collector: eventCollector,
            filter: filter
        };
    }

    /**
     * Clears timeout for collector and stops it
     * @param {string} key Key of collector to remove, can be channel ID or User ID + channel ID
     */
    stopCollector(key){
        if(this.collectors[key]){
            clearTimeout(this.collectors[key].timer);
            this.collectors[key].collector.emit('end', 'forced');
            delete this.collectors[key];
        }
    }
}

module.exports = MessageCollector;