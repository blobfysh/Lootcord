const Discord   = require('discord.js');
const { query } = require('../mysql.js');
const methods   = require('../methods/methods.js');
const globalLB  = require('../methods/global_leaderboard.js');
const general   = require('../methods/general');
const cache     = require('../utils/cache');
const icons     = require('../json/icons');

module.exports = {
    name: 'leaderboard',
    aliases: ['lb'],
    description: 'Show the best players overall or in the current server.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        if(args[0] == 'g' || args[0] == 'global'){
            const leaders = await getGlobalLB(message.client);

            const embedLeader = new Discord.RichEmbed() 
            .setTitle(`**Global Leaderboard**`)
            .setColor(0)
            .addField("Money", leaders.moneyLB)
            .addField("Level", leaders.levelLB)
            .addField("Kills", leaders.killLB)
            .addField("Richest Clans", leaders.clanLB)
            .setFooter("Top 5")

            return message.channel.send(embedLeader);
        }
        else{
            let leaders      = [];
            let levelLeaders = [];
            let killLeaders  = [];

            const moneyRows = await query(`SELECT scores.userId, money, prestige 
            FROM userGuilds 
            INNER JOIN scores 
            ON userGuilds.userId = scores.userId 
            WHERE userGuilds.guildId ="${message.guild.id}" 
            ORDER BY money DESC LIMIT 3`);
            const levelRows = await query(`SELECT scores.userId, level, prestige
            FROM userGuilds 
            INNER JOIN scores 
            ON userGuilds.userId = scores.userId 
            WHERE userGuilds.guildId ="${message.guild.id}" 
            ORDER BY level DESC LIMIT 3`);
            const killRows  = await query(`SELECT scores.userId, kills, prestige
            FROM userGuilds 
            INNER JOIN scores 
            ON userGuilds.userId = scores.userId 
            WHERE userGuilds.guildId ="${message.guild.id}" 
            ORDER BY kills DESC LIMIT 3`);

            for(var key in moneyRows){
                try{
                    let userInfo = await general.getUserInfo(message, moneyRows[key].userId, true);
                    leaders.push(`💵 ${methods.getPrestigeBadge(moneyRows[key].prestige)} ${globalLB.getPrestigeText(userInfo.user.tag, moneyRows[key].prestige)}` + ' - ' + methods.formatMoney(moneyRows[key].money));
                }
                catch(err){
                    console.log(err);
                }
            }
            for(var key in levelRows){
                try{
                    let userInfo = await general.getUserInfo(message, levelRows[key].userId, true);
                    levelLeaders.push(`🔹 ${methods.getPrestigeBadge(levelRows[key].prestige)} ${globalLB.getPrestigeText(userInfo.user.tag, levelRows[key].prestige)}` + ' - Level  ' + levelRows[key].level);
                }
                catch(err){
        
                }
            }
            for(var key in killRows){
                try{
                    let userInfo = await general.getUserInfo(message, killRows[key].userId, true);
                    killLeaders.push(`🏅 ${methods.getPrestigeBadge(killRows[key].prestige)} ${globalLB.getPrestigeText(userInfo.user.tag, killRows[key].prestige)}` + ' - ' + killRows[key].kills + " kills");
                }
                catch(err){
                    
                }
            }
            
            leaders[0] = leaders[0].replace("💵", "💰");
            levelLeaders[0] = levelLeaders[0].replace("🔹","💠");
            killLeaders[0] = killLeaders[0].replace("🏅","🏆");

            const embedLeader = new Discord.RichEmbed() 
            .setTitle(`**Server Leaderboard**`)
            .setThumbnail(message.guild.iconURL)
            .setColor(13215302)
            .addField("Money", leaders)
            .addField("Level", levelLeaders)
            .addField("Kills", killLeaders)
            .setFooter("Top " + leaders.length)
            message.channel.send(embedLeader);
        }
    },
}

async function getGlobalLB(client){
    cacheLB = cache.get('leaderboard');

    if(!cacheLB){
        try{
            const leaders = await globalLB.create_lb(client);
            
            cache.set('leaderboard', leaders);
            return leaders;
        }
        catch(err){
            console.log(err);
        }
    }
    else{
        return cacheLB;
    }
}