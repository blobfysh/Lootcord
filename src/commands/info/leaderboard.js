
module.exports = {
    name: 'leaderboard',
    aliases: ['lb'],
    description: 'Show the best players overall or in the current server.',
    long: 'Displays a leaderboard of all players with the highest level and amount of money.',
    args: {"g": "**OPTIONAL** Will show the global leaderboard"},
    examples: [],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    
    async execute(app, message){
        if(message.args[0] == 'g' || message.args[0] == 'global'){
            const leaders = await getGlobalLB(app);

            const embedLeader = new app.Embed() 
            .setTitle(`**Global Leaderboard**`)
            .setColor('#000000')
            .addField("Money", leaders.moneyLB.join('\n'))
            .addField("Level", leaders.levelLB.join('\n'))
            .addField("Kills", leaders.killLB.join('\n'))
            .addField("Richest Clans", leaders.clanLB.join('\n'))
            .setFooter("Top 5")

            return message.channel.createMessage(embedLeader);
        }
        else{
            let leaders      = [];
            let levelLeaders = [];
            let killLeaders  = [];

            const moneyRows = await app.query(`SELECT scores.userId, money, prestige, badge
            FROM userGuilds 
            INNER JOIN scores 
            ON userGuilds.userId = scores.userId 
            WHERE userGuilds.guildId ="${message.guild.id}" 
            ORDER BY money DESC LIMIT 3`);
            const levelRows = await app.query(`SELECT scores.userId, level, prestige, badge
            FROM userGuilds 
            INNER JOIN scores 
            ON userGuilds.userId = scores.userId 
            WHERE userGuilds.guildId ="${message.guild.id}" 
            ORDER BY level DESC LIMIT 3`);
            const killRows  = await app.query(`SELECT scores.userId, kills, prestige, badge
            FROM userGuilds 
            INNER JOIN scores 
            ON userGuilds.userId = scores.userId 
            WHERE userGuilds.guildId ="${message.guild.id}" 
            ORDER BY kills DESC LIMIT 3`);

            for(let key in moneyRows){
                try{
                    let member = await app.common.fetchMember(message.guild, moneyRows[key].userId);
                    leaders.push(`💵 ${app.player.getBadge(moneyRows[key].badge)} ${member.effectiveName + '#' + member.discriminator}` + ' - ' + app.common.formatNumber(moneyRows[key].money));
                }
                catch(err){
                    console.log(err);
                }
            }
            for(let key in levelRows){
                try{
                    let member = await app.common.fetchMember(message.guild, levelRows[key].userId);
                    levelLeaders.push(`🔹 ${app.player.getBadge(levelRows[key].badge)} ${member.effectiveName + '#' + member.discriminator}` + ' - Level  ' + levelRows[key].level);
                }
                catch(err){
        
                }
            }
            for(let key in killRows){
                try{
                    let member = await app.common.fetchMember(message.guild, killRows[key].userId);
                    killLeaders.push(`🏅 ${app.player.getBadge(killRows[key].badge)} ${member.effectiveName + '#' + member.discriminator}` + ' - ' + killRows[key].kills + " kills");
                }
                catch(err){
                    
                }
            }
            
            leaders[0] = leaders[0].replace("💵", "💰");
            levelLeaders[0] = levelLeaders[0].replace("🔹","💠");
            killLeaders[0] = killLeaders[0].replace("🏅","🏆");

            const embedLeader = new app.Embed() 
            .setTitle(`Server Leaderboard`)
            .setThumbnail(message.guild.iconURL)
            .setColor(13215302)
            .addField("Money", leaders.join('\n'))
            .addField("Level", levelLeaders.join('\n'))
            .addField("Kills", killLeaders.join('\n'))
            .setFooter("Top " + leaders.length)
            message.channel.createMessage(embedLeader);
        }
    },
}

async function getGlobalLB(app){
    cacheLB = await app.cache.get('leaderboard');

    if(!cacheLB){
        try{
            const leaders = await app.leaderboard.getLB();
            
            // cache leaderboard for 6 hours
            app.cache.set('leaderboard', JSON.stringify(leaders), 3600 * 6);
            return leaders;
        }
        catch(err){
            console.log(err);
        }
    }
    else{
        console.log('searched cache for LB!');
        return JSON.parse(cacheLB);
    }
}