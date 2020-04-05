const fs = require('fs');
const DBL = require('dblapi.js');

const events = fs.readdirSync(__dirname + '/events');

class Webhooks {
    constructor(app){
        this.app = app;
    }

    launch(){
        this.dbl = new DBL(this.app.config.dblToken, {
            webhookPath: this.app.config.dblWebhookPath,
            webhookPort: this.app.config.dblWebhookPort,
            webhookAuth: this.app.config.dblAuth
        });

        console.log('[WEBHOOKS] Listening for events');
        for(let event of events){
            this.dbl.webhook.on(event.replace('.js', ''), require(`./events/${event}`).run.bind(this));
        }
    }
}

module.exports = Webhooks;