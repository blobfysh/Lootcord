const Discord               = require('discord.js');
const config                = require('./json/_config.json');
const { connectSQL, query, db } = require('./mysql.js');
const testAPI               = require('./utils/testAPI.js');
const manager               = new Discord.ShardingManager('./app.js', {
    token: config.botToken
});
const voteHandler           = require('./utils/votes.js').votingManager(manager); // Handles DBL webhooks
const patreonHandler        = require('./utils/patreonHandler.js');
const discoinHandler        = require('./utils/discoinHandler').initDiscoin(manager);
const clans                 = require('./methods/clan_methods.js');
const CronJob               = require('cron').CronJob;

manager.spawn(undefined, 25000, false).catch(console.log);

manager.on('launch', shard => {
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
                query(`UPDATE scores SET power = power + 1 WHERE power < max_power AND lastActive > NOW() - INTERVAL 30 DAY;`);
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

async function loopTasks(){
    const rows = await query(`SELECT * FROM clans`);

    for(var i = 0; i< rows.length; i++){
        const members = await clans.getMembers(rows[i].clanId);
        
        if(Math.floor(rows[i].money * (members.count * config.clan_interest_rate)) >= 100000){
            query(`UPDATE clans SET money = money + 100000 WHERE clanId = ${rows[i].clanId} AND money < 10000000`);
        }
        else{
            query(`UPDATE clans SET money = money + FLOOR(money * ${members.count * config.clan_interest_rate}) WHERE clanId = ${rows[i].clanId} AND money < 10000000`);
        }
    }

    query(`UPDATE scores SET power = power - 1 WHERE power > 0 AND lastActive < NOW() - INTERVAL 30 DAY;`);
    query(`DELETE FROM userGuilds USING userGuilds INNER JOIN scores ON userGuilds.userId=scores.userId WHERE scores.lastActive < NOW() - INTERVAL 30 DAY`);
}

var dailyJob = new CronJob('0 0 0 * * *', loopTasks, timeZone = 'America/New-York');

dailyJob.start();
