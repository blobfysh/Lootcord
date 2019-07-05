const Discord               = require('discord.js');
const config                = require('./json/_config.json');
const { connectSQL, query, db } = require('./mysql.js');
const testAPI               = require('./utils/testAPI.js');
const manager               = new Discord.ShardingManager('./app.js', {
    token: config.botToken
});
const voteHandler           = require('./utils/votes.js').votingManager(manager); // Handles DBL webhooks
const patreonHandler        = require('./utils/patreonHandler.js');

manager.spawn(undefined, 25000, false).catch(console.log);

manager.on('launch', shard => {

    if(shard.id == manager.totalShards - 1){
        console.log('Shards successfully loaded...');

        //set bot status
        setTimeout(() => {
            manager.broadcastEval(`
                this.shard.fetchClientValues('users.size').then(results => {
                    var result = results.reduce((prev, userCount) => prev + userCount, 0);
                    this.user.setActivity('t-help | ' + result + ' looters!', {type: 'LISTENING'});
                    result;
                })
            `);
            patreonHandler.refreshPatrons(manager);

            setInterval(addPower, 7200 * 1000) // 2 hours
        }, 25000);
    }
});

manager.on('message', (shard, message) => {
    if(message._eval !== undefined) console.log(shard.id + " says " + message._eval);
});

process.on('SIGINT', () => {
    console.log('EXITING...');
    db.end(() => {
        process.exit(0);
    });
});

process.on('exit', () => {
    console.log('Ending processes...');
    manager.broadcastEval('process.exit()');
});

/*
process.on('SIGTERM', () => {
    manager.broadcastEval('process.exit()');
});
*/

function addPower(){
    query(`UPDATE scores SET power = power + 1 WHERE power < max_power`);
}