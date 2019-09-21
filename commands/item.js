const Discord = require('discord.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');
const icons = require('../json/icons');
const general = require('../methods/general');

// Regex matches the emote ID from icons.json file
const weaponEmote = icons.items.weapon.match(/^<:([a-zA-Z0-9]+):(\d+)>$/)[2];
const itemsEmote = icons.items.usable.match(/^<:([a-zA-Z0-9]+):(\d+)>$/)[2];
const bannerEmote = icons.items.banner.match(/^<:([a-zA-Z0-9]+):(\d+)>$/)[2];
const ammoEmote = icons.items.ammo.match(/^<:([a-zA-Z0-9]+):(\d+)>$/)[2];
const matsEmote = icons.items.material.match(/^<:([a-zA-Z0-9]+):(\d+)>$/)[2];
const backpackEmote = icons.items.backpack.match(/^<:([a-zA-Z0-9]+):(\d+)>$/)[2];

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
        let itemSearched = general.parseArgsWithSpaces(args[0], args[1], args[3]);
        let rawArg = !itemSearched ? undefined : itemSearched.toLowerCase();

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
                embedItem.addField("Ammo Required:", itemAmmo.map(ammo => itemdata[ammo].icon + '`' + ammo + '`'), true)
            }

            if(itemAmmoFor.length >= 1){
                embedItem.addField("Ammo for:", itemAmmoFor.map(weapon => itemdata[weapon].icon + '`' + weapon + '`'), true)
            }

            if(itemBuyCurr !== undefined && itemBuyCurr == "money"){
                embedItem.addField("Buy", methods.formatMoney(itemBuyPrice), true);
            }
            else if(itemBuyCurr !== undefined){
                embedItem.addField("Buy", itemBuyPrice + "x `" + itemBuyCurr + "`", true);
            }
            if(itemSellPrice !== ""){
                embedItem.addField("Sell", methods.formatMoney(itemSellPrice), itemBuyCurr !== undefined ? true : false);
            }

            if(itemCraftedWith !== ""){
                embedItem.addBlankField();
                embedItem.addField("🔩 Craft Ingredients:", itemCraftedWith.display.split('\n').map(component =>  itemdata[component.split(' ')[1]].icon + component.split(' ')[0] + ' `' + component.split(' ')[1] + '`'), true)
            }
            if(itemRecyclesTo.materials !== undefined){
                embedItem.addField("♻ Recycles into:", itemRecyclesTo.display.split('\n').map(item =>  itemdata[item.split(' ')[1]].icon + item.split(' ')[0] + ' `' + item.split(' ')[1] + '`'), true)
            }
            message.channel.send(embedItem);
        }
        else if(rawArg.startsWith('weapon')){
            message.channel.send(editEmbed('weapon', lang, prefix));
        }
        else if(rawArg == 'items' || rawArg.startsWith('consumable') || rawArg.startsWith('usable')){
            message.channel.send(editEmbed('item', lang, prefix));
        }
        else if(rawArg == 'ammo' || rawArg == 'ammunition'){
            message.channel.send(editEmbed('ammo', lang, prefix));
        }
        else if(rawArg.startsWith('banner')){
            message.channel.send(editEmbed('banner', lang, prefix));
        }
        else if(rawArg.startsWith('backpack')){
            message.channel.send(editEmbed('backpack', lang, prefix));
        }
        else if(rawArg.startsWith('material')){
            message.channel.send(editEmbed('material', lang, prefix));
        }
        else if(!itemSearched){
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
            .setDescription(lang.item[2].replace('{0}', icons.items.weapon).replace('{1}', icons.items.usable).replace('{2}', icons.items.ammo).replace('{3}', icons.items.banner).replace('{4}', icons.items.material).replace('{5}', icons.items.backpack))

            message.channel.send(embedInfo).then(async botMessage => {
                try{
                    await botMessage.react(weaponEmote);
                    await botMessage.react(itemsEmote);
                    await botMessage.react(ammoEmote);
                    await botMessage.react(bannerEmote);
                    await botMessage.react(matsEmote);
                    await botMessage.react(backpackEmote);
                    return botMessage;
                }
                catch(err){
                }
            }).then((collectorMsg) => {
                const collector = collectorMsg.createReactionCollector((reaction, user) => 
                    user.id === message.author.id && reaction.emoji.id === weaponEmote || 
                    user.id === message.author.id && reaction.emoji.id === itemsEmote || 
                    user.id === message.author.id && reaction.emoji.id === ammoEmote || 
                    user.id === message.author.id && reaction.emoji.id === matsEmote || 
                    user.id === message.author.id && reaction.emoji.id === backpackEmote || 
                    user.id === message.author.id && reaction.emoji.id === bannerEmote, {time: 60000});
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
                    else if(reaction.emoji.id == bannerEmote){
                        collectorMsg.edit(editEmbed('banner', lang, prefix));
                        reaction.remove(message.author.id);
                    }
                    else if(reaction.emoji.id == matsEmote){
                        collectorMsg.edit(editEmbed('material', lang, prefix));
                        reaction.remove(message.author.id);
                    }
                    else if(reaction.emoji.id == backpackEmote){
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
    .setTitle('Items List - ' + (type == 'weapon' ? 'Weapons' : type == 'item' ? 'Consumables' : type == 'ammo' ? 'Ammunition' : type == 'banner' ? 'Banners' : type == 'backpack' ? 'Backpacks' : 'Materials'))
    if(commonList.length > 0){
        embedInfo.addField("<:UnboxCommon:526248905676029968> Common","`" + commonList.sort().join("`\n`") + "`", true)
    }
    if(uncommonList.length > 0){
        embedInfo.addField("<:UnboxUncommon:526248928891371520> Uncommon","`" + uncommonList.sort().join("`\n`") + "`", true)
    }
    if(rareList.length > 0){
        embedInfo.addField("<:UnboxRare:526248948579434496> Rare","`" + rareList.sort().join("`\n`") + "`", true)
    }
    if(epicList.length > 0){
        embedInfo.addField("<:UnboxEpic:526248961892155402> Epic","`" + epicList.sort().join("`\n`") + "`", true)
    }
    if(legendList.length > 0){
        embedInfo.addField("<:UnboxLegendary:526248970914234368> Legendary","`" + legendList.sort().join("`\n`") + "`", true)
    }
    if(ultraList.length > 0){
        embedInfo.addField("<:UnboxUltra:526248982691840003> Ultra","`" + ultraList.sort().join("`\n`") + "`", true)
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
    embedInfo.setDescription(lang.item[2].replace('{0}', icons.items.weapon).replace('{1}', icons.items.usable).replace('{2}', icons.items.ammo).replace('{3}', icons.items.banner).replace('{4}', icons.items.material).replace('{5}', icons.items.backpack))
    embedInfo.setFooter(lang.item[1].replace('{0}', prefix))

    return embedInfo
}