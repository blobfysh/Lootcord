const CronJob = require('cron').CronJob;
const STATUS_LIST = [
    "Looting {users} players", 
    "{users} loot goblins", 
    "{guilds} servers!", 
    "Join the discord!", 
    "lootcord.com 👀"
];

class LoopTasks {
    constructor(app){
        this.app = app;
        this.daily = new CronJob('0 0 0 * * *', this.dailyTasks.bind(this), null, false, 'America/New_York');
        this.biHourly = new CronJob('0 */2 * * *', this.biHourlyTasks.bind(this), null, false, 'America/New_York');
        this.hourly = new CronJob('0 * * * *', this.hourlyTasks.bind(this), null, false, 'America/New_York');

        // every 3 minutes
        this.often = new CronJob('*/3 * * * *', this.frequentTasks.bind(this), null, false, 'America/New_York');
    }

    start(){
        if(this.app.clusterID === 0){
            console.log('[LOOPTASKS] Starting daily/bi-hourly tasks...');
            this.daily.start();
            this.biHourly.start();
            this.often.start();
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
                this.app.query(`UPDATE clans SET money = money + 100000 WHERE clanId = ${clans[i].clanId} AND money < 10000000`);
            }
            else{
                this.app.query(`UPDATE clans SET money = money + FLOOR(money * ${members.count * this.app.config.clanInterestRate}) WHERE clanId = ${clans[i].clanId} AND money < 10000000`);
            }
        }

        // remove old logs
        this.app.query(`DELETE FROM clan_logs WHERE logDate < NOW() - INTERVAL 30 DAY`);

        // remove old transactions
        this.app.query(`DELETE FROM transactions WHERE date < NOW() - INTERVAL 30 DAY`);

        // auto-deactivate players who have not played for 14 days
        this.app.query(`DELETE FROM userGuilds USING userGuilds INNER JOIN scores ON userGuilds.userId = scores.userId WHERE scores.lastActive < NOW() - INTERVAL 14 DAY`);
    }

    async biHourlyTasks(){
        console.log('[LOOPTASKS] Running bi-hourly tasks...');
        // add 1 power to all active players every 2 hours
        await this.app.query(`UPDATE scores SET power = power + 1 WHERE power < max_power AND lastActive > NOW() - INTERVAL 30 DAY;`);
        
        // remove 1 power for players inactve over a month, down to minimum of 0
        await this.app.query(`UPDATE scores SET power = power - 1 WHERE power > 0 AND lastActive < NOW() - INTERVAL 30 DAY`);

        // clean up cooldown table
        this.app.query(`DELETE FROM cooldown WHERE UNIX_TIMESTAMP() * 1000 > start + length`);
    }

    async hourlyTasks(){
        const stats = JSON.parse(await this.app.cache.get('stats')) || {};
        
        if(this.app.bot.shards.get([...this.app.bot.shards][0][0]).presence.game.type === 2) return;

        if(stats.guilds){
            this.app.bot.editStatus('online', {
                name: 't-help | ' + STATUS_LIST[Math.floor(Math.random() * STATUS_LIST.length)].replace('{users}', this.app.common.formatNumber(stats.users, true)).replace('{guilds}', this.app.common.formatNumber(stats.guilds, true)),
                type: 0
            });
        }
    }

    async frequentTasks(){
        if(!this.app.config.debug && this.app.clusterID === 0){
            this._handleDiscoinTransactions();
        }
    }

    async _handleDiscoinTransactions(){
        try{
            const unhandled = await this.app.discoin.getUnhandled();
            let logTransactions = [];

            for(let i = 0; i < unhandled.data.length; i++){
                let transaction = unhandled.data[i];
                let payout = Math.round(transaction.payout);
                
                let userRow = await this.app.player.getRow(transaction.user);
                await this.app.discoin.handle(transaction.id);
    
                if(!userRow){
                    // create account for user if they dont have one
                    await this.app.player.createAccount(transaction.user);

                    userRow = await this.app.player.getRow(transaction.user);
                }

                this.app.player.addMoney(transaction.user, payout);
    
                const embed = new this.app.Embed()
                .setTitle('Conversion Successful')
                .setThumbnail('https://cdn.discordapp.com/attachments/497302646521069570/662369574720765994/spaces2F-LQzahLixLnvmbDfQ1K02Favatar.png')
                .setDescription(`You received ${this.app.common.formatNumber(payout)} (${transaction.payout} rounded) through Discoin! [Click this to see more details.](https://dash.discoin.zws.im/#/transactions/${transaction.id}/show)`)
                .setColor(13215302)

                this.app.common.messageUser(transaction.user, embed);

                const logEmbed = new this.app.Embed()
                .setTitle('Discoin Conversion')
                .setDescription(`${transaction.from.name}(${transaction.from.id}) to Lootcoin\n\n[Link](https://dash.discoin.zws.im/#/transactions/${transaction.id}/show)`)
                .addField('Lootcoin Payout', this.app.common.formatNumber(payout), true)
                .addField('User', transaction.user)
                .setFooter(`Transaction ID: ${transaction.id}`)
                .setColor(13215302)

                logTransactions.push(logEmbed);
            }
    
            if(logTransactions.length) this.app.messager.messageLogs(logTransactions);
            console.log('[DISCOIN] Successfully handled ' + unhandled.data.length + ' transactions.');
        }
        catch(err){
            console.log('[DISCOIN] API error:');
            console.log(err);
        }
    }
}

module.exports = LoopTasks;