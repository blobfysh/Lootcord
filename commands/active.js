const Discord = require('discord.js');
const { query } = require('../mysql.js');
const general = require('../methods/general');
const methods = require('../methods/methods');

const usersPerPage = 10;

module.exports = {
    name: 'active',
    aliases: ['players'],
    description: 'Displays all active users on the server.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        var guildUsers = [];
        var clans = [];
        const rows = await query(`SELECT scores.userId, badge 
        FROM scores 
        INNER JOIN userGuilds 
        ON scores.userId = userGuilds.userId 
        WHERE guildId = "${message.guild.id}" 
        ORDER BY LOWER(scores.userId)`);

        const clanRows = await query(`SELECT DISTINCT clans.name FROM (
            SELECT scores.clanId
            FROM userguilds
            INNER JOIN scores
            ON userguilds.userId = scores.userId
            WHERE userguilds.guildId = ${message.guild.id}
        ) c
        INNER JOIN clans
        ON c.clanId = clans.clanId`);
        
        for(var i = 0; i < rows.length; i++){
            try{
                if((await general.getUserInfo(message, rows[i].userId, true)).displayName){
                    guildUsers.push(methods.getBadge(rows[i].badge) + ' ' + (await general.getUserInfo(message, rows[i].userId, true)).displayName);
                }
            }
            catch(err){
            }
        }
        for(var i = 0; i < clanRows.length; i++){
            clans.push(clanRows[i].name);
        }

        if(guildUsers.length > usersPerPage){
            let pageNum = 1;
            let maxPage = Math.ceil(guildUsers.length/usersPerPage); // max page is based off of active users because there will never be more active clans than there are active users (because each user can have 1 clan max).

            const botMessage = await message.channel.send(getEmbedPage(guildUsers, clans, pageNum, maxPage, usersPerPage).setThumbnail(message.guild.iconURL));
            await botMessage.react('◀')
            await botMessage.react('▶')
            await botMessage.react('❌');
            const collector = await botMessage.createReactionCollector((reaction, user) => user.id === message.author.id && reaction.emoji.name === "◀" || user.id === message.author.id && reaction.emoji.name === "▶" || user.id === message.author.id && reaction.emoji.name === "❌", {time: 10000});
            collector.on("collect", reaction => {
                const chosen = reaction.emoji.name;
                if(chosen === "◀"){
                    if(pageNum > 1){
                        pageNum -= 1;
                        botMessage.edit(getEmbedPage(guildUsers, clans, pageNum, maxPage, usersPerPage).setThumbnail(message.guild.iconURL));
                    }
                    reaction.remove(message.author.id);
                }
                else if(chosen === "▶"){
                    if(pageNum < maxPage){
                        pageNum += 1;
                        botMessage.edit(getEmbedPage(guildUsers, clans, pageNum, maxPage, usersPerPage).setThumbnail(message.guild.iconURL));
                    }
                    reaction.remove(message.author.id);
                    // Next page
                }
                else if(chosen === "❌"){
                    // Stop navigating pages
                    collectorMsg.delete();
                }
            });
            collector.on("end", reaction => {
            });
        }
        else{
            message.channel.send(getEmbedPage(guildUsers, clans, 1, 1, usersPerPage).setThumbnail(message.guild.iconURL));
        }
    },
}

function getEmbedPage(guildUserList, guildClanList, pageNum, maxPage, perPage){
    let indexFirst = (perPage * pageNum) - perPage;
    let indexLast = (perPage * pageNum);

    const newEmbed = new Discord.RichEmbed()
    .setColor(13215302)
    .addField(`**Active Players** (${guildUserList.length})`, guildUserList.map((user, index) => `${index + 1}. **${user}**`).slice(indexFirst, indexLast))
    
    if(guildClanList.length) newEmbed.addField(`**Active Clans** (${guildClanList.length})`, guildClanList.map((clan, index) => `${index + 1}. \`${clan}\``).slice(indexFirst, indexLast))

    if(maxPage !== 1) newEmbed.setFooter(`Page ${pageNum}/${maxPage}`)

    return newEmbed;
}