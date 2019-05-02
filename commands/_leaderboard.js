const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');

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
        var leaders = [];
        var levelLeaders = [];
        var killLeaders = [];
        var tokenLeaders = [];

        if(message.content.startsWith(prefix+"leaderboard s") || message.content.startsWith(prefix+"lb s")){
            var guildUsers = [];

            function compareValues(key, order='desc') {
                return function(a, b) {
                    if(!a.hasOwnProperty(key) || 
                        !b.hasOwnProperty(key)) {
                        return 0; 
                    }
                
                    const varA = (typeof a[key] === 'string') ? 
                    a[key].toUpperCase() : a[key];
                    const varB = (typeof b[key] === 'string') ? 
                    b[key].toUpperCase() : b[key];
                        
                    let comparison = 0;
                    if (varA > varB) {
                        comparison = 1;
                    } else if (varA < varB) {
                        comparison = -1;
                    }
                    return (
                        (order == 'desc') ? 
                        (comparison * -1) : comparison
                    );
                };
            }

            const guildRows = await query(`SELECT * FROM userGuilds
            INNER JOIN scores 
            ON userGuilds.userId = scores.userId
            WHERE userGuilds.guildId ="${message.guild.id}"`);

            guildRows.forEach(row => {
                var newPlayerObj = {USERID : row.userId, MONEY : row.money, LEVEL : row.level}

                guildUsers.push(newPlayerObj);
            });

            guildUsers.sort(compareValues('MONEY'));

            guildUsers.forEach(row => {
                try{
                    leaders.push(`💵**${message.client.users.get(row.USERID).tag}**` + ' - ' + methods.formatMoney(row.MONEY));
                }
                catch(err){
                }
            });

            guildUsers.sort(compareValues('LEVEL'));

            guildUsers.forEach(row => {
                try{
                    levelLeaders.push(`🔹**${message.client.users.get(row.USERID).tag}**` + ' - Level : ' + row.LEVEL);
                }
                catch(err){
                }
            });

            var newMoney = leaders.slice(0,10);
            var newLevel = levelLeaders.slice(0,10);
            newMoney[0] = newMoney[0].replace("💵", "💰");
            newLevel[0] = newLevel[0].replace("🔹", "💠");

            const embedLeader = new Discord.RichEmbed() 
            .setTitle(`**Server Leaderboard**`)
            .setThumbnail(message.guild.iconURL)
            .setColor(13215302)
            .addField("Money", newMoney)
            .addField("Level", newLevel)
            .setFooter("Top " + newLevel.length)
            message.channel.send(embedLeader);
        }
        else{
            const moneyRows = await query('SELECT userId,money FROM scores ORDER BY money DESC LIMIT 10');
            const levelRows = await query('SELECT userId,level FROM scores ORDER BY level DESC LIMIT 10');
            const killRows = await query('SELECT userId,kills FROM scores ORDER BY kills DESC LIMIT 10');

            for(var key in moneyRows){
                try{
                    var userInfo = await message.client.fetchUser(moneyRows[key].userId);
                    leaders.push(`💵 **${userInfo.tag}**` + ' - ' + methods.formatMoney(moneyRows[key].money));
                }
                catch(err){
                    //dont push user
                }
            }
            for(var key in levelRows){
                try{
                    var userInfo = await message.client.fetchUser(levelRows[key].userId);
                    levelLeaders.push(`🔹 **${userInfo.tag}**` + ' - Level :  ' + levelRows[key].level);
                }
                catch(err){
                    //dont push user
                }
            }
            for(var key in killRows){
                try{
                    var userInfo = await message.client.fetchUser(killRows[key].userId);
                    killLeaders.push(`🏅 **${userInfo.tag}**` + ' - ' + killRows[key].kills + " kills");
                }
                catch(err){
                    //dont push user
                }
            }

            leaders[0] = leaders[0].replace("💵", "💰");
            levelLeaders[0] = levelLeaders[0].replace("🔹","💠");
            killLeaders[0] = killLeaders[0].replace("🏅","🏆");

            const embedLeader = new Discord.RichEmbed() 
            .setTitle(`**Global Leaderboard**`)
            .setColor(0)
            .addField("Money", leaders, true)
            .addField("Level", levelLeaders, true)
            .addField("Kills", killLeaders, true)
            .setFooter("Top 5")
            message.channel.send(embedLeader);

            return;
        }
    },
}