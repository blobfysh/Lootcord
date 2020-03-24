
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

        for(let i = 1; i <= playerLVL; i++){
            if(i == playerLVL){
                break;
            }
            currLvlXP += Math.floor(50*(i**1.7));
        }

        return {
            current: playerXP - currLvlXP,
            needed: Math.floor(50 * (playerLVL ** 1.7))
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