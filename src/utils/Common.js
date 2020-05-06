
class Common {
    constructor(app){
        this.app = app;
        this.icons = app.icons;
    }

    formatNumber(number, noEmoji = false){
        if(noEmoji){
            return (parseInt(number)).toFixed(0).replace(/\d(?=(\d{3})+$)/g, '$&,');
        }
        else{
            return this.icons.money + " " + (parseInt(number)).toFixed(0).replace(/\d(?=(\d{3})+$)/g, '$&,');
        }
    }

    getShortDate(date){
        let convertedTime = new Date(date).toLocaleString('en-US', {
            timeZone: 'America/New_York'
        });
        convertedTime = new Date(convertedTime);
        
        let d = convertedTime;
        let month = d.getMonth() + 1;
        let day = d.getDate();
        let year = d.getFullYear();
        let time = d.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'}).replace(' ', '');
        
        return month + '/' + day + '/' + year.toString().slice(2) + ' ' + time + ' EST';
    }

    async getGuildInfo(guildId){
        let guildInfo = (await this.app.query(`SELECT * FROM guildInfo WHERE guildId = ?`, [guildId]))[0];
        
        if(!guildInfo){
            console.warn('Creating new guildInfo row');
            await this.app.query(`INSERT IGNORE INTO guildInfo (guildId, killChan, levelChan, dropChan, dropItemChan, dropItem, randomOnly) VALUES (?, 0, 0, 0, 0, '', 1)`, [guildId]);
            guildInfo = (await this.app.query(`SELECT * FROM guildInfo WHERE guildId = ?`, [guildId]))[0];
        }
        
        return guildInfo;
    }
    
    calculateXP(playerXP, playerLVL){
        let currLvlXP = 0;
        let xpNeededTotal = 0;

        for(let i = 1; i <= playerLVL; i++){
            xpNeededTotal += Math.floor(50*(i**1.7));
            if(i == playerLVL){
                break;
            }
            currLvlXP += Math.floor(50*(i**1.7));
        }

        // curLvlXp - how much xp player has relative to their level
        
        // needed - xp needed to level up relative to players current points

        // neededForLvl - how much xp is required for next level

        // totalNeeded - the total amount of xp needed to level up, largest because its the sum of all previous levels xp required
        // (this is the raw amount, and isn't shown in any commands, only used for to check if player should level up)

        return {
            curLvlXp: playerXP - currLvlXP,
            needed: xpNeededTotal - playerXP,
            neededForLvl: Math.floor(50*(playerLVL**1.7)),
            totalNeeded: xpNeededTotal
        }
    }

    /**
     * Checks cache on all clusters before making API call
     * @param {string} id ID of user to fetch tag for
     * @param {{cacheIPC:boolean}} options Whether or not to cache IPC user info
     */
    async fetchUser(id, options = { cacheIPC: true, useIPC: true }){
        let user = this.app.bot.users.get(id);
        
        if(user){
            console.log('[COMMON] Found user in cache');
            return user
        }

        try{
            let timeoutId;
            let IPCuser;
            const maxTime = new Promise((resolve, reject) => {
                timeoutId = setTimeout(() => {
                    reject(new Error('no IPC user found.'));
                }, 2000);
            });

            // will try searching IPC for 2 seconds, otherwise return undefined (have to do this because ipc.fetchUser wont return undefined)
            try{
                IPCuser = await Promise.race([maxTime, this.app.ipc.fetchUser(id)]);
            }
            finally{
                clearTimeout(timeoutId);
            }

            if(IPCuser && options.cacheIPC){
                console.log('[COMMON] Found user using IPC and cached it');
                this.app.bot.users.add(IPCuser, this.app.bot, false);

                return this.app.bot.users.get(id);
            }
            else if(IPCuser){
                console.log('[COMMON] Found user using IPC');
                return IPCuser;
            }
        }
        catch(err){
            console.warn(err);
        }
        
        //API call
        try{
            console.log('[COMMON] Made call to API for user');
            user = await this.app.bot.getRESTUser(id);

            if(user){
                // cache user no matter cache option to prevent api spam...
                this.app.bot.users.add(user, this.app.bot, false);

                return user;
            }
        }
        catch(err){
            console.error(err);
            return undefined;
        }
    }

    async fetchMember(guild, id){
        let member = guild.members.get(id);

        if(member){
            console.log('[COMMON] Found member in cache');
            return member;
        }

        try{
            console.log('[COMMON] Made call to API for member');
            member = await guild.getRESTMember(id);

            guild.members.add(member, guild, false);

            return guild.members.get(id);
        }
        catch(err){
            return undefined;
        }
    }

    /**
     * Will DM a user from any cluster
     * @param {*} id ID of user to message
     * @param {*} message Message to DM
     */
    async messageUser(id, message, options = { throwErr: false }){
        try{
            let user = await this.fetchUser(id, { cacheIPC: true });
            let dm = await user.getDMChannel();
            await dm.createMessage(message);
        }
        catch(err){
            console.warn('[COMMON] Failed to send message to user: ' + id);
            if(options.throwErr) throw new Error(err);
            // user disabled DMs
        }
    }

    /**
     * 
     * @param {*} user User object, must contain user ID, avatar and discriminator
     */
    getAvatar(user){
        if(user.avatar){
            return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar.startsWith('a_') ? user.avatar + '.gif' : user.avatar + '.png'}`;
        }
        else{
            return `https://cdn.discordapp.com/embed/avatars/${user.discriminator % 5}.png`;
        }
    }
}

module.exports = Common;