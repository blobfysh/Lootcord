
class Cooldown {
    constructor(app){
        this.app = app;
        this.timers = [];
    }

    /**
     * Gives player a cooldown of specified type
     * 
     * @param {string} userId User to give cooldown, does not have to be a user ID.
     * @param {string} type Type of cooldown
     * @param {number} time Time in milliseconds cooldown lasts
     * @param {{ignoreQuery: boolean}} options ignoreQuery is only used when bot starting up to prevent multiple table entries
     */
    async setCD(userId, type, time, options = { ignoreQuery: false }){
        let key = `${type}|${userId}`;

        if(!options.ignoreQuery && await this.app.cache.get(key)) return false;

        let seconds = Math.round(time / 1000);

        // this is where the cooldown is actually set
        await this.app.cache.set(key, 'Set at ' + (new Date().toLocaleString('en-US', {timeZone: 'America/New_York'})), seconds);
        
        // add cooldown to cooldown table for persistence (if server were to shut down, this table would be used to set cooldowns for all players)
        if(!options.ignoreQuery) await this.app.mysql.query(`INSERT INTO cooldown (userId, type, start, length) VALUES (?, ?, ?, ?)`, [userId, type, new Date().getTime(), time]);

        let timeObj = {
            userId: userId, 
            type: type, 
            timer: setTimeout(() => {
                console.log(`[COOLDOWNS] Deleted ${userId} from '${type}' cooldown`);
                this.app.mysql.query(`DELETE FROM cooldown WHERE userId = ${userId} AND type = '${type}'`);
            }, seconds * 1000)
        };

        // adding to timers array allows me to cancel the timer in the future (ex. player unequips shield, need to be able to cancel shield timeOut)
        this.timers.push(timeObj);

        return 'Success';
    }

    /**
     * Retrieves a players cooldown for specified type and prettifies it
     * 
     * @param {string} userId User to get cooldown for
     * @param {string} type Type of cooldown to look for
     */
    async getCD(userId, type){
        let key = `${type}|${userId}`;
        let endTime = await this.app.cache.getTTL(key, {getEPOCH: true});

        // return undefined if user is not on cooldown
        if(!endTime) return undefined;

        return this.convertTime(endTime - Date.now());
    }

    async clearTimers(userId, type){
        console.log('Clearing timers for ' + userId + ' | ' + type);
        let key = `${type}|${userId}`;
        this.app.cache.del(key);

        this.timers.forEach(obj => {
            if(obj.userId == userId && obj.type == type){
                console.log('Successfully found timer and cleared it.');
                clearTimeout(obj.timer);

                this.timers.splice(this.timers.indexOf(obj), 1);
            }
        });
    }

    async clearCD(userId, type){
        let key = `${type}|${userId}`;
        this.app.mysql.query(`DELETE FROM cooldown WHERE userId = '${userId}' AND type = '${type}'`);
        this.app.ipc.broadcast('clearCD', { userId: userId, type: type }); // sends message to all shards to clear cooldown timers (stops the setTimeout from running)
        this.app.cache.del(key); // delete key from cache, this is what actually stops the cooldown shown in commands
    }

    convertTime(ms){
        let remaining = ms;
        let finalStr = '';

        let rawDays = remaining / (1000 * 60 * 60 * 24);
        let days = Math.floor(rawDays);
        remaining %= 1000 * 60 * 60 * 24;

        let rawHours = remaining / (1000 * 60 * 60);
        let hours = Math.floor(rawHours);
        remaining %= 1000 * 60 * 60;

        let rawMinutes = remaining / (1000 * 60);
        let minutes = Math.floor(rawMinutes);
        remaining %= 1000 * 60;
        
        let seconds = Math.floor(remaining / 1000);
        
        if(days > 0){
            finalStr += days == 1 ? days + ' day ' : days + ' days ';
        }
        if(hours > 0){
            if(days > 0) return finalStr += rawHours.toFixed(1) + ' hours';
            else finalStr += hours == 1 ? hours + ' hour ' : hours + ' hours ';
        }
        if(minutes > 0){
            if(hours > 0) return finalStr += rawMinutes.toFixed(1) + ' minutes';
            else finalStr += minutes == 1 ? minutes + ' minute ' : minutes + ' minutes ';
        }

        return finalStr += seconds == 1 ? seconds + ' second' : seconds + ' seconds';
    }
}

module.exports = Cooldown;