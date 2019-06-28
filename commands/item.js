const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');

const weaponEmote = '551394726624886796';
const weaponEmotePrint = '<:glock:551394726624886796>';
const itemsEmote = '588677752358436867';
const itemsEmotePrint = '<:xp_potion:588677752358436867>';
const bannerEmote = '🔰';
const ammoEmote = '588677607805943828';
const ammoEmotePrint = '<:new_ammo_box:588677607805943828>';
const matsEmote = '🔩';
const backpackEmote = '💼';

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
            .setTitle(`${itemdata[itemSearched].icon} **${itemSearched} Info**`)
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

            embedItem.addField("***Rarity***", itemRarity)
            if(itemCooldown !== ""){
                embedItem.addField("Cooldown", "`" + itemCooldown.display + "`")
            }
            if(itemdata[itemSearched].chanceToBreak){
                embedItem.addField("Chance to break", "`" + (itemdata[itemSearched].chanceToBreak * 100) + "%`")
            }

            if(itemDamage !== ""){
                embedItem.addField("💥 Damage", itemDamage, true)
            }

            if(itemAmmo !== "" && itemAmmo !== "N/A"){
                embedItem.addField("Ammo Required", itemAmmo, true)
            }

            if(itemAmmoFor.length >= 1){
                embedItem.addField("Ammo for", itemAmmoFor, true)
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

            if(itemCraftedWith !== ""){
                embedItem.addBlankField();
                embedItem.addField("🔩 Craft Ingredients", "```"+ itemCraftedWith.display +"```", true)
            }
            if(itemRecyclesTo.materials !== undefined){
                embedItem.addField("♻ Recycles into", "```"+ itemRecyclesTo.display +"```", true)
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
            .addField("<:UnboxCommon:526248905676029968> Common","`" + commonList.sort().join("`\n`") + "`", true)
            .addField("<:UnboxUncommon:526248928891371520> Uncommon","`" + uncommonList.sort().join("`\n`") + "`", true)
            .addField("<:UnboxRare:526248948579434496> Rare","`" + rareList.sort().join("`\n`") + "`", true)
            .addField("<:UnboxEpic:526248961892155402> Epic","`" + epicList.sort().join("`\n`") + "`", true)
            .addField("<:UnboxLegendary:526248970914234368> Legendary","`" + legendList.sort().join("`\n`") + "`", true)
            .addField("<:UnboxUltra:526248982691840003> Ultra","`" + ultraList.sort().join("`\n`") + "`", true)
            .setFooter(lang.item[1].replace('{0}', prefix))
            //.addField(lang.item[2], lang.item[3].replace('{0}', weaponEmotePrint).replace('{1}', itemsEmotePrint).replace('{2}', ammoEmotePrint).replace('{3}', bannerEmote).replace('{4}', matsEmote).replace('{5}', backpackEmote), true)
            .setDescription(lang.item[2].replace('{0}', weaponEmotePrint).replace('{1}', itemsEmotePrint).replace('{2}', ammoEmotePrint).replace('{3}', bannerEmote).replace('{4}', matsEmote).replace('{5}', backpackEmote))

            message.channel.send(embedInfo).then(botMessage => {
                botMessage.react(weaponEmote).then(() => 
                botMessage.react(itemsEmote)).then(() => 
                botMessage.react(ammoEmote)).then(() => 
                botMessage.react(bannerEmote)).then(() =>
                botMessage.react(matsEmote)).then(() =>
                botMessage.react(backpackEmote));
                return botMessage;
            }).then((collectorMsg) => {
                const collector = collectorMsg.createReactionCollector((reaction, user) => 
                    user.id === message.author.id && reaction.emoji.id === weaponEmote || 
                    user.id === message.author.id && reaction.emoji.id === itemsEmote || 
                    user.id === message.author.id && reaction.emoji.id === ammoEmote || 
                    user.id === message.author.id && reaction.emoji.name === matsEmote || 
                    user.id === message.author.id && reaction.emoji.name === backpackEmote || 
                    user.id === message.author.id && reaction.emoji.name === bannerEmote, {time: 60000});
                collector.on("collect", reaction => {
                    if(reaction.emoji.id === weaponEmote){
                        collectorMsg.edit(editEmbed('weapon', lang, prefix));
                        reaction.remove(message.author.id);
                    }
                    else if(reaction.emoji.id === itemsEmote){
                        collectorMsg.edit(editEmbed('item', lang, prefix));
                        reaction.remove(message.author.id);
                    }
                    else if(reaction.emoji.id === ammoEmote){
                        collectorMsg.edit(editEmbed('ammo', lang, prefix));
                        reaction.remove(message.author.id);
                    }
                    else if(reaction.emoji.name == bannerEmote){
                        collectorMsg.edit(editEmbed('banner', lang, prefix));
                        reaction.remove(message.author.id);
                    }
                    else if(reaction.emoji.name == matsEmote){
                        collectorMsg.edit(editEmbed('material', lang, prefix));
                        reaction.remove(message.author.id);
                    }
                    else if(reaction.emoji.name == backpackEmote){
                        collectorMsg.edit(editEmbed('backpack', lang, prefix));
                        reaction.remove(message.author.id);
                    }
                });
                collector.on("end", reaction => {
                });
            });
        }
        else{
            message.reply(lang.item[0].replace('{0}', prefix));
        }
    },
}

function editEmbed(type, lang, prefix){
    let commonList = methods.getitems("common", {type: type});
    let uncommonList = methods.getitems("uncommon", {type: type});
    let rareList = methods.getitems("rare", {type: type});
    let epicList = methods.getitems("epic", {type: type});
    let legendList = methods.getitems("legendary", {type: type});
    let ultraList = methods.getitems("ultra", {type: type});
    //let limitList = methods.getitems("limited", {type: type});

    const embedInfo = new Discord.RichEmbed()
    .setColor(0)
    .setTitle(type == 'weapon' ? 'Weapons' : type == 'item' ? 'Consumables' : type == 'ammo' ? 'Ammunition' : type == 'banner' ? 'Banners' : type == 'backpack' ? 'Backpacks' : 'Materials')
    if(commonList.length > 0){
        embedInfo.addField("<:UnboxCommon:526248905676029968>Common","`" + commonList.sort().join("`\n`") + "`", true)
    }
    if(uncommonList.length > 0){
        embedInfo.addField("<:UnboxUncommon:526248928891371520>Uncommon","`" + uncommonList.sort().join("`\n`") + "`", true)
    }
    if(rareList.length > 0){
        embedInfo.addField("<:UnboxRare:526248948579434496>Rare","`" + rareList.sort().join("`\n`") + "`", true)
    }
    if(epicList.length > 0){
        embedInfo.addField("<:UnboxEpic:526248961892155402>Epic","`" + epicList.sort().join("`\n`") + "`", true)
    }
    if(legendList.length > 0){
        embedInfo.addField("<:UnboxLegendary:526248970914234368>Legendary","`" + legendList.sort().join("`\n`") + "`", true)
    }
    if(ultraList.length > 0){
        embedInfo.addField("<:UnboxUltra:526248982691840003>Ultra","`" + ultraList.sort().join("`\n`") + "`", true)
    }
    else{
        embedInfo.addBlankField(true)
    }
    if(commonList.length <= 0){
        embedInfo.addBlankField(true)
    }
    if(uncommonList.length <= 0){
        embedInfo.addBlankField(true)
    }
    if(rareList.length <= 0){
        embedInfo.addBlankField(true)
    }
    if(epicList.length <= 0){
        embedInfo.addBlankField(true)
    }
    if(legendList.length <= 0){
        embedInfo.addBlankField(true)
    }
    embedInfo.setDescription(lang.item[2].replace('{0}', weaponEmotePrint).replace('{1}', itemsEmotePrint).replace('{2}', ammoEmotePrint).replace('{3}', bannerEmote).replace('{4}', matsEmote).replace('{5}', backpackEmote))
    embedInfo.setFooter(lang.item[1].replace('{0}', prefix))

    return embedInfo
}