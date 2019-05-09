const Discord   = require('discord.js');
const { query } = require('../../mysql.js');
const method    = require('../../methods/acc_code_handler.js');
const methods   = require('../../methods/methods.js');

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
            const row        = await query(`SELECT * FROM scores WHERE userId = '${userID}'`);
            const activeRows = await query(`SELECT * FROM userGuilds WHERE userId = '${userID}'`);
            const userInfo   = await message.client.fetchUser(userID);
            const accCode    = await method.getinvcode(message, userID);
            const usersItems = await methods.getuseritems(userID, {amounts: true});

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

            const embedInfo = new Discord.RichEmbed()
            .setTitle("`" + userInfo.tag + "`'s data")
            .setDescription('User account code:\n```' + accCode.invCode + "```")
            .setThumbnail(userInfo.avatarURL)
            .addField('Account Created', new Date(row[0].createdAt).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/New_York'}) + ' at ' + new Date(row[0].createdAt).toLocaleTimeString('en-US', {timeZone: 'America/New_York'}) + ' (EST)', true)
            .addField('Activated in ' + activeGuilds.length + ' servers', activeGuilds.length > 0 ? activeGuilds : 'none', true)
            .setColor(11346517)

            if(ultraItemList != ""){
                let newList = ultraItemList.join('\n');
                embedInfo.addField("<:UnboxUltra:526248982691840003>Ultra", "```" + newList + "```", true);
            }
            
            if(legendItemList != ""){
                let newList = legendItemList.join('\n');
                embedInfo.addField("<:UnboxLegendary:526248970914234368>Legendary", "```" + newList + "```", true);
            }
            
            if(epicItemList != ""){
                let newList = epicItemList.join('\n');
                embedInfo.addField("<:UnboxEpic:526248961892155402>Epic", "```" + newList + "```", true);
            }
            
            if(rareItemList != ""){
                let newList = rareItemList.join('\n');
                embedInfo.addField("<:UnboxRare:526248948579434496>Rare", "```" + newList + "```", true);
            }
            
            if(uncommonItemList != ""){
                let newList = uncommonItemList.join('\n');
                embedInfo.addField("<:UnboxUncommon:526248928891371520>Uncommon", "```" + newList + "```", true);
            }
            
            if(commonItemList != ""){
                let newList = commonItemList.join('\n');
                embedInfo.addField("<:UnboxCommon:526248905676029968>Common", "```" + newList + "```", true);
            }
            
            if(limitedItemList != ""){
                let newList = limitedItemList.join('\n');
                embedInfo.addField("🎁Limited", "```" + newList + "```", true);
            }
            
            if(ultraItemList == "" && legendItemList == "" && epicItemList == "" && rareItemList == "" && uncommonItemList == "" && commonItemList == ""&& limitedItemList == ""){
                embedInfo.addField('Their inventory is empty!', "\u200b");
            }

            message.channel.send(embedInfo);
        }
        catch(err){
            message.reply('Error:```' + err + '```');
        }
    },
}