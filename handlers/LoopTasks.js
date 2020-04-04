const CronJob = require('cron').CronJob;
const axios = require('axios');

class LoopTasks {
    constructor(cache, config){
        this.cache = cache;
        this.config = config;
        this.hourly = new CronJob('0 * * * *', () => {this.postStats()}, null, false, 'America/New_York');
    }

    start(){
        this.hourly.start();
    }

    async postStats(){
        const stats = JSON.parse(await this.app.cache.get('stats')) || {};
        
        if(this.config.debug || !stats.guilds || !stats.users) return;

        let completedLists = 0;
        
        for(let botList of this.config.botLists){
            try{
                if(botList.url.includes('top.gg')){
                    const result = await axios({
                        method: 'POST',
                        headers: {
                            Authorization: botList.token
                        },
                        data: {
                            server_count: stats.guilds
                        },
                        url: botList.url,
                    });
                }
                else{
                    const result = await axios({
                        method: 'POST',
                        headers: {
                            Authorization: botList.token
                        },
                        data: {
                            guilds: stats.guilds,
                            users: stats.users
                        },
                        url: botList.url,
                    });
                }

                completedLists++;
            }
            catch(err){
                console.error(require('util').inspect(err));
            }
        }

        console.log('Posted stats to ' + completedLists + ' bot lists.');
        /*
        for(let cluster of stats.clusters){
            for(let shard of cluster.shardStats){
                for(let botList of this.config.botLists){
                    // post shard stats
                }
            }
        }
        */
    }
}

module.exports = LoopTasks;