const express      = require('express');
const bodyParser   = require('body-parser');
//const EventEmitter = require('events');
//const DBL          = require('dblapi.js');

class Webhooks {
    constructor(sharder, config){
        this.sharder = sharder;
        this.config = config;
        this.server = express();

        this.server.use(bodyParser.json());
        this.server.use(bodyParser.urlencoded({extended: false}));

        this.launch();
    }

    launch(){
        this.server.post(this.config.dblWebhookPath, this.handleDBLVote.bind(this));

        this.server.listen(this.config.dblWebhookPort, () => {
            console.log(`[WEBHOOKS] Webhook running on port ${this.config.dblWebhookPort}`);
        });
    }

    async handleDBLVote(req, res){
        if(this.config.dblAuth !== req.headers.authorization) return res.status(403).send('Unauthorized');
        
        if(req.body.user){
            this.sharder.sendTo(0, {
                _eventName: "vote", 
                vote: req.body
            });
        }

        res.status(200).send('Successfully received vote!');
    }
}

module.exports = Webhooks;