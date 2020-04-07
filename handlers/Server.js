const express      = require('express');
const bodyParser   = require('body-parser');
//const EventEmitter = require('events');
//const DBL          = require('dblapi.js');

class Server {
    constructor(sharder, config){
        this.sharder = sharder;
        this.config = config;
        this.server = express();

        this.server.use(bodyParser.json());
        this.server.use(bodyParser.urlencoded({extended: false}));

        this.launch();
    }

    launch(){
        if(this.config.webhooks.dbl) this.server.post(this.config.webhooks.dbl.path, this._handleDBLVote.bind(this));
        if(this.config.webhooks.kofi) this.server.post(this.config.webhooks.kofi.path, this._handlePatron.bind(this));

        this.server.listen(this.config.serverPort, () => {
            console.log(`[SERVER] Server running on port ${this.config.serverPort}`);
        });
    }

    async _handleDBLVote(req, res){
        if(this.config.serverAuth !== req.headers.authorization) return res.status(403).send('Unauthorized');
        
        if(req.body.user){
            this.sharder.sendTo(0, {
                _eventName: "vote", 
                vote: req.body
            });
        }

        res.status(200).send('Successfully received vote!');
    }

    async _handlePatron(req, res){
        if(this.config.serverAuth !== req.headers.authorization) return res.status(403).send('Unauthorized');

        console.log(req.body.data);

        res.status(200).send();
    }
}

module.exports = Server;