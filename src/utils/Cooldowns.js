const bt = require('big-time');

class Cooldown {
    constructor(app){
        this.app = app;
        this.timers = [];
    }

    /**
     * Sets a cooldown of specified type
     * 
     * @param {string} userId User to give cooldown, does not have to be a user ID.
     * @param {string} type Type of cooldown
     * @param {number} time Time in milliseconds cooldown lasts
     * @param {{ignoreQuery: boolean, armor: string}} options ignoreQuery is only used when bot starting up to prevent multiple table entries
     * @param {function()} callback Callback to run when finished
     */
    async setCD(userId, type, time, options = { ignoreQuery: false, armor: undefined }, callback = undefined){
        let key = `${type}|${userId}`;
        options.ignoreQuery = options.ignoreQuery || false;

        if(!options.ignoreQuery && await this.app.cache.get(key)) return false;

        let seconds = Math.round(time / 1000);

        // this is where the cooldown is actually set
        await this.app.cache.set(key, options.armor ? options.armor : 'Set at ' + (new Date().toLocaleString('en-US', {timeZone: 'America/New_York'})), seconds);
        
        // add cooldown to cooldown table for persistence (if server were to shut down, this table would be used to set cooldowns for all players)
        if(!options.ignoreQuery) await this.app.mysql.query(`INSERT INTO cooldown (userId, type, start, length, info) VALUES (?, ?, ?, ?, ?)`, [userId, type, new Date().getTime(), time, options.armor ? options.armor : '']);

        let timeObj = {
            userId: userId, 
            type: type,
            timer: bt.setTimeout(() => {
                this.app.mysql.query(`DELETE FROM cooldown WHERE userId = ${userId} AND type = '${type}'`);

                if(type === 'patron'){
                    // do patron stuff
                    this.app.mysql.query(`DELETE FROM user_items WHERE userId = '${userId}' AND item = 'kofi_king'`);
                    this.app.mysql.query(`UPDATE scores SET banner = 'none' WHERE userId = '${userId}' AND banner = 'kofi_king'`);
                    this.app.ipc.broadcast('removeKofiRole', { guildId: this.app.config.supportGuildID, userId: userId });
                    
                    const donateEmbed = new this.app.Embed()
                    .setTitle('Perks Ended')
                    .setColor(16734296)
                    .setThumbnail('https://pbs.twimg.com/profile_images/1207570720034701314/dTLz6VR2_400x400.jpg')
                    .setDescription(`\`${userId}\`'s donator perks expried.`)

                    this.app.messager.messageLogs(donateEmbed);
                }
                else if(type === 'banned'){
                    this.app.mysql.query(`DELETE FROM banned WHERE userId = '${userId}'`);
                }

                typeof callback === 'function' && callback();

                this.app.cache.del(key);
                this.clearTimers(userId, type);
            }, (seconds * 1000) - 1000)
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
     * @param {{getEstimate:boolean}} options Options
     */
    async getCD(userId, type, options = { getEstimate: false }){
        let key = `${type}|${userId}`;
        let endTime = await this.app.cache.getTTL(key, {getEPOCH: true});

        // return undefined if user is not on cooldown
        if(!endTime) return undefined;
        if(endTime === -1) return options.getEstimate ? 'in a really long time' : 'Permanently';
        
        const duration = endTime - Date.now();

        if(options.getEstimate){
            let oneHour = 1000 * 60 * 60;
            
            if(duration < 1000 * 60 * 15){
                return 'very soon';
            }
            else if(duration < oneHour){
                return 'within the hour';
            }
            else if(duration < oneHour * 2){
                return 'in less than 2 hours';
            }
            else{
                return 'in about ' + Math.floor(duration / oneHour) + ' hours';
            }
        }

        return this.convertTime(duration);
    }

    async clearTimers(userId, type){
        for(let i = 0; i < this.timers.length; i++){
            if(this.timers[i].userId == userId && this.timers[i].type == type){
                console.log('Clearing timers for ' + userId + ' | ' + type);
                bt.clearTimeout(this.timers[i].timer);

                this.timers.splice(i, 1);
            }
        }
    }

    async clearCD(userId, type){
        await this.app.mysql.query(`DELETE FROM cooldown WHERE userId = '${userId}' AND type = '${type}'`);
        await this.app.ipc.broadcast('clearCD', { userId: userId, type: type }); // sends message to all shards to clear cooldown timers (stops the setTimeout from running)
        await this.app.cache.del(`${type}|${userId}`); // delete key from cache, this is what actually stops the cooldown shown in commands
    }

    convertTime(ms){
        let remaining = ms;
        let finalStr = [];

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
            finalStr.push(days == 1 ? days + ' day' : days + ' days');
        }
        if(hours > 0){
            if(days > 0){
                finalStr.push(rawHours.toFixed(1) + ' hours');
                return finalStr.join(' ');
            }
            else finalStr.push(hours == 1 ? `${hours} hour` : `${hours} hours`);
        }
        if(minutes > 0){
            if(hours > 0 || days > 0){
                finalStr.push(rawMinutes.toFixed(1) + ' minutes');
                return finalStr.join(' ');
            }
            else finalStr.push(minutes == 1 ? `${minutes} minute` : `${minutes} minutes`);
        }

        if(seconds !== 0) finalStr.push(seconds == 1 ? `${seconds} second` : `${seconds} seconds`);
        return finalStr.join(' ');
    }
}

module.exports = Cooldown;