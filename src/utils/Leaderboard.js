
class Leaderboard {
    constructor(app){
        this.app = app;
    }

    async getLB(){
        const moneyRows = await this.app.query('SELECT userId, money, prestige, badge FROM scores ORDER BY money DESC LIMIT 5');
        const levelRows = await this.app.query('SELECT userId, level, prestige, badge FROM scores ORDER BY level DESC LIMIT 5');
        const killRows  = await this.app.query('SELECT userId, kills, prestige, badge FROM scores ORDER BY kills DESC LIMIT 5');
        const clanRows  = await this.app.query('SELECT name, money FROM clans ORDER BY money DESC LIMIT 5');

        let leaders      = [];
        let levelLeaders = [];
        let killLeaders  = [];
        let tokenLeaders = [];
        let clanLeaders  = [];

        let leaderJSON   = {
            money  : {}, 
            level  : {}, 
            kills  : {},
            clans  : {},
            tokens : {}
        };

        for(let key in moneyRows){
            try{
                let user = await this.app.common.fetchUser(moneyRows[key].userId, { cache: false });
                //console.log(require('util').inspect(user));
                leaders.push(`💵 ${this.app.player.getBadge(moneyRows[key].badge)} ${user.username}#${user.discriminator}` + ' - ' + this.app.common.formatNumber(moneyRows[key].money));  
                
                leaderJSON.money[user.username] = {
                    data: this.app.common.formatNumber(moneyRows[key].money, true), 
                    avatar: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=512`
                };
            }
            catch(err){
            }
        }

        for(let key in levelRows){
            try{
                let user = await this.app.common.fetchUser(levelRows[key].userId, { cache: false });
                levelLeaders.push(`🔹 ${this.app.player.getBadge(levelRows[key].badge)} ${user.username}#${user.discriminator}` + ' - Level  ' + levelRows[key].level);

                leaderJSON.level[user.username] = {
                    data: levelRows[key].level, 
                    avatar: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=512`
                };
            }
            catch(err){
            }
        }

        for(let key in killRows){
            try{
                let user = await this.app.common.fetchUser(killRows[key].userId, { cache: false });
                killLeaders.push(`🏅 ${this.app.player.getBadge(killRows[key].badge)} ${user.username}#${user.discriminator}` + ' - ' + killRows[key].kills + " kills");

                leaderJSON.kills[user.username] = {
                    data: killRows[key].kills, 
                    avatar: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=512`
                };
            }
            catch(err){
            }
        }

        for(var i = 0; i < clanRows.length; i++){
            try{
                clanLeaders.push(`🗡 \`${clanRows[i].name}\`` + ' - ' + this.app.common.formatNumber(clanRows[i].money));

                leaderJSON.clans[clanRows[i].name] = {
                    data: this.app.common.formatNumber(clanRows[i].money, true),
                    avatar: 'https://cdn.discordapp.com/attachments/542248243313246208/603306945373405222/clan-icon.png'
                };
            }
            catch(err){
            }
        }

        leaders[0] = leaders[0].replace("💵", "💰");
        levelLeaders[0] = levelLeaders[0].replace("🔹","💠");
        killLeaders[0] = killLeaders[0].replace("🏅","🏆");
        clanLeaders[0] = clanLeaders.length ? clanLeaders[0].replace('🗡', '⚔') : 'No clans';

        return {
            moneyLB    : leaders,
            levelLB    : levelLeaders,
            killLB     : killLeaders,
            clanLB     : clanLeaders,
            leadersOBJ : leaderJSON
        }
    }
}

module.exports = Leaderboard;