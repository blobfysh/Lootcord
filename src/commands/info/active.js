const usersPerPage = 10;

module.exports = {
    name: 'active',
    aliases: ['players'],
    description: 'Displays all active users on the server.',
    long: 'Displays all active users on the server.',
    args: {},
    examples: ["active"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    
    async execute(app, message){
        var guildUsers = [];
        var clans = [];
        const rows = await app.query(`SELECT scores.userId, badge 
        FROM scores 
        INNER JOIN userGuilds 
        ON scores.userId = userGuilds.userId 
        WHERE guildId = "${message.guild.id}" 
        ORDER BY LOWER(scores.userId)`);

        const clanRows = await app.query(`SELECT DISTINCT clans.name FROM (
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
                let member = await app.common.fetchMember(message.guild, rows[i].userId);

                guildUsers.push(app.player.getBadge(rows[i].badge) + ' ' + member.effectiveName);
            }
            catch(err){
            }
        }
        for(var i = 0; i < clanRows.length; i++){
            clans.push(clanRows[i].name);
        }

        if(guildUsers.length > usersPerPage){
            let pages = [];
            
            // max page is based off of active users because there will never be more active clans than there are active users
            let maxPage = Math.ceil(guildUsers.length / usersPerPage);

            for(let i = 1; i < maxPage + 1; i++){
                // create each page for pagination
                pages.push(getEmbedPage(app, guildUsers, clans, i, usersPerPage).setThumbnail(message.guild.iconURL));
            }
            
            app.react.paginate(message, pages);
        }
        else{
            message.channel.createMessage(getEmbedPage(app, guildUsers, clans, 1, usersPerPage).setThumbnail(message.guild.iconURL));
        }
    },
}

function getEmbedPage(app, guildUserList, guildClanList, pageNum, perPage){
    let indexFirst = (perPage * pageNum) - perPage;
    let indexLast = (perPage * pageNum);

    const newEmbed = new app.Embed()
    .setColor(13215302)
    .addField(`**Active Players** (${guildUserList.length})`, guildUserList.map((user, index) => `${index + 1}. **${user}**`).slice(indexFirst, indexLast).join('\n'))
    
    if(guildClanList.length) newEmbed.addField(`**Active Clans** (${guildClanList.length})`, guildClanList.map((clan, index) => `${index + 1}. \`${clan}\``).slice(indexFirst, indexLast).join('\n') || '\u200b')

    return newEmbed;
}