
class Clans {
    constructor(app){
        this.app = app;
    }

    async getMembers(clanId){
        const users = (await this.app.query(`SELECT * FROM scores WHERE clanId = ${clanId}`));
        
        var memberIds = [];

        for(var i = 0; i < users.length; i++){
            memberIds.push(users[i].userId)
        }

        return {
            count: users.length,
            memberIds: memberIds
        }
    }

    async disbandClan(clanId){
        this.app.query(`UPDATE scores SET clanRank = 0 WHERE clanId = ${clanId}`);
        this.app.query(`UPDATE scores SET clanId = 0 WHERE clanId = ${clanId}`);

        this.app.query(`DELETE FROM user_items WHERE userId = ${clanId}`);
        this.app.query(`DELETE FROM clans WHERE clanId = ${clanId}`);
    }

    async getClanData(clanId){
        var currPower = 0;
        var maxPower = 0;
        var kills = 0;
        var deaths = 0;
        var timePlayed = 0;
        const dateTime = new Date().getTime();

        const clanItems = await this.app.itm.getUserItems(clanId);
        const memberRows = (await this.app.query(`SELECT * FROM scores WHERE clanId = ${clanId}`));

        for(var i = 0; i < memberRows.length; i++){
            kills += memberRows[i].kills;
            deaths += memberRows[i].deaths;
            currPower += memberRows[i].power;
            maxPower += memberRows[i].max_power;
            timePlayed += (dateTime - memberRows[i].createdAt);
        }
        
        return {
            usedPower: clanItems.itemCount,
            currPower: currPower,
            maxPower: maxPower,
            kills: kills,
            deaths: deaths,
            playtime: timePlayed
        }
    }

    async hasPower(clanId, amount){
        const clanPower = (await this.getClanData(clanId));

        if((clanPower.currPower - clanPower.usedPower) >= amount){
            return true;
        }
        else{
            return false;
        }
    }

    async hasMoney(clanId, amount){
        const clan = (await this.app.query(`SELECT * FROM clans WHERE clanId = ${clanId}`))[0];

        if(clan.money >= amount){
            return true;
        }
        else{
            return false;
        }
    }

    async removeMoney(clanId, amount){
        await this.app.query(`UPDATE clans SET money = money - ${parseInt(amount)} WHERE clanId = ${clanId}`);
    }

    async addMoney(clanId, amount){
        await this.app,query(`UPDATE clans SET money = money + ${parseInt(amount)} WHERE clanId = ${clanId}`);
    }
}

module.exports = Clans;