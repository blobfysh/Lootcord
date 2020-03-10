const Discord = require("discord.js");
const { query } = require('../mysql.js');
const config = require('../json/_config.json');
const itemdata = require("../json/completeItemList");
const methods = require('./methods.js');
//const fs = require("fs");

class Methods {
    async getMembers(clanId){
        const users = (await query(`SELECT * FROM scores WHERE clanId = ${clanId}`));
        
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
        query(`UPDATE scores SET clanRank = 0 WHERE clanId = ${clanId}`);
        query(`UPDATE scores SET clanId = 0 WHERE clanId = ${clanId}`);

        query(`DELETE FROM user_items WHERE userId = ${clanId}`);
        query(`DELETE FROM clans WHERE clanId = ${clanId}`);
    }

    async getClanData(clanId){
        var currPower = 0;
        var maxPower = 0;
        var kills = 0;
        var deaths = 0;
        var timePlayed = 0;
        const dateTime = new Date().getTime();

        const clanItems = await methods.getuseritems(clanId, {amounts: true, countBanners: true});
        const memberRows = (await query(`SELECT * FROM scores WHERE clanId = ${clanId}`));

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
        const clan = (await query(`SELECT * FROM clans WHERE clanId = ${clanId}`))[0];

        if(clan.money >= amount){
            return true;
        }
        else{
            return false;
        }
    }

    async removeMoney(clanId, amount){
        query(`UPDATE clans SET money = money - ${parseInt(amount)} WHERE clanId = ${clanId}`);
    }

    async addMoney(clanId, amount){
        query(`UPDATE clans SET money = money + ${parseInt(amount)} WHERE clanId = ${clanId}`);
    }

    async addLog(clanId, details){
        query(`INSERT IGNORE INTO clan_logs (clanId, details, logTime, logDate) VALUES (?, ?, ?, NOW())`, [clanId, details, new Date().getTime()]);
    }
}

module.exports = new Methods();