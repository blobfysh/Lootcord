const CronJob = require('cron').CronJob;
const axios = require('axios');

class LoopTasks {
    constructor(cache, config){
        this.cache = cache;
        this.config = config;
        this.hourly = new CronJob('0 * * * *', this.postStats.bind(this), null, false, 'America/New_York');
    }

    start(){
        this.hourly.start();
    }

    async postStats(){
        const stats = JSON.parse(await this.cache.get('stats')) || {};
        
        if(this.config.debug || !stats.guilds || !stats.users) return;

        let completedLists = 0;
        
        for(let botList of this.config.botLists){
            try{
                if(botList.url.includes('top.gg')){
                    const result = await axios({
                        method: 'POST',
                        headers: {
                            'Authorization': botList.token,
                            'Content-Type': 'application/json'
                        },
                        data: {
                            'server_count': stats.guilds
                        },
                        url: botList.url,
                    });
                }
                else{
                    const result = await axios({
                        method: 'POST',
                        headers: {
                            'Authorization': botList.token,
                            'Content-Type': 'application/json'
                        },
                        data: {
                            'guildCount': stats.guilds
                        },
                        url: botList.url,
                    });
                }

                completedLists++;
            }
            catch(err){
                console.warn('Failed posting stats to ' + botList.url);
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