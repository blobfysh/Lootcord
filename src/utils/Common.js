
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
     * @param {{checkIPC:boolean}} options Whether or not to retrieve user info using IPC
     */
    async fetchUser(id, options = { checkIPC: true }){
        let user = this.app.bot.users.get(id);

        if(user){
            console.log('Found user in cache');
            return user
        }

        if(options.checkIPC){
            try{
                let IPCuser = await this.app.ipc.fetchUser(id);

                if(IPCuser){
                    console.log('Found user using IPC');
                    return IPCuser
                }
            }
            catch(err){
            }
        }
        
        //API call
        try{
            console.log('Had to make API call');
            user = await this.app.bot.getRESTUser(id);

            if(user){
                this.app.bot.users.add(user, this.app.bot, false);

                return user;
            }
        }
        catch(err){
            return undefined;
        }
    }

    async fetchMember(guild, id){
        let member = guild.members.get(id);

        if(member){
            console.log('Found member in cache');
            return member;
        }

        try{
            console.log('Made call to API for member');
            member = await guild.getRESTMember(id);

            guild.members.add(member, guild, false);
        }
        catch(err){
            return undefined;
        }
    }
}

module.exports = Common;