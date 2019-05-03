const Discord   = require('discord.js');
const methods   = require('./methods.js');
const { query } = require('../mysql.js');

exports.create_lb = async function(client){
    const moneyRows = await query('SELECT userId, money FROM scores ORDER BY money DESC LIMIT 5');
    const levelRows = await query('SELECT userId, level FROM scores ORDER BY level DESC LIMIT 5');
    const killRows  = await query('SELECT userId, kills FROM scores ORDER BY kills DESC LIMIT 5');

    var leaders      = [];
    var levelLeaders = [];
    var killLeaders  = [];
    var tokenLeaders = [];

    var leaderJSON   = {
        money  : {}, 
        level  : {}, 
        kills  : {},
        tokens : {}
    };

    for(var key in moneyRows){
        try{
            var userInfo = await client.fetchUser(moneyRows[key].userId);
            leaders.push(`💵 **${userInfo.tag}**` + ' - ' + methods.formatMoney(moneyRows[key].money));

            leaderJSON.money[userInfo.username] = {
                data: methods.formatMoney(moneyRows[key].money), 
                avatar: userInfo.avatarURL
            };
        }
        catch(me){
            // if you can...
        }
    }
    for(var key in levelRows){
        try{
            var userInfo = await client.fetchUser(levelRows[key].userId);
            levelLeaders.push(`🔹 **${userInfo.tag}**` + ' - Level :  ' + levelRows[key].level);

            leaderJSON.level[userInfo.username] = {
                data: levelRows[key].level, 
                avatar: userInfo.avatarURL
            };
        }
        catch(err){

        }
    }
    for(var key in killRows){
        try{
            var userInfo = await client.fetchUser(killRows[key].userId);
            killLeaders.push(`🏅 **${userInfo.tag}**` + ' - ' + killRows[key].kills + " kills");

            leaderJSON.kills[userInfo.username] = {
                data: killRows[key].kills, 
                avatar: userInfo.avatarURL
            };
        }
        catch(err){
            
        }
    }

    leaders[0] = leaders[0].replace("💵", "💰");
    levelLeaders[0] = levelLeaders[0].replace("🔹","💠");
    killLeaders[0] = killLeaders[0].replace("🏅","🏆");

    return {
        moneyLB    : leaders,
        levelLB    : levelLeaders,
        killLB     : killLeaders,
        leadersOBJ : leaderJSON
    }
}