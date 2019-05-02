const config = require('../json/_config.json');

const Discord = require('discord.js');
const DBL = require('dblapi.js');
const dbl = new DBL(config.dblToken, {webhookPath: config.dblWebhookPath, webhookPort: config.dblWebhookPort, webhookAuth: config.dblAuth});

/*var manager

dbl.webhook.on('ready', hook => {
    console.log(`Webhook runnning at ${hook.path}`);
});

dbl.webhook.on('vote', vote => {
    manager.broadcastEval(`
    if(this.shard.id === 0){
        this.fetchUser('168958344361541633').then(voterUser => {
            voterUser.send('yoyo I received a vote from ${vote.user}');
            true
        }).catch(err => {
            false;
        });
    }
    `).then(console.log);
});
*/

exports.votingManager = (manager) => {

    dbl.webhook.on('ready', hook => {
        console.log(`Webhook runnning at ${hook.path}`);
    });
    
    dbl.webhook.on('vote', vote => {
        manager.broadcastEval(`
            if(this.shard.id === 0){
                this.fetchUser('168958344361541633').then(voterUser => {
                    voterUser.send('yoyo I received a vote from ${vote.user}');
                    true
                }).catch(err => {
                    false;
                });
            }
            else{
                false;
            }
        `).then(console.log).catch(err => {
            console.log('there was an error in the voting file: ' + err);
        });
    });
}
