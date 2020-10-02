const fs = require('fs');
const eventFiles = fs.readdirSync(__dirname + '/events');

class EventHandler {
    constructor(app){
        this.app = app;
        this.events = this.loadEvents();
    }

    async initEvent(message){
        // prevent an event from occuring in the same guild within timeframe
        if(await this.app.cd.getCD(message.channel.guild.id, 'event')) return;

        const rand = Math.random();
        let event;

        if(rand <= 0.1){
            // rare event
            event = this.events.get('airdrop');
        }
        else if(rand <= 0.25){
            event = this.events.get('exploration');
        }
        else if(rand <= 0.4){
            event = this.events.get('trickortreatrare');
        }
        else{
            // common event
            event = this.events.get('trickortreat');
        }

        // prevent further events from happening based on cooldown of current event
        await this.app.cd.setCD(message.channel.guild.id, 'event', event.cooldown);
        
        // start event after 5 seconds so that it seems like the event randomly started
        setTimeout(() => { event.execute(this.app, message) }, 5 * 1000);
    }

    loadEvents(){
        const eventsMap = new Map();

        for(let file of eventFiles){
            const event = require(`./events/${file}`);

            eventsMap.set(event.name, event);
        }
    
        return eventsMap;
    }
}

module.exports = EventHandler;