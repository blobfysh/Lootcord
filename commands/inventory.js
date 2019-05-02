const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');

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

        if(userOldID !== undefined){
            if(!userOldID.startsWith("<@")){
                return message.reply(lang.errors[1]);
            }
            let userNameID = args[0].replace(/[<@!>]/g, '');
            makeInventory(userNameID);
        }
        else{
            makeInventory(message.author.id);
        }

        async function makeInventory(userId){
            try{
                const oldRow = await query(`SELECT * FROM items i
                INNER JOIN scores s
                ON i.userId = s.userId
                WHERE s.userId="${userId}"`);
    
                if(!oldRow.length){
                    return message.reply(lang.errors[0]);
                }
                
                const userRow        = oldRow[0];
                const activeRow      = await query(`SELECT * FROM userGuilds WHERE userId = ${userId} AND guildId = ${message.guild.id}`);
                const usersItems     = await methods.getuseritems(userId, {amounts: true});
                const itemCt         = await methods.getitemcount(userId);
                const shieldLeft     = await methods.getShieldTime(userId);

                var ultraItemList    = usersItems.ultra;
                var legendItemList   = usersItems.legendary;
                var epicItemList     = usersItems.epic;
                var rareItemList     = usersItems.rare;
                var uncommonItemList = usersItems.uncommon;
                var commonItemList   = usersItems.common;
                var limitedItemList  = usersItems.limited;

                var totalXpNeeded    = 0;

                for(var i = 1; i <= userRow.level;i++){
                    var xpNeeded = Math.floor(50*(i**1.7));
                    totalXpNeeded += xpNeeded;
                    if(i == userRow.level){
                        break;
                    }
                }


                const embedInfo = new Discord.RichEmbed()
                .setAuthor(`${message.guild.members.get(userId).displayName}'s Inventory`, message.client.users.get(userId).avatarURL)

                if(userRow.banner !== 'none'){
                    embedInfo.setImage(itemdata[userRow.banner].image);
                    embedInfo.setColor(itemdata[userRow.banner].bannerColor);
                }
                
                if(totalXpNeeded - userRow.points <= 0){
                    embedInfo.addField("Level : "+ userRow.level, lang.inventory[0].replace('{0}', '0').replace('{1}', userRow.level), true)
                }
                else{
                    embedInfo.addField("Level : "+ userRow.level, lang.inventory[0].replace('{0}', totalXpNeeded - userRow.points).replace('{1}', userRow.level + 1), true)
                }

                embedInfo.addField(lang.inventory[1], activeRow.length ? '**Yes**' : '**No**', true)
                embedInfo.addField("❤Health",`${userRow.health}/${userRow.maxHealth}`, true)

                if(message.client.sets.activeShield.has(userId)){
                    embedInfo.addField("🛡SHIELD ACTIVE", shieldLeft, true);
                }
                
                embedInfo.addField("💵Money : " + methods.formatMoney(userRow.money),"\u200b")
                
                if(message.client.sets.moddedUsers.has(userId)){
                    embedInfo.setFooter("Inventory space: " + itemCt.capacity + " max | This user is a Lootcord moderator! 💪");
                }
                else{
                    embedInfo.setFooter("Inventory space: " + itemCt.capacity + " max");
                }
                
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
                    embedInfo.addField(lang.inventory[3], "\u200b");
                }
                
                message.channel.send(embedInfo);
            }
            catch(err){
                message.reply(lang.inventory[2]);
            }
        }
    },
}