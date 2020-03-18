const Discord   = require('discord.js');
const { query } = require('../../mysql.js');
const method    = require('../../methods/acc_code_handler.js');
const methods   = require('../../methods/methods.js');
const general = require('../../methods/general');
const itemdata = require('../../json/completeItemList');
const badgedata = require('../../json/badges');

module.exports = {
    name: 'getinfo',
    aliases: ['getinv'],
    description: 'View a users account information.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    guildModsOnly: false,
    modOnly: true,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        let userID = args[0];

        try{
            const row = await query(`SELECT * FROM scores WHERE userId = '${userID}'`);

            if(!row.length){
                return message.reply('User has no account.');
            }

            const activeRows = await query(`SELECT * FROM userGuilds WHERE userId = '${userID}'`);
            const userInfo   = await general.getUserInfo(message, userID);
            const accCode    = await method.getinvcode(message, userID);
            const usersItems = await methods.getuseritems(userID, {amounts: true, sep: '`', icon: true});
            const itemCt     = await methods.getitemcount(userID);

            var ultraItemList    = usersItems.ultra;
            var legendItemList   = usersItems.legendary;
            var epicItemList     = usersItems.epic;
            var rareItemList     = usersItems.rare;
            var uncommonItemList = usersItems.uncommon;
            var commonItemList   = usersItems.common;
            var limitedItemList  = usersItems.limited;

            var activeGuilds = [];
            activeRows.forEach((guild) => {
                activeGuilds.push(guild.guildId);
            });

            var currLvlXP        = 0;

            for(var i = 1; i <= row[0].level;i++){
                if(i == row[0].level){
                    break;
                }
                currLvlXP += Math.floor(50*(i**1.7));
            }

            const embedInfo = new Discord.RichEmbed()
            .setTitle("`" + userInfo.tag + "`'s data")
            .setDescription('User account code:\n```' + (accCode.invCode.length < 2000 ? accCode.invCode : 'Too long to show!') + "```")
            .setThumbnail(userInfo.avatarURL)
            .addField('Account Created', new Date(row[0].createdAt).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/New_York'}) + ' at ' + new Date(row[0].createdAt).toLocaleTimeString('en-US', {timeZone: 'America/New_York'}) + ' (EST)', true)
            .addField('Activated in ' + activeGuilds.length + ' servers', activeGuilds.length > 0 ? activeGuilds : 'none', true)
            .addField('Last Active:', new Date(row[0].lastActive).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/New_York'}) + ' at ' + new Date(row[0].lastActive).toLocaleTimeString('en-US', {timeZone: 'America/New_York'}) + ' (EST)')
            .addField('Money', methods.formatMoney(row[0].money), true)
            .addField('Level: ' + row[0].level, `(XP: ${row[0].points - currLvlXP}/${Math.floor(50*(row[0].level**1.7))})`, true)
            .addField('Clan', (row[0].clanId !== 0 ? '`' + (await query(`SELECT name FROM clans WHERE clanId = ${row[0].clanId}`))[0].name + '`' : 'None'))
            .setColor(11346517)

            if(ultraItemList != ""){
                embedInfo.addField("Ultra", ultraItemList.join('\n'), true);
            }
            
            if(legendItemList != ""){
                embedInfo.addField("Legendary", legendItemList.join('\n'), true);
            }
            
            if(epicItemList != ""){
                embedInfo.addField("Epic", epicItemList.join('\n'), true);
            }
            
            if(rareItemList != ""){
                embedInfo.addField("Rare", rareItemList.join('\n'), true);
            }
            
            if(uncommonItemList != ""){
                embedInfo.addField("Uncommon", uncommonItemList.join('\n'), true);
            }
            
            if(commonItemList != ""){
                embedInfo.addField("Common", commonItemList.join('\n'), true);
            }
            
            if(limitedItemList != ""){
                embedInfo.addField("Limited", limitedItemList.join('\n'), true);
            }
            
            if(ultraItemList == "" && legendItemList == "" && epicItemList == "" && rareItemList == "" && uncommonItemList == "" && commonItemList == ""&& limitedItemList == ""){
                embedInfo.addField('Their inventory is empty!', "\u200b");
            }
            
            embedInfo.addField("\u200b", "Inventory space: " + itemCt.capacity + " max | Value: " + methods.formatMoney(usersItems.invValue));

            message.channel.send(embedInfo);
        }
        catch(err){
            message.reply('Error:```' + err + '```');
        }
    },
}