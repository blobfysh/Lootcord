const EventEmitter = require('events').EventEmitter;

class MessageCollector {
    constructor(app) {
        this.app = app;
        this.channelCollectors = [];
        this.userCollectors = [];

        this.app.bot.on('messageCreate', this.verify.bind(this));

        setInterval(() => {
            for(let c of this.channelCollectors){
                if(c.maxLength && Date.now() - c.maxLength > c.startedAt){
                    c.collector.emit('end', 'time');
                    this.channelCollectors.splice(this.channelCollectors.indexOf(c), 1);
                }
            }
            for(let c of this.userCollectors){
                if(c.maxLength && Date.now() - c.maxLength > c.startedAt){
                    c.collector.emit('end', 'time');
                    this.userCollectors.splice(this.userCollectors.indexOf(c), 1);
                }
            }
        }, 1000);
    }

    verify(msg){
        if(msg.author.bot) return;

        const channelCollectors = this.channelCollectors.filter(obj => obj.channelId === msg.channel.id);
        const userCollectors = this.userCollectors.filter(obj => obj.channelId === msg.channel.id && obj.userId === msg.author.id);

        for(let obj of channelCollectors){
            if(obj.filter(msg)){
                obj.collector.emit('collect', msg);
            }
        }

        for(let obj of userCollectors){
            if(obj.filter(msg)){
                obj.collector.emit('collect', msg);
                obj.collected.push(msg);

                if(obj.maxMatches && obj.collected.length >= obj.maxMatches){
                    this.stopCollector(obj, obj.collected);
                }
            }
        }
    }

    /**
     * Collects messages from all users in a channel
     * @param {*} message Discord message object
     * @param {*} filter custom filter options
     * @param {*} options options.time - time in milliseconds collector should last
     */
    createChannelCollector(message, filter, options = { time: 15000 }){
        const eventCollector = new EventEmitter();

        const collectorObj = {
            channelId: message.channel.id,
            startedAt: Date.now(),
            maxLength: options.time || undefined,
            collector: eventCollector,
            filter
        }

        this.channelCollectors.push(collectorObj);

        return collectorObj;
    }

    /**
     * Collects messages from a user in a channel, allows multiple collectors in the same channel for different users
     * @param {*} message Discord message object
     * @param {*} filter custom filter options
     * @param {*} options options.time - time in milliseconds collector should last
     */
    createUserCollector(userId, channelId, filter, options = { time: 15000, maxMatches: undefined }){
        const eventCollector = new EventEmitter();

        const collectorObj = {
            userId,
            channelId,
            startedAt: Date.now(),
            maxLength: options.time || undefined,
            collector: eventCollector,
            collected: [],
            maxMatches: options.maxMatches,
            filter
        }

        this.userCollectors.push(collectorObj);

        return collectorObj;
    }

    awaitMessages(userId, channelId, filter, options = { time: 15000, maxMatches: 1 }){
        const collectorObj = this.createUserCollector(userId, channelId, filter, options);

        return new Promise((resolve) => {
            collectorObj.collector.on('end', resolve)
        });
    }

    /**
     * Clears timeout for collector and stops it
     * @param {*} collectorObj Collector to remove
     */
    stopCollector(collectorObj, message = 'forced'){
        if(this.userCollectors.includes(collectorObj)){
            collectorObj.collector.emit('end', message);
            this.userCollectors.splice(this.userCollectors.indexOf(collectorObj), 1);
        }
        else if(this.channelCollectors.includes(collectorObj)){
            collectorObj.collector.emit('end', message);
            this.channelCollectors.splice(this.channelCollectors.indexOf(collectorObj), 1);
        }
    }
}

module.exports = MessageCollector;