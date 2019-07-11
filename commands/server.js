const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const general = require('../methods/general');

module.exports = {
    name: 'server',
    aliases: ['active'],
    description: 'Displays all active users on the server.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        var guildUsers = [];
        var userCount = 1;
        const rows = await query(`SELECT * FROM userGuilds WHERE guildId ="${message.guild.id}" ORDER BY LOWER(userId)`);
        
        for(var i = 0; i < rows.length; i++){
            try{
                if((await general.getUserInfo(message, rows[i].userId, true)).displayName){
                    guildUsers.push(`${userCount}. **${(await general.getUserInfo(message, rows[i].userId, true)).displayName}**`);
                    userCount += 1;
                }
            }
            catch(err){
            }
        }
        /*
        guildUsers.sort(function(x,y){
            var xp = x.substr(100,5);
            var yp = y.substr(100,5);
            return xp == yp ? 0 : xp < yp ? -1 : 1;
        });
        guildUsers.forEach(function (user) {
            guildFilteredUsers.push(`${guildUsers.indexOf(user) + 1}. **${finalString}**`);
        });
        */
        if(guildUsers.length > 10){
            let pageNum = 1;
            let guildFilteredUsers = [];
            let maxPage = Math.ceil(guildUsers.length/10);
            const embedLeader = new Discord.RichEmbed({
                //fields: [{name: `**Active users in ${message.guild.name}**`, value: `${guildUsers}`}],
                footer: {
                    text: `Page 1/${maxPage}`
                },
                color: 13215302
            });
            embedLeader.addField(`**Active users in ${message.guild.name}**`, guildUsers.slice(0,10));

            message.channel.send(embedLeader).then(botMessage => {
                botMessage.react('◀').then(() => botMessage.react('▶')).then(() => botMessage.react('❌'));
                return botMessage;
            }).then((collectorMsg) => {
                const collector = collectorMsg.createReactionCollector((reaction, user) => user.id === message.author.id && reaction.emoji.name === "◀" || user.id === message.author.id && reaction.emoji.name === "▶" || user.id === message.author.id && reaction.emoji.name === "❌", {time: 10000});
                collector.on("collect", reaction => {
                    const chosen = reaction.emoji.name;
                    if(chosen === "◀"){
                        if(pageNum > 1){
                            pageNum -= 1;
                            editEmbed();
                        }
                        reaction.remove(message.author.id);
                        //previous page
                    }else if(chosen === "▶"){
                        if(pageNum < maxPage){
                            pageNum += 1;
                            editEmbed();
                        }
                        reaction.remove(message.author.id);
                        // Next page
                    }else if(chosen === "❌"){
                        // Stop navigating pages
                        collectorMsg.delete();
                    }
                    function editEmbed(){
                        guildFilteredUsers = [];
                        let indexFirst = (10 * pageNum) - 10;
                        let indexLast = (10 * pageNum) - 1;
                        const newEmbed = new Discord.RichEmbed({
                            footer: {
                                text: `Page ${pageNum}/${maxPage}`
                            },
                            color: 13215302
                        });
                        guildUsers.forEach(function (user) {
                            try{
                                if(guildUsers.indexOf(user) >= indexFirst && guildUsers.indexOf(user) <= indexLast){
                                    let newString = user.replace(/\**/g, '');
                                    let finalString = newString.slice(3);
                                    guildFilteredUsers.push(`${guildUsers.indexOf(user) + 1}. **${finalString}**`);
                                }
                            }
                            catch(err){
                            }
                        });
                        newEmbed.addField(lang.server[0].replace('{0}', message.guild.name),guildFilteredUsers);
                        collectorMsg.edit(newEmbed);
                    }
                });
                collector.on("end", reaction => {
                });
            });
        }
        else{
            const embedLeader = new Discord.RichEmbed()
            .setColor(13215302)
            .addField(lang.server[0].replace('{0}', message.guild.name), guildUsers)
            message.channel.send(embedLeader);
        }
    },
}