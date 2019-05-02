const Discord = require('discord.js');
const config = require('./json/_config.json');
const manager = new Discord.ShardingManager('./app.js', {
    token: config.botToken
});
const { connectSQL, query } = require('./mysql.js');
const voteHandler = require('./utils/votes.js').votingManager(manager); // Handles DBL webhooks

manager.spawn(3);

manager.on('launch', shard => {
    //console.log(`Launched shard ${shard.id}`);

    if(shard.id == manager.totalShards - 1){
        console.log('Shards successfully loaded...');
        
        //set bot status
        setTimeout(() => {
            manager.broadcastEval(`this.shard.fetchClientValues('guilds.size').then(results => {
                var result = results.reduce((prev, guildCount) => prev + guildCount, 0);
                this.user.setActivity('t-help | ' + result + ' servers!', {type: 'LISTENING'});
                result;
            })`).then(console.log);
        }, 5000);
    }
});

manager.on('message', (shard, message) => {
    //if(message._eval.startsWith('const test')) return;
    console.log(shard.id + " says " + message._eval);

    /*--------WARNING---CAUSES HEAVY SPAM--------
    manager.broadcastEval(`const test = true;
        const channel = this.channels.get('${config.logChannel}');

        if(channel){
            channel.send({embed: {
                description: "${message._eval}",
                }
            });
            true;
        }
        else{
            false;
        }
    `);
    */
});

process.on('exit', () => {
    console.log('Ending process...');
    manager.broadcastEval('process.exit(0)');
});

function refreshAirdrops(){
    // Decided to move this into each shard's start-up instead of here because it might take long for all the shards to launch and this code has to wait until all shards have launched before it can give users cooldowns.
    
    query(`SELECT * FROM guildInfo`).then(rows => {
        let airdropsCalled = 0;
        rows.forEach((guild) => {
            if(guild.guildId !== undefined && guild.guildId !== null && guild.dropChan !== 0){
                airdropper.initAirdrop(client, guild.guildId);
            }
        });
        console.log(airdropsCalled + " airdrops called.")
    });
}