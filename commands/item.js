const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');

module.exports = {
    name: 'item',
    aliases: ['items'],
    description: 'Shows information about an item.',
    hasArgs: false,
    worksInDM: true,
    requiresAcc: false,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        let itemSearched = methods.getCorrectedItemInfo(args[0]);

        if(itemdata[itemSearched] !== undefined){
            let itemDamage = itemdata[itemSearched].damage;
            let itemBuyCurr = itemdata[itemSearched].buy.currency;
            let itemBuyPrice = itemdata[itemSearched].buy.amount;
            let itemSellPrice = itemdata[itemSearched].sell;
            let itemAmmo = itemdata[itemSearched].ammo;
            let itemAmmoFor = itemdata[itemSearched].isAmmo;
            let itemRarity = itemdata[itemSearched].rarity;
            let itemInfo = itemdata[itemSearched].desc;
            let itemImg = itemdata[itemSearched].image;
            let itemRecyclesTo = itemdata[itemSearched].recyclesTo;
            let itemCraftedWith = itemdata[itemSearched].craftedWith;
            let itemCooldown = itemdata[itemSearched].cooldown;
            let isBound = itemdata[itemSearched].canBeStolen;
            let itemRarityColor = 0;

            if(itemRarity == "Ultra"){
                itemRarityColor = 16711778;
            }
            else if(itemRarity == "Legendary"){
                itemRarityColor = 16312092;
            }
            else if(itemRarity == "Limited"){
                itemRarityColor = 13391388;
            }
            else if(itemRarity == "Epic"){
                itemRarityColor = 12390624;
            }
            else if(itemRarity == "Rare"){
                itemRarityColor = 30463;
            }
            else if(itemRarity == "Uncommon"){
                itemRarityColor = 4755200;
            }
            else{
                itemRarityColor = 10197915;
            }
            var embedItem = new Discord.RichEmbed()
            .setTitle(`🏷**${itemSearched} Info**`)
            .setColor(itemRarityColor)
            if(itemdata[itemSearched].isBanner){
                embedItem.setImage(itemImg);
                embedItem.addField('Type', 'Banner');
            }
            else{
                embedItem.setThumbnail(itemImg)
            }

            if(!isBound){
                embedItem.setDescription(itemInfo + "```css\nThis item binds to the user when received, and cannot be traded or stolen.```");
            }
            else{
                embedItem.setDescription(itemInfo);
            }

            if(itemCooldown !== ""){
                embedItem.addField("***Rarity***", itemRarity, true)
                embedItem.addField("**Cooldown**", "`" + itemCooldown.display + "`")
            }
            else{
                embedItem.addField("***Rarity***", itemRarity)
            }

            if(itemDamage !== ""){
                embedItem.addField("💥Damage", itemDamage, true)
            }

            if(itemAmmo !== "" && itemAmmo !== "N/A"){
                embedItem.addField("🔻Ammo Required", itemAmmo, true)
            }

            if(itemAmmoFor.length >= 1){
                embedItem.addField("🔻Ammo for", itemAmmoFor, true)
            }

            if(itemBuyCurr !== undefined && itemBuyCurr == "money"){
                embedItem.addField("Cost", "📥 Buy : " + methods.formatMoney(itemBuyPrice) + " | 📤 Sell : " + methods.formatMoney(itemSellPrice))
            }
            else if(itemBuyCurr !== undefined){
                embedItem.addField("Cost", "📥 Buy : " + itemBuyPrice + "`" + itemBuyCurr +"` | 📤 Sell : " + methods.formatMoney(itemSellPrice))
            }
            else if(itemSellPrice !== ""){
                embedItem.addField("Cost", "📤 Sell : " + methods.formatMoney(itemSellPrice))
            }
            
            if(itemRecyclesTo.materials !== undefined){
                embedItem.addBlankField();
                embedItem.addField("Recycles into", "```"+ itemRecyclesTo.display +"```", true)
            }
            if(itemCraftedWith !== ""){
                embedItem.addField("Items required to craft", "```"+ itemCraftedWith.display +"```", true)
            }
            message.channel.send(embedItem);
        }
        else if(itemSearched == ""){
            let commonList = methods.getitems("common", {});
            let uncommonList = methods.getitems("uncommon", {});
            let rareList = methods.getitems("rare", {});
            let epicList = methods.getitems("epic", {});
            let legendList = methods.getitems("legendary", {});
            let ultraList = methods.getitems("ultra", {});
            let limitList = methods.getitems("limited", {});

            const embedInfo = new Discord.RichEmbed()
            .setColor(0)
            .setTitle("Full Items List")
            .setURL("https://lootcord.com/items")
            .addField("<:UnboxCommon:526248905676029968>Common","`" + commonList.sort().join("`\n`") + "`", true)
            .addField("<:UnboxUncommon:526248928891371520>Uncommon","`" + uncommonList.sort().join("`\n`") + "`", true)
            .addField("<:UnboxRare:526248948579434496>Rare","`" + rareList.sort().join("`\n`") + "`", true)
            .addField("<:UnboxEpic:526248961892155402>Epic","`" + epicList.sort().join("`\n`") + "`", true)
            .addField("<:UnboxLegendary:526248970914234368>Legendary","`" + legendList.sort().join("`\n`") + "`", true)
            .addField("<:UnboxUltra:526248982691840003>Ultra","`" + ultraList.sort().join("`\n`") + "`", true)
            .setFooter(lang.item[1].replace('{0}', prefix))
            return message.channel.send(embedInfo);
        }
        else{
            message.reply(lang.item[0].replace('{0}', prefix));
        }
    },
}