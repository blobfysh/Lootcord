
class Common {
    constructor(app){
        this.app = app;
        this.icons = app.icons;
    }

    formatNumber(number, noEmoji = false){
        if(noEmoji){
            return "$" + (parseInt(number)).toFixed(0).replace(/\d(?=(\d{3})+$)/g, '$&,');
        }
        else{
            return this.icons.money + " " + (parseInt(number)).toFixed(0).replace(/\d(?=(\d{3})+$)/g, '$&,');
        }
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
     * @param {{cache:boolean}} options Whether or not to retrieve user info using IPC and whether to add user to cache
     */
    async fetchUser(id, options = { cache: true }){
        let user = this.app.bot.users.get(id);

        if(user){
            console.log('[COMMON] Found user in cache');
            return user
        }

        try{
            let IPCuser = await this.app.ipc.fetchUser(id);

            if(IPCuser && options.cache){
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
            console.warn(require('util').inspect(err))
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
            console.error(require('util').inspect(err))
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
    async messageUser(id, message){
        try{
            let user = await this.fetchUser(id, { cache: true });
            let dm = await user.getDMChannel();
            dm.createMessage(message);
        }
        catch(err){
            console.warn('[COMMON] Failed to send message to user: ' + id);
            // user disabled DMs
        }
    }
}

module.exports = Common;