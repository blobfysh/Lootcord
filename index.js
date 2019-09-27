const Discord               = require('discord.js');
const config                = require('./json/_config.json');
const { connectSQL, query, db } = require('./mysql.js');
const testAPI               = require('./utils/testAPI.js');
const manager               = new Discord.ShardingManager('./app.js', {
    token: config.botToken
});
const voteHandler           = require('./utils/votes.js').votingManager(manager); // Handles DBL webhooks
const patreonHandler        = require('./utils/patreonHandler.js');
const clans                 = require('./methods/clan_methods.js');

manager.spawn(undefined, 25000, false).catch(console.log);

manager.on('launch', shard => {
    startInterval();
    if(shard.id == manager.totalShards - 1){
        console.log('[INDEX] Shards successfully loaded...');

        //set bot status
        setTimeout(() => {
            manager.broadcastEval(`
                this.shard.fetchClientValues('guilds.size').then(results => {
                    var result = results.reduce((prev, guildCount) => prev + guildCount, 0);
                    this.user.setActivity('t-help | ' + result + ' Loot Dungeons', {type: 'LISTENING'});
                    result;
                })
            `);
            if(!config.debug) patreonHandler.refreshPatrons(manager);

            setInterval(() => {
                query(`UPDATE scores SET power = power + 1 WHERE power < max_power`);
            }, 7200 * 1000) // 2 hours
        }, 25000);
    }
});

manager.on('message', (shard, message) => {
    if(message._eval !== undefined) console.log('[INDEX] Shard ' + shard.id + " executed: " + message._eval);
});

process.on('SIGINT', () => {
    console.log('[INDEX] EXITING...');
    db.end(() => {
        process.exit(0);
    });
});

process.on('exit', () => {
    console.log('[INDEX] Ending processes...');
    manager.broadcastEval('process.exit()');
});

/*
process.on('SIGTERM', () => {
    manager.broadcastEval('process.exit()');
});
*/

async function startInterval(){
    const convertedTime = new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York'
    }); // America/Los_Angeles
    const curTime = new Date(convertedTime);
        
    var timeTill12 = new Date(curTime.getUTCFullYear(), 
        curTime.getUTCMonth(), 
        curTime.getUTCDate(),
        0) - curTime;

    if(timeTill12 < 0){
        timeTill12 += 86400000;
    }

    console.log('[INDEX] '+ (timeTill12 / (1000 * 60 * 60)).toFixed(1) + ' Hrs until 12AM interval loops.');
    setTimeout(loopTasks, timeTill12);
}

async function loopTasks(){
    const rows = await query(`SELECT * FROM clans`);

    for(var i = 0; i< rows.length; i++){
        const members = await clans.getMembers(rows[i].clanId);

        query(`UPDATE clans SET money = money + FLOOR(money * ${members.count * config.clan_interest_rate}) WHERE clanId = ${rows[i].clanId}`);
    }

    query(`DELETE FROM userGuilds USING userGuilds INNER JOIN scores ON userGuilds.userId=scores.userId WHERE scores.lastActive < NOW() - INTERVAL 30 DAY`);

    startInterval();
}
