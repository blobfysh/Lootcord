const CronJob = require('cron').CronJob;
const STATUS_LIST = ["Looting {users} players", "{users} loot goblins", "{guilds} servers!", "Join the discord!", "lootcord.com 👀"];

class LoopTasks {
    constructor(app){
        this.app = app;
        this.daily = new CronJob('0 0 0 * * *', () => {this.dailyTasks()}, null, false, 'America/New_York');
        this.biHourly = new CronJob('0 */2 * * *', () => {this.biHourlyTasks()}, null, false, 'America/New_York');
        this.hourly = new CronJob('0 * * * *', () => {this.hourlyTasks()}, null, false, 'America/New_York');
    }

    start(){
        if(this.app.clusterID === 0){
            console.log('Starting daily/bi-hourly tasks...');
            this.daily.start();
            this.biHourly.start();
        }
        
        this.hourly.start();
    }

    async dailyTasks(){
        console.log('[LOOPTASKS] Running daily tasks...');
        // add clan interest
        const clans = await this.app.query(`SELECT clanId, money FROM clans`);

        for(let i = 0; i < clans.length; i++){
            const members = await this.app.clans.getMembers(clans[i].clanId);

            if(Math.floor(clans[i].money * (members.count * this.app.config.clanInterestRate)) >= 100000){
                this.app.query(`UPDATE clans SET money = money + 100000 WHERE clanId = ${rows[i].clanId} AND money < 10000000`);
            }
            else{
                this.app.query(`UPDATE clans SET money = money + FLOOR(money * ${members.count * this.app.config.clanInterestRate}) WHERE clanId = ${clans[i].clanId} AND money < 10000000`);
            }
        }

        // remove 1 power each day for players inactve over a month, down to minimum of 0
        this.app.query(`UPDATE scores SET power = power - 1 WHERE power > 0 AND lastActive < NOW() - INTERVAL 30 DAY`);

        // auto-deactivate players who have not played for 30 days
        this.app.query(`DELETE FROM userGuilds USING userGuilds INNER JOIN scores ON userGuilds.userId = scores.userId WHERE scores.lastActive < NOW() - INTERVAL 30 DAY`);
    }

    biHourlyTasks(){
        console.log('[LOOPTASKS] Running bi-hourly tasks...');
        // add 1 power to all active players every 2 hours
        this.app.query(`UPDATE scores SET power = power + 1 WHERE power < max_power AND lastActive > NOW() - INTERVAL 30 DAY;`);
    }

    async hourlyTasks(){
        const stats = JSON.parse(await this.app.cache.get('stats')) || {};
        
        if(stats.guilds){
            this.app.bot.editStatus('online', {
                name: 't-help | ' + STATUS_LIST[Math.floor(Math.random() * STATUS_LIST.length)].replace('{users}', stats.users).replace('{guilds', stats.guilds),
                type: 0
            });
        }
    }
}

module.exports = LoopTasks;