const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');
const general = require('../methods/general');

module.exports = {
    name: 'inventory',
    aliases: ['inv', 'i'],
    description: 'Displays all items you have.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang){
        let userOldID = args[0];

        if(args.length){
            if(!general.isUser(userOldID)){
                return message.reply(lang.errors[1]);
            }
            makeInventory(general.getUserId(userOldID));
        }
        else{
            makeInventory(message.author.id);
        }

        async function makeInventory(userId){
            try{
                const userRow = (await query(`SELECT * FROM items i
                INNER JOIN scores s
                ON i.userId = s.userId
                WHERE s.userId= ?`, [userId]))[0];
    
                if(!userRow){
                    return message.reply(lang.errors[0]);
                }
                
                const activeRow      = await query(`SELECT * FROM userGuilds WHERE userId = ? AND guildId = ?`, [userId, message.guild.id]);
                const usersItems     = await methods.getuseritems(userId, {amounts: true, sep: '`'});
                const itemCt         = await methods.getitemcount(userId);
                const shieldLeft     = await methods.getShieldTime(userId);
                const userInfo       = await general.getUserInfo(message, userId, true);

                var ultraItemList    = usersItems.ultra;
                var legendItemList   = usersItems.legendary;
                var epicItemList     = usersItems.epic;
                var rareItemList     = usersItems.rare;
                var uncommonItemList = usersItems.uncommon;
                var commonItemList   = usersItems.common;
                var limitedItemList  = usersItems.limited;

                var totalXpNeeded    = 0;
                var currLvlXP        = 0;

                for(var i = 1; i <= userRow.level;i++){
                    var xpNeeded = Math.floor(50*(i**1.7));
                    totalXpNeeded += xpNeeded;
                    if(i == userRow.level){
                        break;
                    }
                    currLvlXP += xpNeeded;
                }


                const embedInfo = new Discord.RichEmbed()
                .setAuthor(`${userInfo.displayName}'s Inventory`, userInfo.user.avatarURL)

                if(userRow.banner !== 'none'){
                    embedInfo.setImage(itemdata[userRow.banner].image);
                    embedInfo.setColor(itemdata[userRow.banner].bannerColor);
                }
                
                if(totalXpNeeded - userRow.points <= 0){
                    embedInfo.addField("Level: " + userRow.level + ` (${userRow.points - currLvlXP}/${Math.floor(50*(userRow.level**1.7))})`, lang.inventory[0].replace('{0}', '0').replace('{1}', userRow.level), true)
                }
                else{
                    embedInfo.addField("Level: " + userRow.level + ` (${userRow.points - currLvlXP}/${Math.floor(50*(userRow.level**1.7))})`, lang.inventory[0].replace('{0}', totalXpNeeded - userRow.points).replace('{1}', userRow.level + 1), true)
                }

                embedInfo.addField(lang.inventory[1], activeRow.length ? '**Yes**' : '**No**', true)
                embedInfo.addField("Health",`❤ ${userRow.health}/${userRow.maxHealth}`, true)

                if(message.client.sets.activeShield.has(userId)){
                    embedInfo.addField("Shield Active", '🛡 ' + shieldLeft, true);
                }
                
                embedInfo.addField("Money", methods.formatMoney(userRow.money))
                
                if(ultraItemList != ""){
                    let newList = ultraItemList.join('\n');
                    embedInfo.addField("Ultra", newList, true);
                }
                
                if(legendItemList != ""){
                    let newList = legendItemList.join('\n');
                    embedInfo.addField("Legendary", newList, true);
                }
                
                if(epicItemList != ""){
                    let newList = epicItemList.join('\n');
                    embedInfo.addField("Epic", newList, true);
                }
                
                if(rareItemList != ""){
                    let newList = rareItemList.join('\n');
                    embedInfo.addField("Rare", newList, true);
                }
                
                if(uncommonItemList != ""){
                    let newList = uncommonItemList.join('\n');
                    embedInfo.addField("Uncommon", newList, true);
                }
                
                if(commonItemList != ""){
                    let newList = commonItemList.join('\n');
                    embedInfo.addField("Common", newList, true);
                }
                
                if(limitedItemList != ""){
                    let newList = limitedItemList.join('\n');
                    embedInfo.addField("🎁Limited", newList, true);
                }
                
                if(ultraItemList == "" && legendItemList == "" && epicItemList == "" && rareItemList == "" && uncommonItemList == "" && commonItemList == ""&& limitedItemList == ""){
                    embedInfo.addField(lang.inventory[3], "\u200b");
                }

                if(message.client.sets.moddedUsers.has(userId)){
                    embedInfo.addField("\u200b", "Inventory space: " + itemCt.capacity + " max | This user is a Lootcord moderator! 💪");
                }
                else{
                    embedInfo.addField("\u200b", "Inventory space: " + itemCt.capacity + " max | Worth: " + methods.formatMoney(usersItems.invValue, true));
                }
                
                message.channel.send(embedInfo);
            }
            catch(err){
                message.reply(lang.inventory[2]);
            }
        }
    },
}