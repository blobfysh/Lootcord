const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');
const general = require('../methods/general');
const icons = require('../json/icons');

module.exports = {
    name: 'inventory',
    aliases: ['inv', 'i'],
    description: 'Displays all items you have.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    worksWhenInactive: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang){
        let userOldID = args[0];

        if(args.length){
            if(!general.isUser(args, true, message)){
                return message.reply(lang.errors[1]);
            }
            makeInventory(general.getUserId(args, true, message));
        }
        else{
            makeInventory(message.author.id);
        }

        async function makeInventory(userId){
            try{
                const userRow = (await query(`SELECT * FROM scores WHERE userId = ?`, [userId]))[0];
    
                if(!userRow){
                    return message.reply(lang.errors[0]);
                }
                
                const activeRow      = await query(`SELECT * FROM userGuilds WHERE userId = ? AND guildId = ?`, [userId, message.guild.id]);
                const usersItems     = await methods.getuseritems(userId, {amounts: true, sep: '`', icon: true});
                const itemCt         = await methods.getitemcount(userId);
                const shieldLeft     = methods.getCD(message.client, {
                    userId: userId,
                    type: 'shield'
                });
                const userInfo       = await general.getUserInfo(message, userId);

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
                .setTitle(`${activeRow.length ? icons.accounts.active : icons.accounts.inactive} ${userInfo.tag}'s Inventory`)

                if(userRow.banner !== 'none'){
                    embedInfo.setImage(itemdata[userRow.banner].image);
                    embedInfo.setColor(itemdata[userRow.banner].bannerColor);
                }
                
                if(totalXpNeeded - userRow.points <= 0){
                    embedInfo.addField("Level: " + userRow.level, lang.inventory[0].replace('{0}', '0').replace('{1}', userRow.level), true)
                }
                else{
                    embedInfo.addField("Level: " + userRow.level, lang.inventory[0].replace('{0}', totalXpNeeded - userRow.points).replace('{1}', userRow.level + 1), true)
                }

                if(shieldLeft){
                    embedInfo.addField("Shield Active", '🛡 `' + shieldLeft + '`', true);
                }
                embedInfo.addField("Health",`${methods.getHealthIcon(userRow.health, userRow.maxHealth)} ${userRow.health}/${userRow.maxHealth}`)
                
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
                    embedInfo.addField("\u200b", "Inventory space: " + itemCt.capacity + " max | Value: " + methods.formatMoney(usersItems.invValue));
                }
                
                message.channel.send(embedInfo);
            }
            catch(err){
                console.log(err);
                message.reply(lang.inventory[2]);
            }
        }
    },
}